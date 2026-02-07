package com.zenlink.zenlink.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "consultation_segments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationSegment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "consultation_id", nullable = false)
    private Long consultationId; // References appointment ID

    @Column(name = "start_ts", nullable = false)
    private Long startTs; // Timestamp in milliseconds

    @Column(name = "end_ts")
    private Long endTs; // Timestamp in milliseconds

    @Column(name = "speaker")
    private String speaker; // "doctor" or "patient" (optional)

    @Column(name = "text", columnDefinition = "TEXT", nullable = false)
    private String text;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
