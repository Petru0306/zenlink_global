package com.zenlink.zenlink.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "finalized_consultations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinalizedConsultation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "appointment_id", nullable = false, unique = true)
    private Long appointmentId;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "patient_clarity_sheet", columnDefinition = "TEXT")
    private String patientClaritySheet; // JSON string

    @Column(name = "doctor_summary", columnDefinition = "TEXT")
    private String doctorSummary; // JSON string

    @Column(name = "chief_complaint", columnDefinition = "TEXT")
    private String chiefComplaint; // Quick summary for list view

    @Column(name = "consultation_date", nullable = false)
    private Instant consultationDate;

    @Column(name = "finalized_at", nullable = false, updatable = false)
    private Instant finalizedAt;

    @PrePersist
    protected void onCreate() {
        finalizedAt = Instant.now();
    }
}
