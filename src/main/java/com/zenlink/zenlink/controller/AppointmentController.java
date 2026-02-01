package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.AppointmentResponse;
import com.zenlink.zenlink.dto.ConsultationContextResponse;
import com.zenlink.zenlink.dto.ConsultationDraftDto;
import com.zenlink.zenlink.dto.CreateAppointmentRequest;
import com.zenlink.zenlink.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

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

    private static class ErrorResponse {
        private String message;
        public ErrorResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
    }
}

