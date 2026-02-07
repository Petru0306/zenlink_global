package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvidenceSource {
    private String title;
    private String url;
    private String snippet;
    private String publisher;
    private String year;
}

