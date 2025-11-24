package com.zenlink.zenlink.dto;

import com.zenlink.zenlink.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private UserRole role;
    private String token; // For future JWT implementation
}

