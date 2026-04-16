package vandinh.wisebot.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vandinh.wisebot.userservice.common.enums.InviteStatus;
import vandinh.wisebot.userservice.entity.TenantInvite;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantInviteRepository extends JpaRepository<TenantInvite, UUID> {
    Optional<TenantInvite> findByTokenAndStatus(String token, InviteStatus status);
    boolean existsByTenant_IdAndEmailAndStatus(UUID tenantId, String email, InviteStatus status);
}
