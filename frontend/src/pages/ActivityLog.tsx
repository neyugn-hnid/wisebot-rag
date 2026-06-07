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
  ChevronLeft,
  Clock,
  Database,
  DollarSign,
  Eye,
  Filter,
  Search,
  Users,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

type ActivityItem = {
  id: number;
  type: string;
  message: string;
  time: string;
  icon: typeof Users;
  color: string;
};

export default function ActivityLog() {
  const { t, language } = useLanguage();
  const { role } = useRole();
  const isAdmin = role === 'ADMIN';

  const [searchQuery, setSearchQuery] = React.useState('');
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
        // Keep defaults when services are unavailable.
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const recentActivity: ActivityItem[] = [
    { id: 1, type: 'user', message: `${userCount.toLocaleString()} users registered`, time: 'Active', icon: Users, color: 'text-blue-500' },
    { id: 2, type: 'kb', message: `${kbCount} Knowledge Bases active`, time: 'Active', icon: Database, color: 'text-emerald-500' },
    { id: 3, type: 'plan', message: `${planCount} Billing Plans available`, time: 'Active', icon: DollarSign, color: 'text-indigo-500' },
  ];

  const adminActivity: ActivityItem[] = [
    { id: 1, type: 'user', message: `${userCount.toLocaleString()} total platform users`, time: 'Active', icon: Users, color: 'text-blue-500' },
    { id: 2, type: 'kb', message: `${kbCount} Knowledge Bases managed`, time: 'Active', icon: Database, color: 'text-emerald-500' },
    { id: 3, type: 'plan', message: `${planCount} Billing Plans configured`, time: 'Active', icon: DollarSign, color: 'text-indigo-500' },
  ];

  const activities = isAdmin ? adminActivity : recentActivity;
  const filteredActivities = activities.filter(
    (activity) =>
      activity.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="rounded-[24px] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#9fa3a5]">
              <Activity size={13} />
              {t('dashboard.activity.title')}
            </div>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#ffffff] px-5 py-2.5 text-sm font-bold text-[#000000] shadow-[0_14px_30px_rgba(0,0,0,0.22)] transition-colors hover:bg-[#f0f0f0] active:scale-95"
          >
            <ChevronLeft size={18} />
            {language === 'vi' ? 'Quay lại' : 'Back'}
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
        <div className="border-b border-[rgba(255,255,255,0.08)] p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <form className="relative w-full xl:max-w-md" onSubmit={(event) => event.preventDefault()}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('activity_log.search_placeholder')}
                className="w-full rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] py-2.5 pl-9 pr-4 text-[14px] text-[#f0f0f0] outline-none transition-colors placeholder:text-[#a1a4a5]/40 focus:border-[#ffffff] focus:ring-[#ffffff]"
              />
            </form>
            <button className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm font-bold text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.07)] xl:w-auto">
              <Filter size={18} />
              {language === 'vi' ? 'Bộ lọc' : 'Filter'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.02)]">
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">
                  {language === 'vi' ? 'Hoạt động' : 'Activity'}
                </th>
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">
                  {language === 'vi' ? 'Loại' : 'Type'}
                </th>
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">
                  {language === 'vi' ? 'Thời gian' : 'Time'}
                </th>
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-right text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">
                  {language === 'vi' ? 'Hành động' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <tr key={activity.id} className="transition-colors hover:bg-[rgba(255,255,255,0.03)]">
                    <td className="px-6 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)]', activity.color)}>
                          <activity.icon size={19} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#f0f0f0]">{activity.message}</p>
                          <p className="mt-1 text-xs text-[#a1a4a5]">
                            {language === 'vi' ? 'Sự kiện gần đây' : 'Recent event'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#a1a4a5]">
                        {activity.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a1a4a5]">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5">
                        <Clock size={14} />
                        <span className="text-xs font-semibold">{activity.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        className="rounded-[12px] border border-transparent p-2 text-[#3b9eff] transition-all hover:border-[#3b9eff]/20 hover:bg-[rgba(59,158,255,0.08)]"
                        title={t('activity_log.view_details')}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.3)]">
                      <Search size={28} />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-[#f0f0f0]">
                      {t('activity_log.no_activities')}
                    </h3>
                    <p className="mt-1 text-sm text-[#a1a4a5]">
                      {t('activity_log.no_activities_desc')}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}