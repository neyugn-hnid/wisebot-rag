package vandinh.wisebot.billingservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreatePlanPriceRequest {
    @NotNull
    private UUID planId;
    @NotBlank
    private String billingCycle;
    private String currency = "VND";
    @Min(0)
    private int amountCents;
    @Min(0)
    private int trialDays;
}
