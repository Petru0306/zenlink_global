package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationContextResponse {
    private Long appointmentId;
    private PatientSummary patient;
    private String internalPatientKey;
    private List<TimelineItem> timeline;
    private ConsultationDraftDto existingDraft;
    private List<ConsultationMessageResponse> messages;
    private List<ConsultationSegmentDto> segments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PatientSummary {
        private Long id;
        private String displayName;
        private Integer age;
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineItem {
        private String at;
        private String label;
        private String refId;
    }
}

