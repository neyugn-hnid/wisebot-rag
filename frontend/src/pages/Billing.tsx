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
  Pencil,
  Plus,
  Receipt,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  X,
  XCircle,
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
  createPlan,
  updatePlan,
  deletePlan,
  createPlanPrice,
  updatePlanPrice,
  deletePlanPrice,
  cancelMySubscription,
  type BillingPlanResponse,
  type BillingPlanPriceResponse,
  type SubscriptionResponse,
  type BillingInvoiceResponse,
  type CreatePlanRequest,
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

  // ── Admin plan management state ────────────────────────────────────
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlanResponse | null>(null);
  const [planForm, setPlanForm] = useState<CreatePlanRequest>({ code: '', name: '', description: '' });
  const [savingPlan, setSavingPlan] = useState(false);
  const [editingPrices, setEditingPrices] = useState<BillingPlanPriceResponse[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceForms, setPriceForms] = useState<Record<string, { amountCents: number; currency: string }>>({});
  const [savingPrice, setSavingPrice] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  // ── Admin plan handlers ────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanForm({ code: '', name: '', description: '' });
    setShowPlanModal(true);
  };

  const openEditModal = async (plan: BillingPlanResponse) => {
    setEditingPlan(plan);
    setPlanForm({ code: plan.code, name: plan.name, description: plan.description || '' });
    setShowPlanModal(true);
    // Fetch prices for this plan
    setPriceLoading(true);
    try {
      const prices = await listPlanPrices(plan.id).catch(() => [] as BillingPlanPriceResponse[]);
      setEditingPrices(prices);
      const forms: Record<string, { amountCents: number; currency: string }> = {};
      for (const p of prices) {
        forms[p.id] = { amountCents: p.amountCents, currency: p.currency };
      }
      setPriceForms(forms);
    } catch { /* ignore */ } finally {
      setPriceLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!planForm.code.trim() || !planForm.name.trim()) return;
    setSavingPlan(true);
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, planForm);
        showToast('Đã cập nhật gói dịch vụ', 'success');
      } else {
        await createPlan(planForm);
        showToast('Đã tạo gói dịch vụ mới', 'success');
      }
      setShowPlanModal(false);
      await fetchBackendData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu gói dịch vụ', 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleTogglePlan = async (plan: BillingPlanResponse) => {
    try {
      const updated = await updatePlan(plan.id, { active: !plan.active });
      showToast(updated.active ? 'Đã kích hoạt gói' : 'Đã vô hiệu hóa gói', 'success');
      await fetchBackendData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi', 'error');
    }
  };

  const handleDeletePlan = async (plan: BillingPlanResponse) => {
    if (!window.confirm(`Bạn có chắc muốn vô hiệu hóa gói "${plan.name}"?`)) return;
    try {
      await deletePlan(plan.id);
      showToast('Đã vô hiệu hóa gói dịch vụ', 'success');
      await fetchBackendData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa', 'error');
    }
  };

  const handleSavePrice = async (priceId: string) => {
    const form = priceForms[priceId];
    if (!form || form.amountCents < 0) return;
    setSavingPrice(priceId);
    try {
      await updatePlanPrice(priceId, { amountCents: form.amountCents, currency: form.currency });
      showToast('Đã cập nhật giá', 'success');
      // Refresh prices
      if (editingPlan) {
        const prices = await listPlanPrices(editingPlan.id).catch(() => [] as BillingPlanPriceResponse[]);
        setEditingPrices(prices);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật giá', 'error');
    } finally {
      setSavingPrice(null);
    }
  };

  const handleAddPrice = async (billingCycle: string) => {
    if (!editingPlan) return;
    const defaultAmount = billingCycle === 'YEARLY' ? 5000000 : 500000;
    setSavingPrice(`new-${billingCycle}`);
    try {
      await createPlanPrice({
        planId: editingPlan.id,
        billingCycle,
        currency: 'VND',
        amountCents: defaultAmount,
        trialDays: 0,
      });
      showToast(`Đã thêm giá ${billingCycle === 'YEARLY' ? 'năm' : 'tháng'}`, 'success');
      const prices = await listPlanPrices(editingPlan.id).catch(() => [] as BillingPlanPriceResponse[]);
      setEditingPrices(prices);
      const forms: Record<string, { amountCents: number; currency: string }> = { ...priceForms };
      for (const p of prices) {
        if (!forms[p.id]) forms[p.id] = { amountCents: p.amountCents, currency: p.currency };
      }
      setPriceForms(forms);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thêm giá', 'error');
    } finally {
      setSavingPrice(null);
    }
  };

  const handleRemovePrice = async (priceId: string) => {
    if (!window.confirm('Xóa mức giá này?')) return;
    setSavingPrice(priceId);
    try {
      await deletePlanPrice(priceId);
      showToast('Đã xóa mức giá', 'success');
      if (editingPlan) {
        const prices = await listPlanPrices(editingPlan.id).catch(() => [] as BillingPlanPriceResponse[]);
        setEditingPrices(prices);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa giá', 'error');
    } finally {
      setSavingPrice(null);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await cancelMySubscription();
      showToast('Đã yêu cầu hủy gói. Gói sẽ hết hạn vào cuối kỳ.', 'success');
      setShowCancelModal(false);
      await fetchBackendData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi hủy gói', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (role === 'ADMIN') {
    return (
      <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
        <BillingHero
          eyebrow={t('nav.billing')}
          actionLabel="Thêm gói dịch vụ"
          onAction={openCreateModal}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard icon={DollarSign} label={t('billing.mrr')} value={formatCurrency(0)} trend="--" tone="green" />
          <StatCard icon={Users} label={t('billing.active_subs')} value="0" trend={`${availablePlans.filter(p => p.active).length} gói`} tone="blue" />
          <StatCard icon={CreditCard} label="Tổng gói" value={`${availablePlans.length}`} trend={`${availablePlans.filter(p => !p.active).length} ẩn`} tone="red" />
        </div>

        {/* Plan management table */}
        <section className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] p-6">
            <div>
              <h3 className="text-[16px] font-semibold text-[#f0f0f0]">Quản lý gói dịch vụ</h3>
              <p className="mt-1 text-xs text-[#8b8f91]">Thêm, sửa, ẩn/hiện các gói dịch vụ.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#3b9eff] px-4 py-2 text-xs font-bold text-white hover:bg-[#2f8ae6] transition-colors"
            >
              <Plus size={14} />
              Thêm gói
            </button>
          </div>

          {loadingPlans ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[#a1a4a5]" />
            </div>
          ) : availablePlans.length === 0 ? (
            <EmptyBillingState text="Chưa có gói dịch vụ nào. Nhấn &quot;Thêm gói&quot; để tạo." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="bg-[rgba(255,255,255,0.02)]">
                    <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">Tên gói</th>
                    <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">Mã</th>
                    <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">Giá / tháng</th>
                    <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">Trạng thái</th>
                    <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-right text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
                  {availablePlans.map((plan) => {
                    const price = backendPlanPrices.find(p => p.planId === plan.id && p.billingCycle !== 'YEARLY')
                      || backendPlanPrices.find(p => p.planId === plan.id);
                    return (
                      <tr key={plan.id} className="transition-colors hover:bg-[rgba(255,255,255,0.03)]">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-bold text-[#f0f0f0]">{plan.name}</p>
                            <p className="mt-0.5 text-xs text-[#8b8f91] line-clamp-1">{plan.description || '—'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="rounded-md bg-[rgba(255,255,255,0.06)] px-2 py-1 text-xs font-mono text-[#3b9eff]">{plan.code}</code>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-[#f0f0f0]">
                          {price ? formatCurrency(price.amountCents, price.currency) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleTogglePlan(plan)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors',
                              plan.active
                                ? 'border-[#11ff99]/20 bg-[#11ff99]/10 text-[#11ff99] hover:bg-[#11ff99]/20'
                                : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#8b8f91] hover:bg-[rgba(255,255,255,0.06)]'
                            )}
                          >
                            {plan.active ? 'ACTIVE' : 'ẨN'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(plan)}
                              className="rounded-[10px] p-2 text-[#3b9eff] hover:bg-[rgba(59,158,255,0.1)] transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan)}
                              className="rounded-[10px] p-2 text-[#ff4d4f] hover:bg-[rgba(255,77,79,0.1)] transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Plan edit/create modal */}
        {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[24px] border border-[rgba(255,255,255,0.14)] bg-[rgba(30,30,30,0.98)] p-6 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-bold text-[#f8f8f8]">
                  {editingPlan ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ mới'}
                </h3>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="rounded-lg p-1.5 text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#a1a4a5] mb-1.5">Mã gói (code)</label>
                  <input
                    type="text"
                    value={planForm.code}
                    onChange={e => setPlanForm(p => ({ ...p, code: e.target.value }))}
                    placeholder="VD: pro, plus, enterprise"
                    className="w-full rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#6b6f71] focus:border-[#3b9eff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#a1a4a5] mb-1.5">Tên gói</label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="VD: Pro, Plus"
                    className="w-full rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#6b6f71] focus:border-[#3b9eff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#a1a4a5] mb-1.5">Mô tả (mỗi dòng 1 tính năng)</label>
                  <textarea
                    value={planForm.description || ''}
                    onChange={e => setPlanForm(p => ({ ...p, description: e.target.value }))}
                    rows={4}
                    placeholder={'Không giới hạn tin nhắn\n5 kho tri thức\nHỗ trợ ưu tiên'}
                    className="w-full rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#6b6f71] focus:border-[#3b9eff] focus:outline-none resize-none"
                  />
                </div>

                {/* ── Price management (edit mode only) ── */}
                {editingPlan && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#a1a4a5]">Giá dịch vụ</label>
                    </div>
                    {priceLoading ? (
                      <Loader2 size={16} className="animate-spin text-[#a1a4a5] mx-auto my-3" />
                    ) : editingPrices.length === 0 ? (
                      <p className="text-xs text-[#6b6f71] mb-2">Chưa có mức giá nào.</p>
                    ) : (
                      <div className="space-y-2 mb-2">
                        {editingPrices.map((price) => (
                          <div key={price.id} className="flex items-center gap-2 rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] px-3 py-2">
                            <span className={cn(
                              'text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0',
                              price.billingCycle === 'YEARLY' ? 'bg-[#3b9eff]/15 text-[#3b9eff]' : 'bg-[#11ff99]/10 text-[#11ff99]'
                            )}>
                              {price.billingCycle === 'YEARLY' ? 'Năm' : 'Tháng'}
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={priceForms[price.id]?.amountCents ?? price.amountCents}
                              onChange={e => setPriceForms(pf => ({
                                ...pf,
                                [price.id]: { ...pf[price.id], amountCents: Number(e.target.value) }
                              }))}
                              className="w-24 rounded-[8px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] px-2 py-1 text-xs text-[#f0f0f0] text-right focus:border-[#3b9eff] focus:outline-none"
                            />
                            <span className="text-xs text-[#8b8f91]">{price.currency}</span>
                            <button
                              onClick={() => handleSavePrice(price.id)}
                              disabled={savingPrice === price.id}
                              className="ml-auto rounded-[8px] bg-[#3b9eff] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#2f8ae6] transition-colors disabled:opacity-50"
                            >
                              {savingPrice === price.id ? <Loader2 size={12} className="animate-spin" /> : 'Lưu'}
                            </button>
                            <button
                              onClick={() => handleRemovePrice(price.id)}
                              disabled={savingPrice === price.id}
                              className="rounded-[8px] p-1 text-[#ff4d4f] hover:bg-[rgba(255,77,79,0.1)] transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Add missing price tiers */}
                    <div className="flex gap-2">
                      {!editingPrices.some(p => p.billingCycle === 'MONTHLY') && (
                        <button
                          onClick={() => handleAddPrice('MONTHLY')}
                          disabled={savingPrice === 'new-MONTHLY'}
                          className="inline-flex items-center gap-1 rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[10px] font-bold text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                        >
                          {savingPrice === 'new-MONTHLY' ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                          Thêm giá tháng
                        </button>
                      )}
                      {!editingPrices.some(p => p.billingCycle === 'YEARLY') && (
                        <button
                          onClick={() => handleAddPrice('YEARLY')}
                          disabled={savingPrice === 'new-YEARLY'}
                          className="inline-flex items-center gap-1 rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[10px] font-bold text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                        >
                          {savingPrice === 'new-YEARLY' ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                          Thêm giá năm
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-transparent py-2.5 text-sm font-bold text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSavePlan}
                  disabled={savingPlan || !planForm.code.trim() || !planForm.name.trim()}
                  className="flex-1 rounded-[14px] bg-[#ffffff] py-2.5 text-sm font-bold text-[#111111] hover:bg-[#f0f0f0] transition-colors disabled:opacity-40"
                >
                  {savingPlan ? <Loader2 size={16} className="animate-spin mx-auto" /> : editingPlan ? 'Cập nhật' : 'Tạo gói'}
                </button>
              </div>
            </div>
          </div>
        )}
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-1">
        <div className="rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[#f0f0f0]">
                <Crown size={28} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b8f91]">{t('billing.current_plan')}</p>
                <h3 className="mt-1 text-[26px] font-display font-medium tracking-tight text-[#f0f0f0]">
                  {language === 'vi' ? `Gói ${currentPlan === 'Free' ? 'Miễn phí' : currentPlan}` : `${currentPlan} Plan`}
                </h3>
                <p className="mt-1 text-sm text-[#a1a4a5]">
                  {currentPlan === 'Free' ? t('billing.free_forever') : t('billing.billed_monthly')}
                </p>
              </div>
            </div>
            {currentPlan !== 'Free' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="text-sm font-bold text-[#ff0000] hover:text-[#ff4d4f] transition-colors self-end sm:self-center"
              >
                Hủy gói
              </button>
            )}
          </div>
        </div>
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

      {/* Cancel subscription modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] border border-[rgba(255,255,255,0.14)] bg-[rgba(30,30,30,0.98)] p-6 shadow-2xl shadow-black/50 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff0000]/10">
              <XCircle size={28} className="text-[#ff0000]" />
            </div>
            <h3 className="text-[18px] font-bold text-[#f8f8f8]">Hủy gói dịch vụ</h3>
            <p className="mt-2 text-sm text-[#a1a4a5] leading-relaxed">
              Bạn có chắc chắn muốn hủy gói <span className="font-bold text-[#f0f0f0]">{currentPlan === 'Free' ? 'Miễn phí' : currentPlan}</span>?
            </p>
            <p className="mt-2 text-xs text-[#ff0000]">
              Gói sẽ hết hạn vào cuối kỳ thanh toán hiện tại.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-transparent py-2.5 text-sm font-bold text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 rounded-[14px] bg-[#ff0000] py-2.5 text-sm font-bold text-white hover:bg-[#cc0000] transition-colors disabled:opacity-50"
              >
                {cancelling ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Hủy gói'}
              </button>
            </div>
          </div>
        </div>
      )}
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
                  'text-[11px] font-bold uppercase tracking-wider',
                  invoice.status === 'PAID'
                    ? 'text-[#11ff99]'
                    : invoice.status === 'REFUNDED' || invoice.status === 'FAILED' || invoice.status === 'CANCELED'
                      ? 'text-[#ff0000]'
                      : 'text-[#a1a4a5]'
                )}>
                  {language === 'vi'
                    ? (invoice.status === 'PAID' ? 'Đã thanh toán' : invoice.status === 'REFUNDED' ? 'Đã hoàn tiền' : invoice.status === 'FAILED' ? 'Thất bại' : invoice.status === 'CANCELED' ? 'Đã hủy' : invoice.status)
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
