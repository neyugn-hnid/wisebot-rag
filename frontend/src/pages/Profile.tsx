import React, { useEffect, useMemo, useState } from 'react';
import {
  User,
  Mail,
  Camera,
  Calendar,
  MapPin,
  Twitter,
  Github,
  Linkedin,
  Star,
  Globe,
  Edit2,
  X,
  Eye,
  EyeOff,
  Shield,
  CreditCard,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { hasMinLength, isStrongPassword, isValidPhone } from '../lib/validation';
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

type FieldErrors = Record<string, string | undefined>;

function ProfileSection({
  icon,
  title,
  description,
  actions,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[#d7d9da]">
            {icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#f5f5f5]">{title}</h3>
            {description ? <p className="text-sm leading-6 text-[#8b8f91]">{description}</p> : null}
          </div>
        </div>
        {actions}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function Profile() {
  const { t, language } = useLanguage();
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
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [profileTouched, setProfileTouched] = useState<Record<string, boolean>>({});
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({});
  const [passwordTouched, setPasswordTouched] = useState<Record<string, boolean>>({});

  const validateProfileField = (name: 'fullName' | 'phone', value: string) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Vui lòng nhập họ và tên.';
        if (value.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự.';
        return undefined;
      case 'phone':
        if (!value.trim()) return 'Vui lòng nhập số điện thoại.';
        if (!isValidPhone(value)) return 'Số điện thoại không đúng định dạng.';
        return undefined;
      default:
        return undefined;
    }
  };

  const validatePasswordField = (name: keyof PasswordForm, value: string, nextPasswordForm = passwordForm) => {
    switch (name) {
      case 'currentPassword':
        if (!value) return 'Vui lòng nhập mật khẩu hiện tại.';
        return undefined;
      case 'newPassword':
        if (!value) return 'Vui lòng nhập mật khẩu mới.';
        if (!hasMinLength(value, 8)) return 'Mật khẩu phải có ít nhất 8 ký tự.';
        if (!isStrongPassword(value)) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa và 1 số.';
        if (value === nextPasswordForm.currentPassword) return 'Mật khẩu mới phải khác mật khẩu hiện tại.';
        return undefined;
      case 'confirmNewPassword':
        if (!value) return 'Vui lòng xác nhận mật khẩu mới.';
        if (value !== nextPasswordForm.newPassword) return 'Xác nhận mật khẩu mới không khớp.';
        return undefined;
      default:
        return undefined;
    }
  };

  const profileInputClass = (field: 'fullName' | 'phone', editable: boolean) => cn(
    'w-full rounded-[12px] border px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-[#6f7578]',
    profileTouched[field] && profileErrors[field]
      ? 'border-[#ff0000] bg-[#ff0000]/5 text-[#f0f0f0] focus:border-[#ff0000] focus:ring-2 focus:ring-[#ff0000]/15'
      : editable
        ? 'border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.03)] text-[#f0f0f0] focus:border-[rgba(59,158,255,0.35)] focus:ring-2 focus:ring-[rgba(59,158,255,0.16)]'
        : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] text-[#a1a4a5]',
  );

  const passwordInputClass = (field: keyof PasswordForm) => cn(
    'w-full rounded-[12px] border bg-[rgba(255,255,255,0.03)] px-4 py-3 pr-11 text-sm text-[#f0f0f0] outline-none transition-all placeholder:text-[#6f7578]',
    passwordTouched[field] && passwordErrors[field]
      ? 'border-[#ff0000] focus:border-[#ff0000] focus:ring-2 focus:ring-[#ff0000]/15'
      : 'border-[rgba(255,255,255,0.18)] focus:border-[rgba(59,158,255,0.35)] focus:ring-2 focus:ring-[rgba(59,158,255,0.16)]',
  );

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const data = await getProfile();
      setProfile(data);
      setProfileForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
      });
      setProfileErrors({});
      setProfileTouched({});
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
    const nextErrors: FieldErrors = {
      fullName: validateProfileField('fullName', profileForm.fullName),
      phone: validateProfileField('phone', profileForm.phone),
    };
    setProfileErrors(nextErrors);
    setProfileTouched({ fullName: true, phone: true });
    if (nextErrors.fullName || nextErrors.phone) {
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
    setProfileErrors({});
    setProfileTouched({});
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors: FieldErrors = {
      currentPassword: validatePasswordField('currentPassword', passwordForm.currentPassword),
      newPassword: validatePasswordField('newPassword', passwordForm.newPassword),
      confirmNewPassword: validatePasswordField('confirmNewPassword', passwordForm.confirmNewPassword),
    };
    setPasswordErrors(nextErrors);
    setPasswordTouched({
      currentPassword: true,
      newPassword: true,
      confirmNewPassword: true,
    });
    if (nextErrors.currentPassword || nextErrors.newPassword || nextErrors.confirmNewPassword) {
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
      setPasswordErrors({});
      setPasswordTouched({});
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
      <div className="mx-auto max-w-7xl pb-20">
        <div className="flex min-h-[420px] items-center justify-center text-[#a1a4a5]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.14)] border-t-[#f0f0f0]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="space-y-8">
        <section className="rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-6">
              <div className="relative h-36 w-36 overflow-hidden rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl font-black text-[#f0f0f0]">
                    {avatarFallback}
                  </div>
                )}
                <div className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[#000000]/70 text-[#9ed1ff]">
                  <Camera size={14} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#9fa3a5]">
                  <Shield size={13} />
                  {t('profile.overview')}
                </div>
                <h1 className="text-[30px] font-display font-medium tracking-tight text-[#f5f5f5]">
                  {profile?.fullName || 'Unknown User'}
                </h1>
                <p className="text-sm text-[#8b8f91]">@{profile?.username || '-'}</p>
              </div>

              <div className="space-y-3 rounded-[20px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-5">
                <div className="flex items-center gap-3 text-sm text-[#d7d9da]">
                  <Mail size={15} className="text-[#8b8f91]" />
                  <span>{profile?.email || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#d7d9da]">
                  <User size={15} className="text-[#8b8f91]" />
                  <span>{profile?.fullName || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#d7d9da]">
                  <Calendar size={15} className="text-[#8b8f91]" />
                  <span>{t('profile.joined')}: {joinedLabel}</span>
                </div>
              </div>
            </aside>

            <div className="flex items-end">
              <div className="w-full rounded-[24px] border border-[rgba(59,158,255,0.22)] bg-[rgba(59,158,255,0.06)] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
                <div className="flex items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#3b9eff]/20 bg-[#3b9eff]/10 text-[#9ed1ff]">
                      <Star size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-[#f5f5f5]">{t('billing.current_plan')}</h3>
                      <p className="text-sm text-[#8b8f91]">{t('billing.current_plan.desc')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold tracking-tight text-[#f5f5f5]">$29</p>
                    <p className="text-xs text-[#8b8f91]">{t('billing.plans.pro')}</p>
                  </div>
                </div>
                <div className="flex flex-col items-start justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(59,158,255,0.18)] bg-[rgba(59,158,255,0.08)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#9ed1ff]">
                      <CreditCard size={12} />
                      {t('billing.active')}
                    </div>
                    <p className="text-sm text-[#8b8f91]">
                      {t('billing.current_plan.next_billing')}: {language === 'vi' ? '1 tháng 5, 2026' : 'May 1, 2026'}
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <button
                      type="button"
                      onClick={() => navigate('/billing')}
                      className="rounded-[14px] border border-[#ff0000]/20 bg-[#ff0000]/10 px-5 py-3 text-sm font-bold text-[#ff0000] transition-colors hover:bg-[#ff0000]/15"
                    >
                      {t('billing.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/billing')}
                      className="rounded-[14px] bg-[#ffffff] px-5 py-3 text-sm font-bold text-[#000000] transition-colors hover:bg-[#f0f0f0]"
                    >
                      {t('billing.upgrade')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <ProfileSection
            icon={<User size={18} />}
            title={t('profile.personal_info')}
            description={t('profile.personal_info_desc')}
            actions={(
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-[12px] border px-3 transition-all',
                    isEditing
                      ? 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-[#d7d9da] hover:bg-[rgba(255,255,255,0.06)]'
                      : 'border-[rgba(59,158,255,0.18)] bg-[rgba(59,158,255,0.08)] text-[#9ed1ff] hover:bg-[rgba(59,158,255,0.12)]'
                  )}
                >
                  {isEditing ? <X size={16} /> : <Edit2 size={16} />}
                </button>
                {isEditing ? (
                  <button
                    type="submit"
                    form="personal-info-form"
                    disabled={isSavingProfile}
                    className="rounded-[12px] bg-[#ffffff] px-4 py-2 text-xs font-bold text-[#000000] transition-colors hover:bg-[#ececec] disabled:opacity-60"
                  >
                    {isSavingProfile ? 'Saving...' : (t('common.save_short') || 'Save')}
                  </button>
                ) : null}
              </div>
            )}
          >
            <form id="personal-info-form" onSubmit={handleProfileSave} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#f0f0f0]">{t('team.full_name')}</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setProfileForm((current) => ({ ...current, fullName: nextValue }));
                      setProfileErrors((current) => profileTouched.fullName
                        ? { ...current, fullName: validateProfileField('fullName', nextValue) }
                        : current);
                    }}
                    onBlur={() => {
                      setProfileTouched((current) => ({ ...current, fullName: true }));
                      setProfileErrors((current) => ({ ...current, fullName: validateProfileField('fullName', profileForm.fullName) }));
                    }}
                    disabled={!isEditing}
                    className={profileInputClass('fullName', isEditing)}
                    aria-invalid={profileTouched.fullName && !!profileErrors.fullName}
                  />
                  {profileTouched.fullName && profileErrors.fullName ? (
                    <p className="text-[11px] font-medium text-[#ff8d8d]">{profileErrors.fullName}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#f0f0f0]">{t('team.email_address')}</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm font-medium text-[#a1a4a5] outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#f0f0f0]">{t('billing.support.phone')}</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setProfileForm((current) => ({ ...current, phone: nextValue }));
                      setProfileErrors((current) => profileTouched.phone
                        ? { ...current, phone: validateProfileField('phone', nextValue) }
                        : current);
                    }}
                    onBlur={() => {
                      setProfileTouched((current) => ({ ...current, phone: true }));
                      setProfileErrors((current) => ({ ...current, phone: validateProfileField('phone', profileForm.phone) }));
                    }}
                    disabled={!isEditing}
                    className={profileInputClass('phone', isEditing)}
                    aria-invalid={profileTouched.phone && !!profileErrors.phone}
                  />
                  {profileTouched.phone && profileErrors.phone ? (
                    <p className="text-[11px] font-medium text-[#ff8d8d]">{profileErrors.phone}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#f0f0f0]">Username</label>
                  <input
                    type="text"
                    value={profile?.username || ''}
                    disabled
                    className="w-full rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm font-medium text-[#a1a4a5] outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-[rgba(255,255,255,0.08)] pt-8">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#f0f0f0]">{t('profile.social_links')}</h4>
                <div className="grid gap-6 md:grid-cols-2 opacity-75">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.website')}</label>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                      <input type="text" value="" disabled placeholder={language === 'vi' ? 'Chưa hỗ trợ bởi backend' : 'Not supported by backend yet'} className="w-full rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] py-3 pl-9 pr-3 text-sm font-medium text-[#a1a4a5] outline-none placeholder:text-[#6f7578]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.twitter')}</label>
                    <div className="relative">
                      <Twitter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                      <input type="text" value="" disabled placeholder={language === 'vi' ? 'Chưa hỗ trợ bởi backend' : 'Not supported by backend yet'} className="w-full rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] py-3 pl-9 pr-3 text-sm font-medium text-[#a1a4a5] outline-none placeholder:text-[#6f7578]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.github')}</label>
                    <div className="relative">
                      <Github size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                      <input type="text" value="" disabled placeholder={language === 'vi' ? 'Chưa hỗ trợ bởi backend' : 'Not supported by backend yet'} className="w-full rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] py-3 pl-9 pr-3 text-sm font-medium text-[#a1a4a5] outline-none placeholder:text-[#6f7578]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.linkedin')}</label>
                    <div className="relative">
                      <Linkedin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" />
                      <input type="text" value="" disabled placeholder={language === 'vi' ? 'Chưa hỗ trợ bởi backend' : 'Not supported by backend yet'} className="w-full rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] py-3 pl-9 pr-3 text-sm font-medium text-[#a1a4a5] outline-none placeholder:text-[#6f7578]" />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </ProfileSection>

          <ProfileSection
            icon={<Shield size={18} />}
            title={t('profile.security.password')}
            description={t('profile.security.password_desc')}
          >
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.security.current_password')}</label>
                <div className="relative">
                  <input
                    value={passwordForm.currentPassword}
                    onChange={(e) => {
                      const nextForm = { ...passwordForm, currentPassword: e.target.value };
                      setPasswordForm(nextForm);
                      setPasswordErrors((current) => {
                        const nextErrors = { ...current };
                        if (passwordTouched.currentPassword) {
                          nextErrors.currentPassword = validatePasswordField('currentPassword', nextForm.currentPassword, nextForm);
                        }
                        if (passwordTouched.newPassword) {
                          nextErrors.newPassword = validatePasswordField('newPassword', nextForm.newPassword, nextForm);
                        }
                        return nextErrors;
                      });
                    }}
                    onBlur={() => {
                      setPasswordTouched((current) => ({ ...current, currentPassword: true }));
                      setPasswordErrors((current) => ({
                        ...current,
                        currentPassword: validatePasswordField('currentPassword', passwordForm.currentPassword),
                      }));
                    }}
                    required
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={passwordInputClass('currentPassword')}
                    aria-invalid={passwordTouched.currentPassword && !!passwordErrors.currentPassword}
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a4a5] transition-colors hover:text-[#f0f0f0]">
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordTouched.currentPassword && passwordErrors.currentPassword ? (
                  <p className="text-[11px] font-medium text-[#ff8d8d]">{passwordErrors.currentPassword}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.security.new_password')}</label>
                <div className="relative">
                  <input
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      const nextForm = { ...passwordForm, newPassword: e.target.value };
                      setPasswordForm(nextForm);
                      setPasswordErrors((current) => {
                        const nextErrors = { ...current };
                        if (passwordTouched.newPassword) {
                          nextErrors.newPassword = validatePasswordField('newPassword', nextForm.newPassword, nextForm);
                        }
                        if (passwordTouched.confirmNewPassword) {
                          nextErrors.confirmNewPassword = validatePasswordField('confirmNewPassword', nextForm.confirmNewPassword, nextForm);
                        }
                        return nextErrors;
                      });
                    }}
                    onBlur={() => {
                      setPasswordTouched((current) => ({ ...current, newPassword: true }));
                      setPasswordErrors((current) => ({
                        ...current,
                        newPassword: validatePasswordField('newPassword', passwordForm.newPassword),
                      }));
                    }}
                    required
                    minLength={8}
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={passwordInputClass('newPassword')}
                    aria-invalid={passwordTouched.newPassword && !!passwordErrors.newPassword}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a4a5] transition-colors hover:text-[#f0f0f0]">
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordTouched.newPassword && passwordErrors.newPassword ? (
                  <p className="text-[11px] font-medium text-[#ff8d8d]">{passwordErrors.newPassword}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('profile.security.confirm_password')}</label>
                <div className="relative">
                  <input
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) => {
                      const nextForm = { ...passwordForm, confirmNewPassword: e.target.value };
                      setPasswordForm(nextForm);
                      setPasswordErrors((current) => passwordTouched.confirmNewPassword
                        ? {
                          ...current,
                          confirmNewPassword: validatePasswordField('confirmNewPassword', nextForm.confirmNewPassword, nextForm),
                        }
                        : current);
                    }}
                    onBlur={() => {
                      setPasswordTouched((current) => ({ ...current, confirmNewPassword: true }));
                      setPasswordErrors((current) => ({
                        ...current,
                        confirmNewPassword: validatePasswordField('confirmNewPassword', passwordForm.confirmNewPassword),
                      }));
                    }}
                    required
                    minLength={8}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={passwordInputClass('confirmNewPassword')}
                    aria-invalid={passwordTouched.confirmNewPassword && !!passwordErrors.confirmNewPassword}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a4a5] transition-colors hover:text-[#f0f0f0]">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordTouched.confirmNewPassword && passwordErrors.confirmNewPassword ? (
                  <p className="text-[11px] font-medium text-[#ff8d8d]">{passwordErrors.confirmNewPassword}</p>
                ) : null}
              </div>

              <button type="submit" disabled={isChangingPassword} className="rounded-[14px] bg-[#ffffff] px-4 py-3 text-xs font-bold text-[#000000] transition-colors hover:bg-[#ececec] disabled:opacity-60">
                {isChangingPassword ? 'Updating...' : t('profile.security.update_password')}
              </button>
            </form>
          </ProfileSection>
        </div>

      </div>
    </div>
  );
}
