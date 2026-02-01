package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.PsychProfileRequest;
import com.zenlink.zenlink.dto.PsychProfileResponse;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.service.PsychProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/psych-profile")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PsychProfileController {
    @Autowired
    private PsychProfileService psychProfileService;

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Unauthorized"));
        }
        PsychProfileResponse response = psychProfileService.getProfile(user);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> upsertProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PsychProfileRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Unauthorized"));
        }
        PsychProfileResponse response = psychProfileService.upsertProfile(user, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PsychProfileRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Unauthorized"));
        }
        PsychProfileResponse response = psychProfileService.upsertProfile(user, request);
        return ResponseEntity.ok(response);
    }

    private static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }
}

