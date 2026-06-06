import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  MessageSquare, 
  BarChart3, 
  KeyRound, 
  CreditCard, 
  Settings,
  Code,
  Shield,
  X,
  User,
  Menu,
  FileText,
  HelpCircle,
  Tag,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useRole } from '../contexts/RoleContext';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './Logo';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { role } = useRole();
  const { t } = useLanguage();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = React.useState(false);

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const sidebarItems = [
    // User Features
    { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard', roles: ['ADMIN'] },
    { label: t('nav.knowledge'), icon: Database, path: '/knowledge-base', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.playground'), icon: MessageSquare, path: '/playground', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.integration'), icon: Code, path: '/customization', roles: ['USER', 'OWNER', 'ADMIN'] },
    
    // Workspace Admin Features
    { label: t('nav.analytics'), icon: BarChart3, path: '/analytics', roles: ['ADMIN'] },
    
    // System Admin Features
    { label: t('nav.users'), icon: Shield, path: '/users', roles: ['ADMIN'] },
    
    // Shared Features
    { label: t('nav.billing'), icon: CreditCard, path: '/billing', roles: ['USER', 'OWNER', 'ADMIN'] },
    { label: t('nav.api_keys'), icon: KeyRound, path: '/api-keys', roles: ['USER', 'OWNER', 'ADMIN'] },
  ];

  const filteredItems = sidebarItems.filter(item => item.roles.includes(role));

  return (
    <div className="flex h-screen overflow-hidden bg-[#151517] selection:bg-[#ff801f] selection:text-[#ffffff]">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex border-r border-[rgba(255,255,255,0.3)] bg-[#1b1b1c] flex-col shrink-0 overflow-y-auto transition-all duration-300",
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
              className="fixed inset-0 bg-[rgba(44,44,46,0.48)] backdrop-blur-md z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#1b1b1c] z-[70] lg:hidden flex flex-col shadow-[rgba(176,199,217,0.145)_1px_0px_0px_0px]"
            >
              <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.3)]">
                <div className="max-w-[160px] w-full">
                  <Logo theme="dark" customSize={84} />
                </div>
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
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 lg:hidden p-2 text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors bg-[#151517]/80 backdrop-blur-sm"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-16 lg:pt-8 scrollbar-hide bg-[#151517]">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ filteredItems, role, t, location, isCollapsed, onToggleCollapse }: any) {
  return (
    <div className={cn("flex flex-col h-full", isCollapsed ? "p-4" : "p-6")}>
      <div className={cn("hidden lg:flex mb-8 items-center", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <div className="max-w-[200px] w-full">
            <Logo theme="dark" customSize={110} />
          </div>
        )}
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
          { icon: HelpCircle, label: t('nav.faq'), href: '/docs?tab=faq' },
          { icon: Tag, label: t('nav.pricing'), href: '/pricing' },
          { icon: Code, label: t('nav.integration_secondary'), href: '/docs?tab=widget' },
          { icon: Send, label: t('nav.contact'), href: '/docs?tab=contact' },
          { icon: User, label: t('nav.profile') || 'Profile', href: '/profile' },
        ].map((item) => {
          const isActive = item.href.includes('?') 
            ? location.pathname + location.search === item.href 
            : location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-md transition-colors",
                isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2 text-[14px] font-medium",
                isActive
                  ? "bg-[rgba(255,255,255,0.05)] text-[#ffffff]"
                  : "text-[#a1a4a5] hover:text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.02)]"
              )}
            >
              <item.icon size={isCollapsed ? 20 : 16} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

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
