package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationEvidenceResponse {
    private String purpose;
    private String mode;
    private String suggestedText;
    private List<ClaimEvidence> claims;
    private List<EvidenceSource> sources;
    private List<GapItem> gaps;
}

