package com.zenlink.zenlink.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "psych_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PsychProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String answersJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Temperament temperament;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnxietyLevel anxietyLevel;

    @Column(nullable = false)
    private int anxietyScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ControlNeed controlNeed;

    @Column(nullable = false)
    private int controlScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommunicationStyle communicationStyle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProcedurePreference procedurePreference;

    @Column(columnDefinition = "TEXT")
    private String triggersJson;

    @Column(length = 500)
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String resultsSheet;

    @Column(nullable = false)
    private Instant completedAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (completedAt == null) {
            completedAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}

