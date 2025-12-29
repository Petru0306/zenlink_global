package com.zenlink.zenlink.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "clinic_doctors",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_clinic_doctor", columnNames = {"clinic_id", "doctor_id"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClinicDoctor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinic_id", nullable = false)
    private Long clinicId;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;
}


