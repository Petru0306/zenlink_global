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
public class ConsultationAnalyzeResponse {
    private String type = "zenlink_analyze";
    private Instant generatedAt;
    private ConsultationStructureResponse.StructuredContent structured;
    private List<Clarification> clarifications;
    private List<DocumentationGap> documentation_gaps;
    private List<String> suggested_questions;
    private List<Source> sources;
    private String tone = "documentation_assistant";

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Clarification {
        private String title;
        private List<String> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentationGap {
        private String label;
        private List<String> items;
        private String severity; // "low" or "med"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Source {
        private String title;
        private String publisher;
        private String year;
        private String url;
    }
}
