import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Check,
  ChevronRight,
  Code2,
  Database,
  FileText,
  Github,
  Globe,
  Headphones,
  Linkedin,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Twitter,
  X,
  Layers,
  Cpu,
  Server,
  Terminal,
  Upload,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  FileCode,
  ArrowUpRight,
  Eye
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const techStack = [
  { name: 'React', descKey: 'landing.showcase.tech.react_desc', color: 'text-cyan-400 border-cyan-500/20' },
  { name: 'Spring Boot', descKey: 'landing.showcase.tech.spring_desc', color: 'text-emerald-400 border-emerald-500/20' },
  { name: 'FastAPI', descKey: 'landing.showcase.tech.fastapi_desc', color: 'text-teal-400 border-teal-500/20' },
  { name: 'Qdrant', descKey: 'landing.showcase.tech.qdrant_desc', color: 'text-red-400 border-red-500/20' },
  { name: 'PostgreSQL', descKey: 'landing.showcase.tech.postgres_desc', color: 'text-blue-400 border-blue-500/20' },
  { name: 'Docker', descKey: 'landing.showcase.tech.docker_desc', color: 'text-sky-400 border-sky-500/20' }
];

function Button({
  children,
  variant = 'primary',
  className = '',
  onClick
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-lg px-4 sm:px-6 text-center text-sm font-semibold transition-all duration-300 active:scale-[0.97] group overflow-hidden',
        variant === 'primary' && 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.45)]',
        variant === 'secondary' && 'border border-slate-700 bg-slate-900/80 text-slate-200 hover:border-slate-500 hover:bg-slate-800 hover:text-white',
        variant === 'ghost' && 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
        className
      )}
    >
      {/* Light effect reflection on primary hover */}
      {variant === 'primary' && (
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
      )}
      <span className="relative z-10 flex min-w-0 items-center justify-center gap-2">{children}</span>
    </button>
  );
}

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // Sandbox State
  const [sandboxStep, setSandboxStep] = useState<0 | 1 | 2>(0);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestProgress, setIngestProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState(t('landing.showcase.default_question'));
  const [answerOutput, setAnswerOutput] = useState('');
  const [isTypingAnswer, setIsTypingAnswer] = useState(false);
  const [highlightedCitation, setHighlightedCitation] = useState<number | null>(null);

  // Pipeline State
  const [activePipelineTab, setActivePipelineTab] = useState<number>(0);

  // Widget customizer State
  const [widgetThemeColor, setWidgetThemeColor] = useState<'emerald' | 'cyan' | 'indigo'>('emerald');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync state query on language change
  useEffect(() => {
    setSearchQuery(t('landing.showcase.default_question'));
    setAnswerOutput('');
    setSandboxStep(0);
  }, [language]);

  const toggleLanguage = () => setLanguage(language === 'en' ? 'vi' : 'en');
  const goRegister = () => navigate('/register');

  const navItems = [
    { label: t('landing.nav.features'), href: '#features' },
    { label: t('landing.use_cases.label'), href: '#use-cases' },
    { label: t('landing.nav.docs'), href: '/docs' }
  ];

  // Simulation handlers
  const handleRunIngest = () => {
    setIsIngesting(true);
    setIngestProgress(0);
    const interval = setInterval(() => {
      setIngestProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsIngesting(false);
            setSandboxStep(1); // Advance to Step 2
          }, 600);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const handleRunSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setSandboxStep(2); // Advance to Step 3
      triggerTypewriter();
    }, 1200);
  };

  const triggerTypewriter = () => {
    setIsTypingAnswer(true);
    setAnswerOutput('');
    const fullText = t('landing.showcase.answer_typewriter');
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setAnswerOutput(fullText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTypingAnswer(false);
      }
    }, 20);
  };

  const handleResetSandbox = () => {
    setSandboxStep(0);
    setIngestProgress(0);
    setIsIngesting(false);
    setIsSearching(false);
    setIsTypingAnswer(false);
    setAnswerOutput('');
    setHighlightedCitation(null);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-400 selection:text-slate-950 overflow-x-hidden font-sans relative">
      {/* Global CSS Style tag for Custom advanced animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        
        /* Slow float motions for auroras */
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(45px, 25px) scale(1.15); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-35px, 45px) scale(0.92); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -35px) scale(1.08); }
        }
        
        .animate-float-slow { animation: float-slow 18s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 14s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 11s ease-in-out infinite; }

        /* Animated border tracking */
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(16, 185, 129, 0.2); }
          50% { border-color: rgba(99, 102, 241, 0.6); }
        }
        .animate-border-glow {
          animation: borderGlow 4s ease-in-out infinite;
        }

        /* Running gradient moving text background */
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-text {
          background-size: 200% auto;
          animation: gradientMove 6s ease-in-out infinite;
        }

        /* Flying particle stream */
        @keyframes particleFly {
          0% { left: 0px; top: 50%; opacity: 0; transform: scale(0.5); }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; top: 40%; opacity: 0; transform: scale(1.2) rotate(360deg); }
        }
        .particle-dot {
          position: absolute;
          width: 5px;
          height: 5px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
          animation: particleFly 1.5s linear infinite;
        }

        /* SVG Self drawing charts */
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        .animate-svg-draw {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawLine 3.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .glow-hover-card {
          position: relative;
          transition: all 0.3s ease;
        }
        .glow-hover-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.3), rgba(99, 102, 241, 0.3));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .glow-hover-card:hover::after {
          opacity: 1;
        }
      `}} />

      {/* Background Gradients & Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.18),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_50%,rgba(16,185,129,0.06),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,rgba(6,182,212,0.06),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Floating neon light blobs (Aurora slow floats) */}
      <div className="absolute top-[10%] left-[-35%] h-[220px] w-[220px] rounded-full bg-indigo-600/10 blur-[80px] animate-float-slow pointer-events-none sm:left-[-10%] sm:h-[380px] sm:w-[380px] sm:blur-[110px]" />
      <div className="absolute top-[45%] right-[-35%] h-[240px] w-[240px] rounded-full bg-emerald-500/6 blur-[90px] animate-float-medium pointer-events-none sm:right-[-10%] sm:h-[420px] sm:w-[420px] sm:blur-[120px]" />
      <div className="absolute top-[75%] left-[10%] h-[220px] w-[220px] rounded-full bg-cyan-500/8 blur-[80px] animate-float-fast pointer-events-none sm:h-[340px] sm:w-[340px] sm:blur-[100px]" />

      {/* Header */}
      <header className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-all duration-300',
        scrolled ? 'border-slate-800/80 bg-slate-950/70 shadow-2xl backdrop-blur-xl' : 'border-transparent bg-transparent'
      )}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/')} className="flex items-center hover:opacity-90 transition" aria-label="WiseBot home">
            <Logo customSize={86} />
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              if (item.href.startsWith('/')) {
                return (
                  <Link key={item.href} to={item.href} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
                    {item.label}
                  </Link>
                );
              }
              return (
                <a key={item.href} href={item.href} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Button variant="ghost" onClick={toggleLanguage} className="px-3">
              <Globe size={16} className="text-slate-400 group-hover:text-white transition" />
              <span className="font-semibold text-xs tracking-wider">{language.toUpperCase()}</span>
            </Button>
            <Button variant="ghost" onClick={() => navigate('/login')}>
              {t('auth.register.login')}
            </Button>
            <Button onClick={goRegister}>
              {t('landing.get_started')}
              <ArrowRight size={15} />
            </Button>
          </div>

          <button
            onClick={() => setIsMenuOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/80 text-slate-300 hover:bg-slate-800 lg:hidden transition"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="border-b border-slate-800 bg-slate-950/95 px-5 py-6 lg:hidden backdrop-blur-2xl">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => {
                if (item.href.startsWith('/')) {
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-900 transition block text-left"
                    >
                      {item.label}
                    </Link>
                  );
                }
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-900 transition block text-left"
                  >
                    {item.label}
                  </a>
                );
              })}
              <hr className="border-slate-800 my-1" />
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">{t('landing.showcase.language_label')}</span>
                <Button variant="secondary" onClick={toggleLanguage} className="h-9 px-3">
                  <Globe size={14} />
                  {t('landing.showcase.switch_language')}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button variant="secondary" onClick={() => navigate('/login')}>
                  {t('auth.register.login')}
                </Button>
                <Button onClick={goRegister}>
                  {t('landing.get_started')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="pt-24 pb-16">
        {/* HERO SECTION */}
        <section className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pt-10 pb-20 lg:pt-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">

            {/* Left Hero Text */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-bold text-emerald-400 tracking-wide select-none">
                <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                {t('landing.showcase.hero_badge')}
              </div>

              <h1 className="break-words text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="block">{t('landing.showcase.hero_title_1')}</span>
                <span className="block mt-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent animate-gradient-text">
                  {t('landing.showcase.hero_title_2')}
                </span>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-slate-400 font-light md:text-xl">
                {t('landing.showcase.hero_subtitle')}
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button onClick={goRegister} className="h-12 w-full text-base sm:w-auto sm:px-8">
                  {t('landing.showcase.cta_primary')}
                  <ArrowRight size={17} />
                </Button>
                <Button variant="secondary" className="h-12 w-full text-base sm:w-auto sm:px-6" onClick={() => navigate('/docs')}>
                  {t('landing.showcase.cta_secondary')}
                </Button>
              </div>

              
            </div>

            {/* Right Hero: INTERACTIVE RAG SANDBOX */}
            <div className="relative">
              {/* Outer glow ring around sandbox */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 rounded-2xl blur-2xl -z-10 pointer-events-none" />

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden animate-border-glow">

                {/* Window header */}
                <div className="grid min-h-12 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-slate-900 bg-slate-900/40 px-3 py-2 sm:px-5">
                  <div className="hidden gap-2 sm:flex">
                    <span className="h-3 w-3 rounded-full bg-red-500/60" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <span className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex min-w-0 items-center justify-center gap-1.5 rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-400 sm:px-3 sm:text-xs">
                    <Terminal size={12} className="text-slate-500" />
                    <span className="truncate">{t('landing.showcase.sandbox_title')}</span>
                  </div>
                  <button
                    onClick={handleResetSandbox}
                    className="text-[10px] font-medium text-slate-500 underline transition hover:text-slate-300 sm:text-xs"
                  >
                    {t('landing.showcase.reset_sim')}
                  </button>
                </div>

                {/* Sandbox tabs (Controls) */}
                <div className="grid grid-cols-3 border-b border-slate-900 bg-slate-950/30">
                  {[
                    { step: 0, label: t('landing.showcase.step_ingest') },
                    { step: 1, label: t('landing.showcase.step_retrieve') },
                    { step: 2, label: t('landing.showcase.step_cite') }
                  ].map((tab) => (
                    <button
                      key={tab.step}
                      onClick={() => setSandboxStep(tab.step as 0 | 1 | 2)}
                      className={cn(
                        'min-h-11 px-1 py-2 text-[10px] font-bold transition-all border-b-2 sm:py-3 sm:text-xs',
                        sandboxStep === tab.step
                          ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                          : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sandbox content area */}
                <div className="flex min-h-[280px] flex-col justify-between p-4 sm:min-h-[310px] sm:p-6">

                  {/* STEP 1: Ingest Simulation */}
                  {sandboxStep === 0 && (
                    <div className="space-y-5">
                      <p className="text-xs text-slate-400">{t('landing.showcase.sandbox_desc')}</p>

                      {/* Document icon representing raw content */}
                      <div className="relative flex flex-col items-stretch justify-center gap-4 overflow-hidden rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">

                        <div className="relative z-10 flex flex-col items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4 text-indigo-400">
                          <FileText size={32} className={cn(isIngesting && 'animate-pulse')} />
                          <span className="mt-2 text-[10px] font-mono">warranty.pdf</span>
                        </div>

                        <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center">
                          <span className="text-xs text-slate-500 font-mono mb-2 z-10">Parser & Embed</span>

                          {/* Animated particle flow line */}
                          <div className="relative w-full h-1 bg-slate-800 rounded overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-150"
                              style={{ width: `${ingestProgress}%` }}
                            />
                            {isIngesting && (
                              <>
                                <span className="particle-dot" style={{ animationDelay: '0s' }} />
                                <span className="particle-dot" style={{ animationDelay: '0.3s' }} />
                                <span className="particle-dot" style={{ animationDelay: '0.6s' }} />
                                <span className="particle-dot" style={{ animationDelay: '0.9s' }} />
                              </>
                            )}
                          </div>
                        </div>

                        {/* Database target representing Qdrant Vector Store */}
                        <div className="relative z-10 flex flex-col items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400">
                          <Database size={32} className={cn(isIngesting && 'animate-bounce')} />
                          <span className="mt-2 text-[10px] font-mono">Qdrant DB</span>
                        </div>
                      </div>

                      {/* Log Console Output */}
                      <div className="rounded-lg border border-slate-900 bg-slate-950 p-4 font-mono text-xs text-slate-400">
                        {isIngesting ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                            <span>{t('landing.showcase.ingest_status')}</span>
                          </div>
                        ) : ingestProgress === 100 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-emerald-400">
                              <CheckCircle2 size={13} />
                              <span>{t('landing.showcase.ingest_success')}</span>
                            </div>
                            <div className="pl-5 text-slate-600">
                              - Chunk #1: Warranty period (12 months)<br />
                              - Chunk #2: Invoicing details<br />
                              - Chunk #3: Exclusions (liquid damage)<br />
                              - Chunk #4: Contact email
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-600">
                            {t('landing.showcase.ready_prompt')}
                          </div>
                        )}
                      </div>

                      {!isIngesting && ingestProgress < 100 && (
                        <Button onClick={handleRunIngest} className="w-full">
                          <Upload size={14} />
                          {t('landing.showcase.run_sim')}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* STEP 2: Retrieve Simulation */}
                  {sandboxStep === 1 && (
                    <div className="space-y-4">
                      {/* Search box simulation */}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                          <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 rounded-lg border border-slate-800 bg-slate-950/80 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                            placeholder={t('landing.showcase.retrieve_placeholder')}
                          />
                        </div>
                        <Button onClick={handleRunSearch} className="w-full px-5 sm:w-auto">
                          {t('landing.showcase.run_sim')}
                        </Button>
                      </div>

                      {/* Matching vector database nodes */}
                      <div className="relative grid gap-3 sm:grid-cols-2">
                        {isSearching && (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.15),transparent_80%)] animate-pulse pointer-events-none" />
                        )}
                        {[
                          { id: 1, title: 'Chunk #1: warranty_period', score: '0.94', desc: '12-month warranty from purchase' },
                          { id: 2, title: 'Chunk #2: invoice_required', score: '0.89', desc: 'Receipt required to process claim' },
                          { id: 3, title: 'Chunk #3: shipping_cost', score: '0.41', desc: 'Customer covers return shipping' },
                          { id: 4, title: 'Chunk #4: exclusions', score: '0.22', desc: 'Does not cover water damage' }
                        ].map((chunk) => {
                          const isMatch = chunk.id <= 2;
                          return (
                            <div
                              key={chunk.id}
                              className={cn(
                                'p-3 rounded-lg border transition-all duration-500 text-left relative overflow-hidden',
                                isSearching && isMatch && 'scale-[1.03] border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
                                !isSearching && sandboxStep >= 1 && isMatch
                                  ? 'border-emerald-500/40 bg-emerald-500/5'
                                  : 'border-slate-900 bg-slate-950/40 opacity-50'
                              )}
                            >
                              <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <span className="break-words text-[10px] font-bold uppercase tracking-wider text-slate-400">{chunk.title}</span>
                                {isMatch && (
                                  <span className="text-[10px] font-mono text-emerald-400 font-bold">score: {chunk.score}</span>
                                )}
                              </div>
                              <p className="break-words text-xs font-medium text-slate-300">{chunk.desc}</p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-900 text-xs font-mono text-slate-500">
                        {isSearching ? (
                          <div className="flex items-center gap-2 text-yellow-400/90">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                            <span>{t('landing.showcase.retrieve_prompt')}</span>
                          </div>
                        ) : (
                          <div className="text-emerald-400/90 flex items-center gap-1.5">
                            <CheckCircle2 size={13} />
                            <span>{t('landing.showcase.retrieve_success')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Cited Response */}
                  {sandboxStep === 2 && (
                    <div className="space-y-4">
                      {/* Chat dialog bubble */}
                      <div className="space-y-3">
                        <div className="flex gap-2.5 items-start">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300">U</div>
                          <div className="max-w-[calc(100%-2.75rem)] break-words rounded-2xl rounded-tl-none bg-slate-900 px-3.5 py-2.5 text-xs text-slate-300 sm:max-w-[85%]">
                            {searchQuery}
                          </div>
                        </div>

                        <div className="flex gap-2.5 items-start">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-xs font-bold text-emerald-400">
                            <Bot size={13} />
                          </div>
                          <div className="relative max-w-[calc(100%-2.75rem)] break-words rounded-2xl rounded-tl-none border border-emerald-500/20 bg-emerald-950/20 px-3.5 py-2.5 text-xs leading-relaxed text-slate-200 sm:max-w-[85%]">
                            {answerOutput || <span className="text-slate-600">...</span>}
                            {isTypingAnswer && (
                              <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-400 animate-pulse align-middle" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Citation block details */}
                      <div className="pt-3 border-t border-slate-900">
                        <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">{t('landing.showcase.citations')}</p>
                        <div className="space-y-2">
                          {[
                            { id: 1, text: t('landing.showcase.citation_1') },
                            { id: 2, text: t('landing.showcase.citation_2') }
                          ].map((cit) => (
                            <div
                              key={cit.id}
                              onMouseEnter={() => setHighlightedCitation(cit.id)}
                              onMouseLeave={() => setHighlightedCitation(null)}
                              className={cn(
                                'flex items-start gap-2 p-2 rounded border transition-all text-xs cursor-pointer',
                                highlightedCitation === cit.id
                                  ? 'border-emerald-500/50 bg-emerald-500/10 text-white shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                  : 'border-slate-900 bg-slate-950/40 text-slate-400 hover:border-slate-800'
                              )}
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                                [{cit.id}]
                              </span>
                              <p className="leading-normal">{cit.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sandbox helper footer */}
                  <div className="mt-2 flex flex-col gap-1 text-[10px] font-mono text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                    <span>{t('landing.showcase.status_ready')}</span>
                    <span>{t('landing.showcase.engine_label')}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        

        {/* INTERACTIVE PIPELINE ROADMAP */}
        <section className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{t('landing.showcase.pipeline_title')}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{t('landing.showcase.pipeline_desc')}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            {[
              { id: 0, title: t('landing.showcase.tab_doc'), icon: FileText, desc: t('landing.showcase.docs_input') },
              { id: 1, title: t('landing.showcase.tab_chunk'), icon: Layers, desc: t('landing.showcase.chunk_desc') },
              { id: 2, title: t('landing.showcase.tab_embed'), icon: Cpu, desc: t('landing.showcase.embed_desc') },
              { id: 3, title: t('landing.showcase.tab_db'), icon: Database, desc: t('landing.showcase.db_desc') },
              { id: 4, title: t('landing.showcase.tab_output'), icon: Bot, desc: t('landing.showcase.output_desc') }
            ].map((tab, idx) => (
              <div
                key={tab.id}
                onClick={() => setActivePipelineTab(tab.id)}
                className={cn(
                  'rounded-xl border p-5 transition-all duration-300 cursor-pointer relative group text-left flex flex-col justify-between glow-hover-card',
                  activePipelineTab === tab.id
                    ? 'border-emerald-500 bg-emerald-500/[0.03] shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/10'
                )}
              >
                <div>
                  <div className={cn(
                    'mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-300',
                    activePipelineTab === tab.id ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 group-hover:text-white'
                  )}>
                    <tab.icon size={18} className={cn(activePipelineTab === tab.id && 'animate-pulse')} />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">{tab.title}</h4>
                  <p className="mt-3 text-xs text-slate-400 leading-relaxed">{tab.desc}</p>
                </div>
                {idx < 4 && (
                  <div className="hidden lg:block absolute top-10 -right-4 translate-x-1/2 z-20 text-slate-700 group-hover:text-emerald-400 transition">
                    <ChevronRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detailed Preview block for the selected pipeline step */}
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-4 animate-border-glow sm:p-6">
            {activePipelineTab === 0 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">{t('landing.showcase.pipeline_doc_title')}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {t('landing.showcase.pipeline_doc_desc')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded bg-slate-900 border border-slate-800 px-3 py-1 text-xs text-slate-300">.pdf</span>
                    <span className="rounded bg-slate-900 border border-slate-800 px-3 py-1 text-xs text-slate-300">.docx</span>
                    <span className="rounded bg-slate-900 border border-slate-800 px-3 py-1 text-xs text-slate-300">.txt</span>
                    <span className="rounded bg-slate-900 border border-slate-800 px-3 py-1 text-xs text-slate-300">.xlsx</span>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs text-slate-400">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 text-[10px] text-slate-500">
                    <span>{t('landing.showcase.active_sources')}</span>
                    <span className="text-emerald-400 font-bold">{t('landing.showcase.online')}</span>
                  </div>
                  <div className="flex min-w-0 justify-between gap-3">
                    <span className="min-w-0 truncate">📄 user_manual_v3.pdf</span>
                    <span className="text-slate-500">1.2 MB</span>
                  </div>
                  <div className="flex min-w-0 justify-between gap-3">
                    <span className="min-w-0 truncate">📊 sales_data.xlsx</span>
                    <span className="text-slate-500">2.5 MB</span>
                  </div>
                </div>
              </div>
            )}
            {activePipelineTab === 1 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">{t('landing.showcase.pipeline_chunk_title')}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t('landing.showcase.pipeline_chunk_desc')}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="rounded border border-slate-800 bg-slate-900/40 p-3 text-xs">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Chunk #1</span>
                    <p className="text-slate-300 italic font-mono leading-relaxed">&quot;...Chính sách bảo hành kéo dài 12 tháng kể từ ngày giao hàng. Mọi yêu cầu đổi trả hoặc bảo hành phải đi kèm hóa đơn mua hàng gốc...&quot;</p>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-900/40 p-3 text-xs opacity-60">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Chunk #2 (Overlap)</span>
                    <p className="text-slate-300 italic font-mono leading-relaxed">&quot;...đi kèm hóa đơn mua hàng gốc. Điều này áp dụng đối với tất cả các dòng sản phẩm phần cứng bán trực tiếp bởi WiseBot...&quot;</p>
                  </div>
                </div>
              </div>
            )}
            {activePipelineTab === 2 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">{t('landing.showcase.pipeline_embed_title')}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {t('landing.showcase.pipeline_embed_desc')}
                  </p>
                </div>
                <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs text-slate-300">
                  <div className="text-[10px] text-slate-500 uppercase">{t('landing.showcase.input_vector')}</div>
                  <div className="overflow-x-auto rounded border border-slate-800/80 bg-slate-950 p-2 text-[11px]">
                    <span className="text-slate-400">&quot;bảo hành 12 tháng&quot;</span> ➜ <span className="text-emerald-400">[0.012, -0.491, 0.887, 0.124, -0.098, ...]</span>
                  </div>
                </div>
              </div>
            )}
            {activePipelineTab === 3 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">{t('landing.showcase.pipeline_db_title')}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t('landing.showcase.pipeline_db_desc')}
                  </p>
                </div>
                <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs text-slate-400">
                  <div className="text-[10px] text-slate-500 uppercase border-b border-slate-800 pb-1">{t('landing.showcase.qdrant_request')}</div>
                  <pre className="text-[10px] text-slate-300 whitespace-pre overflow-x-auto">
                    {`client.search(
    collection_name="workspace_faq",
    query_vector=question_embedding,
    limit=2,
    score_threshold=0.85
)`}
                  </pre>
                </div>
              </div>
            )}
            {activePipelineTab === 4 && (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">{t('landing.showcase.pipeline_output_title')}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t('landing.showcase.pipeline_output_desc')}
                  </p>
                </div>
                <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs text-slate-400">
                  <div className="text-[10px] text-slate-500 uppercase">{t('landing.showcase.prompt_segment')}</div>
                  <div className="break-words rounded border border-slate-800/80 bg-slate-950 p-2.5 text-[10px] text-slate-300">
                    <span className="text-emerald-500">CONTEXT:</span> &quot;[Source 1]: warranty lasts 12 months...&quot;<br />
                    <span className="text-emerald-500">USER:</span> &quot;Warranty period?&quot;<br />
                    <span className="text-indigo-400">INSTRUCTION:</span> Answer the user using ONLY the context above. Citations are mandatory.
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ASYMMETRIC BENTO GRID FEATURES */}
        <section id="features" className="bg-slate-950/20 py-20 relative">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

            {/* Heading */}
            <div className="max-w-3xl mb-16 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">{t('landing.nav.features')}</span>
              <h2 className="break-words text-3xl font-extrabold leading-tight text-white sm:text-4xl">{t('landing.features.reliable_title')}</h2>
              <p className="text-slate-400 text-base max-w-xl font-light">{t('landing.features.reliable_subtitle')}</p>
            </div>

            {/* Asymmetric grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {/* Bento Card 1: Private Knowledge Base (Wide: 2 cols) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 md:col-span-2 hover:border-slate-700/80 transition-all duration-300 relative group overflow-hidden glow-hover-card">
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
                <div className="grid md:grid-cols-[1fr_1.1fr] gap-6 items-center">
                  <div className="space-y-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform duration-300">
                      <Database size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-white">{t('landing.showcase.bento_kb_title')}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-light">{t('landing.showcase.bento_kb_desc')}</p>
                  </div>

                  {/* Folder Structure Preview */}
                  <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-400">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 text-[10px] text-slate-500">
                      <span>{t('landing.showcase.documents_system')}</span>
                      <span className="text-emerald-400 font-bold">{t('landing.showcase.auto_synced')}</span>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <div className="flex min-w-0 items-center gap-2 text-slate-300">
                        <span className="text-slate-600">📁</span> <span className="min-w-0 truncate">workspace / product_kb</span>
                      </div>
                      <div className="flex min-w-0 items-center justify-between gap-3 pl-4 text-emerald-400">
                        <div className="flex min-w-0 items-center gap-2">
                          <span>📄</span> <span className="min-w-0 truncate">faq-san-pham.pdf</span>
                        </div>
                        <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">{t('landing.showcase.synced')}</span>
                      </div>
                      <div className="flex min-w-0 items-center justify-between gap-3 pl-4 text-slate-400">
                        <div className="flex min-w-0 items-center gap-2">
                          <span>📄</span> <span className="min-w-0 truncate">huong-dan-su-dung.txt</span>
                        </div>
                        <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{t('landing.showcase.synced')}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-2 pl-4 text-slate-500">
                        <span>🔗</span> <span className="min-w-0 truncate">wisebot.vn/docs/widget</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Card 2: Anti-Hallucination Comparison (Tall: 1 col) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between group overflow-hidden glow-hover-card">
                <div className="space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/10 text-red-400 group-hover:scale-105 transition-transform duration-300">
                    <ShieldCheck size={20} className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t('landing.showcase.bento_cite_title')}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">{t('landing.showcase.bento_cite_desc')}</p>
                </div>

                {/* Comparison panel */}
                <div className="space-y-3 mt-6">
                  <div className="p-3 rounded-lg border border-red-500/10 bg-red-500/5 text-xs text-left">
                    <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider block mb-1">{t('landing.showcase.bento_cite_bad')}</span>
                    <p className="text-red-200/80 leading-relaxed">{t('landing.showcase.bento_cite_bad_ans')}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-left">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">{t('landing.showcase.bento_cite_good')}</span>
                    <p className="text-emerald-200 leading-relaxed">{t('landing.showcase.bento_cite_good_ans')}</p>
                  </div>
                </div>
              </div>

              {/* Bento Card 3: Interactive Widget Preview & Theme Customizer (Wide: 2 cols) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 md:col-span-2 hover:border-slate-700/80 transition-all duration-300 relative group overflow-hidden glow-hover-card">
                <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />
                <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6 items-center">

                  {/* Theme customizable Widget UI */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative">
                    <div className={cn(
                      'px-4 py-3 text-left text-xs font-bold text-slate-950 flex justify-between items-center transition-colors duration-300',
                      widgetThemeColor === 'emerald' && 'bg-emerald-400',
                      widgetThemeColor === 'cyan' && 'bg-cyan-400',
                      widgetThemeColor === 'indigo' && 'bg-indigo-400'
                    )}>
                      <div className="flex items-center gap-1.5">
                        <Bot size={14} />
                        <span>{t('landing.showcase.widget_online')}</span>
                      </div>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-ping" />
                    </div>
                    <div className="p-4 space-y-3 min-h-[120px] flex flex-col justify-end text-left">
                      <div className="bg-slate-900 px-3 py-2 rounded-xl rounded-tl-none text-[10px] text-slate-300 max-w-[85%]">
                        {t('landing.showcase.widget_question')}
                      </div>
                      <div className="bg-slate-900/40 border border-slate-800 px-3 py-2 rounded-xl rounded-tr-none text-[10px] text-slate-300 max-w-[85%] self-end">
                        {t('landing.showcase.widget_answer')}
                      </div>
                    </div>
                    <div className="flex gap-2 border-t border-slate-900 p-3">
                      <input
                        type="text"
                        disabled
                        placeholder={t('landing.showcase.widget_placeholder')}
                        className="min-w-0 flex-1 rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[10px] text-slate-500 outline-none"
                      />
                      <button className={cn(
                        'rounded px-3 py-1.5 text-[10px] font-bold text-slate-950 transition-colors duration-300',
                        widgetThemeColor === 'emerald' && 'bg-emerald-400',
                        widgetThemeColor === 'cyan' && 'bg-cyan-400',
                        widgetThemeColor === 'indigo' && 'bg-indigo-400'
                      )}>
                        {t('landing.showcase.send')}
                      </button>
                    </div>
                  </div>

                  {/* Settings Panel */}
                  <div className="space-y-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform duration-300">
                      <Code2 size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-white">{t('landing.showcase.bento_widget_title')}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-light">{t('landing.showcase.bento_widget_desc')}</p>

                    <div className="space-y-2 pt-2 text-left">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t('landing.showcase.custom_color')}</span>
                      <div className="flex gap-2">
                        {[
                          { id: 'emerald', class: 'bg-emerald-400 border-emerald-500' },
                          { id: 'cyan', class: 'bg-cyan-400 border-cyan-500' },
                          { id: 'indigo', class: 'bg-indigo-400 border-indigo-500' }
                        ].map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setWidgetThemeColor(color.id as 'emerald' | 'cyan' | 'indigo')}
                            className={cn(
                              'h-6 w-6 rounded-full border-2 transition-all',
                              color.class,
                              widgetThemeColor === color.id ? 'scale-110 border-white shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                            )}
                            aria-label={`${t('landing.showcase.select_theme')} ${color.id}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bento Card 4: Self-Drawing Chart / Analytics Tracker (Tall: 1 col) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between group overflow-hidden glow-hover-card">
                <div className="space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                    <TrendingUp size={20} className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t('landing.features.analytics.title')}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">{t('landing.features.analytics.desc')}</p>
                </div>

                {/* Drawing SVG Analytics line chart */}
                <div className="mt-6 p-4 rounded-xl border border-slate-900 bg-slate-950 relative">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-2">
                    <span>{t('landing.showcase.accuracy_over_time')}</span>
                    <span className="text-emerald-400 font-bold">96.8%</span>
                  </div>
                  <svg viewBox="0 0 100 30" className="w-full h-14">
                    <path
                      d="M0,25 Q15,10 30,20 T60,5 T90,12 T100,2"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      className="animate-svg-draw"
                    />
                    <path
                      d="M0,25 Q15,10 30,20 T60,5 T90,12 T100,2 L100,30 L0,30 Z"
                      fill="url(#gradient-chart)"
                      opacity="0.06"
                    />
                    <defs>
                      <linearGradient id="gradient-chart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* USE CASES SECTION */}
        <section id="use-cases" className="border-t border-slate-900 bg-slate-950/30 py-20 relative">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">

              <div className="space-y-5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">{t('landing.use_cases.label')}</span>
                <h2 className="break-words text-3xl font-extrabold leading-tight text-white sm:text-4xl">{t('landing.use_cases.title')}</h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-lg font-light">{t('landing.use_cases.subtitle')}</p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Headphones, title: t('landing.use_cases.support.title'), desc: t('landing.use_cases.support.desc'), index: '01' },
                  { icon: BookOpen, title: t('landing.use_cases.education.title'), desc: t('landing.use_cases.education.desc'), index: '02' },
                  { icon: Bot, title: t('landing.use_cases.internal.title'), desc: t('landing.use_cases.internal.desc'), index: '03' }
                ].map((item) => (
                  <article
                    key={item.title}
                    className="grid gap-5 rounded-xl border border-slate-900 bg-slate-950/50 p-5 transition hover:border-slate-700/60 hover:bg-slate-900/10 sm:grid-cols-[64px_1fr] group cursor-pointer glow-hover-card"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-slate-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition duration-300">
                      <item.icon size={22} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-left">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">{item.index}</span>
                        <ArrowUpRight size={14} className="text-slate-600 group-hover:text-white transition" />
                      </div>
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed font-light">{item.desc}</p>
                    </div>
                  </article>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* CTA (CALL TO ACTION) */}
        <section className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-16">
          <div className="relative rounded-3xl border border-slate-800 bg-slate-950/80 overflow-hidden py-16 px-6 sm:px-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-border-glow">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">{t('landing.footer.product')}</span>
              <h2 className="text-3xl font-extrabold text-white sm:text-5xl leading-tight">
                {t('landing.showcase.cta_title')}
              </h2>
              <p className="text-slate-400 text-sm md:text-base font-light">
                {t('landing.showcase.footer_slogan')}
              </p>
              <div className="pt-4 flex justify-center">
                <Button onClick={goRegister} className="h-12 w-full text-base sm:w-auto sm:px-8">
                  {t('landing.showcase.cta_primary')}
                  <ArrowRight size={17} />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer id="docs" className="border-t border-slate-900 bg-slate-950/80 py-16 text-slate-500 relative z-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 font-sans">

          <div className="grid gap-12 md:grid-cols-[1.2fr_2fr] mb-12">
            <div className="space-y-5 text-left">
              <Logo customSize={94} />
              <p className="max-w-xs text-xs leading-relaxed font-light">{t('landing.footer.tagline')}</p>

              <div className="flex gap-2">
                {[
                  { icon: Twitter, href: 'https://twitter.com' },
                  { icon: Github, href: 'https://github.com' },
                  { icon: Linkedin, href: 'https://linkedin.com' }
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white hover:border-slate-700 transition"
                  >
                    <social.icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-3 text-left">
              {[
                {
                  title: t('landing.footer.product'),
                  links: [t('landing.footer.links.features'), t('landing.footer.links.pricing'), t('landing.footer.links.docs'), t('landing.footer.links.api')]
                },
                {
                  title: t('landing.footer.company'),
                  links: [t('landing.footer.links.about'), t('landing.footer.links.careers'), t('landing.footer.links.blog'), t('landing.footer.links.contact')]
                },
                {
                  title: t('landing.footer.legal'),
                  links: [t('landing.footer.links.privacy'), t('landing.footer.links.terms'), t('landing.footer.links.cookie'), t('landing.footer.links.security')]
                }
              ].map((col) => (
                <div key={col.title} className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">{col.title}</h4>
                  <ul className="space-y-2 text-xs">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="hover:text-white transition">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-900 pt-8 text-xs sm:flex-row sm:items-center sm:justify-between font-light">
            <p>{t('landing.footer.rights')}</p>
            <p className="flex flex-wrap items-center justify-center gap-1">
              <span>{t('landing.footer.made_with')}</span>
              <span className="text-red-500 animate-pulse">❤️</span>
              <span>{t('landing.footer.by_team')} WiseBot Team</span>
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}
