package com.zenlink.zenlink.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public ResponseEntity<Map<String, Object>> handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        
        if (status != null) {
            int statusCode = Integer.parseInt(status.toString());
            
            // For API endpoints that don't exist, return 404
            String path = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
            if (path != null && path.startsWith("/api/")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                        "error", "Not Found",
                        "message", "The requested API endpoint does not exist: " + path,
                        "status", 404,
                        "path", path
                    ));
            }
            
            // For other errors, return appropriate status
            HttpStatus httpStatus = HttpStatus.valueOf(statusCode);
            return ResponseEntity.status(httpStatus)
                .body(Map.of(
                    "error", httpStatus.getReasonPhrase(),
                    "status", statusCode,
                    "path", path != null ? path : "unknown"
                ));
        }
        
        // Default error response
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of(
                "error", "Internal Server Error",
                "status", 500
            ));
    }
}
