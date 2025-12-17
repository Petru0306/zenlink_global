package com.zenlink.zenlink.dto;

import java.util.List;

public class AiChatHistoryResponse {
    private Long conversationId;
    private List<AiMessage> messages;

    public AiChatHistoryResponse() {}

    public AiChatHistoryResponse(Long conversationId, List<AiMessage> messages) {
        this.conversationId = conversationId;
        this.messages = messages;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public List<AiMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<AiMessage> messages) {
        this.messages = messages;
    }
}


