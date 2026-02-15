package com.zenlink.zenlink.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "clinic_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClinicProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Profile Image
    @Column(length = 500)
    private String profileImageUrl;

    // Banner Image
    @Column(length = 500)
    private String bannerImageUrl;

    // Identity Section
    @Column(length = 200)
    private String name; // Clinic name

    @Column(length = 200)
    private String tagline; // Short description/tagline

    @Column(columnDefinition = "TEXT")
    private String about; // Free text about the clinic

    // Contact Information
    @Column(columnDefinition = "TEXT")
    private String address; // Full address

    @Column(length = 50)
    private String phone;

    @Column(length = 200)
    private String email;

    @Column(length = 500)
    private String website;

    // Services & Information
    @Column(length = 500)
    private String specialties; // Comma-separated specialties

    @Column(length = 200)
    private String openHours; // Opening hours

    @Column(columnDefinition = "TEXT")
    private String description; // Detailed description

    @Column(columnDefinition = "TEXT")
    private String facilities; // Facilities offered

    @Column(length = 500)
    private String insuranceAccepted; // Insurance types accepted

    @Column(length = 200)
    private String languages; // Languages spoken

    // Gallery Images
    @Column(columnDefinition = "TEXT")
    private String galleryImages; // JSON array of image URLs

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
