package com.zenlink.zenlink.repository;

import com.zenlink.zenlink.model.MedicalProfile;
import com.zenlink.zenlink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicalProfileRepository extends JpaRepository<MedicalProfile, Long> {
    Optional<MedicalProfile> findByUser(User user);
    
    @Query("SELECT mp FROM MedicalProfile mp WHERE mp.user.id = :userId")
    Optional<MedicalProfile> findByUserId(@Param("userId") Long userId);
}
