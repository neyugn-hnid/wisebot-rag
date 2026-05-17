package vandinh.wisebot.billingservice.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InternalPlanLimitResponse {
    private String planCode;
    private int knowledgeBaseLimit;
    private int documentUploadLimit;
    private long storageLimitBytes;
    private int monthlyMessageLimit;
    private boolean apiAccessEnabled;
    private boolean widgetCustomizationEnabled;
    private boolean customIntegrationEnabled;
    private boolean advancedAnalyticsEnabled;
    private boolean unlimited;
}
