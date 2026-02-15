package com.zenlink.zenlink.service;

import com.zenlink.zenlink.dto.DoctorProfileRequest;
import com.zenlink.zenlink.dto.DoctorProfileResponse;
import com.zenlink.zenlink.model.DoctorProfile;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.repository.DoctorProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

@Service
public class DoctorProfileService {
    private static final Logger log = LoggerFactory.getLogger(DoctorProfileService.class);
    
    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Transactional(readOnly = true)
    public DoctorProfileResponse getProfile(User user) {
        ensureDoctor(user);
        try {
            Optional<DoctorProfile> profileOpt = doctorProfileRepository.findByUser(user);
            if (profileOpt.isEmpty()) {
                log.debug("No profile found for user {}, returning empty profile", user.getId());
                return new DoctorProfileResponse(
                    null, user.getId(), null, null, null, null, null, null, 
                    null, null, null, null, null, null, null, null
                );
            }
            DoctorProfile profile = profileOpt.get();
            log.debug("Found profile for user {}, converting to response", user.getId());
            return toResponse(profile);
        } catch (Exception e) {
            log.error("Error getting profile for user {}: {}", user.getId(), e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public DoctorProfileResponse getProfileByDoctorId(Long doctorId) {
        if (doctorId == null) {
            throw new IllegalArgumentException("Doctor ID cannot be null");
        }
        log.debug("Fetching doctor profile for doctor ID: {}", doctorId);
        Optional<DoctorProfile> profileOpt = doctorProfileRepository.findByUserId(doctorId);
        if (profileOpt.isEmpty()) {
            log.info("No doctor profile found for doctor ID: {}", doctorId);
            return new DoctorProfileResponse(
                null, doctorId, null, null, null, null, null, null, 
                null, null, null, null, null, null, null, null
            );
        }
        DoctorProfile profile = profileOpt.get();
        log.info("Found doctor profile for doctor ID: {} (profile ID: {})", doctorId, profile.getId());
        return toResponse(profile);
    }

    @Transactional
    public DoctorProfileResponse upsertProfile(User user, DoctorProfileRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Doctor profile request cannot be null");
        }
        ensureDoctor(user);
        
        try {
            Optional<DoctorProfile> existingOpt = doctorProfileRepository.findByUser(user);
            DoctorProfile profile;
            
            if (existingOpt.isPresent()) {
                profile = existingOpt.get();
                log.debug("Updating existing doctor profile for user {}", user.getId());
            } else {
                profile = new DoctorProfile();
                profile.setUpdatedAt(java.time.Instant.now());
                log.debug("Creating new doctor profile for user {}", user.getId());
            }
            
            profile.setUser(user);
            profile.setProfileImageUrl(request.getProfileImageUrl());
            profile.setTagline(request.getTagline());
            profile.setAbout(request.getAbout());
            profile.setSpecializations(request.getSpecializations());
            profile.setYearsOfExperience(request.getYearsOfExperience());
            profile.setClinics(request.getClinics());
            profile.setConsultationTypes(request.getConsultationTypes());
            profile.setLanguages(request.getLanguages());
            profile.setMedicalInterests(request.getMedicalInterests());
            profile.setWorkStyle(request.getWorkStyle());
            profile.setProfessionalEmail(request.getProfessionalEmail());
            profile.setClinicPhone(request.getClinicPhone());
            profile.setGeneralAvailability(request.getGeneralAvailability());

            DoctorProfile saved = doctorProfileRepository.save(profile);
            log.info("Successfully saved doctor profile for user {}", user.getId());
            return toResponse(saved);
        } catch (Exception e) {
            log.error("Error saving doctor profile for user {}: {}", user.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to save doctor profile: " + e.getMessage(), e);
        }
    }

    private DoctorProfileResponse toResponse(DoctorProfile profile) {
        if (profile == null) {
            throw new IllegalArgumentException("Profile cannot be null");
        }
        if (profile.getUser() == null) {
            log.error("Profile {} has null user", profile.getId());
            throw new IllegalStateException("Profile has no associated user");
        }
        try {
            return new DoctorProfileResponse(
                profile.getId(),
                profile.getUser().getId(),
                profile.getProfileImageUrl(),
                profile.getTagline(),
                profile.getAbout(),
                profile.getSpecializations(),
                profile.getYearsOfExperience(),
                profile.getClinics(),
                profile.getConsultationTypes(),
                profile.getLanguages(),
                profile.getMedicalInterests(),
                profile.getWorkStyle(),
                profile.getProfessionalEmail(),
                profile.getClinicPhone(),
                profile.getGeneralAvailability(),
                profile.getUpdatedAt()
            );
        } catch (Exception e) {
            log.error("Error converting profile to response for profile ID {}: {}", 
                profile.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to convert profile to response: " + e.getMessage(), e);
        }
    }

    private void ensureDoctor(User user) {
        if (user == null || user.getRole() != UserRole.DOCTOR) {
            throw new IllegalArgumentException("Only doctors can have doctor profiles");
        }
    }
}
