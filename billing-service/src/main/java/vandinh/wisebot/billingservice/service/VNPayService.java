package vandinh.wisebot.billingservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vandinh.wisebot.billingservice.config.VNPayConfig;
import vandinh.wisebot.billingservice.dto.request.CreateVNPayCheckoutRequest;
import vandinh.wisebot.billingservice.dto.response.VNPayCheckoutResponse;
import vandinh.wisebot.billingservice.dto.response.VNPayReturnResponse;
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

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VNPayService {

    private static final String PROVIDER = "VNPAY";
    private static final DateTimeFormatter VNPAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final VNPayConfig vnPayConfig;
    private final BillingPlanRepository planRepository;
    private final BillingPlanPriceRepository planPriceRepository;
    private final BillingSubscriptionRepository subscriptionRepository;
    private final BillingInvoiceRepository invoiceRepository;
    private final BillingInvoiceItemRepository invoiceItemRepository;
    private final BillingPaymentRepository paymentRepository;
    private final ObjectMapper objectMapper;

    @Transactional(rollbackFor = Exception.class)
    public VNPayCheckoutResponse createCheckout(CreateVNPayCheckoutRequest request, UUID tenantId, String clientIp) {
        String billingCycle = normalizeBillingCycle(request.getBillingCycle());
        BillingPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + request.getPlanId()));
        BillingPlanPrice price = planPriceRepository.findFirstByPlan_IdAndBillingCycleOrderByEffectiveFromDesc(plan.getId(), billingCycle)
                .orElseThrow(() -> new ResourceNotFoundException("No active price found for plan " + plan.getCode() + " and cycle " + billingCycle));

        BillingSubscription subscription = subscriptionRepository.findByTenantId(tenantId)
                .orElseGet(() -> createBootstrapSubscription(tenantId, plan));
        boolean bootstrapSubscription = subscription.getId() == null;
        if (bootstrapSubscription) {
            subscription = subscriptionRepository.save(subscription);
        }

        int seats = Math.max(request.getSeats(), 1);
        int totalAmountCents = price.getAmountCents() * seats;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dueAt = now.plusMinutes(15);
        String orderId = UUID.randomUUID().toString();

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

        invoiceItemRepository.save(BillingInvoiceItem.builder()
                .invoice(invoice)
                .itemType("SUBSCRIPTION")
                .description(plan.getName() + " - " + billingCycle)
                .quantity(seats)
                .unitAmountCents(price.getAmountCents())
                .amountCents(totalAmountCents)
                .metadata(toJson(Map.of(
                        "planId", plan.getId().toString(),
                        "billingCycle", billingCycle
                )))
                .build());

        BillingPayment payment = BillingPayment.builder()
                .invoice(invoice)
                .provider(PROVIDER)
                .providerPaymentId(orderId)
                .status("PENDING")
                .amountCents(totalAmountCents)
                .currency(price.getCurrency())
                .rawPayload(toJson(new HashMap<>(Map.of(
                        "tenantId", tenantId.toString(),
                        "targetPlanId", plan.getId().toString(),
                        "billingCycle", billingCycle,
                        "seats", seats,
                        "bootstrapSubscription", bootstrapSubscription
                ))))
                .build();
        payment = paymentRepository.save(payment);

        String paymentUrl = createPaymentUrl(toVnPayAmount(totalAmountCents),
                StringUtils.hasText(request.getOrderInfo()) ? request.getOrderInfo() : buildOrderInfo(plan, billingCycle, seats),
                orderId,
                clientIp);

        return VNPayCheckoutResponse.builder()
                .subscriptionId(subscription.getId())
                .invoiceId(invoice.getId())
                .paymentId(payment.getId())
                .orderId(orderId)
                .amountCents(totalAmountCents)
                .currency(price.getCurrency())
                .paymentUrl(paymentUrl)
                .build();
    }

    public String createPaymentUrl(long vnpAmount, String orderInfo, String orderId, String clientIp) {
        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(vnpAmount));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", orderId);
        vnpParams.put("vnp_OrderInfo", orderInfo);
        vnpParams.put("vnp_OrderType", "billing");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        vnpParams.put("vnp_IpAddr", StringUtils.hasText(clientIp) ? clientIp : "127.0.0.1");

        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        vnpParams.put("vnp_CreateDate", formatter.format(calendar.getTime()));
        calendar.add(Calendar.MINUTE, 15);
        vnpParams.put("vnp_ExpireDate", formatter.format(calendar.getTime()));

        String query = buildSignedQuery(vnpParams);
        return vnPayConfig.getPayUrl() + "?" + query;
    }

    @Transactional(rollbackFor = Exception.class)
    public VNPayReturnResponse handleReturn(Map<String, String> rawParams) {
        Map<String, String> params = new HashMap<>(rawParams);
        String orderId = params.get("vnp_TxnRef");
        BillingPayment payment = paymentRepository.findFirstByProviderAndProviderPaymentId(PROVIDER, orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order: " + orderId));

        boolean valid = verifyReturn(new HashMap<>(params));
        if (!valid) {
            payment.setRawPayload(toJson(params));
            paymentRepository.save(payment);
            return VNPayReturnResponse.builder()
                    .valid(false)
                    .status("INVALID_SIGNATURE")
                    .responseCode(params.get("vnp_ResponseCode"))
                    .transactionId(params.get("vnp_TransactionNo"))
                    .orderId(orderId)
                    .amount(params.get("vnp_Amount"))
                    .invoiceId(payment.getInvoice().getId())
                    .paymentId(payment.getId())
                    .subscriptionId(payment.getInvoice().getSubscription().getId())
                    .build();
        }

        BillingInvoice invoice = payment.getInvoice();
        BillingSubscription subscription = invoice.getSubscription();
        Map<String, Object> checkoutMetadata = readMetadata(payment.getRawPayload());
        boolean success = "00".equals(params.get("vnp_ResponseCode"))
                && (!params.containsKey("vnp_TransactionStatus") || "00".equals(params.get("vnp_TransactionStatus")));

        payment.setRawPayload(toJson(params));
        payment.setPaidAt(parseVnPayDate(params.get("vnp_PayDate")));
        payment.setStatus(success ? "SUCCESS" : "FAILED");

        if (success) {
            String targetPlanId = (String) checkoutMetadata.get("targetPlanId");
            String billingCycle = (String) checkoutMetadata.getOrDefault("billingCycle", "MONTHLY");
            int seats = toInt(checkoutMetadata.get("seats"), 1);
            BillingPlan targetPlan = planRepository.findById(UUID.fromString(targetPlanId))
                    .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + targetPlanId));

            subscription.setPlan(targetPlan);
            subscription.setStatus("ACTIVE");
            subscription.setSeats(seats);
            subscription.setCancelAtPeriodEnd(false);
            subscription.setCanceledAt(null);
            subscription.setCurrentPeriodStart(LocalDateTime.now());
            subscription.setCurrentPeriodEnd(calculatePeriodEnd(subscription.getCurrentPeriodStart(), billingCycle));

            invoice.setStatus("PAID");
            invoice.setPaidAt(payment.getPaidAt() != null ? payment.getPaidAt() : LocalDateTime.now());
        } else {
            invoice.setStatus("FAILED");
            if (Boolean.TRUE.equals(checkoutMetadata.get("bootstrapSubscription"))) {
                subscription.setStatus("FAILED");
            }
        }

        subscriptionRepository.save(subscription);
        invoiceRepository.save(invoice);
        paymentRepository.save(payment);

        return VNPayReturnResponse.builder()
                .valid(true)
                .status(success ? "SUCCESS" : "FAILED")
                .responseCode(params.get("vnp_ResponseCode"))
                .transactionId(params.get("vnp_TransactionNo"))
                .orderId(orderId)
                .amount(params.get("vnp_Amount"))
                .invoiceId(invoice.getId())
                .paymentId(payment.getId())
                .subscriptionId(subscription.getId())
                .build();
    }

    public boolean verifyReturn(Map<String, String> params) {
        String vnpSecureHash = params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");
        String calculatedHash = hmacSHA512(vnPayConfig.getHashSecret(), buildHashData(params));
        return calculatedHash.equalsIgnoreCase(vnpSecureHash);
    }

    private String buildSignedQuery(Map<String, String> vnpParams) {
        String hashData = buildHashData(vnpParams);
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        fieldNames.sort(String::compareTo);

        StringBuilder query = new StringBuilder();
        boolean first = true;
        for (String fieldName : fieldNames) {
            String fieldValue = vnpParams.get(fieldName);
            if (!StringUtils.hasText(fieldValue)) {
                continue;
            }
            if (!first) {
                query.append('&');
            }
            query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII))
                    .append('=')
                    .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
            first = false;
        }

        query.append("&vnp_SecureHashType=HmacSHA512");
        query.append("&vnp_SecureHash=").append(hmacSHA512(vnPayConfig.getHashSecret(), hashData));
        return query.toString();
    }

    private String buildHashData(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        fieldNames.sort(String::compareTo);

        StringBuilder hashData = new StringBuilder();
        boolean first = true;
        for (String fieldName : fieldNames) {
            String fieldValue = params.get(fieldName);
            if (!StringUtils.hasText(fieldValue)) {
                continue;
            }
            if (!first) {
                hashData.append('&');
            }
            hashData.append(fieldName)
                    .append('=')
                    .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
            first = false;
        }
        return hashData.toString();
    }

    private BillingSubscription createBootstrapSubscription(UUID tenantId, BillingPlan plan) {
        LocalDateTime now = LocalDateTime.now();
        return BillingSubscription.builder()
                .tenantId(tenantId)
                .plan(plan)
                .status("PENDING")
                .seats(1)
                .currentPeriodStart(now)
                .currentPeriodEnd(now.plusMonths(1))
                .cancelAtPeriodEnd(false)
                .build();
    }

    private String generateInvoiceNo() {
        return "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String buildOrderInfo(BillingPlan plan, String billingCycle, int seats) {
        return "Thanh toan goi " + plan.getName() + " - " + billingCycle + " - " + seats + " seat";
    }

    private long toVnPayAmount(int amountCents) {
        return Math.max(amountCents, 0) * 100L;
    }

    private String normalizeBillingCycle(String billingCycle) {
        if (!StringUtils.hasText(billingCycle)) {
            return "MONTHLY";
        }
        String normalized = billingCycle.trim().toUpperCase();
        if (!"MONTHLY".equals(normalized) && !"YEARLY".equals(normalized)) {
            throw new InvalidDataException("Unsupported billing cycle: " + billingCycle);
        }
        return normalized;
    }

    private LocalDateTime calculatePeriodEnd(LocalDateTime start, String billingCycle) {
        return "YEARLY".equalsIgnoreCase(billingCycle) ? start.plusYears(1) : start.plusMonths(1);
    }

    private LocalDateTime parseVnPayDate(String payDate) {
        if (!StringUtils.hasText(payDate)) {
            return LocalDateTime.now();
        }
        return LocalDateTime.parse(payDate, VNPAY_DATE_FORMAT);
    }

    private Map<String, Object> readMetadata(String json) {
        if (!StringUtils.hasText(json)) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (JsonProcessingException e) {
            log.warn("Unable to parse payment metadata: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private int toInt(Object value, int defaultValue) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String text && StringUtils.hasText(text)) {
            try {
                return Integer.parseInt(text);
            } catch (NumberFormatException ignored) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    private String toJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Unable to serialize VNPay payload", e);
        }
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmacSHA512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmacSHA512.init(secretKey);
            byte[] hash = hmacSHA512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC SHA512 failed", e);
        }
    }
}
