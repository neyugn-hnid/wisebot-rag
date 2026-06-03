import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';
import { hasMinLength, isStrongPassword, isValidEmail, isValidOtp } from '../lib/validation';
import { 
  Mail, 
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { forgotPassword, resetPassword, verifyResetPasswordOtp } from '../api/auth';

type ErrorMap = Record<string, string | undefined>;

export default function ResetPassword() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showPasswordFields, setShowPasswordFields] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [otpSent, setOtpSent] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const [errors, setErrors] = React.useState<ErrorMap>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [serverError, setServerError] = React.useState('');

  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const inputClass = (field: string) =>
    `w-full bg-[rgba(255,255,255,0.06)] border pl-2 pr-4 py-3 text-[14px] text-[#ffffff] outline-none transition-all rounded-[8px] focus:border-white focus:ring-2 focus:ring-white/30 placeholder:text-[rgba(255,255,255,0.38)] ${
      touched[field] && errors[field]
        ? 'border-[#ff0000] focus:border-[#ff0000] focus:ring-[#ff0000]/30'
        : 'border-[rgba(255,255,255,0.12)]'
    }`;

  const pwInputClass = (field: string) =>
    `w-full bg-[rgba(255,255,255,0.06)] border pl-2 pr-4 py-3 text-[14px] text-[#ffffff] outline-none transition-all rounded-[8px] focus:border-white focus:ring-2 focus:ring-white/30 placeholder:text-[rgba(255,255,255,0.38)] ${
      touched[field] && errors[field]
        ? 'border-[#ff0000] focus:border-[#ff0000] focus:ring-[#ff0000]/30'
        : 'border-[rgba(255,255,255,0.12)]'
    }`;

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'email':
        if (!value.trim()) return t('validation.required');
        if (!isValidEmail(value)) return 'Email không đúng định dạng.';
        return undefined;
      case 'otp':
        if (!value.trim()) return t('validation.required');
        if (!isValidOtp(value)) return 'Mã OTP phải gồm 6 chữ số';
        return undefined;
      case 'newPassword':
        if (!value) return t('validation.required');
        if (!hasMinLength(value, 8)) return t('validation.password_min').replace('{min}', '8');
        if (!isStrongPassword(value)) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa và 1 số';
        return undefined;
      case 'confirmPassword':
        if (!value) return t('validation.required');
        if (value !== newPassword) return t('validation.password_match');
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (field: string) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'email' ? email : field === 'otp' ? otp : field === 'newPassword' ? newPassword : confirmPassword;
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleChange = (field: string, value: string) => {
    const normalizedValue = field === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value;
    const nextNewPassword = field === 'newPassword' ? normalizedValue : newPassword;
    if (field === 'email') setEmail(normalizedValue);
    else if (field === 'otp') setOtp(normalizedValue);
    else if (field === 'newPassword') setNewPassword(normalizedValue);
    else setConfirmPassword(normalizedValue);
    if (serverError) setServerError('');
    setErrors((prev) => {
      const nextErrors = { ...prev };
      if (touched[field]) {
        nextErrors[field] = validateField(field, normalizedValue);
      }
      if (field === 'newPassword' && touched.confirmPassword) {
        nextErrors.confirmPassword = !confirmPassword
          ? validateField('confirmPassword', confirmPassword)
          : confirmPassword !== nextNewPassword
            ? t('validation.password_match')
            : undefined;
      }
      return nextErrors;
    });
  };

  const handleSendOtp = async () => {
    const err = validateField('email', email);
    setErrors((prev) => ({ ...prev, email: err }));
    setTouched((prev) => ({ ...prev, email: true }));
    if (err) return;

    setIsSendingOtp(true);
    setServerError('');
    try {
      await forgotPassword({ email: email.trim() });
      setOtpSent(true);
      setCountdown(60);
      showToast('Đã gửi mã OTP. Vui lòng kiểm tra email', 'success');
    } catch (err: any) {
      setServerError(err.message || t('toast.error'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const hasStep1Errors = !showPasswordFields && (
    !!validateField('email', email) ||
    !!validateField('otp', otp) ||
    !otpSent
  );

  const hasStep2Errors = showPasswordFields && (
    !!validateField('newPassword', newPassword) ||
    !!validateField('confirmPassword', confirmPassword)
  );

  const handleContinue = async () => {
    const newErrors: ErrorMap = {
      email: validateField('email', email),
      otp: validateField('otp', otp),
    };
    setErrors(newErrors);
    setTouched({ email: true, otp: true });
    if (newErrors.email || newErrors.otp) return;

    setIsVerifyingOtp(true);
    setServerError('');
    try {
      await verifyResetPasswordOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      setShowPasswordFields(true);
    } catch (err: any) {
      setServerError(err.message || t('toast.error'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors: ErrorMap = {
      newPassword: validateField('newPassword', newPassword),
      confirmPassword: validateField('confirmPassword', confirmPassword),
    };
    setErrors(newErrors);
    setTouched((prev) => ({ ...prev, newPassword: true, confirmPassword: true }));
    if (newErrors.newPassword || newErrors.confirmPassword) return;

    setIsResetting(true);
    setServerError('');
    try {
      await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      showToast('Đặt lại mật khẩu thành công!', 'success');
      navigate('/login');
    } catch (err: any) {
      setServerError(err.message || t('toast.error'));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-6 pt-10 pb-6 selection:bg-[#ff801f] selection:text-[#ffffff]">
      <div className="max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center flex flex-col items-center">
          <Logo theme="dark" customSize={142} className="mb-0" />
          <h1 className="text-3xl font-black text-[#f0f0f0] tracking-tight">{t('auth.reset.title')}</h1>
          <p className="text-[#a1a4a5]">{t('auth.reset.desc')}</p>
        </div>

        <div className="bg-[#000000] p-8 rounded-[16px] shadow-xl shadow-black/50 space-y-6">
          {!showPasswordFields && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#f0f0f0] tracking-wider">{t('auth.email')}</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={handleBlur('email')}
                    placeholder="name@company.com"
                    className={`${inputClass('email')} mt-1`}
                    disabled={otpSent}
                    aria-invalid={touched.email && !!errors.email}
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="text-[11px] text-[#ff0000] font-medium mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#f0f0f0] tracking-wider">Mã</label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => handleChange('otp', e.target.value)}
                    onBlur={handleBlur('otp')}
                    placeholder="Nhập mã"
                    className={`${inputClass('email')} mt-1`}
                    aria-invalid={touched.otp && !!errors.otp}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || countdown > 0 || !email.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-3 py-1 text-xs font-medium border-l border-[#f5f5f5] text-[#ffffff] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingOtp ? <Loader2 size={14} className="animate-spin" /> : countdown > 0 ? <span className="text-[11px] tabular-nums">Gửi lại sau {countdown}s</span> : null}
                    {isSendingOtp ? 'Đang gửi...' : countdown > 0 ? '' : otpSent ? 'Gửi lại' : 'Gửi mã'}
                  </button>
                </div>
                {touched.otp && errors.otp && (
                  <p className="text-[11px] text-[#ff0000] font-medium mt-1">{errors.otp}</p>
                )}
              </div>
            </>
          )}

          {showPasswordFields && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#f0f0f0] tracking-wider">{t('settings.security.password.new')}</label>
                <div className="relative mt-1">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => handleChange('newPassword', e.target.value)}
                    onBlur={handleBlur('newPassword')}
                    placeholder={t('settings.security.password.new')}
                    className={pwInputClass('newPassword')}
                    aria-invalid={touched.newPassword && !!errors.newPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#ffffff] transition-colors"
                    aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {touched.newPassword && errors.newPassword && (
                  <p className="text-[11px] text-[#ff0000] font-medium mt-1">{errors.newPassword}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#f0f0f0] tracking-wider">{t('settings.security.password.confirm')}</label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    onBlur={handleBlur('confirmPassword')}
                    placeholder={t('settings.security.password.confirm')}
                    className={pwInputClass('confirmPassword')}
                    aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#ffffff] transition-colors"
                    aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="text-[11px] text-[#ff0000] font-medium mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </>
          )}

          {serverError && (
            <div className="rounded-[8px] text-center px-4 py-2.5 text-[12px] font-medium text-[#ff0000] bg-[rgba(255,0,0,0.05)] border border-[rgba(255,0,0,0.15)]">
              {serverError}
            </div>
          )}

          <button
            type="button"
            onClick={showPasswordFields ? handleResetPassword : handleContinue}
            disabled={isSendingOtp || isVerifyingOtp || isResetting || hasStep1Errors || hasStep2Errors}
            className="w-full bg-[#ffffff] text-[#000000] py-3.5 rounded-full font-black text-sm shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isVerifyingOtp || isResetting) && <Loader2 size={18} className="animate-spin" />}
            {showPasswordFields ? t('common.confirm') : t('auth.reset.submit')}
          </button>
        </div>

        <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">
           {t('auth.reset.back')}
        </Link>
      </div>
    </div>
  );
}
