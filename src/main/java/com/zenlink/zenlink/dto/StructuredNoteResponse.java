package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * StructuredNote response matching the exact schema required by frontend
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StructuredNoteResponse {
    private String requestId;
    private StructuredNote structuredNote;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StructuredNote {
        private String title;
        private String language; // "ro" or "en"
        private String chiefComplaint;
        private List<String> symptoms;
        private List<String> timeline;
        private List<String> triggers;
        private List<String> riskFactors;
        private List<String> dentalHistory;
        private List<String> meds;
        private List<String> allergies;
        private List<String> observations;
        private List<String> missingInfo;
        private String disclaimer;
    }
}
