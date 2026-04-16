package vandinh.wisebot.billingservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class BillingPlanResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private boolean active;
}
