import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';
import ChatWidget from '../components/ChatWidget';
import { 
  Bot, 
  Palette, 
  MessageSquare, 
  Code,
  Paperclip, 
  Smile,
  Check,
  CheckCircle2,
  ChevronDown,
  Monitor,
  Smartphone,
  Sparkles,
  Brain,
  Cpu,
  MessageCircle,
  Zap,
  Star,
  User,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredAccessToken } from '../lib/auth';
import { CustomRobotLogo } from '../components/Logo';
import { listKnowledgeBases, type KnowledgeBaseResponse } from '../api/knowledge-base';
import {
  listWidgets,
  createWidget,
  updateWidget,
  listWidgetDomains,
  addWidgetDomain,
  type WidgetResponse,
  type WidgetAppearanceConfig,
  type DomainResponse,
} from '../api/widget';
import { getMySubscription, listPlans, type BillingPlanResponse, type SubscriptionResponse } from '../api/billing';

const BOT_ICONS = [
  { id: 'bot', icon: CustomRobotLogo },
  { id: 'sparkles', icon: Sparkles },
  { id: 'brain', icon: Brain },
  { id: 'cpu', icon: Cpu },
  { id: 'message', icon: MessageCircle },
  { id: 'zap', icon: Zap },
  { id: 'smile', icon: Smile },
  { id: 'star', icon: Star },
  { id: 'user', icon: User },
];

interface WidgetSettings extends WidgetAppearanceConfig {
  botName?: string;
  welcomeMsg?: string;
}

const WIDGET_SETTINGS_STORAGE_KEY = 'wisebot_widget_settings';
const WIDGET_SCRIPT_VERSION = '20260612-rich-stream';

