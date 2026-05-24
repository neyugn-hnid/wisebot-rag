package vandinh.wisebot.billingservice.service;

import vandinh.wisebot.billingservice.dto.request.CreatePlanRequest;
import vandinh.wisebot.billingservice.dto.request.CreatePlanPriceRequest;
import vandinh.wisebot.billingservice.dto.request.CreateUsageMeterRequest;
import vandinh.wisebot.billingservice.dto.request.CreateUsageEventRequest;
import vandinh.wisebot.billingservice.dto.request.CreateInvoiceItemRequest;
import vandinh.wisebot.billingservice.dto.request.CreatePaymentRequest;
import vandinh.wisebot.billingservice.dto.request.SubscribeRequest;
import vandinh.wisebot.billingservice.dto.response.BillingPlanPriceResponse;
import vandinh.wisebot.billingservice.dto.response.BillingInvoiceResponse;
import vandinh.wisebot.billingservice.dto.response.BillingPlanResponse;
import vandinh.wisebot.billingservice.dto.response.InvoiceItemResponse;
import vandinh.wisebot.billingservice.dto.response.InternalPlanLimitResponse;
import vandinh.wisebot.billingservice.dto.response.PaymentResponse;
import vandinh.wisebot.billingservice.dto.response.SubscriptionResponse;
import vandinh.wisebot.billingservice.dto.response.UsageEventResponse;
import vandinh.wisebot.billingservice.dto.response.UsageMeterResponse;

import java.util.List;
import java.util.UUID;

public interface BillingService {
    BillingPlanResponse createPlan(CreatePlanRequest request);

    List<BillingPlanResponse> listPlans();

    BillingPlanPriceResponse createPlanPrice(CreatePlanPriceRequest request);

    List<BillingPlanPriceResponse> listPlanPrices(UUID planId);

    UsageMeterResponse createUsageMeter(CreateUsageMeterRequest request);

    List<UsageMeterResponse> listUsageMeters();

    UsageEventResponse createUsageEvent(CreateUsageEventRequest request);

    List<UsageEventResponse> listUsageEvents(UUID tenantId);

    SubscriptionResponse subscribe(SubscribeRequest request);

    SubscriptionResponse getSubscription(UUID tenantId);

    List<BillingInvoiceResponse> listInvoices(UUID tenantId);

    InvoiceItemResponse createInvoiceItem(CreateInvoiceItemRequest request);

    List<InvoiceItemResponse> listInvoiceItems(UUID invoiceId);

    PaymentResponse createPayment(CreatePaymentRequest request);

    List<PaymentResponse> listPayments(UUID invoiceId);

    InternalPlanLimitResponse getKnowledgeBaseLimit(UUID tenantId);

    SubscriptionResponse cancelSubscription(UUID tenantId);

    SubscriptionResponse downgradeSubscription(UUID tenantId, UUID newPlanId);
}
