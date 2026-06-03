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
    `w-full rounded-[14px] border bg-[#f8fafc] pl-11 pr-4 py-3 text-[14px] text-[#111111] outline-none transition-all placeholder:text-[#9ca3af] ${
      touched[field] && errors[field]
        ? 'border-[#ff0000] focus:border-[#ff0000] focus:ring-2 focus:ring-[#ff0000]/20'
        : 'border-[#e5e7eb] focus:border-[#00D4A4] focus:bg-white focus:ring-2 focus:ring-[#00D4A4]/20'
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#e7f8ff_0%,#f8fbf8_48%,#ffffff_100%)] px-6 pt-10 pb-6 text-[#111111] selection:bg-[#00D4A4] selection:text-[#111111]">
      <div className="pointer-events-none fixed inset-x-0 top-12 mx-auto h-[320px] max-w-[900px] rounded-full bg-white/50 blur-3xl" />
      <div className="pointer-events-none fixed left-[8%] top-24 h-24 w-48 rounded-full bg-[#00D4A4]/10 blur-2xl" />
      <div className="pointer-events-none fixed right-[10%] top-36 h-20 w-56 rounded-full bg-[#60a5fa]/15 blur-2xl" />
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center">
        <section className="relative w-full max-w-md">
          <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 space-y-4 text-center">
              <div className="flex justify-center">
                <Logo customSize={132} />
              </div>
              <div className="space-y-2">
                <h1 className="text-[30px] font-display font-medium tracking-tight text-[#111111]">{t('auth.register.title')}</h1>
                <p className="text-sm leading-6 text-[#4b5563]">{t('auth.register.desc')}</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleRegister} noValidate>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium tracking-[0.5px] text-[#64748b]">{t('auth.register.full_name')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" size={16} />
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
                <label className="text-[12px] font-medium tracking-[0.5px] text-[#64748b]">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" size={16} />
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
                <label className="text-[12px] font-medium tracking-[0.5px] text-[#64748b]">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" size={16} />
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b] transition-colors hover:text-[#111111]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {touched.password && errors.password ? (
                  <p className="mt-1 text-[11px] font-medium text-[#ff0000]">{errors.password}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium tracking-[0.5px] text-[#64748b]">{t('auth.confirm_password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" size={16} />
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
                  className="mt-1 rounded border-[#cbd5e1] bg-white text-[#00D4A4] focus:ring-2 focus:ring-[#00D4A4]/30"
                />
                <label htmlFor="terms" className="text-[14px] leading-relaxed text-[#64748b]">
                  {t('auth.i_agree')}{' '}
                  <a href="#" className="font-semibold text-[#047857] hover:underline">{t('landing.footer.links.terms')}</a>{' '}
                  {t('auth.and')}{' '}
                  <a href="#" className="font-semibold text-[#047857] hover:underline">{t('landing.footer.links.privacy')}</a>.
                </label>
              </div>
              {touched.terms && errors.terms ? (
                <p className="-mt-3 ml-2 text-[11px] font-medium text-[#ff0000]">{errors.terms}</p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#111111] py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}
              </button>
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
              {t('auth.register.have_account')}{' '}
              <Link to="/login" className="font-semibold text-[#047857] hover:text-[#065f46]">
                {t('auth.register.login')}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
