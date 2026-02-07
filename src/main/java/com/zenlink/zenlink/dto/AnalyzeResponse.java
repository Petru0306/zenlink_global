package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeResponse {
    private String mode = "analyze";
    private String title;
    private String summary;
    private StructureResponse structured; // embed structured content
    private List<InsightDto> insights; // legacy format
    private List<SuggestedQuestionDto> suggestedQuestions;
    private List<CitationDto> citations;
    private String safetyNote;
    
    // New ZenLink Insights format fields
    private List<String> aspectsToConsider;
    private List<String> usefulClarificationQuestions;
    private List<String> possibleGeneralExplanations;
    private List<String> observedRiskFactors;
    private List<String> informativeReferences;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InsightDto {
        private String heading; // "Clarifying questions", "Possible factors (informational)", "Gaps", "Next steps for documentation"
        private List<String> bullets;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestedQuestionDto {
        private String question;
        private List<String> options; // quick-select chips
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CitationDto {
        private String label; // e.g. "ADA guideline on dental trauma"
        private String url;
        private String note; // 1-liner why relevant
    }
}
