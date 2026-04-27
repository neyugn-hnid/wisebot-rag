import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { 
  CreditCard, 
  CheckCircle2, 
  ArrowUpRight, 
  Download, 
  Zap,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  Trash2,
  MapPin,
  Globe,
  X,
  ChevronRight,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Loader2,
  LayoutDashboard,
  Bell,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useRole } from '../contexts/RoleContext';

const userInvoices = [
  { id: 'INV-2024-001', date: 'Jun 01, 2024', amount: '$49.00', status: 'PAID' },
  { id: 'INV-2024-002', date: 'May 01, 2024', amount: '$49.00', status: 'PAID' },
  { id: 'INV-2024-003', date: 'Apr 01, 2024', amount: '$49.00', status: 'PAID' },
  { id: 'INV-2024-004', date: 'Mar 01, 2024', amount: '$49.00', status: 'REFUNDED' },
  { id: 'INV-2024-005', date: 'Feb 01, 2024', amount: '$49.00', status: 'PAID' },
  { id: 'INV-2024-006', date: 'Jan 01, 2024', amount: '$49.00', status: 'PAID' },
  { id: 'INV-2023-012', date: 'Dec 01, 2023', amount: '$49.00', status: 'PAID' },
  { id: 'INV-2023-011', date: 'Nov 01, 2023', amount: '$49.00', status: 'PAID' },
  { id: 'INV-2023-010', date: 'Oct 01, 2023', amount: '$49.00', status: 'PAID' },
  { id: 'INV-2023-009', date: 'Sep 01, 2023', amount: '$49.00', status: 'PAID' },
];

const adminSubscriptions = [
  { user: 'Alex Rivet', plan: 'Pro', amount: '$49.00', status: 'Active', date: 'Jun 01, 2024' },
  { user: 'Sarah Chen', plan: 'Enterprise', amount: '$299.00', status: 'Active', date: 'May 28, 2024' },
  { user: 'Mike Johnson', plan: 'Starter', amount: '$19.00', status: 'Past Due', date: 'May 15, 2024' },
  { user: 'Emma Wilson', plan: 'Pro', amount: '$49.00', status: 'Canceled', date: 'May 10, 2024' },
];

const defaultPaymentMethods = [
  { id: 'pm_1', type: 'Visa', last4: '4242', exp: '12/26', isPrimary: true },
  { id: 'pm_2', type: 'Mastercard', last4: '8888', exp: '08/25', isPrimary: false },
];

