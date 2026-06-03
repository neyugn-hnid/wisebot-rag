import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Code2,
  Database,
  Github,
  Globe,
  GraduationCap,
  Headphones,
  Linkedin,
  Menu,
  ShieldCheck,
  Sparkles,
  Star,
  TerminalSquare,
  Twitter,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
const MINT = '#00D4A4';

const logoItems = [
  { name: 'React', bg: 'bg-[#ecfeff]', text: 'text-[#0891b2]', border: 'border-[#a5f3fc]' },
  { name: 'TypeScript', bg: 'bg-[#eff6ff]', text: 'text-[#2563eb]', border: 'border-[#bfdbfe]' },
  { name: 'Vite', bg: 'bg-[#f5f3ff]', text: 'text-[#7c3aed]', border: 'border-[#ddd6fe]' },
  { name: 'Tailwind CSS', bg: 'bg-[#f0fdfa]', text: 'text-[#0f766e]', border: 'border-[#99f6e4]' },
  { name: 'Spring Boot', bg: 'bg-[#f0fdf4]', text: 'text-[#16a34a]', border: 'border-[#bbf7d0]' },
  { name: 'FastAPI', bg: 'bg-[#ecfdf5]', text: 'text-[#059669]', border: 'border-[#a7f3d0]' },
  { name: 'PostgreSQL', bg: 'bg-[#eef2ff]', text: 'text-[#4f46e5]', border: 'border-[#c7d2fe]' },
  { name: 'Qdrant', bg: 'bg-[#fdf2f8]', text: 'text-[#db2777]', border: 'border-[#fbcfe8]' },
  { name: 'Ollama', bg: 'bg-[#f8fafc]', text: 'text-[#111111]', border: 'border-[#e2e8f0]' },
  { name: 'Docker', bg: 'bg-[#eff6ff]', text: 'text-[#1d4ed8]', border: 'border-[#bfdbfe]' }
];

