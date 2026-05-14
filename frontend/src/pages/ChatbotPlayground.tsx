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
  ChevronLeft,
  PanelLeft,
  MessageSquare,
  SquarePen,
  Info,
  X
} from 'lucide-react';
import { getStoredAccessToken } from '../lib/auth';
import { cn } from '../lib/utils';
import {
  createSession,
  listSessions,
  listMessages,
  ask,
  getCitations,
  getProviderInfo,
  type ChatSessionResponse,
  type ChatMessageResponse,
  type AskResponse,
  type ChatProviderInfo,
  type CitationItem,
} from '../api/chat';
import { listKnowledgeBases } from '../api/knowledge-base';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  sources?: CitationResponse[];
}

interface CitationResponse {
  name: string;
  snippet: string;
}

interface ChatHistoryItem {
  sessionId: string;
  title: string;
  preview: string;
  updatedAt: string;
}

const CHAT_SESSION_STORAGE_KEY = 'wisebot_chat_session_id';

export interface KnowledgeBaseOption {
  id: string;
  name: string;
  tenantId?: string;
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
  const [showHistory, setShowHistory] = useState(false);
  const [temperature, setTemperature] = useState(0.4);
  const [topK, setTopK] = useState(4);
  const [tenantId, setTenantId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [chatHistories, setChatHistories] = useState<ChatHistoryItem[]>([]);
  const [knowledgeBaseId, setKnowledgeBaseId] = useState('');
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseOption[]>([]);
  const [isLoadingKnowledgeBases, setIsLoadingKnowledgeBases] = useState(false);
  const [providerInfo, setProviderInfo] = useState<ChatProviderInfo | null>(null);
  
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
    const storedSessionId = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY) || '';
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

  useEffect(() => {
    const loadProviderInfo = async () => {
      try {
        const info = await getProviderInfo();
        setProviderInfo(info);
      } catch {
        setProviderInfo(null);
      }
    };

    void loadProviderInfo();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

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

  const createSessionAndStore = async (currentTenantId: string) => {
    const token = getStoredAccessToken();
    const payload = token ? parseJwtPayload(token) : null;
    const userId = typeof payload?.userId === 'string' ? payload.userId : null;

    const session = await createSession({
      tenantId: currentTenantId,
      userId,
      channel: 'WEB',
      title: 'Playground Chat',
    });

    const newSessionId = session.id;
    if (!newSessionId) {
      throw new Error('Không thể tạo phiên chat.');
    }

    setSessionId(newSessionId);
    window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, newSessionId);
    return newSessionId;
  };

  const resolveTenantIdFromToken = () => {
    const token = getStoredAccessToken();
    const payload = token ? parseJwtPayload(token) : null;
    return typeof payload?.tenantId === 'string' ? payload.tenantId.trim() : '';
  };

  const mapCitationSources = (rawCitations: unknown) => {
    const citationItems = Array.isArray(rawCitations) ? rawCitations : [];
    return citationItems
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
  };

  const deriveHistoryTitle = (session: ChatSessionResponse, mappedMessages: Message[]) => {
    const rawTitle = typeof session.title === 'string' ? session.title.trim() : '';
    if (rawTitle && rawTitle.toLowerCase() !== 'playground chat') {
      return rawTitle;
    }

    const firstUserMessage = mappedMessages.find((message) => message.role === 'user')?.content?.trim();
    if (firstUserMessage) {
      return firstUserMessage.slice(0, 40);
    }

    return rawTitle || 'Phiên chat mới';
  };

  const fetchLatestAssistantSources = async (messageId: string): Promise<CitationResponse[] | undefined> => {
    try {
      const rawCitations = await getCitations(messageId);
      const sources = mapCitationSources(rawCitations);
      return sources.length > 0 ? sources : undefined;
    } catch {
      return undefined;
    }
  };

  const fetchSessionMessages = async (targetSessionId: string) => {
    const messageList = await listMessages(targetSessionId);

    const mappedMessages: Message[] = messageList
      .filter((item): item is ChatMessageResponse & { id: string; content: string } => Boolean(item?.id && item?.content))
      .map((item) => ({
        id: item.id,
        role: String(item.role).toUpperCase() === 'ASSISTANT' ? 'assistant' : 'user',
        content: item.content,
      }));

    const latestAssistantIndex = [...mappedMessages].reverse().findIndex((message) => message.role === 'assistant');
    if (latestAssistantIndex >= 0) {
      const messageIndex = mappedMessages.length - 1 - latestAssistantIndex;
      const latestAssistant = mappedMessages[messageIndex];
      const sources = await fetchLatestAssistantSources(latestAssistant.id);
      if (sources?.length) {
        mappedMessages[messageIndex] = {
          ...latestAssistant,
          sources,
        };
      }
    }

    return mappedMessages;
  };

  const loadSessionMessages = async (targetSessionId: string) => {
    const mappedMessages = await fetchSessionMessages(targetSessionId);
    setSessionId(targetSessionId);
    setMessages(mappedMessages.length > 0 ? mappedMessages : INITIAL_MESSAGES);
    window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, targetSessionId);
  };

