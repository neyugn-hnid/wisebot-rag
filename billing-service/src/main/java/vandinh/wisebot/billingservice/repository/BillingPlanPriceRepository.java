package vandinh.wisebot.billingservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.billingservice.entity.BillingPlanPrice;

import java.util.List;
import java.util.UUID;

public interface BillingPlanPriceRepository extends JpaRepository<BillingPlanPrice, UUID> {
    List<BillingPlanPrice> findAllByPlan_IdOrderByEffectiveFromDesc(UUID planId);

    java.util.Optional<BillingPlanPrice> findFirstByPlan_IdAndBillingCycleOrderByEffectiveFromDesc(UUID planId, String billingCycle);
}
