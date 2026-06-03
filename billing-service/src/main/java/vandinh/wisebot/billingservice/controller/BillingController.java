package vandinh.wisebot.billingservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.billingservice.common.response.ApiResponse;
import vandinh.wisebot.billingservice.dto.request.CreateInvoiceItemRequest;
import vandinh.wisebot.billingservice.dto.request.CreatePlanRequest;
import vandinh.wisebot.billingservice.dto.request.CreatePlanPriceRequest;
import vandinh.wisebot.billingservice.dto.request.UpdatePlanRequest;
import vandinh.wisebot.billingservice.dto.request.UpdatePlanPriceRequest;
import vandinh.wisebot.billingservice.dto.request.CreatePaymentRequest;
import vandinh.wisebot.billingservice.dto.request.CreateUsageEventRequest;
import vandinh.wisebot.billingservice.dto.request.CreateUsageMeterRequest;
import vandinh.wisebot.billingservice.dto.request.SubscribeRequest;
import vandinh.wisebot.billingservice.dto.request.DowngradeRequest;
import vandinh.wisebot.billingservice.dto.request.CreateVietQRCheckoutRequest;
import vandinh.wisebot.billingservice.service.BillingService;
import vandinh.wisebot.billingservice.service.VietQRService;
import vandinh.wisebot.billingservice.exception.InvalidDataException;

import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;
    private final VietQRService vietQRService;

    // ── Plans ────────────────────────────────────────────────────────────

    @PostMapping("/plans")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ApiResponse createPlan(@Valid @RequestBody CreatePlanRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Plan created")
                .data(billingService.createPlan(request))
                .build();
    }

    @GetMapping("/plans")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','USER')")
    public ApiResponse listPlans() {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Plans")
                .data(billingService.listPlans())
                .build();
    }

    @PutMapping("/plans/{planId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ApiResponse updatePlan(@PathVariable UUID planId,
                                  @RequestBody UpdatePlanRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Plan updated")
                .data(billingService.updatePlan(planId, request))
                .build();
    }

    @DeleteMapping("/plans/{planId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ApiResponse deletePlan(@PathVariable UUID planId) {
        billingService.deletePlan(planId);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Plan deactivated")
                .data(null)
                .build();
    }

    @PostMapping("/plan-prices")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse createPlanPrice(@Valid @RequestBody CreatePlanPriceRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Plan price created")
                .data(billingService.createPlanPrice(request))
                .build();
    }

    @GetMapping("/plan-prices")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','USER')")
    public ApiResponse listPlanPrices(@RequestParam UUID planId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Plan prices")
                .data(billingService.listPlanPrices(planId))
                .build();
    }

    @PutMapping("/plan-prices/{priceId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse updatePlanPrice(@PathVariable UUID priceId,
                                       @RequestBody UpdatePlanPriceRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Plan price updated")
                .data(billingService.updatePlanPrice(priceId, request))
                .build();
    }

    @DeleteMapping("/plan-prices/{priceId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse deletePlanPrice(@PathVariable UUID priceId) {
        billingService.deletePlanPrice(priceId);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Plan price deleted")
                .data(null)
                .build();
    }

    @PostMapping("/usage-meters")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse createUsageMeter(@Valid @RequestBody CreateUsageMeterRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Usage meter created")
                .data(billingService.createUsageMeter(request))
                .build();
    }

    @GetMapping("/usage-meters")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse listUsageMeters() {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Usage meters")
                .data(billingService.listUsageMeters())
                .build();
    }

    @PostMapping("/usage-events")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','AGENT')")
    public ApiResponse createUsageEvent(@Valid @RequestBody CreateUsageEventRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Usage event created")
                .data(billingService.createUsageEvent(request))
                .build();
    }

    @GetMapping("/usage-events")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse listUsageEvents(@RequestParam UUID tenantId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Usage events")
                .data(billingService.listUsageEvents(tenantId))
                .build();
    }

    @PostMapping("/subscriptions")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','USER')")
    public ApiResponse subscribe(@Valid @RequestBody SubscribeRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Subscribed")
                .data(billingService.subscribe(request))
                .build();
    }

    @GetMapping("/subscriptions/{tenantId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','USER')")
    public ApiResponse getSubscription(@PathVariable UUID tenantId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Subscription")
                .data(billingService.getSubscription(tenantId))
                .build();
    }

    @GetMapping("/subscriptions/me")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','USER')")
    public ApiResponse getMySubscription(@RequestHeader(value = "X-Tenant-Id", required = false) String tenantIdHeader) {
        UUID tenantId = parseTenantId(tenantIdHeader);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Subscription")
                .data(billingService.getSubscription(tenantId))
                .build();
    }

    @PostMapping("/subscriptions/me/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER')")
    public ApiResponse cancelMySubscription(@RequestHeader(value = "X-Tenant-Id", required = false) String tenantIdHeader) {
        UUID tenantId = parseTenantId(tenantIdHeader);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Subscription will be cancelled at period end")
                .data(billingService.cancelSubscription(tenantId))
                .build();
    }

    @PostMapping("/subscriptions/me/downgrade")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER')")
    public ApiResponse downgradeMySubscription(
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantIdHeader,
            @Valid @RequestBody DowngradeRequest request) {
        UUID tenantId = parseTenantId(tenantIdHeader);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Subscription downgraded")
                .data(billingService.downgradeSubscription(tenantId, request.getPlanId()))
                .build();
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','USER')")
    public ApiResponse listInvoices(@RequestParam UUID tenantId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Invoices")
                .data(billingService.listInvoices(tenantId))
                .build();
    }

    @GetMapping("/invoices/me")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','USER')")
    public ApiResponse listMyInvoices(@RequestHeader(value = "X-Tenant-Id", required = false) String tenantIdHeader) {
        UUID tenantId = parseTenantId(tenantIdHeader);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Invoices")
                .data(billingService.listInvoices(tenantId))
                .build();
    }

    @PostMapping("/invoice-items")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse createInvoiceItem(@Valid @RequestBody CreateInvoiceItemRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Invoice item created")
                .data(billingService.createInvoiceItem(request))
                .build();
    }

    @GetMapping("/invoice-items")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse listInvoiceItems(@RequestParam UUID invoiceId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Invoice items")
                .data(billingService.listInvoiceItems(invoiceId))
                .build();
    }

    @PostMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Payment created")
                .data(billingService.createPayment(request))
                .build();
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse listPayments(@RequestParam UUID invoiceId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Payments")
                .data(billingService.listPayments(invoiceId))
                .build();
    }

    // ── VietQR ──────────────────────────────────────────────────────────

    @PostMapping("/vietqr/checkout")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER')")
    public ApiResponse createVietQRCheckout(
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantIdHeader,
            @Valid @RequestBody CreateVietQRCheckoutRequest request) {
        UUID tenantId = parseTenantId(tenantIdHeader);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("VietQR checkout created")
                .data(vietQRService.createCheckout(request, tenantId))
                .build();
    }

    @PostMapping("/vietqr/confirm/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse confirmVietQRPayment(@PathVariable String orderId) {
        vietQRService.confirmPayment(orderId);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Payment confirmed")
                .data(null)
                .build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private UUID parseTenantId(String tenantIdHeader) {
        if (tenantIdHeader == null || tenantIdHeader.isBlank()) {
            throw new InvalidDataException("Missing tenant header");
        }
        try {
            return UUID.fromString(tenantIdHeader.trim());
        } catch (IllegalArgumentException ex) {
            throw new InvalidDataException("Invalid tenant header");
        }
    }
}
