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
  Globe
} from 'lucide-react';

type ErrorMap = Record<string, string | undefined>;

export default function VerifyEmail() {
  const { t, language, setLanguage } = useLanguage();
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
    `w-full bg-slate-950/80 border py-3 text-[14px] text-slate-100 outline-none transition-all rounded-xl ${
      field === 'email' ? 'pl-10 pr-4' : 'pl-4 pr-4 text-center tracking-[0.35em]'
    } ${
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

  const toggleLanguage = () => setLanguage(language === 'en' ? 'vi' : 'en');

  const isDisabled =
    isSubmitting ||
    isResending ||
    !!validateField('email', email) ||
    !!validateField('otp', otp);

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
                <h1 className="text-3xl font-extrabold tracking-tight text-white">{t('auth.verify.title')}</h1>
                <p className="text-xs text-slate-400 font-light">{t('auth.verify.desc')}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Alert / Guidance Box */}
              <div className="flex items-start gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-left">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                    Nhập mã OTP gồm 6 chữ số đã được gửi tới email của bạn.
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                    Mã xác minh có hiệu lực trong 10 phút. Nếu mã hết hạn, bạn có thể gửi lại OTP mới.
                  </p>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleVerify} noValidate>
                {/* OTP Input Field */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã OTP</label>
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
                    <p className="text-[11px] text-red-400 font-medium mt-1">{errors.otp}</p>
                  )}
                </div>

                {!email.trim() && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-center text-xs font-medium text-red-400">
                    Không tìm thấy email xác minh. Vui lòng đăng ký lại hoặc quay lại luồng trước đó.
                  </div>
                )}

                {serverError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-center text-xs font-medium text-red-400">
                    {serverError}
                  </div>
                )}

                {isVerified && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-center text-xs font-medium text-emerald-400">
                    Email đã được xác minh. Hệ thống sẽ chuyển bạn sang màn hình đăng nhập.
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] shadow-[0_0_10px_rgba(16,185,129,0.15)] disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin text-slate-950" />}
                  <span>Xác nhận tài khoản</span>
                </button>
              </form>

              {/* Resend Action */}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending || countdown > 0 || !email.trim()}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                <span>
                  {isResending 
                    ? 'Đang gửi lại...' 
                    : countdown > 0 
                      ? `Gửi lại sau ${countdown}s` 
                      : t('auth.verify.resend')}
                </span>
              </button>
            </div>

            {/* Back Link */}
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
