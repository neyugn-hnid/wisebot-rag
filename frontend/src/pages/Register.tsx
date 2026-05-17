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
} from 'lucide-react';
import { GoogleIcon, GithubIcon } from '../components/SocialIcons';

type FieldErrors = Record<string, string | undefined>;

export default function Register() {
  const { t } = useLanguage();
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
    `w-full rounded-[14px] border bg-[rgba(255,255,255,0.04)] pl-11 pr-4 py-3 text-[14px] text-[#ffffff] outline-none transition-all placeholder:text-[rgba(255,255,255,0.38)] ${
      touched[field] && errors[field]
        ? 'border-[#ff0000] focus:border-[#ff0000] focus:ring-2 focus:ring-[#ff0000]/20'
        : 'border-[rgba(255,255,255,0.12)] focus:border-[rgba(59,158,255,0.35)] focus:ring-2 focus:ring-[rgba(59,158,255,0.16)]'
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,158,255,0.08),transparent_28%),#050505] px-6 pt-10 pb-6 selection:bg-[#ff801f] selection:text-[#ffffff]">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center">
        <section className="w-full max-w-md">
          <div className="rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.32)] sm:p-8">
            <div className="mb-8 space-y-4 text-center">
              <div className="flex justify-center">
                <Logo theme="dark" customSize={132} />
              </div>
              <div className="space-y-2">
                <h1 className="text-[30px] font-display font-medium tracking-tight text-[#f5f5f5]">{t('auth.register.title')}</h1>
                <p className="text-sm leading-6 text-[#8b8f91]">{t('auth.register.desc')}</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleRegister} noValidate>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium tracking-[0.5px] text-[#a1a4a5]">{t('auth.register.full_name')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
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
                  <p className="mt-1 text-[11px] font-medium text-[#ff0000]">{errors.fullName}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium tracking-[0.5px] text-[#a1a4a5]">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
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
                  <p className="mt-1 text-[11px] font-medium text-[#ff0000]">{errors.email}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium tracking-[0.5px] text-[#a1a4a5]">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a4a5] transition-colors hover:text-[#f0f0f0]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {touched.password && errors.password ? (
                  <p className="mt-1 text-[11px] font-medium text-[#ff0000]">{errors.password}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium tracking-[0.5px] text-[#a1a4a5]">{t('auth.confirm_password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
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
                  <p className="mt-1 text-[11px] font-medium text-[#ff0000]">{errors.confirmPassword}</p>
                ) : null}
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked) setErrors((prev) => ({ ...prev, terms: undefined }));
                  }}
                  className="mt-1 rounded border-[rgba(255,255,255,0.3)] bg-transparent focus:ring-2 focus:ring-primary/20"
                />
                <label htmlFor="terms" className="text-[14px] leading-relaxed text-[#a1a4a5]">
                  {t('auth.i_agree')}{' '}
                  <a href="#" className="font-semibold text-[#f0f0f0] hover:underline">{t('landing.footer.links.terms')}</a>{' '}
                  {t('auth.and')}{' '}
                  <a href="#" className="font-semibold text-[#f0f0f0] hover:underline">{t('landing.footer.links.privacy')}</a>.
                </label>
              </div>
              {touched.terms && errors.terms ? (
                <p className="-mt-3 ml-2 text-[11px] font-medium text-[#ff0000]">{errors.terms}</p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#ffffff] py-3 text-[14px] font-semibold text-[#000000] transition-all hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}
              </button>
            </form>

            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(255,255,255,0.08)]"></div>
              </div>
              <div className="relative flex justify-center text-[12px]">
                <span className="bg-[#090909] px-4 font-semibold tracking-[0.5px] text-[rgba(255,255,255,0.5)]">
                  {t('auth.or_continue')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] py-3 text-[14px] font-semibold text-[#f0f0f0] transition-all hover:bg-[rgba(255,255,255,0.08)]">
                <GoogleIcon size={16} /> Google
              </button>
              <button className="flex items-center justify-center gap-2 rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] py-3 text-[14px] font-semibold text-[#f0f0f0] transition-all hover:bg-[rgba(255,255,255,0.08)]">
                <GithubIcon size={16} className="text-[#f0f0f0]" /> GitHub
              </button>
            </div>

            <p className="mt-8 text-center text-[14px] text-[#a1a4a5]">
              {t('auth.register.have_account')}{' '}
              <Link to="/login" className="font-semibold text-[#f0f0f0] hover:text-[#ffffff]">
                {t('auth.register.login')}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
