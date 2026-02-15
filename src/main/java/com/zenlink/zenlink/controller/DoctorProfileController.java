package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.DoctorProfileRequest;
import com.zenlink.zenlink.dto.DoctorProfileResponse;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.service.DoctorProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/doctor-profiles")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class DoctorProfileController {
    private static final Logger log = LoggerFactory.getLogger(DoctorProfileController.class);
    
    @Autowired
    private DoctorProfileService doctorProfileService;

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                log.warn("Unauthenticated request to get doctor profile");
                return ResponseEntity.status(401)
                    .body(Map.of("error", "Authentication required"));
            }
            log.debug("Getting doctor profile for user {}", user.getId());
            DoctorProfileResponse response = doctorProfileService.getProfile(user);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to get doctor profile: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error getting doctor profile for user {}: {}", 
                user != null ? user.getId() : "unknown", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to load doctor profile: " + e.getMessage()));
        }
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<DoctorProfileResponse> getDoctorProfile(@PathVariable Long doctorId) {
        try {
            log.debug("Request to get doctor profile - doctorId: {}", doctorId);
            DoctorProfileResponse response = doctorProfileService.getProfileByDoctorId(doctorId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to get doctor profile: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting doctor profile for doctor {}", doctorId, e);
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            @RequestBody DoctorProfileRequest request,
            @AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                log.warn("Unauthenticated request to update doctor profile");
                return ResponseEntity.status(401)
                    .body(Map.of("error", "Authentication required"));
            }
            if (request == null) {
                log.warn("Null request body for doctor profile update");
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Request body cannot be null"));
            }
            log.debug("Updating doctor profile for user {}", user.getId());
            DoctorProfileResponse response = doctorProfileService.upsertProfile(user, request);
            log.info("Successfully updated doctor profile for user {}", user.getId());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to update doctor profile: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Runtime error updating doctor profile for user {}: {}", 
                user != null ? user.getId() : "unknown", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating doctor profile for user {}: {}", 
                user != null ? user.getId() : "unknown", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }
}
