package com.zenlink.zenlink.dto;

public class AiConversationStartRequest {
    private Long userId;
    private String userRole; // PATIENT|DOCTOR|CLINIC

    public AiConversationStartRequest() {}

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }
}


