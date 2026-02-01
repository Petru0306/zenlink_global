package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CopilotChatRequest {
    private String userMessage;
    private Map<String, Object> patientContext;
    private List<String> lastSegments;
    private String rollingSummary;
}
