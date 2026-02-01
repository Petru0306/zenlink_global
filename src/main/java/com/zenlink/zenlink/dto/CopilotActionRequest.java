package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CopilotActionRequest {
    private String actionId;
    private Map<String, Object> patientContext;
    private List<String> lastSegments;
    private String rollingSummary;
}
