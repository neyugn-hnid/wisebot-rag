import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import {
  CheckCircle2, 
  X,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  AlertCircle,
  QrCode,
  Copy,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  listPlans,
  listPlanPrices,
  getMySubscription,
  createVNPayCheckout,
  mySubscribe,
  BillingPlanResponse,
  BillingPlanPriceResponse,
  SubscriptionResponse,
} from '../api/billing';

function formatCurrency(amount: number, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function UpgradePlan() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [upgradeStep, setUpgradeStep] = useState<'selection' | 'checkout'>('selection');
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: number } | null>(null);

  const [backendPlans, setBackendPlans] = useState<BillingPlanResponse[]>([]);
  const [backendPlanPrices, setBackendPlanPrices] = useState<BillingPlanPriceResponse[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [minRedirectDelayDone, setMinRedirectDelayDone] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const showKnowledgeBaseUpgradeNotice = location.state?.from === 'knowledge-base-limit';

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMinRedirectDelayDone(true);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [plans, subscription] = await Promise.all([
          listPlans().catch(() => [] as BillingPlanResponse[]),
          getMySubscription().catch(() => null as SubscriptionResponse | null),
        ]);
        if (cancelled) return;
        setBackendPlans(plans);
        if (plans.length > 0) {
          const prices = await Promise.all(
            plans.map(p => listPlanPrices(p.id).catch(() => [] as BillingPlanPriceResponse[]))
          );
          setBackendPlanPrices(prices.flat());
        }
        if (subscription && plans.length > 0) {
          const activePlan = plans.find(p => p.id === subscription.planId);
          if (activePlan) setCurrentPlan(activePlan.name);
        }
      } catch {} finally {
        if (!cancelled) setLoadingPlans(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const handleSelectPlan = (planId: string, planName: string, planPrice: number) => {
    if (currentPlan && planName === currentPlan) return;
    const priceInfo = backendPlanPrices.find(p => p.planId === planId);
    const monthlyPrice = priceInfo ? priceInfo.amountCents : planPrice;
    setSelectedPlan({ id: planId, name: planName, price: monthlyPrice });
    if (monthlyPrice === 0) {
      // Free plan – subscribe directly without payment
      handleFreeSubscribe(planId, planName);
    } else {
      setUpgradeStep('checkout');
    }
  };

  const handleFreeSubscribe = async (planId: string, planName: string) => {
    setIsProcessing(planId);
    try {
      await mySubscribe(planId, 1);
      setCurrentPlan(planName);
      showToast(`Đã chuyển sang gói ${planName}`, 'success');
      navigate('/billing');
    } catch (err: any) {
      showToast(err.message || t('toast.error'), 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCheckoutConfirm = async () => {
    if (!selectedPlan) return;
    const { id, name } = selectedPlan;
    try {
      setIsProcessing(id);
      const checkout = await createVNPayCheckout({
        planId: id,
        billingCycle: billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
        seats: 1,
      });
      if (checkout && checkout.paymentUrl) {
        window.location.href = checkout.paymentUrl;
      } else {
        throw new Error('Không lấy được URL thanh toán VNPay');
      }
    } catch (err: any) {
      showToast(err.message || t('toast.error'), 'error');
      setIsProcessing(null);
    }
  };

  const planPrice = billingCycle === 'yearly'
    ? Math.floor((selectedPlan?.price ?? 0) * 0.8)
    : (selectedPlan?.price ?? 0);
  const fallbackPlans: BillingPlanResponse[] = [
    { id: 'free', code: 'free', name: 'Miễn phí', description: 'Lên đến 1.000 tin nhắn\n1 Cơ sở tri thức\nTối đa 10 tài liệu tải lên\nDung lượng lưu trữ 100 MB\nHỗ trợ tiêu chuẩn', active: true },
    { id: 'plus', code: 'plus', name: 'Plus', description: 'Lên đến 10.000 tin nhắn\n5 Cơ sở tri thức\nTối đa 200 tài liệu tải lên\nDung lượng lưu trữ 5 GB\nHỗ trợ ưu tiên\nTruy cập API', active: true },
    { id: 'pro', code: 'pro', name: 'Pro', description: 'Không giới hạn tin nhắn\nKhông giới hạn Cơ sở tri thức\nKhông giới hạn tài liệu tải lên\nDung lượng lưu trữ 50 GB\nHỗ trợ tận tâm\nTích hợp tùy chỉnh\nPhân tích nâng cao', active: true },
  ];
  const availablePlans = backendPlans.length > 0 ? backendPlans : fallbackPlans;
  const selectedPlanDetails = availablePlans.find((plan) => plan.id === selectedPlan?.id);
  const selectedPlanFeatures = selectedPlanDetails?.description.split('\n').filter(Boolean) ?? [];
  const discountAmount = billingCycle === 'yearly'
    ? Math.max((selectedPlan?.price ?? 0) - planPrice, 0)
    : 0;

  const renderPlansGrid = () => {
    if (loadingPlans) {
      return <div className="col-span-full flex justify-center py-12"><Loader2 size={32} className="animate-spin text-[#a1a4a5]" /></div>;
    }
    const defaultPrices: Record<string, number> = { Free: 0, Plus: 501581, Pro: 1293551 };

    return availablePlans.map((plan) => {
      const price = backendPlanPrices.find(p => p.planId === plan.id);
      const monthlyPrice = price ? price.amountCents : (defaultPrices[plan.name] || 0);
      const yearlyPrice = Math.floor(monthlyPrice * 0.8);
      const displayPrice = billingCycle === 'yearly' ? yearlyPrice : monthlyPrice;
      const isActive = plan.name === currentPlan;

      return (
        <div
          key={plan.id}
          className={cn(
            "relative p-6 rounded-[20px] border transition-all shadow-xl shadow-black/25",
            isActive
              ? "bg-[rgba(59,158,255,0.10)] border-[rgba(59,158,255,0.28)]"
              : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.2)]"
          )}
        >
          <h4 className="text-lg font-black text-[#f0f0f0]">{plan.name}</h4>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-black text-[#f0f0f0]">{formatCurrency(displayPrice)}</span>
            <span className="text-sm font-medium text-[#a1a4a5]">/tháng</span>
          </div>
          <p className="text-xs text-[#a1a4a5] mt-2">{billingCycle === 'yearly' ? t('billing.plans.yearly') : t('billing.plans.monthly')}</p>
          <button 
            onClick={() => !isActive && handleSelectPlan(plan.id, plan.name, monthlyPrice)}
            disabled={isProcessing !== null || isActive}
            className={cn(
              "w-full mt-6 py-3 rounded-[16px] font-black text-sm transition-all flex items-center justify-center gap-2",
              isActive ? "bg-[rgba(255,255,255,0.05)] text-[#a1a4a5] cursor-not-allowed" : "bg-[#ffffff] text-[#000000] shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0]"
            )}
          >
            {isProcessing === plan.id ? <Loader2 size={16} className="animate-spin" /> : isActive ? t('billing.plans.current') : t('billing.plans.select')}
          </button>
          {plan.description && (
            <div className="mt-8 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#a1a4a5]">{t('billing.plans.features')}</p>
              {plan.description.split('\n').filter(Boolean).map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-[#a1a4a5] font-medium">{feature}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  if ((!minRedirectDelayDone || loadingPlans) && upgradeStep === 'selection') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#a1a4a5]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/billing')} className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors text-[#a1a4a5]">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[24px] font-display font-medium tracking-tight text-[#f0f0f0]">{t('billing.upgrade') || 'Nâng cấp gói'}</h2>
      </div>

      {upgradeStep === 'selection' ? (
        <div className="space-y-8">
          {showKnowledgeBaseUpgradeNotice && (
            <div className="flex items-start gap-3 rounded-[16px] border border-[rgba(255,176,32,0.24)] bg-[rgba(255,176,32,0.08)] p-4">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-[#ffd166]" />
              <div>
                <p className="text-sm font-bold text-[#fff0c2]">{t('billing.upgrade.kb_limit_title')}</p>
                <p className="mt-1 text-sm leading-6 text-[#f3ddb0]">{t('billing.upgrade.kb_limit_desc')}</p>
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.05)] p-1 rounded-[16px] border border-[rgba(255,255,255,0.3)]">
              <button onClick={() => setBillingCycle('monthly')} className={cn("px-6 py-2 text-xs font-black rounded-[12px] transition-all", billingCycle === 'monthly' ? "bg-[#000000] text-[#f0f0f0] shadow-md shadow-black/40" : "text-[#a1a4a5] hover:text-[#f0f0f0]")}>
                {t('billing.plans.monthly')}
              </button>
              <button onClick={() => setBillingCycle('yearly')} className={cn("px-6 py-2 text-xs font-black rounded-[12px] transition-all flex items-center gap-2", billingCycle === 'yearly' ? "bg-[#000000] text-[#f0f0f0] shadow-md shadow-black/40" : "text-[#a1a4a5] hover:text-[#f0f0f0]")}>
                {t('billing.plans.yearly')}
                <span className="text-[#ff0000]">{t('billing.plans.save_20')}</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderPlansGrid()}
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-[rgba(52,52,52,0.96)] rounded-[28px] border border-[rgba(255,255,255,0.14)] shadow-2xl shadow-black/40 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6">
            <h3 className="text-[18px] font-bold text-[#f8f8f8]">{selectedPlan?.name}</h3>
            <button onClick={() => { setUpgradeStep('selection'); setSelectedPlan(null); }} className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors text-[#a1a4a5]">
              <X size={20} />
            </button>
          </div>
          <div className="px-6 pb-6 pt-4">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-[#f3f3f3]">{t('billing.plans.features')}</p>
                <div className="mt-5 space-y-5">
                  {selectedPlanFeatures.map((feature) => (
                    <div key={feature} className="flex items-start gap-4">
                      <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-500" />
                      <span className="text-[15px] leading-7 text-[#ffffff]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[rgba(255,255,255,0.14)] pt-6 space-y-3">
                <div className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="text-[#f5f5f5]">
                      {billingCycle === 'yearly' ? 'Gói đăng ký Hàng năm' : 'Gói đăng ký Hàng tháng'}
                    </p>
                  </div>
                  <span className="text-[#ffffff]">{formatCurrency(planPrice)}</span>
                </div>
                <div className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="text-[#f5f5f5]">Khuyến mãi</p>
                    <p className="text-xs text-[#d7d7d7]">
                      {billingCycle === 'yearly' ? 'giảm 20% khi thanh toán năm' : 'không áp dụng'}
                    </p>
                  </div>
                  <span className="text-[#ff4d4f]">{billingCycle === 'yearly' ? `-${formatCurrency(discountAmount)}` : formatCurrency(0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#f5f5f5]">Thuế ước tính</span>
                  <span className="text-[#ffffff]">{formatCurrency(0)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-[16px] font-bold text-[#ffffff]">
                  <span>Đến hạn hôm nay</span>
                  <span>{formatCurrency(planPrice)}</span>
                </div>
              </div>

              <button onClick={handleCheckoutConfirm} disabled={isProcessing !== null}
                className="w-full py-4 bg-[#ffffff] text-[#111111] rounded-full font-black text-lg hover:bg-[#f3f3f3] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                {isProcessing ? <><Loader2 size={20} className="animate-spin" />{t('billing.subscribing')}</> : <><QrCode size={20} />Thanh toán với VNPay</>}
              </button>
              <p className="text-[11px] text-center text-[#cfcfcf]">Bạn sẽ được chuyển hướng tới cổng thanh toán VNPay.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
