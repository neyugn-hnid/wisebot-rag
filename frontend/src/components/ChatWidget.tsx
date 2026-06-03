import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Brain, 
  Cpu, 
  MessageCircle, 
  Zap, 
  Smile, 
  Star, 
  User, 
  ChevronDown, 
  Send,
  MessageSquare,
  X,
  Paperclip
} from 'lucide-react';
import { cn } from '../lib/utils';
import Logo, { CustomRobotLogo } from './Logo';
import { useLanguage } from '../contexts/LanguageContext';

export const BOT_ICONS = [
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

interface ChatWidgetProps {
  primaryColor: string;
  botName: string;
  welcomeMsg: string;
  selectedIconId: string;
  iconColor: string;
  customIconUrl: string | null;
  position?: 'left' | 'right';
  isDemo?: boolean;
}

export default function ChatWidget({
  primaryColor,
  botName,
  welcomeMsg,
  selectedIconId,
  iconColor,
  customIconUrl,
  position = 'right',
  isDemo = false
}: ChatWidgetProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(isDemo ? false : true);
  
  const SelectedIcon = BOT_ICONS.find(i => i.id === selectedIconId)?.icon || CustomRobotLogo;

  const renderBotIcon = (size: number) => (
    selectedIconId === 'custom' && customIconUrl ? (
      <img src={customIconUrl} alt="Bot" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
    ) : (
      <SelectedIcon size={size} />
    )
  );

  const widgetContent = (
    <div className={cn(
      "bg-[#ffffff] shadow-[0_24px_70px_rgba(15,23,42,0.22)] rounded-[22px] border border-slate-200/80 flex flex-col overflow-hidden transition-all duration-500",
      isDemo ? "w-[calc(100vw-32px)] sm:w-[400px] h-[500px] sm:h-[600px] max-h-[calc(100dvh-100px)]" : "w-full h-full"
    )}>
      {/* Widget Header */}
      <div className="px-4 py-3.5 flex items-center justify-between text-white shrink-0" style={{ backgroundColor: primaryColor }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/16 border border-white/18 flex items-center justify-center overflow-hidden shadow-sm" style={{ color: iconColor }}>
            {renderBotIcon(21)}
          </div>
          <div>
            <h4 className="text-sm font-bold leading-tight">{botName}</h4>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/14 px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
              <span className="text-[10px] font-semibold opacity-95">{t('widget.preview.online')}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => isDemo && setIsOpen(false)}
          className="p-2 hover:bg-white/12 rounded-[10px] transition-colors"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Widget Chat Area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-hide bg-[#f6f7f9]">
        <div className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-400 shadow-sm ring-1 ring-slate-200/70">
          {t('widget.product_name')}
        </div>
        <div className="flex items-start">
          <div className="max-w-[85%] break-words whitespace-pre-wrap bg-white px-3.5 py-3 rounded-[16px] rounded-tl-[5px] border border-slate-200/80 text-slate-800 shadow-sm leading-relaxed font-messenger text-[14px]">
            {welcomeMsg}
          </div>
        </div>
        
        <div className="flex items-start justify-end">
          <div className="max-w-[85%] break-words whitespace-pre-wrap px-3.5 py-3 rounded-[16px] rounded-tr-[5px] text-white shadow-sm leading-relaxed font-messenger text-[14px]" style={{ backgroundColor: primaryColor }}>
            {t('widget.sample_user_question')}
          </div>
        </div>

        <div className="flex items-start">
          <div className="max-w-[85%] break-words whitespace-pre-wrap bg-white px-3.5 py-3 rounded-[16px] rounded-tl-[5px] border border-slate-200/80 text-slate-800 shadow-sm leading-relaxed font-messenger text-[14px]">
            {t('widget.sample_bot_answer')}
          </div>
        </div>
      </div>

      {/* Widget Input Area */}
      <div className="p-4 border-t border-slate-200/80 bg-white shrink-0">
        <div className="flex items-center gap-2 bg-[#f6f7f9] rounded-[18px] px-2 py-1.5 border border-slate-200 focus-within:border-slate-300 focus-within:bg-white transition-all duration-300 shadow-sm">
          <button className="p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none shrink-0 outline-none">
            <Paperclip size={18} />
          </button>
          <input 
            type="text" 
            placeholder={t('widget.preview.ask')} 
            className="flex-1 bg-transparent px-1 outline-none border-none text-slate-900 text-[14px] focus:ring-0 placeholder:text-slate-400"
          />
          <button className="p-2 bg-transparent border-none transition-colors shrink-0 outline-none hover:opacity-80" style={{ color: primaryColor }}>
            <Send size={18} className="translate-x-[1px]" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1 opacity-65">
          <span className="text-[10px] font-normal text-slate-500 tracking-wide">{t('widget.powered_by')}</span>
          <Logo iconOnly size="sm" className="scale-[0.4] -mx-2 filter invert" />
          <span className="text-[10px] font-semibold text-slate-600">{t('widget.product_name')}</span>
        </div>
      </div>
    </div>
  );

  if (!isDemo) return widgetContent;

  return (
    <div className={cn(
      "fixed bottom-4 sm:bottom-8 z-50 transition-all duration-500",
      position === 'right' ? "right-4 sm:right-8" : "left-4 sm:left-8"
    )}>
      {isOpen ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {widgetContent}
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-[20px] shadow-[0_18px_45px_rgba(15,23,42,0.28)] flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all animate-in zoom-in duration-300" 
          style={{ backgroundColor: primaryColor }}
        >
          <MessageSquare size={32} />
        </button>
      )}
    </div>
  );
}
