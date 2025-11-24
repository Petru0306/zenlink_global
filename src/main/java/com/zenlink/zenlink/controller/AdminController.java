package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.model.ReferralCode;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.service.ReferralCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Admin controller for generating referral codes
 * In production, this should be secured with proper authentication
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AdminController {

    @Autowired
    private ReferralCodeService referralCodeService;

    @RequestMapping(value = "/referral-codes/generate", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> generateReferralCode(@RequestParam UserRole role) {
        try {
            ReferralCode referralCode = referralCodeService.generateReferralCode(role);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", referralCode.getCode());
            response.put("role", referralCode.getRole());
            response.put("message", "Referral code generated successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}

