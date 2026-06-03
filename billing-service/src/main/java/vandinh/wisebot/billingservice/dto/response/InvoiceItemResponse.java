package vandinh.wisebot.billingservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class InvoiceItemResponse {
    private UUID id;
    private UUID invoiceId;
    private String itemType;
    private String description;
    private double quantity;
    private int unitAmountCents;
    private int amountCents;
}
