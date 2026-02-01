package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationSegmentAnalyzeRequest {
    private Map<String, Object> patientContext;
    private List<String> lastSegments; // Last N segments (N=3)
    private String lastSegment; // Current segment to analyze
    private String rollingSummary; // Short summary of full transcript
}
