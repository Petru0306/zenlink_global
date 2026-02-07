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
        // NEW SIMPLE FORMAT - 6 sections for patient
        // Section 1: Ce s-a întâmplat azi
        private String whatHappenedToday; // problemă/disconfort descris
        private List<String> todayActions; // am vorbit, am verificat, am strâns informații
        
        // Section 2: Ce înseamnă asta pentru tine
        private List<String> whatThisMeans; // situația evaluată, informații clare, etc.
        
        // Section 3: Ce urmează
        private List<String> nextSteps; // pași simpli
        private String nextAppointment; // data următoarei întâlniri (dacă este stabilită)
        
        // Section 4: La ce să fii atent
        private List<String> whatToWatchFor; // schimbări, senzații noi, etc.
        
        // Section 5: Verificare rapidă (pentru tine)
        private List<String> quickCheckQuestions; // întrebări pentru pacient
        
        // Section 6: Un lucru important
        private List<String> importantNote; // documentul te ajută, medicul te ghidează
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorSummary {
        // OLD FORMAT - 9 sections moved here for doctor
        // Section 1: Date generale caz
        private String consultationDate;
        private String clinician;
        private String specialty;
        private String presentationType;
        
        // Section 2: Motivul prezentării
        private String chiefComplaint;
        
        // Section 3: Anamneză relevantă
        private List<String> generalMedicalHistory;
        private List<String> dentalHistory;
        
        // Section 4: Observații clinice
        private List<String> generalObservations;
        private List<String> specialtySpecificObservations;
        
        // Section 5: Date suplimentare & materiale
        private List<String> availableInvestigations;
        private List<String> clinicalPhotos;
        private List<String> otherDocuments;
        
        // Section 6: Notă clinică – clinician (uman)
        private String clinicianNote;
        
        // Section 7: Acțiuni realizate în cadrul consultației
        private List<String> actionsPerformed;
        
        // Section 8: Claritate & proveniența informației
        private List<String> informationSources;
        
        // Section 9: Control export către pacient
        private Boolean includeChiefComplaint;
        private Boolean includeObservationsSummary;
        private Boolean includeActionsPerformed;
        private Boolean includeNextSteps;
        private Boolean excludeClinicianNote;
        private Boolean excludeSensitiveObservations;
    }
}
