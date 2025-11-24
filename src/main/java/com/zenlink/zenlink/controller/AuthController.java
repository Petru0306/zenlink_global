package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.AuthResponse;
import com.zenlink.zenlink.dto.LoginRequest;
import com.zenlink.zenlink.dto.SignupRequest;
import com.zenlink.zenlink.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        System.out.println("=== AUTH CONTROLLER - SIGNUP ===");
        System.out.println("Received request - Role: " + request.getRole() + ", ReferralCode: " + request.getReferralCode());
        try {
            AuthResponse response = authService.signup(request);
            System.out.println("Signup successful!");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.out.println("Signup failed with error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    // Inner class for error responses
    private static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}

