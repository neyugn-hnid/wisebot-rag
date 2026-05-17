import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Palette,
  ChevronDown,
  Check,
  LogOut,
  Bot,
  Database,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { useRole } from '../contexts/RoleContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import {
  getEmbeddingProviderInfo,
  getProviderInfo,
  updateEmbeddingProviderMode,
  updateProviderMode,
  type ChatProviderInfo,
} from '../api/chat';
import { useToast } from '../contexts/ToastContext';
import {
  listDocuments,
  listKnowledgeBases,
  reprocessDocument,
  type DocumentResponse,
  type KnowledgeBaseResponse,
} from '../api/knowledge-base';

interface RebuildStatusSummary {
  total: number;
  uploaded: number;
  processed: number;
  failed: number;
}

type SettingsTab = 'general' | 'ai' | 'embeddings' | 'maintenance';

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[#d7d9da]">
            {icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-[16px] font-semibold tracking-tight text-[#f5f5f5]">{title}</h3>
            {description ? <p className="max-w-2xl text-sm leading-6 text-[#8b8f91]">{description}</p> : null}
          </div>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ModeOptionCard({
  title,
  subtitle,
  badge,
  active,
  disabled,
  tone = 'neutral',
  onClick,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  active?: boolean;
  disabled?: boolean;
  tone?: 'neutral' | 'blue' | 'amber';
  onClick: () => void;
}) {
  const toneClasses = tone === 'blue'
    ? 'border-[rgba(59,158,255,0.22)] bg-[rgba(59,158,255,0.08)] hover:bg-[rgba(59,158,255,0.12)]'
    : tone === 'amber'
      ? 'border-[rgba(255,189,89,0.22)] bg-[rgba(255,189,89,0.08)] hover:bg-[rgba(255,189,89,0.12)]'
      : 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.07)]';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative w-full rounded-[20px] border p-5 text-left transition-all ${toneClasses} ${active ? 'ring-1 ring-[rgba(255,255,255,0.22)]' : ''} ${disabled ? 'cursor-not-allowed opacity-55' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#f3f3f3]">{title}</p>
            {active ? <CheckCircle2 size={15} className="text-[#7cf0ca]" /> : null}
          </div>
          <p className="text-xs leading-5 text-[#9ca1a3]">{subtitle}</p>
        </div>
        {badge ? (
          <span className="rounded-full border border-[rgba(255,255,255,0.12)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d7d9da]">
            {badge}
          </span>
        ) : null}
      </div>
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { logout, role } = useRole();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [providerInfo, setProviderInfo] = useState<ChatProviderInfo | null>(null);
  const [embeddingProviderInfo, setEmbeddingProviderInfo] = useState<ChatProviderInfo | null>(null);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [isUpdatingEmbeddingMode, setIsUpdatingEmbeddingMode] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseResponse[]>([]);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState('');
  const [isRebuildingEmbeddings, setIsRebuildingEmbeddings] = useState(false);
  const [rebuildStatus, setRebuildStatus] = useState<RebuildStatusSummary | null>(null);
  const [isLoadingRebuildStatus, setIsLoadingRebuildStatus] = useState(false);
  const [lastRebuildRefreshAt, setLastRebuildRefreshAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isKnowledgeBaseDropdownOpen, setIsKnowledgeBaseDropdownOpen] = useState(false);

  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const knowledgeBaseDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (role !== 'ADMIN') {
      return;
    }

    const loadProviderInfo = async () => {
      try {
        const [info, embeddingInfo, kbItems] = await Promise.all([
          getProviderInfo(),
          getEmbeddingProviderInfo(),
          listKnowledgeBases(),
        ]);
        setProviderInfo(info);
        setEmbeddingProviderInfo(embeddingInfo);
        setKnowledgeBases(kbItems);
        if (kbItems.length === 1) {
          setSelectedKnowledgeBaseId(kbItems[0].id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load settings.';
        showToast(message, 'error');
      }
    };

    void loadProviderInfo();
  }, [role, showToast]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(targetNode)) {
        setIsLanguageDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(targetNode)) {
        setIsThemeDropdownOpen(false);
      }
      if (knowledgeBaseDropdownRef.current && !knowledgeBaseDropdownRef.current.contains(targetNode)) {
        setIsKnowledgeBaseDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchMode = async (mode: 'ollama' | 'openai-compatible') => {
    setIsUpdatingMode(true);
    try {
      const info = await updateProviderMode({ mode });
      setProviderInfo(info);
      showToast(
        mode === 'ollama'
          ? (language === 'vi' ? 'Đã chuyển sang Ollama local.' : 'Switched to local Ollama.')
          : (language === 'vi' ? 'Đã chuyển sang DeepSeek API.' : 'Switched to DeepSeek API.'),
        'success'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update AI mode.';
      showToast(message, 'error');
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const summarizeDocuments = (documents: DocumentResponse[]): RebuildStatusSummary => ({
    total: documents.length,
    uploaded: documents.filter((doc) => doc.status === 'UPLOADED').length,
    processed: documents.filter((doc) => doc.status === 'PROCESSED').length,
    failed: documents.filter((doc) => doc.status === 'FAILED').length,
  });

  const languageOptions: Array<{ id: 'vi' | 'en'; label: string }> = [
    { id: 'vi', label: t('common.vietnamese') },
    { id: 'en', label: t('common.english') },
  ];
  const themeOptions: Array<{ id: 'light' | 'dark' | 'system'; label: string }> = [
    { id: 'light', label: t('settings.theme.light') },
    { id: 'dark', label: t('settings.theme.dark') },
    { id: 'system', label: t('settings.theme.system') },
  ];
  const languageLabel = languageOptions.find((item) => item.id === language)?.label || t('common.vietnamese');
  const themeLabel = themeOptions.find((item) => item.id === theme)?.label || t('settings.theme.system');

  const loadRebuildStatus = async (knowledgeBaseId: string, silent = false) => {
    if (!knowledgeBaseId) {
      setRebuildStatus(null);
      setLastRebuildRefreshAt(null);
      return;
    }

    if (!silent) {
      setIsLoadingRebuildStatus(true);
    }

    try {
      const documents = await listDocuments(knowledgeBaseId);
      setRebuildStatus(summarizeDocuments(documents));
      setLastRebuildRefreshAt(new Date().toLocaleTimeString());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load rebuild status.';
      showToast(message, 'error');
    } finally {
      if (!silent) {
        setIsLoadingRebuildStatus(false);
      }
    }
  };

  const handleRebuildEmbeddings = async () => {
    if (!selectedKnowledgeBaseId) {
      showToast(
        language === 'vi' ? 'Hãy chọn một knowledge base trước.' : 'Select a knowledge base first.',
        'warning'
      );
      return;
    }

    setIsRebuildingEmbeddings(true);
    try {
      const documents = await listDocuments(selectedKnowledgeBaseId);
      if (documents.length === 0) {
        showToast(
          language === 'vi' ? 'Knowledge base này chưa có tài liệu để reprocess.' : 'This knowledge base has no documents to reprocess.',
          'warning'
        );
        return;
      }

      for (const document of documents) {
        await reprocessDocument(document.id);
      }

      setRebuildStatus(summarizeDocuments(
        documents.map((document) => ({ ...document, status: 'UPLOADED' }))
      ));
      setLastRebuildRefreshAt(new Date().toLocaleTimeString());

      showToast(
        language === 'vi'
          ? `Đã gửi yêu cầu rebuild embeddings cho ${documents.length} tài liệu.`
          : `Queued embedding rebuild for ${documents.length} documents.`,
        'success'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rebuild embeddings.';
      showToast(message, 'error');
    } finally {
      setIsRebuildingEmbeddings(false);
    }
  };

  const renderModeBadge = (mode?: string, apiLabel = t('settings.badge.api')) => (
    <span
      className={
        mode === 'ollama'
          ? 'inline-flex items-center rounded-full border border-[rgba(120,255,214,0.22)] bg-[rgba(120,255,214,0.12)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#7cf0ca]'
          : 'inline-flex items-center rounded-full border border-[rgba(255,189,89,0.22)] bg-[rgba(255,189,89,0.12)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#ffcc80]'
      }
    >
      {mode === 'ollama' ? t('settings.badge.local') : apiLabel}
    </span>
  );

  useEffect(() => {
    if (role !== 'ADMIN' || !selectedKnowledgeBaseId) {
      return;
    }
    void loadRebuildStatus(selectedKnowledgeBaseId);
  }, [role, selectedKnowledgeBaseId]);

  useEffect(() => {
    if (!selectedKnowledgeBaseId) {
      return;
    }

    const shouldPoll = isRebuildingEmbeddings || Boolean(rebuildStatus?.uploaded);
    if (!shouldPoll) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadRebuildStatus(selectedKnowledgeBaseId, true);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [selectedKnowledgeBaseId, isRebuildingEmbeddings, rebuildStatus?.uploaded]);

  const handleSwitchEmbeddingMode = async (mode: 'ollama' | 'openai-compatible') => {
    setIsUpdatingEmbeddingMode(true);
    try {
      const info = await updateEmbeddingProviderMode({ mode });
      setEmbeddingProviderInfo(info);
      showToast(
        mode === 'ollama'
          ? (language === 'vi' ? 'Đã chuyển embedding sang Ollama local.' : 'Switched embeddings to local Ollama.')
          : (language === 'vi' ? 'Đã chuyển embedding sang API mode.' : 'Switched embeddings to API mode.'),
        'success'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update embedding mode.';
      showToast(message, 'error');
    } finally {
      setIsUpdatingEmbeddingMode(false);
    }
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode; adminOnly?: boolean }> = [
    { id: 'general', label: t('settings.tabs.general'), icon: <Globe size={15} /> },
    { id: 'ai', label: t('settings.tabs.ai'), icon: <Bot size={15} />, adminOnly: true },
    { id: 'embeddings', label: t('settings.tabs.embeddings'), icon: <Database size={15} />, adminOnly: true },
    { id: 'maintenance', label: t('settings.tabs.maintenance'), icon: <RefreshCw size={15} />, adminOnly: true },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <section className="rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#9fa3a5]">
            <Cpu size={13} />
            {t('settings.control_center')}
          </div>
          <h2 className="mt-4 text-[30px] font-display font-medium tracking-tight text-[#f0f0f0]">{t('settings.title')}</h2>
          <p className="mt-2 text-sm leading-6 text-[#8b8f91]">{t('settings.control_center.desc')}</p>
        </div>
      </section>

      <div className="rounded-[22px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {tabs
          .filter((tab) => !tab.adminOnly || role === 'ADMIN')
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center justify-center gap-2 rounded-[16px] border px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'border-[rgba(59,158,255,0.32)] bg-[rgba(59,158,255,0.12)] text-[#f5f8ff]'
                  : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-[#9fa3a5] hover:bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === 'general' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <SettingsSection
              icon={<Globe size={18} />}
              title={t('settings.language')}
              description={t('settings.language.desc')}
            >
              <div className="max-w-60">
                <div ref={languageDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsLanguageDropdownOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-3 rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-left text-sm text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,158,255,0.24)]"
                  >
                    <span className="min-w-0 truncate">{languageLabel}</span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "shrink-0 text-[#8d9295] transition-transform",
                        isLanguageDropdownOpen ? "rotate-180" : ""
                      )}
                    />
                  </button>
                  {isLanguageDropdownOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[#0b0b0c] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.42)]">
                      <div className="space-y-1">
                        {languageOptions.map((item) => {
                          const isSelected = item.id === language;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setLanguage(item.id);
                                setIsLanguageDropdownOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
                                isSelected
                                  ? "bg-[rgba(59,158,255,0.10)] text-[#f0f0f0]"
                                  : "text-[#c9cdcf] hover:bg-[rgba(255,255,255,0.05)]"
                              )}
                            >
                              <span className="truncate">{item.label}</span>
                              {isSelected ? <Check size={15} className="text-[#3b9eff]" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              icon={<Palette size={18} />}
              title={t('settings.appearance')}
              description={t('settings.appearance.desc')}
            >
              <div className="max-w-60">
                <div ref={themeDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsThemeDropdownOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-3 rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-left text-sm text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,158,255,0.24)]"
                  >
                    <span className="min-w-0 truncate">{themeLabel}</span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "shrink-0 text-[#8d9295] transition-transform",
                        isThemeDropdownOpen ? "rotate-180" : ""
                      )}
                    />
                  </button>
                  {isThemeDropdownOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[#0b0b0c] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.42)]">
                      <div className="space-y-1">
                        {themeOptions.map((item) => {
                          const isSelected = item.id === theme;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setTheme(item.id);
                                setIsThemeDropdownOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
                                isSelected
                                  ? "bg-[rgba(59,158,255,0.10)] text-[#f0f0f0]"
                                  : "text-[#c9cdcf] hover:bg-[rgba(255,255,255,0.05)]"
                              )}
                            >
                              <span className="truncate">{item.label}</span>
                              {isSelected ? <Check size={15} className="text-[#3b9eff]" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </SettingsSection>
          </div>
        )}

        {role === 'ADMIN' && activeTab === 'ai' && (
          <SettingsSection
            icon={<Sparkles size={18} />}
            title={t('settings.ai.title')}
            description={t('settings.ai.desc')}
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#f0f0f0]">
                    {providerInfo?.provider_name || t('settings.ai.provider_unknown')}
                  </p>
                  <p className="text-xs text-[#a1a4a5]">
                    {providerInfo?.model_name || t('settings.ai.model_missing')}
                  </p>
                </div>
                {renderModeBadge(providerInfo?.mode)}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[#7d8183]">
                  {providerInfo?.mode === 'ollama' ? t('settings.ai.current.local') : t('settings.ai.current.api')}
                </p>
                <p className="text-xs text-[#7d8183]">{t('settings.ai.persisted')}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <ModeOptionCard
                  title="Ollama Local"
                  subtitle={t('settings.ai.local_desc')}
                  badge={t('settings.badge.local')}
                  active={providerInfo?.mode === 'ollama'}
                  disabled={isUpdatingMode || providerInfo?.mode === 'ollama'}
                  onClick={() => void handleSwitchMode('ollama')}
                />
                <ModeOptionCard
                  title="DeepSeek API"
                  subtitle={t('settings.ai.api_desc')}
                  badge={t('settings.badge.api')}
                  tone="blue"
                  active={providerInfo?.mode === 'openai-compatible'}
                  disabled={isUpdatingMode || providerInfo?.mode === 'openai-compatible'}
                  onClick={() => void handleSwitchMode('openai-compatible')}
                />
              </div>
            </div>
          </SettingsSection>
        )}

        {role === 'ADMIN' && activeTab === 'embeddings' && (
          <SettingsSection
            icon={<Database size={18} />}
            title={t('settings.embedding.title')}
            description={t('settings.embedding.desc')}
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#f0f0f0]">
                    {embeddingProviderInfo?.provider_name || t('settings.ai.provider_unknown')}
                  </p>
                  <p className="text-xs text-[#a1a4a5]">
                    {embeddingProviderInfo?.model_name || t('settings.ai.model_missing')}
                  </p>
                </div>
                {renderModeBadge(embeddingProviderInfo?.mode)}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[#7d8183]">
                  {embeddingProviderInfo?.mode === 'ollama'
                    ? t('settings.embedding.current.local')
                    : t('settings.embedding.current.api')}
                </p>
                <p className="text-xs text-[#7d8183]">{t('settings.embedding.persisted')}</p>
              </div>

              <div className="rounded-[18px] border border-[#ff801f]/20 bg-[#ff801f]/10 p-4 text-xs leading-6 text-[#f0d39c]">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#ff801f]" />
                  <p>{t('settings.embedding.warning')}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <ModeOptionCard
                  title="Ollama Local"
                  subtitle={t('settings.embedding.local_desc')}
                  badge={t('settings.badge.local')}
                  active={embeddingProviderInfo?.mode === 'ollama'}
                  disabled={isUpdatingEmbeddingMode || embeddingProviderInfo?.mode === 'ollama'}
                  onClick={() => void handleSwitchEmbeddingMode('ollama')}
                />
                <ModeOptionCard
                  title="API Embeddings"
                  subtitle={t('settings.embedding.api_desc')}
                  badge={t('settings.badge.api')}
                  tone="amber"
                  active={embeddingProviderInfo?.mode === 'openai-compatible'}
                  disabled={isUpdatingEmbeddingMode || embeddingProviderInfo?.mode === 'openai-compatible'}
                  onClick={() => void handleSwitchEmbeddingMode('openai-compatible')}
                />
              </div>
            </div>
          </SettingsSection>
        )}

        {role === 'ADMIN' && activeTab === 'maintenance' && (
          <SettingsSection
            icon={<RefreshCw size={18} />}
            title={t('settings.rebuild.title')}
            description={t('settings.rebuild.desc')}
          >
            <div className="space-y-5">
              <p className="text-xs text-[#7d8183]">{t('settings.rebuild.helper')}</p>

              <div className="max-w-md">
                <div ref={knowledgeBaseDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsKnowledgeBaseDropdownOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-3 rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-left text-sm text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,158,255,0.24)]"
                  >
                    <span className="min-w-0 truncate">
                      {selectedKnowledgeBaseId
                        ? (knowledgeBases.find((item) => item.id === selectedKnowledgeBaseId)?.name || t('settings.rebuild.select_kb'))
                        : t('settings.rebuild.select_kb')}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "shrink-0 text-[#8d9295] transition-transform",
                        isKnowledgeBaseDropdownOpen ? "rotate-180" : ""
                      )}
                    />
                  </button>
                  {isKnowledgeBaseDropdownOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[#0b0b0c] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.42)]">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedKnowledgeBaseId('');
                          setIsKnowledgeBaseDropdownOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
                          !selectedKnowledgeBaseId
                            ? "bg-[rgba(59,158,255,0.10)] text-[#f0f0f0]"
                            : "text-[#c9cdcf] hover:bg-[rgba(255,255,255,0.05)]"
                        )}
                      >
                        <span className="truncate">{t('settings.rebuild.select_kb')}</span>
                        {!selectedKnowledgeBaseId ? <Check size={15} className="text-[#3b9eff]" /> : null}
                      </button>
                      <div className="mt-1 space-y-1">
                        {knowledgeBases.map((kb) => {
                          const isSelected = kb.id === selectedKnowledgeBaseId;
                          return (
                            <button
                              key={kb.id}
                              type="button"
                              onClick={() => {
                                setSelectedKnowledgeBaseId(kb.id);
                                setIsKnowledgeBaseDropdownOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
                                isSelected
                                  ? "bg-[rgba(59,158,255,0.10)] text-[#f0f0f0]"
                                  : "text-[#c9cdcf] hover:bg-[rgba(255,255,255,0.05)]"
                              )}
                            >
                              <span className="truncate">{kb.name}</span>
                              {isSelected ? <Check size={15} className="text-[#3b9eff]" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 rounded-[18px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a1a4a5]">
                    {t('settings.rebuild.status')}
                  </p>
                  <button
                    onClick={() => void loadRebuildStatus(selectedKnowledgeBaseId)}
                    disabled={isLoadingRebuildStatus || !selectedKnowledgeBaseId}
                    className="inline-flex items-center gap-2 rounded-[12px] border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-[11px] font-bold text-[#d7d9da] transition-all hover:bg-[rgba(255,255,255,0.06)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isLoadingRebuildStatus ? 'animate-spin' : ''} />
                    {t('settings.rebuild.refresh')}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#7d8183]">{t('settings.rebuild.total')}</p>
                    <p className="mt-1 text-lg font-bold text-[#f0f0f0]">{rebuildStatus?.total ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-[rgba(255,189,89,0.12)] bg-[rgba(255,189,89,0.06)] p-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#cda86e]">UPLOADED</p>
                    <p className="mt-1 text-lg font-bold text-[#ffcc80]">{rebuildStatus?.uploaded ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-[rgba(120,255,214,0.12)] bg-[rgba(120,255,214,0.06)] p-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#86d8c1]">PROCESSED</p>
                    <p className="mt-1 text-lg font-bold text-[#7cf0ca]">{rebuildStatus?.processed ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-[rgba(255,120,120,0.12)] bg-[rgba(255,120,120,0.06)] p-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#d48a8a]">FAILED</p>
                    <p className="mt-1 text-lg font-bold text-[#ff9a9a]">{rebuildStatus?.failed ?? 0}</p>
                  </div>
                </div>

                <p className="text-[11px] text-[#7d8183]">
                  {lastRebuildRefreshAt
                    ? `${t('settings.rebuild.last_updated')} ${lastRebuildRefreshAt}`
                    : t('settings.rebuild.empty')}
                </p>
              </div>

              <button
                onClick={() => void handleRebuildEmbeddings()}
                disabled={isRebuildingEmbeddings || !selectedKnowledgeBaseId}
                className="inline-flex items-center gap-2 rounded-[14px] border border-[#ff801f]/25 bg-[#ff801f]/10 px-4 py-3 text-sm font-bold text-[#ff801f] transition-all hover:bg-[#ff801f]/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={16} className={isRebuildingEmbeddings ? 'animate-spin' : ''} />
                {isRebuildingEmbeddings ? t('settings.rebuild.queuing') : t('settings.rebuild.queue')}
              </button>
            </div>
          </SettingsSection>
        )}

        <div className="border-t border-[rgba(255,255,255,0.08)] pt-8">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-5 py-2.5 text-sm font-bold text-[#f0f0f0] transition-all hover:bg-[rgba(255,255,255,0.12)] hover:text-[#ffffff]"
          >
            <LogOut size={16} />
            {t('profile.sign_out')}
          </button>
        </div>
      </div>
    </div>
  );
}
