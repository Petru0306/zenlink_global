package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationFinalizeResponse {
    private PatientClaritySheet patientClaritySheet;
    private DoctorSummary doctorSummary;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PatientClaritySheet {
        private String whatWeDiscussed;
        private String whatDoctorFound;
        private List<String> plan;
        private List<String> homeCareInstructions;
        private String whenToSeekUrgentCare;
        private String followUp;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorSummary {
        private String chiefComplaint;
        private String historyOfPresentIllness;
        private String examinationFindings;
        private String assessment;
        private String plan;
        private List<String> clinicalNotes;
    }
}
