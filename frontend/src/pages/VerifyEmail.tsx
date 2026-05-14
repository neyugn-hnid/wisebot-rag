import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';
import { isValidEmail, isValidOtp } from '../lib/validation';
import { resendVerifyEmail, verifyEmail } from '../api/auth';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';

type ErrorMap = Record<string, string | undefined>;

export default function VerifyEmail() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = React.useState(searchParams.get('email') || '');
  const [otp, setOtp] = React.useState('');
  const [countdown, setCountdown] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);
  const [errors, setErrors] = React.useState<ErrorMap>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [serverError, setServerError] = React.useState('');

  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const inputClass = (field: string) =>
    `w-full bg-[rgba(255,255,255,0.06)] border py-3 text-[14px] text-[#ffffff] outline-none transition-all rounded-[8px] focus:border-white focus:ring-2 focus:ring-white/30 placeholder:text-[rgba(255,255,255,0.38)] ${
      field === 'email' ? 'pl-10 pr-4' : 'pl-4 pr-4 text-center tracking-[0.35em]'
    } ${
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
      default:
        return undefined;
    }
  };

  const handleBlur = (field: string) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'email' ? email : otp;
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleChange = (field: 'email' | 'otp', value: string) => {
    const normalizedValue = field === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value;
    if (field === 'email') setEmail(normalizedValue);
    else setOtp(normalizedValue);

    if (serverError) setServerError('');

    setErrors((prev) => ({
      ...prev,
      [field]: touched[field] ? validateField(field, normalizedValue) : prev[field],
    }));
  };

  const validateAll = () => {
    const nextErrors: ErrorMap = {
      email: validateField('email', email),
      otp: validateField('otp', otp),
    };
    setErrors(nextErrors);
    setTouched({ email: true, otp: true });
    return !nextErrors.email && !nextErrors.otp;
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateAll()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      const response = await verifyEmail({
        email: email.trim(),
        otp: otp.trim(),
      });
      setIsVerified(true);
      showToast(response.message || 'Xác minh email thành công', 'success');
      window.setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('toast.error');
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    const emailError = validateField('email', email);
    setErrors((prev) => ({ ...prev, email: emailError }));
    setTouched((prev) => ({ ...prev, email: true }));
    if (emailError) return;

    setIsResending(true);
    setServerError('');

    try {
      const response = await resendVerifyEmail(email.trim());
      setCountdown(60);
      setOtp('');
      showToast(response.message || 'Đã gửi lại OTP. Vui lòng kiểm tra email', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('toast.error');
      setServerError(message);
    } finally {
      setIsResending(false);
    }
  };

  const isDisabled =
    isSubmitting ||
    isResending ||
    !!validateField('email', email) ||
    !!validateField('otp', otp);

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-6 pt-10 pb-6 selection:bg-[#ff801f] selection:text-[#ffffff]">
      <div className="max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center flex flex-col items-center">
          <Logo theme="dark" customSize={142} className="mb-0" />
          <h1 className="text-3xl font-black text-[#f0f0f0] tracking-tight">{t('auth.verify.title')}</h1>
          <p className="text-[#a1a4a5]">{t('auth.verify.desc')}</p>
        </div>

        <div className="bg-[#000000] p-8 rounded-[16px] shadow-xl shadow-black/50 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-[rgba(255,255,255,0.02)] rounded-[16px] border border-[rgba(255,255,255,0.12)]">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[#f0f0f0] font-semibold leading-relaxed">
                Nhập mã OTP gồm 6 chữ số đã được gửi tới email của bạn.
              </p>
              <p className="text-xs text-[#a1a4a5] leading-relaxed">
                Mã xác minh có hiệu lực trong 10 phút. Nếu mã hết hạn, bạn có thể gửi lại OTP mới.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleVerify} noValidate>
            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">Mã OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => handleChange('otp', e.target.value)}
                onBlur={handleBlur('otp')}
                placeholder="000000"
                className={inputClass('otp')}
                inputMode="numeric"
                aria-invalid={touched.otp && !!errors.otp}
              />
              {touched.otp && errors.otp && (
                <p className="text-[11px] text-[#ff0000] font-medium mt-1">{errors.otp}</p>
              )}
            </div>

            {!email.trim() && (
              <div className="rounded-[8px] text-center px-4 py-2.5 text-[12px] font-medium text-[#ff0000] bg-[rgba(255,0,0,0.05)] border border-[rgba(255,0,0,0.15)]">
                Không tìm thấy email xác minh. Vui lòng đăng ký lại hoặc quay lại luồng trước đó.
              </div>
            )}

            {serverError && (
              <div className="rounded-[8px] text-center px-4 py-2.5 text-[12px] font-medium text-[#ff0000] bg-[rgba(255,0,0,0.05)] border border-[rgba(255,0,0,0.15)]">
                {serverError}
              </div>
            )}

            {isVerified && (
              <div className="rounded-[8px] text-center px-4 py-2.5 text-[12px] font-medium text-emerald-400 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)]">
                Email đã được xác minh. Hệ thống sẽ chuyển bạn sang màn hình đăng nhập.
              </div>
            )}

            <button
              type="submit"
              disabled={isDisabled}
              className="w-full bg-[#ffffff] text-[#000000] py-3 rounded-full font-semibold text-[14px] hover:bg-[#f0f0f0] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Xác nhận tài khoản
            </button>
          </form>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending || countdown > 0 || !email.trim()}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-[#3b9eff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isResending ? 'Đang gửi lại...' : countdown > 0 ? `Gửi lại sau ${countdown}s` : t('auth.verify.resend')}
          </button>
        </div>

        <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">
          <ArrowLeft size={16} /> {t('auth.reset.back')}
        </Link>
      </div>
    </div>
  );
}
