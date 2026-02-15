package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.ClinicProfileRequest;
import com.zenlink.zenlink.dto.ClinicProfileResponse;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.service.ClinicProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/clinic-profiles")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ClinicProfileController {
    private static final Logger log = LoggerFactory.getLogger(ClinicProfileController.class);
    
    @Autowired
    private ClinicProfileService clinicProfileService;

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                log.warn("Unauthenticated request to get clinic profile");
                return ResponseEntity.status(401)
                    .body(Map.of("error", "Authentication required"));
            }
            log.debug("Getting clinic profile for user {}", user.getId());
            ClinicProfileResponse response = clinicProfileService.getProfile(user);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to get clinic profile: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error getting clinic profile for user {}: {}", 
                user != null ? user.getId() : "unknown", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to load clinic profile: " + e.getMessage()));
        }
    }

    @GetMapping("/clinic/{clinicId}")
    public ResponseEntity<ClinicProfileResponse> getClinicProfile(@PathVariable Long clinicId) {
        try {
            log.debug("Request to get clinic profile - clinicId: {}", clinicId);
            ClinicProfileResponse response = clinicProfileService.getProfileByClinicId(clinicId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to get clinic profile: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting clinic profile for clinic {}", clinicId, e);
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            @RequestBody ClinicProfileRequest request,
            @AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                log.warn("Unauthenticated request to update clinic profile");
                return ResponseEntity.status(401)
                    .body(Map.of("error", "Authentication required"));
            }
            if (request == null) {
                log.warn("Null request body for clinic profile update");
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Request body cannot be null"));
            }
            log.info("Updating clinic profile for user {}", user.getId());
            log.info("Request bannerImageUrl: '{}'", request.getBannerImageUrl());
            log.info("Request name: '{}'", request.getName());
            log.info("Request tagline: '{}'", request.getTagline());
            ClinicProfileResponse response = clinicProfileService.upsertProfile(user, request);
            log.info("Successfully updated clinic profile for user {}", user.getId());
            log.debug("Response bannerImageUrl: {}", response.getBannerImageUrl());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to update clinic profile: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Runtime error updating clinic profile for user {}: {}", 
                user != null ? user.getId() : "unknown", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating clinic profile for user {}: {}", 
                user != null ? user.getId() : "unknown", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }
}
