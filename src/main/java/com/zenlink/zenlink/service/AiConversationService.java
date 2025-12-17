package com.zenlink.zenlink.service;

import com.zenlink.zenlink.dto.AiMessage;
import com.zenlink.zenlink.model.AiChatMessage;
import com.zenlink.zenlink.model.AiConversation;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.repository.AiChatMessageRepository;
import com.zenlink.zenlink.repository.AiConversationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AiConversationService {

    private final AiConversationRepository conversationRepository;
    private final AiChatMessageRepository messageRepository;

    public AiConversationService(
            AiConversationRepository conversationRepository,
            AiChatMessageRepository messageRepository
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    @Transactional
    public AiConversation createConversation(Long userId, UserRole userRole, String scopeType, String scopeId) {
        AiConversation c = new AiConversation();
        c.setUserId(userId);
        c.setUserRole(userRole);
        c.setTitle(null);
        c.setScopeType(scopeType);
        c.setScopeId(scopeId);
        return conversationRepository.save(c);
    }

    @Transactional(readOnly = true)
    public List<AiConversation> listConversations(Long userId, UserRole userRole, String scopeType, String scopeId) {
        return conversationRepository.findByUserIdAndUserRoleAndScopeTypeAndScopeIdOrderByUpdatedAtDesc(userId, userRole, scopeType, scopeId);
    }

    @Transactional(readOnly = true)
    public List<AiChatMessage> getMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByIdAsc(conversationId);
    }

    @Transactional(readOnly = true)
    public AiConversation requireConversation(Long conversationId, Long userId, UserRole userRole, String scopeType, String scopeId) {
        return conversationRepository.findByIdAndUserIdAndUserRoleAndScopeTypeAndScopeId(conversationId, userId, userRole, scopeType, scopeId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
    }

    @Transactional
    public void appendMessage(AiConversation conversation, String role, String content) {
        messageRepository.save(new AiChatMessage(conversation, role, content));
        conversation.setUpdatedAt(LocalDateTime.now());

        // Auto-title from the first user message
        if (conversation.getTitle() == null && "user".equalsIgnoreCase(role)) {
            String t = content == null ? "" : content.trim();
            if (!t.isEmpty()) {
                int max = Math.min(60, t.length());
                conversation.setTitle(t.substring(0, max));
            }
        }

        conversationRepository.save(conversation);
    }

    @Transactional(readOnly = true)
    public List<com.zenlink.zenlink.dto.AiMessage> getMessagesForContext(Long conversationId, int maxMessages) {
        List<AiChatMessage> all = messageRepository.findByConversationIdOrderByIdAsc(conversationId);
        int from = Math.max(0, all.size() - Math.max(1, maxMessages));
        return toDtoMessages(all.subList(from, all.size()));
    }

    @Transactional
    public void deleteConversation(Long conversationId, Long userId, UserRole userRole) {
        // Delete is now scoped; callers should pass correct scope.
        throw new UnsupportedOperationException("Use deleteConversationScoped");
    }

    @Transactional
    public void deleteConversationScoped(Long conversationId, Long userId, UserRole userRole, String scopeType, String scopeId) {
        AiConversation c = requireConversation(conversationId, userId, userRole, scopeType, scopeId);
        conversationRepository.delete(c);
    }

    public static List<AiMessage> toDtoMessages(List<AiChatMessage> rows) {
        return rows.stream()
                .map(r -> new AiMessage(r.getRole(), r.getContent()))
                .toList();
    }
}


