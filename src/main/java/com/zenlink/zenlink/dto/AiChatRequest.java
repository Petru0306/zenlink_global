package com.zenlink.zenlink.dto;

import java.util.List;

public class AiChatRequest {
    private List<AiMessage> messages;

    public AiChatRequest() {}

    public AiChatRequest(List<AiMessage> messages) {
        this.messages = messages;
    }

    public List<AiMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<AiMessage> messages) {
        this.messages = messages;
    }
}


