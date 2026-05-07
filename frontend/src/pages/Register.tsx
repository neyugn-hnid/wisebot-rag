import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { register } from '../api/auth';
import Logo from '../components/Logo';
import { 
  Mail, 
  Lock, 
  User,
  Eye,
  EyeOff
} from 'lucide-react';
import { GoogleIcon, GithubIcon } from '../components/SocialIcons';

type FieldErrors = Record<string, string | undefined>;
const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

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
        if (!GMAIL_REGEX.test(value.trim())) return t('validation.email');
        return undefined;
      case 'password':
        if (!value) return t('validation.required');
        if (value.length < 8) return t('validation.password_min').replace('{min}', '8');
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
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, e.target.value, password) }));
  };

  const handleChange = (field: string, setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validateField(field, e.target.value, password) }));
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-transparent border pl-10 pr-4 py-3 text-[14px] text-[#f0f0f0] outline-none transition-all rounded-[8px] focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40 ${
      touched[field] && errors[field]
        ? 'border-[#ff0000] focus:border-[#ff0000]'
        : 'border-[rgba(255,255,255,0.3)] focus:border-primary'
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
      navigate('/verify-email', { state: { email: email.trim() } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 selection:bg-[#ff801f] selection:text-[#ffffff]">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2 flex flex-col items-center">
          <Logo theme="dark" size="lg" className="mb-4" />
          <h1 className="text-[32px] font-display font-medium text-[#f0f0f0] tracking-tight">{t('auth.register.title')}</h1>
          <p className="text-[14px] text-[#a1a4a5]">{t('auth.register.desc')}</p>
        </div>

        <div className="bg-[#000000] p-8 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 space-y-6">
          <form className="space-y-5" onSubmit={handleRegister} noValidate>
            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">{t('auth.register.full_name')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
                <input 
                  type="text" 
                  placeholder="John Doe"
                  value={fullName}
                  onChange={handleChange('fullName', setFullName)}
                  onBlur={handleBlur('fullName')}
                  className={inputClass('fullName')}
                  autoComplete="name"
                />
              </div>
              {touched.fullName && errors.fullName && (
                <p className="text-[11px] text-[#ff0000] font-medium mt-1">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={handleChange('email', setEmail)}
                  onBlur={handleBlur('email')}
                  placeholder="example@gmail.com"
                  className={inputClass('email')}
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-[11px] text-[#ff0000] font-medium mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={handleChange('password', setPassword)}
                  onBlur={handleBlur('password')}
                  className={`${inputClass('password')} pr-10`}
                  autoComplete="new-password"
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

            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={handleChange('confirmPassword', setConfirmPassword)}
                  onBlur={handleBlur('confirmPassword')}
                  className={inputClass('confirmPassword')}
                  autoComplete="new-password"
                />
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-[11px] text-[#ff0000] font-medium mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (e.target.checked) setErrors(prev => ({ ...prev, terms: undefined }));
                }}
                className="mt-1 rounded border-[rgba(255,255,255,0.3)] bg-transparent focus:ring-2 focus:ring-primary/20"
              />
              <label htmlFor="terms" className="text-[14px] text-[#a1a4a5] leading-relaxed">
                I agree to the <a href="#" className="text-[#f0f0f0] font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-[#f0f0f0] font-semibold hover:underline">Privacy Policy</a>.
              </label>
            </div>
            {touched.terms && errors.terms && (
              <p className="text-[11px] text-[#ff0000] font-medium -mt-4 ml-2">{errors.terms}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#ffffff] text-[#000000] py-3 rounded-full font-semibold text-[14px] hover:bg-[#f0f0f0] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang đăng ký...' : t('auth.register.submit')}
            </button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(255,255,255,0.3)]"></div>
            </div>
            <div className="relative flex justify-center text-[12px]">
              <span className="bg-[#000000] px-4 text-[#a1a4a5] font-semibold tracking-[0.5px]">{t('auth.or_continue')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-full bg-transparent border border-[rgba(255,255,255,0.3)] text-[14px] font-semibold text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.05)] transition-all">
              <GoogleIcon size={16} /> Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-full bg-transparent border border-[rgba(255,255,255,0.3)] text-[14px] font-semibold text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.05)] transition-all">
              <GithubIcon size={16} className="text-[#f0f0f0]" /> GitHub
            </button>
          </div>
        </div>

        <p className="text-center text-[14px] text-[#a1a4a5]">
          {t('auth.register.have_account')} <Link to="/login" className="text-[#f0f0f0] font-semibold hover:underline">{t('auth.register.login')}</Link>
        </p>
      </div>
    </div>
  );
}
