package vandinh.wisebot.billingservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UsageEventResponse {
    private UUID id;
    private UUID tenantId;
    private UUID meterId;
    private String eventKey;
    private double quantity;
    private LocalDateTime occurredAt;
    private String metadata;
}
