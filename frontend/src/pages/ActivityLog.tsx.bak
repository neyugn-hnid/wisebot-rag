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
  DollarSign,
  Database,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  Users,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function ActivityLog() {
  const { t } = useLanguage();
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
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const recentActivity = [
    { id: 1, type: 'user', message: `${userCount.toLocaleString()} users registered`, time: 'Active', icon: Users, color: 'text-blue-500' },
    { id: 2, type: 'kb', message: `${kbCount} Knowledge Bases active`, time: 'Active', icon: Database, color: 'text-emerald-500' },
    { id: 3, type: 'plan', message: `${planCount} Billing Plans available`, time: 'Active', icon: DollarSign, color: 'text-indigo-500' },
  ];

  const adminActivity = [
    { id: 1, type: 'user', message: `${userCount.toLocaleString()} total platform users`, time: 'Active', icon: Users, color: 'text-blue-500' },
    { id: 2, type: 'kb', message: `${kbCount} Knowledge Bases managed`, time: 'Active', icon: Database, color: 'text-emerald-500' },
    { id: 3, type: 'plan', message: `${planCount} Billing Plans configured`, time: 'Active', icon: DollarSign, color: 'text-indigo-500' },
  ];

  const activities = isAdmin ? adminActivity : recentActivity;
  const filteredActivities = activities.filter(a => 
    a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-[12px] transition-colors text-[#3b9eff]">
            <ChevronLeft size={24} />
          </Link>
          <h2 className="text-[24px] font-display font-medium tracking-tight tracking-tight text-[#f0f0f0]">{t('dashboard.activity.title')}</h2>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={18} />
            <input 
              type="text"
              placeholder={t('activity_log.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-64 transition-all"
            />
          </div>
          <button className="p-2 bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-md text-[#3b9eff] hover:border-primary/30 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 overflow-hidden">
        <div className="divide-y divide-[rgba(255,255,255,0.3)]">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={activity.id} 
                className="p-6 flex gap-6 hover:bg-[rgba(255,255,255,0.02)]/50 transition-colors group"
              >
                <div className={cn("w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0 shadow-md shadow-black/40 bg-[rgba(255,255,255,0.05)]", activity.color)}>
                  <activity.icon size={24} />
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-[#f0f0f0] leading-tight group-hover:text-[#3b9eff] transition-colors">
                      {activity.message}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs font-semibold px-2.5 py-0.5 bg-[rgba(255,255,255,0.05)] text-[#a1a4a5] rounded-full tracking-normal">
                        {activity.type}
                      </span>
                      <div className="flex items-center gap-1.5 text-[#a1a4a5]">
                        <Clock size={14} />
                        <span className="text-xs font-normal">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="p-2 text-[#3b9eff] hover:bg-[rgba(59,158,255,0.05)] rounded-md transition-all self-start sm:self-center"
                    title={t('activity_log.view_details')}
                  >
                    <Eye size={20} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-[rgba(255,255,255,0.02)] rounded-full flex items-center justify-center mx-auto mb-4 text-[rgba(255,255,255,0.3)]">
                <Search size={40} />
              </div>
              <h3 className="text-lg font-semibold text-[#f0f0f0]">{t('activity_log.no_activities')}</h3>
              <p className="text-[#a1a4a5] mt-1">{t('activity_log.no_activities_desc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
