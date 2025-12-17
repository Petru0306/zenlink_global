package com.zenlink.zenlink.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_messages", indexes = {
        @Index(name = "idx_ai_messages_conversation_id", columnList = "conversation_id")
})
public class AiChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AiConversation conversation;

    @Column(nullable = false)
    private String role; // "user" | "assistant"

    @Column(columnDefinition = "text", nullable = false)
    private String content;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public AiChatMessage() {}

    public AiChatMessage(AiConversation conversation, String role, String content) {
        this.conversation = conversation;
        this.role = role;
        this.content = content;
    }

    public Long getId() {
        return id;
    }

    public AiConversation getConversation() {
        return conversation;
    }

    public void setConversation(AiConversation conversation) {
        this.conversation = conversation;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}


