import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  MessageSquare, 
  Palette, 
  BarChart3, 
  Users, 
  KeyRound, 
  CreditCard, 
  Settings,
  Bell,
  Search,
  ChevronDown,
  Bot,
  Code,
  Shield,
  X,
  LogOut,
  User,
  Mail,
  Calendar,
  Menu,
  BrainCircuit,
  FileText,
  HelpCircle,
  Tag,
  Layers,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useRole } from '../contexts/RoleContext';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './Logo';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, logout } = useRole();
  const { t } = useLanguage();
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = React.useState(false);
  const notificationsRef = React.useRef<HTMLDivElement>(null);

  const notifications = [
    {
      id: 1,
      title: t('notifications.new_message'),
      description: 'Sarah sent you a message about the new chatbot.',
      time: '2m ago',
      isRead: false,
      type: 'message'
    },
    {
      id: 2,
      title: t('notifications.system_update'),
      description: 'WiseBot v2.4 is now live with GPT-4o support.',
      time: '1h ago',
      isRead: false,
      type: 'system'
    },
    {
      id: 3,
      title: t('notifications.billing_alert'),
      description: 'Your monthly usage is at 85% of your plan limit.',
      time: '5h ago',
      isRead: true,
      type: 'billing'
    }
  ];

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sidebarItems = [
    { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.knowledge'), icon: Database, path: '/knowledge-base', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.playground'), icon: MessageSquare, path: '/playground', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.integration'), icon: Code, path: '/customization', roles: ['USER', 'OWNER', 'ADMIN'] },
    
    { label: t('nav.analytics'), icon: BarChart3, path: '/analytics', roles: ['ADMIN'] },
    
    { label: t('nav.users'), icon: Shield, path: '/users', roles: ['ADMIN'] },
    
    { label: t('nav.billing'), icon: CreditCard, path: '/billing', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.api_keys'), icon: KeyRound, path: '/api-keys', roles: ['USER', 'OWNER', 'ADMIN'] },
  ];

  const filteredItems = sidebarItems.filter(item => item.roles.includes(role));

  return (
    <div className="flex h-screen overflow-hidden bg-[#000000] selection:bg-[#ff801f] selection:text-[#ffffff]">
      {}
      <aside className={cn(
        "hidden lg:flex border-r border-[rgba(255,255,255,0.3)] bg-[#2c2c2e] flex-col shrink-0 overflow-y-auto transition-all duration-300",
        isDesktopSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent 
          filteredItems={filteredItems} 
          role={role} 
          t={t} 
          location={location} 
          isCollapsed={isDesktopSidebarCollapsed}
          onToggleCollapse={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
        />
      </aside>

      {}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#2c2c2e] z-[70] lg:hidden flex flex-col shadow-[rgba(176,199,217,0.145)_1px_0px_0px_0px]"
            >
              <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.3)]">
                <Logo theme="dark" size="sm" />
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 text-[#a1a4a5] hover:text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent filteredItems={filteredItems} role={role} t={t} location={location} isCollapsed={false} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-hide bg-[#000000]">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ filteredItems, role, t, location, isCollapsed = false, onToggleCollapse }: any) {
  const navigate = useNavigate();
  const { logout } = useRole();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={cn("flex flex-col h-full ", isCollapsed ? "p-4" : "p-6")}>
      <div className={cn("hidden lg:flex mb-8 items-center", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && <Logo theme="dark" size="sm" />}
        {onToggleCollapse && (
          <button 
            onClick={onToggleCollapse}
            className="p-2 text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
      </div>
      
      <nav className="space-y-1 flex-1">
        {filteredItems.map((item: any) => {
          const Icon = item.icon as any;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-md transition-all group",
                isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2 text-[14px] font-medium",
                isActive 
                  ? "bg-[rgba(255,255,255,0.05)] text-[#ffffff]" 
                  : "text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.02)] hover:text-[#f0f0f0]"
              )}
            >
              <Icon size={isCollapsed ? 20 : 16} className={cn(isActive ? "text-[#f0f0f0]" : "text-[#a1a4a5] group-hover:text-[#f0f0f0]")} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 space-y-1">
        {[
          { icon: FileText, label: t('nav.docs'), href: '/docs' },
          { icon: HelpCircle, label: t('nav.faq'), href: '/faq' },
          { icon: Tag, label: t('nav.pricing'), href: '/pricing' },
          { icon: Layers, label: t('nav.integration_secondary'), href: '/integration' },
          { icon: Send, label: t('nav.contact'), href: '/contact' },
          { icon: User, label: t('nav.profile') || 'Profile', href: '/profile' },
        ].map((item) => (
          <Link
            key={item.href}
            to={item.href}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "flex items-center rounded-md transition-colors",
              isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2 text-[14px] font-medium",
              location.pathname === item.href
                ? "bg-[rgba(255,255,255,0.05)] text-[#ffffff]"
                : "text-[#a1a4a5] hover:text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.02)]"
            )}
          >
            <item.icon size={isCollapsed ? 20 : 16} />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}

        <Link
          to="/settings"
          title={isCollapsed ? t('nav.settings') : undefined}
          className={cn(
            "flex items-center rounded-md transition-colors",
            isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2 text-[14px] font-medium",
            location.pathname === '/settings'
              ? "bg-[rgba(255,255,255,0.05)] text-[#ffffff]"
              : "text-[#a1a4a5] hover:text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.02)]"
          )}
        >
          <Settings size={isCollapsed ? 20 : 16} />
          {!isCollapsed && <span>{t('nav.settings')}</span>}
        </Link>
      </div>
    </div>
  );
}
