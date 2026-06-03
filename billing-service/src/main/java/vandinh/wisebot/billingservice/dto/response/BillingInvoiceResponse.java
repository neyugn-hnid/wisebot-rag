package vandinh.wisebot.billingservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BillingInvoiceResponse {
    private UUID id;
    private UUID tenantId;
    private String invoiceNo;
    private String status;
    private String currency;
    private int totalCents;
    private LocalDateTime issuedAt;
}
