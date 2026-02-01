package com.zenlink.zenlink.repository;

import com.zenlink.zenlink.model.PsychProfile;
import com.zenlink.zenlink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PsychProfileRepository extends JpaRepository<PsychProfile, Long> {
    Optional<PsychProfile> findByUser(User user);
    Optional<PsychProfile> findByUserId(Long userId);
}

