package vandinh.wisebot.billingservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vandinh.wisebot.billingservice.config.VietQRConfig;
import vandinh.wisebot.billingservice.dto.request.CreateVietQRCheckoutRequest;
import vandinh.wisebot.billingservice.dto.response.VietQRCheckoutResponse;
import vandinh.wisebot.billingservice.entity.BillingInvoice;
import vandinh.wisebot.billingservice.entity.BillingInvoiceItem;
import vandinh.wisebot.billingservice.entity.BillingPayment;
import vandinh.wisebot.billingservice.entity.BillingPlan;
import vandinh.wisebot.billingservice.entity.BillingPlanPrice;
import vandinh.wisebot.billingservice.entity.BillingSubscription;
import vandinh.wisebot.billingservice.exception.InvalidDataException;
import vandinh.wisebot.billingservice.exception.ResourceNotFoundException;
import vandinh.wisebot.billingservice.repository.BillingInvoiceItemRepository;
import vandinh.wisebot.billingservice.repository.BillingInvoiceRepository;
import vandinh.wisebot.billingservice.repository.BillingPaymentRepository;
import vandinh.wisebot.billingservice.repository.BillingPlanPriceRepository;
import vandinh.wisebot.billingservice.repository.BillingPlanRepository;
import vandinh.wisebot.billingservice.repository.BillingSubscriptionRepository;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VietQRService {

    private static final String PROVIDER = "VIETQR";

    private final VietQRConfig vietQRConfig;
    private final BillingPlanRepository planRepository;
    private final BillingPlanPriceRepository planPriceRepository;
    private final BillingSubscriptionRepository subscriptionRepository;
    private final BillingInvoiceRepository invoiceRepository;
    private final BillingInvoiceItemRepository invoiceItemRepository;
    private final BillingPaymentRepository paymentRepository;

    /**
     * Tạo checkout VietQR: tạo invoice + payment + link QR image.
     */
    @Transactional(rollbackFor = Exception.class)
    public VietQRCheckoutResponse createCheckout(CreateVietQRCheckoutRequest request, UUID tenantId) {
        String billingCycle = normalizeBillingCycle(request.getBillingCycle());
        BillingPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + request.getPlanId()));
        BillingPlanPrice price = planPriceRepository
                .findFirstByPlan_IdAndBillingCycleOrderByEffectiveFromDesc(plan.getId(), billingCycle)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active price for plan " + plan.getCode() + " cycle " + billingCycle));

        // Lấy hoặc tạo subscription
        BillingSubscription subscription = subscriptionRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    BillingSubscription sub = BillingSubscription.builder()
                            .tenantId(tenantId)
                            .plan(plan)
                            .status("PENDING")
                            .seats(1)
                            .currentPeriodStart(now)
                            .currentPeriodEnd(now.plusMonths(1))
                            .cancelAtPeriodEnd(false)
                            .build();
                    return subscriptionRepository.save(sub);
                });

        int seats = Math.max(request.getSeats(), 1);
        int totalAmountCents = price.getAmountCents() * seats;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dueAt = now.plusHours(24);

        // Tạo hóa đơn
        String orderId = UUID.randomUUID().toString().substring(0, 8);
        BillingInvoice invoice = BillingInvoice.builder()
                .tenantId(tenantId)
                .subscription(subscription)
                .invoiceNo(generateInvoiceNo())
                .status("PENDING")
                .currency(price.getCurrency())
                .subtotalCents(totalAmountCents)
                .taxCents(0)
                .totalCents(totalAmountCents)
                .dueAt(dueAt)
                .build();
        invoice = invoiceRepository.save(invoice);

        // Tạo invoice item
        invoiceItemRepository.save(BillingInvoiceItem.builder()
                .invoice(invoice)
                .itemType("SUBSCRIPTION")
                .description(plan.getName() + " - " + billingCycle + " x" + seats)
                .quantity(seats)
                .unitAmountCents(price.getAmountCents())
                .amountCents(totalAmountCents)
                .metadata("{}")
                .build());

        // Tạo payment record
        BillingPayment payment = BillingPayment.builder()
                .invoice(invoice)
                .provider(PROVIDER)
                .providerPaymentId(orderId)
                .status("PENDING")
                .amountCents(totalAmountCents)
                .currency(price.getCurrency())
                .rawPayload("{}")
                .build();
        paymentRepository.save(payment);

        // Format số tiền: từ cents → VND
        int amountVnd = totalAmountCents;
        String description = "WISEBOT " + orderId;

        // Tạo QR image URL + deep link
        String qrImageUrl = buildQrImageUrl(amountVnd, description);
        String deepLink = buildDeepLink(amountVnd, description);

        log.info("VietQR checkout created: order={} amount={} tenant={}", orderId, amountVnd, tenantId);

        return VietQRCheckoutResponse.builder()
                .orderId(orderId)
                .invoiceId(invoice.getId())
                .amount(amountVnd)
                .currency(price.getCurrency())
                .description(description)
                .qrImageUrl(qrImageUrl)
                .deepLink(deepLink)
                .bankAccount(vietQRConfig.getAccountNo())
                .bankName(vietQRConfig.getBankCode())
                .accountName(vietQRConfig.getAccountName())
                .expiresAt(dueAt)
                .build();
    }

    /**
     * Admin/staff xác nhận thanh toán thủ công.
     */
    @Transactional(rollbackFor = Exception.class)
    public void confirmPayment(String orderId) {
        BillingPayment payment = paymentRepository
                .findFirstByProviderAndProviderPaymentId(PROVIDER, orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + orderId));

        if ("SUCCESS".equals(payment.getStatus())) {
            throw new InvalidDataException("Payment already confirmed");
        }

        BillingInvoice invoice = payment.getInvoice();
        payment.setStatus("SUCCESS");
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        invoice.setStatus("PAID");
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        // Kích hoạt subscription
        BillingSubscription subscription = invoice.getSubscription();
        if (subscription != null) {
            subscription.setStatus("ACTIVE");
            subscription.setCurrentPeriodStart(LocalDateTime.now());
            subscription.setCurrentPeriodEnd(LocalDateTime.now().plusMonths(1));
            subscription.setCancelAtPeriodEnd(false);
            subscriptionRepository.save(subscription);
        }

        log.info("VietQR payment confirmed: order={} invoice={} tenant={}",
                orderId, invoice.getId(), invoice.getTenantId());
    }

    // ── QR generation helpers ────────────────────────────────────────────

    private String buildQrImageUrl(int amountVnd, String description) {
        // Sử dụng vietqr.io API để tạo QR image
        return String.format(
                "https://img.vietqr.io/image/%s-%s-%s.jpg?amount=%d&addInfo=%s&accountName=%s",
                vietQRConfig.getBankCode(),
                vietQRConfig.getAccountNo(),
                vietQRConfig.getTemplate(),
                amountVnd,
                URLEncoder.encode(description, StandardCharsets.UTF_8),
                URLEncoder.encode(vietQRConfig.getAccountName(), StandardCharsets.UTF_8)
        );
    }

    private String buildDeepLink(int amountVnd, String description) {
        // Deep link mở app ngân hàng
        return String.format(
                "https://img.vietqr.io/image/%s-%s-compact.jpg?amount=%d&addInfo=%s&accountName=%s",
                vietQRConfig.getBankCode(),
                vietQRConfig.getAccountNo(),
                amountVnd,
                URLEncoder.encode(description, StandardCharsets.UTF_8),
                URLEncoder.encode(vietQRConfig.getAccountName(), StandardCharsets.UTF_8)
        );
    }

    private String generateInvoiceNo() {
        return "WBT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String normalizeBillingCycle(String cycle) {
        if (cycle == null || cycle.isBlank()) return "MONTHLY";
        String upper = cycle.trim().toUpperCase();
        return switch (upper) {
            case "YEARLY", "ANNUAL" -> "YEARLY";
            default -> "MONTHLY";
        };
    }
}
