package com.zenlink.zenlink.model;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "patient_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientFile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private Long size;

    @Column(nullable = false)
    private Long sortRank;

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    // IMPORTANT: In Postgres, @Lob(byte[]) maps to OID by default in Hibernate,
    // which conflicts with a bytea column. Force binary binding.
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] content;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
        if (sortRank == null) {
            sortRank = System.currentTimeMillis();
        }
    }
}


