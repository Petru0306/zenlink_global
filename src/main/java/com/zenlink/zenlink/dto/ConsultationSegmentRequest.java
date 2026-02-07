package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationSegmentRequest {
    private String text;
    private Long startTs; // Timestamp in milliseconds
    private Long endTs; // Timestamp in milliseconds
    private String speaker; // "doctor" or "patient" (optional)
}
