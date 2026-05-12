package vandinh.wisebot.billingservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class VNPayCheckoutResponse {
    private UUID subscriptionId;
    private UUID invoiceId;
    private UUID paymentId;
    private String orderId;
    private int amountCents;
    private String currency;
    private String paymentUrl;
}
