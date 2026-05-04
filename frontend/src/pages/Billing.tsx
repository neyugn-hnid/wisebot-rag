import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { 
  CreditCard, 
  CheckCircle2, 
  Download, 
  Zap,
  Users,
  TrendingUp,
  DollarSign,
  X,
  ShieldCheck,
  Loader2,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useRole } from '../contexts/RoleContext';
import {
  listPlans,
  listPlanPrices,
  getMySubscription,
  mySubscribe,
  listMyInvoices,
  BillingPlanResponse,
  BillingPlanPriceResponse,
  SubscriptionResponse,
  BillingInvoiceResponse,
} from '../api/billing';

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expiry: string;
  isPrimary: boolean;
}

function loadPaymentMethods(): PaymentMethod[] {
  try {
    const saved = localStorage.getItem('paymentMethods');
    if (saved) return JSON.parse(saved) as PaymentMethod[];
  } catch { /* ignore */ }
  return [];
}

export default function Billing() {
  const { t, language } = useLanguage();
  const { role } = useRole();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState('');
  const [upgradeStep, setUpgradeStep] = useState<'selection' | 'checkout'>('selection');
  const [paymentMethodsList, setPaymentMethodsList] = useState<PaymentMethod[]>(loadPaymentMethods);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // --- Backend state ---
  const [backendPlans, setBackendPlans] = useState<BillingPlanResponse[]>([]);
  const [backendPlanPrices, setBackendPlanPrices] = useState<BillingPlanPriceResponse[]>([]);
  const [backendSubscription, setBackendSubscription] = useState<SubscriptionResponse | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingSub, setLoadingSub] = useState(true);
  // --- End backend state ---

  useEffect(() => {
    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethodsList));
  }, [paymentMethodsList]);

  useEffect(() => {
    if (location.state?.selectedPlanId) {
      setIsUpgradeModalOpen(true);
    }
  }, [location.state]);

  // --- Fetch backend data ---
  useEffect(() => {
    let cancelled = false;

    async function fetchBackendData() {
      try {
        const [plans, pricesResult, subscription, invoicesResult] = await Promise.all([
          listPlans().catch(() => [] as BillingPlanResponse[]),
          listPlanPrices('').catch(() => [] as BillingPlanPriceResponse[]),
          getMySubscription().catch(() => null as SubscriptionResponse | null),
          listMyInvoices().catch(() => [] as BillingInvoiceResponse[]),
        ]);

        if (cancelled) return;

        setBackendPlans(plans);
        setBackendPlanPrices(pricesResult);
        setBackendSubscription(subscription);

        // Set current plan from subscription
        if (subscription && plans.length > 0) {
          const activePlan = plans.find(p => p.id === subscription.planId);
          if (activePlan) setCurrentPlan(activePlan.name);
        }

        // Map backend invoices to display format
        if (invoicesResult.length > 0) {
          setInvoices(invoicesResult.map(inv => ({
            id: inv.invoiceNo || inv.id,
            date: new Date(inv.issuedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            amount: `$${(inv.totalCents / 100).toFixed(2)}`,
            status: inv.status,
          })));
        }
      } catch {
        // backend unavailable, plans will show empty state
      } finally {
        if (!cancelled) {
          setLoadingPlans(false);
          setLoadingSub(false);
        }
      }
    }

    fetchBackendData();
    return () => { cancelled = true; };
  }, []);
  // --- End fetch backend data ---

  const handleSelectPlan = async (planId: string, planName: string) => {
    if (currentPlan && planName === currentPlan) return;

    const backendPlan = backendPlans.find(p => p.id === planId);
    if (!backendPlan) {
      showToast('Plan not found', 'error');
      return;
    }

    try {
      setIsProcessing(planId);
      const sub = await mySubscribe(backendPlan.id);
      setBackendSubscription(sub);
      setCurrentPlan(backendPlan.name);
      setIsUpgradeModalOpen(false);
      setUpgradeStep('selection');
      showToast(t('billing.upgrade_success').replace('{plan}', backendPlan.name), 'success');
      navigate(location.pathname, { replace: true, state: {} });
    } catch (err: any) {
      showToast(err.message || 'Subscription failed', 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    const content = `Invoice ID: ${invoiceId}\nDate: ${new Date().toLocaleDateString()}\nStatus: PAID\n\nThank you for your business!`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Invoice ${invoiceId} downloaded successfully`, 'success');
  };

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const renderPlansGrid = () => {
    if (loadingPlans) {
      return (
        <div className="col-span-full flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[#a1a4a5]" />
        </div>
      );
    }
    if (backendPlans.length === 0) {
      return (
        <div className="col-span-full text-center py-8 text-[#a1a4a5]">
          {t('billing.no_plans') || 'No plans available'}
        </div>
      );
    }
    return backendPlans.map((plan) => {
      const price = backendPlanPrices.find(p => p.planId === plan.id);
      const monthlyPrice = price ? (price.amountCents / 100).toFixed(0) : '--';
      const yearlyPrice = price ? ((price.amountCents / 100) * 0.8).toFixed(0) : '--';
      const displayPrice = billingCycle === 'yearly' ? yearlyPrice : monthlyPrice;
      const isActive = backendSubscription?.planId === plan.id;

      return (
        <div 
          key={plan.id}
          className={cn(
            "relative p-6 rounded-[16px] border-2 transition-all group hover:shadow-xl",
            isActive
              ? "border border-primary bg-[rgba(59,158,255,0.05)]" 
              : "border border-[rgba(255,255,255,0.3)] hover:border-[rgba(255,255,255,0.3)] bg-[#000000]"
          )}
        >
          {isActive && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#ffffff] text-[#000000] text-[10px] font-black uppercase tracking-widest rounded-full shadow-md shadow-black/40">
              {t('billing.plans.selected')}
            </div>
          )}
          <h4 className="text-lg font-black text-[#f0f0f0]">{plan.name}</h4>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-black text-[#f0f0f0]">
              ${displayPrice}
            </span>
            <span className="text-sm font-medium text-[#a1a4a5]">/mo</span>
          </div>
          <p className="text-xs text-[#a1a4a5] mt-2">{t('billing.plans.billed')} {billingCycle === 'yearly' ? t('billing.plans.yearly') : t('billing.plans.monthly')}</p>

          <button 
            onClick={() => handleSelectPlan(plan.id, plan.name)}
            disabled={isProcessing !== null || isActive}
            className={cn(
              "w-full mt-6 py-3 rounded-[16px] font-black text-sm transition-all flex items-center justify-center gap-2",
              "bg-[#ffffff] text-[#000000] shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0]",
              isActive && "opacity-50 cursor-default"
            )}
          >
            {isProcessing === plan.id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isActive ? t('billing.plans.current') : t('billing.plans.select')}
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

  if (role === 'ADMIN') {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-display font-medium tracking-tight tracking-tight text-[#f0f0f0]">{t('billing.title')}</h2>
          </div>
          <button className="px-4 py-2 bg-[#ffffff] text-[#000000] rounded-md text-sm font-bold shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all">
            {t('billing.create_plan')}
          </button>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
            <div className="flex items-center gap-3 text-[#a1a4a5] mb-2">
              <DollarSign size={20} />
              <h3 className="font-bold text-sm">{t('billing.mrr')}</h3>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-black text-[#f0f0f0]">$0</p>
              <span className="flex items-center text-emerald-500 text-sm font-bold mb-1">
                <TrendingUp size={16} className="mr-1" /> --
              </span>
            </div>
          </div>
          <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
            <div className="flex items-center gap-3 text-[#a1a4a5] mb-2">
              <Users size={20} />
              <h3 className="font-bold text-sm">{t('billing.active_subs')}</h3>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-black text-[#f0f0f0]">0</p>
              <span className="flex items-center text-emerald-500 text-sm font-bold mb-1">
                <TrendingUp size={16} className="mr-1" /> --
              </span>
            </div>
          </div>
          <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
            <div className="flex items-center gap-3 text-[#a1a4a5] mb-2">
              <CreditCard size={20} />
              <h3 className="font-bold text-sm">{t('billing.failed_payments')}</h3>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-black text-[#f0f0f0]">0</p>
              <span className="flex items-center text-[#ff0000] text-sm font-bold mb-1">
                <TrendingUp size={16} className="mr-1" /> --
              </span>
            </div>
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 overflow-hidden">
          <div className="p-6 border-b border-[rgba(255,255,255,0.3)] flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#f0f0f0]">{t('billing.recent_subs')}</h3>
            <button className="text-xs font-bold text-[#3b9eff] hover:underline">{t('billing.view_all')}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.02)]">
                  <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('billing.table.user')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('billing.table.plan')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('billing.table.amount')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('billing.table.status')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('billing.table.next_billing')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider text-right">{t('billing.table.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.3)]">
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <History size={24} className="text-[#a1a4a5]" />
                      <p className="text-sm text-[#a1a4a5] font-medium">{t('billing.no_data') || 'No subscriptions yet'}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // User View
  return (
    <>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-display font-medium tracking-tight tracking-tight text-[#f0f0f0]">{t('billing.title')}</h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-4 py-2 bg-[#000000] text-[#f0f0f0] border border-[rgba(255,255,255,0.3)] rounded-[12px] text-sm font-bold shadow-md shadow-black/40 hover:bg-[rgba(255,255,255,0.02)] transition-all font-sans"
            >
              {t('billing.payment_methods.add')}
            </button>
            <button 
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-4 py-2 bg-[#ffffff] text-[#000000] rounded-[12px] text-sm font-bold shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all"
            >
              {t('billing.upgrade')}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-8">
            {/* Current Plan */}
            <div className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] overflow-hidden shadow-md shadow-black/40 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="p-4 sm:p-8 border-b border-[rgba(255,255,255,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[16px] bg-[rgba(59,158,255,0.1)] flex items-center justify-center text-[#3b9eff] shrink-0">
                        <Zap size={32} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black text-[#f0f0f0]">
                            {language === 'vi' 
                               ? (currentPlan === 'Free' ? 'Gói Miễn phí' : `Gói ${currentPlan}`)
                               : `${currentPlan} Plan`}
                          </h3>
                        </div>
                        <p className="text-sm text-[#a1a4a5] mt-1">
                          {currentPlan ? `${t('billing.billed_monthly')}` : t('billing.loading')}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-3xl font-black text-[#f0f0f0]">
                        {loadingSub ? (
                          <Loader2 size={24} className="animate-spin inline" />
                        ) : backendSubscription ? (
                          <>${((backendPlanPrices.find(p => p.planId === backendSubscription.planId)?.amountCents ?? 0) / 100).toFixed(0)}<span className="text-sm font-medium text-[#a1a4a5]">/mo</span></>
                        ) : (
                          <>--<span className="text-sm font-medium text-[#a1a4a5]">/mo</span></>
                        )}
                      </p>
                      {backendSubscription && (
                        <button className="text-xs font-bold text-[#ff0000] hover:underline mt-1">{t('billing.cancel')}</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                <div className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-6 border-b border-[rgba(255,255,255,0.3)] flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#f0f0f0]">{t('billing.history')}</h3>
                  </div>
                  {invoices.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-[rgba(255,255,255,0.02)]">
                            <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('billing.table.date')}</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('billing.table.amount')}</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('billing.table.status')}</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider text-right">{t('billing.table.invoice') || 'Hóa đơn'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(255,255,255,0.3)]">
                          {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-[rgba(255,255,255,0.02)]/50 transition-colors group">
                              <td className="px-6 py-4 text-sm font-bold text-[#f0f0f0]">
                                {new Date(inv.date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 text-sm text-[#f0f0f0] font-black">{inv.amount}</td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "inline-flex items-center gap-1 px-0 py-0.5 text-xs font-black uppercase tracking-wider",
                                  inv.status === 'PAID' ? "text-emerald-500" : 
                                  inv.status === 'REFUNDED' ? "text-red-500" : "text-[#a1a4a5]"
                                )}>
                                  {language === 'vi' 
                                    ? (inv.status === 'PAID' ? 'Đã thanh toán' : inv.status === 'REFUNDED' ? 'Đã hoàn tiền' : inv.status)
                                    : inv.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => handleDownloadInvoice(inv.id)}
                                  className="text-[#3b9eff] transition-colors p-2 rounded-[12px] hover:bg-[rgba(59,158,255,0.05)] inline-flex items-center gap-2 group-hover:text-[#3b9eff]"
                                >
                                  <Download size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-[rgba(255,255,255,0.02)] text-[rgba(255,255,255,0.3)] rounded-full flex items-center justify-center mb-4">
                        <History size={24} />
                      </div>
                      <p className="text-[#a1a4a5] font-medium">
                        Lịch sử thanh toán khi thanh toán sẽ hiển thị tại đây
                      </p>
                    </div>
                  )}
                </div>

          </div>
        </div>

        {/* Upgrade Modal */}
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 sm:p-8 border-b border-[rgba(255,255,255,0.3)] sticky top-0 bg-[#000000] z-10">
                <div>
                  <h3 className="text-2xl font-black text-[#f0f0f0]">{t('billing.upgrade')}</h3>
                </div>
                <button 
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-[16px] transition-colors"
                >
                  <X size={24} className="text-[#a1a4a5]" />
                </button>
              </div>

              <div className="p-4 sm:p-8">
                {upgradeStep === 'selection' ? (
                  <div>
                    {/* Billing Cycle Switcher */}
                    <div className="flex justify-center mb-10">
                      <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.05)] p-1 rounded-[16px] border border-[rgba(255,255,255,0.3)]">
                        <button 
                          onClick={() => setBillingCycle('monthly')}
                          className={cn(
                            "px-6 py-2 text-xs font-black rounded-[12px] transition-all",
                            billingCycle === 'monthly' ? "bg-[#000000] text-[#f0f0f0] shadow-md shadow-black/40" : "text-[#a1a4a5] hover:text-[#f0f0f0]"
                          )}
                        >
                          {t('billing.plans.monthly')}
                        </button>
                        <button 
                          onClick={() => setBillingCycle('yearly')}
                          className={cn(
                            "px-6 py-2 text-xs font-black rounded-[12px] transition-all flex items-center gap-2",
                            billingCycle === 'yearly' ? "bg-[#000000] text-[#f0f0f0] shadow-md shadow-black/40" : "text-[#a1a4a5] hover:text-[#f0f0f0]"
                          )}
                        >
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
                  <div className="max-w-md mx-auto space-y-8 py-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-4 p-4 bg-[rgba(255,255,255,0.02)] rounded-[16px] border border-[rgba(255,255,255,0.3)]">
                      <div className="w-12 h-12 rounded-[16px] bg-[rgba(59,158,255,0.1)] flex items-center justify-center text-[#3b9eff]">
                        <Loader2 size={24} className="animate-spin" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-[#f0f0f0]">{t('common.processing')}</h4>
                        <p className="text-xs text-[#a1a4a5]">{t('billing.subscribing') || 'Setting up your subscription...'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.3)] flex items-center justify-center gap-8">
                <div className="flex items-center gap-2 text-[#a1a4a5]">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-bold">{t('billing.secure_ssl')}</span>
                </div>
                <div className="flex items-center gap-2 text-[#a1a4a5]">
                  <CreditCard size={18} />
                  <span className="text-xs font-bold">{t('billing.cancel_anytime')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Modal */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.3)]">
                <h3 className="text-lg font-bold text-[#f0f0f0]">{t('billing.payment_methods.add')}</h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-[12px]">
                  <X size={20} className="text-[#a1a4a5]" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#f0f0f0]">{t('billing.payment_methods.cardholder_name')}</label>
                    <input type="text" placeholder="John Doe" className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] px-4 py-2.5 outline-none rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#f0f0f0]">{t('billing.payment_methods.card_number')}</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={18} />
                      <input type="text" placeholder="•••• •••• •••• ••••" className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] pl-10 pr-4 py-2.5 outline-none rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#f0f0f0]">{t('billing.payment_methods.expiry')}</label>
                      <input type="text" placeholder="MM / YY" className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] px-4 py-2.5 outline-none rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#f0f0f0]">{t('billing.payment_methods.cvc')}</label>
                      <input type="text" placeholder="•••" className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] px-4 py-2.5 outline-none rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#f0f0f0]">{t('billing.payment_methods.billing_address')}</label>
                    <input type="text" placeholder="123 AI Street, San Francisco, CA" className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] px-4 py-2.5 outline-none rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.3)] flex justify-end gap-3">
                <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-sm font-bold text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-colors">{t('common.cancel')}</button>
                <button 
                  onClick={() => {
                    const newMethod = {
                      id: `pm_${Date.now()}`,
                      type: 'Visa',
                      last4: '1234',
                      expiry: '12/28',
                      isPrimary: paymentMethodsList.length === 0
                    };
                    setPaymentMethodsList([...paymentMethodsList, newMethod]);
                    setIsPaymentModalOpen(false);
                    showToast(t('billing.payment_methods.add_success'), 'success');
                  }}
                  className="px-6 py-2 bg-[#ffffff] text-[#000000] text-sm font-bold rounded-md shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
