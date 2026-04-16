package vandinh.wisebot.billingservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CreateUsageEventRequest {
    @NotNull
    private UUID tenantId;
    @NotNull
    private UUID meterId;
    @NotBlank
    private String eventKey;
    @Min(0)
    private double quantity;
    private LocalDateTime occurredAt;
    private String metadata;
}
