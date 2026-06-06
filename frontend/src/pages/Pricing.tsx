import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Check, 
  HelpCircle, 
  Globe, 
  ArrowRight,
  Sparkles,
  Tag,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../contexts/RoleContext';
import Logo from '../components/Logo';
import { cn } from '../lib/utils';

export default function Pricing() {
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated } = useRole();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const toggleLanguage = () => setLanguage(language === 'en' ? 'vi' : 'en');

  const plans = [
    {
      name: t('landing.pricing.free.name') || 'Free',
      price: '0',
      desc: language === 'vi' ? 'Dành cho cá nhân thử nghiệm RAG.' : 'For individuals testing out RAG chatbots.',
      features: [
        t('landing.pricing.free.f1') || '1 Chatbot',
        t('landing.pricing.free.f2') || '1,000 Messages/mo',
        language === 'vi' ? '1 Cơ sở tri thức' : '1 Knowledge Base',
        language === 'vi' ? 'Tải lên tối đa 10 tài liệu' : 'Up to 10 uploaded documents',
        t('landing.pricing.free.f3') || 'Standard Support'
      ],
      cta: language === 'vi' ? 'Bắt đầu miễn phí' : 'Start Free',
      ctaVariant: 'secondary' as const,
      popular: false
    },
    {
      name: t('landing.pricing.plus.name') || 'Plus',
      price: billingPeriod === 'monthly' ? '19' : '15',
      desc: language === 'vi' ? 'Dành cho doanh nghiệp vừa và nhỏ.' : 'For growing startups and businesses.',
      features: [
        t('landing.pricing.plus.f1') || '5 Chatbots',
        t('landing.pricing.plus.f2') || '10,000 Messages/mo',
        language === 'vi' ? '5 Cơ sở tri thức' : '5 Knowledge Bases',
        language === 'vi' ? 'Tải lên tối đa 200 tài liệu' : 'Up to 200 uploaded documents',
        t('landing.pricing.plus.f3') || 'Advanced Analytics',
        t('landing.pricing.plus.f4') || 'Priority Support',
        language === 'vi' ? 'Hỗ trợ kết nối API' : 'API Access'
      ],
      cta: language === 'vi' ? 'Nâng cấp Plus' : 'Upgrade to Plus',
      ctaVariant: 'primary' as const,
      popular: true
    },
    {
      name: t('landing.pricing.pro.name') || 'Pro',
      price: billingPeriod === 'monthly' ? '99' : '79',
      desc: language === 'vi' ? 'Dành cho doanh nghiệp quy mô lớn.' : 'For large scale enterprise setups.',
      features: [
        t('landing.pricing.pro.f1') || 'Unlimited Chatbots',
        t('landing.pricing.pro.f2') || 'Unlimited Messages',
        language === 'vi' ? 'Không giới hạn Cơ sở tri thức' : 'Unlimited Knowledge Bases',
        t('landing.pricing.pro.f3') || 'Custom Branding',
        t('landing.pricing.pro.f4') || 'API Access',
        t('landing.pricing.pro.f5') || '24/7 Dedicated Support',
        language === 'vi' ? 'Hỗ trợ Tích hợp theo yêu cầu' : 'Custom Integration support'
      ],
      cta: language === 'vi' ? 'Liên hệ kinh doanh' : 'Contact Sales',
      ctaVariant: 'secondary' as const,
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-400 selection:text-slate-950 font-sans overflow-x-hidden relative flex flex-col justify-between">
      
      {/* Background Gradients & Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.04),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Floating neon light blobs */}
      <div className="absolute top-[15%] left-[-5%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[-5%] w-[350px] h-[350px] bg-emerald-500/6 rounded-full blur-[100px] pointer-events-none" />

      {/* Global styles for border tracking animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(16, 185, 129, 0.2); }
          50% { border-color: rgba(99, 102, 241, 0.6); }
        }
        .animate-border-glow {
          animation: borderGlow 4s ease-in-out infinite;
        }
      `}} />

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

      {/* 2. PRICING CONTENTS */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8 py-16 relative z-10 space-y-12">
        
        {/* Title Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-bold text-emerald-400 tracking-wide select-none">
            <Tag size={12} />
            {t('landing.pricing.title') || 'Simple, transparent pricing'}
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl leading-tight">
            {language === 'vi' ? 'Bảng giá dịch vụ' : 'Pricing Plans'}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed font-light">
            {t('landing.pricing.subtitle') || "Choose the plan that's right for your business."}
          </p>

          {/* Monthly / Yearly Billing Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3 select-none">
            <span className={cn("text-xs font-semibold transition-colors", billingPeriod === 'monthly' ? "text-white" : "text-slate-500")}>
              {language === 'vi' ? 'Thanh toán hàng tháng' : 'Billed Monthly'}
            </span>
            <button
              onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-12 h-6 rounded-full bg-slate-800 border border-slate-700 transition duration-300 focus:outline-none"
              aria-label="Toggle billing period"
            >
              <span 
                className={cn(
                  "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-emerald-400 transition-all duration-300 shadow",
                  billingPeriod === 'yearly' ? "left-6.5" : "left-0.5"
                )}
              />
            </button>
            <span className={cn("text-xs font-semibold transition-colors flex items-center gap-1.5", billingPeriod === 'yearly' ? "text-white" : "text-slate-500")}>
              <span>{language === 'vi' ? 'Thanh toán hàng năm' : 'Billed Annually'}</span>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400 font-bold uppercase tracking-wider">
                {t('billing.plans.save_20') || '-20%'}
              </span>
            </span>
          </div>
        </div>

        {/* 3 Price Cards */}
        <div className="grid gap-6 md:grid-cols-3 items-stretch max-w-5xl mx-auto pt-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 relative text-left',
                plan.popular
                  ? 'border-emerald-500 bg-slate-950/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-border-glow scale-[1.03] z-10'
                  : 'border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-950/60'
              )}
            >
              {plan.popular && (
                <span className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-emerald-500 text-slate-950 px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow">
                  {t('landing.pricing.popular') || 'Popular'}
                </span>
              )}
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {plan.name}
                    {plan.popular && <Sparkles size={16} className="text-emerald-400 animate-pulse" />}
                  </h3>
                  <p className="text-xs text-slate-500 font-light mt-1.5 leading-relaxed">{plan.desc}</p>
                </div>
                
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-5xl font-extrabold text-white font-mono">${plan.price}</span>
                  <span className="text-xs text-slate-500 font-medium font-sans">
                    /{billingPeriod === 'monthly' ? (language === 'vi' ? 'tháng' : 'mo') : (language === 'vi' ? 'tháng (hàng năm)' : 'mo (annually)')}
                  </span>
                </div>

                <hr className="border-slate-900" />

                <ul className="space-y-3 pt-2 text-xs text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                {plan.ctaVariant === 'primary' ? (
                  <button 
                    onClick={() => navigate('/register')}
                    className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1.5"
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate(plan.name === 'Pro' ? '/contact' : '/register')}
                    className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-slate-200 text-xs font-semibold transition flex items-center justify-center"
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table (Collapse/Bonus info) */}
        <div className="max-w-4xl mx-auto pt-10 text-center">
          <p className="text-xs text-slate-500">
            {language === 'vi'
              ? 'Mọi gói dịch vụ đều được cam kết bảo mật SOC2. Cần cấu hình riêng? '
              : 'All plans include strict SOC2 database isolation. Need something customized? '}
            <Link to="/contact" className="text-emerald-400 hover:text-emerald-300 font-semibold underline">
              {language === 'vi' ? 'Liên hệ với chúng tôi' : 'Get in touch with us'}
            </Link>
          </p>
        </div>

      </div>

      {/* 3. FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-600 z-10 relative">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-light">
          <p>© 2026 WiseBot Inc. All rights reserved.</p>
          <p className="flex items-center gap-1 justify-center">
            <span>Powered by WiseBot Billing System</span>
            <span className="text-red-500">❤️</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
