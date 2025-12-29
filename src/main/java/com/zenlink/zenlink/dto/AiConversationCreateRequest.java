package com.zenlink.zenlink.dto;

public class AiConversationCreateRequest {
    private Long userId;
    private String userRole; // PATIENT|DOCTOR|CLINIC
    private String scopeType; // GENERAL|PATIENT|FILE
    private String scopeId; // patientId or fileId

    public AiConversationCreateRequest() {}

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

    public String getScopeType() {
        return scopeType;
    }

    public void setScopeType(String scopeType) {
        this.scopeType = scopeType;
    }

    public String getScopeId() {
        return scopeId;
    }

    public void setScopeId(String scopeId) {
        this.scopeId = scopeId;
    }
}


