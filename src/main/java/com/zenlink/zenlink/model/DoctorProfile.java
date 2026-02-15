package com.zenlink.zenlink.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "doctor_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Profile Image
    @Column(length = 500)
    private String profileImageUrl;

    // Identity Section
    @Column(length = 200)
    private String tagline; // Short description/tagline

    @Column(columnDefinition = "TEXT")
    private String about; // Free text about the doctor

    // Professional Data
    @Column(length = 500)
    private String specializations; // Comma-separated or JSON

    @Column(length = 50)
    private String yearsOfExperience;

    @Column(columnDefinition = "TEXT")
    private String clinics; // Clinics where they work

    @Column(columnDefinition = "TEXT")
    private String consultationTypes; // Types of consultations offered

    @Column(length = 200)
    private String languages; // Languages spoken

    @Column(columnDefinition = "TEXT")
    private String medicalInterests; // Areas of medical interest

    // Work Style
    @Column(columnDefinition = "TEXT")
    private String workStyle; // Work style description or JSON for checkboxes

    // Contact Information
    @Column(length = 200)
    private String professionalEmail;

    @Column(length = 50)
    private String clinicPhone;

    @Column(length = 200)
    private String generalAvailability;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
