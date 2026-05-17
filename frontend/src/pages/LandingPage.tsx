import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';
import { 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Shield, 
  Globe, 
  MessageSquare, 
  Database, 
  BarChart3,
  Star,
  ChevronRight,
  Github,
  Twitter,
  Linkedin,
  Menu,
  X,
  FileText,
  Settings,
  Code,
  Paperclip,
  Send,
  Bot
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CustomRobotLogo } from '../components/Logo';

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  return (
    <div className="min-h-screen bg-[#000000] selection:bg-[#ff801f] selection:text-[#ffffff]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-[#000000]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.3)] z-50">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Logo />
          
          <div className="hidden lg:flex items-center gap-8">
            {[
              { label: t('landing.nav.features'), id: 'features' },
              { label: t('landing.nav.how_it_works'), id: 'how-it-works' },
              { label: t('landing.nav.pricing'), id: 'pricing' },
              { label: t('landing.nav.docs'), id: 'docs' }
            ].map((item) => (
              <a key={item.id} href={`#${item.id}`} className="text-[14px] font-display font-medium tracking-[0.35px] text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/login" className="text-[14px] font-display font-medium tracking-[0.35px] text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">{t('auth.register.login')}</Link>
            <Link to="/register" className="bg-[#ffffff] text-[#000000] px-[16px] py-[6px] rounded-full text-[14px] font-semibold hover:bg-[#f0f0f0] transition-all">
              {t('landing.get_started')}
            </Link>
            <div className="w-px h-4 bg-[rgba(255,255,255,0.3)] mx-1" />
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-display font-medium tracking-[0.35px] text-[#a1a4a5] hover:text-[#f0f0f0] rounded-full hover:bg-[rgba(255,255,255,0.05)] transition-all"
              title={language === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
            >
              <Globe size={14} className="text-[#a1a4a5]" />
              <span>{language}</span>
            </button>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-[#f0f0f0] hover:text-[#ffffff] transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-[#000000] border-b border-[rgba(255,255,255,0.3)] p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col gap-4">
              {[
                { label: t('landing.nav.features'), id: 'features' },
                { label: t('landing.nav.how_it_works'), id: 'how-it-works' },
                { label: t('landing.nav.pricing'), id: 'pricing' },
                { label: t('landing.nav.docs'), id: 'docs' }
              ].map((item) => (
                <a 
                  key={item.id} 
                  href={`#${item.id}`} 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[14px] font-display font-medium tracking-[0.35px] text-[#f0f0f0]"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="pt-6 border-t border-[rgba(255,255,255,0.3)] flex flex-col gap-4">
              <button 
                onClick={toggleLanguage}
                className="flex items-center justify-between px-4 py-3 rounded-md bg-[rgba(255,255,255,0.05)] text-[14px] font-display font-medium tracking-[0.35px] text-[#f0f0f0]"
              >
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-[#f0f0f0]" />
                  <span>{language === 'en' ? 'Language' : 'Ngôn ngữ'}</span>
                </div>
                <span className="text-[#3b9eff] font-bold">{language === 'en' ? 'EN' : 'VI'}</span>
              </button>
              <Link to="/login" className="text-center py-3 text-[14px] font-display font-medium tracking-[0.35px] text-[#f0f0f0]">{t('auth.register.login')}</Link>
              <Link to="/register" className="text-center py-3 bg-[#ffffff] text-[#000000] rounded-full text-[14px] font-semibold">
                {t('landing.get_started')}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 relative overflow-hidden bg-[#000000]">
        {/* Subtle warm glow behind hero */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#ff801f] opacity-[0.03] blur-[120px] pointer-events-none rounded-full"></div>
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[400px] bg-[#3b9eff] opacity-[0.02] blur-[100px] pointer-events-none rounded-full"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left Column: Text Content */}
            <div className="space-y-10 text-left">
              <h1 className="text-[76px] lg:text-[96px] font-serif font-normal text-[#f0f0f0] leading-[1] tracking-[-0.96px]">
                {t('landing.hero.title_1')} <br/><span className="text-[#a1a4a5] italic">{t('landing.hero.title_2')}</span>
              </h1>
              
              <p className="text-[18px] font-sans text-[#a1a4a5] max-w-xl leading-[1.5]">
                {t('landing.hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Link to="/register" className="w-full sm:w-auto bg-[#ffffff] text-[#000000] px-[24px] py-[12px] rounded-full text-[16px] font-semibold hover:bg-[#f0f0f0] transition-colors flex items-center justify-center gap-2">
                  {t('landing.hero.start')}
                </Link>
                <button className="w-full sm:w-auto px-[24px] py-[12px] rounded-full text-[16px] font-medium text-[#f0f0f0] bg-transparent border border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  {t('landing.hero.demo')}
                </button>
              </div>

              <div className="pt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  <img src="https://picsum.photos/seed/user1/100/100" alt="User" className="w-12 h-12 rounded-full border-2 border-[#000000] object-cover" referrerPolicy="no-referrer" />
                  <img src="https://picsum.photos/seed/user2/100/100" alt="User" className="w-12 h-12 rounded-full border-2 border-[#000000] object-cover" referrerPolicy="no-referrer" />
                  <img src="https://picsum.photos/seed/user3/100/100" alt="User" className="w-12 h-12 rounded-full border-2 border-[#000000] object-cover" referrerPolicy="no-referrer" />
                </div>
                <p className="text-[14px] uppercase tracking-[0.5px] text-[#a1a4a5] font-semibold">{t('landing.hero.social_proof')}</p>
              </div>
            </div>

            {/* Right Column: Chat Mockup */}
            <div className="relative isolate transform perspective-1000">
              
              <div className="relative bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] overflow-hidden flex flex-col h-[600px] z-10 transform -rotate-2 hover:rotate-0 transition-transform duration-700 ease-out origin-bottom shadow-md shadow-black/40">
                {/* Header */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-[rgba(255,255,255,0.3)] bg-[#000000]">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border border-[rgba(255,255,255,0.3)] flex items-center justify-center">
                      <CustomRobotLogo size={24} className="text-[#f0f0f0]" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#11ff99] border-2 border-[#000000] rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#f0f0f0]">WiseBot</h3>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-[#a1a4a5]">Active Now</p>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-6 space-y-8 overflow-y-auto bg-[rgba(255,255,255,0.02)]">
                  <div className="text-center">
                    <span className="text-[12px] font-semibold text-[#a1a4a5] uppercase tracking-[0.5px]">Today, 10:24 AM</span>
                  </div>

                  {/* Bot Message */}
                  <div className="flex items-end gap-3">
                    <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] px-5 py-4 rounded-[16px] rounded-bl-[4px] text-[16px] font-normal leading-relaxed max-w-[85%]">
                      {t('landing.hero.mockup.bot_1')}
                    </div>
                  </div>

                  {/* User Message */}
                  <div className="flex items-end justify-end gap-3">
                    <div className="bg-[#f0f0f0] text-[#000000] px-5 py-4 rounded-[16px] rounded-br-[4px] text-[16px] font-normal leading-relaxed max-w-[85%]">
                      {t('landing.hero.mockup.user')}
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  <div className="flex items-end gap-3">
                    <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] px-5 py-5 rounded-[16px] rounded-bl-[4px] flex items-center gap-1.5 w-fit">
                      <div className="w-1.5 h-1.5 bg-[#a1a4a5] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-[#a1a4a5] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-[#a1a4a5] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-5 bg-[#000000]">
                  <div className="flex items-center gap-2 px-2 py-1.5 border border-[rgba(255,255,255,0.3)] focus-within:border-[rgba(255,255,255,0.2)] rounded-full bg-[rgba(255,255,255,0.02)] transition-colors">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)] transition-colors shrink-0">
                      <Paperclip size={20} />
                    </button>
                    <div className="flex-1 flex items-center px-2">
                      <span className="text-[#a1a4a5] text-[16px] font-normal">{t('landing.hero.mockup.input')}</span>
                    </div>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.05)] transition-colors shrink-0">
                      <Send size={18} className="translate-x-[1px]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-[#000000] px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-24 relative z-10">
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-[56px] font-display font-medium text-[#f0f0f0] tracking-[-2.8px] leading-[1.2]">
              {t('landing.features.title')}
            </h2>
            <p className="text-[18px] text-[#a1a4a5] leading-[1.5]">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: t('landing.features.f1.title'), desc: t('landing.features.f1.desc'), icon: Database, color: 'text-[#ff801f]' },
              { title: t('landing.features.f2.title'), desc: t('landing.features.f2.desc'), icon: Code, color: 'text-[#11ff99]' },
              { title: t('landing.features.f3.title'), desc: t('landing.features.f3.desc'), icon: BarChart3, color: 'text-[#3b9eff]' },
              { title: t('landing.features.f4.title'), desc: t('landing.features.f4.desc'), icon: Globe, color: 'text-[#ffc53d]' },
            ].map((feature, i) => (
              <div 
                key={feature.title}
                className="group border-[rgba(255,255,255,0.3)] rounded-[16px] bg-[#000000] p-8 flex flex-col hover:border-[rgba(255,255,255,0.4)] transition-colors shadow-md shadow-black/40 border"
              >
                <div className={cn("w-12 h-12 rounded-[8px] border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.02)] flex items-center justify-center mb-8 transition-colors duration-300 border", feature.color)}>
                  <feature.icon size={20} className="w-5 h-5 opacity-90" />
                </div>
                <h3 className="font-sans text-[20px] font-semibold text-[#f0f0f0] mb-4">{feature.title}</h3>
                <p className="text-[16px] text-[#a1a4a5] leading-[1.5] flex-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 bg-[#000000] px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-24 relative z-10">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <h2 className="text-[56px] font-display font-medium text-[#f0f0f0] tracking-[-2.8px] leading-[1.2]">{t('landing.how.title')}</h2>
            <p className="text-[18px] text-[#a1a4a5]">
              {t('landing.how.subtitle')}
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {[
                { step: '1', title: t('landing.how.step1.title'), desc: t('landing.how.step1.desc'), icon: FileText, color: 'text-[#ff801f]', accent: 'bg-[#ff801f]' },
                { step: '2', title: t('landing.how.step2.title'), desc: t('landing.how.step2.desc'), icon: Settings, color: 'text-[#3b9eff]', accent: 'bg-[#3b9eff]' },
                { step: '3', title: t('landing.how.step3.title'), desc: t('landing.how.step3.desc'), icon: Code, color: 'text-[#11ff99]', accent: 'bg-[#11ff99]' },
              ].map((item) => (
                <div 
                  key={item.step}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className={cn("w-[88px] h-[88px] rounded-[16px] border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.02)] flex items-center justify-center mb-8 relative z-10 shadow-md shadow-black/40", item.color)}>
                    <item.icon size={32} strokeWidth={1.5} />
                    
                    {/* Step Number Badge */}
                    <div className={cn("absolute -top-3 -right-3 w-8 h-8 rounded-full text-[#ffffff] flex items-center justify-center text-[14px] font-bold shadow-md shadow-black/40", item.accent)}>
                      {item.step}
                    </div>
                  </div>

                  <h3 className="font-sans text-[20px] font-semibold text-[#f0f0f0] mb-4">{item.title}</h3>
                  <p className="text-[16px] text-[#a1a4a5] leading-[1.5] max-w-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-[#000000] relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <h2 className="text-[56px] font-display font-medium text-[#f0f0f0] tracking-[-2.8px] leading-[1.2]">{t('landing.pricing.title')}</h2>
            <p className="text-[18px] text-[#a1a4a5]">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex items-center p-1 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.3)] rounded-full">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  "px-6 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-200",
                  billingCycle === 'monthly' 
                    ? "bg-[#ffffff] text-[#000000] border border-transparent shadow-md shadow-black/40" 
                    : "text-[#a1a4a5] hover:text-[#f0f0f0] border border-transparent"
                )}
              >
                {t('billing.plans.monthly')}
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  "px-6 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-200 flex items-center gap-2",
                  billingCycle === 'yearly' 
                    ? "bg-[#ffffff] text-[#000000] border border-transparent shadow-md shadow-black/40" 
                    : "text-[#a1a4a5] hover:text-[#f0f0f0] border border-transparent"
                )}
              >
                {t('billing.plans.yearly')}
                <span className={billingCycle === 'yearly' ? 'text-[#ff801f]' : 'text-[#ff801f]'}>*</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {[
              { 
                id: 'free',
                name: t('landing.pricing.free.name'), 
                price: '0', 
                features: [
                  'billing.plans.free.f1',
                  'billing.plans.free.f2',
                  'billing.plans.free.f3',
                  'billing.plans.free.f4',
                  'billing.plans.free.f5'
                ] 
              },
              { 
                id: 'plus',
                name: t('landing.pricing.plus.name'), 
                price: '19', 
                features: [
                  'billing.plans.plus.f1',
                  'billing.plans.plus.f2',
                  'billing.plans.plus.f3',
                  'billing.plans.plus.f4',
                  'billing.plans.plus.f5',
                  'billing.plans.plus.f6'
                ],
                popular: true
              },
              { 
                id: 'pro',
                name: t('landing.pricing.pro.name'), 
                price: '49', 
                features: [
                  'billing.plans.pro.f1',
                  'billing.plans.pro.f2',
                  'billing.plans.pro.f3',
                  'billing.plans.pro.f4',
                  'billing.plans.pro.f5',
                  'billing.plans.pro.f6',
                  'billing.plans.pro.f7'
                ]
              },
            ].map((plan, i) => (
              <div 
                key={plan.name}
                className={cn(
                  "p-10 rounded-[16px] transition-all duration-300 relative flex flex-col h-full text-left bg-[#000000] shadow-md shadow-black/40 border",
                  plan.popular 
                    ? "border-[#f0f0f0] z-10" 
                    : "border-[rgba(255,255,255,0.3)] hover:border-[rgba(255,255,255,0.4)]"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#ffffff] text-[#000000] px-4 py-1.5 rounded-full text-[12px] uppercase tracking-[0.5px] font-semibold shadow-md shadow-black/40">
                    {t('landing.pricing.popular')}
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="font-sans text-[20px] font-semibold text-[#f0f0f0] mb-6">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[56px] font-display font-medium leading-[1] tracking-[-2.8px] text-[#f0f0f0]">
                      ${billingCycle === 'yearly' ? Math.floor(parseInt(plan.price) * 0.8) : plan.price}
                    </span>
                    <span className="text-[#a1a4a5] font-medium text-[16px]">/mo</span>
                  </div>
                  <p className="text-[14px] text-[#a1a4a5] mt-2 font-medium">
                    {t('billing.plans.billed')} {billingCycle === 'yearly' ? t('billing.plans.yearly') : t('billing.plans.monthly')}
                  </p>
                </div>
                
                <button 
                  onClick={() => navigate('/register', { state: { selectedPlanId: plan.id } })}
                  className={cn(
                    "w-full py-[16px] px-[24px] text-[14px] font-semibold transition-all duration-300 mb-10 bg-transparent rounded-[8px] text-[#f0f0f0] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40",
                    plan.popular 
                      ? "bg-[#ffffff] text-[#000000] border-transparent hover:bg-[#f0f0f0]" 
                      : "bg-transparent text-[#f0f0f0] border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.05)]"
                  )}
                >
                  {t('landing.get_started')}
                </button>

                <div className="space-y-6 flex-1">
                  <p className="text-[14px] font-semibold uppercase tracking-[0.5px] text-[#f0f0f0]">
                    {t('billing.plans.features')}
                  </p>
                  <ul className="space-y-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[#11ff99]">
                          <CheckCircle2 size={16} strokeWidth={2.5} />
                        </div>
                        <span className="text-[16px] text-[#a1a4a5] font-normal leading-[1.25]">{t(f)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section id="docs" className="py-32 bg-[#000000] px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <h2 className="text-[56px] font-serif font-normal tracking-[-0.96px] text-[#f0f0f0] leading-[1]">{t('landing.docs.title')}</h2>
            <p className="text-[18px] text-[#a1a4a5]">{t('landing.docs.subtitle')}</p>
          </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: t('landing.docs.quickstart'), desc: t('landing.docs.quickstart.desc'), icon: Zap, color: 'text-[#ffc53d]' },
              { title: t('landing.docs.api'), desc: t('landing.docs.api.desc'), icon: Database, color: 'text-[#ff801f]' },
              { title: t('landing.docs.sdks'), desc: t('landing.docs.sdks.desc'), icon: Globe, color: 'text-[#3b9eff]' },
              { title: t('landing.docs.webhooks'), desc: t('landing.docs.webhooks.desc'), icon: MessageSquare, color: 'text-[#11ff99]' }
            ].map((doc) => (
              <a key={doc.title} href="#" className="group pt-8 border-t border-t-[rgba(255,255,255,0.3)] hover:border-t-[rgba(255,255,255,0.4)] transition-colors flex flex-col h-full">
                <div className={cn("w-12 h-12 rounded-[8px] border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.02)] flex items-center justify-center mb-6 text-[#f0f0f0] group-hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-300", doc.color)}>
                  <doc.icon size={20} strokeWidth={2} />
                </div>
                <h3 className="text-[20px] font-sans font-semibold text-[#f0f0f0] mb-4">{doc.title}</h3>
                <p className="text-[16px] text-[#a1a4a5] font-normal leading-relaxed flex-1">{doc.desc}</p>
                <div className="mt-8 flex items-center gap-2 text-[14px] uppercase tracking-[0.5px] font-semibold text-[#f0f0f0] group-hover:gap-4 transition-all opacity-80 group-hover:opacity-100">
                  Read more <ArrowRight size={14} />
                </div>
              </a>
            ))}
          </div>

          <div className="text-center pt-12">
            <button className="px-[24px] py-[12px] bg-transparent border border-[rgba(255,255,255,0.3)] text-[#f0f0f0] text-[14px] font-semibold rounded-full hover:bg-[rgba(255,255,255,0.05)] transition-all">
              {t('landing.docs.view_all')}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#000000] text-[#a1a4a5] py-24 px-6 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="space-y-8">
            <Logo theme="dark" />
            <p className="text-[16px] font-normal leading-[1.5] text-[#a1a4a5] max-w-sm">
              {t('landing.footer.tagline')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.3)] flex items-center justify-center text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f0f0f0] transition-colors"><Twitter size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.3)] flex items-center justify-center text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f0f0f0] transition-colors"><Github size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.3)] flex items-center justify-center text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f0f0f0] transition-colors"><Linkedin size={18} /></a>
            </div>
          </div>

          {[
            { 
              title: t('landing.footer.product'), 
              links: [
                { label: t('landing.footer.links.features'), href: '#features' },
                { label: t('landing.footer.links.pricing'), href: '#pricing' },
                { label: t('landing.footer.links.docs'), href: '#' },
                { label: t('landing.footer.links.api'), href: '#' }
              ] 
            },
            { 
              title: t('landing.footer.company'), 
              links: [
                { label: t('landing.footer.links.about'), href: '#' },
                { label: t('landing.footer.links.careers'), href: '#' },
                { label: t('landing.footer.links.blog'), href: '#' },
                { label: t('landing.footer.links.contact'), href: '#' }
              ] 
            },
            { 
              title: t('landing.footer.legal'), 
              links: [
                { label: t('landing.footer.links.privacy'), href: '#' },
                { label: t('landing.footer.links.terms'), href: '#' },
                { label: t('landing.footer.links.cookie'), href: '#' },
                { label: t('landing.footer.links.security'), href: '#' }
              ] 
            },
          ].map((col) => (
            <div key={col.title} className="space-y-8">
              <h4 className="text-[14px] font-sans font-medium text-[#f0f0f0]">{col.title}</h4>
              <ul className="space-y-5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[16px] font-normal text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-[rgba(255,255,255,0.3)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[14px] text-[#a1a4a5] font-normal">{t('landing.footer.rights')}</p>
          <div className="flex items-center gap-2 text-[14px] text-[#a1a4a5] font-normal">
            <span>{t('landing.footer.made_with')}</span>
            <Star size={12} className="text-[#3b9eff] fill-[#3b9eff]" />
            <span>{t('landing.footer.by_team')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
