package com.zenlink.zenlink.dto;

import com.zenlink.zenlink.model.UserRole;
import lombok.Data;

@Data
public class SignupRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phone;
    private UserRole role;
    private String referralCode; // Required for DOCTOR and CLINIC roles
}

