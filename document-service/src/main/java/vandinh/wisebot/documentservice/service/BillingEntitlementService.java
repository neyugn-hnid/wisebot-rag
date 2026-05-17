package vandinh.wisebot.documentservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vandinh.wisebot.documentservice.config.BillingProperties;
import vandinh.wisebot.documentservice.dto.response.BillingLimitResponse;
import vandinh.wisebot.documentservice.exception.InvalidDataException;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingEntitlementService {

    private final RestTemplate restTemplate;
    private final BillingProperties billingProperties;

    public BillingLimitResponse getKnowledgeBaseLimit(UUID tenantId) {
        String url = billingProperties.getBaseUrl() + "/internal/billing/tenants/" + tenantId + "/entitlements";
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Api-Key", billingProperties.getInternalApiKey());

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
        Object data = response.getBody() != null ? response.getBody().get("data") : null;
        if (!(data instanceof Map<?, ?> payload)) {
            throw new InvalidDataException("Không thể lấy giới hạn gói hiện tại");
        }

        BillingLimitResponse result = new BillingLimitResponse();
        Object planCode = payload.get("planCode");
        result.setPlanCode(planCode != null ? String.valueOf(planCode) : "free");
        Object limit = payload.get("knowledgeBaseLimit");
        result.setKnowledgeBaseLimit(limit instanceof Number number ? number.intValue() : 1);
        Object documentUploadLimit = payload.get("documentUploadLimit");
        result.setDocumentUploadLimit(documentUploadLimit instanceof Number number ? number.intValue() : 10);
        Object storageLimitBytes = payload.get("storageLimitBytes");
        result.setStorageLimitBytes(storageLimitBytes instanceof Number number ? number.longValue() : 100L * 1024 * 1024);
        Object monthlyMessageLimit = payload.get("monthlyMessageLimit");
        result.setMonthlyMessageLimit(monthlyMessageLimit instanceof Number number ? number.intValue() : 1000);
        Object apiAccessEnabled = payload.get("apiAccessEnabled");
        result.setApiAccessEnabled(apiAccessEnabled instanceof Boolean value && value);
        Object customIntegrationEnabled = payload.get("customIntegrationEnabled");
        result.setCustomIntegrationEnabled(customIntegrationEnabled instanceof Boolean value && value);
        Object advancedAnalyticsEnabled = payload.get("advancedAnalyticsEnabled");
        result.setAdvancedAnalyticsEnabled(advancedAnalyticsEnabled instanceof Boolean value && value);
        Object unlimited = payload.get("unlimited");
        result.setUnlimited(unlimited instanceof Boolean value && value);
        return result;
    }
}
