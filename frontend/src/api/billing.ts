import { fetchWithAuth, getStoredAccessToken } from '../lib/auth';

// --- Types matching backend DTOs ---

export interface BillingPlanResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export interface BillingPlanPriceResponse {
  id: string;
  planId: string;
  billingCycle: string; // MONTHLY, YEARLY
  currency: string;
  amountCents: number;
  trialDays: number;
  effectiveFrom: string;
}

export interface SubscriptionResponse {
  id: string;
  tenantId: string;
  planId: string;
  status: string; // ACTIVE, CANCELED, PAST_DUE
  seats: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface BillingInvoiceResponse {
  id: string;
  tenantId: string;
  invoiceNo: string;
  status: string; // PAID, PENDING, REFUNDED
  currency: string;
  totalCents: number;
  issuedAt: string;
}

export interface PaymentResponse {
  id: string;
  invoiceId: string;
  provider: string;
  providerPaymentId: string;
  status: string;
  amountCents: number;
  currency: string;
  paidAt: string;
}

// --- API payloads ---

export interface SubscribeRequest {
  tenantId: string;
  planId: string;
  seats?: number;
}

export interface CreatePaymentRequest {
  invoiceId: string;
  provider: string;
  providerPaymentId?: string;
  status: string;
  amountCents: number;
  currency?: string;
  paidAt?: string;
}

// --- Helper ---

const BILLING_BASE = '/api/billing';

function resolveTenantIdFromToken(): string {
  try {
    const token = getStoredAccessToken();
    if (!token) return '';
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return '';
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    return typeof payload?.tenantId === 'string' ? payload.tenantId.trim() : '';
  } catch {
    return '';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed: ${response.status}`);
  }
  const body = await response.json() as { data?: T; message?: string };
  return (body.data ?? body) as T;
}

// --- API functions ---

export async function listPlans(): Promise<BillingPlanResponse[]> {
  const res = await fetchWithAuth(`${BILLING_BASE}/plans`);
  return handleResponse<BillingPlanResponse[]>(res);
}

export interface CreatePlanRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdatePlanRequest {
  code?: string;
  name?: string;
  description?: string;
  active?: boolean;
}

export async function createPlan(request: CreatePlanRequest): Promise<BillingPlanResponse> {
  const res = await fetchWithAuth(`${BILLING_BASE}/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<BillingPlanResponse>(res);
}

export async function updatePlan(planId: string, request: UpdatePlanRequest): Promise<BillingPlanResponse> {
  const res = await fetchWithAuth(`${BILLING_BASE}/plans/${planId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<BillingPlanResponse>(res);
}

export async function deletePlan(planId: string): Promise<void> {
  const res = await fetchWithAuth(`${BILLING_BASE}/plans/${planId}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed: ${res.status}`);
  }
}

export async function listPlanPrices(planId: string): Promise<BillingPlanPriceResponse[]> {
  const res = await fetchWithAuth(`${BILLING_BASE}/plan-prices?planId=${planId}`);
  return handleResponse<BillingPlanPriceResponse[]>(res);
}

export interface CreatePlanPriceRequest {
  planId: string;
  billingCycle: string;
  currency?: string;
  amountCents: number;
  trialDays?: number;
}

export interface UpdatePlanPriceRequest {
  billingCycle?: string;
  currency?: string;
  amountCents?: number;
  trialDays?: number;
}

export async function createPlanPrice(request: CreatePlanPriceRequest): Promise<BillingPlanPriceResponse> {
  const res = await fetchWithAuth(`${BILLING_BASE}/plan-prices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<BillingPlanPriceResponse>(res);
}

export async function updatePlanPrice(priceId: string, request: UpdatePlanPriceRequest): Promise<BillingPlanPriceResponse> {
  const res = await fetchWithAuth(`${BILLING_BASE}/plan-prices/${priceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<BillingPlanPriceResponse>(res);
}

export async function deletePlanPrice(priceId: string): Promise<void> {
  const res = await fetchWithAuth(`${BILLING_BASE}/plan-prices/${priceId}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed: ${res.status}`);
  }
}

export async function getSubscription(tenantId: string): Promise<SubscriptionResponse | null> {
  const res = await fetchWithAuth(`${BILLING_BASE}/subscriptions/${tenantId}`);
  if (res.status === 404) return null;
  return handleResponse<SubscriptionResponse>(res);
}

export async function getMySubscription(): Promise<SubscriptionResponse | null> {
  const res = await fetchWithAuth(`${BILLING_BASE}/subscriptions/me`);
  if (res.status === 404) return null;
  return handleResponse<SubscriptionResponse>(res);
}

export async function subscribe(request: SubscribeRequest): Promise<SubscriptionResponse> {
  const res = await fetchWithAuth(`${BILLING_BASE}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<SubscriptionResponse>(res);
}

export async function mySubscribe(planId: string, seats = 1): Promise<SubscriptionResponse> {
  const tenantId = resolveTenantIdFromToken();
  if (!tenantId) throw new Error('No tenant ID found');
  return subscribe({ tenantId, planId, seats });
}

export async function listInvoices(tenantId: string): Promise<BillingInvoiceResponse[]> {
  const res = await fetchWithAuth(`${BILLING_BASE}/invoices?tenantId=${tenantId}`);
  return handleResponse<BillingInvoiceResponse[]>(res);
}

export async function listMyInvoices(): Promise<BillingInvoiceResponse[]> {
  const res = await fetchWithAuth(`${BILLING_BASE}/invoices/me`);
  if (res.status === 404) return [];
  return handleResponse<BillingInvoiceResponse[]>(res);
}

export async function createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
  const res = await fetchWithAuth(`${BILLING_BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<PaymentResponse>(res);
}

export async function listPayments(invoiceId: string): Promise<PaymentResponse[]> {
  const res = await fetchWithAuth(`${BILLING_BASE}/payments?invoiceId=${invoiceId}`);
  return handleResponse<PaymentResponse[]>(res);
}

// --- VNPay ---

export interface CreatePaymentUrlResponse {
  paymentUrl: string;
}

export interface CreateVNPayCheckoutRequest {
  planId: string;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  seats?: number;
  orderInfo?: string;
}

export interface CreateVNPayCheckoutResponse {
  subscriptionId: string;
  invoiceId: string;
  paymentId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  paymentUrl: string;
}

export interface VNPayReturnResponse {
  valid: boolean;
  status: string;
  responseCode: string;
  transactionId: string;
  orderId: string;
  amount: string;
  invoiceId: string;
  paymentId: string;
  subscriptionId: string;
}

export async function createVNPayCheckout(request: CreateVNPayCheckoutRequest): Promise<CreateVNPayCheckoutResponse> {
  const res = await fetchWithAuth(`${BILLING_BASE}/payments/vnpay/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<CreateVNPayCheckoutResponse>(res);
}

export async function verifyVNPayReturn(search: string | URLSearchParams): Promise<VNPayReturnResponse> {
  const query = typeof search === 'string'
    ? search.replace(/^\?/, '')
    : search.toString();
  const res = await fetchWithAuth(`${BILLING_BASE}/payments/vnpay-return?${query}`);
  return handleResponse<VNPayReturnResponse>(res);
}

// --- VietQR ---

export interface CreateVietQRCheckoutRequest {
  planId: string;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  seats?: number;
}

export interface VietQRCheckoutResponse {
  orderId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  description: string;
  qrImageUrl: string;
  deepLink: string;
  bankAccount: string;
  bankName: string;
  accountName: string;
  expiresAt: string;
}

export async function createVietQRCheckout(request: CreateVietQRCheckoutRequest): Promise<VietQRCheckoutResponse> {
  const res = await fetchWithAuth(`${BILLING_BASE}/vietqr/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<VietQRCheckoutResponse>(res);
}

// --- System Config ---

export interface VietQRConfigResponse {
  bankCode: string;
  accountNo: string;
  accountName: string;
  template: string;
}

export interface VietQRConfigRequest {
  bankCode?: string;
  accountNo?: string;
  accountName?: string;
}

export async function getVietQRConfig(): Promise<VietQRConfigResponse> {
  const res = await fetchWithAuth(`${BILLING_BASE}/system-config/vietqr`);
  return handleResponse<VietQRConfigResponse>(res);
}

export async function updateVietQRConfig(request: VietQRConfigRequest): Promise<VietQRConfigResponse> {
  const res = await fetchWithAuth(`${BILLING_BASE}/system-config/vietqr`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<VietQRConfigResponse>(res);
}

export interface VietQRBank {
  id: number;
  code: string;
  bin: string;
  name: string;
  shortName: string;
  logo: string;
}

export async function getVietQRBanks(): Promise<{ data: VietQRBank[] }> {
  const res = await fetch('https://api.vietqr.io/v2/banks');
  if (!res.ok) throw new Error('Cannot fetch banks');
  return res.json();
}
