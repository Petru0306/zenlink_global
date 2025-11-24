package com.zenlink.zenlink.config;

import com.zenlink.zenlink.model.ReferralCode;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.repository.ReferralCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Initialize referral codes on application startup
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ReferralCodeRepository referralCodeRepository;

    @Override
    public void run(String... args) throws Exception {
        // Check if referral codes already exist
        if (referralCodeRepository.count() == 0) {
            System.out.println("Initializing referral codes...");
            
            // Create some default referral codes for testing
            createReferralCode("DOCTOR123", UserRole.DOCTOR);
            createReferralCode("DOCTOR456", UserRole.DOCTOR);
            createReferralCode("CLINIC123", UserRole.CLINIC);
            createReferralCode("CLINIC456", UserRole.CLINIC);
            
            System.out.println("Referral codes initialized!");
            System.out.println("DOCTOR codes: DOCTOR123, DOCTOR456");
            System.out.println("CLINIC codes: CLINIC123, CLINIC456");
        }
    }

    private void createReferralCode(String code, UserRole role) {
        if (!referralCodeRepository.existsByCode(code)) {
            ReferralCode referralCode = new ReferralCode();
            referralCode.setCode(code);
            referralCode.setRole(role);
            referralCode.setIsUsed(false);
            referralCodeRepository.save(referralCode);
        }
    }
}

