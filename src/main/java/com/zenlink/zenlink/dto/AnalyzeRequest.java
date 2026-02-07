package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeRequest {
    private String consultationId;
    private StructureRequest.PatientContextDto patientContext;
    private String inputText;
    private String fullTranscript;
    private List<StructureRequest.MessageDto> messages;
    private String lang; // "ro" or "en"
}
