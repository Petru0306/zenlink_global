package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationAnalyzeRequest {
    private List<Long> segmentIds; // Optional: specific segments to analyze. If null/empty, uses last segment
}
