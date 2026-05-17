package vandinh.wisebot.billingservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SubscribeRequest {
    @NotNull
    private UUID tenantId;
    @NotNull
    private UUID planId;
    @Min(1)
    private int seats = 1;
}
