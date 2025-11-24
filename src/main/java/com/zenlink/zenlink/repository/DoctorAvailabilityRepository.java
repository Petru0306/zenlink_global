package com.zenlink.zenlink.repository;

import com.zenlink.zenlink.model.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {
    List<DoctorAvailability> findByDoctorIdAndDateAndIsAvailableTrue(Long doctorId, LocalDate date);
    List<DoctorAvailability> findByDoctorIdAndIsAvailableTrue(Long doctorId);
    List<DoctorAvailability> findByDoctorId(Long doctorId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM DoctorAvailability d WHERE d.doctorId = :doctorId AND d.date = :date")
    void deleteByDoctorIdAndDate(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);
}

