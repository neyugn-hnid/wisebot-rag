import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Send, 
  Mail, 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  ArrowRight,
  MessageSquare,
  Check,
  Shield,
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../contexts/RoleContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';
import { cn } from '../lib/utils';

export default function Contact() {
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated } = useRole();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleLanguage = () => setLanguage(language === 'en' ? 'vi' : 'en');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      showToast(
        language === 'vi' ? 'Vui lòng điền đầy đủ tất cả các trường.' : 'Please fill in all fields.',
        'error'
      );
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      showToast(
        language === 'vi' 
          ? 'Cảm ơn bạn! Tin nhắn của bạn đã được gửi thành công.' 
          : 'Thank you! Your message has been sent successfully.',
        'success'
      );
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-400 selection:text-slate-950 font-sans overflow-x-hidden relative flex flex-col justify-between">
      
      {/* Background Gradients & Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.04),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Floating neon light blobs */}
      <div className="absolute top-[15%] left-[-5%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[-5%] w-[350px] h-[350px] bg-emerald-500/6 rounded-full blur-[100px] pointer-events-none" />

      {/* 1. PUBLIC HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl transition">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center hover:opacity-90 transition">
            <Logo customSize={86} />
          </Link>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleLanguage} 
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-700 transition"
            >
              <Globe size={14} />
              {language.toUpperCase()}
            </button>
            
            {isAuthenticated ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-xs font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <span>Dashboard</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-200 px-4 py-2 text-xs font-semibold transition"
              >
                <span>{t('auth.register.login')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. CONTACT MAIN LAYOUT */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8 py-16 relative z-10 space-y-12">
        
        {/* Title Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-bold text-emerald-400 tracking-wide select-none">
            <MessageSquare size={12} />
            {language === 'vi' ? 'Kết nối với đội ngũ WiseBot' : 'Get in touch with WiseBot Team'}
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl leading-tight">
            {language === 'vi' ? 'Liên hệ với chúng tôi' : 'Contact Us'}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed font-light">
            {language === 'vi'
              ? 'Có câu hỏi về tính năng, bảng giá hoặc cần hỗ trợ tùy chỉnh doanh nghiệp? Chúng tôi luôn sẵn sàng lắng nghe.'
              : 'Have questions about features, pricing plans, or custom enterprise requirements? We are here to help.'}
          </p>
        </div>

        {/* 2 columns layout */}
        <div className="grid gap-8 lg:grid-cols-12 max-w-6xl mx-auto items-stretch">
          
          {/* Column 1: Contact Form (Left) - Glass Card */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-950/40 p-6 sm:p-8 backdrop-blur-md flex flex-col justify-between relative text-left">
            <div className="absolute top-0 left-0 w-[150px] h-[150px] bg-indigo-500/5 rounded-full blur-[70px] pointer-events-none" />

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <h3 className="text-xl font-bold text-white mb-2">
                {language === 'vi' ? 'Gửi tin nhắn cho chúng tôi' : 'Send us a message'}
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-slate-400">
                    {language === 'vi' ? 'Họ và tên' : 'Full Name'}
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={language === 'vi' ? 'Nguyễn Văn A' : 'John Doe'}
                    className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/80 px-4 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/80 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-400">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@wisebot.dev"
                    className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/80 px-4 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/80 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-xs font-semibold text-slate-400">
                  {language === 'vi' ? 'Tiêu đề' : 'Subject'}
                </label>
                <input
                  id="subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={language === 'vi' ? 'Tôi cần hỗ trợ về...' : 'Request regarding...'}
                  className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/80 px-4 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/80 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-semibold text-slate-400">
                  {language === 'vi' ? 'Nội dung tin nhắn' : 'Message details'}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder={language === 'vi' ? 'Nhập chi tiết yêu cầu của bạn ở đây...' : 'Type details of your request here...'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/80 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1.5",
                  isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                )}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{language === 'vi' ? 'Đang gửi...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>{language === 'vi' ? 'Gửi tin nhắn' : 'Submit message'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Column 2: Address Info & Contact Cards (Right) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6 text-left">
            
            {/* Info Cards */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur-md space-y-6 flex-1 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white">
                {language === 'vi' ? 'Thông tin liên hệ' : 'Contact Information'}
              </h3>
              
              <div className="space-y-4 text-xs font-light text-slate-300">
                
                {/* Office address */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-0.5">{language === 'vi' ? 'Trụ sở chính' : 'Main Office HQ'}</h4>
                    <p className="text-slate-400 leading-relaxed">
                      {language === 'vi' 
                        ? 'Tòa nhà Innovation, Khu Công nghệ cao, Quận 9, TP. Hồ Chí Minh, Việt Nam' 
                        : 'Innovation Center Building, High-Tech Park, District 9, Ho Chi Minh City, Vietnam'}
                    </p>
                  </div>
                </div>

                {/* Email Support */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Email Support</h4>
                    <p className="text-slate-400 leading-relaxed select-all">
                      support@wisebot.dev
                    </p>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Phone size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-0.5">{language === 'vi' ? 'Điện thoại' : 'Telephone'}</h4>
                    <p className="text-slate-400 leading-relaxed select-all">
                      +84 (28) 3730-8888
                    </p>
                  </div>
                </div>

                {/* Hours of work */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-0.5">{language === 'vi' ? 'Giờ làm việc' : 'Business Hours'}</h4>
                    <p className="text-slate-400 leading-relaxed">
                      {language === 'vi' 
                        ? 'Thứ 2 - Thứ 6: 8:00 - 18:00 (GMT+7)' 
                        : 'Monday - Friday: 8:00 AM - 6:00 PM (GMT+7)'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Links Card */}
            <div className="rounded-3xl border border-slate-800/80 bg-indigo-500/5 p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Shield size={16} className="text-indigo-400" />
                <span>{language === 'vi' ? 'Cam kết bảo mật & SLA' : 'SLA & Privacy Commitments'}</span>
              </h4>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                {language === 'vi'
                  ? 'Mọi thông tin liên hệ và trao đổi giải pháp doanh nghiệp đều được bảo mật tuyệt đối theo tiêu chuẩn mã hóa dữ liệu SOC2.'
                  : 'All information exchanged is strictly kept confidential following industry-standard SOC2 data compliance protocols.'}
              </p>
              <div className="flex gap-4 pt-1">
                <Link to="/faq" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                  <span>FAQ</span>
                  <ArrowRight size={12} />
                </Link>
                <Link to="/docs" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                  <span>Docs</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3. FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-600 z-10 relative">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-light">
          <p>© 2026 WiseBot Inc. All rights reserved.</p>
          <p className="flex items-center gap-1 justify-center">
            <span>Powered by WiseBot Support Team</span>
            <span className="text-red-500">❤️</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
