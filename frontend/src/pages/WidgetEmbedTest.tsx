import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, RefreshCw, TestTube2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const STORAGE_KEY = 'wisebot_widget_test_code';

function buildSrcDoc(widgetCode: string, origin: string) {
  const safeCode = widgetCode.replace(/"/g, '&quot;');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WiseBot Widget Test</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Inter, system-ui, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(59,130,246,0.25), transparent 30%),
          radial-gradient(circle at bottom right, rgba(16,185,129,0.18), transparent 35%),
          #020617;
        color: #f8fafc;
      }
      main {
        max-width: 900px;
        margin: 0 auto;
        padding: 48px 24px 120px;
      }
      h1 {
        margin: 0 0 12px;
        font-size: clamp(2rem, 5vw, 3.5rem);
        line-height: 1.05;
      }
      p {
        color: #cbd5e1;
        max-width: 700px;
        line-height: 1.7;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(15,23,42,0.75);
        border: 1px solid rgba(148,163,184,0.28);
        color: #7dd3fc;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .card {
        margin-top: 28px;
        padding: 24px;
        border-radius: 24px;
        background: rgba(15,23,42,0.7);
        border: 1px solid rgba(148,163,184,0.18);
        backdrop-filter: blur(16px);
      }
      code {
        color: #fbbf24;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="chip">WiseBot Public Widget Test</div>
      <h1>Embed verification sandbox</h1>
      <p>
        This frame simulates a third-party website. The widget below should load from
        <code>${origin}/widget.js</code>, create a public session, and answer with the real backend.
      </p>
      <div class="card">
        Widget code under test: <code>${safeCode || 'missing'}</code>
      </div>
    </main>
    <script src="${origin}/widget.js" data-id="${safeCode}" data-api-base="${origin}" async></script>
  </body>
</html>`;
}

export default function WidgetEmbedTest() {
  const { t } = useLanguage();
  const [widgetCode, setWidgetCode] = React.useState(() => window.localStorage.getItem(STORAGE_KEY) || '');
  const [appliedCode, setAppliedCode] = React.useState(() => window.localStorage.getItem(STORAGE_KEY) || '');

  const frameDoc = React.useMemo(() => buildSrcDoc(appliedCode.trim(), window.location.origin), [appliedCode]);

  const applyCode = () => {
    const next = widgetCode.trim();
    setAppliedCode(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#f8fafc]">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[rgba(125,211,252,0.08)] border border-[rgba(125,211,252,0.24)] text-[#7dd3fc] text-[11px] font-black uppercase tracking-[0.18em]">
              <TestTube2 size={14} />
              Widget Test
            </div>
            <h1 className="mt-4 text-[32px] font-display font-medium tracking-tight">Public Widget Embed Test</h1>
            <p className="mt-3 text-[#94a3b8] max-w-3xl">
              Dán `widget code` đã publish, bấm reload, rồi thử hỏi trực tiếp trong iframe bên dưới.
              Nếu luồng public hoạt động, widget sẽ mở chat thật và trả lời từ backend.
            </p>
          </div>

          <Link
            to="/customization"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[14px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-[#f8fafc] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
          >
            <ExternalLink size={16} />
            Back To Customization
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section className="rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.82)] p-6 space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.18em] text-[#94a3b8] mb-2">
                Widget Code
              </label>
              <input
                type="text"
                value={widgetCode}
                onChange={(e) => setWidgetCode(e.target.value)}
                placeholder="wb_xxxxxxxx"
                className="w-full rounded-[16px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] px-4 py-3 text-sm outline-none focus:border-[#38bdf8]"
              />
            </div>

            <button
              onClick={applyCode}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[16px] bg-[#f8fafc] text-[#020617] font-bold hover:bg-white transition-colors"
            >
              <RefreshCw size={16} />
              Reload Test Frame
            </button>

            <div className="rounded-[18px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] p-4 text-sm text-[#cbd5e1] space-y-3">
              <p>Checklist:</p>
              <p>1. Publish widget from the customization page after selecting a knowledge base.</p>
              <p>2. Make sure `api-gateway`, `widget-service`, `chat-service`, `document-service`, `embedding-service`, `ai-service` are running.</p>
              <p>3. Reload this frame and ask a question like “Sản phẩm này có những gói nào?”.</p>
            </div>

            <div className="text-xs text-[#64748b]">
              Current app origin: <code className="text-[#fbbf24]">{window.location.origin}</code>
            </div>
          </section>

          <section className="rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.82)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgba(148,163,184,0.14)] text-sm text-[#cbd5e1]">
              Third-party website simulation
            </div>
            <iframe
              title="WiseBot widget test"
              srcDoc={frameDoc}
              className="w-full h-[780px] bg-[#020617]"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
