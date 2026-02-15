package com.zenlink.zenlink.dto;

import lombok.Data;

@Data
public class DoctorProfileRequest {
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
}
