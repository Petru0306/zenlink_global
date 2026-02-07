package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StructureResponse {
    private String mode = "structure";
    private String title;
    private String summary; // 2-3 lines
    private List<SectionDto> sections;
    private List<TimelineItemDto> timeline;
    private List<String> missingInfo;
    private String safetyNote;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectionDto {
        private String heading; // e.g. "Chief complaint", "History", "Symptoms", "Allergies"
        private List<String> bullets;
        private List<String> tags; // highlighted chips
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineItemDto {
        private String when;
        private String what;
    }
}
