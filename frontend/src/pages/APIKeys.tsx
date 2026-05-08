import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  ShieldCheck, 
  BookOpen, 
  ArrowRight,
  MoreHorizontal,
  X,
  FileText,
  Check,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import DeleteModal from '../components/DeleteModal';

interface APIKey {
  id: string;
  name: string;
  key: string;
  date: string;
  lastUsed: string;
  status: 'active' | 'idle' | 'never';
}

const initialApiKeys: APIKey[] = [
  { id: '1', name: 'Production Master', key: 'sk-••••••••4k2l', date: 'Oct 12, 2023', lastUsed: '2 mins ago', status: 'active' },
  { id: '2', name: 'Staging Environment', key: 'sk-••••••••9p1m', date: 'Nov 05, 2023', lastUsed: '1 day ago', status: 'idle' },
  { id: '3', name: 'Local Development', key: 'sk-••••••••2z7q', date: 'Dec 01, 2023', lastUsed: 'Never used', status: 'never' },
];

export default function APIKeys() {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [keys, setKeys] = useState<APIKey[]>(initialApiKeys);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      const newId = Math.random().toString(36).substr(2, 9);
      const randomKey = `sk-${Math.random().toString(36).substr(2, 12)}${Math.random().toString(36).substr(2, 4)}`;
      
      const newKey: APIKey = {
        id: newId,
        name: newKeyName,
        key: `sk-••••••••${randomKey.slice(-4)}`,
        date: new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        lastUsed: 'Never used',
        status: 'never'
      };
      
      setGeneratedKey(randomKey);
      setKeys([newKey, ...keys]);
      setIsGenerating(false);
      showToast(t('toast.api_generated'), 'success');
    }, 1500);
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-display font-medium tracking-tight tracking-tight text-[#f0f0f0]">{t('api.title')}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDocsModalOpen(true)}
            className="bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] text-[#f0f0f0] px-5 py-2 rounded-md font-bold text-sm flex items-center gap-2 transition-all"
          >
            <FileText size={20} />
            {t('api.quickstart')}
          </button>
          <button 
            onClick={() => setIsGenerateModalOpen(true)}
            className="bg-[#ffffff] hover:bg-[#e0e0e0] text-[#000000] px-5 py-2 rounded-md font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-black/40 shadow-primary/20"
          >
            <Plus size={20} />
            {t('api.generate')}
          </button>
        </div>
      </div>

      <div className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.02)]">
                <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('api.table.name')}</th>
                <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('api.table.key')}</th>
                <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('api.table.date')}</th>
                <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('api.table.used')}</th>
                <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider text-right">{t('api.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.3)]">
              {keys.map((item) => (
                <tr key={item.id} className="hover:bg-[rgba(255,255,255,0.02)]/50 transition-colors">
                  <td className="px-6 py-5">
                    <span className="text-sm font-semibold text-[#f0f0f0]">{item.name}</span>
                  </td>
                  <td className="px-6 py-5">
                    <code className="text-xs bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded text-[#a1a4a5] font-mono">
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
                        className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-[12px] text-[#3b9eff] transition-colors relative" 
                        title="Copy Key"
                      >
                        {copyStatus === item.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                      <button 
                        onClick={() => openRevokeModal(item)}
                        className="p-2 hover:bg-[#ff0000]/10 rounded-[12px] text-[#ff0000] transition-colors" 
                        title="Revoke Key"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[rgba(44,44,46,0.48)] backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[rgba(44,44,46,0.92)] border border-[rgba(255,255,255,0.08)] rounded-[16px] shadow-2xl shadow-black/35 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.08)]">
              <h3 className="text-lg font-bold text-[#ffffff]">{t('api.modal.title')}</h3>
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
                        <code className="flex-1 p-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-sm font-mono text-[#f0f0f0] break-all">
                          {generatedKey}
                        </code>
                        <button 
                          onClick={() => handleCopy(generatedKey, 'generated')}
                          className="p-3 bg-[#ffffff] text-[#000000] rounded-[12px] hover:bg-[#f0f0f0] transition-colors shadow-md shadow-black/30 shrink-0"
                        >
                          {copyStatus === 'generated' ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-[16px] flex gap-3">
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
                      className="w-full px-4 py-2.5 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] rounded-[8px] text-sm text-[#ffffff] focus:border-white focus:ring-2 focus:ring-white/30 outline-none transition-all"
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(44,44,46,0.92)] flex justify-center gap-3">
              {generatedKey ? (
                <button 
                  onClick={closeGenerateModal}
                  className="px-6 py-2.5 text-sm font-bold bg-[#ffffff] text-[#000000] hover:bg-[#f0f0f0] rounded-md transition-colors shadow-md shadow-black/30"
                >
                  {t('common.done')}
                </button>
              ) : (
                <>
                  <button 
                    onClick={closeGenerateModal}
                    className="px-6 py-2.5 min-w-[160px] text-sm font-bold bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.12)] hover:text-[#ffffff] rounded-md transition-all"
                  >
                    {t('api.modal.cancel')}
                  </button>
                  <button 
                    onClick={handleGenerateKey}
                    disabled={!newKeyName.trim() || isGenerating}
                    className="px-6 py-2.5 min-w-[160px] text-sm font-bold bg-[#ffffff] text-[#000000] hover:bg-[#f0f0f0] rounded-md transition-colors shadow-md shadow-black/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl shadow-black/50 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.3)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-[12px] flex items-center justify-center text-amber-500">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#f0f0f0]">{t('api.guide.title')}</h3>
              </div>
              <button 
                onClick={() => setIsSecurityModalOpen(false)}
                className="text-[#a1a4a5] hover:text-[#a1a4a5] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="p-4 bg-[rgba(255,255,255,0.02)] rounded-[16px] border border-[rgba(255,255,255,0.3)]">
                    <div className="w-8 h-8 bg-[#000000] rounded-[12px] border border-[rgba(255,255,255,0.3)] flex items-center justify-center text-sm font-black text-[#a1a4a5] mb-3">
                      0{num}
                    </div>
                    <h4 className="font-bold text-[#f0f0f0] mb-1">{t(`api.guide.step${num}.title`)}</h4>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-[rgba(59,158,255,0.05)] border border-primary/10 rounded-[16px]">
                <p className="text-xs text-[#a1a4a5] leading-relaxed italic">
                  "Security is a shared responsibility. By following these steps, you protect both your account and your users' data."
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-[rgba(255,255,255,0.3)] bg-[#000000] flex justify-end">
              <button 
                onClick={() => setIsSecurityModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold bg-[#ffffff] text-[#000000] hover:bg-[#f0f0f0] rounded-md transition-colors shadow-md shadow-black/40 shadow-primary/20"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Documentation Modal */}
      {isDocsModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl shadow-black/50 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.3)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-[12px] flex items-center justify-center text-white">
                  <FileText size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#f0f0f0]">{t('api.docs.modal.title')}</h3>
              </div>
              <button 
                onClick={() => setIsDocsModalOpen(false)}
                className="text-[#a1a4a5] hover:text-[#a1a4a5] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              <section className="space-y-2">
                <h4 className="text-sm font-bold text-[#f0f0f0] uppercase tracking-wider">{t('api.docs.endpoint.title')}</h4>
                <div className="p-3 bg-slate-900 rounded-[12px] font-mono text-xs text-emerald-400 flex items-center justify-between">
                  <span>https://api.wisebot.ai/v1</span>
                  <button onClick={() => handleCopy('https://api.wisebot.ai/v1', 'endpoint')} className="text-[#a1a4a5] hover:text-white transition-colors">
                    {copyStatus === 'endpoint' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-[#f0f0f0] uppercase tracking-wider">{t('api.docs.auth.title')}</h4>
                <div className="p-3 bg-slate-900 rounded-[12px] font-mono text-xs text-emerald-400">
                  Authorization: Bearer YOUR_API_KEY
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-[#f0f0f0] uppercase tracking-wider">{t('api.docs.example.title')}</h4>
                <div className="relative group">
                  <pre className="p-4 bg-slate-900 rounded-[16px] font-mono text-xs text-[rgba(255,255,255,0.3)] overflow-x-auto leading-relaxed">
{`curl https://api.wisebot.ai/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello WiseBot!",
    "stream": false
  }'`}
                  </pre>
                  <button 
                    onClick={() => handleCopy(`curl https://api.wisebot.ai/v1/chat -H "Authorization: Bearer YOUR_API_KEY" -H "Content-Type: application/json" -d '{"message": "Hello WiseBot!", "stream": false}'`, 'curl')}
                    className="absolute top-3 right-3 p-2 bg-[#000000]/10 hover:bg-[#000000]/20 rounded-[12px] text-[#a1a4a5] hover:text-white transition-colors"
                  >
                    {copyStatus === 'curl' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-[rgba(255,255,255,0.3)] bg-[#000000] flex justify-end">
              <button 
                onClick={() => setIsDocsModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold bg-[#ffffff] text-[#000000] hover:bg-[#f0f0f0] rounded-md transition-colors shadow-md shadow-black/40 shadow-primary/20"
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
