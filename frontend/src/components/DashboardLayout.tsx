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
  BrainCircuit
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

  // Close mobile sidebar on route change
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
    // User Features
    { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.knowledge'), icon: Database, path: '/knowledge-base', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.playground'), icon: MessageSquare, path: '/playground', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.integration'), icon: Code, path: '/customization', roles: ['USER', 'OWNER', 'ADMIN'] },
    
    // Workspace Admin Features
    { label: t('nav.team'), icon: Users, path: '/team', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.analytics'), icon: BarChart3, path: '/analytics', roles: ['ADMIN'] },
    
    // System Admin Features
    { label: t('nav.users'), icon: Shield, path: '/users', roles: ['ADMIN'] },
    
    // Shared Features
    { label: t('nav.billing'), icon: CreditCard, path: '/billing', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.api_keys'), icon: KeyRound, path: '/api-keys', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.settings'), icon: Settings, path: '/settings', roles: ['USER', 'OWNER', 'ADMIN'] },
  ];

  const filteredItems = sidebarItems.filter(item => item.roles.includes(role));

  return (
    <div className="flex h-screen overflow-hidden bg-[#000000] selection:bg-[#ff801f] selection:text-[#ffffff]">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex border-r border-[rgba(255,255,255,0.3)] bg-[#000000] flex-col shrink-0 overflow-y-auto transition-all duration-300",
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

      {/* Mobile Sidebar Overlay */}
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
              className="fixed inset-y-0 left-0 w-72 bg-[#000000] z-[70] lg:hidden flex flex-col shadow-[rgba(176,199,217,0.145)_1px_0px_0px_0px]"
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-[rgba(255,255,255,0.3)] bg-[#000000] flex items-center justify-between px-4 lg:px-6 shrink-0 z-40 relative">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 ml-4">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full relative transition-colors",
                  isNotificationsOpen ? "bg-[rgba(255,255,255,0.05)] text-[#ffffff]" : "text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)]"
                )}
              >
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ff801f] rounded-full border-2 border-[#000000]"></span>
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="fixed left-4 right-4 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 bg-[#000000] rounded-[16px] shadow-md shadow-black/40 border border-[rgba(255,255,255,0.3)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                  <div className="p-4 border-b border-[rgba(255,255,255,0.3)] flex items-center justify-between bg-[rgba(255,255,255,0.02)]">
                    <h3 className="font-semibold text-[14px] text-[#f0f0f0]">{t('notifications.title')}</h3>
                    <button className="text-[12px] font-semibold text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">
                      {t('notifications.mark_read')}
                    </button>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-[rgba(255,255,255,0.3)]">
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={cn(
                              "p-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer flex gap-3",
                              !notification.isRead && "bg-[rgba(255,255,255,0.01)]"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                              notification.type === 'message' ? "bg-[rgba(59,158,255,0.1)] text-[#3b9eff]" :
                              notification.type === 'system' ? "bg-[rgba(17,255,153,0.1)] text-[#11ff99]" :
                              "bg-[rgba(255,197,61,0.1)] text-[#ffc53d]"
                            )}>
                              {notification.type === 'message' ? <MessageSquare size={16} /> :
                               notification.type === 'system' ? <BrainCircuit size={16} /> :
                               <CreditCard size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[14px] font-semibold text-[#f0f0f0] truncate">{notification.title}</p>
                                <span className="text-[10px] text-[#a1a4a5] whitespace-nowrap">{notification.time}</span>
                              </div>
                              <p className="text-[12px] text-[#a1a4a5] line-clamp-2 leading-relaxed">
                                {notification.description}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-[#ff801f] rounded-full mt-2 shrink-0"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-[rgba(255,255,255,0.05)] rounded-full flex items-center justify-center mx-auto mb-3 text-[#a1a4a5]">
                          <Bell size={24} />
                        </div>
                        <p className="text-[14px] text-[#a1a4a5] font-medium">{t('notifications.empty')}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-[rgba(255,255,255,0.3)] bg-[#000000]">
                    <button className="w-full py-2 text-[12px] font-semibold text-[#a1a4a5] hover:text-[#f0f0f0] transition-colors">
                      {t('notifications.view_all')}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <div 
                className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/profile')}
              >
                <img 
                  src="https://picsum.photos/seed/alex/100/100" 
                  alt="User" 
                  className="w-8 h-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
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
    <div className={cn("flex flex-col h-full bg-[#000000]", isCollapsed ? "p-4" : "p-6")}>
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

      <div className="mt-auto pt-6">
        <button 
          onClick={handleSignOut}
          title={isCollapsed ? t('profile.sign_out') : undefined}
          className={cn(
            "w-full flex items-center text-[#ff0000] hover:bg-[#ff0000]/10 rounded-md transition-colors outline-none",
            isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2 text-[14px] font-medium"
          )}
        >
          <LogOut size={isCollapsed ? 20 : 16} />
          {!isCollapsed && <span>{t('profile.sign_out')}</span>}
        </button>
      </div>
    </div>
  );
}
