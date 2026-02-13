package com.zenlink.zenlink.service;

import com.zenlink.zenlink.dto.MedicalProfileRequest;
import com.zenlink.zenlink.dto.MedicalProfileResponse;
import com.zenlink.zenlink.model.MedicalProfile;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.repository.MedicalProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

@Service
public class MedicalProfileService {
    private static final Logger log = LoggerFactory.getLogger(MedicalProfileService.class);
    
    @Autowired
    private MedicalProfileRepository medicalProfileRepository;

    public MedicalProfileResponse getProfile(User user) {
        ensurePatient(user);
        Optional<MedicalProfile> profileOpt = medicalProfileRepository.findByUser(user);
        if (profileOpt.isEmpty()) {
            return new MedicalProfileResponse(null, user.getId(), null, null, null, null, null, null, null, null, null, null, null, null, null, null);
        }
        MedicalProfile profile = profileOpt.get();
        return toResponse(profile);
    }

    /**
     * Get medical profile for a specific patient by patient ID.
     * This method allows doctors to access patient medical profiles.
     */
    public MedicalProfileResponse getProfileByPatientId(Long patientId) {
        if (patientId == null) {
            throw new IllegalArgumentException("Patient ID cannot be null");
        }
        log.debug("Fetching medical profile for patient ID: {}", patientId);
        Optional<MedicalProfile> profileOpt = medicalProfileRepository.findByUserId(patientId);
        if (profileOpt.isEmpty()) {
            log.info("No medical profile found for patient ID: {}", patientId);
            return new MedicalProfileResponse(null, patientId, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
        }
        MedicalProfile profile = profileOpt.get();
        log.info("Found medical profile for patient ID: {} (profile ID: {})", patientId, profile.getId());
        return toResponse(profile);
    }

    public MedicalProfileResponse upsertProfile(User user, MedicalProfileRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Medical profile request cannot be null");
        }
        ensurePatient(user);
        
        try {
            Optional<MedicalProfile> existingOpt = medicalProfileRepository.findByUser(user);
            MedicalProfile profile;
            
            if (existingOpt.isPresent()) {
                profile = existingOpt.get();
                log.debug("Updating existing medical profile for user {}", user.getId());
            } else {
                profile = new MedicalProfile();
                profile.setUpdatedAt(java.time.Instant.now());
                log.debug("Creating new medical profile for user {}", user.getId());
            }
            
            profile.setUser(user);
            profile.setBloodType(request.getBloodType());
            profile.setAllergies(request.getAllergies());
            profile.setChronicConditions(request.getChronicConditions());
            profile.setMedications(request.getMedications());
            profile.setInsuranceNumber(request.getInsuranceNumber());
            profile.setWeightKg(request.getWeightKg());
            profile.setWeightChange(request.getWeightChange());
            profile.setWeightDate(request.getWeightDate());
            profile.setHeightCm(request.getHeightCm());
            profile.setGlucose(request.getGlucose());
            profile.setGlucoseDate(request.getGlucoseDate());
            profile.setBloodPressure(request.getBloodPressure());
            profile.setBpDate(request.getBpDate());

            MedicalProfile saved = medicalProfileRepository.save(profile);
            log.info("Successfully saved medical profile for user {}", user.getId());
            return toResponse(saved);
        } catch (Exception e) {
            log.error("Error saving medical profile for user {}: {}", user.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to save medical profile: " + e.getMessage(), e);
        }
    }

    private MedicalProfileResponse toResponse(MedicalProfile profile) {
        return new MedicalProfileResponse(
            profile.getId(),
            profile.getUser().getId(),
            profile.getBloodType(),
            profile.getAllergies(),
            profile.getChronicConditions(),
            profile.getMedications(),
            profile.getInsuranceNumber(),
            profile.getWeightKg(),
            profile.getWeightChange(),
            profile.getWeightDate(),
            profile.getHeightCm(),
            profile.getGlucose(),
            profile.getGlucoseDate(),
            profile.getBloodPressure(),
            profile.getBpDate(),
            profile.getUpdatedAt()
        );
    }

    private void ensurePatient(User user) {
        if (user == null || user.getRole() != UserRole.PATIENT) {
            throw new IllegalArgumentException("Only patients can have medical profiles");
        }
    }
}
