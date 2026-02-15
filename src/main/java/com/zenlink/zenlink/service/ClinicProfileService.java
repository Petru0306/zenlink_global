package com.zenlink.zenlink.service;

import com.zenlink.zenlink.dto.ClinicProfileRequest;
import com.zenlink.zenlink.dto.ClinicProfileResponse;
import com.zenlink.zenlink.model.ClinicProfile;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.repository.ClinicProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

@Service
public class ClinicProfileService {
    private static final Logger log = LoggerFactory.getLogger(ClinicProfileService.class);
    
    @Autowired
    private ClinicProfileRepository clinicProfileRepository;

    @Transactional(readOnly = true)
    public ClinicProfileResponse getProfile(User user) {
        ensureClinic(user);
        try {
            Optional<ClinicProfile> profileOpt = clinicProfileRepository.findByUser(user);
            if (profileOpt.isEmpty()) {
                log.debug("No profile found for user {}, returning empty profile", user.getId());
                return new ClinicProfileResponse(
                    null, user.getId(), null, null, null, null, null, null, 
                    null, null, null, null, null, null, null, null, null, null, null
                );
            }
            ClinicProfile profile = profileOpt.get();
            log.debug("Found profile for user {}, converting to response", user.getId());
            return toResponse(profile);
        } catch (Exception e) {
            log.error("Error getting profile for user {}: {}", user.getId(), e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public ClinicProfileResponse getProfileByClinicId(Long clinicId) {
        if (clinicId == null) {
            throw new IllegalArgumentException("Clinic ID cannot be null");
        }
        log.debug("Fetching clinic profile for clinic ID: {}", clinicId);
        Optional<ClinicProfile> profileOpt = clinicProfileRepository.findByUserId(clinicId);
        if (profileOpt.isEmpty()) {
            log.info("No clinic profile found for clinic ID: {}", clinicId);
            return new ClinicProfileResponse(
                null, clinicId, null, null, null, null, null, null, 
                null, null, null, null, null, null, null, null, null, null, null
            );
        }
        ClinicProfile profile = profileOpt.get();
        log.info("Found clinic profile for clinic ID: {} (profile ID: {})", clinicId, profile.getId());
        return toResponse(profile);
    }

    @Transactional
    public ClinicProfileResponse upsertProfile(User user, ClinicProfileRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Clinic profile request cannot be null");
        }
        ensureClinic(user);
        
        try {
            Optional<ClinicProfile> existingOpt = clinicProfileRepository.findByUser(user);
            ClinicProfile profile;
            
            if (existingOpt.isPresent()) {
                profile = existingOpt.get();
                log.debug("Updating existing clinic profile for user {}", user.getId());
            } else {
                profile = new ClinicProfile();
                profile.setUpdatedAt(java.time.Instant.now());
                log.debug("Creating new clinic profile for user {}", user.getId());
            }
            
            profile.setUser(user);
            // Only set profileImageUrl if provided (keeping for backward compatibility)
            if (request.getProfileImageUrl() != null) {
                profile.setProfileImageUrl(request.getProfileImageUrl());
            }
            // Set bannerImageUrl
            log.info("Setting bannerImageUrl: '{}'", request.getBannerImageUrl());
            profile.setBannerImageUrl(request.getBannerImageUrl());
            log.info("BannerImageUrl set to profile: '{}'", profile.getBannerImageUrl());
            profile.setName(request.getName());
            profile.setTagline(request.getTagline());
            profile.setAbout(request.getAbout());
            profile.setAddress(request.getAddress());
            profile.setPhone(request.getPhone());
            profile.setEmail(request.getEmail());
            profile.setWebsite(request.getWebsite());
            profile.setSpecialties(request.getSpecialties());
            profile.setOpenHours(request.getOpenHours());
            profile.setDescription(request.getDescription());
            profile.setFacilities(request.getFacilities());
            profile.setInsuranceAccepted(request.getInsuranceAccepted());
            profile.setLanguages(request.getLanguages());
            profile.setGalleryImages(request.getGalleryImages());

            log.info("About to save profile, bannerImageUrl: '{}'", profile.getBannerImageUrl());
            ClinicProfile saved = clinicProfileRepository.save(profile);
            log.info("Successfully saved clinic profile for user {}", user.getId());
            log.info("Saved profile bannerImageUrl: '{}'", saved.getBannerImageUrl());
            ClinicProfileResponse response = toResponse(saved);
            log.info("Response bannerImageUrl: '{}'", response.getBannerImageUrl());
            return response;
        } catch (Exception e) {
            log.error("Error saving clinic profile for user {}: {}", user.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to save clinic profile: " + e.getMessage(), e);
        }
    }

    private ClinicProfileResponse toResponse(ClinicProfile profile) {
        if (profile == null) {
            throw new IllegalArgumentException("Profile cannot be null");
        }
        if (profile.getUser() == null) {
            log.error("Profile {} has null user", profile.getId());
            throw new IllegalStateException("Profile has no associated user");
        }
        try {
            return new ClinicProfileResponse(
                profile.getId(),
                profile.getUser().getId(),
                profile.getProfileImageUrl(),
                profile.getBannerImageUrl(),
                profile.getName(),
                profile.getTagline(),
                profile.getAbout(),
                profile.getAddress(),
                profile.getPhone(),
                profile.getEmail(),
                profile.getWebsite(),
                profile.getSpecialties(),
                profile.getOpenHours(),
                profile.getDescription(),
                profile.getFacilities(),
                profile.getInsuranceAccepted(),
                profile.getLanguages(),
                profile.getGalleryImages(),
                profile.getUpdatedAt()
            );
        } catch (Exception e) {
            log.error("Error converting profile to response for profile ID {}: {}", 
                profile.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to convert profile to response: " + e.getMessage(), e);
        }
    }

    private void ensureClinic(User user) {
        if (user == null || user.getRole() != UserRole.CLINIC) {
            throw new IllegalArgumentException("Only clinics can have clinic profiles");
        }
    }
}
