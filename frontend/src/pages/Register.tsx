import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { register } from '../api/auth';
import { hasMinLength, isValidGmail } from '../lib/validation';
import Logo from '../components/Logo';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Globe,
  ArrowRight
} from 'lucide-react';
import { GoogleIcon, GithubIcon } from '../components/SocialIcons';

type FieldErrors = Record<string, string | undefined>;

export default function Register() {
  const { t, language, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const inviteToken = searchParams.get('inviteToken') || searchParams.get('token') || '';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string, passwordRef?: string) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return t('validation.required');
        if (value.trim().length < 2) return t('validation.name_min').replace('{min}', '2');
        return undefined;
      case 'email':
        if (!value.trim()) return t('validation.required');
        if (!isValidGmail(value)) return t('validation.email');
        return undefined;
      case 'password':
        if (!value) return t('validation.required');
        if (!hasMinLength(value, 9)) return t('validation.password_min').replace('{min}', '9');
        return undefined;
      case 'confirmPassword':
        if (!value) return t('validation.required');
        if (value !== passwordRef) return t('validation.password_match');
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (field: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, e.target.value, password) }));
  };

  const handleChange = (field: string, setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setter(nextValue);
    setErrors((prev) => {
      const nextErrors = { ...prev };
      if (touched[field]) {
        nextErrors[field] = validateField(field, nextValue, field === 'password' ? nextValue : password);
      }
      if (field === 'password' && touched.confirmPassword) {
        nextErrors.confirmPassword = validateField('confirmPassword', confirmPassword, nextValue);
      }
      return nextErrors;
    });
  };

  const inputClass = (field: string) =>
    `w-full rounded-xl border bg-slate-950/80 pl-11 pr-4 py-3 text-[14px] text-slate-100 outline-none transition-all placeholder:text-slate-600 ${
      touched[field] && errors[field]
        ? 'border-red-500/40 focus:border-red-500/80 focus:ring-2 focus:ring-red-500/10'
        : 'border-slate-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10'
    }`;

  const validateAll = (): boolean => {
    const newErrors: FieldErrors = {
      fullName: validateField('fullName', fullName),
      email: validateField('email', email),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword, password),
    };
    if (!acceptedTerms) newErrors.terms = t('validation.terms');
    setErrors(newErrors);
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true, terms: true });
    return !Object.values(newErrors).some(Boolean);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsSubmitting(true);

    try {
      const payload = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        inviteToken: inviteToken || undefined,
      });

      showToast(payload.message || 'Đăng ký thành công.', 'success');
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLanguage = () => setLanguage(language === 'en' ? 'vi' : 'en');

  return (
    <div className="min-h-screen bg-[#030712] px-6 pt-10 pb-6 text-slate-100 selection:bg-emerald-400 selection:text-slate-950 relative overflow-hidden flex items-center justify-center font-sans">
      
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

      <div className="mx-auto flex w-full max-w-md items-center justify-center relative z-10">
        <section className="relative w-full">
          {/* Card Frame */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8 animate-border-glow">
            
            <div className="mb-8 space-y-4 text-center">
              <Link to="/" className="flex justify-center hover:opacity-90 transition">
                <Logo theme="dark" customSize={118} />
              </Link>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">{t('auth.register.title')}</h1>
                <p className="text-xs text-slate-400 font-light">{t('auth.register.desc')}</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleRegister} noValidate>
              
              {/* Full Name */}
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('auth.register.full_name')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={handleChange('fullName', setFullName)}
                    onBlur={handleBlur('fullName')}
                    className={inputClass('fullName')}
                    autoComplete="name"
                    aria-invalid={touched.fullName && !!errors.fullName}
                  />
                </div>
                {touched.fullName && errors.fullName ? (
                  <p className="mt-1 text-[11px] font-medium text-red-400">{errors.fullName}</p>
                ) : null}
              </div>

              {/* Email */}
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={handleChange('email', setEmail)}
                    onBlur={handleBlur('email')}
                    placeholder="example@gmail.com"
                    className={inputClass('email')}
                    autoComplete="email"
                    aria-invalid={touched.email && !!errors.email}
                  />
                </div>
                {touched.email && errors.email ? (
                  <p className="mt-1 text-[11px] font-medium text-red-400">{errors.email}</p>
                ) : null}
              </div>

              {/* Password */}
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={handleChange('password', setPassword)}
                    onBlur={handleBlur('password')}
                    className={`${inputClass('password')} pr-11`}
                    autoComplete="new-password"
                    aria-invalid={touched.password && !!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {touched.password && errors.password ? (
                  <p className="mt-1 text-[11px] font-medium text-red-400">{errors.password}</p>
                ) : null}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('auth.confirm_password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={handleChange('confirmPassword', setConfirmPassword)}
                    onBlur={handleBlur('confirmPassword')}
                    className={inputClass('confirmPassword')}
                    autoComplete="new-password"
                    aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
                  />
                </div>
                {touched.confirmPassword && errors.confirmPassword ? (
                  <p className="mt-1 text-[11px] font-medium text-red-400">{errors.confirmPassword}</p>
                ) : null}
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-3 text-left pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked) setErrors((prev) => ({ ...prev, terms: undefined }));
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-none cursor-pointer"
                />
                <label htmlFor="terms" className="text-[13px] leading-relaxed text-slate-400 select-none">
                  {t('auth.i_agree')}{' '}
                  <a href="#" className="font-bold text-emerald-400 hover:underline">{t('landing.footer.links.terms')}</a>{' '}
                  {t('auth.and')}{' '}
                  <a href="#" className="font-bold text-emerald-400 hover:underline">{t('landing.footer.links.privacy')}</a>.
                </label>
              </div>
              {touched.terms && errors.terms ? (
                <p className="text-[11px] font-medium text-red-400 text-left pl-7">{errors.terms}</p>
              ) : null}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] shadow-[0_0_10px_rgba(16,185,129,0.15)] disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden mt-2"
              >
                {isSubmitting && (
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                )}
                <span>{isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}</span>
              </button>

            </form>

            {/* Separator */}
            <div className="relative py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-900"></div>
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-slate-950 px-4 font-bold uppercase tracking-wider text-slate-500">
                  {t('auth.or_continue')}
                </span>
              </div>
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 py-3 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-900 hover:border-slate-700">
                <GoogleIcon size={14} /> Google
              </button>
              <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 py-3 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-900 hover:border-slate-700">
                <GithubIcon size={14} className="text-slate-300" /> GitHub
              </button>
            </div>

            {/* Link to Login */}
            <p className="mt-8 text-center text-[13px] text-slate-400">
              {t('auth.register.have_account')}{' '}
              <Link to="/login" className="font-bold text-emerald-400 hover:text-emerald-300 transition">
                {t('auth.register.login')}
              </Link>
            </p>

          </div>
        </section>
      </div>
    </div>
  );
}