function Button({
  children,
  variant = 'primary',
  className = '',
  onClick
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'mint' | 'secondary';
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium leading-[1.3] transition active:scale-[0.98]',
        variant === 'primary' && 'bg-[#111111] text-white hover:bg-[#2b2b2b]',
        variant === 'mint' && 'bg-[#00D4A4] text-[#111111] hover:bg-[#00bd92]',
        variant === 'secondary' && 'border border-[#e5e7eb] bg-white text-[#111111] hover:bg-[#f7f7f7]',
        className
      )}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center rounded-full border border-[#e5e7eb] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280]">
      {children}
    </div>
  );
}

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  const goRegister = () => {
    navigate('/register');
  };

  const navItems = [
    { label: t('landing.nav.features'), href: '#features' },
    { label: t('landing.use_cases.label'), href: '#use-cases' },
    { label: t('landing.nav.docs'), href: '#docs' }
  ];

  const useCases = [
    {
      icon: Headphones,
      title: t('landing.use_cases.support.title'),
      desc: t('landing.use_cases.support.desc')
    },
    {
      icon: GraduationCap,
      title: t('landing.use_cases.education.title'),
      desc: t('landing.use_cases.education.desc')
    },
    {
      icon: Building2,
      title: t('landing.use_cases.internal.title'),
      desc: t('landing.use_cases.internal.desc')
    }
  ];

  const features = [
    {
      icon: Database,
      title: t('landing.features.private_kb.title'),
      desc: t('landing.features.private_kb.desc')
    },
    {
      icon: ShieldCheck,
      title: t('landing.features.cited_answers.title'),
      desc: t('landing.features.cited_answers.desc')
    },
    {
      icon: Code2,
      title: t('landing.features.widget_new.title'),
      desc: t('landing.features.widget_new.desc')
    },
    {
      icon: TerminalSquare,
      title: t('landing.features.api_logs.title'),
      desc: t('landing.features.api_logs.desc')
    }
  ];

  const heroTitle = {
    primary: language === 'vi' ? 'Xây dựng Chatbot AI của bạn' : 'Build Your AI Chatbot',
    secondary: language === 'vi' ? 'trong vài phút' : 'in Minutes'
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] [font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]">
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/85 backdrop-blur-xl">
        <div className="relative mx-auto flex h-18 max-w-[1280px] items-center justify-between px-5 py-3 lg:px-8">
          <button onClick={() => navigate('/')} className="shrink-0" aria-label="WiseBot home">
            <Logo />
          </button>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#64748b] transition hover:bg-[#f8fafc] hover:text-[#111111]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#64748b] transition hover:bg-[#f8fafc] hover:text-[#111111]"
              title={language === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
            >
              <Globe size={15} />
              {language.toUpperCase()}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#64748b] transition hover:bg-[#f8fafc] hover:text-[#111111]"
            >
              {t('auth.register.login')}
            </button>
            <Button onClick={goRegister} variant="primary" className="px-5">
              {t('landing.get_started')}
            </Button>
          </div>

          <button
            onClick={() => setIsMenuOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] lg:hidden"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-[#eef0f2] bg-white px-5 py-4 shadow-[0_24px_40px_rgba(15,23,42,0.08)] lg:hidden">
            <div className="flex flex-col gap-1 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-[#64748b] hover:bg-white hover:text-[#111111]"
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={toggleLanguage}
                className="rounded-xl px-3 py-3 text-left text-sm font-medium text-[#64748b] hover:bg-white hover:text-[#111111]"
              >
                {language === 'vi' ? 'English' : 'Tiếng Việt'}
              </button>
              <button
                onClick={() => navigate('/login')}
                className="rounded-xl px-3 py-3 text-left text-sm font-medium text-[#64748b] hover:bg-white hover:text-[#111111]"
              >
                {t('auth.register.login')}
              </button>
              <button
                onClick={goRegister}
                className="mt-2 rounded-full bg-[#111111] px-5 py-3 text-sm font-medium text-white"
              >
                {t('landing.get_started')}
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#e7f8ff_0%,#f8fbf8_48%,#ffffff_100%)] px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="pointer-events-none absolute inset-x-0 top-14 mx-auto h-[300px] max-w-[920px] rounded-full bg-white/50 blur-3xl" />
          <div className="pointer-events-none absolute left-[8%] top-24 h-24 w-48 rounded-full bg-[#00D4A4]/10 blur-2xl" />
          <div className="pointer-events-none absolute right-[10%] top-36 h-20 w-56 rounded-full bg-[#60a5fa]/15 blur-2xl" />

          <div className="relative mx-auto max-w-[1120px] text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-sm font-medium text-[#111111] shadow-sm ring-1 ring-black/5">
              <Sparkles size={15} color={MINT} />
              {t('landing.hero.badge_new')}
            </div>

            <h1 className="mx-auto max-w-[980px] text-[40px] font-semibold leading-[1.08] tracking-[-1px] text-[#111111] sm:text-[56px] lg:text-[70px] lg:tracking-[-1.8px]">
              <span className="block">{heroTitle.primary}</span>
              <span className="block text-[#047857]">{heroTitle.secondary}</span>
            </h1>

            <p className="mx-auto mt-5 max-w-[720px] text-[17px] font-normal leading-[1.55] text-[#4b5563] sm:text-[18px]">
              {t('landing.hero.subtitle')}
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button onClick={goRegister} variant="mint" className="px-6 py-3 shadow-[0_12px_30px_rgba(0,212,164,0.24)]">
                {t('landing.get_started')}
                <ArrowRight size={16} />
              </Button>
              <Button variant="secondary" className="px-6 py-3 shadow-sm">{t('landing.hero.talk')}</Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-[#4b5563]">
              {[t('landing.hero.no_credit_card'), t('landing.hero.setup_minutes'), t('landing.hero.citations_included')].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={15} color={MINT} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#eef0f2] bg-white py-7">
          <style>{`
            @keyframes wisebot-marquee {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
          `}</style>

          <div className="relative mx-auto max-w-[1280px] overflow-hidden px-5 lg:px-8">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-white to-transparent" />

            <div className="flex w-max items-center gap-10 whitespace-nowrap [animation:wisebot-marquee_24s_linear_infinite] hover:[animation-play-state:paused]">
              {[...logoItems, ...logoItems].map((logo, index) => (
                <div
                  key={`${logo.name}-${index}`}
                  className={cn(
                    'flex min-w-[140px] items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                    logo.bg,
                    logo.text,
                    logo.border
                  )}
                >
                  {logo.name}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="use-cases" className="border-y border-[#eef0f2] bg-[#fbfcfd] px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-12 grid gap-6 lg:grid-cols-[0.8fr_1fr] lg:items-end">
              <div>
                <SectionLabel>{t('landing.use_cases.label')}</SectionLabel>
                <h2 className="max-w-[580px] text-[38px] font-semibold leading-[1.1] tracking-[-1px] text-[#111111] sm:text-[50px] sm:tracking-[-1.4px]">
                  {t('landing.use_cases.title')}
                </h2>
              </div>
              <p className="max-w-[560px] text-[16px] leading-[1.7] text-[#4b5563] lg:justify-self-end">
                {t('landing.use_cases.subtitle')}
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-[#e5e7eb] md:grid-cols-3">
              {useCases.map((item) => (
                <div
                  key={item.title}
                  className="group bg-white p-7 transition hover:bg-[#fcfffd]"
                >
                  <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl border border-[#e5e7eb] bg-[#f8fafc] text-[#111111] transition group-hover:border-[#00D4A4] group-hover:text-[#047857]">
                    <item.icon size={22} />
                  </div>
                  <h3 className="text-[20px] font-semibold leading-[1.35] tracking-[-0.2px] text-[#111111]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-[1.65] text-[#6b7280]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-white px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-[1180px]">
            <div className="mx-auto mb-14 max-w-[760px] text-center">
              <SectionLabel>{t('landing.nav.features')}</SectionLabel>
              <h2 className="text-[38px] font-semibold leading-[1.1] tracking-[-1px] text-[#111111] sm:text-[52px] sm:tracking-[-1.4px]">
                {t('landing.features.reliable_title')}
              </h2>
              <p className="mt-5 text-[16px] leading-[1.7] text-[#4b5563]">
                {t('landing.features.reliable_subtitle')}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={cn(
                    'rounded-[20px] border p-7 transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.07)]',
                    index === 0 && 'border-[#bbf7d0] bg-[#f0fdf4]',
                    index === 1 && 'border-[#bfdbfe] bg-[#eff6ff]',
                    index === 2 && 'border-[#fed7aa] bg-[#fff7ed]',
                    index === 3 && 'border-[#e5e7eb] bg-[#fafafa]'
                  )}
                >
                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#111111] shadow-sm ring-1 ring-black/5">
                      <feature.icon size={23} />
                    </div>
                    <div>
                      <h3 className="text-[20px] font-semibold leading-[1.35] tracking-[-0.2px] text-[#111111]">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-[1.65] text-[#4b5563]">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="docs" className="bg-[#000000] text-[#a1a4a5] py-24 px-6 mt-auto">
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
            }
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
