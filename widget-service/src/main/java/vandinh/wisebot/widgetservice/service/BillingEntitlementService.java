package vandinh.wisebot.widgetservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vandinh.wisebot.widgetservice.config.BillingProperties;
import vandinh.wisebot.widgetservice.dto.response.BillingEntitlementResponse;
import vandinh.wisebot.widgetservice.exception.InvalidDataException;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingEntitlementService {

    private final RestTemplate restTemplate;
    private final BillingProperties billingProperties;

    public BillingEntitlementResponse getEntitlements(UUID tenantId) {
        String url = billingProperties.getBaseUrl() + "/internal/billing/tenants/" + tenantId + "/entitlements";
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Api-Key", billingProperties.getInternalApiKey());

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
        Object data = response.getBody() != null ? response.getBody().get("data") : null;
        if (!(data instanceof Map<?, ?> payload)) {
            throw new InvalidDataException("Không thể lấy entitlement của gói hiện tại");
        }

        BillingEntitlementResponse result = new BillingEntitlementResponse();
        Object planCode = payload.get("planCode");
        result.setPlanCode(planCode != null ? String.valueOf(planCode) : "free");
        Object apiAccessEnabled = payload.get("apiAccessEnabled");
        result.setApiAccessEnabled(apiAccessEnabled instanceof Boolean value && value);
        Object widgetCustomizationEnabled = payload.get("widgetCustomizationEnabled");
        result.setWidgetCustomizationEnabled(!(widgetCustomizationEnabled instanceof Boolean value) || value);
        Object knowledgeBaseLimit = payload.get("knowledgeBaseLimit");
        result.setKnowledgeBaseLimit(knowledgeBaseLimit instanceof Number number ? number.intValue() : 1);
        Object monthlyMessageLimit = payload.get("monthlyMessageLimit");
        result.setMonthlyMessageLimit(monthlyMessageLimit instanceof Number number ? number.intValue() : 1000);
        Object customIntegrationEnabled = payload.get("customIntegrationEnabled");
        result.setCustomIntegrationEnabled(customIntegrationEnabled instanceof Boolean value && value);
        Object advancedAnalyticsEnabled = payload.get("advancedAnalyticsEnabled");
        result.setAdvancedAnalyticsEnabled(advancedAnalyticsEnabled instanceof Boolean value && value);
        Object unlimited = payload.get("unlimited");
        result.setUnlimited(unlimited instanceof Boolean value && value);
        return result;
    }
}
