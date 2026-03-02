package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.ClinicDoctorResponse;
import com.zenlink.zenlink.dto.ClinicPatientResponse;
import com.zenlink.zenlink.model.ClinicDoctor;
import com.zenlink.zenlink.model.ClinicProfile;
import com.zenlink.zenlink.model.DoctorProfile;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.repository.AppointmentRepository;
import com.zenlink.zenlink.repository.ClinicDoctorRepository;
import com.zenlink.zenlink.repository.ClinicProfileRepository;
import com.zenlink.zenlink.repository.DoctorProfileRepository;
import com.zenlink.zenlink.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clinics")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ClinicController {

    private final ClinicDoctorRepository clinicDoctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final ClinicProfileRepository clinicProfileRepository;

    public ClinicController(
            ClinicDoctorRepository clinicDoctorRepository,
            AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            DoctorProfileRepository doctorProfileRepository,
            ClinicProfileRepository clinicProfileRepository
    ) {
        this.clinicDoctorRepository = clinicDoctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.clinicProfileRepository = clinicProfileRepository;
    }

    /**
     * Get all clinics
     * This endpoint provides the same functionality as /api/users/clinics
     */
    @GetMapping
    public ResponseEntity<List<com.zenlink.zenlink.dto.UserResponse>> getAllClinics() {
        List<User> clinics = userRepository.findByRole(UserRole.CLINIC);
        List<com.zenlink.zenlink.dto.UserResponse> response = clinics.stream()
                .map(com.zenlink.zenlink.dto.UserResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{clinicId}/doctors/{doctorId}")
    @Transactional
    public ResponseEntity<?> addDoctor(@PathVariable Long clinicId, @PathVariable Long doctorId) {
        if (clinicDoctorRepository.findByClinicIdAndDoctorId(clinicId, doctorId).isPresent()) {
            return ResponseEntity.ok(Map.of("ok", true, "already", true));
        }
        clinicDoctorRepository.save(new ClinicDoctor(null, clinicId, doctorId));
        
        // Update doctor's profile with clinic name
        updateDoctorClinics(doctorId);
        
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @DeleteMapping("/{clinicId}/doctors/{doctorId}")
    @Transactional
    public ResponseEntity<?> removeDoctor(@PathVariable Long clinicId, @PathVariable Long doctorId) {
        return clinicDoctorRepository.findByClinicIdAndDoctorId(clinicId, doctorId)
                .map(row -> {
                    clinicDoctorRepository.delete(row);
                    // Update doctor's profile to remove clinic
                    updateDoctorClinics(doctorId);
                    return ResponseEntity.ok(Map.of("ok", true));
                })
                .orElse(ResponseEntity.ok(Map.of("ok", true)));
    }

    private void updateDoctorClinics(Long doctorId) {
        // Get all clinics for this doctor
        List<Long> clinicIds = clinicDoctorRepository.findClinicIdsByDoctorId(doctorId);
        System.out.println("Updating clinics for doctor " + doctorId + ", found clinic IDs: " + clinicIds);
        
        // Get clinic names
        List<String> clinicNames = new ArrayList<>();
        for (Long clinicId : clinicIds) {
            Optional<ClinicProfile> clinicProfileOpt = clinicProfileRepository.findByUserId(clinicId);
            if (clinicProfileOpt.isPresent()) {
                ClinicProfile clinicProfile = clinicProfileOpt.get();
                String name = clinicProfile.getName();
                System.out.println("Clinic ID " + clinicId + " has name: " + name);
                if (name != null && !name.trim().isEmpty()) {
                    clinicNames.add(name);
                } else {
                    // Fallback to user name if clinic profile name is not set
                    User clinicUser = userRepository.findById(clinicId).orElse(null);
                    if (clinicUser != null) {
                        String fallbackName = clinicUser.getFirstName() + " " + clinicUser.getLastName() + " Clinic";
                        System.out.println("Using fallback name for clinic ID " + clinicId + ": " + fallbackName);
                        clinicNames.add(fallbackName);
                    }
                }
            } else {
                // No clinic profile, use user name as fallback
                User clinicUser = userRepository.findById(clinicId).orElse(null);
                if (clinicUser != null) {
                    String fallbackName = clinicUser.getFirstName() + " " + clinicUser.getLastName() + " Clinic";
                    System.out.println("No clinic profile found, using fallback name for clinic ID " + clinicId + ": " + fallbackName);
                    clinicNames.add(fallbackName);
                }
            }
        }
        
        System.out.println("Clinic names to set: " + clinicNames);
        
        // Update doctor profile
        Optional<DoctorProfile> profileOpt = doctorProfileRepository.findByUserId(doctorId);
        if (profileOpt.isPresent()) {
            DoctorProfile profile = profileOpt.get();
            String clinicsString = clinicNames.isEmpty() ? null : String.join(", ", clinicNames);
            System.out.println("Setting clinics field to: " + clinicsString);
            profile.setClinics(clinicsString);
            doctorProfileRepository.save(profile);
            System.out.println("Doctor profile updated successfully");
        } else {
            System.out.println("No doctor profile found for doctor ID " + doctorId);
        }
    }

    @GetMapping("/{clinicId}/doctors")
    public ResponseEntity<List<ClinicDoctorResponse>> listDoctors(@PathVariable Long clinicId) {
        List<Long> doctorIds = clinicDoctorRepository.findDoctorIdsByClinicId(clinicId);
        if (doctorIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<User> doctors = userRepository.findAllById(doctorIds);
        List<ClinicDoctorResponse> result = doctors.stream().map(doctor -> {
            DoctorProfile profile = doctorProfileRepository.findByUserId(doctor.getId()).orElse(null);
            return new ClinicDoctorResponse(
                doctor.getId(),
                doctor.getFirstName(),
                doctor.getLastName(),
                doctor.getEmail(),
                doctor.getPhone(),
                profile != null ? profile.getProfileImageUrl() : null,
                profile != null ? profile.getSpecializations() : null,
                profile != null ? profile.getTagline() : null
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/doctors/search")
    public ResponseEntity<List<ClinicDoctorResponse>> searchDoctors(
            @RequestParam(required = false, defaultValue = "") String search) {
        List<User> doctors;
        if (search == null || search.trim().isEmpty()) {
            doctors = userRepository.findByRole(UserRole.DOCTOR);
        } else {
            doctors = userRepository.findByRoleAndNameContaining(UserRole.DOCTOR, search.trim());
        }

        List<ClinicDoctorResponse> result = doctors.stream().map(doctor -> {
            DoctorProfile profile = doctorProfileRepository.findByUserId(doctor.getId()).orElse(null);
            return new ClinicDoctorResponse(
                doctor.getId(),
                doctor.getFirstName(),
                doctor.getLastName(),
                doctor.getEmail(),
                doctor.getPhone(),
                profile != null ? profile.getProfileImageUrl() : null,
                profile != null ? profile.getSpecializations() : null,
                profile != null ? profile.getTagline() : null
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{clinicId}/patients")
    public ResponseEntity<List<ClinicPatientResponse>> listPatients(@PathVariable Long clinicId) {
        List<Long> doctorIds = clinicDoctorRepository.findDoctorIdsByClinicId(clinicId);
        if (doctorIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Long> patientIds = appointmentRepository.findDistinctPatientIdsByDoctorIdIn(doctorIds);
        if (patientIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<User> patients = userRepository.findAllById(patientIds);
        Map<Long, String> nameById = patients.stream().collect(Collectors.toMap(
                User::getId,
                u -> (u.getFirstName() == null ? "" : u.getFirstName()) + " " + (u.getLastName() == null ? "" : u.getLastName())
        ));

        List<ClinicPatientResponse> out = patientIds.stream()
                .distinct()
                .map(id -> new ClinicPatientResponse(id, nameById.getOrDefault(id, "Patient " + id).trim()))
                .toList();

        return ResponseEntity.ok(out);
    }
}


