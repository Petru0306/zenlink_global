package com.zenlink.zenlink.service;

import com.zenlink.zenlink.model.ReferralCode;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.repository.ReferralCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ReferralCodeService {

    @Autowired
    private ReferralCodeRepository referralCodeRepository;

    /**
     * Generate a new referral code for a specific role
     * This can be called by admins to create referral codes
     */
    public ReferralCode generateReferralCode(UserRole role) {
        String code = generateUniqueCode();
        
        ReferralCode referralCode = new ReferralCode();
        referralCode.setCode(code);
        referralCode.setRole(role);
        referralCode.setIsUsed(false);
        
        return referralCodeRepository.save(referralCode);
    }

    /**
     * Generate a unique referral code
     */
    private String generateUniqueCode() {
        String code;
        do {
            // Generate a random 8-character alphanumeric code
            code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (referralCodeRepository.existsByCode(code));
        
        return code;
    }
}

