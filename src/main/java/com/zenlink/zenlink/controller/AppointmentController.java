package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.AppointmentResponse;
import com.zenlink.zenlink.dto.ConsultationContextResponse;
import com.zenlink.zenlink.dto.ConsultationDraftDto;
import com.zenlink.zenlink.dto.ConsultationSegmentAnalyzeRequest;
import com.zenlink.zenlink.dto.ConsultationSegmentAnalyzeResponse;
import com.zenlink.zenlink.dto.ConsultationFinalizeRequest;
import com.zenlink.zenlink.dto.ConsultationFinalizeResponse;
import com.zenlink.zenlink.dto.CreateAppointmentRequest;
import com.zenlink.zenlink.dto.CopilotActionRequest;
import com.zenlink.zenlink.dto.CopilotChatRequest;
import com.zenlink.zenlink.dto.CopilotResponse;
import com.zenlink.zenlink.service.AppointmentService;
import com.zenlink.zenlink.service.ConsultationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;
    
    @Autowired
    private ConsultationService consultationService;

    /**
     * Create a new appointment
     */
    @PostMapping
    public ResponseEntity<?> createAppointment(
            @RequestBody CreateAppointmentRequest request,
            @RequestParam Long patientId) {
        try {
            AppointmentResponse response = appointmentService.createAppointment(request, patientId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Get all appointments for a doctor
     */
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointments(@PathVariable Long doctorId) {
        List<AppointmentResponse> appointments = appointmentService.getDoctorAppointments(doctorId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get all appointments for a patient
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentResponse>> getPatientAppointments(@PathVariable Long patientId) {
        List<AppointmentResponse> appointments = appointmentService.getPatientAppointments(patientId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get consultation context for an appointment
     */
    @GetMapping("/{appointmentId}/consultation-context")
    public ResponseEntity<ConsultationContextResponse> getConsultationContext(@PathVariable Long appointmentId) {
        ConsultationContextResponse response = appointmentService.getConsultationContext(appointmentId);
        return ResponseEntity.ok(response);
    }

    /**
     * Save consultation draft for an appointment
     */
    @PostMapping("/{appointmentId}/consultation-draft")
    public ResponseEntity<ConsultationDraftDto> saveConsultationDraft(
            @PathVariable Long appointmentId,
            @RequestBody ConsultationDraftDto request) {
        ConsultationDraftDto saved = appointmentService.saveConsultationDraft(appointmentId, request);
        return ResponseEntity.ok(saved);
    }

    /**
     * Analyze a consultation segment and get AI recommendations
     */
    @PostMapping("/{appointmentId}/segment-analyze")
    public ResponseEntity<ConsultationSegmentAnalyzeResponse> analyzeSegment(
            @PathVariable Long appointmentId,
            @RequestBody ConsultationSegmentAnalyzeRequest request) {
        try {
            ConsultationSegmentAnalyzeResponse response = consultationService.analyzeSegment(appointmentId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ConsultationSegmentAnalyzeResponse errorResponse = new ConsultationSegmentAnalyzeResponse();
            errorResponse.setAssistantMarkdown("Eroare la analiză: " + e.getMessage());
            errorResponse.setUpdatedRollingSummary(request.getRollingSummary());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse);
        }
    }

    /**
     * Execute a copilot action
     */
    @PostMapping("/{appointmentId}/copilot-action")
    public ResponseEntity<CopilotResponse> copilotAction(
            @PathVariable("appointmentId") Long appointmentId,
            @RequestBody CopilotActionRequest request) {
        System.out.println("=== COPILOT ACTION ENDPOINT CALLED ===");
        System.out.println("Appointment ID: " + appointmentId);
        System.out.println("Action ID: " + (request != null ? request.getActionId() : "null"));
        try {
            if (request == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorCopilotResponse("Request body is null"));
            }
            CopilotResponse response = consultationService.executeCopilotAction(appointmentId, request);
            if (response == null) {
                System.out.println("Response is null!");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(createErrorCopilotResponse("Răspuns null de la serviciu"));
            }
            System.out.println("Response generated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error in copilotAction: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorCopilotResponse("Eroare: " + e.getMessage()));
        }
    }
    
    private CopilotResponse createErrorCopilotResponse(String errorMessage) {
        CopilotResponse error = new CopilotResponse();
        error.setType("doctor_copilot");
        error.setTitle("❌ Eroare");
        error.setLanguage("ro");
        error.setSegments_used(0);
        error.setContent_markdown("## ⚠️ Eroare\n\n" + errorMessage);
        error.setSuggested_actions(new ArrayList<>());
        return error;
    }

    /**
     * Send a chat message to copilot
     */
    @PostMapping("/{appointmentId}/copilot-chat")
    public ResponseEntity<CopilotResponse> copilotChat(
            @PathVariable Long appointmentId,
            @RequestBody CopilotChatRequest request) {
        try {
            CopilotResponse response = consultationService.handleCopilotChat(appointmentId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    /**
     * Finalize consultation and generate Clarity Sheets
     */
    @PostMapping("/{appointmentId}/finalize")
    public ResponseEntity<ConsultationFinalizeResponse> finalizeConsultation(
            @PathVariable Long appointmentId,
            @RequestBody ConsultationFinalizeRequest request) {
        try {
            ConsultationFinalizeResponse response = consultationService.finalizeConsultation(appointmentId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    private static class ErrorResponse {
        private String message;
        public ErrorResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
    }
}

