package vandinh.wisebot.billingservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BillingPlanPriceResponse {
    private UUID id;
    private UUID planId;
    private String billingCycle;
    private String currency;
    private int amountCents;
    private int trialDays;
    private LocalDateTime effectiveFrom;
}
