package vandinh.wisebot.billingservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateVNPayCheckoutRequest {
    @NotNull
    private UUID planId;

    private String billingCycle = "MONTHLY";

    @Min(1)
    private int seats = 1;

    private String orderInfo;
}
