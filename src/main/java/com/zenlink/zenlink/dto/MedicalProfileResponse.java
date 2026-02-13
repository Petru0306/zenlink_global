package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicalProfileResponse {
    private Long id;
    private Long userId;
    private String bloodType;
    private String allergies;
    private String chronicConditions;
    private String medications;
    private String insuranceNumber;
    private String weightKg;
    private String weightChange;
    private String weightDate;
    private String heightCm;
    private String glucose;
    private String glucoseDate;
    private String bloodPressure;
    private String bpDate;
    private Instant updatedAt;
}
