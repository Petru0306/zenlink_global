package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationStructureResponse {
    private String type = "structured_notes";
    private Instant generatedAt;
    private StructuredContent content;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StructuredContent {
        private String chief_complaint;
        private List<String> history;
        private List<String> symptoms;
        private List<String> meds_allergies;
        private List<String> exam_observations;
        private List<String> patient_words; // Short quotes or paraphrase
        private List<String> timeline;
    }
}
