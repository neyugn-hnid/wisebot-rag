package vandinh.wisebot.documentservice.dto.response;

import lombok.Data;

@Data
public class BillingLimitResponse {
    private String planCode;
    private int knowledgeBaseLimit;
    private int documentUploadLimit;
    private long storageLimitBytes;
    private int monthlyMessageLimit;
    private boolean apiAccessEnabled;
    private boolean customIntegrationEnabled;
    private boolean advancedAnalyticsEnabled;
    private boolean unlimited;
}
