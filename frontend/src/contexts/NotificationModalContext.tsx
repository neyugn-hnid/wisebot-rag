import React, { createContext, useContext, useState, useCallback } from 'react';
import { Info, CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { cn } from '../lib/utils';

export type NotificationType = 'info' | 'success' | 'error' | 'warning';

interface NotificationOptions {
  title?: string;
  message: string;
  type?: NotificationType;
  confirmText?: string;
}

interface NotificationModalContextType {
  showNotification: (options: NotificationOptions) => void;
  hideNotification: () => void;
}

const NotificationModalContext = createContext<NotificationModalContextType | undefined>(undefined);

export function NotificationModalProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<NotificationOptions>({
    title: '',
    message: '',
    type: 'info',
  });

  const showNotification = useCallback((newOptions: NotificationOptions) => {
    setOptions({
      title: newOptions.title,
      message: newOptions.message,
      type: newOptions.type || 'info',
      confirmText: newOptions.confirmText,
    });
    setIsOpen(true);
  }, []);

  const hideNotification = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <NotificationModalContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl shadow-black/50 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={cn(
                "size-16 rounded-full flex items-center justify-center mx-auto mb-4",
                options.type === 'success' && "bg-emerald-500/10 text-emerald-500",
                options.type === 'error' && "bg-rose-500/10 text-rose-500",
                options.type === 'warning' && "bg-amber-500/10 text-amber-500",
                options.type === 'info' && "bg-blue-500/10 text-blue-500"
              )}>
                {options.type === 'success' && <CheckCircle2 size={32} />}
                {options.type === 'error' && <AlertCircle size={32} />}
                {options.type === 'warning' && <AlertTriangle size={32} />}
                {options.type === 'info' && <Info size={32} />}
              </div>
              
              <h3 className="text-xl font-black text-[#f0f0f0] mb-2">
                {options.title || t('notifications.title') || "Notification"}
              </h3>
              
              <p className="text-sm text-[#a1a4a5] leading-relaxed">
                {options.message}
              </p>
            </div>
            
            <div className="p-6 border-t border-[rgba(255,255,255,0.3)] flex justify-center bg-[#000000]">
              <button 
                onClick={hideNotification}
                className={cn(
                  "w-full py-2.5 text-sm font-bold rounded-md transition-colors shadow-md",
                  options.type === 'success' ? "bg-emerald-500 text-white hover:bg-emerald-600" :
                  options.type === 'error' ? "bg-rose-500 text-white hover:bg-rose-600" :
                  options.type === 'warning' ? "bg-amber-500 text-white hover:bg-amber-600" :
                  "bg-blue-500 text-white hover:bg-blue-600"
                )}
              >
                {options.confirmText || t('common.confirm') || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationModalContext.Provider>
  );
}

export function useNotificationModal() {
  const context = useContext(NotificationModalContext);
  if (!context) {
    throw new Error('useNotificationModal must be used within a NotificationModalProvider');
  }
  return context;
}
