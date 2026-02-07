package com.zenlink.zenlink.repository;

import com.zenlink.zenlink.model.ConsultationSegment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultationSegmentRepository extends JpaRepository<ConsultationSegment, Long> {
    List<ConsultationSegment> findByConsultationIdOrderByStartTsAsc(Long consultationId);
    
    List<ConsultationSegment> findByConsultationIdAndIdInOrderByStartTsAsc(Long consultationId, List<Long> segmentIds);
}
