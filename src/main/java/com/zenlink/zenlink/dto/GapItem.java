package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GapItem {
    private String sectionKey;
    private String title;
    private String detail;
    private String severity; // "low" | "medium" | "high"
    private List<EvidenceSource> sources;
}

