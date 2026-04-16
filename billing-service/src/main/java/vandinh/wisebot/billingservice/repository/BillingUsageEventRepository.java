package vandinh.wisebot.billingservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.billingservice.entity.BillingUsageEvent;

import java.util.List;
import java.util.UUID;

public interface BillingUsageEventRepository extends JpaRepository<BillingUsageEvent, UUID> {
    List<BillingUsageEvent> findTop100ByTenantIdOrderByOccurredAtDesc(UUID tenantId);
}
