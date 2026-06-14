import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { getStoredAccessToken } from '../lib/auth';
import { 
  AlertTriangle,
  Check,
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
  listTenantApiKeys,
  createTenantApiKey,
  deleteTenantApiKey,
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
  askEndpoint: 'POST /api/chat/public/api/v1/ask',
  recommendEndpoint: 'POST /api/chat/public/api/v1/recommend',
  curlExample: `curl -X POST \\
  "https://your-domain.com/api/chat/public/api/v1/ask" \\
  -H "X-API-Key: <your-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "Chính sách bảo hành của công ty là gì?",
    "knowledgeBaseId": "<optional-knowledge-base-id>",
    "topK": 5,
    "temperature": 0.2
  }'`,
};

export default function APIKeys() {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [tenantId, setTenantId] = useState('');
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

  // Resolve workspace and load developer API keys.
  useEffect(() => {
    const nextTenantId = resolveTenantId();
    setTenantId(nextTenantId);
  }, []);

  useEffect(() => {
    if (!tenantId) { setKeys([]); return; }
    setIsLoadingKeys(true);
    listTenantApiKeys(tenantId)
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
  }, [tenantId, language]);

  const handleGenerateKey = async () => {
    if (!newKeyName.trim() || !tenantId) return;
    
    setIsGenerating(true);
    try {
      const result = await createTenantApiKey(tenantId, { name: newKeyName.trim() });
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

  const handleRevoke = async () => {
    if (!selectedKey) return;
    try {
      await deleteTenantApiKey(tenantId, selectedKey.id);
      setKeys(keys.filter(k => k.id !== selectedKey.id));
      showToast(t('toast.api_revoked'), 'success');
      setIsRevokeModalOpen(false);
      setSelectedKey(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke API key';
      showToast(message, 'error');
    }
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
            <div className="hidden rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-xs text-[#a1a4a5] sm:block">
              {language === 'vi' ? 'Workspace API' : 'Workspace API'}
            </div>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              disabled={!tenantId}
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
            <p className="mt-1 text-xs text-[#8b8f91]">{language === 'vi' ? 'Quản lý khóa truy cập dành cho developer trong workspace này.' : 'Manage developer access keys for this workspace.'}</p>
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
