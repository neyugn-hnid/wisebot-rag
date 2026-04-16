package vandinh.wisebot.billingservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.billingservice.entity.BillingPayment;

import java.util.List;
import java.util.UUID;

public interface BillingPaymentRepository extends JpaRepository<BillingPayment, UUID> {
    List<BillingPayment> findAllByInvoice_IdOrderByCreatedAtDesc(UUID invoiceId);
}
