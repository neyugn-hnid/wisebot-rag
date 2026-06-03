import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { useRole } from '../contexts/RoleContext';
import { storeTokens } from '../lib/auth';
import { login } from '../api/auth';
import { isValidEmail, looksLikeEmail } from '../lib/validation';
import Logo from '../components/Logo';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { GoogleIcon, GithubIcon } from '../components/SocialIcons';

export default function Login() {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const { syncFromAccessToken } = useRole();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState('');

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'email':
        if (!value.trim()) return t('validation.required');
        if (looksLikeEmail(value) && !isValidEmail(value)) return 'Email không đúng định dạng.';
        return undefined;
      case 'password':
        if (!value) return t('validation.required');
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (field: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, e.target.value) }));
  };

  const handleChange = (field: string, setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (serverError) setServerError('');
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, e.target.value) }));
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-[14px] border bg-[#f8fafc] pl-11 pr-4 py-3 text-[14px] text-[#111111] outline-none transition-all placeholder:text-[#9ca3af] ${
      touched[field] && errors[field]
        ? 'border-[#ff0000] focus:border-[#ff0000] focus:ring-2 focus:ring-[#ff0000]/20'
        : 'border-[#e5e7eb] focus:border-[#00D4A4] focus:bg-white focus:ring-2 focus:ring-[#00D4A4]/20'
    }`;

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: Record<string, string | undefined> = {
      email: validateField('email', email),
      password: validateField('password', password),
    };
    setErrors(newErrors);
    setTouched({ email: true, password: true });
    if (newErrors.email || newErrors.password) return;

    setIsSubmitting(true);

    try {
      const payload = await login({
        username: email.trim(),
        password,
      });

      if (!payload.accessToken || !payload.refreshToken) {
        throw new Error(t('validation.login_failed'));
      }

      storeTokens(
        {
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        },
        rememberMe ? 'local' : 'session'
      );
      syncFromAccessToken(payload.accessToken);

      showToast(t('toast.login_success'), 'success');
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('toast.server_error');
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e7f8ff_0%,#f8fbf8_48%,#ffffff_100%)] px-6 py-10 text-[#111111] selection:bg-[#00D4A4] selection:text-[#111111]">
      <div className="pointer-events-none fixed inset-x-0 top-12 mx-auto h-[320px] max-w-[900px] rounded-full bg-white/50 blur-3xl" />
      <div className="pointer-events-none fixed left-[8%] top-24 h-24 w-48 rounded-full bg-[#00D4A4]/10 blur-2xl" />
      <div className="pointer-events-none fixed right-[10%] top-36 h-20 w-56 rounded-full bg-[#60a5fa]/15 blur-2xl" />
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center">
        <section className="relative w-full max-w-md">
          <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 space-y-4 text-center">
              <div className="flex justify-center">
                <Logo customSize={132} />
              </div>
              <div className="space-y-2">
                <h1 className="text-[30px] font-display font-medium tracking-tight text-[#111111]">{t('auth.welcome')}</h1>
                <p className="text-sm leading-6 text-[#4b5563]">{t('auth.welcome_desc')}</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleLogin} noValidate>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium tracking-[0.5px] text-[#64748b]">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" size={16} />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={handleChange('email', setEmail)}
                    onBlur={handleBlur('email')}
                    className={inputClass('email')}
                    autoComplete="email"
                    aria-invalid={touched.email && !!errors.email}
                  />
                </div>
                {touched.email && errors.email ? (
                  <p className="mt-1 text-[11px] font-medium text-[#ff0000]">{errors.email}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium tracking-[0.5px] text-[#64748b]">{t('auth.password')}</label>
                  <Link to="/reset-password" title="Reset your password" className="text-[12px] font-medium text-[#047857] hover:text-[#065f46]">
                    {t('auth.forgot_password')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={handleChange('password', setPassword)}
                    onBlur={handleBlur('password')}
                    className={`${inputClass('password')} pr-11`}
                    autoComplete="current-password"
                    aria-invalid={touched.password && !!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b] transition-colors hover:text-[#111111]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {touched.password && errors.password ? (
                  <p className="mt-1 text-[11px] font-medium text-[#ff0000]">{errors.password}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-[4px] border border-[#cbd5e1] bg-white text-[#00D4A4] focus:ring-2 focus:ring-[#00D4A4]/30"
                />
                <label htmlFor="remember" className="cursor-pointer text-[14px] font-medium text-[#64748b]">
                  {t('auth.remember_me')}
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#111111] py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t('auth.login.submitting') : t('auth.sign_in')}
              </button>

              {serverError ? (
                <div className="rounded-[12px] border border-[#ff0000]/20 bg-[#ff0000]/5 px-4 py-3 text-center text-[12px] font-medium text-[#ff0000]">
                  {serverError}
                </div>
              ) : null}
            </form>

            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e5e7eb]"></div>
              </div>
              <div className="relative flex justify-center text-[12px]">
                <span className="bg-white px-4 font-semibold tracking-[0.5px] text-[#94a3b8]">
                  {t('auth.or_continue')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 rounded-[16px] border border-[#e5e7eb] bg-white py-3 text-[14px] font-semibold text-[#111111] transition-all hover:bg-[#f8fafc]">
                <GoogleIcon size={16} /> Google
              </button>
              <button className="flex items-center justify-center gap-2 rounded-[16px] border border-[#e5e7eb] bg-white py-3 text-[14px] font-semibold text-[#111111] transition-all hover:bg-[#f8fafc]">
                <GithubIcon size={16} className="text-[#111111]" /> GitHub
              </button>
            </div>

            <p className="mt-8 text-center text-[14px] text-[#64748b]">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="font-semibold text-[#047857] hover:text-[#065f46]">
                {t('auth.create_account')}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
