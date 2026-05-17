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
  Activity,
  BarChart3,
  Clock,
  Database,
  Download,
  DollarSign,
  Server,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '../lib/utils';

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

const COLORS = ['#3b9eff', '#11ff99', '#ff801f'];

const chartTooltipStyle = {
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.12)',
  backgroundColor: '#0b0b0c',
  boxShadow: '0 18px 40px rgba(0,0,0,0.32)',
  padding: '12px',
};

export default function Analytics() {
  const { t } = useLanguage();
  const { role } = useRole();
  const isAdmin = role === 'ADMIN' || role === 'OWNER';

  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [kbCount, setKbCount] = useState(0);
  const [planCount, setPlanCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, kbs, plans] = await Promise.all([
          listUsers({ page: 0, size: 1 }).catch(() => ({ totalElements: 0 } as UserPageResponse)),
          listKnowledgeBases().catch(() => [] as KnowledgeBaseResponse[]),
          listPlans().catch(() => [] as BillingPlanResponse[]),
        ]);
        setUserCount(users.totalElements);
        setKbCount(kbs.length);
        setPlanCount(plans.length);
      } catch {
        // Keep defaults when analytics services are unavailable.
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const kpis = [
    { label: t('analytics.metric.conversations'), value: loading ? '...' : '12.8K', change: '+15.3%', trend: 'up' as const, icon: BarChart3, color: 'text-[#3b9eff]' },
    { label: t('analytics.metric.active_users'), value: loading ? '...' : userCount.toLocaleString(), change: `${userCount} Users`, trend: 'up' as const, icon: Users, color: 'text-[#11ff99]' },
    { label: t('analytics.metric.knowledge_bases'), value: loading ? '...' : kbCount.toLocaleString(), change: `${kbCount} KBs`, trend: 'up' as const, icon: Database, color: 'text-[#ff801f]' },
    { label: t('analytics.metric.avg_response'), value: '1.8s', change: '-0.3s', trend: 'down' as const, icon: Clock, color: 'text-[#a78bfa]' },
  ];

  const adminKpis = [
    { label: t('analytics.admin.total_users'), value: loading ? '...' : userCount.toLocaleString(), change: `${userCount} Users`, trend: 'up' as const, icon: Users, color: 'text-[#3b9eff]' },
    { label: t('analytics.metric.knowledge_bases'), value: loading ? '...' : kbCount.toLocaleString(), change: `${kbCount} KBs`, trend: 'up' as const, icon: Database, color: 'text-[#11ff99]' },
    { label: t('analytics.metric.billing_plans'), value: loading ? '...' : planCount.toLocaleString(), change: `${planCount} Plans`, trend: 'up' as const, icon: DollarSign, color: 'text-[#ff801f]' },
    { label: t('analytics.admin.api_requests'), value: '4.2M', change: '+22.4%', trend: 'up' as const, icon: Server, color: 'text-[#a78bfa]' },
  ];

  const metricCards = isAdmin ? adminKpis : kpis;

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <section className="rounded-[24px] pt-6 pb-6 shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#9fa3a5]">
              <Activity size={13} />
              {t('nav.analytics')}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select className="rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm font-semibold text-[#f0f0f0] outline-none transition-colors focus:border-[rgba(59,158,255,0.5)] focus:ring-2 focus:ring-[rgba(59,158,255,0.18)]">
              <option className="bg-[#000000] text-[#f0f0f0]">{t('analytics.period.7d')}</option>
              <option className="bg-[#000000] text-[#f0f0f0]">{t('analytics.period.30d')}</option>
              <option className="bg-[#000000] text-[#f0f0f0]">{t('analytics.period.90d')}</option>
            </select>
            <button className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#ffffff] px-4 py-2.5 text-sm font-bold text-[#000000] shadow-[0_14px_30px_rgba(0,0,0,0.22)] transition-colors hover:bg-[#f0f0f0]">
              <Download size={16} />
              {t('analytics.export')}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((kpi) => (
          <div key={kpi.label} className="rounded-[20px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.18)] transition-colors hover:border-[rgba(59,158,255,0.24)]">
            <div className="mb-5 flex items-center justify-between">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)]', kpi.color)}>
                <kpi.icon size={19} />
              </div>
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold',
                kpi.trend === 'up' ? 'text-[#11ff99]' : 'text-[#ff801f]'
              )}>
                {kpi.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {kpi.change}
              </span>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8b8f91]">{kpi.label}</p>
            <h3 className="mt-2 text-[28px] font-display font-medium tracking-tight text-[#f0f0f0]">{kpi.value}</h3>
          </div>
        ))}
      </section>

      {isAdmin && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartPanel title={t('analytics.admin.user_growth')} description={t('analytics.panel.user_growth_desc')}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#11ff99" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#11ff99" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b9eff" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#3b9eff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(214,235,253,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a4a5' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a4a5' }} />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: '#f0f0f0' }} labelStyle={{ color: '#a1a4a5' }} />
                <Area type="monotone" dataKey="newUsers" name={t('analytics.admin.new_users')} stroke="#11ff99" strokeWidth={2} fillOpacity={1} fill="url(#colorNewUsers)" />
                <Area type="monotone" dataKey="activeUsers" name={t('analytics.admin.active_users')} stroke="#3b9eff" strokeWidth={2} fillOpacity={1} fill="url(#colorActiveUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title={t('analytics.admin.api_requests')} description={t('analytics.panel.api_desc')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={apiUsageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(214,235,253,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a4a5' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a4a5' }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={chartTooltipStyle} itemStyle={{ color: '#f0f0f0' }} labelStyle={{ color: '#a1a4a5' }} />
                <Bar dataKey="requests" name={t('analytics.admin.requests')} fill="#3b9eff" radius={[6, 6, 0, 0]} />
                <Bar dataKey="errors" name={t('analytics.admin.errors')} fill="#ff0000" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartPanel title={t('analytics.chart.volume')} description={t('analytics.panel.volume_desc')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(214,235,253,0.1)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a4a5' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a4a5' }} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={chartTooltipStyle} itemStyle={{ color: '#f0f0f0' }} labelStyle={{ color: '#a1a4a5' }} />
              <Bar dataKey="value" fill="#3b9eff" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={t('analytics.chart.activity')} description={t('analytics.panel.activity_desc')}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(214,235,253,0.1)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a4a5' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a4a5' }} />
              <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: '#f0f0f0' }} labelStyle={{ color: '#a1a4a5' }} />
              <Line type="monotone" dataKey="value" stroke="#11ff99" strokeWidth={3} dot={{ r: 4, fill: '#11ff99', strokeWidth: 2, stroke: '#000000' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      {isAdmin && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartPanel title={t('analytics.admin.plan_distribution')} description={t('analytics.panel.plan_desc')}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {planDistributionData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: '#f0f0f0' }} labelStyle={{ color: '#a1a4a5' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {planDistributionData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-semibold text-[#a1a4a5]">{entry.name}</span>
                </div>
              ))}
            </div>
          </ChartPanel>

          <ChartPanel title={t('analytics.admin.system_load')} description={t('analytics.panel.system_desc')}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(214,235,253,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a4a5' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a4a5' }} />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: '#f0f0f0' }} labelStyle={{ color: '#a1a4a5' }} />
                <Line type="stepAfter" dataKey="value" name={t('analytics.admin.server_load')} stroke="#a78bfa" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
        </section>
      )}
    </div>
  );
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[16px] font-semibold text-[#f0f0f0]">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-[#8b8f91]">{description}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[#a1a4a5]">
          <Activity size={17} />
        </div>
      </div>
      <div className="h-64">
        {children}
      </div>
    </div>
  );
}
