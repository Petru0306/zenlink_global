package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationMessageRequest {
    private String role; // "doctor" or "assistant"
    private String content;
    private String outputType; // "structure", "analyze", "message" (optional)
}
