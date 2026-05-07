import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { verifyEmail, resendVerifyEmail } from '../api/auth';
import Logo from '../components/Logo';
import { 
  ArrowLeft,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function VerifyEmail() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const passedEmail = location.state?.email;
    if (passedEmail) {
      setEmail(passedEmail);
    }
  }, [location.state]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) {
      showToast('Email và OTP là bắt buộc', 'error');
      return;
    }
    if (otp.length !== 6) {
      showToast('OTP phải gồm 6 chữ số', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await verifyEmail({ email, otp });
      showToast(response.message || 'Xác thực thành công', 'success');
      navigate('/login');
    } catch (error: any) {
      showToast(error.message || 'Mã OTP không hợp lệ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showToast('Vui lòng nhập email trước', 'error');
      return;
    }
    setIsResending(true);
    try {
      const response = await resendVerifyEmail(email);
      showToast(response.message || 'Đã gửi lại OTP', 'success');
    } catch (error: any) {
      showToast(error.message || 'Không thể gửi lại OTP', 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 selection:bg-[#ff801f] selection:text-[#ffffff]">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2 flex flex-col items-center">
          <Logo theme="dark" size="lg" className="mb-4" />
          <h1 className="text-[32px] font-display font-medium text-[#f0f0f0] tracking-tight">{t('auth.verify.title') || 'Xác thực Email'}</h1>
          <p className="text-[14px] text-[#a1a4a5]">
            {t('auth.verify.desc') || 'Nhập mã 6 số được gửi đến'}{' '}
            <span className="font-bold text-[#f0f0f0]">{email || 'email của bạn'}</span>
          </p>
        </div>

        <div className="bg-[#000000] p-8 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 space-y-8">
          <form className="space-y-6" onSubmit={handleVerify}>
            
            {!location.state?.email && (
              <div className="space-y-1.5">
                <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-transparent border pl-4 pr-4 py-3 text-[14px] text-[#f0f0f0] outline-none transition-all rounded-[8px] focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40 border-[rgba(255,255,255,0.3)] focus:border-primary"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-[#a1a4a5] tracking-[0.5px]">Mã OTP (6 chữ số)</label>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full bg-transparent border text-center text-2xl tracking-[0.5em] py-2 text-[#f0f0f0] font-mono outline-none transition-all rounded-[8px] focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40 border-[rgba(255,255,255,0.3)] focus:border-primary"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || otp.length !== 6 || !email}
              className="w-full bg-[#ffffff] text-[#000000] py-3.5 rounded-[12px] font-black text-sm shadow-md shadow-primary/20 hover:bg-[#f0f0f0] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-6"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Xác thực tài khoản
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || !email}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-[#3b9eff] hover:text-[#60a5fa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={isResending ? 'animate-spin' : ''} />
              {isResending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
            </button>
          </form>
        </div>

        <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">
          <ArrowLeft size={16} /> {t('auth.reset.back') || 'Quay lại Đăng nhập'}
        </Link>
      </div>
    </div>
  );
}
