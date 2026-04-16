package vandinh.wisebot.billingservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PaymentResponse {
    private UUID id;
    private UUID invoiceId;
    private String provider;
    private String providerPaymentId;
    private String status;
    private int amountCents;
    private String currency;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