export default function WidgetCustomization() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const fieldClass = "w-full rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[#f0f0f0] outline-none transition-colors placeholder:text-[#7d8183] focus:border-[#ffffff] focus:bg-[rgba(255,255,255,0.06)] focus:ring-[#ffffff] disabled:cursor-not-allowed disabled:opacity-60";
  const sectionCardClass = "rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]";
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [position, setPosition] = useState<'right' | 'left'>('right');
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const [mobileTab, setMobileTab] = useState<'settings' | 'preview'>('settings');
  const [activeTab, setActiveTab] = useState<'appearance' | 'embed'>('appearance');
  const [selectedIconId, setSelectedIconId] = useState('bot');
  const [botName, setBotName] = useState(t('widget.default_name'));
  const [welcomeMsg, setWelcomeMsg] = useState(t('widget.default_welcome'));
  const [iconColor, setIconColor] = useState('#ffffff');
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);
  const [knowledgeBaseId, setKnowledgeBaseId] = useState('');
  const [topK, setTopK] = useState(5);
  const [temperature, setTemperature] = useState(0.2);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(['']);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [widget, setWidget] = useState<WidgetResponse | null>(null);
  const [isLoadingWidget, setIsLoadingWidget] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseResponse[]>([]);
  const [allowedDomains, setAllowedDomains] = useState<DomainResponse[]>([]);
  const [domainInput, setDomainInput] = useState('');
  const [allowSubdomains, setAllowSubdomains] = useState(true);
  const [isLoadingKnowledgeBases, setIsLoadingKnowledgeBases] = useState(false);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  const [widgetCustomizationEnabled, setWidgetCustomizationEnabled] = useState(true);
  const [isKnowledgeBaseDropdownOpen, setIsKnowledgeBaseDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const knowledgeBaseDropdownRef = useRef<HTMLDivElement>(null);
  const hasHydratedLocalSettings = useRef(false);

  const SelectedIcon = BOT_ICONS.find(i => i.id === selectedIconId)?.icon || Bot;
  const widgetScriptSrc = typeof window !== 'undefined'
    ? `${window.location.origin}/widget.js?v=${WIDGET_SCRIPT_VERSION}`
    : `https://cdn.wisebot.ai/widget.js?v=${WIDGET_SCRIPT_VERSION}`;
  const widgetApiBase = typeof window !== 'undefined' ? window.location.origin : 'https://app.wisebot.ai';

  const widgetScript = widget?.code
    ? `<script src="${widgetScriptSrc}" data-id="${widget.code}" data-api-base="${widgetApiBase}" data-session-ttl-hours="24" async></script>`
    : '<!-- Publish widget to generate embed code -->';

  const hasAllowedDomain = allowedDomains.length > 0;

  const parseJwtPayload = (token: string): Record<string, unknown> | null => {
    try {
      const payloadSegment = token.split('.')[1];
      if (!payloadSegment) return null;
      const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const json = atob(padded);
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const resolveTenantIdFromToken = () => {
    const token = getStoredAccessToken();
    const payload = token ? parseJwtPayload(token) : null;
    return typeof payload?.tenantId === 'string' ? payload.tenantId.trim() : '';
  };

  const resolveUserIdFromToken = () => {
    const token = getStoredAccessToken();
    const payload = token ? parseJwtPayload(token) : null;
    return typeof payload?.userId === 'string' ? payload.userId.trim() : '';
  };

  const generateWidgetCode = () => {
    return `wb_${Math.random().toString(36).slice(2, 10)}`;
  };

  const normalizeWebsiteDomain = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      return '';
    }

    try {
      const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
      return url.hostname.replace(/^www\./, '');
    } catch {
      const host = trimmed.replace(/^https?:\/\//, '').split('/')[0] || '';
      return host.replace(/^www\./, '');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        knowledgeBaseDropdownRef.current
        && !knowledgeBaseDropdownRef.current.contains(event.target as Node)
      ) {
        setIsKnowledgeBaseDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    try {
      const savedSettings = window.localStorage.getItem(WIDGET_SETTINGS_STORAGE_KEY);
      if (!savedSettings) {
        return;
      }

      const parsed = JSON.parse(savedSettings) as WidgetSettings;
      hasHydratedLocalSettings.current = true;
      if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
      if (parsed.botName) setBotName(parsed.botName);
      if (parsed.welcomeMsg) setWelcomeMsg(parsed.welcomeMsg);
      if (parsed.selectedIconId) setSelectedIconId(parsed.selectedIconId);
      if (parsed.iconColor) setIconColor(parsed.iconColor);
      if (parsed.customIconUrl !== undefined) setCustomIconUrl(parsed.customIconUrl);
      if (parsed.position) setPosition(parsed.position);
      if (parsed.knowledgeBaseId) setKnowledgeBaseId(parsed.knowledgeBaseId);
      if (typeof parsed.topK === 'number') setTopK(parsed.topK);
      if (typeof parsed.temperature === 'number') setTemperature(parsed.temperature);
    } catch {
      window.localStorage.removeItem(WIDGET_SETTINGS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadEntitlement() {
      try {
        const [plans, subscription] = await Promise.all([
          listPlans().catch(() => [] as BillingPlanResponse[]),
          getMySubscription().catch(() => null as SubscriptionResponse | null),
        ]);
        const plan = plans.find((item) => item.id === subscription?.planId);
        if (!cancelled) {
          setWidgetCustomizationEnabled((plan?.code || 'free').toLowerCase() !== 'free');
        }
      } catch {
        if (!cancelled) {
          setWidgetCustomizationEnabled(false);
        }
      }
    }

    void loadEntitlement();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (widgetCustomizationEnabled) {
      return;
    }

    setPrimaryColor('#2563EB');
    setSelectedIconId('bot');
    setCustomIconUrl(null);
    setIconColor('#ffffff');
  }, [widgetCustomizationEnabled]);

  useEffect(() => {
    const loadKnowledgeBases = async () => {
      const tenantId = resolveTenantIdFromToken();
      if (!tenantId) {
        return;
      }

      setIsLoadingKnowledgeBases(true);
      try {
        const allItems = await listKnowledgeBases();
        const tenantItems = allItems.filter((item) => item.tenantId === tenantId);
        const scopedItems = tenantItems.length > 0 ? tenantItems : allItems;
        setKnowledgeBases(scopedItems);

        const onlyKnowledgeBase = scopedItems[0];
        if (!knowledgeBaseId && scopedItems.length === 1 && onlyKnowledgeBase?.id) {
          setKnowledgeBaseId(onlyKnowledgeBase.id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t('widget.kb_load_failed');
        showToast(message, 'error');
      } finally {
        setIsLoadingKnowledgeBases(false);
      }
    };

    void loadKnowledgeBases();
  }, [showToast]);

  useEffect(() => {
    const loadWidget = async () => {
      const tenantId = resolveTenantIdFromToken();
      if (!tenantId) {
        return;
      }

      setIsLoadingWidget(true);
      try {
        const widgets = await listWidgets(tenantId);
        const existingWidget = widgets[0] ?? null;
        setWidget(existingWidget);

        if (existingWidget) {
          if (!hasHydratedLocalSettings.current) {
            setBotName(existingWidget.name || t('widget.default_name'));
            setWelcomeMsg(existingWidget.welcomeMessage || t('widget.default_welcome'));
            if (existingWidget.appearanceConfig?.primaryColor) {
              setPrimaryColor(existingWidget.appearanceConfig.primaryColor);
            }
            if (existingWidget.appearanceConfig?.position === 'left' || existingWidget.appearanceConfig?.position === 'right') {
              setPosition(existingWidget.appearanceConfig.position);
            }
            if (existingWidget.appearanceConfig?.iconColor) {
              setIconColor(existingWidget.appearanceConfig.iconColor);
            }
            if (existingWidget.appearanceConfig?.selectedIconId) {
              setSelectedIconId(existingWidget.appearanceConfig.selectedIconId);
            }
            if (existingWidget.appearanceConfig?.customIconUrl !== undefined) {
              setCustomIconUrl(existingWidget.appearanceConfig.customIconUrl);
            }
            if (existingWidget.appearanceConfig?.knowledgeBaseId) {
              setKnowledgeBaseId(existingWidget.appearanceConfig.knowledgeBaseId);
            }
            if (typeof existingWidget.appearanceConfig?.topK === 'number') {
              setTopK(existingWidget.appearanceConfig.topK);
            }
            if (typeof existingWidget.appearanceConfig?.temperature === 'number') {
              setTemperature(existingWidget.appearanceConfig.temperature);
            }
            if (Array.isArray(existingWidget.appearanceConfig?.suggestedQuestions)) {
              const sq = existingWidget.appearanceConfig.suggestedQuestions.filter(Boolean);
              setSuggestedQuestions(sq.length > 0 ? sq : ['']);
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t('widget.load_failed');
        showToast(message, 'error');
      } finally {
        setIsLoadingWidget(false);
      }
    };

    void loadWidget();
  }, [showToast]);

  useEffect(() => {
    const widgetId = widget?.id;
    if (!widgetId) {
      setAllowedDomains([]);
      return;
    }

    let cancelled = false;
    async function loadDomains(activeWidgetId: string) {
      setIsLoadingDomains(true);
      try {
        const domains = await listWidgetDomains(activeWidgetId);
        if (!cancelled) {
          setAllowedDomains(domains);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : t('widget.domain_load_failed');
          showToast(message, 'error');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDomains(false);
        }
      }
    }

    void loadDomains(widgetId);
    return () => {
      cancelled = true;
    };
  }, [widget?.id, showToast, t]);

  const handleCopyCode = () => {
    if (!widget?.code) {
      showToast(t('widget.publish_first'), 'error');
      return;
    }
    if (!hasAllowedDomain) {
      showToast(t('widget.domain_required'), 'error');
      return;
    }

    navigator.clipboard.writeText(widgetScript);
    setIsCopied(true);
    showToast(t('widget.code_copied'), 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const saveWidgetSettings = async () => {
    const settings = {
      primaryColor,
      botName,
      welcomeMsg,
      selectedIconId,
      iconColor,
      customIconUrl,
      position,
      knowledgeBaseId,
      topK,
      temperature,
    };
    localStorage.setItem(WIDGET_SETTINGS_STORAGE_KEY, JSON.stringify(settings));

    const tenantId = resolveTenantIdFromToken();
    if (!tenantId) {
      throw new Error(t('widget.tenant_missing'));
    }

    const appearanceConfig = {
      primaryColor: widgetCustomizationEnabled ? primaryColor : '#2563EB',
      position,
      iconColor: widgetCustomizationEnabled ? iconColor : '#ffffff',
      selectedIconId: widgetCustomizationEnabled ? selectedIconId : 'bot',
      customIconUrl: widgetCustomizationEnabled ? customIconUrl : null,
      knowledgeBaseId: knowledgeBaseId || null,
      topK,
      temperature,
      suggestedQuestions: suggestedQuestions.filter(q => q.trim().length > 0),
    };

    let activeWidget = widget;
    if (!activeWidget) {
      activeWidget = await createWidget({
        tenantId,
        name: botName.trim() || t('widget.default_name'),
        code: generateWidgetCode(),
        welcomeMessage: welcomeMsg.trim(),
        createdBy: resolveUserIdFromToken() || null,
        appearanceConfig,
      });
    } else {
      activeWidget = await updateWidget(activeWidget.id, {
        name: botName.trim() || t('widget.default_name'),
        welcomeMessage: welcomeMsg.trim(),
        appearanceConfig,
      });
    }

    setWidget(activeWidget);
    return activeWidget;
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      await saveWidgetSettings();

      setIsPublishing(false);
      showToast(t('widget.publish_success'), 'success');
    } catch (error) {
      setIsPublishing(false);
      const message = error instanceof Error ? error.message : t('widget.publish_failed');
      showToast(message, 'error');
    }
  };

  const handleAddDomain = async () => {
    const domain = normalizeWebsiteDomain(domainInput);
    if (!/^(localhost|[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)$/.test(domain)) {
      showToast(t('widget.domain_invalid'), 'error');
      return;
    }
    if (allowedDomains.some((item) => item.domain.replace(/^www\./, '').toLowerCase() === domain)) {
      showToast(t('widget.domain_exists'), 'error');
      return;
    }

    setIsSavingDomain(true);
    try {
      let activeWidget = widget?.id ? widget : null;
      if (!activeWidget) {
        // Load widget từ API trước khi tạo mới
        const tenantId = resolveTenantIdFromToken();
        if (tenantId) {
          const widgets = await listWidgets(tenantId);
          activeWidget = widgets[0] || null;
        }
      }
      if (!activeWidget) {
        activeWidget = await saveWidgetSettings();
      }
      const created = await addWidgetDomain(activeWidget.id, { domain, allowSubdomains });
      setAllowedDomains((prev) => [...prev, created]);
      setDomainInput('');
      showToast(t('widget.domain_added'), 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('widget.domain_add_failed');
      showToast(message, 'error');
    } finally {
      setIsSavingDomain(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!widgetCustomizationEnabled) {
      showToast(t('widget.custom_icon_locked'), 'error');
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomIconUrl(url);
      setSelectedIconId('custom');
    }
  };

  const removeCustomIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomIconUrl(null);
    if (selectedIconId === 'custom') {
      setSelectedIconId('bot');
    }
  };

  const PRESET_COLORS = [
    '#2563EB', // Primary Blue
    '#0ea5e9', // Sky
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#64748b', // Slate
    '#000000', // Black
    '#ffffff', // White
  ];

  const selectedKnowledgeBase = knowledgeBases.find((item) => item.id === knowledgeBaseId) || null;
  const canChooseKnowledgeBase = !isLoadingKnowledgeBases && knowledgeBases.length > 1;
  const knowledgeBaseDropdownLabel = isLoadingKnowledgeBases
    ? t('widget.kb_loading')
    : knowledgeBases.length === 0
      ? t('widget.kb_select')
      : selectedKnowledgeBase?.name || t('widget.kb_select');

  return (
    <div className="-m-4 lg:-m-8 h-screen flex flex-col lg:flex-row overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,158,255,0.08),transparent_28%),#050505] relative w-[calc(100%+32px)] lg:w-[calc(100%+64px)]">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex shrink-0 border-b border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl z-20">
        <button 
          onClick={() => setMobileTab('settings')}
          className={cn(
            "flex-1 py-3 text-xs font-bold transition-colors",
            mobileTab === 'settings' ? "text-[#f0f0f0] border-b-2 border-[#3b9eff]" : "text-[#8b8f91]"
          )}
        >
          {t('widget.settings_tab')}
        </button>
        <button 
          onClick={() => setMobileTab('preview')}
          className={cn(
            "flex-1 py-3 text-xs font-bold transition-colors",
            mobileTab === 'preview' ? "text-[#f0f0f0] border-b-2 border-[#3b9eff]" : "text-[#8b8f91]"
          )}
        >
          {t('widget.preview_tab')}
        </button>
      </div>

      {/* Settings Panel */}
      <div className={cn(
        "w-full lg:w-[430px] border-r border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] flex flex-col flex-1 lg:flex-none overflow-y-auto scrollbar-hide backdrop-blur-xl",
        mobileTab === 'preview' ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-6 border-b border-[rgba(255,255,255,0.1)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#9fa3a5]">
            <Sparkles size={13} />
            {t('widget.title')}
          </div>
          
          <div className="flex gap-1 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-1 mt-6">
            <button 
              onClick={() => setActiveTab('appearance')}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-[12px] transition-all",
                activeTab === 'appearance' ? "bg-[rgba(255,255,255,0.08)] text-[#f0f0f0]" : "text-[#8b8f91] hover:text-[#f0f0f0]"
              )}
            >
              {t('widget.general')}
            </button>
            <button 
              onClick={() => setActiveTab('embed')}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-[12px] transition-all",
                activeTab === 'embed' ? "bg-[rgba(255,255,255,0.08)] text-[#f0f0f0]" : "text-[#8b8f91] hover:text-[#f0f0f0]"
              )}
            >
              {t('nav.integration')}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {activeTab === 'appearance' ? (
            <>
              {!widgetCustomizationEnabled && (
                <div className="rounded-[18px] border border-[rgba(255,176,32,0.24)] bg-[rgba(255,176,32,0.08)] p-4 text-sm leading-6 text-[#f3ddb0]">
                  {t('widget.free_lock')}
                </div>
              )}
              {/* Bot Identity */}
              <section className={cn("space-y-4", sectionCardClass)}>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a1a4a5]">
              <Bot size={14} /> {t('widget.identity')}
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('widget.display_name')}</label>
                <input 
                  type="text" 
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('widget.welcome_message')}</label>
                <textarea 
                  value={welcomeMsg}
                  onChange={(e) => setWelcomeMsg(e.target.value)}
                  rows={2}
                  className={cn(fieldClass, "resize-none")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('widget.suggested_questions') || 'Câu hỏi gợi ý'}</label>
                {suggestedQuestions.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={q}
                      onChange={(e) => {
                        const next = [...suggestedQuestions];
                        next[i] = e.target.value;
                        setSuggestedQuestions(next);
                      }}
                      placeholder={t('widget.suggested_placeholder') || 'VD: Chính sách bảo hành thế nào?'}
                      className={fieldClass}
                    />
                    {suggestedQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSuggestedQuestions(suggestedQuestions.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-300 text-lg px-2"
                      >×</button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSuggestedQuestions([...suggestedQuestions, ''])}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                >
                  + {t('widget.add_question') || 'Thêm câu hỏi'}
                </button>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('widget.kb_label')}</label>
                <div ref={knowledgeBaseDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (canChooseKnowledgeBase) {
                        setIsKnowledgeBaseDropdownOpen((prev) => !prev);
                      }
                    }}
                    disabled={!canChooseKnowledgeBase}
                    className="flex w-full items-center justify-between gap-3 rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-left text-sm text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,158,255,0.24)] disabled:cursor-not-allowed disabled:text-[#a1a4a5] disabled:opacity-70"
                  >
                    <span className="min-w-0 truncate">{knowledgeBaseDropdownLabel}</span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "shrink-0 text-[#8d9295] transition-transform",
                        isKnowledgeBaseDropdownOpen ? "rotate-180" : ""
                      )}
                    />
                  </button>

                  {isKnowledgeBaseDropdownOpen && canChooseKnowledgeBase ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[#0b0b0c] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.42)]">
                      <button
                        type="button"
                        onClick={() => {
                          setKnowledgeBaseId('');
                          setIsKnowledgeBaseDropdownOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
                          !knowledgeBaseId
                            ? "bg-[rgba(59,158,255,0.10)] text-[#f0f0f0]"
                            : "text-[#c9cdcf] hover:bg-[rgba(255,255,255,0.05)]"
                        )}
                      >
                        <span className="truncate">{t('widget.kb_select')}</span>
                        {!knowledgeBaseId ? <Check size={15} className="text-[#3b9eff]" /> : null}
                      </button>
                      <div className="mt-1 space-y-1">
                        {knowledgeBases.map((kb) => {
                          const isSelected = kb.id === knowledgeBaseId;
                          return (
                            <button
                              key={kb.id}
                              type="button"
                              onClick={() => {
                                setKnowledgeBaseId(kb.id);
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#f0f0f0]">{t('playground.topk')}</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={topK}
                    onChange={(e) => setTopK(Math.max(1, Number(e.target.value) || 1))}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#f0f0f0]">{t('playground.temp')}</label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={temperature}
                    onChange={(e) => setTemperature(Math.min(1, Math.max(0, Number(e.target.value) || 0)))}
                    className={fieldClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('widget.bot_icon')}</label>
                <div className="grid grid-cols-5 gap-2">
                  {BOT_ICONS.map((item) => (
                    <button
                      key={item.id}
                      disabled={!widgetCustomizationEnabled}
                      onClick={() => setSelectedIconId(item.id)}
                      className={cn(
                        "w-10 h-10 rounded-[12px] flex items-center justify-center transition-all border",
                        !widgetCustomizationEnabled
                          ? "bg-[#151517] text-[#6b7280] border border-[rgba(255,255,255,0.15)] cursor-not-allowed"
                          : selectedIconId === item.id 
                            ? "text-white border border-transparent shadow-md shadow-black/40" 
                            : "bg-[#151517] text-[#a1a4a5] border border-[rgba(255,255,255,0.3)] hover:border-primary/50 hover:text-[#3b9eff]"
                      )}
                      style={widgetCustomizationEnabled && selectedIconId === item.id ? { backgroundColor: primaryColor, boxShadow: `0 4px 12px ${primaryColor}33` } : {}}
                    >
                      <item.icon size={18} />
                    </button>
                  ))}
                  
                  {/* Custom Uploaded Icon */}
                  {customIconUrl ? (
                    <button
                      disabled={!widgetCustomizationEnabled}
                      onClick={() => setSelectedIconId('custom')}
                      className={cn(
                        "w-10 h-10 rounded-[12px] flex items-center justify-center transition-all border relative group/icon",
                        selectedIconId === 'custom' 
                          ? "border border-primary ring-2 ring-[rgba(255,255,255,0.4)]" 
                          : "bg-[#000000] border border-[rgba(255,255,255,0.3)] hover:border-primary/50"
                      )}
                    >
                      <img 
                        src={customIconUrl} 
                        alt="Custom Icon" 
                        className="w-full h-full object-cover rounded-[12px]"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        onClick={removeCustomIcon}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-md flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </button>
                  ) : (
                    <button
                      disabled={!widgetCustomizationEnabled}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "w-10 h-10 rounded-[12px] flex items-center justify-center transition-all border-dashed border",
                        widgetCustomizationEnabled
                          ? "border-[rgba(255,255,255,0.3)] text-[#a1a4a5] hover:border-primary hover:text-[#3b9eff] hover:bg-[rgba(59,158,255,0.05)]"
                          : "border-[rgba(255,255,255,0.15)] text-[#6b7280] cursor-not-allowed"
                      )}
                    >
                      <ImageIcon size={18} />
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-[#f0f0f0] text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" 
                        accept="image/*"
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Branding & Style */}
          <section className={cn("space-y-4", sectionCardClass)}>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a1a4a5]">
              <Palette size={14} /> {t('widget.branding')}
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('widget.primary_color')}</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.slice(0, 9).map((color) => (
                    <button
                      key={color}
                      disabled={!widgetCustomizationEnabled}
                      onClick={() => setPrimaryColor(color)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        !widgetCustomizationEnabled
                          ? "border border-[rgba(255,255,255,0.15)] cursor-not-allowed"
                          : primaryColor === color ? "border border-slate-900 scale-110" : "border border-transparent hover:scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={primaryColor}
                    disabled={!widgetCustomizationEnabled}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className={cn(
                      "w-10 h-10 rounded-[12px] border-none overflow-hidden p-0 bg-transparent",
                      widgetCustomizationEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                    )}
                  />
                  <input 
                    type="text" 
                    value={primaryColor}
                    disabled={!widgetCustomizationEnabled}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className={cn(fieldClass, "text-xs font-mono uppercase")}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('widget.icon_color')}</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      disabled={!widgetCustomizationEnabled}
                      onClick={() => setIconColor(color)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        !widgetCustomizationEnabled
                          ? "border border-[rgba(255,255,255,0.15)] cursor-not-allowed"
                          : iconColor === color ? "border border-slate-900 scale-110" : "border border-transparent hover:scale-110 border border-[rgba(255,255,255,0.3)]"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={iconColor}
                    disabled={!widgetCustomizationEnabled}
                    onChange={(e) => setIconColor(e.target.value)}
                    className={cn(
                      "w-10 h-10 rounded-[12px] border-none overflow-hidden p-0 bg-transparent",
                      widgetCustomizationEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                    )}
                  />
                  <input 
                    type="text" 
                    value={iconColor}
                    disabled={!widgetCustomizationEnabled}
                    onChange={(e) => setIconColor(e.target.value)}
                    className={cn(fieldClass, "text-xs font-mono uppercase")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('widget.position')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setPosition('left')}
                    className={cn(
                      "py-2 text-xs font-bold rounded-[12px] border transition-all",
                      position === 'left' ? "bg-[#ffffff] text-[#000000] border border-primary shadow-md shadow-black/40" : "bg-[#000000] text-[#a1a4a5] border border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.02)]"
                    )}
                  >
                    {t('widget.pos_left')}
                  </button>
                  <button 
                    onClick={() => setPosition('right')}
                    className={cn(
                      "py-2 text-xs font-bold rounded-[12px] border transition-all",
                      position === 'right' ? "bg-[#ffffff] text-[#000000] border border-primary shadow-md shadow-black/40" : "bg-[#000000] text-[#a1a4a5] border border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.02)]"
                    )}
                  >
                    {t('widget.pos_right')}
                  </button>
                </div>
              </div>
            </div>
          </section>
          </>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              <section className={cn("space-y-4", sectionCardClass)}>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a1a4a5]">
                  <Code size={14} /> {t('widget.embed_title')}
                </div>
                <p className="text-sm leading-6 text-[#8b8f91]">{t('widget.embed_status_desc')}</p>

                <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#f0f0f0] py-1">{t('widget.domain_title')}</p>
                    </div>
                    {hasAllowedDomain ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                        <CheckCircle2 size={12} />
                        {t('widget.domain_ready')}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-[#ff801f]/20 bg-[#ff801f]/10 px-2.5 py-1 text-[10px] font-bold text-[#ffb86b]">
                        {t('widget.domain_required_badge')}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        value={domainInput}
                        onChange={(event) => setDomainInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void handleAddDomain();
                          }
                        }}
                        placeholder="example.com"
                        disabled={isSavingDomain}
                        className={cn(fieldClass, "h-11 py-2.5")}
                      />
                      <button
                        type="button"
                        onClick={handleAddDomain}
                        disabled={isSavingDomain || !domainInput.trim()}
                        className="shrink-0 rounded-[14px] bg-[#ffffff] px-4 text-xs font-bold text-[#000000] transition-colors hover:bg-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSavingDomain ? t('common.loading') : t('widget.domain_add')}
                      </button>
                    </div>

                    <label className="flex items-center gap-2 text-[11px] font-medium text-[#a1a4a5]">
                      <input
                        type="checkbox"
                        checked={allowSubdomains}
                        onChange={(event) => setAllowSubdomains(event.target.checked)}
                        className="h-4 w-4 accent-[#ffffff]"
                      />
                      {t('widget.domain_subdomains')}
                    </label>

                    {isLoadingDomains ? (
                      <p className="text-[11px] text-[#8b8f91]">{t('common.loading')}</p>
                    ) : allowedDomains.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {allowedDomains.map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-[11px] font-semibold text-[#d7d9da]"
                          >
                            {item.domain}{item.allowSubdomains ? ' + subdomains' : ''}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] leading-5 text-[#ffb86b]">{t('widget.domain_empty')}</p>
                    )}
                  </div>
                </div>

                <div className="relative group">
                  <pre className="bg-[#0b0b0c] text-[rgba(255,255,255,0.55)] p-4 rounded-[16px] text-[10px] font-mono overflow-x-auto border border-[rgba(255,255,255,0.08)] leading-relaxed">
                    {widgetScript}
                  </pre>
                  <button 
                    onClick={handleCopyCode}
                    disabled={!widget?.code || !hasAllowedDomain}
                    className="absolute top-2 right-2 p-2 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-white rounded-md transition-all backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCopied ? <Check size={16} className="text-emerald-400" /> : <Paperclip size={16} />}
                  </button>
                </div>
                <button 
                  onClick={handleCopyCode}
                  disabled={!widget?.code || !hasAllowedDomain}
                  className="w-full py-3 bg-[rgba(255,255,255,0.06)] text-[#f0f0f0] text-xs font-bold rounded-[14px] hover:bg-[rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-2 border-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCopied ? t('widget.code_copied') : t('widget.copy_code')}
                </button>
                <p className="text-[11px] text-[#a1a4a5]">
                  {isLoadingWidget
                    ? t('widget.widget_loading')
                    : widget?.id
                      ? `${t('widget.widget_id')}: ${widget.id}`
                      : t('widget.widget_empty')}
                </p>
              </section>

              <section className={cn("space-y-4", sectionCardClass)}>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#a1a4a5]">
                  <Sparkles size={14} /> {t('widget.view_demo')}
                </div>
                <div className="grid gap-3">
                  <Link 
                    to="/widget-test"
                    className="w-full py-3 bg-[rgba(16,185,129,0.08)] text-[#34d399] text-xs font-bold rounded-[16px] hover:bg-[rgba(16,185,129,0.14)] transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} />
                    {t('widget.test_embed')}
                  </Link>
                </div>
              </section>
            </div>
          )}
        </div>

        {activeTab === 'appearance' && (
          <div className="mt-auto p-6 border-t border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] relative">
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className={cn(
                "w-full py-3 font-bold rounded-md shadow-md shadow-black/40 transition-all flex items-center justify-center gap-2",
                isPublishing 
                  ? "bg-[rgba(255,255,255,0.05)] text-[#a1a4a5] cursor-not-allowed shadow-none" 
                  : "bg-[#ffffff] text-[#000000] shadow-primary/20 hover:bg-[#f0f0f0]"
              )}
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border border-[rgba(255,255,255,0.3)] border-t-slate-500 rounded-full animate-spin" />
                  {t('widget.publishing')}
                </>
              ) : (
                t('widget.publish')
              )}
            </button>
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div className={cn(
        "flex-1 bg-[rgba(255,255,255,0.02)] flex flex-col overflow-hidden relative",
        mobileTab === 'settings' ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl z-10">
          <div>
            <p className="text-sm font-semibold text-[#f0f0f0]">{t('widget.preview_tab')}</p>
            <p className="mt-1 text-xs text-[#8b8f91]">{t('widget.preview_modes')}</p>
          </div>
          <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-1 flex gap-1">
            <button 
              onClick={() => setView('desktop')}
              className={cn("p-2 rounded-[10px] transition-all", view === 'desktop' ? "bg-[rgba(255,255,255,0.08)] text-[#f0f0f0]" : "text-[#8b8f91] hover:text-[#f0f0f0]")}
            >
              <Monitor size={16} />
            </button>
            <button 
              onClick={() => setView('mobile')}
              className={cn("p-2 rounded-[10px] transition-all", view === 'mobile' ? "bg-[rgba(255,255,255,0.08)] text-[#f0f0f0]" : "text-[#8b8f91] hover:text-[#f0f0f0]")}
            >
              <Smartphone size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
          <div className={cn(
            "transition-all duration-500 max-w-full max-h-full",
            view === 'desktop' ? "w-[400px] h-[600px]" : "w-[320px] h-[540px]"
          )}>
            <ChatWidget 
              primaryColor={primaryColor}
              botName={botName}
              welcomeMsg={welcomeMsg}
              selectedIconId={selectedIconId}
              iconColor={iconColor}
              customIconUrl={customIconUrl}
            />
          </div>
        </div>

        {/* Floating Bubble Preview */}
        <div className={cn(
          "absolute bottom-4 sm:bottom-8 transition-all duration-500",
          position === 'right' ? "right-4 sm:right-8" : "left-4 sm:left-8"
        )}>
          <div
            className="w-14 h-14 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform overflow-hidden [&>svg]:h-full [&>svg]:w-full"
            style={{ color: primaryColor }}
          >
            {selectedIconId === 'custom' && customIconUrl ? (
              <img
                src={customIconUrl}
                alt={botName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <SelectedIcon size={40} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
