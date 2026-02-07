package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StructureRequest {
    private String consultationId;
    private PatientContextDto patientContext;
    private String inputText;
    private String fullTranscript;
    private List<MessageDto> messages;
    private String lang; // "ro" or "en"

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PatientContextDto {
        private String name;
        private Integer age;
        private String reason;
        private String id;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageDto {
        private String role; // "doctor", "assistant", "system"
        private String content;
    }
}
