package vandinh.wisebot.billingservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.billingservice.entity.BillingInvoice;

import java.util.List;
import java.util.UUID;

public interface BillingInvoiceRepository extends JpaRepository<BillingInvoice, UUID> {
    List<BillingInvoice> findAllByTenantIdOrderByIssuedAtDesc(UUID tenantId);
}
