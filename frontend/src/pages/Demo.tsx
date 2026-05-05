import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronLeft, Globe, Shield, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import ChatWidget from '../components/ChatWidget';

export default function Demo() {
  const { t } = useLanguage();

  const [publishedSettings] = React.useState(() => {
    const saved = localStorage.getItem('wisebot_widget_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved settings', e);
      }
    }
    return {
      primaryColor: '#2563EB',
      botName: 'WiseBot Assistant',
      welcomeMsg: 'Hello! How can I help you today?',
      selectedIconId: 'bot',
      iconColor: '#ffffff',
      customIconUrl: null,
      position: 'right' as const
    };
  });

  return (
    <div className="min-h-screen bg-[rgba(255,255,255,0.02)] font-sans text-[#f0f0f0] relative selection:bg-primary/20">
      {}
      <header className="bg-[#000000]/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.3)] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link to="/customization" className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-[16px] transition-colors text-[#3b9eff] group">
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="px-2 py-1 bg-[rgba(59,158,255,0.1)] text-[#3b9eff] text-[10px] font-black uppercase tracking-widest rounded-md">{t('demo.mode')}</div>
            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
            <h1 className="text-sm font-bold text-[#a1a4a5] hidden sm:block">{t('demo.title')}</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#a1a4a5] uppercase tracking-widest">
            <span className="hover:text-[#f0f0f0] cursor-pointer transition-colors">{t('demo.nav.product')}</span>
            <span className="hover:text-[#f0f0f0] cursor-pointer transition-colors">{t('demo.nav.solutions')}</span>
            <span className="hover:text-[#f0f0f0] cursor-pointer transition-colors">{t('demo.nav.pricing')}</span>
          </nav>
          <Logo size="sm" />
        </div>
      </header>

      {}
      <main className="max-w-6xl mx-auto py-24 px-6 space-y-32">
        {}
        <section className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-full shadow-md shadow-black/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#a1a4a5]">{t('demo.hero.badge')}</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-[#f0f0f0]">
            {t('demo.hero.title_1')} <br />
            <span className="text-[#3b9eff]">{t('demo.hero.title_2')}</span>
          </h2>
          <p className="text-xl text-[#a1a4a5] max-w-2xl mx-auto leading-relaxed">
            {t('demo.hero.desc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button className="w-full sm:w-auto px-10 py-4 bg-[#ffffff] text-[#000000] font-bold rounded-[16px] shadow-2xl shadow-primary/30 hover:scale-105 hover:shadow-primary/40 active:scale-95 transition-all">
              {t('demo.hero.cta_primary')}
            </button>
            <button className="w-full sm:w-auto px-10 py-4 bg-[#000000] border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] font-bold rounded-[16px] hover:bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.3)] active:scale-95 transition-all">
              {t('demo.hero.cta_secondary')}
            </button>
          </div>
        </section>

        {}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: t('demo.feature.1.title'), desc: t('demo.feature.1.desc') },
            { icon: Shield, title: t('demo.feature.2.title'), desc: t('demo.feature.2.desc') },
            { icon: Globe, title: t('demo.feature.3.title'), desc: t('demo.feature.3.desc') }
          ].map((feature, i) => (
            <div key={i} className="bg-[#000000] p-10 rounded-[32px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-[rgba(59,158,255,0.1)] text-[#3b9eff] rounded-[16px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <feature.icon size={28} />
              </div>
              <h3 className="text-[24px] font-display font-medium tracking-tight mb-3 text-[#f0f0f0]">{feature.title}</h3>
              <p className="text-[#a1a4a5] text-base leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {}
        <section className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-[#f0f0f0]">Trusted by Industry Leaders</h2>
            <p className="text-[#a1a4a5] max-w-2xl mx-auto">See how WiseBot is helping companies around the world deliver exceptional customer support.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((id) => (
              <div key={id} className="bg-[#000000] p-8 rounded-[32px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} className="fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-lg font-medium leading-relaxed text-[#f0f0f0] italic mb-8">
                    {t(`demo.testimonial.${id}.text`)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <img 
                    src={`https://picsum.photos/seed/user${id}/100/100`} 
                    className="w-12 h-12 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40" 
                    alt="User" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#f0f0f0]">{t(`demo.testimonial.${id}.author`)}</p>
                    <p className="text-[10px] font-bold text-[#3b9eff] uppercase tracking-widest">{t(`demo.testimonial.${id}.role`)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {}
        <section className="text-center py-20 space-y-8">
          <h2 className="text-4xl font-bold text-[#f0f0f0]">{t('demo.cta.title')}</h2>
          <p className="text-[#a1a4a5] max-w-xl mx-auto">{t('demo.cta.desc')}</p>
          <button className="px-12 py-5 bg-slate-900 text-white font-bold rounded-[16px] hover:bg-slate-800 transition-all shadow-xl">
            {t('demo.cta.button')}
          </button>
        </section>
      </main>

      {}
      <ChatWidget 
        {...publishedSettings}
        isDemo={true}
      />

      {}
      <footer className="py-16 border-t border-[rgba(255,255,255,0.3)] bg-[#000000]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <Logo size="sm" />
          <div className="flex gap-8 text-xs font-bold text-[#a1a4a5] uppercase tracking-widest">
            <span className="hover:text-[#f0f0f0] cursor-pointer transition-colors">{t('demo.footer.privacy')}</span>
            <span className="hover:text-[#f0f0f0] cursor-pointer transition-colors">{t('demo.footer.terms')}</span>
            <span className="hover:text-[#f0f0f0] cursor-pointer transition-colors">{t('demo.footer.contact')}</span>
          </div>
          <p className="text-[#a1a4a5] text-xs font-medium">
            {t('demo.footer.copy')}
          </p>
        </div>
      </footer>
    </div>
  );
}