  const loadChatHistories = async (currentTenantId: string, preferredSessionId?: string) => {
    const sessions = await listSessions(currentTenantId);

    const historyItems = await Promise.all(
      sessions.map(async (session) => {
        const targetSessionId = typeof session.id === 'string' ? session.id : '';
        if (!targetSessionId) {
          return null;
        }

        try {
          const mappedMessages = await fetchSessionMessages(targetSessionId);
          const lastMessage = mappedMessages[mappedMessages.length - 1];
          return {
            sessionId: targetSessionId,
            title: deriveHistoryTitle(session, mappedMessages),
            preview: lastMessage?.content?.slice(0, 72).trim() || '',
            updatedAt: session.lastMessageAt || session.startedAt || new Date().toISOString(),
          } as ChatHistoryItem;
        } catch {
          return {
            sessionId: targetSessionId,
            title: typeof session.title === 'string' && session.title.trim() ? session.title.trim() : 'Phiên chat',
            preview: '',
            updatedAt: session.lastMessageAt || session.startedAt || new Date().toISOString(),
        } as ChatHistoryItem;
        }
      })
    );

    const nextHistories = historyItems.filter((item): item is ChatHistoryItem => item !== null);
    setChatHistories(nextHistories);

    if (preferredSessionId && nextHistories.some((item) => item.sessionId === preferredSessionId)) {
      await loadSessionMessages(preferredSessionId);
      return;
    }

    if (!nextHistories.some((item) => item.sessionId === sessionId)) {
      setSessionId('');
      setMessages(INITIAL_MESSAGES);
      window.localStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
    }
  };

