package com.zenlink.zenlink.repository;

import com.zenlink.zenlink.model.FinalizedConsultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinalizedConsultationRepository extends JpaRepository<FinalizedConsultation, Long> {
    List<FinalizedConsultation> findByDoctorIdOrderByConsultationDateDesc(Long doctorId);
    Optional<FinalizedConsultation> findByAppointmentId(Long appointmentId);
    List<FinalizedConsultation> findByPatientIdOrderByConsultationDateDesc(Long patientId);
}
