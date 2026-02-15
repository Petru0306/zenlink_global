package com.zenlink.zenlink.repository;

import com.zenlink.zenlink.model.ClinicProfile;
import com.zenlink.zenlink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicProfileRepository extends JpaRepository<ClinicProfile, Long> {
    @Query("SELECT cp FROM ClinicProfile cp JOIN FETCH cp.user WHERE cp.user = :user")
    Optional<ClinicProfile> findByUser(@Param("user") User user);
    
    @Query("SELECT cp FROM ClinicProfile cp JOIN FETCH cp.user WHERE cp.user.id = :userId")
    Optional<ClinicProfile> findByUserId(@Param("userId") Long userId);
}
