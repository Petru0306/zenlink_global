package com.zenlink.zenlink.repository;

import com.zenlink.zenlink.model.ClinicDoctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClinicDoctorRepository extends JpaRepository<ClinicDoctor, Long> {

    Optional<ClinicDoctor> findByClinicIdAndDoctorId(Long clinicId, Long doctorId);

    @Query("select cd.doctorId from ClinicDoctor cd where cd.clinicId = :clinicId")
    List<Long> findDoctorIdsByClinicId(@Param("clinicId") Long clinicId);
}


