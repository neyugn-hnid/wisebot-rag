package vandinh.wisebot.billingservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class VNPayReturnResponse {
    private boolean valid;
    private String status;
    private String responseCode;
    private String transactionId;
    private String orderId;
    private String amount;
    private UUID invoiceId;
    private UUID paymentId;
    private UUID subscriptionId;
}
