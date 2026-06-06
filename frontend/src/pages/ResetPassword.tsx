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
  Globe
} from 'lucide-react';
import { forgotPassword, resetPassword, verifyResetPasswordOtp } from '../api/auth';

type ErrorMap = Record<string, string | undefined>;

export default function ResetPassword() {
  const { t, language, setLanguage } = useLanguage();
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
    `w-full rounded-xl border bg-slate-950/80 pl-4 pr-4 py-3 text-[14px] text-slate-100 outline-none transition-all placeholder:text-slate-600 ${
      touched[field] && errors[field]
        ? 'border-red-500/40 focus:border-red-500/80 focus:ring-2 focus:ring-red-500/10'
        : 'border-slate-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10'
    }`;

  const pwInputClass = (field: string) =>
    `w-full rounded-xl border bg-slate-950/80 pl-4 pr-11 py-3 text-[14px] text-slate-100 outline-none transition-all placeholder:text-slate-600 ${
      touched[field] && errors[field]
        ? 'border-red-500/40 focus:border-red-500/80 focus:ring-2 focus:ring-red-500/10'
        : 'border-slate-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10'
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

  const toggleLanguage = () => setLanguage(language === 'en' ? 'vi' : 'en');

  return (
    <div className="min-h-screen bg-[#030712] px-6 py-10 text-slate-100 selection:bg-emerald-400 selection:text-slate-950 relative overflow-hidden flex items-center justify-center font-sans">
      
      {/* Global CSS Style tag for Custom advanced animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(35px, 20px) scale(1.1); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 35px) scale(0.95); }
        }
        .animate-float-slow { animation: float-slow 16s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 12s ease-in-out infinite; }

        @keyframes borderGlow {
          0%, 100% { border-color: rgba(16, 185, 129, 0.2); }
          50% { border-color: rgba(99, 102, 241, 0.6); }
        }
        .animate-border-glow {
          animation: borderGlow 4s ease-in-out infinite;
        }
      `}} />

      {/* Background Gradients & Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.06),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Floating neon light blobs */}
      <div className="absolute top-[15%] left-[-5%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[90px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-[15%] right-[-5%] w-[350px] h-[350px] bg-emerald-500/6 rounded-full blur-[100px] animate-float-medium pointer-events-none" />

      {/* Language Toggle in Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={toggleLanguage} 
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-700 transition"
        >
          <Globe size={14} />
          {language.toUpperCase()}
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md items-center justify-center relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <section className="relative w-full">
          {/* Card Frame */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8 animate-border-glow">
            
            <div className="mb-8 space-y-4 text-center">
              <Link to="/" className="flex justify-center hover:opacity-90 transition">
                <Logo theme="dark" customSize={118} />
              </Link>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">{t('auth.reset.title')}</h1>
                <p className="text-xs text-slate-400 font-light">{t('auth.reset.desc')}</p>
              </div>
            </div>

            <div className="space-y-5 text-left">
              {!showPasswordFields && (
                <>
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('auth.email')}</label>
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
                      <p className="text-[11px] text-red-400 font-medium mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* OTP Field with Send Button */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã OTP</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => handleChange('otp', e.target.value)}
                        onBlur={handleBlur('otp')}
                        placeholder="Nhập mã xác minh"
                        className={`${inputClass('otp')} pr-28`}
                        aria-invalid={touched.otp && !!errors.otp}
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || countdown > 0 || !email.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 hover:text-emerald-300 hover:border-slate-700 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed select-none min-w-[90px]"
                      >
                        {isSendingOtp ? <Loader2 size={12} className="animate-spin text-emerald-400" /> : null}
                        <span>
                          {isSendingOtp 
                            ? '...' 
                            : countdown > 0 
                              ? `${countdown}s` 
                              : otpSent 
                                ? 'Gửi lại' 
                                : 'Gửi mã'}
                        </span>
                      </button>
                    </div>
                    {touched.otp && errors.otp && (
                      <p className="text-[11px] text-red-400 font-medium mt-1">{errors.otp}</p>
                    )}
                  </div>
                </>
              )}

              {showPasswordFields && (
                <>
                  {/* New Password Field */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('settings.security.password.new')}</label>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {touched.newPassword && errors.newPassword && (
                      <p className="text-[11px] text-red-400 font-medium mt-1">{errors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('settings.security.password.confirm')}</label>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <p className="text-[11px] text-red-400 font-medium mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </>
              )}

              {serverError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-center text-xs font-medium text-red-400">
                  {serverError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={showPasswordFields ? handleResetPassword : handleContinue}
                disabled={isSendingOtp || isVerifyingOtp || isResetting || hasStep1Errors || hasStep2Errors}
                className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] shadow-[0_0_10px_rgba(16,185,129,0.15)] disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden"
              >
                {(isVerifyingOtp || isResetting) && <Loader2 size={16} className="animate-spin" />}
                <span>{showPasswordFields ? t('common.confirm') : t('auth.reset.submit')}</span>
              </button>
            </div>

            {/* Back to Login Link */}
            <div className="mt-8 flex justify-center">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors">
                <ArrowLeft size={14} />
                <span>{t('auth.reset.back')}</span>
              </Link>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
