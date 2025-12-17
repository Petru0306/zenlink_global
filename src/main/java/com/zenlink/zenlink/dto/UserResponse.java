package com.zenlink.zenlink.dto;

import com.zenlink.zenlink.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private Integer age;
    private UserRole role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructor from User entity (excludes password)
    public UserResponse(com.zenlink.zenlink.model.User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.phone = user.getPhone();
        this.age = user.getAge();
        this.role = user.getRole();
        this.createdAt = user.getCreatedAt();
        this.updatedAt = user.getUpdatedAt();
    }
}

