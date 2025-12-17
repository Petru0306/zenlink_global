package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.UserResponse;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class UserController {

    @Autowired
    private UserRepository userRepository;

    /**
     * Get all doctors (users with DOCTOR role)
     */
    @GetMapping("/doctors")
    public ResponseEntity<List<UserResponse>> getAllDoctors() {
        System.out.println("=== GET ALL DOCTORS ===");
        List<User> doctors = userRepository.findByRole(UserRole.DOCTOR);
        System.out.println("Found " + doctors.size() + " doctors");
        List<UserResponse> response = doctors.stream()
                .map(UserResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * Get all clinics (users with CLINIC role)
     */
    @GetMapping("/clinics")
    public ResponseEntity<List<UserResponse>> getAllClinics() {
        System.out.println("=== GET ALL CLINICS ===");
        List<User> clinics = userRepository.findByRole(UserRole.CLINIC);
        System.out.println("Found " + clinics.size() + " clinics");
        List<UserResponse> response = clinics.stream()
                .map(UserResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * Get doctor by ID
     */
    @GetMapping("/doctors/{id}")
    public ResponseEntity<UserResponse> getDoctorById(@PathVariable Long id) {
        return userRepository.findById(id)
                .filter(user -> user.getRole() == UserRole.DOCTOR)
                .map(UserResponse::new)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get clinic by ID
     */
    @GetMapping("/clinics/{id}")
    public ResponseEntity<UserResponse> getClinicById(@PathVariable Long id) {
        return userRepository.findById(id)
                .filter(user -> user.getRole() == UserRole.CLINIC)
                .map(UserResponse::new)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all patients (users with PATIENT role)
     */
    @GetMapping("/patients")
    public ResponseEntity<List<UserResponse>> getAllPatients() {
        List<User> patients = userRepository.findByRole(UserRole.PATIENT);
        List<UserResponse> response = patients.stream()
                .map(UserResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * Update user profile
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(
            @PathVariable Long id,
            @RequestBody com.zenlink.zenlink.dto.UpdateProfileRequest request) {
        return userRepository.findById(id)
                .map(user -> {
                    if (request.getFirstName() != null) {
                        user.setFirstName(request.getFirstName());
                    }
                    if (request.getLastName() != null) {
                        user.setLastName(request.getLastName());
                    }
                    if (request.getEmail() != null) {
                        String nextEmail = request.getEmail().trim();
                        if (!nextEmail.isEmpty() && !nextEmail.equalsIgnoreCase(user.getEmail())) {
                            if (userRepository.existsByEmail(nextEmail)) {
                                return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
                            }
                            user.setEmail(nextEmail);
                        }
                    }
                    if (request.getPhone() != null) {
                        user.setPhone(request.getPhone());
                    }
                    if (request.getAge() != null) {
                        user.setAge(request.getAge());
                    }
                    User updatedUser = userRepository.save(user);
                    return ResponseEntity.ok(new UserResponse(updatedUser));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

