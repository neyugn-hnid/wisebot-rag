package vandinh.wisebot.billingservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.billingservice.entity.BillingSubscription;

import java.util.Optional;
import java.util.UUID;

public interface BillingSubscriptionRepository extends JpaRepository<BillingSubscription, UUID> {
    Optional<BillingSubscription> findByTenantId(UUID tenantId);
}
