package com.zenlink.zenlink.repository;

import com.zenlink.zenlink.model.ReferralCode;
import com.zenlink.zenlink.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReferralCodeRepository extends JpaRepository<ReferralCode, Long> {
    Optional<ReferralCode> findByCodeAndRoleAndIsUsedFalse(String code, UserRole role);
    boolean existsByCode(String code);
}

