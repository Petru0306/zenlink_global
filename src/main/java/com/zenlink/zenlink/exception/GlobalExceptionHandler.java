package com.zenlink.zenlink.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResourceFoundException(NoResourceFoundException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", HttpStatus.NOT_FOUND.value());
        
        String resourcePath = ex.getResourcePath();
        String errorMessage = "The requested endpoint does not exist: " + resourcePath;
        
        // Provide helpful suggestions for common mistakes
        if (resourcePath != null) {
            if (resourcePath.equals("/api/clinics") || resourcePath.equals("api/clinics")) {
                errorMessage = "The endpoint /api/clinics does not exist. Use /api/users/clinics to get all clinics.";
            } else if (resourcePath.equals("/api/doctors") || resourcePath.equals("api/doctors")) {
                errorMessage = "The endpoint /api/doctors does not exist. Use /api/users/doctors to get all doctors.";
            } else if (resourcePath.contains("favicon.ico")) {
                // Silently ignore favicon requests - don't log as error
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        }
        
        response.put("message", errorMessage);
        response.put("error", "Not Found");
        response.put("path", resourcePath);
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        
        // Collect all validation errors
        Map<String, String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fieldError -> fieldError.getDefaultMessage() != null ? 
                                fieldError.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing
                ));
        
        response.put("errors", errors);
        
        // Get the first error message for simple error display
        String firstError = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("Validation failed");
        
        response.put("message", firstError);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        
        String errorMessage = ex.getMessage();
        if (errorMessage == null || errorMessage.isEmpty()) {
            errorMessage = ex.getClass().getSimpleName() + " occurred";
        }
        response.put("message", errorMessage);
        response.put("error", errorMessage);
        
        System.err.println("=== GlobalExceptionHandler caught RuntimeException ===");
        System.err.println("Exception type: " + ex.getClass().getName());
        System.err.println("Exception message: " + errorMessage);
        ex.printStackTrace();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        
        // Include the actual error message for debugging
        String errorMessage = ex.getMessage();
        if (errorMessage == null || errorMessage.isEmpty()) {
            errorMessage = ex.getClass().getSimpleName() + " occurred";
        }
        response.put("message", errorMessage);
        response.put("error", errorMessage);
        
        // Log the actual error for debugging
        System.err.println("=== GlobalExceptionHandler caught exception ===");
        System.err.println("Exception type: " + ex.getClass().getName());
        System.err.println("Exception message: " + errorMessage);
        ex.printStackTrace();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}

