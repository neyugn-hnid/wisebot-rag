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
  const [temperature, setTemperature] = useState(0.7);
  const [topK, setTopK] = useState(40);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I've analyzed your request based on the connected documents. Here's what I found: Our platform supports multiple integration methods including React SDK, direct API calls, and pre-built widgets. You can find more details in the integration guide.",
        sources: [
          { name: 'Integration_Guide.pdf', snippet: '...the React SDK provides a set of hooks and components to easily embed the chat widget...' },
          { name: 'API_Reference.docx', snippet: '...all endpoints are secured with Bearer token authentication and support CORS...' }
        ]
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
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
                  max="100" 
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-[12px] appearance-none cursor-pointer accent-primary"
                />
              </div>

              <button 
                onClick={() => {
                  setShowSettings(false);
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
