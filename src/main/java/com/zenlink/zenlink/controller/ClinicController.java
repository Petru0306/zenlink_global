package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.ClinicPatientResponse;
import com.zenlink.zenlink.model.ClinicDoctor;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.repository.AppointmentRepository;
import com.zenlink.zenlink.repository.ClinicDoctorRepository;
import com.zenlink.zenlink.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clinics")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ClinicController {

    private final ClinicDoctorRepository clinicDoctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public ClinicController(
            ClinicDoctorRepository clinicDoctorRepository,
            AppointmentRepository appointmentRepository,
            UserRepository userRepository
    ) {
        this.clinicDoctorRepository = clinicDoctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/{clinicId}/doctors/{doctorId}")
    public ResponseEntity<?> addDoctor(@PathVariable Long clinicId, @PathVariable Long doctorId) {
        if (clinicDoctorRepository.findByClinicIdAndDoctorId(clinicId, doctorId).isPresent()) {
            return ResponseEntity.ok(Map.of("ok", true, "already", true));
        }
        clinicDoctorRepository.save(new ClinicDoctor(null, clinicId, doctorId));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @DeleteMapping("/{clinicId}/doctors/{doctorId}")
    public ResponseEntity<?> removeDoctor(@PathVariable Long clinicId, @PathVariable Long doctorId) {
        return clinicDoctorRepository.findByClinicIdAndDoctorId(clinicId, doctorId)
                .map(row -> {
                    clinicDoctorRepository.delete(row);
                    return ResponseEntity.ok(Map.of("ok", true));
                })
                .orElse(ResponseEntity.ok(Map.of("ok", true)));
    }

    @GetMapping("/{clinicId}/doctors")
    public ResponseEntity<List<Long>> listDoctors(@PathVariable Long clinicId) {
        return ResponseEntity.ok(clinicDoctorRepository.findDoctorIdsByClinicId(clinicId));
    }

    @GetMapping("/{clinicId}/patients")
    public ResponseEntity<List<ClinicPatientResponse>> listPatients(@PathVariable Long clinicId) {
        List<Long> doctorIds = clinicDoctorRepository.findDoctorIdsByClinicId(clinicId);
        if (doctorIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Long> patientIds = appointmentRepository.findDistinctPatientIdsByDoctorIdIn(doctorIds);
        if (patientIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<User> patients = userRepository.findAllById(patientIds);
        Map<Long, String> nameById = patients.stream().collect(Collectors.toMap(
                User::getId,
                u -> (u.getFirstName() == null ? "" : u.getFirstName()) + " " + (u.getLastName() == null ? "" : u.getLastName())
        ));

        List<ClinicPatientResponse> out = patientIds.stream()
                .distinct()
                .map(id -> new ClinicPatientResponse(id, nameById.getOrDefault(id, "Patient " + id).trim()))
                .toList();

        return ResponseEntity.ok(out);
    }
}


