package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClaimEvidence {
    private String claim;
    private String coverage; // "good" | "partial" | "insufficient"
    private List<EvidenceSource> sources;
}

