package com.zenlink.zenlink.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String firstName;
    private String lastName;
    private String phone;
    // Add more fields as needed (specialization, bio, etc.)
}

