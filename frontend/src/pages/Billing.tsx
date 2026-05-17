import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Crown,
  Download,
  DollarSign,
  History,
  Loader2,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useRole } from '../contexts/RoleContext';
import {
  listPlans,
  listPlanPrices,
  getMySubscription,
  listMyInvoices,
  verifyVNPayReturn,
  type BillingPlanResponse,
  type BillingPlanPriceResponse,
  type SubscriptionResponse,
  type BillingInvoiceResponse,
} from '../api/billing';

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: string;
}

function formatCurrency(amount: number, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const fallbackPlans: BillingPlanResponse[] = [
  { id: 'free', code: 'free', name: 'Free', description: '1.000 tin nhắn/tháng\n1 kho tri thức\nHỗ trợ tiêu chuẩn', active: true },
  { id: 'plus', code: 'plus', name: 'Plus', description: '10.000 tin nhắn/tháng\n5 kho tri thức\nTruy cập API', active: true },
  { id: 'pro', code: 'pro', name: 'Pro', description: 'Không giới hạn tin nhắn\nKhông giới hạn kho tri thức\nPhân tích nâng cao', active: true },
];

const fallbackPrices: Record<string, number> = {
  Free: 0,
  Plus: 501581,
  Pro: 1293551,
};

export default function Billing() {
  const { t, language } = useLanguage();
  const { role } = useRole();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [currentPlan, setCurrentPlan] = useState('Free');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [backendPlans, setBackendPlans] = useState<BillingPlanResponse[]>([]);
  const [backendPlanPrices, setBackendPlanPrices] = useState<BillingPlanPriceResponse[]>([]);
  const [backendSubscription, setBackendSubscription] = useState<SubscriptionResponse | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingSub, setLoadingSub] = useState(true);

  async function fetchBackendData() {
    const [plans, subscription, invoicesResult] = await Promise.all([
      listPlans().catch(() => [] as BillingPlanResponse[]),
      getMySubscription().catch(() => null as SubscriptionResponse | null),
      listMyInvoices().catch(() => [] as BillingInvoiceResponse[]),
    ]);

    setBackendPlans(plans);
    setBackendSubscription(subscription);

    const prices = plans.length > 0
      ? await Promise.all(plans.map((plan) => listPlanPrices(plan.id).catch(() => [] as BillingPlanPriceResponse[])))
      : [];
    setBackendPlanPrices(prices.flat());

    if (subscription && plans.length > 0) {
      const activePlan = plans.find((plan) => plan.id === subscription.planId);
      if (activePlan) setCurrentPlan(activePlan.name);
    }

    setInvoices(invoicesResult.map((invoice) => ({
      id: invoice.invoiceNo || invoice.id,
      date: new Date(invoice.issuedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      amount: formatCurrency(invoice.totalCents, invoice.currency || 'VND'),
      status: invoice.status,
    })));
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await fetchBackendData();
      } catch {
        // Keep billing page usable when billing APIs are unavailable.
      } finally {
        if (!cancelled) {
          setLoadingPlans(false);
          setLoadingSub(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasVNPayResult = params.get('vnpay_return') === 'true' && params.has('vnp_ResponseCode');
    if (!hasVNPayResult) return;

    let cancelled = false;

    async function processVNPayReturn() {
      try {
        const result = await verifyVNPayReturn(params);
        if (cancelled) return;
        showToast(
          result.valid && result.status === 'SUCCESS'
            ? 'Thanh toán VNPay thành công'
            : 'Thanh toán VNPay chưa thành công',
          result.valid && result.status === 'SUCCESS' ? 'success' : 'error',
        );
        await fetchBackendData();
      } catch (error) {
        if (!cancelled) {
          showToast(error instanceof Error ? error.message : 'Không thể xác minh giao dịch VNPay', 'error');
        }
      } finally {
        if (!cancelled) {
          navigate(location.pathname, { replace: true, state: location.state ?? {} });
        }
      }
    }

    void processVNPayReturn();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search]);

  const availablePlans = backendPlans.length > 0 ? backendPlans : fallbackPlans;

  const getMonthlyPrice = (plan: BillingPlanResponse) => {
    const price = backendPlanPrices.find((item) => item.planId === plan.id && item.billingCycle !== 'YEARLY')
      || backendPlanPrices.find((item) => item.planId === plan.id);
    return price?.amountCents ?? fallbackPrices[plan.name] ?? 0;
  };

  const activePlan = availablePlans.find((plan) => (
    backendSubscription?.planId === plan.id || plan.name === currentPlan
  )) ?? availablePlans[0];
  const activePlanPrice = activePlan ? getMonthlyPrice(activePlan) : 0;
  const renewalDate = backendSubscription?.currentPeriodEnd
    ? new Date(backendSubscription.currentPeriodEnd).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    : '--';

  const handleDownloadInvoice = (invoiceId: string) => {
    const content = `Invoice ID: ${invoiceId}\nDate: ${new Date().toLocaleDateString()}\nStatus: PAID\n\nThank you for your business!`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${invoiceId}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    showToast(`Invoice ${invoiceId} downloaded successfully`, 'success');
  };

  if (role === 'ADMIN') {
    return (
      <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
        <BillingHero
          eyebrow={t('nav.billing')}
          
          actionLabel={t('billing.create_plan')}
          onAction={() => navigate('/billing/upgrade')}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard icon={DollarSign} label={t('billing.mrr')} value={formatCurrency(0)} trend="--" tone="green" />
          <StatCard icon={Users} label={t('billing.active_subs')} value="0" trend={`${availablePlans.length} ${t('billing.table.plan')}`} tone="blue" />
          <StatCard icon={CreditCard} label={t('billing.failed_payments')} value="0" trend="--" tone="red" />
        </div>

        <section className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] p-6">
            <div>
              <h3 className="text-[16px] font-semibold text-[#f0f0f0]">{t('billing.recent_subs')}</h3>
              <p className="mt-1 text-xs text-[#8b8f91]">{language === 'vi' ? 'Theo dõi đăng ký và hóa đơn gần đây.' : 'Track recent subscriptions and invoices.'}</p>
            </div>
            <button className="text-xs font-bold text-[#3b9eff] hover:underline">{t('billing.view_all')}</button>
          </div>
          <EmptyBillingState text={t('billing.no_data') || 'No subscriptions yet'} />
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <BillingHero
        eyebrow={t('nav.billing')}
        actionLabel={t('billing.upgrade') || 'Nâng cấp gói'}
        onAction={() => navigate('/billing/upgrade')}
      />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-[24px] border border-[rgba(59,158,255,0.22)] bg-[rgba(59,158,255,0.06)] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.22)] lg:col-span-2">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-[#3b9eff]/20 bg-[#3b9eff]/10 text-[#3b9eff]">
                <Crown size={28} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#9ed1ff]">{t('billing.current_plan')}</p>
                <h3 className="mt-1 text-[26px] font-display font-medium tracking-tight text-[#f0f0f0]">
                  {language === 'vi' ? `Gói ${currentPlan === 'Free' ? 'Miễn phí' : currentPlan}` : `${currentPlan} Plan`}
                </h3>
                <p className="mt-1 text-sm text-[#a1a4a5]">
                  {currentPlan === 'Free' ? t('billing.free_forever') : t('billing.billed_monthly')}
                </p>
              </div>
            </div>
            <div className="rounded-[18px] border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.22)] px-5 py-4 sm:text-right">
              <p className="text-xs font-semibold text-[#8b8f91]">{language === 'vi' ? 'Chi phí hiện tại' : 'Current cost'}</p>
              <p className="mt-1 text-[28px] font-display font-medium text-[#f0f0f0]">
                {loadingSub ? <Loader2 size={24} className="inline animate-spin" /> : formatCurrency(activePlanPrice)}
                <span className="ml-1 text-sm font-medium text-[#a1a4a5]">/tháng</span>
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <MiniInfo icon={ShieldCheck} label={t('billing.active')} value={backendSubscription?.status || (currentPlan === 'Free' ? 'FREE' : 'ACTIVE')} />
            <MiniInfo icon={CalendarDays} label={t('billing.next_renewal')} value={renewalDate} />
            <MiniInfo icon={Receipt} label={t('billing.history')} value={`${invoices.length} ${language === 'vi' ? 'hóa đơn' : 'invoices'}`} />
          </div>
        </div>

        <div className="rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-[#11ff99]/20 bg-[#11ff99]/10 text-[#11ff99]">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#f0f0f0]">{t('billing.current_plan.need_more')}</h3>
              <p className="text-xs text-[#8b8f91]">{t('billing.upgrade_desc')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/billing/upgrade')}
            className="mt-6 w-full rounded-[16px] bg-[#ffffff] py-3 text-sm font-bold text-[#000000] transition-colors hover:bg-[#f0f0f0]"
          >
            {t('billing.upgrade')}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {availablePlans.slice(0, 3).map((plan) => {
          const isActive = backendSubscription?.planId === plan.id || plan.name === currentPlan;
          const features = plan.description.split('\n').filter(Boolean).slice(0, 4);
          return (
            <div
              key={plan.id}
              className={cn(
                'rounded-[24px] border p-6 shadow-[0_18px_48px_rgba(0,0,0,0.18)] transition-colors',
                isActive
                  ? 'border-[rgba(59,158,255,0.28)] bg-[rgba(59,158,255,0.07)]'
                  : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.18)]'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#f0f0f0]">{plan.name}</h3>
                  <p className="mt-2 text-[28px] font-display font-medium text-[#f0f0f0]">
                    {formatCurrency(getMonthlyPrice(plan))}
                    <span className="ml-1 text-sm text-[#a1a4a5]">/tháng</span>
                  </p>
                </div>
                {isActive && (
                  <span className="rounded-full border border-[#3b9eff]/20 bg-[#3b9eff]/10 px-3 py-1 text-[11px] font-bold text-[#9ed1ff]">
                    {t('billing.plans.current')}
                  </span>
                )}
              </div>
              <div className="mt-6 space-y-3">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-[#a1a4a5]">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#11ff99]" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] p-6">
          <div>
            <h3 className="text-[16px] font-semibold text-[#f0f0f0]">{t('billing.history')}</h3>
            <p className="mt-1 text-xs text-[#8b8f91]">{t('billing.history_desc')}</p>
          </div>
          <History size={18} className="text-[#8b8f91]" />
        </div>
        {loadingPlans ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-[#a1a4a5]" />
          </div>
        ) : invoices.length > 0 ? (
          <InvoiceTable invoices={invoices} language={language} onDownload={handleDownloadInvoice} t={t} />
        ) : (
          <EmptyBillingState text={language === 'vi' ? 'Lịch sử thanh toán sẽ hiển thị tại đây.' : 'Payment history will appear here.'} />
        )}
      </section>
    </div>
  );
}

function BillingHero({
  eyebrow,
  actionLabel,
  onAction,
}: {
  eyebrow: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <section className="rounded-[24px] pt-6 pb-6 shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#9fa3a5]">
            <CreditCard size={13} />
            {eyebrow}
          </div>
        </div>
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#ffffff] px-5 py-2.5 text-sm font-bold text-[#000000] shadow-[0_14px_30px_rgba(0,0,0,0.22)] transition-colors hover:bg-[#f0f0f0]"
        >
          <Zap size={17} />
          {actionLabel}
        </button>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
  tone: 'green' | 'blue' | 'red';
}) {
  const toneClass = tone === 'green' ? 'text-[#11ff99]' : tone === 'blue' ? 'text-[#3b9eff]' : 'text-[#ff0000]';
  return (
    <div className="rounded-[20px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
      <div className="mb-4 flex items-center justify-between">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)]', toneClass)}>
          <Icon size={19} />
        </div>
        <span className={cn('inline-flex items-center gap-1 text-[11px] font-bold', toneClass)}>
          <TrendingUp size={12} />
          {trend}
        </span>
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8b8f91]">{label}</p>
      <p className="mt-2 text-[28px] font-display font-medium tracking-tight text-[#f0f0f0]">{value}</p>
    </div>
  );
}

function MiniInfo({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.18)] p-4">
      <div className="flex items-center gap-2 text-[#a1a4a5]">
        <Icon size={15} />
        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-[#f0f0f0]">{value}</p>
    </div>
  );
}

function InvoiceTable({
  invoices,
  language,
  onDownload,
  t,
}: {
  invoices: Invoice[];
  language: string;
  onDownload: (invoiceId: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <thead>
          <tr className="bg-[rgba(255,255,255,0.02)]">
            <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('billing.table.date')}</th>
            <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('billing.table.amount')}</th>
            <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('billing.table.status')}</th>
            <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-right text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('billing.table.invoice') || 'Hóa đơn'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="transition-colors hover:bg-[rgba(255,255,255,0.03)]">
              <td className="px-6 py-4 text-sm font-semibold text-[#f0f0f0]">{invoice.date}</td>
              <td className="px-6 py-4 text-sm font-bold text-[#f0f0f0]">{invoice.amount}</td>
              <td className="px-6 py-4">
                <span className={cn(
                  'inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider',
                  invoice.status === 'PAID'
                    ? 'border-[#11ff99]/20 bg-[#11ff99]/10 text-[#11ff99]'
                    : invoice.status === 'REFUNDED'
                      ? 'border-[#ff0000]/20 bg-[#ff0000]/10 text-[#ff0000]'
                      : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[#a1a4a5]'
                )}>
                  {language === 'vi'
                    ? (invoice.status === 'PAID' ? 'Đã thanh toán' : invoice.status === 'REFUNDED' ? 'Đã hoàn tiền' : invoice.status)
                    : invoice.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDownload(invoice.id)}
                  className="inline-flex rounded-[12px] border border-transparent p-2 text-[#3b9eff] transition-colors hover:border-[#3b9eff]/20 hover:bg-[rgba(59,158,255,0.08)]"
                >
                  <Download size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyBillingState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#8b8f91]">
        <History size={24} />
      </div>
      <p className="text-sm font-medium text-[#a1a4a5]">{text}</p>
    </div>
  );
}
