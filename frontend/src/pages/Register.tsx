import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';
import { 
  Mail, 
  Lock, 
  User,
  Eye,
  EyeOff
} from 'lucide-react';
import { GoogleIcon, GithubIcon } from '../components/SocialIcons';

type RegisterResponse = {
  status?: number;
  message?: string;
};

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

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showToast('Vui lòng nhập đầy đủ thông tin.', 'error');
      return;
    }

    if (!acceptedTerms) {
      showToast('Vui lòng đồng ý điều khoản trước khi đăng ký.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          inviteToken: inviteToken || null,
        }),
      });

      if (!response.ok) {
        let message = 'Đăng ký thất bại. Vui lòng thử lại.';
        try {
          const errorPayload = (await response.json()) as { message?: string; error?: string };
          message = errorPayload?.message || errorPayload?.error || message;
        } catch {
          // Keep default message when response has no JSON body.
        }
        throw new Error(message);
      }

      const payload = (await response.json()) as RegisterResponse;
      showToast(payload.message || 'Đăng ký thành công.', 'success');
      navigate('/verify-email');
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
          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">{t('auth.register.full_name')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
                <input 
                  type="text" 
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] pl-10 pr-4 py-3 text-[14px] text-[#f0f0f0] outline-none transition-all placeholder:/40 rounded-[8px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] pl-10 pr-4 py-3 text-[14px] text-[#f0f0f0] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-[#a1a4a5]/40"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] pl-10 pr-10 py-3 text-[14px] text-[#f0f0f0] outline-none transition-all placeholder:/40 rounded-[8px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] pl-10 pr-4 py-3 text-[14px] text-[#f0f0f0] outline-none transition-all placeholder:/40 rounded-[8px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 rounded-[4px]-[4px] border border-[rgba(255,255,255,0.3)] bg-transparent text-[#f0f0f0] focus:ring-2 focus:ring-primary/20"
              />
              <label htmlFor="terms" className="text-[14px] text-[#a1a4a5] leading-relaxed">
                I agree to the <a href="#" className="text-[#f0f0f0] font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-[#f0f0f0] font-semibold hover:underline">Privacy Policy</a>.
              </label>
            </div>

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
