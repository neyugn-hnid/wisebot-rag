import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';
import {
  Send, 
  User, 
  Check,
  ChevronDown,
  FileText, 
  Link as LinkIcon, 
  ChevronLeft,
  PanelLeft,
  MessageSquare,
  SquarePen,
  Info,
  Trash2,
  X
} from 'lucide-react';
import { getStoredAccessToken } from '../lib/auth';
import { cn } from '../lib/utils';
import {
  createSession,
  listSessions,
  listMessages,
  deleteSession,
  ask,
  askStream,
  getCitations,
  type ChatSessionResponse,
  type ChatMessageResponse,
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

const INITIAL_MESSAGES: Message[] = [];

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
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);
  const [isKnowledgeBaseDropdownOpen, setIsKnowledgeBaseDropdownOpen] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const knowledgeBaseDropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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
      title: t('playground.session_default_title'),
    });

    const newSessionId = session.id;
    if (!newSessionId) {
      throw new Error(t('playground.session_create_failed'));
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

    return rawTitle || t('playground.session_fallback_title');
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
      const message = error instanceof Error ? error.message : t('playground.kb.load_failed');
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
    showToast(t('playground.new_chat_created'), 'success');
  };

  const handleSaveSettings = async () => {
    const resolvedTenantId = tenantId.trim();
    if (!resolvedTenantId) {
      showToast(t('playground.tenant_missing'), 'error');
      return;
    }

    try {
      window.localStorage.setItem('wisebot_tenant_id', resolvedTenantId);
      if (knowledgeBaseId.trim()) {
        window.localStorage.setItem('wisebot_kb_id', knowledgeBaseId.trim());
      } else {
        window.localStorage.removeItem('wisebot_kb_id');
      }
      showToast(t('playground.save_success'), 'success');
      setShowSettings(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('playground.settings_save_failed');
      showToast(message, 'error');
    }
  };

  const handleSelectHistory = (history: ChatHistoryItem) => {
    void loadSessionMessages(history.sessionId).catch((error) => {
      const message = error instanceof Error ? error.message : t('playground.history.load_failed');
      showToast(message, 'error');
    });
  };

  const handleDeleteHistory = async (history: ChatHistoryItem) => {
    const resolvedTenantId = resolveTenantIdFromToken();
    if (!resolvedTenantId) {
      showToast(t('playground.tenant_missing'), 'error');
      return;
    }

    setDeletingSessionId(history.sessionId);
    try {
      await deleteSession(history.sessionId);

      setChatHistories((prev) => prev.filter((item) => item.sessionId !== history.sessionId));

      if (history.sessionId === sessionId) {
        setSessionId('');
        setMessages(INITIAL_MESSAGES);
        window.localStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
      }

      showToast(t('playground.history.deleted'), 'success');
      await loadChatHistories(resolvedTenantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('playground.history.delete_failed');
      showToast(message, 'error');
    } finally {
      setDeletingSessionId('');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const resolvedTenantId = resolveTenantIdFromToken();
    if (!resolvedTenantId) {
      showToast(t('playground.tenant_missing'), 'error');
      return;
    }

    if (knowledgeBases.length > 1 && !knowledgeBaseId.trim()) {
      showToast(t('playground.kb.required'), 'error');
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

      const requestPayload = {
        question: userMessage.content,
        topK,
        temperature,
        knowledgeBaseId: knowledgeBaseId.trim() || undefined,
      };

      const assistantMessageId = `temp-assistant-${Date.now() + 1}`;
      let receivedStreamToken = false;
      const queuedTokens: string[] = [];
      let drainPromise: Promise<void> | null = null;

      const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
      const appendAssistantToken = (token: string) => {
        setMessages((currentMessages) => currentMessages.map((message) => (
          message.id === assistantMessageId
            ? { ...message, content: `${message.content}${token}` }
            : message
        )));
      };
      const drainQueuedTokens = async () => {
        while (queuedTokens.length > 0) {
          const token = queuedTokens.shift() || '';
          appendAssistantToken(token);
          await wait(18);
        }
      };
      const enqueueAssistantToken = (token: string) => {
        queuedTokens.push(token);
        if (!drainPromise) {
          drainPromise = drainQueuedTokens().finally(() => {
            drainPromise = null;
          });
        }
      };
      const waitForQueuedTokens = async () => {
        while (drainPromise || queuedTokens.length > 0) {
          await (drainPromise || wait(18));
        }
      };

      setMessages([...nextUserMessages, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
      }]);
      setStreamingMessageId(assistantMessageId);
      setSessionId(activeSessionId);
      window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, activeSessionId);

      try {
        await askStream(activeSessionId, requestPayload, (token) => {
          receivedStreamToken = true;
          enqueueAssistantToken(token);
        });
        await waitForQueuedTokens();

        try {
          const syncedMessages = await fetchSessionMessages(activeSessionId);
          setMessages(syncedMessages.length > 0 ? syncedMessages : [...nextUserMessages]);
        } catch {
          // Keep the streamed temporary answer visible if message refresh fails.
        }

        void loadChatHistories(resolvedTenantId, activeSessionId);
        return;
      } catch (streamError) {
        if (receivedStreamToken) {
          await waitForQueuedTokens();
          try {
            const syncedMessages = await fetchSessionMessages(activeSessionId);
            setMessages(syncedMessages.length > 0 ? syncedMessages : [...nextUserMessages]);
          } catch {
            // The streamed answer is already visible; avoid showing a noisy network toast.
          }
          void loadChatHistories(resolvedTenantId, activeSessionId);
          return;
        }
      }

      const responseData = await ask(activeSessionId, requestPayload);
      const rawAnswer = responseData?.answer;
      const answer = typeof rawAnswer === 'string' && rawAnswer.trim()
        ? rawAnswer
        : t('playground.no_answer');
      const userMessageId = typeof responseData?.userMessageId === 'string' ? responseData.userMessageId : userMessage.id;
      const persistedAssistantMessageId = typeof responseData?.assistantMessageId === 'string' ? responseData.assistantMessageId : assistantMessageId;
      const sources = mapCitationSources(responseData?.citations);

      const assistantMessage: Message = {
        id: persistedAssistantMessageId,
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
      setStreamingMessageId('');
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const latestAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && m.sources);
  const selectedKnowledgeBase = knowledgeBases.find((item) => item.id === knowledgeBaseId) || null;
  const canChooseKnowledgeBase = !isLoadingKnowledgeBases && knowledgeBases.length > 1;
  const knowledgeBaseDropdownLabel = isLoadingKnowledgeBases
    ? t('playground.kb.loading')
    : knowledgeBases.length === 0
      ? t('playground.kb.none')
      : selectedKnowledgeBase?.name || t('playground.kb.select');

  const renderInlineText = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.trim().split(/\r?\n/);
    const blocks: React.ReactNode[] = [];
    let paragraph: string[] = [];
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushParagraph = () => {
      if (paragraph.length === 0) return;
      const text = paragraph.join(' ').replace(/\s+/g, ' ').trim();
      if (text) {
        blocks.push(
          <p key={`p-${blocks.length}`} className="leading-6">
            {renderInlineText(text)}
          </p>
        );
      }
      paragraph = [];
    };

    const flushList = () => {
      if (!listType || listItems.length === 0) return;
      const ListTag = listType;
      blocks.push(
        <ListTag key={`list-${blocks.length}`} className={cn(
          "space-y-1.5 pl-5 leading-6",
          listType === 'ul' ? "list-disc" : "list-decimal"
        )}>
          {listItems.map((item, index) => (
            <li key={index}>{renderInlineText(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      const heading = line.match(/^#{1,3}\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        blocks.push(
          <h4 key={`h-${blocks.length}`} className="text-[15px] font-semibold text-white leading-6">
            {renderInlineText(heading[1])}
          </h4>
        );
        return;
      }

      const bullet = line.match(/^[-*]\s+(.+)$/);
      const numbered = line.match(/^\d+[.)]\s+(.+)$/);
      if (bullet || numbered) {
        flushParagraph();
        const nextType = bullet ? 'ul' : 'ol';
        if (listType && listType !== nextType) {
          flushList();
        }
        listType = nextType;
        listItems.push((bullet?.[1] || numbered?.[1] || '').trim());
        return;
      }

      flushList();
      paragraph.push(line);
    });

    flushParagraph();
    flushList();

    return <div className="space-y-3">{blocks}</div>;
  };

  return (
    <div className="-m-4 lg:-m-8 h-screen flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,158,255,0.08),transparent_28%),#050505] relative w-[calc(100%+32px)] lg:w-[calc(100%+64px)]">
      {showHistory && (
        <button
          type="button"
          aria-label="Đóng lịch sử phiên chat"
          className="lg:hidden absolute inset-0 bg-black/60 z-20"
          onClick={() => setShowHistory(false)}
        />
      )}
      {showSettings && (
        <button
          type="button"
          aria-label="Đóng cài đặt mô hình"
          className="lg:hidden absolute inset-0 bg-black/60 z-20"
          onClick={() => setShowSettings(false)}
        />
      )}

      

      <div className="flex-1 flex overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 z-30 w-72 border-r border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl transition-transform duration-300 lg:relative lg:translate-x-0",
            isHistoryCollapsed ? "lg:w-0 lg:min-w-0 lg:overflow-hidden lg:border-r-0" : "",
            showHistory ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-[72px] items-center gap-2 border-b border-[rgba(255,255,255,0.1)] px-3">
              <button
                type="button"
                onClick={handleStartNewChat}
                className="flex w-full items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-left text-sm font-medium text-[#f0f0f0] transition-colors cursor-pointer hover:bg-[rgba(255,255,255,0.06)]"
              >
                <SquarePen size={16} />
                {t('playground.new_chat')}
              </button>
              <button
                type="button"
                onClick={() => setIsHistoryCollapsed(true)}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-[#d7d9da] transition-colors hover:bg-[rgba(255,255,255,0.06)] lg:inline-flex"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
              {chatHistories.length > 0 ? (
                <div className="space-y-2">
                  {chatHistories.map((history) => {
                    const isActive = history.sessionId === sessionId;
                    return (
                      <div
                        key={history.sessionId}
                        className={cn(
                          "group flex items-center gap-2 px-1 py-1 transition-all",
                          isActive
                            ? ""
                            : ""
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectHistory(history)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className={cn(
                            "min-w-0 truncate text-sm transition-colors",
                            isActive ? "font-semibold text-[#f0f0f0]" : "font-medium text-[#8d9295] hover:text-[#f0f0f0]"
                          )}>
                            {history.title}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteHistory(history)}
                          disabled={deletingSessionId === history.sessionId}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-[#7f8487] transition-colors hover:text-[#ff0000] disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={t('playground.history.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center text-[#7f8487]">
                  <MessageSquare size={24} className="mb-3 opacity-40" />
                  <p className="text-sm font-medium text-[#c9cdcf]">{t('playground.history.empty')}</p>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    {t('playground.history.empty_desc')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[rgba(255,255,255,0.12)]">
          <div className="border-b border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)]/80 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex h-[72px] items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isHistoryCollapsed ? (
                  <button
                    type="button"
                    onClick={() => setIsHistoryCollapsed(false)}
                    className="hidden h-10 w-10 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-[#d7d9da] transition-colors hover:bg-[rgba(255,255,255,0.06)] lg:inline-flex"
                  >
                    <PanelLeft size={18} />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-[#d7d9da] transition-colors hover:bg-[rgba(255,255,255,0.06)] lg:hidden"
                >
                  <PanelLeft size={18} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-[#f5f5f5]">{t('playground.page_title')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div ref={knowledgeBaseDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsKnowledgeBaseDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-[12px] border border-[#ffffff] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,158,255,0.24)] w-[200px]"
                  >
                    <span className="truncate flex-1 text-left">{knowledgeBaseDropdownLabel}</span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        "shrink-0 text-[#8d9295] transition-transform",
                        isKnowledgeBaseDropdownOpen ? "rotate-180" : ""
                      )}
                    />
                  </button>

                  {isKnowledgeBaseDropdownOpen ? (
                    <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-[200px] overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[#0b0b0c] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.42)]">
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
                              "flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-left text-xs transition-colors",
                              isSelected
                                ? "bg-[rgba(59,158,255,0.10)] text-[#f0f0f0]"
                                : "text-[#c9cdcf] hover:bg-[rgba(255,255,255,0.05)]"
                            )}
                          >
                            <span className="truncate">{kb.name}</span>
                            {isSelected ? <Check size={14} className="shrink-0 text-[#3b9eff]" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide" ref={chatContainerRef}>
            {messages.map((msg) => {
              const isPendingAssistant = msg.role === 'assistant' && msg.id === streamingMessageId && !msg.content;

              return (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    msg.role === 'user' ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-md shadow-black/40",
                    msg.role === 'assistant' ? "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.12)]" : "bg-[rgba(255,255,255,0.88)]"
                  )}>
                    {msg.role === 'assistant' ? <Logo iconOnly size="sm" className="scale-75" /> : <User size={16} className="text-[#a1a4a5]" />}
                  </div>
                  <div className={cn(
                    isPendingAssistant ? "flex items-center gap-1 px-0.5 py-1.5" : "space-y-1 max-w-[85%] sm:max-w-2xl",
                    msg.role === 'user' ? "text-right" : ""
                  )}>
                    {isPendingAssistant ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </>
                    ) : (
                      <div className={cn(
                        "p-4 rounded-[16px] text-[14px] leading-relaxed shadow-md shadow-black/40 font-messenger font-medium",
                        msg.role === 'assistant'
                          ? "bg-[rgba(255,255,255,0.04)] text-[#f0f0f0] rounded-tl-none border border-[rgba(255,255,255,0.12)]"
                          : "bg-[rgba(255,255,255,0.92)] text-[#111111] rounded-tr-none text-left whitespace-pre-wrap"
                      )}>
                        {msg.role === 'assistant' ? renderFormattedContent(msg.content) : msg.content}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isTyping && !streamingMessageId && (
              <div className="flex items-start gap-4 animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.12)] shadow-md shadow-black/40 shrink-0 overflow-hidden">
                  <Logo iconOnly size="sm" className="scale-75" />
                </div>
                <div className="flex items-center gap-1 px-0.5 py-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-[#151517]/70 p-4 backdrop-blur-xl sm:p-6">
            <div className="max-w-3xl mx-auto relative group">
              <div className="relative flex items-end gap-2 rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] p-1.5 transition-all duration-300 shadow-md shadow-black/40 focus-within:bg-[rgba(255,255,255,0.06)]">
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
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={cn(
          "fixed inset-y-0 right-0 z-30 flex w-80 shrink-0 transform flex-col bg-[rgba(255,255,255,0.03)] backdrop-blur-xl shadow-2xl transition-transform duration-300 lg:relative lg:shadow-none",
          isSettingsCollapsed ? "lg:w-0 lg:min-w-0 lg:overflow-hidden" : "",
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
          <div className="flex-1 flex flex-col overflow-hidden border-b border-[rgba(255,255,255,0.12)]">
            <div className="flex h-[72px] items-center gap-2 border-b border-[rgba(255,255,255,0.1)] px-3">
              <div className="flex h-12 w-full items-center gap-3 px-4 text-left text-sm font-medium text-[#f0f0f0] transition-colors">
                <LinkIcon size={14} />
                {t('playground.sources')}
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsCollapsed(true)}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-[#d7d9da] transition-colors hover:bg-[rgba(255,255,255,0.06)] lg:inline-flex"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {latestAssistantMessage?.sources ? (
                latestAssistantMessage.sources.map((source, i) => (
                  <div key={i} className="rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-3 transition-all shadow-md shadow-black/30 group hover:bg-[rgba(255,255,255,0.06)]">
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
                    {t('playground.sources.empty')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
