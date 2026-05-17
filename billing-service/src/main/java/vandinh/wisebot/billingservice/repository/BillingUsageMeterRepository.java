package vandinh.wisebot.billingservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.billingservice.entity.BillingUsageMeter;

import java.util.UUID;

public interface BillingUsageMeterRepository extends JpaRepository<BillingUsageMeter, UUID> {
}
