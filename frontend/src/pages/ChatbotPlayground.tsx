import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';
import { 
  Send, 
  RotateCcw, 
  User, 
  FileText, 
  Link as LinkIcon, 
  Settings as SettingsIcon,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  sources?: { name: string; snippet: string }[];
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

interface KnowledgeBaseOption {
  id: string;
  name: string;
  tenantId?: string;
}

interface AskPayloadData {
  answer?: unknown;
  citations?: unknown;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm WiseBot, your custom AI assistant. How can I help you explore the knowledge base today?"
  }
];

export default function ChatbotPlayground() {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.4);
  const [topK, setTopK] = useState(4);
  const [tenantId, setTenantId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [knowledgeBaseId, setKnowledgeBaseId] = useState('');
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseOption[]>([]);
  const [isLoadingKnowledgeBases, setIsLoadingKnowledgeBases] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const storedTenantId = window.localStorage.getItem('wisebot_tenant_id') || '';
    const storedSessionId = window.localStorage.getItem('wisebot_chat_session_id') || '';
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }

    const storedKBId = window.localStorage.getItem('wisebot_kb_id') || '';
    if (storedKBId) {
      setKnowledgeBaseId(storedKBId);
    }

    const jwtTenantId = resolveTenantIdFromToken();
    if (jwtTenantId) {
      setTenantId(jwtTenantId);
      window.localStorage.setItem('wisebot_tenant_id', jwtTenantId);
    } else if (storedTenantId) {
      setTenantId(storedTenantId);
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const getAccessToken = () => {
    return window.localStorage.getItem('wisebot_access_token') ?? window.sessionStorage.getItem('wisebot_access_token');
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

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

  const extractApiMessage = async (response: Response, fallbackMessage: string) => {
    try {
      const payload = (await response.json()) as { message?: string; error?: string };
      return payload.message || payload.error || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  };

  const createSession = async (currentTenantId: string) => {
    const token = getAccessToken();
    const payload = token ? parseJwtPayload(token) : null;
    const userId = typeof payload?.userId === 'string' ? payload.userId : null;

    const response = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        tenantId: currentTenantId,
        userId,
        channel: 'WEB',
        title: 'Playground Chat',
      }),
    });

    if (!response.ok) {
      const message = await extractApiMessage(response, 'Không thể tạo phiên chat.');
      throw new Error(message);
    }

    const payloadResponse = (await response.json()) as { data?: { id?: string } };
    const newSessionId = payloadResponse?.data?.id;
    if (!newSessionId) {
      throw new Error('Không thể tạo phiên chat.');
    }

    setSessionId(newSessionId);
    window.localStorage.setItem('wisebot_chat_session_id', newSessionId);
    return newSessionId;
  };

  const resolveTenantIdFromToken = () => {
    const token = getAccessToken();
    const payload = token ? parseJwtPayload(token) : null;
    return typeof payload?.tenantId === 'string' ? payload.tenantId.trim() : '';
  };

  const loadKnowledgeBases = async () => {
    setIsLoadingKnowledgeBases(true);
    try {
      const resolvedTenantId = resolveTenantIdFromToken();
      const response = await fetch('/api/knowledge-bases', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const message = await extractApiMessage(response, 'Không tải được danh sách kho tri thức.');
        throw new Error(message);
      }

      const payload = (await response.json()) as ApiResponse<KnowledgeBaseOption[]>;
      const allKnowledgeBases = payload.data || [];
      const filteredByTenant = resolvedTenantId
        ? allKnowledgeBases.filter((item) => item.tenantId === resolvedTenantId)
        : allKnowledgeBases;
      const tenantScoped = filteredByTenant.length > 0 ? filteredByTenant : allKnowledgeBases;

      setKnowledgeBases(tenantScoped);

      if (tenantScoped.length === 1) {
        setKnowledgeBaseId(tenantScoped[0].id);
        window.localStorage.setItem('wisebot_kb_id', tenantScoped[0].id);
        return;
      }

      const currentStillExists = tenantScoped.some((item) => item.id === knowledgeBaseId.trim());
      if (!currentStillExists) {
        setKnowledgeBaseId('');
        window.localStorage.removeItem('wisebot_kb_id');
      }
    } catch (error) {
      setKnowledgeBases([]);
      const message = error instanceof Error ? error.message : 'Không tải được danh sách kho tri thức.';
      showToast(message, 'error');
    } finally {
      setIsLoadingKnowledgeBases(false);
    }
  };

  useEffect(() => {
    const resolvedTenantId = resolveTenantIdFromToken();
    if (!resolvedTenantId) {
      setKnowledgeBases([]);
      return;
    }
    if (tenantId !== resolvedTenantId) {
      setTenantId(resolvedTenantId);
      window.localStorage.setItem('wisebot_tenant_id', resolvedTenantId);
      return;
    }
    void loadKnowledgeBases();
  }, [tenantId]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const resolvedTenantId = resolveTenantIdFromToken();
    if (!resolvedTenantId) {
      showToast('Không lấy được tenantId từ access token.', 'error');
      return;
    }

    if (knowledgeBases.length > 1 && !knowledgeBaseId.trim()) {
      showToast('Vui lòng chọn knowledge base trước khi gửi câu hỏi.', 'error');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const activeSessionId = sessionId.trim() || (await createSession(resolvedTenantId));

      const response = await fetch(`/api/chat/sessions/${activeSessionId}/ask`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          question: userMessage.content,
          topK,
          temperature,
          knowledgeBaseId: knowledgeBaseId.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const message = await extractApiMessage(response, 'Không thể gửi câu hỏi.');
        throw new Error(message);
      }

      const payload = (await response.json()) as { data?: AskPayloadData; answer?: unknown; citations?: unknown };
      const responseData = payload?.data;
      const rawAnswer = responseData?.answer ?? payload?.answer;
      const answer = typeof rawAnswer === 'string' && rawAnswer.trim()
        ? rawAnswer
        : 'Không có phản hồi từ hệ thống.';

      const rawCitations = responseData?.citations ?? payload?.citations;
      const citationItems = Array.isArray(rawCitations) ? rawCitations : [];
      const sources = citationItems
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }
          const citation = item as {
            sourceDocumentId?: unknown;
            source_document_id?: unknown;
            snippet?: unknown;
          };
          const snippet = typeof citation.snippet === 'string' ? citation.snippet : '';
          const sourceDocumentId = typeof citation.sourceDocumentId === 'string'
            ? citation.sourceDocumentId
            : typeof citation.source_document_id === 'string'
              ? citation.source_document_id
              : '';

          if (!snippet) {
            return null;
          }

          return {
            name: sourceDocumentId ? `Tài liệu ${sourceDocumentId.slice(0, 8)}` : 'Tài liệu',
            snippet,
          };
        })
        .filter((item): item is { name: string; snippet: string } => item !== null);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        sources: sources.length > 0 ? sources : undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';
      showToast(message, 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const latestAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && m.sources);

  return (
    <div className="-m-4 lg:-m-8 h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-[#000000] relative w-[calc(100%+32px)] lg:w-[calc(100%+64px)]">
      {/* Header */}
      <div className="p-4 border-b border-[rgba(255,255,255,0.3)] flex items-center justify-between bg-[#000000] z-20">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#f0f0f0] hidden sm:inline">{t('playground.title')}</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="lg:hidden p-2 text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors"
          >
            <SettingsIcon size={18} />
          </button>
          <button 
            onClick={handleClearChat}
            className="flex items-center gap-2 text-xs font-semibold text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors"
          >
            <RotateCcw size={14} /> <span className="hidden sm:inline">{t('playground.clear')}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Window */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[rgba(255,255,255,0.3)]">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide" ref={chatContainerRef}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-md shadow-black/40",
                  msg.role === 'assistant' ? "bg-[#000000] border border-[rgba(255,255,255,0.3)]" : "bg-slate-200"
                )}>
                  {msg.role === 'assistant' ? <Logo iconOnly size="sm" className="scale-75" /> : <User size={16} className="text-[#a1a4a5]" />}
                </div>
                <div className={cn(
                  "space-y-1 max-w-[85%] sm:max-w-2xl",
                  msg.role === 'user' ? "text-right" : ""
                )}>
                  <p className="text-[10px] font-semibold text-[#a1a4a5] capitalize">
                    {msg.role === 'assistant' ? t('playground.role.assistant') : t('playground.role.user')}
                  </p>
                  <div className={cn(
                    "p-4 rounded-[16px] text-[14px] leading-relaxed whitespace-pre-wrap shadow-md shadow-black/40 font-messenger font-medium",
                    msg.role === 'assistant' 
                      ? "bg-[rgba(255,255,255,0.05)] text-[#f0f0f0] rounded-tl-none border border-[rgba(255,255,255,0.3)]/50" 
                      : "bg-[#ffffff] text-[#000000] rounded-tr-none text-left"
                  )}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-4 animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#000000] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 shrink-0 overflow-hidden">
                  <Logo iconOnly size="sm" className="scale-75" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-[#a1a4a5] capitalize">
                    {t('playground.role.assistant')}
                  </p>
                  <div className="bg-[rgba(255,255,255,0.05)] p-4 rounded-[16px] rounded-tl-none border border-[rgba(255,255,255,0.3)]/50 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 sm:p-6 bg-[#000000]">
            <div className="max-w-3xl mx-auto relative group">
              <div className="relative flex items-end gap-2 bg-[#1a1a1a] rounded-[16px] p-1.5 focus-within:bg-[#262626] transition-all duration-300 shadow-md shadow-black/40 border border-[rgba(255,255,255,0.05)]">
                <textarea 
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 bg-transparent border-none px-3 py-2.5 text-sm focus:ring-0 focus:outline-none outline-none resize-none scrollbar-hide min-h-[44px] max-h-40 leading-relaxed text-[#f0f0f0]"
                  placeholder={t('playground.placeholder')}
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 flex items-center justify-center text-[#3b9eff] hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shrink-0"
                >
                  <Send size={22} className="fill-primary/10" />
                </button>
              </div>
              <p className="text-[10px] text-center text-[#a1a4a5] mt-2 font-medium">
                {language === 'vi' ? 'WiseBot có thể mắc lỗi. Hãy kiểm tra lại các thông tin quan trọng.' : 'WiseBot can make mistakes. Check important info.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={cn(
          "fixed inset-y-0 right-0 w-80 bg-[#000000] shadow-2xl lg:shadow-none lg:relative lg:flex flex-col shrink-0 bg-[rgba(255,255,255,0.02)]/50 z-30 transition-transform duration-300 transform",
          showSettings ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setShowSettings(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-[#a1a4a5] hover:text-[#a1a4a5] z-10"
          >
            <X size={20} />
          </button>
          {/* Source Citations */}
          <div className="flex-1 flex flex-col overflow-hidden border-b border-[rgba(255,255,255,0.3)]">
            <div className="p-4 bg-[rgba(255,255,255,0.02)] font-semibold text-xs text-[#a1a4a5] flex items-center gap-2">
              <LinkIcon size={14} />
              {t('playground.sources')}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {latestAssistantMessage?.sources ? (
                latestAssistantMessage.sources.map((source, i) => (
                  <div key={i} className="p-3 bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[12px] hover:border-primary/50 cursor-pointer transition-all shadow-md shadow-black/40 group">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-[#3b9eff]" />
                      <span className="text-xs font-semibold text-[#f0f0f0] truncate group-hover:text-[#3b9eff] transition-colors">
                        {source.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#a1a4a5] line-clamp-2 italic leading-relaxed">
                      "{source.snippet}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#a1a4a5]">
                  <Info size={24} className="mb-2 opacity-20" />
                  <p className="text-xs font-normal">
                    {language === 'vi' ? 'Không có nguồn nào được trích dẫn cho câu trả lời hiện tại.' : 'No sources cited for the current response.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Model Settings */}
          <div className="p-6 bg-[rgba(255,255,255,0.02)] space-y-6">
            <div className="font-semibold text-xs text-[#a1a4a5] flex items-center gap-2">
              <SettingsIcon size={14} />
              {t('playground.settings')}
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#f0f0f0]">Tenant ID</label>
                <input
                  type="text"
                  value={tenantId}
                  readOnly
                  placeholder="Lấy từ access token"
                  className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.3)] px-3 py-2 rounded-[12px] text-[10px] text-[#a1a4a5]"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#f0f0f0]">Knowledge Base ID</label>
                <select
                  value={knowledgeBaseId}
                  onChange={(e) => setKnowledgeBaseId(e.target.value)}
                  disabled={isLoadingKnowledgeBases || knowledgeBases.length === 0 || knowledgeBases.length === 1}
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] px-3 py-2 rounded-[12px] text-xs text-[#f0f0f0] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:text-[#a1a4a5] disabled:cursor-not-allowed"
                >
                  {isLoadingKnowledgeBases ? (
                    <option value="" className="text-black">
                      Đang tải knowledge base...
                    </option>
                  ) : knowledgeBases.length === 0 ? (
                    <option value="" className="text-black">
                      Không có knowledge base
                    </option>
                  ) : knowledgeBases.length === 1 ? (
                    <option value={knowledgeBases[0].id} className="text-black">
                      {knowledgeBases[0].name}
                    </option>
                  ) : (
                    <>
                      <option value="" className="text-black">
                        Chọn knowledge base
                      </option>
                      {knowledgeBases.map((kb) => (
                        <option key={kb.id} value={kb.id} className="text-black">
                          {kb.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#f0f0f0]">Phiên chat</label>
                  <button
                    onClick={() => {
                      setSessionId('');
                      window.localStorage.removeItem('wisebot_chat_session_id');
                      showToast('Đã tạo phiên chat mới.', 'success');
                    }}
                    className="text-[10px] font-semibold text-[#3b9eff] hover:underline"
                    type="button"
                  >
                    Tạo phiên mới
                  </button>
                </div>
                <input
                  type="text"
                  value={sessionId || 'Chưa có'}
                  readOnly
                  className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.3)] px-3 py-2 rounded-[12px] text-[10px] text-[#a1a4a5]"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#f0f0f0]">{t('playground.temp')}</label>
                  <span className="text-xs font-semibold text-[#3b9eff]">{temperature}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-[12px] appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#f0f0f0]">{t('playground.topk')}</label>
                  <span className="text-xs font-semibold text-[#3b9eff]">{topK}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-[12px] appearance-none cursor-pointer accent-primary"
                />
              </div>

              <button 
                onClick={() => {
                  setShowSettings(false);
                  if (tenantId.trim()) {
                    window.localStorage.setItem('wisebot_tenant_id', tenantId.trim());
                  }
                  if (knowledgeBaseId.trim()) {
                    window.localStorage.setItem('wisebot_kb_id', knowledgeBaseId.trim());
                  }
                  showToast(t('playground.save_success') || 'Configuration saved successfully!', 'success');
                }}
                className="w-full py-2.5 bg-[#ffffff] text-[#000000] text-xs font-bold rounded-[12px] hover:bg-gray-200 transition-colors"
              >
                {t('playground.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
