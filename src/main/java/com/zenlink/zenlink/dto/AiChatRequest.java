package com.zenlink.zenlink.dto;

import java.util.List;

public class AiChatRequest {
    private List<AiMessage> messages;
    private String triageState; // "intake", "clarifying", "conclusion"

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

    public String getTriageState() {
        return triageState;
    }

    public void setTriageState(String triageState) {
        this.triageState = triageState;
    }
}


