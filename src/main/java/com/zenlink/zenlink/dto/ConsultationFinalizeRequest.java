package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationFinalizeRequest {
    private Map<String, Object> patientContext;
    private String fullTranscript;
    private List<TranscriptSegment> segments;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TranscriptSegment {
        private String id;
        private String startedAt;
        private String endedAt;
        private String text;
    }
}
