package vandinh.wisebot.billingservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.billingservice.entity.BillingPlan;

import java.util.Optional;
import java.util.UUID;

public interface BillingPlanRepository extends JpaRepository<BillingPlan, UUID> {
    Optional<BillingPlan> findByCode(String code);
}
