import { fetchWithAuth, getStoredAccessToken } from '../lib/auth';


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


export async function listPlans(): Promise<BillingPlanResponse[]> {
  const res = await fetchWithAuth(`${BILLING_BASE}/plans`);
  return handleResponse<BillingPlanResponse[]>(res);
}

export async function listPlanPrices(planId: string): Promise<BillingPlanPriceResponse[]> {
  const res = await fetchWithAuth(`${BILLING_BASE}/plan-prices?planId=${planId}`);
  return handleResponse<BillingPlanPriceResponse[]>(res);
}

export async function getSubscription(tenantId: string): Promise<SubscriptionResponse | null> {
  const res = await fetchWithAuth(`${BILLING_BASE}/subscriptions/${tenantId}`);
  if (res.status === 404) return null;
  return handleResponse<SubscriptionResponse>(res);
}

export async function getMySubscription(): Promise<SubscriptionResponse | null> {
  const tenantId = resolveTenantIdFromToken();
  if (!tenantId) return null;
  return getSubscription(tenantId);
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
  const tenantId = resolveTenantIdFromToken();
  if (!tenantId) return [];
  return listInvoices(tenantId);
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


export interface CreatePaymentUrlResponse {
  paymentUrl: string;
}

export async function createPaymentUrl(amount: number, orderInfo: string, orderId: string): Promise<CreatePaymentUrlResponse> {
  const res = await fetchWithAuth(`${BILLING_BASE}/payments/create-payment-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, orderInfo, orderId }),
  });
  return handleResponse<CreatePaymentUrlResponse>(res);
}
