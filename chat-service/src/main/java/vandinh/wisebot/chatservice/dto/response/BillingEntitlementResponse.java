package vandinh.wisebot.chatservice.dto.response;

import lombok.Data;

@Data
public class BillingEntitlementResponse {
    private String planCode;
    private int knowledgeBaseLimit;
    private int monthlyMessageLimit;
    private boolean apiAccessEnabled;
    private boolean customIntegrationEnabled;
    private boolean advancedAnalyticsEnabled;
    private boolean unlimited;
}
