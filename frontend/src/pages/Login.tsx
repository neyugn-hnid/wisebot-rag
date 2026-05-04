import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { useRole } from '../contexts/RoleContext';
import { storeTokens } from '../lib/auth';
import { login } from '../api/auth';
import Logo from '../components/Logo';
import { 
  Mail, 
  Lock, 
  Eye,
  EyeOff
} from 'lucide-react';
import { GoogleIcon, GithubIcon } from '../components/SocialIcons';

const NETWORK_ERROR_MESSAGE = 'Không thể kết nối đến máy chủ.';

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
  const [loginError, setLoginError] = useState('');
  const clearLoginError = () => {
    if (loginError) {
      setLoginError('');
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');

    if (!email.trim() || !password.trim()) {
      setLoginError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await login({
        username: email.trim(),
        password,
      });

      storeTokens({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      }, rememberMe ? 'local' : 'session');
      syncFromAccessToken(payload.accessToken);

      showToast(t('toast.login_success'), 'success');
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : NETWORK_ERROR_MESSAGE;
      setLoginError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 selection:bg-[#ff801f] selection:text-[#ffffff]">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2 flex flex-col items-center">
          <Logo theme="dark" size="lg" className="mb-4" />
          <h1 className="text-[32px] font-display font-medium text-[#f0f0f0] tracking-tight">{t('auth.welcome')}</h1>
          <p className="text-[14px] text-[#a1a4a5]">{t('auth.welcome_desc')}</p>
        </div>

        <div className="bg-[#000000] p-8 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 space-y-6">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
                <input 
                  type="email" 
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearLoginError();
                  }}
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] pl-10 pr-4 py-3 text-[14px] text-[#f0f0f0] outline-none transition-all placeholder:/40 rounded-[8px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">{t('auth.password')}</label>
                <Link to="/reset-password" title="Reset your password" className="text-[12px] font-medium text-[#3b9eff] hover:underline">{t('auth.forgot_password')}</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearLoginError();
                  }}
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] pl-10 pr-10 py-3 text-[14px] text-[#f0f0f0] outline-none transition-all placeholder:/40 rounded-[8px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40"
                  autoComplete="current-password"
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
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded-[4px]-[4px] border border-[rgba(255,255,255,0.3)] bg-transparent text-[#f0f0f0] focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
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

            {loginError && (
              <div className="rounded-[12px] text-center px-4 py-3 text-sm font-medium text-rose-600">
                {loginError}
              </div>
            )}
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
          {t('auth.no_account')} <Link to="/register" className="text-[#f0f0f0] font-semibold hover:underline">{t('auth.create_account')}</Link>
        </p>
      </div>
    </div>
  );
}
