package vandinh.wisebot.billingservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CreatePaymentRequest {
    @NotNull
    private UUID invoiceId;
    @NotBlank
    private String provider;
    private String providerPaymentId;
    @NotBlank
    private String status;
    @Min(0)
    private int amountCents;
    private String currency = "VND";
    private LocalDateTime paidAt;
    private String rawPayload;
}
