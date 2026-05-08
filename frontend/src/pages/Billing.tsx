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

export default function Billing() {
  const { t, language } = useLanguage();
  const { role } = useRole();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [upgradeStep, setUpgradeStep] = useState<'selection' | 'checkout'>('selection');
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: number } | null>(null);
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [billingAddress, setBillingAddress] = useState({ line1: '', line2: '', city: '', country: 'US', zip: '' });
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // --- Backend state ---
  const [backendPlans, setBackendPlans] = useState<BillingPlanResponse[]>([]);
  const [backendPlanPrices, setBackendPlanPrices] = useState<BillingPlanPriceResponse[]>([]);
  const [backendSubscription, setBackendSubscription] = useState<SubscriptionResponse | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingSub, setLoadingSub] = useState(true);
  // --- End backend state ---

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
        const [plans, subscription, invoicesResult] = await Promise.all([
          listPlans().catch(() => [] as BillingPlanResponse[]),
          getMySubscription().catch(() => null as SubscriptionResponse | null),
          listMyInvoices().catch(() => [] as BillingInvoiceResponse[]),
        ]);

        if (cancelled) return;

        setBackendPlans(plans);
        setBackendSubscription(subscription);

        // Fetch prices for each plan
        if (plans.length > 0) {
          const prices = await Promise.all(
            plans.map(p => listPlanPrices(p.id).catch(() => [] as BillingPlanPriceResponse[]))
          );
          setBackendPlanPrices(prices.flat());
        }

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

  const handleSelectPlan = (planId: string, planName: string, planPrice: number) => {
    if (currentPlan && planName === currentPlan) return;

    const backendPlan = backendPlans.find(p => p.id === planId);
    const priceInfo = backendPlanPrices.find(p => p.planId === planId);
    const monthlyPrice = priceInfo ? (priceInfo.amountCents / 100) : planPrice;

    setSelectedPlan({ id: planId, name: planName, price: monthlyPrice });
    setUpgradeStep('checkout');
  };

  const handleCheckoutConfirm = async () => {
    if (!selectedPlan) return;

    if (!newCard.number.trim() || !newCard.expiry.trim() || !newCard.cvc.trim()) {
      showToast('Please fill in card details', 'error');
      return;
    }

    const { id, name } = selectedPlan;

    try {
      setIsProcessing(id);
      
      // TODO: Integrate real payment gateway (VNPay, Stripe) here
      // For now, subscribe directly
      const sub = await mySubscribe(id);
      setBackendSubscription(sub);
      setCurrentPlan(name);
      setIsUpgradeModalOpen(false);
      setUpgradeStep('selection');
      setSelectedPlan(null);
      setNewCard({ number: '', expiry: '', cvc: '', name: '' });
      showToast(t('billing.upgrade_success').replace('{plan}', name), 'success');
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

  const planPrice = billingCycle === 'yearly' 
    ? Math.floor((selectedPlan?.price ?? 0) * 0.8 * 100) / 100 
    : (selectedPlan?.price ?? 0);
  const planPriceDisplay = planPrice.toFixed(2);

  const renderCheckout = () => (
    <div className="max-w-lg mx-auto space-y-6 py-2 animate-in slide-in-from-right-4 duration-300">
      {/* Order Summary */}
      <div className="bg-[rgba(255,255,255,0.02)] rounded-[16px] border border-[rgba(255,255,255,0.3)] p-5 space-y-3">
        <h5 className="text-sm font-black text-[#f0f0f0]">{t('billing.order_summary') || 'Order Summary'}</h5>
        <div className="flex justify-between text-sm">
          <span className="text-[#a1a4a5]">{selectedPlan?.name} Plan ({billingCycle === 'yearly' ? t('billing.plans.yearly') : t('billing.plans.monthly')})</span>
          <span className="font-bold text-[#f0f0f0]">${planPriceDisplay}</span>
        </div>
        <div className="border-t border-[rgba(255,255,255,0.1)] pt-3 flex justify-between text-sm">
          <span className="font-black text-[#f0f0f0]">{t('billing.total_due') || 'Total due'}</span>
          <span className="font-black text-[#f0f0f0]">${planPriceDisplay}</span>
        </div>
        <button 
          onClick={() => setUpgradeStep('selection')}
          className="text-[10px] font-bold text-[#3b9eff] hover:underline"
        >
          ← {t('common.change')}
        </button>
      </div>

      {/* Payment Method */}
      <div className="space-y-3">
        <h5 className="text-sm font-black text-[#f0f0f0]">{t('billing.payment_method') || 'Payment method'}</h5>
        
        <div className="bg-[rgba(255,255,255,0.02)] rounded-[12px] border border-[rgba(255,255,255,0.3)] p-4 space-y-3">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#a1a4a5] uppercase tracking-wider">Card Number</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={newCard.number}
              onChange={(e) => setNewCard(p => ({ ...p, number: e.target.value }))}
              maxLength={19}
              className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary placeholder:text-[#a1a4a5]/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#a1a4a5] uppercase tracking-wider">Expiry</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={newCard.expiry}
                onChange={(e) => setNewCard(p => ({ ...p, expiry: e.target.value }))}
                maxLength={5}
                className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary placeholder:text-[#a1a4a5]/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#a1a4a5] uppercase tracking-wider">CVC</label>
              <input
                type="text"
                placeholder="123"
                value={newCard.cvc}
                onChange={(e) => setNewCard(p => ({ ...p, cvc: e.target.value }))}
                maxLength={4}
                className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary placeholder:text-[#a1a4a5]/40"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#a1a4a5] uppercase tracking-wider">Cardholder Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={newCard.name}
              onChange={(e) => setNewCard(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary placeholder:text-[#a1a4a5]/40"
            />
          </div>
        </div>
      </div>

      {/* Billing Address */}
      <div className="space-y-3">
        <h5 className="text-sm font-black text-[#f0f0f0]">{t('billing.details.address') || 'Billing address'}</h5>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Address line 1"
            value={billingAddress.line1}
            onChange={(e) => setBillingAddress(p => ({ ...p, line1: e.target.value }))}
            className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary placeholder:text-[#a1a4a5]/40"
          />
          <input
            type="text"
            placeholder="Address line 2 (optional)"
            value={billingAddress.line2}
            onChange={(e) => setBillingAddress(p => ({ ...p, line2: e.target.value }))}
            className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary placeholder:text-[#a1a4a5]/40"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="City"
              value={billingAddress.city}
              onChange={(e) => setBillingAddress(p => ({ ...p, city: e.target.value }))}
              className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary placeholder:text-[#a1a4a5]/40"
            />
            <select
              value={billingAddress.country}
              onChange={(e) => setBillingAddress(p => ({ ...p, country: e.target.value }))}
              className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary appearance-none"
            >
              <option value="US" className="bg-[#000000]">United States</option>
              <option value="VN" className="bg-[#000000]">Vietnam</option>
              <option value="GB" className="bg-[#000000]">United Kingdom</option>
              <option value="CA" className="bg-[#000000]">Canada</option>
              <option value="AU" className="bg-[#000000]">Australia</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="ZIP / Postal code"
            value={billingAddress.zip}
            onChange={(e) => setBillingAddress(p => ({ ...p, zip: e.target.value }))}
            className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] rounded-[8px] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-primary placeholder:text-[#a1a4a5]/40"
          />
        </div>
      </div>

      {/* Subscribe Button */}
      <button 
        onClick={handleCheckoutConfirm}
        disabled={isProcessing !== null}
        className="w-full py-4 bg-[#ffffff] text-[#000000] rounded-[16px] font-black shadow-xl shadow-primary/20 hover:bg-[#f0f0f0] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <><Loader2 size={20} className="animate-spin" />{t('common.processing')}</>
        ) : (
          <><ShieldCheck size={20} />{t('billing.pay_now') || 'Subscribe'}</>
        )}
      </button>
      <p className="text-[10px] text-center text-[#a1a4a5] leading-relaxed -mt-4">
        {t('billing.secure_note') || 'Your payment info is encrypted and secure. You can cancel anytime.'}
      </p>
    </div>
  );

  const renderPlansGrid = () => {
    if (loadingPlans) {
      return (
        <div className="col-span-full flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[#a1a4a5]" />
        </div>
      );
    }
    if (backendPlans.length === 0) {
      // Show fallback message with static plans if backend unavailable
      return (
        <div className="col-span-full space-y-6">
          <div className="text-center py-4 text-[#a1a4a5] text-sm">
            {loadingPlans ? 'Loading plans...' : (t('billing.no_plans') || 'Backend unavailable, showing default plans')}
          </div>
          {!loadingPlans && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'free', name: 'Free', price: 0 },
                { id: 'plus', name: 'Plus', price: 19 },
                { id: 'pro', name: 'Pro', price: 49 },
              ].map((plan) => {
                const displayPrice = billingCycle === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price;
                const isActive = plan.name === currentPlan;
                return (
                  <div key={plan.id} className={cn(
                    "relative p-6 rounded-[16px] transition-all",
                    isActive ? "bg-[rgba(59,158,255,0.05)]" : "bg-[#000000]"
                  )}>
                    <h4 className="text-lg font-black text-[#f0f0f0]">{plan.name}</h4>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#f0f0f0]">${displayPrice}</span>
                      <span className="text-sm font-medium text-[#a1a4a5]">/mo</span>
                    </div>
                    <p className="text-xs text-[#a1a4a5] mt-2">{t('billing.plans.billed')} {billingCycle === 'yearly' ? t('billing.plans.yearly') : t('billing.plans.monthly')}</p>
                    <button 
                      onClick={() => !isActive && handleSelectPlan(plan.id, plan.name, plan.price)}
                      disabled={isActive}
                      className={cn(
                        "w-full mt-6 py-3 rounded-[16px] font-black text-sm transition-all",
                        isActive ? "bg-[rgba(255,255,255,0.05)] text-[#a1a4a5] cursor-not-allowed" : "bg-[#ffffff] text-[#000000] shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0]"
                      )}
                    >
                      {isActive ? t('billing.plans.current') : t('billing.plans.select')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    return backendPlans.map((plan) => {
      const price = backendPlanPrices.find(p => p.planId === plan.id);
      const monthlyPrice = price ? (price.amountCents / 100).toFixed(0) : '--';
      const yearlyPrice = price ? ((price.amountCents / 100) * 0.8).toFixed(0) : '--';
      const displayPrice = billingCycle === 'yearly' ? yearlyPrice : monthlyPrice;
      const isActive = backendSubscription?.planId === plan.id || plan.name === currentPlan;

      return (
        <div 
          key={plan.id}
          className={cn(
            "relative p-6 rounded-[16px] transition-all group",
            isActive
              ? "bg-[rgba(59,158,255,0.05)]" 
              : "bg-[#000000] hover:shadow-xl"
          )}
        >
          <h4 className="text-lg font-black text-[#f0f0f0]">{plan.name}</h4>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-black text-[#f0f0f0]">
              ${displayPrice}
            </span>
            <span className="text-sm font-medium text-[#a1a4a5]">/mo</span>
          </div>
          <p className="text-xs text-[#a1a4a5] mt-2">{t('billing.plans.billed')} {billingCycle === 'yearly' ? t('billing.plans.yearly') : t('billing.plans.monthly')}</p>

          <button 
            onClick={() => handleSelectPlan(plan.id, plan.name, price ? (price.amountCents / 100) : 0)}
            disabled={isProcessing !== null || isActive}
            className={cn(
              "w-full mt-6 py-3 rounded-[16px] font-black text-sm transition-all flex items-center justify-center gap-2",
              isActive 
                ? "bg-[rgba(255,255,255,0.05)] text-[#a1a4a5] cursor-not-allowed" 
                : "bg-[#ffffff] text-[#000000] shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0]"
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
      <>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-display font-medium tracking-tight tracking-tight text-[#f0f0f0]">{t('billing.title')}</h2>
          </div>
          <div>
            <button className="px-4 py-2 bg-[#000000] text-[#f0f0f0] border border-[rgba(255,255,255,0.3)] rounded-md text-sm font-bold shadow-md shadow-black/40 hover:bg-[rgba(255,255,255,0.02)] transition-all">
              {t('billing.create_plan')}
            </button>
          </div>
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
        <div className="bg-[rgba(40,40,40,1)] rounded-[16px] overflow-hidden">
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
              <tbody className="divide-y divide-[rgba(255,255,255,0.3)] border-t border-[rgba(255,255,255,0.3)]">
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
    </>
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
                          {currentPlan === 'Free' ? t('billing.free_forever') : `${t('billing.billed_monthly')}`}
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
                          <>{currentPlan === 'Free' ? '$0' : '--'}<span className="text-sm font-medium text-[#a1a4a5]">/mo</span></>
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
                  onClick={() => { setIsUpgradeModalOpen(false); setUpgradeStep('selection'); setSelectedPlan(null); }}
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
                  renderCheckout()
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

      </div>
    </>
  );
}
