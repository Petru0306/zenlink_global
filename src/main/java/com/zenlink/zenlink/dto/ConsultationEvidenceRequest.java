package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationEvidenceRequest {
    private String purpose; // "verify" | "suggest"
    private String mode; // "quick" | "deep"
    private String query;
    private String transcript;
    private String section;
    private String currentText;
    private String sheetText;
}

