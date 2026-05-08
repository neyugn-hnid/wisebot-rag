import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Globe, 
  Lock, 
  Camera,
  ChevronRight,
  Mail,
  Smartphone,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Github,
  Slack,
  Trello,
  Users,
  CreditCard,
  Activity,
  Monitor,
  Sun,
  Moon,
  Settings as SettingsIcon,
  Palette,
  ChevronDown,
  X,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

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

import DeleteModal from '../components/DeleteModal';

export default function Settings() {
  const navigate = useNavigate();
  const { role, logout } = useRole();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('system');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [marketingNotifications, setMarketingNotifications] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<string | null>(null);
  const [paymentMethodsList, setPaymentMethodsList] = useState(loadPaymentMethods);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethodsList));
  }, [paymentMethodsList]);

  const navItems = [
    { id: 'system', label: t('settings.system'), icon: SettingsIcon },
    { id: 'billing', label: t('billing.payment_methods.title'), icon: CreditCard },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-[24px] font-display font-medium tracking-tight tracking-tight text-[#f0f0f0]">{t('settings.title')}</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-[16px] transition-all",
                activeTab === item.id ? "bg-[#000000] text-[#3b9eff] shadow-md shadow-black/40 border border-[rgba(255,255,255,0.3)]" : "text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)]"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-[16px] transition-all text-[#ff0000] hover:bg-[rgba(255,0,0,0.05)]"
          >
            <LogOut size={18} />
            {t('profile.sign_out')}
          </button>
        </aside>

        {/* Settings Content */}
        <div className="flex-1 space-y-8">
          {activeTab === 'system' && (
            <section className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 overflow-hidden animate-in slide-in-from-right-4 duration-300">
              <div className="p-6 border-b border-[rgba(255,255,255,0.3)]">
                <h3 className="text-lg font-bold text-[#f0f0f0]">{t('settings.system')}</h3>
              </div>
              
              <div className="p-8 space-y-10">
                {/* Language Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-[#a1a4a5] flex items-center justify-center">
                      <Globe size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#f0f0f0]">{t('settings.language')}</h4>
                    </div>
                  </div>
                  <div className="max-w-xs space-y-2">
                    <label className="text-xs font-bold text-[#f0f0f0]">{t('settings.language.select')}</label>
                    <div className="relative">
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}
                        className="w-full appearance-none bg-transparent border border-[rgba(255,255,255,0.3)] text-[#f0f0f0] text-sm rounded-md px-4 py-2 focus:outline-none focus:border-[#3b9eff] focus:ring-1 focus:ring-[#3b9eff] transition-colors"
                      >
                        <option value="vi" className="bg-[#000000] text-[#f0f0f0]">{t('common.vietnamese')}</option>
                        <option value="en" className="bg-[#000000] text-[#f0f0f0]">{t('common.english')}</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

                {/* Appearance Settings */}
                <div className="space-y-4 pt-8 border-t border-[rgba(255,255,255,0.3)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-[#a1a4a5] flex items-center justify-center">
                      <Palette size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#f0f0f0]">{t('settings.appearance')}</h4>
                    </div>
                  </div>
                  
                  <div className="max-w-xs">
                    <div className="relative">
                      <select 
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as any)}
                        className="w-full appearance-none bg-transparent border border-[rgba(255,255,255,0.3)] text-[#f0f0f0] text-sm rounded-md px-4 py-2 focus:outline-none focus:border-[#3b9eff] focus:ring-1 focus:ring-[#3b9eff] transition-colors"
                      >
                        <option value="light" className="bg-[#000000] text-[#f0f0f0]">{t('settings.theme.light')}</option>
                        <option value="dark" className="bg-[#000000] text-[#f0f0f0]">{t('settings.theme.dark')}</option>
                        <option value="system" className="bg-[#000000] text-[#f0f0f0]">{t('settings.theme.system')}</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.3)] flex justify-end">
                <button 
                  onClick={() => showToast(t('toast.user_updated'), 'success')}
                  className="px-6 py-2 bg-[#ffffff] text-[#000000] text-sm font-bold rounded-md shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all"
                >
                  {t('common.save')}
                </button>
              </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 overflow-hidden animate-in slide-in-from-right-4 duration-300">
              <div className="p-6 border-b border-[rgba(255,255,255,0.3)]">
                <h3 className="text-lg font-bold text-[#f0f0f0]">{t('settings.security')}</h3>
              </div>
              <div className="divide-y divide-[rgba(255,255,255,0.3)]">
                <div 
                  className="p-6 flex items-center justify-between group cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[16px] bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#a1a4a5] group-hover:text-[#3b9eff] transition-colors">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#f0f0f0]">{t('settings.security.password')}</h4>
                      <p className="text-xs text-[#a1a4a5] mt-0.5">{t('settings.security.password.desc')}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[rgba(255,255,255,0.3)] group-hover:text-[#a1a4a5] transition-colors" />
                </div>
                <div className="p-6 flex items-center justify-between group cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[16px] bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#a1a4a5] group-hover:text-[#3b9eff] transition-colors">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#f0f0f0]">{t('settings.security.2fa')}</h4>
                      <p className="text-xs text-emerald-500 font-bold mt-0.5">{t('settings.security.2fa.desc')}</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-[#3b9eff] hover:underline">{t('settings.apps.connect')}</button>
                </div>
                <div className="p-6 flex items-center justify-between group cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[16px] bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#a1a4a5] group-hover:text-[#3b9eff] transition-colors">
                      <Activity size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#f0f0f0]">{t('settings.security.sessions')}</h4>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[rgba(255,255,255,0.3)] group-hover:text-[#a1a4a5] transition-colors" />
                </div>
              </div>
            </section>
          )}

          {activeTab === 'notifications' && (
            <section className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 overflow-hidden animate-in slide-in-from-right-4 duration-300">
              <div className="p-6 border-b border-[rgba(255,255,255,0.3)]">
                <h3 className="text-lg font-bold text-[#f0f0f0]">{t('settings.notifications')}</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#f0f0f0]">{t('settings.notifications.email')}</h4>
                  </div>
                  <button 
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                      emailNotifications ? "bg-primary" : "bg-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-[#000000] transition-transform shadow-md shadow-black/40",
                        emailNotifications ? "translate-x-5" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#f0f0f0]">{t('settings.notifications.push')}</h4>
                  </div>
                  <button 
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                      pushNotifications ? "bg-primary" : "bg-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-[#000000] transition-transform shadow-md shadow-black/40",
                        pushNotifications ? "translate-x-5" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#f0f0f0]">{t('settings.notifications.marketing')}</h4>
                  </div>
                  <button 
                    onClick={() => setMarketingNotifications(!marketingNotifications)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                      marketingNotifications ? "bg-primary" : "bg-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-[#000000] transition-transform shadow-md shadow-black/40",
                        marketingNotifications ? "translate-x-5" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </div>
              <div className="p-6 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.3)] flex justify-end gap-3">
                <button 
                  onClick={() => showToast(t('toast.user_updated'), 'success')}
                  className="px-6 py-2 bg-[#ffffff] text-[#000000] text-sm font-bold rounded-md shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all"
                >
                  {t('settings.notifications.save')}
                </button>
              </div>
            </section>
          )}

          {activeTab === 'billing' && (
            <section className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 overflow-hidden animate-in slide-in-from-right-4 duration-300">
              <div className="p-6 border-b border-[rgba(255,255,255,0.3)] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#f0f0f0]">{t('billing.payment_methods.title')}</h3>
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-4 py-2 bg-[rgba(255,255,255,0.05)] text-[#f0f0f0] rounded-[12px] text-xs font-bold hover:bg-[rgba(255,255,255,0.05)] transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> {t('billing.payment_methods.add')}
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                {paymentMethodsList.map(method => (
                  <div key={method.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-[rgba(255,255,255,0.3)] rounded-[16px] hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[12px] bg-[rgba(255,255,255,0.02)] flex items-center justify-center text-[#f0f0f0] shrink-0">
                        {method.type === 'PayPal' ? <Globe size={24} /> : <CreditCard size={24} />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-[#f0f0f0]">
                            {method.type} {method.last4 ? `•••• ${method.last4}` : ''}
                          </h4>
                          {method.isPrimary && (
                            <span className="px-2 py-0.5 bg-[rgba(59,158,255,0.1)] text-[#3b9eff] text-[10px] font-black uppercase tracking-wider rounded-full">
                              {t('billing.payment_methods.primary')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#a1a4a5] mt-0.5">
                          {method.type === 'PayPal' ? 'Connected' : `${t('billing.payment_methods.expires')} ${method.exp}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {!method.isPrimary && (
                        <button 
                          onClick={() => {
                            setPaymentMethodsList(prev => prev.map(m => ({ ...m, isPrimary: m.id === method.id })));
                          }}
                          className="text-xs font-bold text-[#3b9eff] hover:underline px-3 py-1"
                        >
                          {t('billing.payment_methods.set_primary')}
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setMethodToDelete(method.id);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="p-2 text-[#ff0000] hover:bg-[#ff0000]/10 rounded-[12px] transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {paymentMethodsList.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[rgba(255,255,255,0.02)] text-[rgba(255,255,255,0.3)] rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard size={24} />
                    </div>
                    <p className="text-[#a1a4a5] font-medium">{t('billing.no_payment_methods')}</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl shadow-black/50 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[rgba(255,255,255,0.3)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#f0f0f0]">{t('settings.security.password')}</h3>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-[#a1a4a5] hover:text-[#a1a4a5] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#f0f0f0] uppercase tracking-wider mb-2">
                  {t('settings.security.password.current')} <span className="text-[#ff0000]">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                    className="w-full px-4 py-2 pr-10 bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-sm font-medium text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#a1a4a5] transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#f0f0f0] uppercase tracking-wider mb-2">
                  {t('settings.security.password.new')} <span className="text-[#ff0000]">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                    className="w-full px-4 py-2 pr-10 bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-sm font-medium text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#a1a4a5] transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#f0f0f0] uppercase tracking-wider mb-2">
                  {t('settings.security.password.confirm')} <span className="text-[#ff0000]">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                    className="w-full px-4 py-2 pr-10 bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-sm font-medium text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#a1a4a5] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.3)] flex justify-end gap-3">
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-colors"
              >
                {t('settings.security.password.cancel')}
              </button>
              <button 
                onClick={() => {
                  showToast(t('toast.user_updated'), 'success');
                  setIsPasswordModalOpen(false);
                  setPasswordForm({ current: '', new: '', confirm: '' });
                }}
                disabled={!passwordForm.current || !passwordForm.new || !passwordForm.confirm || passwordForm.new !== passwordForm.confirm}
                className="px-6 py-2 bg-[#ffffff] text-[#000000] text-sm font-bold rounded-md shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('settings.security.password.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Confirm Modal */}
      <DeleteModal 
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setMethodToDelete(null);
        }}
        onConfirm={() => {
          if (methodToDelete) {
            setPaymentMethodsList(prev => prev.filter(m => m.id !== methodToDelete));
            showToast(t('billing.payment_methods.delete_success'), 'success');
          }
          setIsDeleteConfirmOpen(false);
          setMethodToDelete(null);
        }}
        isDeleting={false}
        title={t('billing.payment_methods.delete_confirm')}
        description={t('billing.payment_methods.delete_desc')}
        confirmText={t('billing.payment_methods.delete_confirm_btn')}
      />

      {/* Add Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl shadow-black/50 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.3)]">
              <h3 className="text-lg font-bold text-[#f0f0f0]">{t('billing.payment_methods.add')}</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-[#a1a4a5] hover:text-[#a1a4a5]">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Fake form for adding payment method */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#f0f0f0] uppercase tracking-wider mb-2">{t('billing.payment_methods.cardholder_name')}</label>
                  <input type="text" placeholder="John Doe" className="w-full px-4 py-2.5 bg-transparent border border-[rgba(255,255,255,0.3)] font-medium outline-none transition-all rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#f0f0f0] uppercase tracking-wider mb-2">{t('billing.payment_methods.card_number')}</label>
                  <div className="relative">
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-[rgba(255,255,255,0.3)] font-medium outline-none transition-all font-mono rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40" />
                    <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#f0f0f0] uppercase tracking-wider mb-2">{t('billing.payment_methods.expiry')}</label>
                    <input type="text" placeholder="MM/YY" className="w-full px-4 py-2.5 bg-transparent border border-[rgba(255,255,255,0.3)] font-medium outline-none transition-all font-mono rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#f0f0f0] uppercase tracking-wider mb-2">{t('billing.payment_methods.cvc')}</label>
                    <input type="text" placeholder="123" className="w-full px-4 py-2.5 bg-transparent border border-[rgba(255,255,255,0.3)] font-medium outline-none transition-all font-mono rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#f0f0f0] uppercase tracking-wider mb-2">{t('billing.payment_methods.billing_address')}</label>
                  <input type="text" placeholder="123 AI Street, San Francisco, CA" className="w-full px-4 py-2.5 bg-transparent border border-[rgba(255,255,255,0.3)] font-medium outline-none transition-all rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.3)] flex justify-end gap-3">
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 bg-[#000000] border border-[rgba(255,255,255,0.3)] text-[#f0f0f0] rounded-md text-sm font-bold hover:bg-[rgba(255,255,255,0.02)] transition-all"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={() => {
                  const newMethod = {
                    id: `pm_${Date.now()}`,
                    type: 'Visa',
                    last4: '4242',
                    exp: '12/28',
                    isPrimary: paymentMethodsList.length === 0
                  };
                  setPaymentMethodsList([...paymentMethodsList, newMethod]);
                  setIsPaymentModalOpen(false);
                  showToast(t('billing.payment_methods.add_success'), 'success');
                }}
                className="px-6 py-2 bg-[#ffffff] text-[#000000] rounded-md text-sm font-bold shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all"
              >
                {t('billing.payment_methods.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
