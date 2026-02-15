package com.zenlink.zenlink.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.zenlink.zenlink.model.User;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class FileUploadController {
    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping(value = "/profile-image", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadProfileImage(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        try {
            log.debug("Received profile image upload request");
            
            if (user == null) {
                log.warn("Unauthenticated request to upload profile image");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
            }

            if (file == null || file.isEmpty()) {
                log.warn("Empty file received for upload");
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                log.warn("Invalid file type: {}", contentType);
                return ResponseEntity.badRequest().body(Map.of("error", "File must be an image"));
            }

            // Validate file size (5MB max)
            if (file.getSize() > 5 * 1024 * 1024) {
                log.warn("File too large: {} bytes", file.getSize());
                return ResponseEntity.badRequest().body(Map.of("error", "File size must be less than 5MB"));
            }

            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir, "profiles").toAbsolutePath().normalize();
            log.info("Upload directory path: {}", uploadPath);
            log.info("Upload directory exists: {}", Files.exists(uploadPath));
            log.info("Upload directory is writable: {}", Files.exists(uploadPath) && Files.isWritable(uploadPath));
            
            if (!Files.exists(uploadPath)) {
                try {
                    Files.createDirectories(uploadPath);
                    log.info("Created upload directory: {}", uploadPath);
                } catch (Exception e) {
                    log.error("Failed to create upload directory: {}", e.getMessage(), e);
                    throw new RuntimeException("Failed to create upload directory: " + e.getMessage(), e);
                }
            }
            
            // Verify directory is writable
            if (!Files.isWritable(uploadPath)) {
                log.error("Upload directory is not writable: {}", uploadPath);
                throw new RuntimeException("Upload directory is not writable: " + uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = uploadPath.resolve(filename);
            log.debug("Saving file to: {}", filePath.toAbsolutePath());
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return URL (relative path that frontend can access)
            String url = "/uploads/profiles/" + filename;
            
            log.info("Profile image uploaded successfully for user {}: {}", user.getId(), filename);
            
            Map<String, String> response = new HashMap<>();
            response.put("url", url);
            response.put("filename", filename);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            log.error("Error uploading profile image for user {}: {}", 
                user != null ? user.getId() : "unknown", errorMsg, e);
            
            // Return detailed error message
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to upload image: " + errorMsg);
            errorResponse.put("message", errorMsg);
            errorResponse.put("type", e.getClass().getSimpleName());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
        }
    }
}
