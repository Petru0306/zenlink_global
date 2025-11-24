package com.zenlink.zenlink.service;

import com.zenlink.zenlink.dto.AuthResponse;
import com.zenlink.zenlink.dto.LoginRequest;
import com.zenlink.zenlink.dto.SignupRequest;
import com.zenlink.zenlink.model.ReferralCode;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.repository.ReferralCodeRepository;
import com.zenlink.zenlink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReferralCodeRepository referralCodeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        System.out.println("=== SIGNUP REQUEST ===");
        System.out.println("Role: " + request.getRole());
        System.out.println("Referral Code: " + request.getReferralCode());
        System.out.println("Email: " + request.getEmail());
        
        // Validate email doesn't exist
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Validate referral code for DOCTOR and CLINIC roles
        if (request.getRole() == UserRole.DOCTOR || request.getRole() == UserRole.CLINIC) {
            System.out.println("Validating referral code for role: " + request.getRole());
            
            if (request.getReferralCode() == null || request.getReferralCode().trim().isEmpty()) {
                System.out.println("ERROR: Referral code is null or empty!");
                throw new RuntimeException("Referral code is required for " + request.getRole() + " registration");
            }

            String code = request.getReferralCode().trim();
            System.out.println("Checking referral code: '" + code + "'");
            
            // Hardcoded referral codes (like passwords) - easy to manage
            boolean isValidCode = false;
            
            if (request.getRole() == UserRole.DOCTOR) {
                // Valid DOCTOR referral codes
                isValidCode = code.equals("DOCTOR123") || 
                             code.equals("DOCTOR456") || 
                             code.equals("DOC2024") ||
                             code.equals("MEDIC2024");
                System.out.println("DOCTOR code check - isValidCode: " + isValidCode);
            } else if (request.getRole() == UserRole.CLINIC) {
                // Valid CLINIC referral codes
                isValidCode = code.equals("CLINIC123") || 
                             code.equals("CLINIC456") || 
                             code.equals("CLINIC2024") ||
                             code.equals("HOSPITAL2024");
                System.out.println("CLINIC code check - isValidCode: " + isValidCode);
            }
            
            // Also check database for dynamically generated codes
            if (!isValidCode) {
                System.out.println("Hardcoded codes didn't match, checking database...");
                Optional<ReferralCode> referralCodeOpt = referralCodeRepository
                        .findByCodeAndRoleAndIsUsedFalse(code, request.getRole());
                isValidCode = referralCodeOpt.isPresent();
                System.out.println("Database check - isValidCode: " + isValidCode);
                
                // If found in database, mark as used
                if (isValidCode) {
                    ReferralCode referralCode = referralCodeOpt.get();
                    referralCode.setIsUsed(true);
                    referralCode.setUsedAt(LocalDateTime.now());
                    referralCodeRepository.save(referralCode);
                }
            }
            
            if (!isValidCode) {
                System.out.println("ERROR: Invalid referral code!");
                throw new RuntimeException("Invalid referral code. Please contact admin for a valid code.");
            }
            
            System.out.println("Referral code validation PASSED");
        } else if (request.getRole() == UserRole.PATIENT) {
            System.out.println("PATIENT role - no referral code needed");
            // Patients don't need referral codes, but if one is provided, ignore it
            if (request.getReferralCode() != null && !request.getReferralCode().trim().isEmpty()) {
                // Just ignore it, don't throw error
            }
        }

        // Create new user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());

        user = userRepository.save(user);
        System.out.println("User created successfully with role: " + user.getRole());

        // Return auth response
        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole(),
                null // Token will be added later with JWT
        );
    }

    public AuthResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole(),
                null // Token will be added later with JWT
        );
    }
}
