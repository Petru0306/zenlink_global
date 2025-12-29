package com.zenlink.zenlink.repository;

import com.zenlink.zenlink.model.PatientFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PatientFileRepository extends JpaRepository<PatientFile, UUID> {
    List<PatientFile> findByPatientIdOrderBySortRankDescUploadedAtDesc(Long patientId);
}


