package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.MedicalProfileRequest;
import com.zenlink.zenlink.dto.MedicalProfileResponse;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.repository.AppointmentRepository;
import com.zenlink.zenlink.service.MedicalProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/medical-profiles")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class MedicalProfileController {
    private static final Logger log = LoggerFactory.getLogger(MedicalProfileController.class);
    @Autowired
    private MedicalProfileService medicalProfileService;
    
    @Autowired
    private AppointmentRepository appointmentRepository;

    @GetMapping("/me")
    public ResponseEntity<MedicalProfileResponse> getMyProfile(@AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                log.warn("Unauthenticated request to get medical profile");
                return ResponseEntity.status(401).build();
            }
            MedicalProfileResponse response = medicalProfileService.getProfile(user);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to get medical profile: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting medical profile for user {}", user != null ? user.getId() : "unknown", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<MedicalProfileResponse> getPatientProfile(
            @PathVariable Long patientId,
            @AuthenticationPrincipal User user) {
        try {
            log.debug("Request to get patient medical profile - patientId: {}, user: {}", patientId, user != null ? user.getId() : "null");
            
            if (user == null) {
                log.warn("Unauthenticated request to get patient medical profile for patient {}", patientId);
                return ResponseEntity.status(401).build();
            }
            
            log.debug("Authenticated user {} (role: {}) requesting profile for patient {}", user.getId(), user.getRole(), patientId);
            
            // Allow patients to access their own profile, or doctors to access any patient profile
            // Also allow users who have an appointment with the patient (doctor or patient themselves)
            boolean isPatient = user.getId().equals(patientId);
            boolean isDoctor = user.getRole() == com.zenlink.zenlink.model.UserRole.DOCTOR;
            boolean hasAppointment = appointmentRepository.findByPatientId(patientId).stream()
                .anyMatch(apt -> apt.getDoctorId().equals(user.getId()) || apt.getPatientId().equals(user.getId()));
            
            if (isPatient || isDoctor || hasAppointment) {
                MedicalProfileResponse response = medicalProfileService.getProfileByPatientId(patientId);
                log.debug("Returning medical profile for patient {}: hasData={}", patientId, response.getId() != null);
                return ResponseEntity.ok(response);
            }
            
            log.warn("User {} (role: {}) attempted to access medical profile for patient {} - no access", user.getId(), user.getRole(), patientId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to get patient medical profile: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting patient medical profile for patient {}", patientId, e);
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/me")
    public ResponseEntity<MedicalProfileResponse> updateMyProfile(
            @RequestBody MedicalProfileRequest request,
            @AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                log.warn("Unauthenticated request to update medical profile");
                return ResponseEntity.status(401).build();
            }
            if (request == null) {
                log.warn("Null request body for medical profile update");
                return ResponseEntity.badRequest().build();
            }
            log.debug("Updating medical profile for user {}", user.getId());
            MedicalProfileResponse response = medicalProfileService.upsertProfile(user, request);
            log.info("Successfully updated medical profile for user {}", user.getId());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to update medical profile: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Runtime error updating medical profile for user {}: {}", user != null ? user.getId() : "unknown", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        } catch (Exception e) {
            log.error("Unexpected error updating medical profile for user {}: {}", user != null ? user.getId() : "unknown", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
}
