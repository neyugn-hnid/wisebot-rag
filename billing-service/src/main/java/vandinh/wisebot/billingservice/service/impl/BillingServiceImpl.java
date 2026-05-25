package vandinh.wisebot.billingservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vandinh.wisebot.billingservice.dto.request.CreateInvoiceItemRequest;
import vandinh.wisebot.billingservice.dto.request.CreatePlanRequest;
import vandinh.wisebot.billingservice.dto.request.CreatePlanPriceRequest;
import vandinh.wisebot.billingservice.dto.request.UpdatePlanRequest;
import vandinh.wisebot.billingservice.dto.request.UpdatePlanPriceRequest;
import vandinh.wisebot.billingservice.dto.request.CreatePaymentRequest;
import vandinh.wisebot.billingservice.dto.request.CreateUsageEventRequest;
import vandinh.wisebot.billingservice.dto.request.CreateUsageMeterRequest;
import vandinh.wisebot.billingservice.dto.request.SubscribeRequest;
import vandinh.wisebot.billingservice.dto.response.BillingInvoiceResponse;
import vandinh.wisebot.billingservice.dto.response.BillingPlanResponse;
import vandinh.wisebot.billingservice.dto.response.BillingPlanPriceResponse;
import vandinh.wisebot.billingservice.dto.response.InvoiceItemResponse;
import vandinh.wisebot.billingservice.dto.response.InternalPlanLimitResponse;
import vandinh.wisebot.billingservice.dto.response.PaymentResponse;
import vandinh.wisebot.billingservice.dto.response.SubscriptionResponse;
import vandinh.wisebot.billingservice.dto.response.UsageEventResponse;
import vandinh.wisebot.billingservice.dto.response.UsageMeterResponse;
import vandinh.wisebot.billingservice.entity.BillingInvoice;
import vandinh.wisebot.billingservice.entity.BillingInvoiceItem;
import vandinh.wisebot.billingservice.entity.BillingPayment;
import vandinh.wisebot.billingservice.entity.BillingPlan;
import vandinh.wisebot.billingservice.entity.BillingPlanPrice;
import vandinh.wisebot.billingservice.entity.BillingSubscription;
import vandinh.wisebot.billingservice.entity.BillingUsageEvent;
import vandinh.wisebot.billingservice.entity.BillingUsageMeter;
import vandinh.wisebot.billingservice.exception.InvalidDataException;
import vandinh.wisebot.billingservice.exception.ResourceNotFoundException;
import vandinh.wisebot.billingservice.repository.BillingInvoiceRepository;
import vandinh.wisebot.billingservice.repository.BillingInvoiceItemRepository;
import vandinh.wisebot.billingservice.repository.BillingPaymentRepository;
import vandinh.wisebot.billingservice.repository.BillingPlanRepository;
import vandinh.wisebot.billingservice.repository.BillingPlanPriceRepository;
import vandinh.wisebot.billingservice.repository.BillingSubscriptionRepository;
import vandinh.wisebot.billingservice.repository.BillingUsageEventRepository;
import vandinh.wisebot.billingservice.repository.BillingUsageMeterRepository;
import vandinh.wisebot.billingservice.service.BillingService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private final BillingPlanRepository planRepository;
    private final BillingPlanPriceRepository planPriceRepository;
    private final BillingSubscriptionRepository subscriptionRepository;
    private final BillingInvoiceRepository invoiceRepository;
    private final BillingUsageMeterRepository usageMeterRepository;
    private final BillingUsageEventRepository usageEventRepository;
    private final BillingInvoiceItemRepository invoiceItemRepository;
    private final BillingPaymentRepository paymentRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BillingPlanResponse createPlan(CreatePlanRequest request) {
        BillingPlan plan = BillingPlan.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .active(true)
                .build();
        return mapPlan(planRepository.save(plan));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BillingPlanResponse updatePlan(UUID planId, UpdatePlanRequest request) {
        BillingPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + planId));
        if (request.getCode() != null && !request.getCode().isBlank()) {
            plan.setCode(request.getCode());
        }
        if (request.getName() != null && !request.getName().isBlank()) {
            plan.setName(request.getName());
        }
        if (request.getDescription() != null) {
            plan.setDescription(request.getDescription());
        }
        if (request.getActive() != null) {
            plan.setActive(request.getActive());
        }
        return mapPlan(planRepository.save(plan));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePlan(UUID planId) {
        BillingPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + planId));
        // Deactivate instead of hard-delete to preserve referential integrity
        plan.setActive(false);
        planRepository.save(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillingPlanResponse> listPlans() {
        return planRepository.findAll().stream().map(this::mapPlan).toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BillingPlanPriceResponse createPlanPrice(CreatePlanPriceRequest request) {
        BillingPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + request.getPlanId()));
        BillingPlanPrice price = BillingPlanPrice.builder()
                .plan(plan)
                .billingCycle(request.getBillingCycle())
                .currency(request.getCurrency())
                .amountCents(request.getAmountCents())
                .trialDays(request.getTrialDays())
                .build();
        return mapPlanPrice(planPriceRepository.save(price));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BillingPlanPriceResponse updatePlanPrice(UUID priceId, UpdatePlanPriceRequest request) {
        BillingPlanPrice price = planPriceRepository.findById(priceId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan price not found: " + priceId));
        if (request.getBillingCycle() != null && !request.getBillingCycle().isBlank()) {
            price.setBillingCycle(request.getBillingCycle());
        }
        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            price.setCurrency(request.getCurrency());
        }
        if (request.getAmountCents() != null && request.getAmountCents() >= 0) {
            price.setAmountCents(request.getAmountCents());
        }
        if (request.getTrialDays() != null && request.getTrialDays() >= 0) {
            price.setTrialDays(request.getTrialDays());
        }
        return mapPlanPrice(planPriceRepository.save(price));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePlanPrice(UUID priceId) {
        if (!planPriceRepository.existsById(priceId)) {
            throw new ResourceNotFoundException("Plan price not found: " + priceId);
        }
        planPriceRepository.deleteById(priceId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillingPlanPriceResponse> listPlanPrices(UUID planId) {
        return planPriceRepository.findAllByPlan_IdOrderByEffectiveFromDesc(planId)
                .stream()
                .map(this::mapPlanPrice)
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UsageMeterResponse createUsageMeter(CreateUsageMeterRequest request) {
        BillingUsageMeter meter = BillingUsageMeter.builder()
                .meterCode(request.getMeterCode())
                .meterName(request.getMeterName())
                .unit(request.getUnit())
                .aggregation(request.getAggregation())
                .active(true)
                .build();
        return mapUsageMeter(usageMeterRepository.save(meter));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsageMeterResponse> listUsageMeters() {
        return usageMeterRepository.findAll().stream().map(this::mapUsageMeter).toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UsageEventResponse createUsageEvent(CreateUsageEventRequest request) {
        BillingUsageMeter meter = usageMeterRepository.findById(request.getMeterId())
                .orElseThrow(() -> new ResourceNotFoundException("Usage meter not found: " + request.getMeterId()));
        BillingUsageEvent event = BillingUsageEvent.builder()
                .tenantId(request.getTenantId())
                .meter(meter)
                .eventKey(request.getEventKey())
                .quantity(request.getQuantity())
                .occurredAt(request.getOccurredAt() == null ? LocalDateTime.now() : request.getOccurredAt())
                .metadata(request.getMetadata() == null ? "{}" : request.getMetadata())
                .build();
        return mapUsageEvent(usageEventRepository.save(event));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsageEventResponse> listUsageEvents(UUID tenantId) {
        return usageEventRepository.findTop100ByTenantIdOrderByOccurredAtDesc(tenantId)
                .stream()
                .map(this::mapUsageEvent)
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SubscriptionResponse subscribe(SubscribeRequest request) {
        BillingPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + request.getPlanId()));

        BillingSubscription subscription = subscriptionRepository.findByTenantId(request.getTenantId())
                .orElse(BillingSubscription.builder().tenantId(request.getTenantId()).build());

        subscription.setPlan(plan);
        subscription.setStatus("ACTIVE");
        subscription.setSeats(request.getSeats());
        subscription.setCurrentPeriodStart(LocalDateTime.now());
        subscription.setCurrentPeriodEnd(LocalDateTime.now().plusMonths(1));
        subscription.setCancelAtPeriodEnd(false);

        return mapSubscription(subscriptionRepository.save(subscription));
    }

    @Override
    @Transactional(readOnly = true)
    public SubscriptionResponse getSubscription(UUID tenantId) {
        return subscriptionRepository.findByTenantId(tenantId)
                .map(this::mapSubscription)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found for tenant: " + tenantId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillingInvoiceResponse> listInvoices(UUID tenantId) {
        return invoiceRepository.findAllByTenantIdOrderByIssuedAtDesc(tenantId)
                .stream()
                .map(this::mapInvoice)
                .toList();
    }

        @Override
        @Transactional(rollbackFor = Exception.class)
        public InvoiceItemResponse createInvoiceItem(CreateInvoiceItemRequest request) {
        BillingInvoice invoice = invoiceRepository.findById(request.getInvoiceId())
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + request.getInvoiceId()));
        BillingInvoiceItem item = BillingInvoiceItem.builder()
            .invoice(invoice)
            .itemType(request.getItemType())
            .description(request.getDescription())
            .quantity(request.getQuantity())
            .unitAmountCents(request.getUnitAmountCents())
            .amountCents(request.getAmountCents())
            .metadata(request.getMetadata() == null ? "{}" : request.getMetadata())
            .build();
        return mapInvoiceItem(invoiceItemRepository.save(item));
        }

        @Override
        @Transactional(readOnly = true)
        public List<InvoiceItemResponse> listInvoiceItems(UUID invoiceId) {
        return invoiceItemRepository.findAllByInvoice_Id(invoiceId)
            .stream()
            .map(this::mapInvoiceItem)
            .toList();
        }

        @Override
        @Transactional(rollbackFor = Exception.class)
        public PaymentResponse createPayment(CreatePaymentRequest request) {
        BillingInvoice invoice = invoiceRepository.findById(request.getInvoiceId())
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + request.getInvoiceId()));
        BillingPayment payment = BillingPayment.builder()
            .invoice(invoice)
            .provider(request.getProvider())
            .providerPaymentId(request.getProviderPaymentId())
            .status(request.getStatus())
            .amountCents(request.getAmountCents())
            .currency(request.getCurrency())
            .paidAt(request.getPaidAt())
            .rawPayload(request.getRawPayload() == null ? "{}" : request.getRawPayload())
            .build();
        return mapPayment(paymentRepository.save(payment));
        }

        @Override
        @Transactional(readOnly = true)
    public List<PaymentResponse> listPayments(UUID invoiceId) {
        return paymentRepository.findAllByInvoice_IdOrderByCreatedAtDesc(invoiceId)
            .stream()
            .map(this::mapPayment)
            .toList();
        }

        @Override
        @Transactional(readOnly = true)
        public InternalPlanLimitResponse getKnowledgeBaseLimit(UUID tenantId) {
        BillingSubscription subscription = subscriptionRepository.findByTenantId(tenantId).orElse(null);
        String planCode = subscription != null && subscription.getPlan() != null
                ? subscription.getPlan().getCode()
                : "free";

        int limit = switch (planCode.toLowerCase()) {
            case "plus" -> 5;
            case "pro" -> -1;
            default -> 1;
        };
        int documentUploadLimit = switch (planCode.toLowerCase()) {
            case "plus" -> 200;
            case "pro" -> -1;
            default -> 10;
        };
        long storageLimitBytes = switch (planCode.toLowerCase()) {
            case "plus" -> 5L * 1024 * 1024 * 1024;
            case "pro" -> 50L * 1024 * 1024 * 1024;
            default -> 100L * 1024 * 1024;
        };
        int monthlyMessageLimit = switch (planCode.toLowerCase()) {
            case "plus" -> 10_000;
            case "pro" -> -1;
            default -> 1_000;
        };
        boolean apiAccessEnabled = true;
        boolean widgetCustomizationEnabled = !"free".equalsIgnoreCase(planCode);
        boolean customIntegrationEnabled = "pro".equalsIgnoreCase(planCode);
        boolean advancedAnalyticsEnabled = "pro".equalsIgnoreCase(planCode);

        return InternalPlanLimitResponse.builder()
                .planCode(planCode)
                .knowledgeBaseLimit(limit)
                .documentUploadLimit(documentUploadLimit)
                .storageLimitBytes(storageLimitBytes)
                .monthlyMessageLimit(monthlyMessageLimit)
                .apiAccessEnabled(apiAccessEnabled)
                .widgetCustomizationEnabled(widgetCustomizationEnabled)
                .customIntegrationEnabled(customIntegrationEnabled)
                .advancedAnalyticsEnabled(advancedAnalyticsEnabled)
                .unlimited(limit < 0 || documentUploadLimit < 0 || monthlyMessageLimit < 0)
                .build();
        }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SubscriptionResponse cancelSubscription(UUID tenantId) {
        BillingSubscription subscription = subscriptionRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found for tenant: " + tenantId));

        if ("CANCELLED".equals(subscription.getStatus())) {
            throw new InvalidDataException("Subscription is already cancelled");
        }

        // Đánh dấu hủy vào cuối kỳ (giữ quyền lợi đến hết chu kỳ)
        subscription.setCancelAtPeriodEnd(true);
        subscription.setCanceledAt(LocalDateTime.now());

        return mapSubscription(subscriptionRepository.save(subscription));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SubscriptionResponse downgradeSubscription(UUID tenantId, UUID newPlanId) {
        BillingSubscription subscription = subscriptionRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found for tenant: " + tenantId));

        if (!"ACTIVE".equals(subscription.getStatus())) {
            throw new InvalidDataException("Only active subscriptions can be downgraded. Current status: " + subscription.getStatus());
        }

        BillingPlan currentPlan = subscription.getPlan();
        if (currentPlan == null) {
            throw new InvalidDataException("Subscription has no plan assigned");
        }

        BillingPlan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + newPlanId));

        // Kiểm tra thực sự là downgrade (plan mới phải thấp hơn plan hiện tại)
        String currentCode = currentPlan.getCode().toLowerCase();
        String newCode = newPlan.getCode().toLowerCase();

        int currentTier = planTier(currentCode);
        int newTier = planTier(newCode);

        if (newTier >= currentTier) {
            throw new InvalidDataException(
                "New plan '" + newCode + "' is not lower than current plan '" + currentCode + "'. Use subscribe for upgrades."
            );
        }

        // Đổi plan, reset period về đầu chu kỳ mới
        subscription.setPlan(newPlan);
        subscription.setCurrentPeriodStart(LocalDateTime.now());
        subscription.setCurrentPeriodEnd(LocalDateTime.now().plusMonths(1));
        subscription.setCancelAtPeriodEnd(false);
        subscription.setCanceledAt(null);

        return mapSubscription(subscriptionRepository.save(subscription));
    }

    /** Xếp hạng plan: free=0, plus=1, pro=2 */
    private int planTier(String code) {
        return switch (code) {
            case "pro" -> 2;
            case "plus" -> 1;
            default -> 0;
        };
    }

    private BillingPlanResponse mapPlan(BillingPlan plan) {
        return BillingPlanResponse.builder()
                .id(plan.getId())
                .code(plan.getCode())
                .name(plan.getName())
                .description(plan.getDescription())
                .active(plan.isActive())
                .build();
    }

    private SubscriptionResponse mapSubscription(BillingSubscription sub) {
        return SubscriptionResponse.builder()
                .id(sub.getId())
                .tenantId(sub.getTenantId())
                .planId(sub.getPlan().getId())
                .status(sub.getStatus())
                .seats(sub.getSeats())
                .currentPeriodStart(sub.getCurrentPeriodStart())
                .currentPeriodEnd(sub.getCurrentPeriodEnd())
                .cancelAtPeriodEnd(sub.isCancelAtPeriodEnd())
                .canceledAt(sub.getCanceledAt())
                .build();
    }

    private BillingInvoiceResponse mapInvoice(BillingInvoice invoice) {
        return BillingInvoiceResponse.builder()
                .id(invoice.getId())
                .tenantId(invoice.getTenantId())
                .invoiceNo(invoice.getInvoiceNo())
                .status(invoice.getStatus())
                .currency(invoice.getCurrency())
                .totalCents(invoice.getTotalCents())
                .issuedAt(invoice.getIssuedAt())
                .build();
    }

    private BillingPlanPriceResponse mapPlanPrice(BillingPlanPrice price) {
        return BillingPlanPriceResponse.builder()
                .id(price.getId())
                .planId(price.getPlan().getId())
                .billingCycle(price.getBillingCycle())
                .currency(price.getCurrency())
                .amountCents(price.getAmountCents())
                .trialDays(price.getTrialDays())
                .effectiveFrom(price.getEffectiveFrom())
                .build();
    }

    private UsageMeterResponse mapUsageMeter(BillingUsageMeter meter) {
        return UsageMeterResponse.builder()
                .id(meter.getId())
                .meterCode(meter.getMeterCode())
                .meterName(meter.getMeterName())
                .unit(meter.getUnit())
                .aggregation(meter.getAggregation())
                .active(meter.isActive())
                .build();
    }

    private UsageEventResponse mapUsageEvent(BillingUsageEvent event) {
        return UsageEventResponse.builder()
                .id(event.getId())
                .tenantId(event.getTenantId())
                .meterId(event.getMeter().getId())
                .eventKey(event.getEventKey())
                .quantity(event.getQuantity())
                .occurredAt(event.getOccurredAt())
                .metadata(event.getMetadata())
                .build();
    }

    private InvoiceItemResponse mapInvoiceItem(BillingInvoiceItem item) {
        return InvoiceItemResponse.builder()
                .id(item.getId())
                .invoiceId(item.getInvoice().getId())
                .itemType(item.getItemType())
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unitAmountCents(item.getUnitAmountCents())
                .amountCents(item.getAmountCents())
                .build();
    }

    private PaymentResponse mapPayment(BillingPayment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .invoiceId(payment.getInvoice().getId())
                .provider(payment.getProvider())
                .providerPaymentId(payment.getProviderPaymentId())
                .status(payment.getStatus())
                .amountCents(payment.getAmountCents())
                .currency(payment.getCurrency())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
