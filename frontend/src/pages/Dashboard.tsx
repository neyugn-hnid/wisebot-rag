import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../contexts/RoleContext';
import {
  listUsers,
  type UserPageResponse,
} from '../api/users';
import {
  listKnowledgeBases,
  type KnowledgeBaseResponse,
} from '../api/knowledge-base';
import {
  listPlans,
  type BillingPlanResponse,
} from '../api/billing';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCircle2,
  MoreHorizontal,
  CreditCard,
  Lock,
  Terminal,
  ChevronRight,
  Plus,
  Upload,
  Zap,
  ShieldCheck,
  DollarSign,
  Activity,
  AlertTriangle,
  Database,
  Bot,
  Key
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const data = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 5000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 6890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
];

const adminData = [
  { name: 'Mon', value: 24000 },
  { name: 'Tue', value: 18000 },
  { name: 'Wed', value: 32000 },
  { name: 'Thu', value: 21000 },
  { name: 'Fri', value: 45000 },
  { name: 'Sat', value: 15000 },
  { name: 'Sun', value: 22000 },
];

const COLORS = ['#94a3b8', '#3b82f6', '#8b5cf6'];

export default function Dashboard() {
  const { t } = useLanguage();
  const { role } = useRole();
  const isAdmin = role === 'ADMIN';

  const [userCount, setUserCount] = useState<number | null>(null);
  const [kbCount, setKbCount] = useState<number | null>(null);
  const [planCount, setPlanCount] = useState<number | null>(null);
  const [backendPlans, setBackendPlans] = useState<BillingPlanResponse[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, kbs, plans] = await Promise.all([
          listUsers({ page: 0, size: 1 }).catch(() => ({ totalElements: 0 } as UserPageResponse)),
          listKnowledgeBases().catch(() => [] as KnowledgeBaseResponse[]),
          listPlans().catch(() => [] as BillingPlanResponse[]),
        ]);
        setUserCount(users.totalElements);
        setKbCount(kbs.length);
        setPlanCount(plans.length);
        setBackendPlans(plans);
      } catch {
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const volumeData = [
    { name: 'Mon', value: 2400 },
    { name: 'Tue', value: 1398 },
    { name: 'Wed', value: 9800 },
    { name: 'Thu', value: 3908 },
    { name: 'Fri', value: 4800 },
    { name: 'Sat', value: 3800 },
    { name: 'Sun', value: 4300 },
  ];

  const planDistributionData = backendPlans.length > 0
    ? backendPlans.map((plan) => ({ name: plan.name, value: 1 }))
    : [
        { name: t('dashboard.plan.free'), value: 4500 },
        { name: t('dashboard.plan.pro'), value: 3200 },
        { name: t('dashboard.plan.enterprise'), value: 1200 },
      ];

  const recentActivity = !loadingStats ? [
    { id: 1, type: 'user', message: `${userCount?.toLocaleString() ?? '0'} ${t('dashboard.stats.total_users')}`, time: t('dashboard.status.operational'), icon: Users, color: 'text-blue-500' },
    { id: 2, type: 'kb', message: `${kbCount ?? 0} Knowledge Bases ${t('dashboard.status.operational')}`, time: t('dashboard.status.operational'), icon: Database, color: 'text-emerald-500' },
    { id: 3, type: 'plan', message: `${planCount ?? 0} Plans ${t('dashboard.status.operational')}`, time: t('dashboard.status.operational'), icon: CreditCard, color: 'text-indigo-500' },
  ] : [];

  const adminActivity = !loadingStats ? [
    { id: 1, type: 'users', message: `${userCount?.toLocaleString() ?? '0'} ${t('dashboard.stats.total_users')} ${t('dashboard.status.operational')}`, time: t('dashboard.status.operational'), icon: Users, color: 'text-blue-500' },
    { id: 2, type: 'kb', message: `${kbCount ?? 0} Knowledge Bases ${t('dashboard.status.operational')}`, time: t('dashboard.status.operational'), icon: Database, color: 'text-emerald-500' },
    { id: 3, type: 'plan', message: `${planCount ?? 0} Billing Plans ${t('dashboard.status.operational')}`, time: t('dashboard.status.operational'), icon: CreditCard, color: 'text-indigo-500' },
    { id: 4, type: 'health', message: t('dashboard.status.operational'), time: t('dashboard.status.operational'), icon: ShieldCheck, color: 'text-emerald-500' },
  ] : [];

  const kpis = isAdmin ? [
    { label: t('dashboard.stats.total_users'), value: loadingStats ? '...' : (userCount?.toLocaleString() ?? '0'), change: userCount ? `+${userCount}` : '--', trend: 'up' as const, icon: Users, color: 'text-blue-500' },
    { label: t('dashboard.stats.mrr'), value: loadingStats ? '...' : (planCount?.toString() ?? '0'), change: 'Plans', trend: 'up' as const, icon: DollarSign, color: 'text-emerald-500' },
    { label: t('dashboard.stats.system_health'), value: loadingStats ? '...' : (kbCount?.toString() ?? '0'), change: 'KBs', trend: 'stable' as const, icon: Database, color: 'text-indigo-500' },
    { label: t('dashboard.stats.error_rate'), value: '0.02%', change: '-0.01%', trend: 'down' as const, icon: AlertTriangle, color: 'text-[#ff0000]' },
  ] : [
    { label: t('dashboard.stats.conversations'), value: loadingStats ? '...' : (kbCount?.toString() ?? '0'), change: `${kbCount ?? 0} KBs`, trend: 'up' as const, icon: MessageSquare, color: 'text-primary' },
    { label: t('dashboard.stats.active_users'), value: loadingStats ? '...' : (userCount?.toLocaleString() ?? '0'), change: 'Users', trend: 'up' as const, icon: Users, color: 'text-blue-500' },
    { label: t('dashboard.stats.avg_time'), value: '--', change: '--', trend: 'down' as const, icon: Clock, color: 'text-amber-500' },
    { label: t('dashboard.stats.resolution'), value: '94.2%', change: '+2.4%', trend: 'up' as const, icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  const topQuestions = [
    { category: t('dashboard.category.billing'), volume: 842, change: '+14.2%', trend: 'up', icon: CreditCard },
    { category: t('dashboard.category.security'), volume: 654, change: '-2.1%', trend: 'down', icon: Lock },
    { category: t('dashboard.category.api'), volume: 432, change: '+8.5%', trend: 'up', icon: Terminal },
  ];

  const activityFeed = isAdmin ? adminActivity : recentActivity;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-display font-medium text-[#f0f0f0] tracking-tight">
            {isAdmin ? t('dashboard.admin_welcome') : t('dashboard.welcome')}
          </h2>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={kpi.label} 
            className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 hover:border-[rgba(255,255,255,0.4)] transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-[8px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.3)] flex items-center justify-center", kpi.color || "text-[#a1a4a5]")}>
                <kpi.icon size={18} />
              </div>
              <span className={cn(
                "text-[12px] font-semibold flex items-center gap-1",
                kpi.trend === 'up' ? "text-[#11ff99]" : 
                kpi.trend === 'down' ? "text-[#ff801f]" : 
                "text-[#a1a4a5]"
              )}>
                {kpi.trend === 'up' && <TrendingUp size={12} />}
                {kpi.trend === 'down' && <TrendingDown size={12} />}
                {kpi.change}
              </span>
            </div>
            <p className="text-[#a1a4a5] text-[12px] font-semibold uppercase tracking-[0.5px]">{kpi.label}</p>
            <h3 className="text-[24px] font-display font-medium text-[#f0f0f0] mt-1 tracking-tight">{kpi.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[16px] font-sans font-semibold text-[#f0f0f0]">
                {isAdmin ? t('dashboard.admin.chart_title') : t('dashboard.chart.title')}
              </h3>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-[24px] font-display font-medium text-[#f0f0f0] leading-none">
                  {isAdmin ? '1.2M' : '12,840'}
                </p>
                <p className="text-[#11ff99] text-[12px] font-semibold mt-1">{t('dashboard.chart.trend_up')}</p>
              </div>
              <select className="bg-transparent border border-[rgba(255,255,255,0.3)] text-[12px] font-semibold py-2 px-4 outline-none rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40">
                <option value="7d" className="bg-[#000000] text-[#f0f0f0]">{t('dashboard.chart.last_7d')}</option>
                <option value="30d" className="bg-[#000000] text-[#f0f0f0]">{t('dashboard.chart.last_30d')}</option>
              </select>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={isAdmin ? adminData : data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b9eff" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b9eff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(214,235,253,0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 500, fill: '#a1a4a5' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 500, fill: '#a1a4a5' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    backgroundColor: '#000000',
                    boxShadow: 'rgba(176,199,217,0.145) 0px 0px 0px 1px',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 600, color: '#f0f0f0' }}
                  labelStyle={{ fontWeight: 500, color: '#a1a4a5', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b9eff" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {}
        {isAdmin ? (
          <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-sans font-semibold text-[#f0f0f0]">{t('dashboard.activity.title')}</h3>
              <Activity size={18} className="text-[#a1a4a5]" />
            </div>
            <div className="space-y-6">
              {activityFeed.map((activity) => (
                <div key={activity.id} className="flex gap-4 group">
                  <div className={cn("w-10 h-10 rounded-[8px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.3)] flex items-center justify-center shrink-0", activity.color)}>
                    <activity.icon size={16} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[14px] font-medium text-[#f0f0f0] leading-tight group-hover:text-[#3b9eff] transition-colors">
                      {activity.message}
                    </p>
                    <p className="text-[12px] font-normal text-[#a1a4a5]">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link 
              to="/activity"
              className="w-full mt-8 py-2.5 bg-transparent text-[#a1a4a5] text-[12px] font-semibold rounded-full hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f0f0f0] transition-all border border-[rgba(255,255,255,0.3)] block text-center"
            >
              {t('dashboard.view_all')}
            </Link>
          </div>
        ) : (
          <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-sans font-semibold text-[#f0f0f0]">{t('dashboard.quick_actions')}</h3>
            </div>
            <div className="space-y-4">
              <Link to="/knowledge-base" className="block p-4 rounded-[12px] border border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.02)] transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#11ff99]/10 text-[#11ff99] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Database size={16} />
                  </div>
                  <h4 className="text-[14px] font-semibold text-[#f0f0f0]">{t('nav.knowledge')}</h4>
                </div>
                <p className="text-[12px] text-[#a1a4a5]">{t('dashboard.quick_actions.knowledge_desc')}</p>
              </Link>
              <Link to="/playground" className="block p-4 rounded-[12px] border border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.02)] transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#3b9eff]/10 text-[#3b9eff] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bot size={16} />
                  </div>
                  <h4 className="text-[14px] font-semibold text-[#f0f0f0]">{t('nav.playground')}</h4>
                </div>
                <p className="text-[12px] text-[#a1a4a5]">{t('dashboard.quick_actions.playground_desc')}</p>
              </Link>
              <Link to="/api-keys" className="block p-4 rounded-[12px] border border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.02)] transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#ff801f]/10 text-[#ff801f] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Key size={16} />
                  </div>
                  <h4 className="text-[14px] font-semibold text-[#f0f0f0]">{t('nav.api_keys')}</h4>
                </div>
                <p className="text-[12px] text-[#a1a4a5]">{t('dashboard.quick_actions.api_keys_desc')}</p>
              </Link>
            </div>
          </div>
        )}
      </div>

      {}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {}
          <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-sans font-semibold text-[#f0f0f0]">{t('dashboard.conversation_volume')}</h3>
              <Activity size={18} className="text-[#a1a4a5]" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(214,235,253,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a4a5' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#f0f0f0' }} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: '#000000', boxShadow: 'rgba(176,199,217,0.145) 0px 0px 0px 1px' }}
                    itemStyle={{ color: '#f0f0f0' }}
                  />
                  <Bar dataKey="value" fill="#3b9eff" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {}
          <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-sans font-semibold text-[#f0f0f0]">{t('dashboard.plan_distribution')}</h3>
              <Users size={18} className="text-[#a1a4a5]" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {planDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: '#000000', boxShadow: 'rgba(176,199,217,0.145) 0px 0px 0px 1px' }}
                    itemStyle={{ fontWeight: 500, color: '#f0f0f0' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#a1a4a5' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
