package vandinh.wisebot.billingservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.billingservice.common.response.ApiResponse;
import vandinh.wisebot.billingservice.exception.InvalidDataException;
import vandinh.wisebot.billingservice.service.BillingService;

import java.util.UUID;

@RestController
@RequestMapping("/internal/billing")
@RequiredArgsConstructor
public class InternalBillingController {

    private final BillingService billingService;

    @Value("${internal.api-key:wisebot-internal-key}")
    private String internalApiKey;

    @GetMapping("/tenants/{tenantId}/knowledge-base-limit")
    public ApiResponse getKnowledgeBaseLimit(@PathVariable UUID tenantId,
                                             @RequestHeader(value = "X-Internal-Api-Key", required = false) String providedKey) {
        validateInternalApiKey(providedKey);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Knowledge base limit")
                .data(billingService.getKnowledgeBaseLimit(tenantId))
                .build();
    }

    @GetMapping("/tenants/{tenantId}/entitlements")
    public ApiResponse getEntitlements(@PathVariable UUID tenantId,
                                       @RequestHeader(value = "X-Internal-Api-Key", required = false) String providedKey) {
        validateInternalApiKey(providedKey);

        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Entitlements")
                .data(billingService.getKnowledgeBaseLimit(tenantId))
                .build();
    }

    private void validateInternalApiKey(String providedKey) {
        if (!StringUtils.hasText(providedKey) || !internalApiKey.equals(providedKey)) {
            throw new InvalidDataException("Invalid internal api key");
        }
    }
}
