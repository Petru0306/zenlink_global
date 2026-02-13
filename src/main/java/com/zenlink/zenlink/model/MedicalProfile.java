package com.zenlink.zenlink.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.Instant;

@Entity
@Table(name = "medical_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"user"})
@ToString(exclude = {"user"})
public class MedicalProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 10)
    private String bloodType;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Column(columnDefinition = "TEXT")
    private String chronicConditions;

    @Column(columnDefinition = "TEXT")
    private String medications;

    @Column(length = 100)
    private String insuranceNumber;

    @Column(length = 20)
    private String weightKg;

    @Column(length = 20)
    private String weightChange;

    @Column(length = 50)
    private String weightDate;

    @Column(length = 20)
    private String heightCm;

    @Column(length = 20)
    private String glucose;

    @Column(length = 50)
    private String glucoseDate;

    @Column(length = 20)
    private String bloodPressure;

    @Column(length = 50)
    private String bpDate;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        } else {
            updatedAt = Instant.now();
        }
    }
}
