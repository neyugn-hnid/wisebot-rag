import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  Palette,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRole } from '../contexts/RoleContext';

export default function Settings() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { logout } = useRole();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
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
          <div className="max-w-xs">
            <div >
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}
                className="w-50 appearance-none bg-transparent border border-[rgba(255,255,255,0.3)] text-[#f0f0f0] text-sm rounded-md px-4 py-2 focus:outline-none focus:border-[#3b9eff] focus:ring-1 focus:ring-[#3b9eff] transition-colors"
              >
                <option value="vi" className="bg-[#000000] text-[#f0f0f0]">{t('common.vietnamese')}</option>
                <option value="en" className="bg-[#000000] text-[#f0f0f0]">{t('common.english')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] pointer-events-none" size={16} />
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
          <div className="max-w-xs">
            <div >
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="w-50 appearance-none bg-transparent border border-[rgba(255,255,255,0.3)] text-[#f0f0f0] text-sm rounded-md px-4 py-2 focus:outline-none focus:border-[#3b9eff] focus:ring-1 focus:ring-[#3b9eff] transition-colors"
              >
                <option value="light" className="bg-[#000000] text-[#f0f0f0]">{t('settings.theme.light')}</option>
                <option value="dark" className="bg-[#000000] text-[#f0f0f0]">{t('settings.theme.dark')}</option>
                <option value="system" className="bg-[#000000] text-[#f0f0f0]">{t('settings.theme.system')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a4a5] pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        <div className="pt-8">
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
