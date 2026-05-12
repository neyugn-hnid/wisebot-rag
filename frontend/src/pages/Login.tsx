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
  EyeOff
} from 'lucide-react';
import { GoogleIcon, GithubIcon } from '../components/SocialIcons';

export default function Login() {
  const { t } = useLanguage();
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
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, e.target.value) }));
  };

  const handleChange = (field: string, setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (serverError) setServerError('');
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validateField(field, e.target.value) }));
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-[rgba(255,255,255,0.06)] border pl-10 pr-4 py-3 text-[14px] text-[#ffffff] outline-none transition-all rounded-[8px] focus:border-white focus:ring-2 focus:ring-white/30 placeholder:text-[rgba(255,255,255,0.38)] ${
      touched[field] && errors[field]
        ? 'border-[#ff0000] focus:border-[#ff0000] focus:ring-[#ff0000]/30'
        : 'border-[rgba(255,255,255,0.12)]'
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

      storeTokens({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      }, rememberMe ? 'local' : 'session');
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
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-6 py-10 selection:bg-[#ff801f] selection:text-[#ffffff]">
      <div className="max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center flex flex-col items-center">
          <Logo theme="dark" customSize={142} className="mb-0" />
        </div>

        <div className="bg-[#000000] p-8 rounded-[16px] space-y-6">
          <form className="space-y-5" onSubmit={handleLogin} noValidate>
            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
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
              {touched.email && errors.email && (
                <p className="text-[11px] text-[#ff0000] font-medium mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">{t('auth.password')}</label>
                <Link to="/reset-password" title="Reset your password" className="text-[12px] font-medium text-[#3b9eff]">{t('auth.forgot_password')}</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={handleChange('password', setPassword)}
                  onBlur={handleBlur('password')}
                  className={`${inputClass('password')} pr-10`}
                  autoComplete="current-password"
                  aria-invalid={touched.password && !!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-[11px] text-[#ff0000] font-medium mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded-[4px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] text-[#f0f0f0] focus:ring-2 focus:ring-white/30"
              />
              <label htmlFor="remember" className="text-[14px] text-[#a1a4a5] font-medium cursor-pointer">{t('auth.remember_me')}</label>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#ffffff] text-[#000000] py-3 rounded-full font-semibold text-[14px] hover:bg-[#f0f0f0] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang đăng nhập...' : t('auth.sign_in')}
            </button>

            {serverError && (
              <div className="rounded-[8px] text-center px-4 py-2.5 text-[12px] font-medium text-[#ff0000] bg-[rgba(255,0,0,0.05)] border border-[rgba(255,0,0,0.15)]">
                {serverError}
              </div>
            )}
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(255,255,255,0.08)]"></div>
            </div>
            <div className="relative flex justify-center text-[12px]">
              <span className="bg-[#000000] px-4 text-[rgba(255,255,255,0.5)] font-semibold tracking-[0.5px]">{t('auth.or_continue')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[14px] font-semibold text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.12)] transition-all">
              <GoogleIcon size={16} /> Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[14px] font-semibold text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.12)] transition-all">
              <GithubIcon size={16} className="text-[#f0f0f0]" /> GitHub
            </button>
          </div>
        </div>

        <p className="text-center text-[14px] text-[#a1a4a5]">
          {t('auth.no_account')} <Link to="/register" className="text-[#f0f0f0] font-semibold">{t('auth.create_account')}</Link>
        </p>
      </div>
    </div>
  );
}
