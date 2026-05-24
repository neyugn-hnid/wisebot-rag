package vandinh.wisebot.billingservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVietQRCheckoutRequest {

    @NotNull(message = "Plan ID is required")
    private UUID planId;

    private String billingCycle = "MONTHLY";

    @Min(1)
    private int seats = 1;
}
