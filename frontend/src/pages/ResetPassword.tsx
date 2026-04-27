import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';
import { 
  Mail, 
  ArrowLeft,
  Send
} from 'lucide-react';

export default function ResetPassword() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2 flex flex-col items-center">
          <Logo size="lg" className="mb-4" />
          <h1 className="text-3xl font-black text-[#f0f0f0] tracking-tight">{t('auth.reset.title')}</h1>
          <p className="text-[#a1a4a5]">{t('auth.reset.desc')}</p>
        </div>

        <div className="bg-[#000000] p-8 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-xl shadow-black/50 space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#f0f0f0] tracking-wider">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={18} />
              <input 
                type="email" 
                placeholder="name@company.com"
                className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] pl-10 pr-4 py-3 outline-none transition-all rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40"
              />
            </div>
          </div>

          <button className="w-full bg-[#ffffff] text-[#000000] py-3.5 rounded-md font-black text-sm shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all flex items-center justify-center gap-2">
            {t('auth.reset.submit')} <Send size={18} />
          </button>
        </div>

        <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">
          <ArrowLeft size={16} /> {t('auth.reset.back')}
        </Link>
      </div>
    </div>
  );
}
