package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationDraftDto {
    private String notes;
    private List<String> tags;
    private List<String> findings;
    private List<String> attachments;
    private String plan;
}

