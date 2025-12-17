package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.AiChatStreamRequest;
import com.zenlink.zenlink.dto.AiChatHistoryResponse;
import com.zenlink.zenlink.dto.AiConversationCreateRequest;
import com.zenlink.zenlink.dto.AiConversationSummary;
import com.zenlink.zenlink.dto.AiMessage;
import com.zenlink.zenlink.model.AiConversation;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.service.AiConversationService;
import com.zenlink.zenlink.service.OllamaChatService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AiController {

    private final OllamaChatService ollamaChatService;
    private final AiConversationService aiConversationService;

    public AiController(OllamaChatService ollamaChatService, AiConversationService aiConversationService) {
        this.ollamaChatService = ollamaChatService;
        this.aiConversationService = aiConversationService;
    }

    @GetMapping(value = "/conversations", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<AiConversationSummary>> listConversations(
            @RequestParam Long userId,
            @RequestParam String userRole
    ) {
        UserRole role;
        try {
            role = UserRole.valueOf(userRole);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        List<AiConversationSummary> out = aiConversationService.listConversations(userId, role).stream()
                .map(c -> new AiConversationSummary(c.getId(), c.getTitle(), c.getUpdatedAt()))
                .toList();
        return ResponseEntity.ok(out);
    }

    @PostMapping(value = "/conversations", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AiConversationSummary> createConversation(@RequestBody AiConversationCreateRequest request) {
        if (request == null || request.getUserId() == null || request.getUserRole() == null) {
            return ResponseEntity.badRequest().build();
        }

        UserRole role;
        try {
            role = UserRole.valueOf(request.getUserRole());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        AiConversation conversation = aiConversationService.createConversation(request.getUserId(), role);
        return ResponseEntity.ok(new AiConversationSummary(conversation.getId(), conversation.getTitle(), conversation.getUpdatedAt()));
    }

    @DeleteMapping(value = "/conversations/{conversationId}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable Long conversationId,
            @RequestParam Long userId,
            @RequestParam String userRole
    ) {
        UserRole role;
        try {
            role = UserRole.valueOf(userRole);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        aiConversationService.deleteConversation(conversationId, userId, role);
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/conversations/{conversationId}/messages", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AiChatHistoryResponse> getConversationMessages(
            @PathVariable Long conversationId,
            @RequestParam Long userId,
            @RequestParam String userRole
    ) {
        UserRole role;
        try {
            role = UserRole.valueOf(userRole);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        AiConversation c = aiConversationService.requireConversation(conversationId, userId, role);
        List<AiMessage> messages = AiConversationService.toDtoMessages(aiConversationService.getMessages(c.getId()));
        return ResponseEntity.ok(new AiChatHistoryResponse(c.getId(), messages));
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<StreamingResponseBody> chatStream(@RequestBody AiChatStreamRequest request) {
        if (request == null
                || request.getConversationId() == null
                || request.getUserId() == null
                || request.getUserRole() == null
                || request.getUserMessage() == null) {
            return ResponseEntity.badRequest().body(out -> {
                out.write("Eroare: cerere invalidă".getBytes(StandardCharsets.UTF_8));
                out.flush();
            });
        }

        StreamingResponseBody body = outputStream -> {
            try {
                String userText = request.getUserMessage().trim();
                if (userText.isEmpty()) {
                    outputStream.write("Te rog scrie o întrebare.".getBytes(StandardCharsets.UTF_8));
                    outputStream.flush();
                    return;
                }

                UserRole role = UserRole.valueOf(request.getUserRole());
                AiConversation conversation = aiConversationService.requireConversation(
                        request.getConversationId(),
                        request.getUserId(),
                        role
                );
                aiConversationService.appendMessage(conversation, "user", userText);

                // Build context from DB (last N turns), then stream the assistant reply.
                List<AiMessage> context = aiConversationService.getMessagesForContext(conversation.getId(), 20);
                String assistant = ollamaChatService.streamChat(context, outputStream);

                // Persist assistant answer after streaming completes (1 write, not per token).
                aiConversationService.appendMessage(conversation, "assistant", assistant);
            } catch (Exception e) {
                String msg = "Eroare: " + (e.getMessage() != null ? e.getMessage() : "necunoscută");
                outputStream.write(msg.getBytes(StandardCharsets.UTF_8));
                outputStream.flush();
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .cacheControl(CacheControl.noStore())
                .body(body);
    }
}


