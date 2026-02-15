package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorProfileResponse {
    private Long id;
    private Long userId;
    private String profileImageUrl;
    private String tagline;
    private String about;
    private String specializations;
    private String yearsOfExperience;
    private String clinics;
    private String consultationTypes;
    private String languages;
    private String medicalInterests;
    private String workStyle;
    private String professionalEmail;
    private String clinicPhone;
    private String generalAvailability;
    private Instant updatedAt;
}
