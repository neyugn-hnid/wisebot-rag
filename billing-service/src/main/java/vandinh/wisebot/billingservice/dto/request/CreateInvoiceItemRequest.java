package vandinh.wisebot.billingservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateInvoiceItemRequest {
    @NotNull
    private UUID invoiceId;
    @NotBlank
    private String itemType;
    @NotBlank
    private String description;
    @Min(0)
    private double quantity = 1;
    @Min(0)
    private int unitAmountCents;
    @Min(0)
    private int amountCents;
    private String metadata;
}
