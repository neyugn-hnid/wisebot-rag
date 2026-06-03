package vandinh.wisebot.billingservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.billingservice.entity.BillingInvoiceItem;

import java.util.List;
import java.util.UUID;

public interface BillingInvoiceItemRepository extends JpaRepository<BillingInvoiceItem, UUID> {
    List<BillingInvoiceItem> findAllByInvoice_Id(UUID invoiceId);
}
