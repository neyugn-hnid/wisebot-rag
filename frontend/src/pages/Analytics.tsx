import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../contexts/RoleContext';
import { 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Users, 
  Clock, 
  Zap,
  Key,
  CreditCard,
  Activity,
  Server,
  DollarSign
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const barData = [
  { name: 'Mon', value: 2400 },
  { name: 'Tue', value: 1398 },
  { name: 'Wed', value: 9800 },
  { name: 'Thu', value: 3908 },
  { name: 'Fri', value: 4800 },
  { name: 'Sat', value: 3800 },
  { name: 'Sun', value: 4300 },
];

const lineData = [
  { name: '00:00', value: 400 },
  { name: '04:00', value: 300 },
  { name: '08:00', value: 2000 },
  { name: '12:00', value: 2780 },
  { name: '16:00', value: 1890 },
  { name: '20:00', value: 2390 },
  { name: '23:59', value: 3490 },
];

const userGrowthData = [
  { name: 'Mon', newUsers: 120, activeUsers: 450 },
  { name: 'Tue', newUsers: 150, activeUsers: 500 },
  { name: 'Wed', newUsers: 200, activeUsers: 550 },
  { name: 'Thu', newUsers: 180, activeUsers: 520 },
  { name: 'Fri', newUsers: 250, activeUsers: 600 },
  { name: 'Sat', newUsers: 300, activeUsers: 750 },
  { name: 'Sun', newUsers: 280, activeUsers: 800 },
];

const apiUsageData = [
  { name: 'Mon', requests: 120000, errors: 500 },
  { name: 'Tue', requests: 135000, errors: 400 },
  { name: 'Wed', requests: 180000, errors: 800 },
  { name: 'Thu', requests: 160000, errors: 600 },
  { name: 'Fri', requests: 210000, errors: 700 },
  { name: 'Sat', requests: 250000, errors: 900 },
  { name: 'Sun', requests: 230000, errors: 850 },
];

const planDistributionData = [
  { name: 'Free', value: 4500 },
  { name: 'Pro', value: 3200 },
  { name: 'Enterprise', value: 1200 },
];

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6'];

export default function Analytics() {
  const { t } = useLanguage();
  const { role } = useRole();
  const isAdmin = role === 'ADMIN' || role === 'OWNER';

  const kpis = [
    { label: t('dashboard.stats.conversations'), value: '12,543', change: '+12.5%', trend: 'up', icon: MessageSquare },
    { label: t('dashboard.stats.active_users'), value: '1,205', change: '+5.2%', trend: 'up', icon: Users },
    { label: t('dashboard.stats.avg_time'), value: '1m 42s', change: '-8.1%', trend: 'down', icon: Clock },
    { label: t('dashboard.stats.resolution'), value: '94.2%', change: '+2.4%', trend: 'up', icon: Zap },
  ];

  const adminKpis = [
    { label: t('analytics.admin.total_users'), value: '42,840', change: '+18.2%', trend: 'up', icon: Users, color: 'text-blue-500' },
    { label: t('analytics.admin.mrr'), value: '$124,500', change: '+14.5%', trend: 'up', icon: DollarSign, color: 'text-emerald-500' },
    { label: t('analytics.admin.system_health'), value: '99.98%', change: t('analytics.admin.stable'), trend: 'up', icon: Server, color: 'text-indigo-500' },
    { label: t('analytics.admin.api_requests'), value: '4.2M', change: '+22.4%', trend: 'up', icon: Activity, color: 'text-[#ff801f]' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-display font-medium tracking-tight tracking-tight text-[#f0f0f0]">{t('analytics.title')}</h2>
        </div>
        <div className="flex gap-3">
          <select className="bg-transparent border border-[rgba(255,255,255,0.3)] font-bold py-2 px-4 transition-all rounded-[8px] text-[#f0f0f0] text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40">
            <option className="bg-[#000000] text-[#f0f0f0]">{t('analytics.period.7d')}</option>
            <option className="bg-[#000000] text-[#f0f0f0]">{t('analytics.period.30d')}</option>
            <option className="bg-[#000000] text-[#f0f0f0]">{t('analytics.period.90d')}</option>
          </select>
          <button className="bg-[#ffffff] text-[#000000] px-4 py-2 rounded-md text-sm font-bold shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all">
            {t('analytics.export')}
          </button>
        </div>
      </div>

      {isAdmin && (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#f0f0f0]">{t('analytics.admin.overview')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminKpis.map((kpi) => (
              <div key={kpi.label} className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-[12px] bg-[rgba(255,255,255,0.02)] flex items-center justify-center text-[#a1a4a5]">
                    <kpi.icon size={20} className={kpi.color} />
                  </div>
                  <span className={`text-xs font-bold flex items-center gap-1 ${kpi.trend === 'up' ? 'text-emerald-500' : 'text-[#ff0000]'}`}>
                    {kpi.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {kpi.change}
                  </span>
                </div>
                <p className="text-[#a1a4a5] text-xs font-bold uppercase tracking-widest">{kpi.label}</p>
                <h3 className="text-2xl font-black text-[#f0f0f0] mt-1">{kpi.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
              <h3 className="text-lg font-bold text-[#f0f0f0] mb-6">{t('analytics.admin.user_growth')}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f8fafc' }} />
                    <Area type="monotone" dataKey="newUsers" name={t('analytics.admin.new_users')} stroke="#10b981" fillOpacity={1} fill="url(#colorNewUsers)" />
                    <Area type="monotone" dataKey="activeUsers" name={t('analytics.admin.active_users')} stroke="#3b82f6" fillOpacity={1} fill="url(#colorActiveUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
              <h3 className="text-lg font-bold text-[#f0f0f0] mb-6">{t('analytics.admin.api_requests')}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={apiUsageData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f8fafc' }} />
                    <Bar dataKey="requests" name={t('analytics.admin.requests')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="errors" name={t('analytics.admin.errors')} fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
              <h3 className="text-lg font-bold text-[#f0f0f0] mb-6">{t('analytics.admin.plan_distribution')}</h3>
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
                    >
                      {planDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f8fafc' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {planDistributionData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                    <span className="text-xs font-bold text-[#a1a4a5]">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
              <h3 className="text-lg font-bold text-[#f0f0f0] mb-6">{t('analytics.admin.system_load')}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f8fafc' }} />
                    <Line type="stepAfter" dataKey="value" name={t('analytics.admin.server_load')} stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="mt-8 mb-4 border-t border-[rgba(255,255,255,0.3)] pt-8">
            <h3 className="text-lg font-bold text-[#f0f0f0]">{t('analytics.admin.user_analytics')}</h3>
          </div>
        </>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-[12px] bg-[rgba(255,255,255,0.02)] flex items-center justify-center text-[#a1a4a5]">
                <kpi.icon size={20} />
              </div>
              <span className={`text-xs font-bold flex items-center gap-1 ${kpi.trend === 'up' ? 'text-emerald-500' : 'text-[#ff0000]'}`}>
                {kpi.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {kpi.change}
              </span>
            </div>
            <p className="text-[#a1a4a5] text-xs font-bold uppercase tracking-widest">{kpi.label}</p>
            <h3 className="text-2xl font-black text-[#f0f0f0] mt-1">{kpi.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
          <h3 className="text-lg font-bold text-[#f0f0f0] mb-6">{t('analytics.chart.volume')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f8fafc' }} />
                <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#000000] p-6 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
          <h3 className="text-lg font-bold text-[#f0f0f0] mb-6">{t('analytics.chart.activity')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
