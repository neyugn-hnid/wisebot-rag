import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';
import ChatWidget from '../components/ChatWidget';
import { 
  Bot, 
  Palette, 
  Layout, 
  MessageSquare, 
  Code,
  Send, 
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
  type WidgetResponse,
  type WidgetAppearanceConfig,
} from '../api/widget';

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

export default function WidgetCustomization() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [position, setPosition] = useState<'right' | 'left'>('right');
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const [mobileTab, setMobileTab] = useState<'settings' | 'preview'>('settings');
  const [activeTab, setActiveTab] = useState<'appearance' | 'embed'>('appearance');
  const [selectedIconId, setSelectedIconId] = useState('bot');
  const [botName, setBotName] = useState('WiseBot Assistant');
  const [welcomeMsg, setWelcomeMsg] = useState('Hello! How can I help you today?');
  const [iconColor, setIconColor] = useState('#ffffff');
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);
  const [knowledgeBaseId, setKnowledgeBaseId] = useState('');
  const [topK, setTopK] = useState(5);
  const [temperature, setTemperature] = useState(0.2);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [widget, setWidget] = useState<WidgetResponse | null>(null);
  const [isLoadingWidget, setIsLoadingWidget] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseResponse[]>([]);
  const [isLoadingKnowledgeBases, setIsLoadingKnowledgeBases] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasHydratedLocalSettings = useRef(false);

  const SelectedIcon = BOT_ICONS.find(i => i.id === selectedIconId)?.icon || Bot;
  const widgetScriptSrc = typeof window !== 'undefined' ? `${window.location.origin}/widget.js` : 'https://cdn.wisebot.ai/widget.js';
  const widgetApiBase = typeof window !== 'undefined' ? window.location.origin : 'https://app.wisebot.ai';

  const widgetScript = widget?.code
    ? `<script src="${widgetScriptSrc}" data-id="${widget.code}" data-api-base="${widgetApiBase}" async></script>`
    : '';

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

        if (!knowledgeBaseId && scopedItems.length === 1) {
          setKnowledgeBaseId(scopedItems[0].id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không tải được danh sách kho tri thức.';
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
            setBotName(existingWidget.name || 'WiseBot Assistant');
            setWelcomeMsg(existingWidget.welcomeMessage || 'Hello! How can I help you today?');
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
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không tải được widget.';
        showToast(message, 'error');
      } finally {
        setIsLoadingWidget(false);
      }
    };

    void loadWidget();
  }, [showToast]);

  const handleCopyCode = () => {
    if (!widget?.code) {
      showToast('Hãy publish widget trước để tạo embed code.', 'error');
      return;
    }

    navigator.clipboard.writeText(widgetScript);
    setIsCopied(true);
    showToast(t('widget.code_copied') || 'Code copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    
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

    try {
      const tenantId = resolveTenantIdFromToken();
      if (!tenantId) {
        throw new Error('Không lấy được tenantId từ access token.');
      }

      let activeWidget = widget;
      if (!activeWidget) {
        const created = await createWidget({
          tenantId,
          name: botName.trim() || 'WiseBot Assistant',
          code: generateWidgetCode(),
          welcomeMessage: welcomeMsg.trim(),
          createdBy: resolveUserIdFromToken() || null,
          appearanceConfig: {
            primaryColor,
            position,
            iconColor,
            selectedIconId,
            customIconUrl,
            knowledgeBaseId: knowledgeBaseId || null,
            topK,
            temperature,
          },
        });

        activeWidget = created;
        setWidget(created);
      } else {
        const updated = await updateWidget(activeWidget.id, {
          name: botName.trim() || 'WiseBot Assistant',
          welcomeMessage: welcomeMsg.trim(),
          appearanceConfig: {
            primaryColor,
            position,
            iconColor,
            selectedIconId,
            customIconUrl,
            knowledgeBaseId: knowledgeBaseId || null,
            topK,
            temperature,
          },
        });

        activeWidget = updated;
        setWidget(updated);
      }

      setIsPublishing(false);
      showToast(t('widget.publish_success') || 'Changes published successfully!', 'success');
    } catch (error) {
      setIsPublishing(false);
      const message = error instanceof Error ? error.message : 'Không thể publish widget.';
      showToast(message, 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="-m-4 lg:-m-8 h-[calc(100dvh-64px)] flex flex-col lg:flex-row overflow-hidden bg-[#000000] relative w-[calc(100%+32px)] lg:w-[calc(100%+64px)]">
      {}
      <div className="lg:hidden flex shrink-0 border-b border-[rgba(255,255,255,0.3)] bg-[#000000] z-20">
        <button 
          onClick={() => setMobileTab('settings')}
          className={cn(
            "flex-1 py-3 text-xs font-bold transition-colors",
            mobileTab === 'settings' ? "text-[#3b9eff] border-b-2 border border-primary" : "text-[#a1a4a5]"
          )}
        >
          {t('widget.settings_tab') || 'Settings'}
        </button>
        <button 
          onClick={() => setMobileTab('preview')}
          className={cn(
            "flex-1 py-3 text-xs font-bold transition-colors",
            mobileTab === 'preview' ? "text-[#3b9eff] border-b-2 border border-primary" : "text-[#a1a4a5]"
          )}
        >
          {t('widget.preview_tab') || 'Preview'}
        </button>
      </div>

      {}
      <div className={cn(
        "w-full lg:w-96 border-r border-[rgba(255,255,255,0.3)] flex flex-col flex-1 lg:flex-none overflow-y-auto scrollbar-hide",
        mobileTab === 'preview' ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-6 border-b border-[rgba(255,255,255,0.3)]">
          <h2 className="text-[20px] font-display font-medium tracking-tight text-[#f0f0f0]">{t('widget.title')}</h2>
          
          <div className="flex gap-1 bg-[rgba(255,255,255,0.05)] p-1 rounded-[16px] mt-6">
            <button 
              onClick={() => setActiveTab('appearance')}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-[12px] transition-all",
                activeTab === 'appearance' ? "bg-[#000000] text-[#f0f0f0] shadow-md shadow-black/40" : "text-[#a1a4a5] hover:text-[#f0f0f0]"
              )}
            >
              {t('widget.branding')}
            </button>
            <button 
              onClick={() => setActiveTab('embed')}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-[12px] transition-all",
                activeTab === 'embed' ? "bg-[#000000] text-[#f0f0f0] shadow-md shadow-black/40" : "text-[#a1a4a5] hover:text-[#f0f0f0]"
              )}
            >
              {t('nav.integration')}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {activeTab === 'appearance' ? (
            <>
              {}
              <section className="space-y-4">
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
                  className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.3)] rounded-[12px] px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('widget.welcome_message')}</label>
                <textarea 
                  value={welcomeMsg}
                  onChange={(e) => setWelcomeMsg(e.target.value)}
                  rows={2}
                  className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.3)] rounded-[12px] px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#f0f0f0]">Knowledge Base</label>
                <select
                  value={knowledgeBaseId}
                  onChange={(e) => setKnowledgeBaseId(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.3)] rounded-[12px] px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">{isLoadingKnowledgeBases ? 'Loading knowledge bases...' : 'Select knowledge base'}</option>
                  {knowledgeBases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#f0f0f0]">Top K</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={topK}
                    onChange={(e) => setTopK(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.3)] rounded-[12px] px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#f0f0f0]">Temperature</label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={temperature}
                    onChange={(e) => setTemperature(Math.min(1, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.3)] rounded-[12px] px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('widget.bot_icon') || 'Bot Icon'}</label>
                <div className="grid grid-cols-5 gap-2">
                  {BOT_ICONS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedIconId(item.id)}
                      className={cn(
                        "w-10 h-10 rounded-[12px] flex items-center justify-center transition-all border",
                        selectedIconId === item.id 
                          ? "text-white border border-transparent shadow-md shadow-black/40" 
                          : "bg-[#000000] text-[#a1a4a5] border border-[rgba(255,255,255,0.3)] hover:border-primary/50 hover:text-[#3b9eff]"
                      )}
                      style={selectedIconId === item.id ? { backgroundColor: primaryColor, boxShadow: `0 4px 12px ${primaryColor}33` } : {}}
                    >
                      <item.icon size={18} />
                    </button>
                  ))}
                  
                  {}
                  {customIconUrl ? (
                    <button
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
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center transition-all border-dashed border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] hover:border-primary hover:text-[#3b9eff] hover:bg-[rgba(59,158,255,0.05)]"
                    >
                      <ImageIcon size={18} />
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-[#f0f0f0] text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" 
                        accept="image}
          <section className="space-y-4">
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
                      onClick={() => setPrimaryColor(color)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        primaryColor === color ? "border border-slate-900 scale-110" : "border border-transparent hover:scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-[12px] border-none cursor-pointer overflow-hidden p-0 bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.3)] rounded-[12px] px-3 py-2 text-xs font-mono uppercase focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('widget.icon_color') || 'Icon Color'}</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setIconColor(color)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        iconColor === color ? "border border-slate-900 scale-110" : "border border-transparent hover:scale-110 border border-[rgba(255,255,255,0.3)]"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={iconColor}
                    onChange={(e) => setIconColor(e.target.value)}
                    className="w-10 h-10 rounded-[12px] border-none cursor-pointer overflow-hidden p-0 bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={iconColor}
                    onChange={(e) => setIconColor(e.target.value)}
                    className="flex-1 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.3)] rounded-[12px] px-3 py-2 text-xs font-mono uppercase focus:ring-2 focus:ring-primary/20 outline-none"
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
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a1a4a5]">
                  <Code size={14} /> {t('widget.embed_title')}
                </div>
                <div className="relative group">
                  <pre className="bg-slate-900 text-[rgba(255,255,255,0.3)] p-4 rounded-[16px] text-[10px] font-mono overflow-x-auto border border-slate-800 leading-relaxed">
                    {widgetScript}
                  </pre>
                  <button 
                    onClick={handleCopyCode}
                    className="absolute top-2 right-2 p-2 bg-[#000000]/10 hover:bg-[#000000]/20 text-white rounded-md transition-all backdrop-blur-sm"
                  >
                    {isCopied ? <Check size={16} className="text-emerald-400" /> : <Paperclip size={16} />}
                  </button>
                </div>
                <button 
                  onClick={handleCopyCode}
                  className="w-full py-2.5 bg-[rgba(255,255,255,0.05)] text-[#f0f0f0] text-xs font-bold rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-all flex items-center justify-center gap-2 border-none"
                >
                  {isCopied ? t('widget.code_copied') : t('widget.copy_code')}
                </button>
                <p className="text-[11px] text-[#a1a4a5]">
                  {isLoadingWidget
                    ? 'Đang tải widget hiện có...'
                    : widget?.id
                      ? `Widget ID: ${widget.id}`
                      : 'Chưa có widget trên backend. Publish để tạo mới.'}
                </p>
              </section>

              <section className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#a1a4a5]">
                  <Sparkles size={14} /> {t('widget.view_demo')}
                </div>
                <div className="grid gap-3">
                  <Link 
                    to="/demo"
                    className="w-full py-3 bg-[rgba(59,158,255,0.05)] text-[#3b9eff] text-xs font-bold rounded-[16px] hover:bg-[rgba(59,158,255,0.1)] transition-all flex items-center justify-center gap-2"
                  >
                    <Monitor size={16} />
                    {t('widget.view_demo')}
                  </Link>
                  <Link 
                    to="/widget-test"
                    className="w-full py-3 bg-[rgba(16,185,129,0.08)] text-[#34d399] text-xs font-bold rounded-[16px] hover:bg-[rgba(16,185,129,0.14)] transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} />
                    Test Public Embed
                  </Link>
                </div>
              </section>
            </div>
          )}
        </div>

        {activeTab === 'appearance' && (
          <div className="mt-auto p-6 border-t border-[rgba(255,255,255,0.3)] bg-[#000000] relative">
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

      {}
      <div className={cn(
        "flex-1 bg-[rgba(255,255,255,0.05)]/50 flex flex-col overflow-hidden relative",
        mobileTab === 'settings' ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-4 flex items-center justify-center border-b border-[rgba(255,255,255,0.3)] bg-[#000000]/80 backdrop-blur-sm z-10">
          <div className="bg-slate-200/50 p-1 rounded-[12px] flex gap-1">
            <button 
              onClick={() => setView('desktop')}
              className={cn("p-1.5 rounded-md transition-all", view === 'desktop' ? "bg-[#000000] text-[#3b9eff] shadow-md shadow-black/40" : "text-[#a1a4a5] hover:text-[#a1a4a5]")}
            >
              <Monitor size={16} />
            </button>
            <button 
              onClick={() => setView('mobile')}
              className={cn("p-1.5 rounded-md transition-all", view === 'mobile' ? "bg-[#000000] text-[#3b9eff] shadow-md shadow-black/40" : "text-[#a1a4a5] hover:text-[#a1a4a5]")}
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

        {}
        <div className={cn(
          "absolute bottom-4 sm:bottom-8 transition-all duration-500",
          position === 'right' ? "right-4 sm:right-8" : "left-4 sm:left-8"
        )}>
          <div className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: primaryColor }}>
            <MessageSquare size={28} />
          </div>
        </div>
      </div>
    </div>
  );
}
