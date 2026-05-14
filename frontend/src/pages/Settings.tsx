import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  Palette,
  ChevronDown,
  LogOut,
  Bot,
} from 'lucide-react';
import { useRole } from '../contexts/RoleContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getProviderInfo, updateProviderMode, type ChatProviderInfo } from '../api/chat';
import { useToast } from '../contexts/ToastContext';

export default function Settings() {
  const navigate = useNavigate();
  const { logout, role } = useRole();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [providerInfo, setProviderInfo] = useState<ChatProviderInfo | null>(null);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);

  useEffect(() => {
    if (role !== 'ADMIN') {
      return;
    }

    const loadProviderInfo = async () => {
      try {
        const info = await getProviderInfo();
        setProviderInfo(info);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load AI mode.';
        showToast(message, 'error');
      }
    };

    void loadProviderInfo();
  }, [role, showToast]);

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-[24px] font-display font-medium tracking-tight text-[#f0f0f0]">{t('settings.title')}</h2>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-[#a1a4a5] flex items-center justify-center">
              <Globe size={18} />
            </div>
            <h4 className="text-sm font-bold text-[#f0f0f0]">{t('settings.language')}</h4>
          </div>
          <div className="max-w-50">
            <div className="relative">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}
                className="w-50 appearance-none bg-transparent border border-[rgba(255,255,255,0.3)] text-[#f0f0f0] text-sm rounded-md px-4 py-2 focus:outline-none focus:border-[#3b9eff] focus:ring-1 focus:ring-[#3b9eff] transition-colors"
              >
                <option value="vi" className="bg-[#000000] text-[#f0f0f0]">{t('common.vietnamese')}</option>
                <option value="en" className="bg-[#000000] text-[#f0f0f0]">{t('common.english')}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a1a4a5] pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-8 ">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-[#a1a4a5] flex items-center justify-center">
              <Palette size={18} />
            </div>
            <h4 className="text-sm font-bold text-[#f0f0f0]">{t('settings.appearance')}</h4>
          </div>
          <div className="max-w-50">
            <div className="relative">
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="w-50 appearance-none bg-transparent border border-[rgba(255,255,255,0.3)] text-[#f0f0f0] text-sm rounded-md px-4 py-2 focus:outline-none focus:border-[#3b9eff] focus:ring-1 focus:ring-[#3b9eff] transition-colors"
              >
                <option value="light" className="bg-[#000000] text-[#f0f0f0]">{t('settings.theme.light')}</option>
                <option value="dark" className="bg-[#000000] text-[#f0f0f0]">{t('settings.theme.dark')}</option>
                <option value="system" className="bg-[#000000] text-[#f0f0f0]">{t('settings.theme.system')}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a1a4a5] pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {role === 'ADMIN' && (
          <div className="space-y-4 pt-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-[#a1a4a5] flex items-center justify-center">
                <Bot size={18} />
              </div>
              <h4 className="text-sm font-bold text-[#f0f0f0]">AI Mode</h4>
            </div>

            <div className="rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#f0f0f0]">
                  {providerInfo?.provider_name || 'Unknown provider'}
                </p>
                <p className="text-xs text-[#a1a4a5]">
                  {providerInfo?.model_name || 'No model configured'}
                </p>
                <p className="text-xs text-[#7d8183]">
                  {providerInfo?.mode === 'ollama'
                    ? (language === 'vi' ? 'Hệ thống hiện đang dùng AI local cho phần sinh câu trả lời.' : 'The system is currently using local AI for answer generation.')
                    : (language === 'vi' ? 'Hệ thống hiện đang dùng AI bên thứ 3 qua API cho phần sinh câu trả lời.' : 'The system is currently using third-party AI via API for answer generation.')}
                </p>
                <p className="text-xs text-[#7d8183]">
                  {language === 'vi'
                    ? 'Thay đổi này áp dụng cho toàn hệ thống và sẽ được giữ lại sau khi service khởi động lại.'
                    : 'This change applies system-wide and is preserved after service restarts.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void handleSwitchMode('ollama')}
                  disabled={isUpdatingMode || providerInfo?.mode === 'ollama'}
                  className="px-4 py-2 text-sm font-bold rounded-md border border-[rgba(255,255,255,0.16)] text-[#f0f0f0] bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Ollama Local
                </button>
                <button
                  onClick={() => void handleSwitchMode('openai-compatible')}
                  disabled={isUpdatingMode || providerInfo?.mode === 'openai-compatible'}
                  className="px-4 py-2 text-sm font-bold rounded-md border border-[rgba(59,158,255,0.28)] text-[#7bc0ff] bg-[rgba(59,158,255,0.12)] hover:bg-[rgba(59,158,255,0.18)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  DeepSeek API
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pt-8 ">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.12)] hover:text-[#ffffff] rounded-md transition-all"
          >
            <LogOut size={16} />
            {t('profile.sign_out')}
          </button>
        </div>
      </div>
    </div>
  );
}