const loadPaymentMethods = () => {
  try {
    const saved = localStorage.getItem('paymentMethods');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return defaultPaymentMethods;
};

const availablePlans = [
  { 
    id: 'free', 
    name: 'Free', 
    price: 0, 
    features: ['billing.plans.free.f1', 'billing.plans.free.f2', 'billing.plans.free.f3'],
    color: 'slate'
  },
  { 
    id: 'plus', 
    name: 'Plus', 
    price: 19, 
    features: ['billing.plans.plus.f1', 'billing.plans.plus.f2', 'billing.plans.plus.f3', 'billing.plans.plus.f4'],
    color: 'primary'
  },
  { 
    id: 'pro', 
    name: 'Pro', 
    price: 49, 
    features: ['billing.plans.pro.f1', 'billing.plans.pro.f2', 'billing.plans.pro.f3', 'billing.plans.pro.f4', 'billing.plans.pro.f5'],
    color: 'indigo'
  },
];

export default function Billing() {
  const { t, language } = useLanguage();
  const { role } = useRole();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [upgradeStep, setUpgradeStep] = useState<'selection' | 'checkout'>('selection');
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<any>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [paymentMethodsList, setPaymentMethodsList] = useState(loadPaymentMethods);
  const [invoices, setInvoices] = useState(userInvoices);

  useEffect(() => {
    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethodsList));
  }, [paymentMethodsList]);

  useEffect(() => {
    if (location.state?.selectedPlanId) {
      const plan = availablePlans.find(p => p.id === location.state.selectedPlanId);
      if (plan) {
        setSelectedPlanForUpgrade(plan);
        setIsUpgradeModalOpen(true);
        if (plan.id !== 'free') {
          setUpgradeStep('checkout');
        }
      }
    }
  }, [location.state]);

  const handleSelectPlan = (planId: string, planName: string) => {
    const plan = availablePlans.find(p => p.id === planId);
    if (!plan || (planId === 'free' && currentPlan === 'Free')) return;
    
    if (planId === 'free') {
      // Downgrade to free is instant in this demo
      setCurrentPlan('Free');
      setIsUpgradeModalOpen(false);
      showToast(t('billing.downgrade_success'), 'info');
      return;
    }

    setSelectedPlanForUpgrade(plan);
    setUpgradeStep('checkout');
  };

  const handleConfirmPayment = () => {
    if (!selectedPlanForUpgrade) return;
    
    setIsProcessing(selectedPlanForUpgrade.id);
    
    // Simulate payment processing
    setTimeout(() => {
      const amount = billingCycle === 'yearly' ? Math.floor(selectedPlanForUpgrade.price * 0.8) : selectedPlanForUpgrade.price;
      const newInvoice = {
        id: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        amount: `$${amount}.00`,
        status: 'PAID'
      };

      setInvoices(prev => [newInvoice, ...prev]);
      setIsProcessing(null);
      setCurrentPlan(selectedPlanForUpgrade.name);
      setIsUpgradeModalOpen(false);
      setUpgradeStep('selection');
      showToast(t('billing.upgrade_success').replace('{plan}', selectedPlanForUpgrade.name), 'success');
      
      // Clear navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }, 2000);
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
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);

  if (role === 'admin') {
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
              <p className="text-3xl font-black text-[#f0f0f0]">$12,450</p>
              <span className="flex items-center text-emerald-500 text-sm font-bold mb-1">
                <TrendingUp size={16} className="mr-1" /> +14%
              </span>
            </div>
          </div>
          <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
            <div className="flex items-center gap-3 text-[#a1a4a5] mb-2">
              <Users size={20} />
              <h3 className="font-bold text-sm">{t('billing.active_subs')}</h3>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-black text-[#f0f0f0]">842</p>
              <span className="flex items-center text-emerald-500 text-sm font-bold mb-1">
                <TrendingUp size={16} className="mr-1" /> +5%
              </span>
            </div>
          </div>
          <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
            <div className="flex items-center gap-3 text-[#a1a4a5] mb-2">
              <CreditCard size={20} />
              <h3 className="font-bold text-sm">{t('billing.failed_payments')}</h3>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-black text-[#f0f0f0]">12</p>
              <span className="flex items-center text-[#ff0000] text-sm font-bold mb-1">
                <TrendingUp size={16} className="mr-1" /> +2%
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
                {adminSubscriptions.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-[rgba(255,255,255,0.02)]/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-[#f0f0f0]">{sub.user}</td>
                    <td className="px-6 py-4 text-sm text-[#a1a4a5]">{sub.plan}</td>
                    <td className="px-6 py-4 text-sm text-[#f0f0f0] font-black">{sub.amount}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-0 py-0.5 text-xs font-black uppercase tracking-wider",
                        sub.status === 'Active' ? "text-emerald-500" : 
                        sub.status === 'Past Due' ? "text-amber-500" : "text-[#a1a4a5]"
                      )}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#a1a4a5]">{sub.date}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-xs font-bold text-[#3b9eff] hover:underline">{t('billing.manage')}</button>
                    </td>
                  </tr>
                ))}
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
                          {currentPlan === 'Free' ? t('billing.free_forever') : `${t('billing.billed_monthly')} • ${t('billing.next_renewal')} July 1, 2024`}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-3xl font-black text-[#f0f0f0]">
                        ${currentPlan === 'Free' ? '0' : currentPlan === 'Plus' ? '19' : '49'}
                        <span className="text-sm font-medium text-[#a1a4a5]">/mo</span>
                      </p>
                      {currentPlan !== 'Free' && (
                        <button className="text-xs font-bold text-[#ff0000] hover:underline mt-1">{t('billing.cancel')}</button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-[#f0f0f0]">{t('billing.usage.messages')}</span>
                        <span className="text-xs font-black text-[#f0f0f0]">8,420 / 10,000</span>
                      </div>
                      <div className="h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: '84.2%' }}></div>
                      </div>
                      <p className="text-[10px] text-[#a1a4a5] font-medium">{t('billing.usage.reset')} 12 days</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-[#f0f0f0]">{t('billing.usage.storage')}</span>
                        <span className="text-xs font-black text-[#f0f0f0]">1.2 GB / 5 GB</span>
                      </div>
                      <div className="h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '24%' }}></div>
                      </div>
                      <p className="text-[10px] text-[#a1a4a5] font-medium">24% {t('billing.usage.capacity')}</p>
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
                  <>
                    {/* ... (Billing Cycle Switcher and Plans Grid) */}
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
                      {availablePlans.map((plan) => (
                        <div 
                          key={plan.id}
                          className={cn(
                            "relative p-6 rounded-[16px] border-2 transition-all group hover:shadow-xl",
                            (location.state?.selectedPlanId === plan.id || (!location.state?.selectedPlanId && plan.id === 'plus')) 
                              ? "border border-primary bg-[rgba(59,158,255,0.05)]" 
                              : "border border-[rgba(255,255,255,0.3)] hover:border-[rgba(255,255,255,0.3)] bg-[#000000]"
                          )}
                        >
                          {(location.state?.selectedPlanId === plan.id || (!location.state?.selectedPlanId && plan.id === 'plus')) && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#ffffff] text-[#000000] text-[10px] font-black uppercase tracking-widest rounded-full shadow-md shadow-black/40">
                              {plan.id === 'plus' ? t('billing.plans.popular') : t('billing.plans.selected')}
                            </div>
                          )}
                          <h4 className="text-lg font-black text-[#f0f0f0]">{t(`billing.plans.${plan.id}`)}</h4>
                          <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-3xl font-black text-[#f0f0f0]">
                              ${billingCycle === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price}
                            </span>
                            <span className="text-sm font-medium text-[#a1a4a5]">/mo</span>
                          </div>
                          <p className="text-xs text-[#a1a4a5] mt-2">{t('billing.plans.billed')} {billingCycle === 'yearly' ? t('billing.plans.yearly') : t('billing.plans.monthly')}</p>

                          <button 
                            onClick={() => handleSelectPlan(plan.id, plan.name)}
                            disabled={isProcessing !== null || (plan.name === currentPlan)}
                            className={cn(
                              "w-full mt-6 py-3 rounded-[16px] font-black text-sm transition-all flex items-center justify-center gap-2",
                              plan.id === 'plus' 
                                ? "bg-[#ffffff] text-[#000000] shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0]" 
                                : "bg-[rgba(255,255,255,0.05)] text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.05)]",
                              (plan.name === currentPlan) && "opacity-50 cursor-default"
                            )}
                          >
                            {plan.name === currentPlan ? t('billing.plans.current') : t('billing.plans.select')}
                          </button>

                          <div className="mt-8 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-wider text-[#a1a4a5]">{t('billing.plans.features')}</p>
                            {plan.features.map((feature, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-xs text-[#a1a4a5] font-medium">{t(feature)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="max-w-md mx-auto space-y-8 py-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-4 p-4 bg-[rgba(255,255,255,0.02)] rounded-[16px] border border-[rgba(255,255,255,0.3)]">
                      <div className="w-12 h-12 rounded-[16px] bg-[rgba(59,158,255,0.1)] flex items-center justify-center text-[#3b9eff]">
                        <Zap size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-[#f0f0f0]">
                          {language === 'vi' 
                            ? (selectedPlanForUpgrade?.name === 'Free' ? 'Gói Miễn phí' : `Gói ${selectedPlanForUpgrade?.name}`)
                            : `${selectedPlanForUpgrade?.name} Plan`}
                        </h4>
                        <p className="text-xs text-[#a1a4a5]">{billingCycle === 'yearly' ? t('billing.plans.yearly') : t('billing.plans.monthly')} billing</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[#f0f0f0]">
                          ${billingCycle === 'yearly' ? Math.floor(selectedPlanForUpgrade?.price * 0.8) : selectedPlanForUpgrade?.price}
                        </p>
                        <button 
                          onClick={() => setUpgradeStep('selection')}
                          className="text-[10px] font-bold text-[#3b9eff] hover:underline"
                        >
                          {t('common.change')}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-sm font-black text-[#f0f0f0]">{t('billing.payment_methods')}</h5>
                      
                      {paymentMethodsList.length > 0 ? (
                        <div className="space-y-3">
                          {paymentMethodsList.map((method) => (
                            <button
                              key={method.id}
                              onClick={() => setSelectedPaymentMethodId(method.id)}
                              className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-[16px] border-2 transition-all text-left",
                                selectedPaymentMethodId === method.id 
                                  ? "border border-primary bg-[rgba(59,158,255,0.05)]" 
                                  : "border border-[rgba(255,255,255,0.3)] bg-[#000000] hover:border-[rgba(255,255,255,0.3)]"
                              )}
                            >
                              <div className="w-10 h-10 rounded-[12px] bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#a1a4a5]">
                                <CreditCard size={20} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-[#f0f0f0]">•••• •••• •••• {method.last4}</p>
                                <p className="text-[10px] text-[#a1a4a5]">{t('billing.payment_methods.expires')} {method.expiry}</p>
                              </div>
                              {selectedPaymentMethodId === method.id && (
                                <CheckCircle2 size={20} className="text-[#3b9eff]" />
                              )}
                            </button>
                          ))}
                          <button 
                            onClick={() => {
                              setIsUpgradeModalOpen(false);
                              setIsPaymentModalOpen(true);
                            }}
                            className="w-full py-3 border-2 border-dashed border border-[rgba(255,255,255,0.3)] rounded-[16px] text-[#a1a4a5] text-xs font-bold hover:border-primary hover:text-[#3b9eff] transition-all flex items-center justify-center gap-2"
                          >
                            <Plus size={16} />
                            {t('billing.payment_methods.add')}
                          </button>
                        </div>
                      ) : (
                        <div className="p-8 border-2 border-dashed border border-[rgba(255,255,255,0.3)] rounded-[16px] text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#a1a4a5] mx-auto">
                            <CreditCard size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#f0f0f0]">{t('billing.no_payment_methods')}</p>
                          </div>
                          <button 
                            onClick={() => {
                              setIsUpgradeModalOpen(false);
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-6 py-2 bg-[#ffffff] text-[#000000] rounded-[16px] text-xs font-black shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all"
                          >
                            {t('billing.payment_methods.add')}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-sm font-black text-[#f0f0f0]">{t('billing.details.address')}</h5>
                      <div className="p-4 bg-[rgba(255,255,255,0.02)] rounded-[16px] border border-[rgba(255,255,255,0.3)] flex items-start gap-4">
                        <div className="w-10 h-10 rounded-[12px] bg-[#000000] flex items-center justify-center text-[#a1a4a5] border border-[rgba(255,255,255,0.3)]">
                          <MapPin size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#f0f0f0]">Alex Rivet</p>
                          <p className="text-xs text-[#a1a4a5] mt-0.5">123 Innovation Drive, Suite 400</p>
                          <p className="text-xs text-[#a1a4a5]">San Francisco, CA 94103, USA</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleConfirmPayment}
                      disabled={isProcessing !== null || !selectedPaymentMethodId}
                      className="w-full py-4 bg-[#ffffff] text-[#000000] rounded-[16px] font-black shadow-xl shadow-primary/20 hover:bg-[#f0f0f0] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          {t('common.processing')}
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={20} />
                          {t('billing.pay_now')}
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-center text-[#a1a4a5] leading-relaxed">
                      By clicking "Pay Now", you agree to our Terms of Service and authorize us to charge your payment method on a recurring basis.
                    </p>
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
                      exp: '12/28',
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
