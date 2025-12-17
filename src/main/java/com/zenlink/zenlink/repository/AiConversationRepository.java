package com.zenlink.zenlink.repository;

import com.zenlink.zenlink.model.AiConversation;
import com.zenlink.zenlink.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {
    List<AiConversation> findByUserIdAndUserRoleAndScopeTypeAndScopeIdOrderByUpdatedAtDesc(
            Long userId,
            UserRole userRole,
            String scopeType,
            String scopeId
    );

    Optional<AiConversation> findByIdAndUserIdAndUserRoleAndScopeTypeAndScopeId(
            Long id,
            Long userId,
            UserRole userRole,
            String scopeType,
            String scopeId
    );
}


