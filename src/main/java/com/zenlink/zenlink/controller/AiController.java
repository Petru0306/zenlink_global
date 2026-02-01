package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.AiChatRequest;
import com.zenlink.zenlink.dto.AiChatStreamRequest;
import com.zenlink.zenlink.dto.AiChatHistoryResponse;
import com.zenlink.zenlink.dto.AiConversationCreateRequest;
import com.zenlink.zenlink.dto.AiConversationSummary;
import com.zenlink.zenlink.dto.AiMessage;
import com.zenlink.zenlink.model.AiConversation;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.service.AiConversationService;
import com.zenlink.zenlink.service.OpenAiChatService;
import com.zenlink.zenlink.service.PatientFileRagIndexService;
import com.zenlink.zenlink.service.PatientFileRagQueryService;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AiController {

    private static final Logger log = org.slf4j.LoggerFactory.getLogger(AiController.class);

    // Simple in-memory rate limiter: IP -> request count in current window
    // TODO: Replace with Redis/distributed cache for production
    private static final Map<String, AtomicInteger> rateLimitMap = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 30;
    private static final long RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

    private final OpenAiChatService openAiChatService;
    private final AiConversationService aiConversationService;
    private final PatientFileRagIndexService ragIndexService;
    private final PatientFileRagQueryService ragQueryService;

    public AiController(
            OpenAiChatService openAiChatService,
            AiConversationService aiConversationService,
            @Autowired(required = false) PatientFileRagIndexService ragIndexService,
            @Autowired(required = false) PatientFileRagQueryService ragQueryService
    ) {
        this.openAiChatService = openAiChatService;
        this.aiConversationService = aiConversationService;
        this.ragIndexService = ragIndexService;
        this.ragQueryService = ragQueryService;
    }

    @GetMapping(value = "/conversations", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<AiConversationSummary>> listConversations(
            @RequestParam Long userId,
            @RequestParam String userRole,
            @RequestParam String scopeType,
            @RequestParam(required = false) String scopeId
    ) {
        UserRole role;
        try {
            role = UserRole.valueOf(userRole);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        List<AiConversationSummary> out = aiConversationService.listConversations(userId, role, normScope(scopeType), normScopeId(scopeId)).stream()
                .map(c -> new AiConversationSummary(c.getId(), c.getTitle(), c.getUpdatedAt()))
                .toList();
        return ResponseEntity.ok(out);
    }

    @PostMapping(value = "/conversations", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AiConversationSummary> createConversation(@RequestBody AiConversationCreateRequest request) {
        if (request == null
                || request.getUserId() == null
                || request.getUserRole() == null
                || request.getScopeType() == null) {
            return ResponseEntity.badRequest().build();
        }

        UserRole role;
        try {
            role = UserRole.valueOf(request.getUserRole());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        AiConversation conversation = aiConversationService.createConversation(
                request.getUserId(),
                role,
                normScope(request.getScopeType()),
                normScopeId(request.getScopeId())
        );
        return ResponseEntity.ok(new AiConversationSummary(conversation.getId(), conversation.getTitle(), conversation.getUpdatedAt()));
    }

    @DeleteMapping(value = "/conversations/{conversationId}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable Long conversationId,
            @RequestParam Long userId,
            @RequestParam String userRole,
            @RequestParam String scopeType,
            @RequestParam(required = false) String scopeId
    ) {
        UserRole role;
        try {
            role = UserRole.valueOf(userRole);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        aiConversationService.deleteConversationScoped(conversationId, userId, role, normScope(scopeType), normScopeId(scopeId));
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/conversations/{conversationId}/messages", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AiChatHistoryResponse> getConversationMessages(
            @PathVariable Long conversationId,
            @RequestParam Long userId,
            @RequestParam String userRole,
            @RequestParam String scopeType,
            @RequestParam(required = false) String scopeId
    ) {
        UserRole role;
        try {
            role = UserRole.valueOf(userRole);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        AiConversation c = aiConversationService.requireConversation(conversationId, userId, role, normScope(scopeType), normScopeId(scopeId));
        List<AiMessage> messages = AiConversationService.toDtoMessages(aiConversationService.getMessages(c.getId()));
        return ResponseEntity.ok(new AiChatHistoryResponse(c.getId(), messages));
    }

    /**
     * Streaming chat endpoint that accepts simple messages array (like /chat but streams).
     * Returns text/plain streaming response.
     */
    @PostMapping(value = "/chat/stream-simple", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<StreamingResponseBody> chatStreamSimple(@RequestBody AiChatRequest request,
                                                                 org.springframework.web.context.request.WebRequest webRequest) {
        if (request == null || request.getMessages() == null || request.getMessages().isEmpty()) {
            return ResponseEntity.badRequest().body(out -> {
                out.write("Messages are required".getBytes(StandardCharsets.UTF_8));
                out.flush();
            });
        }

        String clientIp = getClientIp(webRequest);
        if (!checkRateLimit(clientIp)) {
            return ResponseEntity.status(429).body(out -> {
                out.write("Too many requests, try again".getBytes(StandardCharsets.UTF_8));
                out.flush();
            });
        }

        long requestId = System.currentTimeMillis();
        log.info("AI chat stream-simple request {} from IP: {}", requestId, clientIp);

        StreamingResponseBody body = outputStream -> {
            try {
                List<AiMessage> messages = request.getMessages();
                
                // Reject empty prompts
                boolean hasUserMessage = messages.stream()
                        .anyMatch(m -> m != null && "user".equals(m.getRole()) && 
                                m.getContent() != null && !m.getContent().trim().isEmpty());
                if (!hasUserMessage) {
                    outputStream.write("At least one non-empty user message is required".getBytes(StandardCharsets.UTF_8));
                    outputStream.flush();
                    return;
                }
                
                // Limit message count
                if (messages.size() > 20) {
                    messages = messages.subList(messages.size() - 20, messages.size());
                }

                // Stream the response directly (pass triage state if provided)
                String triageState = request.getTriageState();
                openAiChatService.streamChat(messages, null, triageState, outputStream);
                
                long duration = System.currentTimeMillis() - requestId;
                log.info("AI chat stream-simple request {} completed in {} ms", requestId, duration);
            } catch (Exception e) {
                String msg = "Eroare: " + (e.getMessage() != null ? e.getMessage() : e.toString());
                log.error("Error in /api/ai/chat/stream-simple request {} from {}", requestId, clientIp, e);
                try {
                    outputStream.write(msg.getBytes(StandardCharsets.UTF_8));
                    outputStream.flush();
                } catch (Exception ex) {
                    log.error("Error writing error message to stream", ex);
                }
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    /**
     * Non-streaming chat endpoint for preview widget and simple use cases.
     * Returns JSON with text and optional usage info.
     */
    @PostMapping(value = "/chat", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> chat(@RequestBody AiChatRequest request, 
                                    org.springframework.web.context.request.WebRequest webRequest) {
        if (request == null || request.getMessages() == null || request.getMessages().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Messages are required"));
        }

        // Simple rate limiting (per IP)
        String clientIp = getClientIp(webRequest);
        if (!checkRateLimit(clientIp)) {
            return ResponseEntity.status(429).body(Map.of("error", "Too many requests, try again"));
        }

        long requestId = System.currentTimeMillis();
        long startTime = System.currentTimeMillis();
        log.info("AI chat request {} from IP: {}", requestId, clientIp);

        try {
            // Validate messages
            List<AiMessage> messages = request.getMessages();
            
            // Reject empty prompts
            boolean hasUserMessage = messages.stream()
                    .anyMatch(m -> m != null && "user".equals(m.getRole()) && 
                            m.getContent() != null && !m.getContent().trim().isEmpty());
            if (!hasUserMessage) {
                return ResponseEntity.badRequest().body(Map.of("error", "At least one non-empty user message is required"));
            }
            
            // Limit message count
            if (messages.size() > 20) {
                messages = messages.subList(messages.size() - 20, messages.size());
            }

            // Use a ByteArrayOutputStream to capture the response
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            String assistantText = openAiChatService.streamChat(messages, null, baos);
            
            Map<String, Object> response = new HashMap<>();
            response.put("text", assistantText);
            // Usage info could be added here if needed
            
            long duration = System.currentTimeMillis() - startTime;
            log.info("AI chat request {} completed in {} ms", requestId, duration);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to /api/ai/chat from {}: {}", clientIp, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error in /api/ai/chat request {} from {}", requestId, clientIp, e);
            // Return the actual error message so frontend can show it
            String errorMsg = e.getMessage();
            if (errorMsg == null || errorMsg.isEmpty()) {
                errorMsg = "Eroare internă a serverului";
            }
            // Don't expose stack traces, but show the error message
            return ResponseEntity.status(500).body(Map.of("error", errorMsg));
        }
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<StreamingResponseBody> chatStream(@RequestBody AiChatStreamRequest request) {
        if (request == null
                || request.getConversationId() == null
                || request.getUserId() == null
                || request.getUserRole() == null
                || request.getScopeType() == null
                || request.getUserMessage() == null) {
            return ResponseEntity.badRequest().body(out -> {
                out.write("Eroare: cerere invalidă".getBytes(StandardCharsets.UTF_8));
                out.flush();
            });
        }

        StreamingResponseBody body = outputStream -> {
            try {
                long t0 = System.currentTimeMillis();
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
                        , normScope(request.getScopeType()),
                        normScopeId(request.getScopeId())
                );
                aiConversationService.appendMessage(conversation, "user", userText);

                String scopeType = normScope(request.getScopeType());
                String scopeId = normScopeId(request.getScopeId());
                String ragContext = buildRagContextForScope(scopeType, scopeId, userText);

                // Build context from DB (last N turns), then stream the assistant reply.
                List<AiMessage> context = aiConversationService.getMessagesForContext(conversation.getId(), 20);
                String assistant = openAiChatService.streamChat(context, ragContext, outputStream);

                // Persist assistant answer after streaming completes (1 write, not per token).
                aiConversationService.appendMessage(conversation, "assistant", assistant);
                long dt = System.currentTimeMillis() - t0;
                org.slf4j.LoggerFactory.getLogger(AiController.class).info("AI chat scope={} scopeId={} completed in {} ms", scopeType, scopeId, dt);
            } catch (Exception e) {
                String msg = "Eroare: " + (e.getMessage() != null ? e.getMessage() : e.toString());
                outputStream.write(msg.getBytes(StandardCharsets.UTF_8));
                outputStream.flush();
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    // Trigger indexing (RAG features disabled - Ollama removed)
    @PostMapping(value = "/rag/patient/{patientId}/index-all")
    public ResponseEntity<?> indexAllPatientFiles(@PathVariable Long patientId) {
        if (ragIndexService == null) {
            return ResponseEntity.status(503).body(java.util.Map.of("error", "RAG features disabled - Ollama removed"));
        }
        ragIndexService.ensureIndexedPatientAll(patientId);
        return ResponseEntity.ok().body(java.util.Map.of("ok", true));
    }

    @PostMapping(value = "/rag/file/{fileId}/index")
    public ResponseEntity<?> indexFile(@PathVariable UUID fileId) {
        if (ragIndexService == null) {
            return ResponseEntity.status(503).body(java.util.Map.of("error", "RAG features disabled - Ollama removed"));
        }
        ragIndexService.ensureIndexedFile(fileId);
        return ResponseEntity.ok().body(java.util.Map.of("ok", true));
    }

    private String buildRagContextForScope(String scopeType, String scopeId, String question) {
        // RAG features disabled (Ollama removed) - return null for all scopes
        if (ragIndexService == null || ragQueryService == null) {
            return null;
        }
        
        if ("FILE".equalsIgnoreCase(scopeType)) {
            if (scopeId == null) throw new RuntimeException("scopeId is required for FILE scope");
            UUID fileId = UUID.fromString(scopeId);
            ragIndexService.ensureIndexedFile(fileId);
            var hits = ragQueryService.retrieveForFile(fileId, question, 12);
            return PatientFileRagQueryService.buildRagContext(hits);
        }
        if ("PATIENT".equalsIgnoreCase(scopeType)) {
            if (scopeId == null) throw new RuntimeException("scopeId is required for PATIENT scope");
            Long patientId = Long.valueOf(scopeId);
            // your rule: auto-index only top N newest
            ragIndexService.ensureIndexedPatientTopN(patientId, 5);
            var hits = ragQueryService.retrieveForPatient(patientId, question, 16);
            String base = PatientFileRagQueryService.buildRagContext(hits);
            return base + "\nNOTĂ: Pentru pacient, sunt indexate automat doar ultimele 5 fișiere. Dacă lipsesc informații, folosește butonul \"Index all\".\n";
        }
        // GENERAL scope -> no RAG
        return null;
    }

    private static String normScope(String scopeType) {
        String t = scopeType == null ? "GENERAL" : scopeType.trim().toUpperCase();
        return switch (t) {
            case "GENERAL", "PATIENT", "FILE" -> t;
            default -> throw new RuntimeException("Invalid scopeType");
        };
    }

    private static String normScopeId(String scopeId) {
        if (scopeId == null) return null;
        String s = scopeId.trim();
        return s.isEmpty() ? null : s;
    }

    /**
     * Simple rate limiting: check if IP has exceeded request limit.
     * TODO: Replace with Redis/distributed cache for production multi-instance deployments.
     */
    private boolean checkRateLimit(String ip) {
        if (ip == null) return true; // Allow if IP cannot be determined
        
        AtomicInteger count = rateLimitMap.computeIfAbsent(ip, k -> new AtomicInteger(0));
        int current = count.incrementAndGet();
        
        // Reset counter after window (simple approach - in production use sliding window)
        if (current == 1) {
            // First request in window, schedule reset
            new Thread(() -> {
                try {
                    Thread.sleep(RATE_LIMIT_WINDOW_MS);
                    rateLimitMap.remove(ip);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }).start();
        }
        
        return current <= MAX_REQUESTS_PER_MINUTE;
    }

    /**
     * Extract client IP from request.
     */
    private String getClientIp(org.springframework.web.context.request.WebRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteUser(); // Fallback
        }
        return ip != null ? ip : "unknown";
    }
}


