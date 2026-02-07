package com.zenlink.zenlink.service;

import com.zenlink.zenlink.dto.AppointmentResponse;
import com.zenlink.zenlink.dto.ConsultationContextResponse;
import com.zenlink.zenlink.dto.ConsultationDraftDto;
import com.zenlink.zenlink.dto.ConsultationMessageResponse;
import com.zenlink.zenlink.dto.ConsultationSegmentDto;
import com.zenlink.zenlink.dto.CreateAppointmentRequest;
import com.zenlink.zenlink.model.Appointment;
import com.zenlink.zenlink.model.ConsultationMessage;
import com.zenlink.zenlink.model.ConsultationSegment;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.repository.AppointmentRepository;
import com.zenlink.zenlink.repository.ConsultationMessageRepository;
import com.zenlink.zenlink.repository.ConsultationSegmentRepository;
import com.zenlink.zenlink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConsultationMessageRepository consultationMessageRepository;

    @Autowired
    private ConsultationSegmentRepository consultationSegmentRepository;

    private final Map<Long, ConsultationDraftDto> consultationDrafts = new ConcurrentHashMap<>();

    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest request, Long patientId) {
        // Check if slot is already booked
        if (appointmentRepository.findByDoctorIdAndDateAndTime(
                request.getDoctorId(), request.getDate(), request.getTime()).isPresent()) {
            throw new RuntimeException("This time slot is already booked");
        }

        // Create appointment
        Appointment appointment = new Appointment();
        appointment.setDoctorId(request.getDoctorId());
        appointment.setPatientId(patientId);
        appointment.setDate(request.getDate());
        appointment.setTime(request.getTime());
        appointment.setStatus("upcoming");

        appointment = appointmentRepository.save(appointment);

        // Get doctor and patient names
        User doctor = userRepository.findById(request.getDoctorId()).orElse(null);
        User patient = userRepository.findById(patientId).orElse(null);

        String doctorName = doctor != null ? "Dr. " + doctor.getFirstName() + " " + doctor.getLastName() : "Unknown";
        String patientName = patient != null ? patient.getFirstName() + " " + patient.getLastName() : "Unknown";

        return new AppointmentResponse(
                appointment.getId(),
                appointment.getDoctorId(),
                doctorName,
                appointment.getPatientId(),
                patientName,
                appointment.getDate(),
                appointment.getTime(),
                appointment.getStatus()
        );
    }

    public List<AppointmentResponse> getDoctorAppointments(Long doctorId) {
        List<Appointment> appointments = appointmentRepository.findByDoctorId(doctorId);
        return appointments.stream().map(apt -> {
            User patient = userRepository.findById(apt.getPatientId()).orElse(null);
            String patientName = patient != null ? patient.getFirstName() + " " + patient.getLastName() : "Unknown";
            User doctor = userRepository.findById(apt.getDoctorId()).orElse(null);
            String doctorName = doctor != null ? "Dr. " + doctor.getFirstName() + " " + doctor.getLastName() : "Unknown";
            
            return new AppointmentResponse(
                    apt.getId(),
                    apt.getDoctorId(),
                    doctorName,
                    apt.getPatientId(),
                    patientName,
                    apt.getDate(),
                    apt.getTime(),
                    apt.getStatus()
            );
        }).collect(Collectors.toList());
    }

    public List<AppointmentResponse> getPatientAppointments(Long patientId) {
        List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
        return appointments.stream().map(apt -> {
            User patient = userRepository.findById(apt.getPatientId()).orElse(null);
            String patientName = patient != null ? patient.getFirstName() + " " + patient.getLastName() : "Unknown";
            User doctor = userRepository.findById(apt.getDoctorId()).orElse(null);
            String doctorName = doctor != null ? "Dr. " + doctor.getFirstName() + " " + doctor.getLastName() : "Unknown";
            
            return new AppointmentResponse(
                    apt.getId(),
                    apt.getDoctorId(),
                    doctorName,
                    apt.getPatientId(),
                    patientName,
                    apt.getDate(),
                    apt.getTime(),
                    apt.getStatus()
            );
        }).collect(Collectors.toList());
    }

    public ConsultationContextResponse getConsultationContext(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        User patient = userRepository.findById(appointment.getPatientId()).orElse(null);

        String displayName = patient != null
                ? (patient.getFirstName() + " " + patient.getLastName()).trim()
                : "Patient";
        Integer age = patient != null ? patient.getAge() : null;
        String reason = "Consultatie stomatologica";
        String internalKey = "ZK-" + appointmentId;

        ConsultationContextResponse.PatientSummary patientSummary =
                new ConsultationContextResponse.PatientSummary(
                        appointment.getPatientId(),
                        displayName,
                        age,
                        reason
                );

        ConsultationDraftDto existingDraft = consultationDrafts.get(appointmentId);

        // Load saved messages
        List<ConsultationMessage> savedMessages = consultationMessageRepository.findByConsultationIdOrderByCreatedAtAsc(appointmentId);
        List<ConsultationMessageResponse> messages = savedMessages.stream()
            .map(msg -> new ConsultationMessageResponse(
                msg.getId(),
                msg.getRole(),
                msg.getContent(),
                msg.getOutputType(),
                msg.getCreatedAt()
            ))
            .collect(Collectors.toList());

        // Load saved segments
        List<ConsultationSegment> savedSegments = consultationSegmentRepository.findByConsultationIdOrderByStartTsAsc(appointmentId);
        List<ConsultationSegmentDto> segments = savedSegments.stream()
            .map(seg -> new ConsultationSegmentDto(
                seg.getId(),
                seg.getText(),
                seg.getStartTs(),
                seg.getEndTs(),
                seg.getSpeaker(),
                seg.getCreatedAt()
            ))
            .collect(Collectors.toList());

        return new ConsultationContextResponse(
                appointmentId,
                patientSummary,
                internalKey,
                Collections.emptyList(),
                existingDraft,
                messages,
                segments
        );
    }

    public ConsultationDraftDto saveConsultationDraft(Long appointmentId, ConsultationDraftDto draft) {
        consultationDrafts.put(appointmentId, draft);
        return draft;
    }
}

