import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Smartphone, 
  Camera, 
  Shield, 
  Calendar,
  MapPin,
  Briefcase,
  Link as LinkIcon,
  Twitter,
  Github,
  Linkedin,
  ChevronRight,
  ExternalLink,
  CreditCard,
  Building,
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  Star,
  BookOpen,
  Layout,
  Package,
  MoreHorizontal,
  Info,
  Edit2,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useRole } from '../contexts/RoleContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import DeleteModal from '../components/DeleteModal';

type Tab = 'overview' | 'personal' | 'billing' | 'security';

export default function Profile() {
  const { role } = useRole();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    showToast('Account deleted successfully', 'success');
    navigate('/login');
  };

  const tabs = [
    { id: 'personal', label: t('profile.personal_info'), icon: User },
    { id: 'billing', label: t('billing.title'), icon: CreditCard },
    { id: 'security', label: t('profile.security'), icon: Shield },
  ];

  return (
    <div className="max-w-[1280px] mx-auto pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-4 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="relative group w-32 h-32 sm:w-40 sm:h-40 lg:w-full lg:h-auto lg:aspect-square">
            <div className="w-full h-full rounded-full overflow-hidden shadow-md shadow-black/40 relative">
              <img 
                src="https://picsum.photos/seed/alex/400/400" 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                <Camera size={24} />
                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Change Avatar</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 lg:bottom-2 lg:right-2 w-8 h-8 bg-[#000000] rounded-full flex items-center justify-center shadow-md shadow-black/40 text-[#3b9eff] cursor-pointer transition-colors">
              <Camera size={14} />
            </div>
          </div>

          <div className="pt-2 lg:pt-4 space-y-0">
            <h1 className="text-[24px] font-display font-medium tracking-tight text-[#f0f0f0]">Alex Rivet</h1>
            <h2 className="text-lg font-light text-[#a1a4a5]">alexrivet</h2>
          </div>

          <div className="py-2 space-y-2 w-full">
            <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.3)] flex flex-col items-start">
              <div className="flex items-center gap-2 text-sm text-[#f0f0f0]">
                <MapPin size={16} className="text-[#a1a4a5]" />
                <span>San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#f0f0f0]">
                <Mail size={16} className="text-[#a1a4a5]" />
                <span>alex.rivet@company.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#f0f0f0]">
                <LinkIcon size={16} className="text-[#a1a4a5]" />
                <a href="#" className="hover:text-[#3b9eff] hover:underline">alexrivet.com</a>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#f0f0f0]">
                <Twitter size={16} className="text-[#a1a4a5]" />
                <a href="#" className="hover:text-[#3b9eff] hover:underline">@alexrivet</a>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9">
          <div className="space-y-8">
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="relative bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-xl shadow-lg shadow-black/50 overflow-hidden group">
                  {/* Subtle gradient glow in background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-50" />
                  
                  <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[rgba(255,255,255,0.3)]">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-[rgba(255,255,255,0.05)] flex-shrink-0">
                        <Star className="w-6 h-6 text-blue-400 fill-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-[#f0f0f0]">{t('billing.current_plan')}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border-blue-500/20">
                            {t('billing.active')}
                          </span>
                        </div>
                        <p className="text-sm text-[#a1a4a5] mt-1">
                          {t('billing.current_plan.desc')}{' '}
                          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            {t('billing.plans.pro')}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-left sm:text-right">
                      <div className="flex items-baseline gap-1 sm:justify-end">
                        <span className="text-3xl font-black text-[#f0f0f0] tracking-tight">$29</span>
                        <span className="text-sm text-[#a1a4a5]">/{t('billing.plans.monthly').toLowerCase().replace('hàng tháng', 'tháng').replace('monthly', 'mo')}</span>
                      </div>
                      <p className="text-xs text-[#a1a4a5] mt-1.5 flex items-center gap-1 sm:justify-end">
                        <Calendar size={12} className="text-[#a1a4a5]" />
                        {t('billing.current_plan.next_billing')}: {language === 'vi' ? '1 tháng 5, 2026' : 'May 1, 2026'}
                      </p>
                    </div>
                  </div>

                  <div className="relative bg-[rgba(255,255,255,0.02)] p-4 px-6 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-sm text-[#a1a4a5]">{t('billing.current_plan.need_more')}</p>
                    </div>
                    <button 
                      onClick={() => navigate('/billing')}
                      className="h-9 px-5 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-700 transition-all shadow-sm cursor-pointer"
                    >
                      {t('billing.upgrade')}
                    </button>
                  </div>
                </div>

                <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-md shadow-md shadow-black/40 overflow-hidden">
                  <div className="p-6 border-b border-[rgba(255,255,255,0.3)] flex items-center justify-between bg-[rgba(255,255,255,0.02)]/30">
                  <div>
                    <h3 className="text-base font-bold text-[#f0f0f0]">{t('profile.personal_info')}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className={cn(
                        "h-8 px-3 flex items-center justify-center rounded-md border transition-all",
                        isEditing 
                          ? "bg-[#000000] border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.02)]" 
                          : "bg-blue-600 border border-transparent text-white hover:bg-blue-700 shadow-sm"
                      )}
                      title={isEditing ? t('common.cancel') : t('profile.edit')}
                    >
                      {isEditing ? <X size={16} /> : <Edit2 size={16} />}
                    </button>
                    {isEditing && (
                      <button 
                        type="submit"
                        form="personal-info-form"
                        className="h-8 px-4 flex items-center justify-center bg-[#ffffff] text-[#000000] text-xs font-bold rounded-md hover:bg-[#f0f0f0] transition-all"
                      >
                        {t('common.save_short')}
                      </button>
                    )}
                  </div>
                </div>
                <form id="personal-info-form" onSubmit={(e) => { e.preventDefault(); setIsEditing(false); }} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#f0f0f0]">{t('team.full_name')}</label>
                      <input 
                        type="text" 
                        required
                        defaultValue="Alex Rivet" 
                        disabled={!isEditing}
                        className={cn(
                          "w-full px-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40",
                          isEditing ? "border border-[rgba(255,255,255,0.2)] text-[#f0f0f0]" : "border border-[rgba(255,255,255,0.3)] text-[#a1a4a5]"
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#f0f0f0]">{t('team.email_address')}</label>
                      <input 
                        type="email" 
                        required
                        defaultValue="alex.rivet@company.com" 
                        disabled
                        className="w-full bg-transparent px-3 py-2 font-medium outline-none rounded-[8px] border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] text-[14px] transition-all placeholder:text-[#a1a4a5]/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#f0f0f0]">{t('billing.support.phone')}</label>
                      <input 
                        type="tel" 
                        pattern="[+0-9\s\-\(\)]+"
                        defaultValue="+1 (555) 000-0000" 
                        disabled={!isEditing}
                        className={cn(
                          "w-full px-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40",
                          isEditing ? "border border-[rgba(255,255,255,0.2)] text-[#f0f0f0]" : "border border-[rgba(255,255,255,0.3)] text-[#a1a4a5]"
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.location')}</label>
                      <input 
                        type="text" 
                        required
                        defaultValue="San Francisco, CA" 
                        disabled={!isEditing}
                        className={cn(
                          "w-full px-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40",
                          isEditing ? "border border-[rgba(255,255,255,0.2)] text-[#f0f0f0]" : "border border-[rgba(255,255,255,0.3)] text-[#a1a4a5]"
                        )}
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-[rgba(255,255,255,0.3)]">
                    <h4 className="text-xs font-bold text-[#f0f0f0] mb-4 uppercase tracking-wider">{t('profile.social_links')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.website')}</label>
                        <div className="relative">
                          <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                          <input 
                            type="url" 
                            defaultValue="https://alexrivet.com" 
                            disabled={!isEditing}
                            className={cn(
                              "w-full pl-9 pr-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40",
                              isEditing ? "border border-[rgba(255,255,255,0.2)] text-[#f0f0f0]" : "border border-[rgba(255,255,255,0.3)] text-[#a1a4a5]"
                            )}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.twitter')}</label>
                        <div className="relative">
                          <Twitter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                          <input 
                            type="text" 
                            defaultValue="@alexrivet" 
                            disabled={!isEditing}
                            className={cn(
                              "w-full pl-9 pr-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40",
                              isEditing ? "border border-[rgba(255,255,255,0.2)] text-[#f0f0f0]" : "border border-[rgba(255,255,255,0.3)] text-[#a1a4a5]"
                            )}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.github')}</label>
                        <div className="relative">
                          <Github size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                          <input 
                            type="text" 
                            defaultValue="alexrivet" 
                            disabled={!isEditing}
                            className={cn(
                              "w-full pl-9 pr-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40",
                              isEditing ? "border border-[rgba(255,255,255,0.2)] text-[#f0f0f0]" : "border border-[rgba(255,255,255,0.3)] text-[#a1a4a5]"
                            )}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.linkedin')}</label>
                        <div className="relative">
                          <Linkedin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                          <input 
                            type="text" 
                            defaultValue="alex-rivet" 
                            disabled={!isEditing}
                            className={cn(
                              "w-full pl-9 pr-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40",
                              isEditing ? "border border-[rgba(255,255,255,0.2)] text-[#f0f0f0]" : "border border-[rgba(255,255,255,0.3)] text-[#a1a4a5]"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

                {/* Password Section */}
                <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-md shadow-md shadow-black/40 overflow-hidden">
                  <div className="p-6 border-b border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.02)]/30">
                    <h3 className="text-base font-bold text-[#f0f0f0]">{t('profile.security.password')}</h3>
                  </div>
                  <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-5">
                    <div className="space-y-2 max-w-sm">
                      <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.security.current_password')}</label>
                      <div className="relative">
                        <input required type={showCurrentPassword ? "text" : "password"} placeholder="••••••••" className="w-full pl-3 pr-10 py-2 outline-none bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" />
                        <button 
                          type="button" 
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 max-w-sm">
                      <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.security.new_password')}</label>
                      <div className="relative">
                        <input required minLength={8} type={showNewPassword ? "text" : "password"} placeholder="••••••••" className="w-full pl-3 pr-10 py-2 outline-none bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" />
                        <button 
                          type="button" 
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors"
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 max-w-sm">
                      <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.security.confirm_password')}</label>
                      <div className="relative">
                        <input required minLength={8} type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" className="w-full pl-3 pr-10 py-2 outline-none bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" />
                        <button 
                          type="button" 
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="px-4 py-2 bg-[#ffffff] text-[#000000] text-xs font-bold rounded-md hover:bg-[#f0f0f0] transition-all">
                      {t('profile.security.update_password')}
                    </button>
                  </form>
                </div>

                {/* Danger Zone */}
                <div className="bg-[#000000] border-red-900/50 rounded-md shadow-md shadow-black/40 overflow-hidden">
                  <div className="p-6 border-b border-red-900/50 bg-red-950/20">
                    <h3 className="text-base font-bold text-red-500">{t('profile.security.danger_zone')}</h3>
                  </div>
                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#f0f0f0]">{t('profile.delete_account')}</h4>
                      <p className="text-xs text-[#a1a4a5] mt-0.5">{t('profile.delete_account_desc')}</p>
                    </div>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full sm:w-auto px-4 py-1.5 bg-red-600/10 border-red-600/20 text-red-500 text-xs font-bold rounded-md hover:bg-red-600/20 hover:border-red-600/30 transition-all"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>

              </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeleting}
        title={t('profile.delete_account')}
        description={t('profile.delete_account_desc') || "Are you sure you want to delete your account?"}
        warningText={t('common.cannot_be_undone') || "This action cannot be undone."}
      />
    </div>
  );
}