  const loadKnowledgeBases = async () => {
    setIsLoadingKnowledgeBases(true);
    try {
      const resolvedTenantId = resolveTenantIdFromToken();
      const allKnowledgeBases = await listKnowledgeBases();

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
      setChatHistories([]);
      return;
    }
    if (tenantId !== resolvedTenantId) {
      setTenantId(resolvedTenantId);
      window.localStorage.setItem('wisebot_tenant_id', resolvedTenantId);
      return;
    }
    void loadKnowledgeBases();
    void loadChatHistories(resolvedTenantId, sessionId || undefined);
  }, [tenantId]);

  const handleStartNewChat = () => {
    setSessionId('');
    setMessages(INITIAL_MESSAGES);
    window.localStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
    showToast('Đã tạo phiên chat mới.', 'success');
  };

  const handleSelectHistory = (history: ChatHistoryItem) => {
    void loadSessionMessages(history.sessionId).catch((error) => {
      const message = error instanceof Error ? error.message : 'Không tải được phiên chat.';
      showToast(message, 'error');
    });
  };

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
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: input.trim()
    };

    const nextUserMessages = [...messages, userMessage];
    setMessages(nextUserMessages);
    setInput('');
    setIsTyping(true);

    try {
      const activeSessionId = sessionId.trim() || (await createSessionAndStore(resolvedTenantId));

      const responseData = await ask(activeSessionId, {
        question: userMessage.content,
        topK,
        temperature,
        knowledgeBaseId: knowledgeBaseId.trim() || undefined,
      });

      const rawAnswer = responseData?.answer;
      const answer = typeof rawAnswer === 'string' && rawAnswer.trim()
        ? rawAnswer
        : 'Không có phản hồi từ hệ thống.';
      const userMessageId = typeof responseData?.userMessageId === 'string' ? responseData.userMessageId : userMessage.id;
      const assistantMessageId = typeof responseData?.assistantMessageId === 'string' ? responseData.assistantMessageId : `temp-assistant-${Date.now() + 1}`;
      const sources = mapCitationSources(responseData?.citations);

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: answer,
        sources: sources.length > 0 ? sources : undefined,
      };

      const persistedUserMessage = {
        ...userMessage,
        id: userMessageId,
      };
      const nextMessages = [...messages, persistedUserMessage, assistantMessage];
      setMessages(nextMessages);
      setSessionId(activeSessionId);
      window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, activeSessionId);
      void loadChatHistories(resolvedTenantId, activeSessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';
      showToast(message, 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    handleStartNewChat();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const latestAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && m.sources);

  return (
    <div className="-m-4 lg:-m-8 h-screen flex flex-col overflow-hidden bg-[#000000] relative w-[calc(100%+32px)] lg:w-[calc(100%+64px)]">
      {showHistory && (
        <button
          type="button"
          aria-label="Đóng lịch sử phiên chat"
          className="lg:hidden absolute inset-0 bg-black/60 z-20"
          onClick={() => setShowHistory(false)}
        />
      )}

      

      <div className="flex-1 flex overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 z-30 w-72 border-r border-[rgba(255,255,255,0.12)] bg-[#050505] transition-transform duration-300 lg:relative lg:translate-x-0",
            showHistory ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="p-3 border-b border-[rgba(255,255,255,0.1)]">
              <button
                type="button"
                onClick={handleStartNewChat}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[#f0f0f0] transition-colors cursor-pointer"
              >
                <SquarePen size={16} />
                Đoạn chat mới
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
              {chatHistories.length > 0 ? (
                <div className="space-y-2">
                  {chatHistories.map((history) => {
                    const isActive = history.sessionId === sessionId;
                    return (
                      <button
                        key={history.sessionId}
                        type="button"
                        onClick={() => handleSelectHistory(history)}
                        className={cn(
                          "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                          isActive
                            ? "border-[#3b9eff]/50 bg-[#0c1622]"
                            : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)]"
                        )}
                      >
                        <div className="mb-2 flex items-start gap-3">
                          <MessageSquare size={15} className={cn("mt-0.5 shrink-0", isActive ? "text-[#3b9eff]" : "text-[#7f8487]")} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#f0f0f0]">{history.title}</p>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#8d9295]">
                              {history.preview || 'Chưa có nội dung xem trước'}
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-[#6f7578]">
                          {new Date(history.updatedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center text-[#7f8487]">
                  <MessageSquare size={24} className="mb-3 opacity-40" />
                  <p className="text-sm font-medium text-[#c9cdcf]">Chưa có lịch sử phiên chat</p>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Các phiên đã nhắn sẽ xuất hiện tại đây để bạn mở lại nhanh.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

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
            <div className="p-3 border-b border-[rgba(255,255,255,0.1)]">
              <div className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[#f0f0f0] transition-colors">
              <LinkIcon size={14} />
              {t('playground.sources')}
            </div>
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
              <div className="rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#f0f0f0]">
                    {language === 'vi' ? 'AI Mode' : 'AI Mode'}
                  </span>
                  <span className="rounded-full border border-[rgba(59,158,255,0.35)] bg-[rgba(59,158,255,0.12)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7bc0ff]">
                    {providerInfo?.mode === 'ollama' ? 'Local' : 'API'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#a1a4a5]">
                  {providerInfo?.provider_name || 'Unknown provider'}
                  {providerInfo?.model_name ? ` · ${providerInfo.model_name}` : ''}
                </p>
                <p className="text-[11px] leading-relaxed text-[#7d8183]">
                  {providerInfo?.mode === 'ollama'
                    ? (language === 'vi' ? 'Đang dùng AI local qua Ollama.' : 'Running on local Ollama.')
                    : (language === 'vi' ? 'Đang dùng AI bên thứ 3 qua tích hợp API.' : 'Running on third-party AI via API integration.')}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#f0f0f0]">Knowledge Base ID</label>
                <select
                  value={knowledgeBaseId}
                  onChange={(e) => setKnowledgeBaseId(e.target.value)}
                  disabled={isLoadingKnowledgeBases || knowledgeBases.length === 0 || knowledgeBases.length === 1}
                  className="w-full mt-1 bg-transparent border border-[rgba(255,255,255,0.3)] px-3 py-2 rounded-[8px] text-xs text-[#f0f0f0] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:text-[#a1a4a5] disabled:cursor-not-allowed"
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
