package com.zenlink.zenlink.repository;

import com.zenlink.zenlink.model.DoctorProfile;
import com.zenlink.zenlink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Long> {
    @Query("SELECT dp FROM DoctorProfile dp JOIN FETCH dp.user WHERE dp.user = :user")
    Optional<DoctorProfile> findByUser(@Param("user") User user);
    
    @Query("SELECT dp FROM DoctorProfile dp JOIN FETCH dp.user WHERE dp.user.id = :userId")
    Optional<DoctorProfile> findByUserId(@Param("userId") Long userId);
}
