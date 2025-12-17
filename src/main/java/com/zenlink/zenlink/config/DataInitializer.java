package com.zenlink.zenlink.config;

import com.zenlink.zenlink.model.ReferralCode;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.repository.ReferralCodeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

/**
 * Initialize referral codes on application startup
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private ReferralCodeRepository referralCodeRepository;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Check if referral codes already exist
            if (referralCodeRepository.count() == 0) {
                log.info("Initializing referral codes...");

                // Create some default referral codes for testing
                createReferralCode("DOCTOR123", UserRole.DOCTOR);
                createReferralCode("DOCTOR456", UserRole.DOCTOR);
                createReferralCode("CLINIC123", UserRole.CLINIC);
                createReferralCode("CLINIC456", UserRole.CLINIC);

                log.info("Referral codes initialized! DOCTOR: DOCTOR123, DOCTOR456 | CLINIC: CLINIC123, CLINIC456");
            }
        } catch (DataAccessException ex) {
            // Typical causes in local dev: schema/tables not created yet or insufficient privileges (e.g. no CREATE on schema public).
            // We don't want to crash the whole app during early development.
            log.warn("Skipping referral code initialization because database schema is not ready: {}", ex.getMostSpecificCause().getMessage());
        }
    }

    private void createReferralCode(String code, UserRole role) {
        try {
            if (!referralCodeRepository.existsByCode(code)) {
                ReferralCode referralCode = new ReferralCode();
                referralCode.setCode(code);
                referralCode.setRole(role);
                referralCode.setIsUsed(false);
                referralCodeRepository.save(referralCode);
            }
        } catch (DataAccessException ex) {
            log.warn("Could not create referral code '{}' (DB not ready): {}", code, ex.getMostSpecificCause().getMessage());
        }
    }
}

