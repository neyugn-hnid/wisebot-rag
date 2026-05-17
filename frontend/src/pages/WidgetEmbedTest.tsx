import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Globe, Shield, Zap, Star, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';
import { getStoredAccessToken } from '../lib/auth';
import { listWidgets } from '../api/widget';

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return null;
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveTenantIdFromToken() {
  const token = getStoredAccessToken();
  const payload = token ? parseJwtPayload(token) : null;
  return typeof payload?.tenantId === 'string' ? payload.tenantId.trim() : '';
}

export default function WidgetEmbedTest() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [widgetCode, setWidgetCode] = React.useState('');
  const [isLoadingWidget, setIsLoadingWidget] = React.useState(false);

  const loadPublishedWidget = React.useCallback(async () => {
    const tenantId = resolveTenantIdFromToken();
    if (!tenantId) {
      setWidgetCode('');
      showToast(t('widget.tenant_missing'), 'error');
      return;
    }

    setIsLoadingWidget(true);
    try {
      const widgets = await listWidgets(tenantId);
      setWidgetCode(widgets[0]?.code || '');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('widget.load_failed');
      showToast(message, 'error');
      setWidgetCode('');
    } finally {
      setIsLoadingWidget(false);
    }
  }, [showToast, t]);

  React.useEffect(() => {
    void loadPublishedWidget();
  }, [loadPublishedWidget]);

  React.useEffect(() => {
    const existingRoots = document.querySelectorAll('.wisebot-widget-root');
    existingRoots.forEach((item) => item.remove());

    const existingScripts = document.querySelectorAll('script[data-wisebot-test-script="true"]');
    existingScripts.forEach((item) => item.remove());

    if (!widgetCode) {
      return;
    }

    const script = document.createElement('script');
    script.src = '/widget.js';
    script.async = true;
    script.dataset.id = widgetCode;
    script.dataset.apiBase = window.location.origin;
    script.dataset.wisebotTestScript = 'true';
    document.body.appendChild(script);

    return () => {
      script.remove();
      document.querySelectorAll('.wisebot-widget-root').forEach((item) => item.remove());
    };
  }, [widgetCode]);

  return (
    <div className="min-h-screen bg-[#f7f8fa] font-sans text-[#172033] selection:bg-[#3b9eff]/20">
      <header className="sticky top-0 z-30 border-b border-[#e4e7ec] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-5 px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/customization"
              className="grid h-10 w-10 place-items-center rounded-lg border border-[#e4e7ec] text-[#667085] transition-colors hover:bg-[#f2f4f7] hover:text-[#172033]"
              aria-label="Back to customization"
            >
              <ChevronLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <span className="rounded-md border border-[#cfe7ff] bg-[#eef7ff] px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#1677c7]">
                {t('demo.mode')}
              </span>
              <span className="hidden text-sm font-bold text-[#667085] sm:block">{t('demo.title')}</span>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#667085] md:flex">
            <span>{t('demo.nav.product')}</span>
            <span>{t('demo.nav.solutions')}</span>
            <span>{t('demo.nav.pricing')}</span>
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => void loadPublishedWidget()}
              disabled={isLoadingWidget}
              className="hidden items-center gap-2 rounded-lg border border-[#e4e7ec] bg-white px-3 py-2 text-xs font-bold text-[#667085] transition-colors hover:bg-[#f2f4f7] disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
            >
              <RefreshCw size={14} className={isLoadingWidget ? 'animate-spin' : ''} />
              {t('settings.rebuild.refresh')}
            </button>
            <Logo customSize={104} />
          </div>
        </div>
      </header>

      {!widgetCode && !isLoadingWidget ? (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm rounded-xl border border-[#fedf89] bg-[#fffaeb] p-4 text-sm leading-6 text-[#93370d] shadow-[0_18px_40px_rgba(16,24,40,0.14)]">
          {t('widget.publish_first')}
        </div>
      ) : null}

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid gap-12 py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d0d5dd] bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#667085] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#3b9eff]" />
              {t('demo.hero.badge')}
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.02] tracking-normal text-[#101828] md:text-7xl">
              {t('demo.hero.title_1')} <span className="text-[#1677c7]">{t('demo.hero.title_2')}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#667085]">
              {t('demo.hero.desc')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-lg bg-[#101828] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-black/10 transition-colors hover:bg-[#1d2939]">
              {t('demo.hero.cta_primary')}
            </button>
              <button className="rounded-lg border border-[#d0d5dd] bg-white px-6 py-3 text-sm font-bold text-[#344054] transition-colors hover:bg-[#f2f4f7]">
              {t('demo.hero.cta_secondary')}
            </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white shadow-[0_24px_70px_rgba(16,24,40,0.12)]">
            <div className="flex h-12 items-center gap-2 border-b border-[#e4e7ec] bg-[#f2f4f7] px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f04438]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#fdb022]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#12b76a]" />
            </div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['94%', 'SLA'],
                  ['18m', 'Reply'],
                  ['3.7k', 'Closed'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg border border-[#e4e7ec] p-4">
                    <p className="text-2xl font-black text-[#101828]">{value}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#98a2b3]">{label}</p>
                  </div>
                ))}
              </div>
              {[
                ['09:30', 'Billing request routed to Finance', 'Done'],
                ['10:15', 'Enterprise onboarding question answered', 'Done'],
                ['11:40', 'Technical issue escalated to Support', 'Open'],
              ].map(([time, text, status]) => (
                <div key={`${time}-${text}`} className="grid items-center gap-3 rounded-lg border border-[#e4e7ec] p-3 text-sm sm:grid-cols-[70px_1fr_auto]">
                  <span className="font-black text-[#475467]">{time}</span>
                  <span className="text-[#667085]">{text}</span>
                  <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[11px] font-black text-[#027a48]">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 py-10 md:grid-cols-3">
          {[
            { icon: Zap, title: t('demo.feature.1.title'), desc: t('demo.feature.1.desc') },
            { icon: Shield, title: t('demo.feature.2.title'), desc: t('demo.feature.2.desc') },
            { icon: Globe, title: t('demo.feature.3.title'), desc: t('demo.feature.3.desc') },
          ].map((feature) => (
            <article key={feature.title} className="rounded-xl border border-[#e4e7ec] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-[#eef7ff] text-[#1677c7]">
                <feature.icon size={22} />
              </div>
              <h2 className="text-xl font-black text-[#101828]">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#667085]">{feature.desc}</p>
            </article>
          ))}
        </section>

        <section className="py-14">
          <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-black text-[#101828]">Trusted by Industry Leaders</h2>
              <p className="mt-2 max-w-2xl text-[#667085]">
                See how WiseBot is helping companies around the world deliver exceptional customer support.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((id) => (
              <article key={id} className="flex min-h-[280px] flex-col justify-between rounded-xl border border-[#e4e7ec] bg-white p-6 shadow-sm">
                <div>
                  <div className="mb-5 flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={16} className="fill-[#fdb022] text-[#fdb022]" />
                    ))}
                  </div>
                  <p className="text-base font-medium leading-7 text-[#344054]">{t(`demo.testimonial.${id}.text`)}</p>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <img
                    src={`https://picsum.photos/seed/user${id}/100/100`}
                    className="h-11 w-11 rounded-full border border-[#e4e7ec] object-cover"
                    alt="User"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-sm font-black text-[#101828]">{t(`demo.testimonial.${id}.author`)}</p>
                    <p className="text-xs font-bold text-[#1677c7]">{t(`demo.testimonial.${id}.role`)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="py-14 text-center">
          <h2 className="text-3xl font-black text-[#101828]">{t('demo.cta.title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-[#667085]">{t('demo.cta.desc')}</p>
          <button className="mt-8 rounded-lg bg-[#101828] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-black/10 transition-colors hover:bg-[#1d2939]">
            {t('demo.cta.button')}
          </button>
        </section>
      </main>

      <footer className="border-t border-[#e4e7ec] bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <Logo customSize={120} />
          <div className="flex gap-7 text-xs font-bold uppercase tracking-[0.14em] text-[#667085]">
            <span>{t('demo.footer.privacy')}</span>
            <span>{t('demo.footer.terms')}</span>
            <span>{t('demo.footer.contact')}</span>
          </div>
          <p className="text-xs font-medium text-[#98a2b3]">{t('demo.footer.copy')}</p>
        </div>
      </footer>
    </div>
  );
}
