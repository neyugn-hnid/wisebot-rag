package vandinh.wisebot.billingservice.dto.request;

import lombok.Data;

@Data
public class UpdatePlanPriceRequest {
    private String billingCycle;
    private String currency;
    private Integer amountCents;
    private Integer trialDays;
}
