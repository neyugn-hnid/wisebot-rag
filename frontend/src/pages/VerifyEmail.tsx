import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';
import { 
  Mail, 
  ArrowLeft,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function VerifyEmail() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2 flex flex-col items-center">
          <Logo size="lg" className="mb-4" />
          <h1 className="text-3xl font-black text-[#f0f0f0] tracking-tight">{t('auth.verify.title')}</h1>
          <p className="text-[#a1a4a5]">{t('auth.verify.desc')} <span className="font-bold text-[#f0f0f0]">alex@company.com</span></p>
        </div>

        <div className="bg-[#000000] p-8 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-xl shadow-black/50 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[rgba(255,255,255,0.02)] rounded-[16px] border border-[rgba(255,255,255,0.3)]">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-xs text-[#a1a4a5] leading-relaxed">
                {t('auth.verify.instruction')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Link to="/dashboard" className="w-full bg-[#ffffff] text-[#000000] py-3.5 rounded-[16px] font-black text-sm shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all flex items-center justify-center gap-2">
              {t('auth.verify.dashboard')}
            </Link>
            
            <button className="w-full flex items-center justify-center gap-2 text-sm font-bold text-[#3b9eff] transition-colors">
              <RefreshCw size={16} /> {t('auth.verify.resend')}
            </button>
          </div>
        </div>

        <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">
          <ArrowLeft size={16} /> {t('auth.reset.back')}
        </Link>
      </div>
    </div>
  );
}
