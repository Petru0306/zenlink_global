package com.zenlink.zenlink.dto;

import lombok.Data;

@Data
public class ClinicProfileRequest {
    private String profileImageUrl;
    private String bannerImageUrl;
    private String name;
    private String tagline;
    private String about;
    private String address;
    private String phone;
    private String email;
    private String website;
    private String specialties;
    private String openHours;
    private String description;
    private String facilities;
    private String insuranceAccepted;
    private String languages;
    private String galleryImages; // JSON array of image URLs
}
