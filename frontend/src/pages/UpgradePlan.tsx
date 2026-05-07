import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { 
  CheckCircle2, 
  X,
  ShieldCheck,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  listPlans,
  listPlanPrices,
  getMySubscription,
  mySubscribe,
  BillingPlanResponse,
  BillingPlanPriceResponse,
  SubscriptionResponse,
} from '../api/billing';

export default function UpgradePlan() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [upgradeStep, setUpgradeStep] = useState<'selection' | 'checkout'>('selection');
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: number } | null>(null);
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvc: '', name: '' });

  const [backendPlans, setBackendPlans] = useState<BillingPlanResponse[]>([]);
  const [backendPlanPrices, setBackendPlanPrices] = useState<BillingPlanPriceResponse[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

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
    const monthlyPrice = priceInfo ? (priceInfo.amountCents / 100) : planPrice;
    setSelectedPlan({ id: planId, name: planName, price: monthlyPrice });
    setUpgradeStep('checkout');
  };

  const handleCheckoutConfirm = async () => {
    if (!selectedPlan) return;
    if (!newCard.number.trim() || !newCard.expiry.trim() || !newCard.cvc.trim()) {
      showToast(t('billing.card_incomplete'), 'error');
      return;
    }
    const { id, name } = selectedPlan;
    try {
      setIsProcessing(id);
      await mySubscribe(id);
      showToast(t('billing.upgrade_success').replace('{plan}', name), 'success');
      navigate('/billing');
    } catch (err: any) {
      showToast(err.message || t('toast.error'), 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  const planPrice = billingCycle === 'yearly' 
    ? Math.floor((selectedPlan?.price ?? 0) * 0.8 * 100) / 100 
    : (selectedPlan?.price ?? 0);

  const renderPlansGrid = () => {
    if (loadingPlans) {
      return <div className="col-span-full flex justify-center py-12"><Loader2 size={32} className="animate-spin text-[#a1a4a5]" /></div>;
    }
    const plans = backendPlans.length > 0 ? backendPlans : [
      { id: 'free', name: 'Free', description: 'Basic features' } as BillingPlanResponse,
      { id: 'plus', name: 'Plus', description: 'Advanced features' } as BillingPlanResponse,
      { id: 'pro', name: 'Pro', description: 'All features' } as BillingPlanResponse,
    ];
    const defaultPrices: Record<string, number> = { Free: 0, Plus: 19, Pro: 49 };

    return plans.map((plan) => {
      const price = backendPlanPrices.find(p => p.planId === plan.id);
      const monthlyPrice = price ? (price.amountCents / 100) : (defaultPrices[plan.name] || 0);
      const yearlyPrice = Math.floor(monthlyPrice * 0.8);
      const displayPrice = billingCycle === 'yearly' ? yearlyPrice : monthlyPrice;
      const isActive = plan.name === currentPlan;

      return (
        <div key={plan.id} className={cn("relative p-6 rounded-[16px] transition-all", isActive ? "bg-[rgba(59,158,255,0.05)]" : "bg-[#000000]")}>
          <h4 className="text-lg font-black text-[#f0f0f0]">{plan.name}</h4>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-black text-[#f0f0f0]">${displayPrice}</span>
            <span className="text-sm font-medium text-[#a1a4a5]">/mo</span>
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
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-[#a1a4a5] font-medium">{plan.description}</span>
              </div>
            </div>
          )}
        </div>
      );
    });
  };

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
        <div className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.3)]">
            <h3 className="text-lg font-bold text-[#f0f0f0]">{t('billing.upgrade')}: {selectedPlan?.name}</h3>
            <button onClick={() => { setUpgradeStep('selection'); setSelectedPlan(null); }} className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors text-[#a1a4a5]">
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            <div className="max-w-lg mx-auto space-y-6">
              <div className="bg-[rgba(255,255,255,0.02)] rounded-[16px] border border-[rgba(255,255,255,0.3)] p-5 space-y-3">
                <h5 className="text-sm font-black text-[#f0f0f0]">{t('billing.order_summary')}</h5>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a1a4a5]">{selectedPlan?.name} ({billingCycle === 'yearly' ? t('billing.plans.yearly') : t('billing.plans.monthly')})</span>
                  <span className="font-bold text-[#f0f0f0]">${planPrice.toFixed(2)}</span>
                </div>
                <div className="border-t border-[rgba(255,255,255,0.1)] pt-3 flex justify-between text-sm">
                  <span className="font-black text-[#f0f0f0]">{t('billing.total_due')}</span>
                  <span className="font-black text-[#f0f0f0]">${planPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-black text-[#f0f0f0]">{t('billing.payment_methods.title')}</h5>
                <div className="space-y-2">
                  <input type="text" placeholder={t('billing.payment_methods.card_number')} value={newCard.number} onChange={(e) => setNewCard(p => ({ ...p, number: e.target.value }))} maxLength={19}
                    className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary placeholder:text-[#a1a4a5]/40" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder={t('billing.payment_methods.expiry')} value={newCard.expiry} onChange={(e) => setNewCard(p => ({ ...p, expiry: e.target.value }))} maxLength={5}
                      className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary placeholder:text-[#a1a4a5]/40" />
                    <input type="text" placeholder={t('billing.payment_methods.cvc')} value={newCard.cvc} onChange={(e) => setNewCard(p => ({ ...p, cvc: e.target.value }))} maxLength={4}
                      className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary placeholder:text-[#a1a4a5]/40" />
                  </div>
                  <input type="text" placeholder={t('billing.payment_methods.cardholder_name')} value={newCard.name} onChange={(e) => setNewCard(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary placeholder:text-[#a1a4a5]/40" />
                </div>
              </div>

              <button onClick={handleCheckoutConfirm} disabled={isProcessing !== null}
                className="w-full py-4 bg-[#ffffff] text-[#000000] rounded-[16px] font-black shadow-xl shadow-primary/20 hover:bg-[#f0f0f0] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                {isProcessing ? <><Loader2 size={20} className="animate-spin" />{t('billing.subscribing')}</> : <><ShieldCheck size={20} />{t('billing.pay_now')}</>}
              </button>
              <p className="text-[10px] text-center text-[#a1a4a5]">{t('billing.secure_note')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
