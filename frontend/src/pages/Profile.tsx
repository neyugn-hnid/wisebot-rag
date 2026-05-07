import React, { useEffect, useMemo, useState } from 'react';
import {
  User,
  Mail,
  Camera,
  Shield,
  Calendar,
  CreditCard,
  MapPin,
  Link as LinkIcon,
  Twitter,
  Github,
  Linkedin,
  Star,
  Globe,
  Edit2,
  X,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../contexts/RoleContext';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import {
  getProfile,
  updateProfile,
  changePassword,
  type UserResponse,
} from '../api/users';

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export default function Profile() {
  const { t, language } = useLanguage();
  const { logout } = useRole();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const data = await getProfile();

      setProfile(data);
      setProfileForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không tải được hồ sơ người dùng.';
      showToast(message, 'error');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const joinedLabel = useMemo(() => {
    if (!profile?.createdAt) {
      return language === 'vi' ? 'Chưa có dữ liệu' : 'No data';
    }

    const date = new Date(profile.createdAt);
    if (Number.isNaN(date.getTime())) {
      return profile.createdAt;
    }

    return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }, [language, profile?.createdAt]);

  const avatarFallback = useMemo(() => {
    const source = profile?.fullName?.trim() || profile?.username?.trim() || 'W';
    return source.charAt(0).toUpperCase();
  }, [profile?.fullName, profile?.username]);

  const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileForm.fullName.trim() || !profileForm.phone.trim()) {
      showToast('Vui lòng nhập đầy đủ họ tên và số điện thoại.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
      });

      setProfile((current) => current ? {
        ...current,
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
      } : current);
      setIsEditing(false);
      showToast(t('toast.profile_updated') || 'Profile updated successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ.';
      showToast(message, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileForm({
      fullName: profile?.fullName || '',
      phone: profile?.phone || '',
    });
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      showToast('Vui lòng nhập đầy đủ thông tin mật khẩu.', 'error');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showToast('Xác nhận mật khẩu mới không khớp.', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(passwordForm);

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      showToast(t('profile.security.update_password') || 'Password updated successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể đổi mật khẩu.';
      showToast(message, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="max-w-[1280px] mx-auto pb-20 pt-8 px-4 sm:px-6 lg:px-8">
        <div className="min-h-[420px] flex items-center justify-center text-[#a1a4a5]">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-4 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="relative group w-32 h-32 sm:w-40 sm:h-40 lg:w-full lg:h-auto lg:aspect-square">
            <div className="w-full h-full rounded-full overflow-hidden shadow-md shadow-black/40 relative bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-5xl font-black text-[#f0f0f0]">{avatarFallback}</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <Camera size={24} />
                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Avatar read-only</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 lg:bottom-2 lg:right-2 w-8 h-8 bg-[#000000] rounded-full flex items-center justify-center shadow-md shadow-black/40 text-[#3b9eff]">
              <Camera size={14} />
            </div>
          </div>

          <div className="pt-2 lg:pt-4 space-y-0">
            <h1 className="text-[24px] font-display font-medium tracking-tight text-[#f0f0f0]">
              {profile?.fullName || 'Unknown User'}
            </h1>
            <h2 className="text-lg font-light text-[#a1a4a5]">{profile?.username || '-'}</h2>
          </div>

          <div className="py-2 space-y-2 w-full">
            <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.3)] flex flex-col items-start">
              <div className="flex items-center gap-2 text-sm text-[#f0f0f0]">
                <MapPin size={16} className="text-[#a1a4a5]" />
                <span>{language === 'vi' ? 'Chưa cấu hình vị trí' : 'Location not configured'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#f0f0f0]">
                <Mail size={16} className="text-[#a1a4a5]" />
                <span>{profile?.email || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#f0f0f0]">
                <User size={16} className="text-[#a1a4a5]" />
                <span>@{profile?.username || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#f0f0f0]">
                <Calendar size={16} className="text-[#a1a4a5]" />
                <span>{t('profile.joined')}: {joinedLabel}</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="relative bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-xl shadow-lg shadow-black/50 overflow-hidden group">
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
                      onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
                      className={cn(
                        'h-8 px-3 flex items-center justify-center rounded-md border transition-all',
                        isEditing
                          ? 'bg-[#000000] border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.02)]'
                          : 'bg-blue-600 border border-transparent text-white hover:bg-blue-700 shadow-sm'
                      )}
                    >
                      {isEditing ? <X size={16} /> : <Edit2 size={16} />}
                    </button>
                    {isEditing && (
                      <button
                        type="submit"
                        form="personal-info-form"
                        disabled={isSavingProfile}
                        className="h-8 px-4 flex items-center justify-center bg-[#ffffff] text-[#000000] text-xs font-bold rounded-md hover:bg-[#f0f0f0] transition-all disabled:opacity-60"
                      >
                        {isSavingProfile ? 'Saving...' : (t('common.save_short') || 'Save')}
                      </button>
                    )}
                  </div>
                </div>

                <form id="personal-info-form" onSubmit={handleProfileSave} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#f0f0f0]">{t('team.full_name')}</label>
                      <input
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm((current) => ({ ...current, fullName: e.target.value }))}
                        disabled={!isEditing}
                        className={cn(
                          'w-full px-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40',
                          isEditing ? 'border border-[rgba(255,255,255,0.2)] text-[#f0f0f0]' : 'border border-[rgba(255,255,255,0.3)] text-[#a1a4a5]'
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#f0f0f0]">{t('team.email_address')}</label>
                      <input
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="w-full bg-transparent px-3 py-2 font-medium outline-none rounded-[8px] border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] text-[14px] transition-all placeholder:text-[#a1a4a5]/40"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#f0f0f0]">{t('billing.support.phone')}</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((current) => ({ ...current, phone: e.target.value }))}
                        disabled={!isEditing}
                        className={cn(
                          'w-full px-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40',
                          isEditing ? 'border border-[rgba(255,255,255,0.2)] text-[#f0f0f0]' : 'border border-[rgba(255,255,255,0.3)] text-[#a1a4a5]'
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#f0f0f0]">Username</label>
                      <input
                        type="text"
                        value={profile?.username || ''}
                        disabled
                        className="w-full bg-transparent px-3 py-2 font-medium outline-none rounded-[8px] border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] text-[14px] transition-all placeholder:text-[#a1a4a5]/40"
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-[rgba(255,255,255,0.3)]">
                    <h4 className="text-xs font-bold text-[#f0f0f0] mb-4 uppercase tracking-wider">{t('profile.social_links')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-70">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.website')}</label>
                        <div className="relative">
                          <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                          <input type="text" value="" disabled placeholder={language === 'vi' ? 'Chưa hỗ trợ bởi backend' : 'Not supported by backend yet'} className="w-full pl-9 pr-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] text-[14px] placeholder:text-[#a1a4a5]/40" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.twitter')}</label>
                        <div className="relative">
                          <Twitter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                          <input type="text" value="" disabled placeholder={language === 'vi' ? 'Chưa hỗ trợ bởi backend' : 'Not supported by backend yet'} className="w-full pl-9 pr-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] text-[14px] placeholder:text-[#a1a4a5]/40" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.github')}</label>
                        <div className="relative">
                          <Github size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                          <input type="text" value="" disabled placeholder={language === 'vi' ? 'Chưa hỗ trợ bởi backend' : 'Not supported by backend yet'} className="w-full pl-9 pr-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] text-[14px] placeholder:text-[#a1a4a5]/40" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.linkedin')}</label>
                        <div className="relative">
                          <Linkedin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                          <input type="text" value="" disabled placeholder={language === 'vi' ? 'Chưa hỗ trợ bởi backend' : 'Not supported by backend yet'} className="w-full pl-9 pr-3 py-2 font-medium outline-none transition-all bg-transparent rounded-[8px] border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] text-[14px] placeholder:text-[#a1a4a5]/40" />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-md shadow-md shadow-black/40 overflow-hidden">
                <div className="p-6 border-b border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.02)]/30">
                  <h3 className="text-base font-bold text-[#f0f0f0]">{t('profile.security.password')}</h3>
                </div>
                <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                  <div className="space-y-2 max-w-sm">
                    <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.security.current_password')}</label>
                    <div className="relative">
                      <input value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, currentPassword: e.target.value }))} required type={showCurrentPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full pl-3 pr-10 py-2 outline-none bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.security.new_password')}</label>
                    <div className="relative">
                      <input value={passwordForm.newPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, newPassword: e.target.value }))} required minLength={8} type={showNewPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full pl-3 pr-10 py-2 outline-none bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.security.confirm_password')}</label>
                    <div className="relative">
                      <input value={passwordForm.confirmNewPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, confirmNewPassword: e.target.value }))} required minLength={8} type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full pl-3 pr-10 py-2 outline-none bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isChangingPassword} className="px-4 py-2 bg-[#ffffff] text-[#000000] text-xs font-bold rounded-md hover:bg-[#f0f0f0] transition-all disabled:opacity-60">
                    {isChangingPassword ? 'Updating...' : t('profile.security.update_password')}
                  </button>
                </form>
              </div>
            </div>

            <div className="flex gap-3 pt-4 justify-end">
              <button
                onClick={handleSignOut}
                className="px-6 py-2.5 bg-[rgba(255,255,255,0.02)] text-[#a1a4a5] text-sm font-bold rounded-[12px] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f0f0f0] transition-all flex items-center justify-center gap-2 border border-[rgba(255,255,255,0.3)]"
              >
                <LogOut size={16} />
                {t('profile.sign_out') || 'Đăng xuất'}
              </button>
              <button
                onClick={() => showToast('Tính năng đang phát triển', 'info')}
                className="px-6 py-2.5 bg-[#ff0000]/10 text-[#ff0000] text-sm font-bold rounded-[12px] hover:bg-[#ff0000]/20 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Xóa tài khoản
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
