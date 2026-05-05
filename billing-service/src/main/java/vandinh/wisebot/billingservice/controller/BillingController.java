package vandinh.wisebot.billingservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.billingservice.common.response.ApiResponse;
import vandinh.wisebot.billingservice.dto.request.CreateInvoiceItemRequest;
import vandinh.wisebot.billingservice.dto.request.CreatePlanRequest;
import vandinh.wisebot.billingservice.dto.request.CreatePlanPriceRequest;
import vandinh.wisebot.billingservice.dto.request.CreatePaymentRequest;
import vandinh.wisebot.billingservice.dto.request.CreateUsageEventRequest;
import vandinh.wisebot.billingservice.dto.request.CreateUsageMeterRequest;
import vandinh.wisebot.billingservice.dto.request.SubscribeRequest;
import vandinh.wisebot.billingservice.service.BillingService;

import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/plans")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ApiResponse createPlan(@Valid @RequestBody CreatePlanRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Tạo gói cước thành công")
                .data(billingService.createPlan(request))
                .build();
    }

    @GetMapping("/plans")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','USER')")
    public ApiResponse listPlans() {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Danh sách gói cước")
                .data(billingService.listPlans())
                .build();
    }

    @PostMapping("/plan-prices")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse createPlanPrice(@Valid @RequestBody CreatePlanPriceRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Tạo giá gói cước thành công")
                .data(billingService.createPlanPrice(request))
                .build();
    }

    @GetMapping("/plan-prices")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','USER')")
    public ApiResponse listPlanPrices(@RequestParam UUID planId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Danh sách giá gói cước")
                .data(billingService.listPlanPrices(planId))
                .build();
    }

    @PostMapping("/usage-meters")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse createUsageMeter(@Valid @RequestBody CreateUsageMeterRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Tạo usage meter thành công")
                .data(billingService.createUsageMeter(request))
                .build();
    }

    @GetMapping("/usage-meters")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse listUsageMeters() {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Danh sách usage meters")
                .data(billingService.listUsageMeters())
                .build();
    }

    @PostMapping("/usage-events")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','AGENT')")
    public ApiResponse createUsageEvent(@Valid @RequestBody CreateUsageEventRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Tạo usage event thành công")
                .data(billingService.createUsageEvent(request))
                .build();
    }

    @GetMapping("/usage-events")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse listUsageEvents(@RequestParam UUID tenantId) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Danh sách usage events")
                .data(billingService.listUsageEvents(tenantId))
                .build();
    }

    @PostMapping("/subscriptions")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse subscribe(@Valid @RequestBody SubscribeRequest request) {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Đăng ký thành công")
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

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE')")
    public ApiResponse listInvoices(@RequestParam UUID tenantId) {
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
}
