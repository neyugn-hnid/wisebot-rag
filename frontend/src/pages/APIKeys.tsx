import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { getStoredAccessToken } from '../lib/auth';
import { 
  AlertTriangle,
  Check,
  ChevronDown,
  Code2,
  Plus, 
  Copy, 
  Trash2, 
  ShieldCheck, 
  X,
  Loader2,
  KeyRound,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import DeleteModal from '../components/DeleteModal';
import {
  listWidgets,
  listApiKeys,
  createApiKey,
  createWidget,
  type WidgetResponse,
  type ApiKeyResponse,
} from '../api/widget';

interface APIKey {
  id: string;
  name: string;
  key: string;
  date: string;
  lastUsed: string;
  status: 'active' | 'idle' | 'never';
}

const API_DOCS = {
  endpoint: 'POST /api/chat/public/api/v1/recommend',
  curlExample: `curl -X POST \\
  "https://your-domain.com/api/chat/public/api/v1/recommend" \\
  -H "X-API-Key: <your-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "Có điện thoại nào dưới 10 triệu không?",
    "pageContext": {"productCategory": "Điện thoại"}
  }'`,
};

export default function APIKeys() {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [widgets, setWidgets] = useState<WidgetResponse[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState('');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);

  // Parse tenantId from JWT
  const resolveTenantId = () => {
    const token = getStoredAccessToken();
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.tenantId || '';
    } catch { return ''; }
  };

  // Load widgets (auto-create default if none exist)
  useEffect(() => {
    const tenantId = resolveTenantId();
    if (!tenantId) return;
    listWidgets(tenantId)
      .then(async (w) => {
        if (w.length === 0) {
          // Auto-create default widget
          try {
            const defaultWidget = await createWidget({
              tenantId,
              name: language === 'vi' ? 'Widget mặc định' : 'Default Widget',
              code: 'wb_' + Math.random().toString(36).slice(2, 10),
            });
            setWidgets([defaultWidget]);
            setSelectedWidgetId(defaultWidget.id);
          } catch {
            setWidgets([]);
          }
        } else {
          setWidgets(w);
          if (!selectedWidgetId) {
            setSelectedWidgetId(w[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Load API keys when widget changes
  useEffect(() => {
    if (!selectedWidgetId) { setKeys([]); return; }
    setIsLoadingKeys(true);
    listApiKeys(selectedWidgetId)
      .then((apiKeys) => {
        setKeys(apiKeys.map(k => ({
          id: k.id,
          name: k.name || k.keyPrefix,
          key: `sk-••••••••${k.keyPrefix}`,
          date: k.createdAt ? new Date(k.createdAt).toLocaleDateString(
            language === 'vi' ? 'vi-VN' : 'en-US',
            { month: 'short', day: 'numeric', year: 'numeric' }
          ) : '-',
          lastUsed: k.lastUsedAt
            ? new Date(k.lastUsedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')
            : (language === 'vi' ? 'Chưa sử dụng' : 'Never used'),
          status: k.status === 'ACTIVE' ? 'active' : 'never',
        })));
      })
      .catch(() => setKeys([]))
      .finally(() => setIsLoadingKeys(false));
  }, [selectedWidgetId, language]);

  const handleGenerateKey = async () => {
    if (!newKeyName.trim() || !selectedWidgetId) return;
    
    setIsGenerating(true);
    try {
      const result = await createApiKey(selectedWidgetId, { name: newKeyName.trim() });
      const rawKey = result.keyHash; // Only returned on creation
      
      const newKey: APIKey = {
        id: result.id,
        name: newKeyName.trim(),
        key: rawKey ? `sk-••••••••${result.keyPrefix}` : `sk-••••••••${result.keyPrefix}`,
        date: new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        lastUsed: language === 'vi' ? 'Chưa sử dụng' : 'Never used',
        status: 'never'
      };
      
      setGeneratedKey(rawKey);
      setKeys([newKey, ...keys]);
      showToast(t('toast.api_generated'), 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to create API key', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const openRevokeModal = (key: APIKey) => {
    setSelectedKey(key);
    setIsRevokeModalOpen(true);
  };

  const handleRevoke = () => {
    if (!selectedKey) return;
    setKeys(keys.filter(k => k.id !== selectedKey.id));
    showToast(t('toast.api_revoked'), 'success');
    setIsRevokeModalOpen(false);
    setSelectedKey(null);
  };

  const closeGenerateModal = () => {
    setIsGenerateModalOpen(false);
    setGeneratedKey(null);
    setNewKeyName('');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="rounded-[24px] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#9fa3a5]">
              <KeyRound size={13} />
              {t('nav.api_keys')}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Widget Selector */}
            <div className="relative">
              <select
                value={selectedWidgetId}
                onChange={(e) => setSelectedWidgetId(e.target.value)}
                className="appearance-none rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 pr-10 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[rgba(59,158,255,0.5)] cursor-pointer"
              >
                {widgets.length === 0 && <option value="">{language === 'vi' ? 'Tạo widget trước' : 'Create widget first'}</option>}
                {widgets.map(w => (
                  <option key={w.id} value={w.id} className="bg-[#1a1a1a]">{w.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8f91] pointer-events-none" />
            </div>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              disabled={!selectedWidgetId}
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#ffffff] px-5 py-2.5 text-sm font-bold text-[#000000] shadow-[0_14px_30px_rgba(0,0,0,0.22)] transition-colors hover:bg-[#f0f0f0] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              {t('api.generate')}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] p-6">
          <div>
            <h3 className="text-[16px] font-semibold text-[#f0f0f0]">{t('api.title')}</h3>
            <p className="mt-1 text-xs text-[#8b8f91]">{language === 'vi' ? 'Quản lý khóa truy cập cho widget và tích hợp.' : 'Manage access keys for widgets and integrations.'}</p>
          </div>
          <Terminal size={18} className="text-[#8b8f91]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.02)]">
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('api.table.name')}</th>
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('api.table.key')}</th>
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('api.table.date')}</th>
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('api.table.used')}</th>
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-right text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('api.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#8b8f91]">
                        <Code2 size={24} />
                      </div>
                      <p className="text-sm font-medium text-[#a1a4a5]">
                        {language === 'vi' ? 'Chưa có API key nào.' : 'No API keys yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                keys.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-[rgba(255,255,255,0.03)]">
                    <td className="px-6 py-5">
                      <span className="text-sm font-semibold text-[#f0f0f0]">{item.name}</span>
                    </td>
                    <td className="px-6 py-5">
                      <code className="rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 font-mono text-xs text-[#a1a4a5]">
                        {item.key}
                      </code>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-[#a1a4a5]">
                        {language === 'vi' 
                          ? item.date.replace('Oct', 'Thg 10').replace('Nov', 'Thg 11').replace('Dec', 'Thg 12').replace('Jan', 'Thg 1').replace('Feb', 'Thg 2').replace('Mar', 'Thg 3').replace('Apr', 'Thg 4').replace('May', 'Thg 5').replace('Jun', 'Thg 6').replace('Jul', 'Thg 7').replace('Aug', 'Thg 8').replace('Sep', 'Thg 9')
                          : item.date}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {item.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                        <span className={`text-sm ${item.status === 'never' ? 'text-[#a1a4a5] italic' : 'text-[#a1a4a5]'}`}>
                          {language === 'vi'
                            ? item.lastUsed.replace('mins ago', 'phút trước').replace('day ago', 'ngày trước').replace('days ago', 'ngày trước').replace('Never used', 'Chưa từng sử dụng').replace('Just now', 'Vừa xong')
                            : item.lastUsed}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleCopy(item.key, item.id)}
                          className="relative rounded-[12px] border border-transparent p-2 text-[#3b9eff] transition-colors hover:border-[#3b9eff]/20 hover:bg-[rgba(59,158,255,0.08)]" 
                          title="Copy Key"
                        >
                          {copyStatus === item.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        </button>
                        <button 
                          onClick={() => openRevokeModal(item)}
                          className="rounded-[12px] border border-transparent p-2 text-[#ff0000] transition-colors hover:border-[#ff0000]/20 hover:bg-[#ff0000]/10" 
                          title="Revoke Key"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── API Documentation ─────────────────────────────────────────── */}
      {selectedWidgetId && (
        <div className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#3b9eff]/20 bg-[#3b9eff]/10 text-[#3b9eff]">
                <Terminal size={18} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#f0f0f0]">API Recommend Endpoint</h3>
                <p className="mt-0.5 text-[11px] text-[#8b8f91]">{language === 'vi' ? 'Gợi ý sản phẩm từ backend TMĐT' : 'Product recommendations from your e-commerce backend'}</p>
              </div>
            </div>
            <code className="rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.3)] px-3 py-1.5 font-mono text-[11px] text-[#60a5fa]">
              {API_DOCS.endpoint}
            </code>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8b8f91]">{language === 'vi' ? 'Request Headers' : 'Request Headers'}</p>
              <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] p-3 font-mono text-[11px] text-[#a1a4a5] leading-relaxed">
                <span className="text-[#60a5fa]">X-API-Key</span>: &lt;your-api-key&gt;<br/>
                <span className="text-[#60a5fa]">Content-Type</span>: application/json
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8b8f91]">{language === 'vi' ? 'Request Body' : 'Request Body'}</p>
              <pre className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] p-4 font-mono text-[11px] text-[#a1a4a5] leading-relaxed overflow-x-auto">{`{
  "question": "Có điện thoại nào dưới 10 triệu không?",
  "pageContext": {
    "productCategory": "Điện thoại"
  },
  "topK": 5,
  "temperature": 0.2
}`}</pre>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8b8f91]">{language === 'vi' ? 'Response (JSON)' : 'Response (JSON)'}</p>
              <pre className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] p-4 font-mono text-[11px] text-[#a1a4a5] leading-relaxed overflow-x-auto">{`{
  "message": "Dạ, đây là những sản phẩm phù hợp:",
  "products": [
    {
      "id": 10,
      "name": "Samsung Galaxy A55 5G",
      "price": 9490000,
      "imageUrl": "https://...",
      "detailUrl": "/products/10",
      "reason": "Pin 5000mAh, camera 50MP"
    }
  ]
}`}</pre>
            </div>
            <div className="flex gap-3 rounded-[16px] border border-[#3b9eff]/20 bg-[#3b9eff]/10 p-4">
              <ExternalLink className="text-[#3b9eff] shrink-0" size={16} />
              <p className="text-[11px] text-[#a1a4a5] leading-relaxed">
                {language === 'vi'
                  ? 'Gọi API này từ backend của bạn. Không gọi trực tiếp từ frontend vì sẽ lộ API key.'
                  : 'Call this API from your backend. Never call it from the frontend as it would expose your API key.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] shadow-[0_18px_48px_rgba(0,0,0,0.32)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#3b9eff]/20 bg-[#3b9eff]/10 text-[#3b9eff]">
                  <KeyRound size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b8f91]">{t('nav.api_keys')}</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#ffffff]">{t('api.modal.title')}</h3>
                </div>
              </div>
              <button 
                onClick={closeGenerateModal}
                className="text-[rgba(255,255,255,0.7)] hover:text-[#ffffff] p-1 rounded-md hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {generatedKey ? (
                <div className="space-y-4">
                  <div className="space-y-4 bg-[rgba(255,255,255,0.02)] p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)]">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[#a1a4a5] uppercase tracking-widest">
                        {t('api.table.name')}
                      </p>
                      <p className="text-sm font-bold text-[#f0f0f0]">{newKeyName}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-[#a1a4a5] uppercase tracking-widest">
                        {t('api.table.key')}
                      </p>
                      <div className="flex gap-2">
                        <code className="flex-1 break-all rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-3 font-mono text-sm text-[#f0f0f0]">
                          {generatedKey}
                        </code>
                        <button 
                          onClick={() => generatedKey && handleCopy(generatedKey, 'generated')}
                          className="shrink-0 rounded-[14px] bg-[#ffffff] p-3 text-[#000000] shadow-md shadow-black/30 transition-colors hover:bg-[#f0f0f0]"
                        >
                          {copyStatus === 'generated' ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 rounded-[16px] border border-[#ff801f]/20 bg-[#ff801f]/10 p-4 text-[#ff801f]">
                    <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                    <p className="text-xs text-amber-500 leading-relaxed">
                      {t('api.modal.copy_msg')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#ffffff]">
                      {t('api.modal.name')}
                    </label>
                    <input 
                      type="text" 
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder={t('api.modal.placeholder')}
                      className="w-full rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm text-[#ffffff] outline-none transition-colors focus:border-[rgba(59,158,255,0.5)] focus:ring-2 focus:ring-[rgba(59,158,255,0.18)]"
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6">
              {generatedKey ? (
                <button 
                  onClick={closeGenerateModal}
                  className="rounded-[16px] bg-[#ffffff] px-6 py-3 text-sm font-semibold text-[#000000] shadow-md shadow-black/30 transition-colors hover:bg-[#f0f0f0]"
                >
                  {t('common.done')}
                </button>
              ) : (
                <>
                  <button 
                    onClick={closeGenerateModal}
                    className="flex-1 rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-sm font-semibold text-[#f0f0f0] transition-all hover:bg-[rgba(255,255,255,0.08)]"
                  >
                    {t('api.modal.cancel')}
                  </button>
                  <button 
                    onClick={handleGenerateKey}
                    disabled={!newKeyName.trim() || isGenerating}
                    className="flex flex-1 items-center justify-center gap-2 rounded-[16px] bg-[#ffffff] px-6 py-3 text-sm font-semibold text-[#000000] shadow-md shadow-black/30 transition-colors hover:bg-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating && <Loader2 size={16} className="animate-spin" />}
                    {t('api.generate')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Guide Modal */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] shadow-[0_18px_48px_rgba(0,0,0,0.32)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#ff801f]/20 bg-[#ff801f]/10 text-[#ff801f]">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-semibold text-[#f0f0f0]">{t('api.guide.title')}</h3>
              </div>
              <button 
                onClick={() => setIsSecurityModalOpen(false)}
                className="rounded-md p-1 text-[rgba(255,255,255,0.7)] transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-[#ffffff]"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.24)] text-sm font-black text-[#a1a4a5]">
                      0{num}
                    </div>
                    <h4 className="font-bold text-[#f0f0f0] mb-1">{t(`api.guide.step${num}.title`)}</h4>
                    <p className="text-xs leading-5 text-[#8b8f91]">{t(`api.guide.step${num}.desc`)}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 rounded-[16px] border border-[rgba(59,158,255,0.14)] bg-[rgba(59,158,255,0.06)] p-4">
                <p className="text-xs text-[#a1a4a5] leading-relaxed italic">
                  "Security is a shared responsibility. By following these steps, you protect both your account and your users' data."
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6">
              <button 
                onClick={() => setIsSecurityModalOpen(false)}
                className="rounded-[16px] bg-[#ffffff] px-6 py-3 text-sm font-semibold text-[#000000] shadow-md shadow-black/30 transition-colors hover:bg-[#f0f0f0]"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      <DeleteModal
        isOpen={isRevokeModalOpen}
        onClose={() => setIsRevokeModalOpen(false)}
        onConfirm={handleRevoke}
        title={t('api.confirm.revoke.title')}
        description={`${t('api.confirm.revoke.msg')} "${selectedKey?.name}"?`}
        warningText={t('api.confirm.revoke.undone')}
        confirmText={t('common.confirm')}
      />
    </div>
  );
}
