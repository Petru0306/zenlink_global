package com.zenlink.zenlink.repository;

import com.zenlink.zenlink.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDoctorId(Long doctorId);
    List<Appointment> findByPatientId(Long patientId);
    List<Appointment> findByDoctorIdAndDate(Long doctorId, LocalDate date);
    List<Appointment> findByPatientIdAndDate(Long patientId, LocalDate date);
    Optional<Appointment> findByDoctorIdAndDateAndTime(Long doctorId, LocalDate date, LocalTime time);
    List<Appointment> findByDoctorIdAndDateAndStatus(Long doctorId, LocalDate date, String status);
}

