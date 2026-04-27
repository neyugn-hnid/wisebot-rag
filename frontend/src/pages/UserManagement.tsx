import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  Shield, 
  Activity,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  Trash2,
  Lock,
  Eye,
  Mail,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';
import DeleteModal from '../components/DeleteModal';

type SystemUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  globalRole: string;
  status: string;
  avatar: string;
  workspaces: number;
  lastLogin: string;
};

const initialUsers: SystemUser[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@company.com', phone: '+1 234 567 8900', location: 'New York, USA', globalRole: 'ADMIN', status: 'Active', avatar: 'https://picsum.photos/seed/alex/100/100', workspaces: 5, lastLogin: '2 mins ago' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@company.com', phone: '+1 234 567 8901', location: 'San Francisco, USA', globalRole: 'ADMIN', status: 'Active', avatar: 'https://picsum.photos/seed/sarah/100/100', workspaces: 2, lastLogin: '1 hour ago' },
  { id: '3', name: 'Michael Smith', email: 'michael@company.com', phone: '+44 20 7123 4567', location: 'London, UK', globalRole: 'USER', status: 'Suspended', avatar: 'https://picsum.photos/seed/michael/100/100', workspaces: 1, lastLogin: '5 days ago' },
  { id: '4', name: 'Emily Brown', email: 'emily@company.com', phone: '+61 2 9876 5432', location: 'Sydney, Australia', globalRole: 'USER', status: 'Active', avatar: 'https://picsum.photos/seed/emily/100/100', workspaces: 3, lastLogin: 'Just now' },
  { id: '5', name: 'David Wilson', email: 'david@company.com', phone: '+1 234 567 8902', location: 'Chicago, USA', globalRole: 'USER', status: 'Active', avatar: 'https://picsum.photos/seed/david/100/100', workspaces: 1, lastLogin: '2 days ago' },
];

export default function UserManagement() {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [users, setUsers] = useState<SystemUser[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', globalRole: 'USER', status: 'Active' });

  const stats = [
    { label: t('users.stats.total'), value: users.length.toString(), icon: Users },
    { label: t('users.stats.admins'), value: users.filter(u => u.globalRole === 'ADMIN').length.toString(), icon: Shield },
    { label: t('users.stats.active'), value: users.filter(u => u.status === 'Active').length.toString(), icon: Activity, color: 'text-green-500' },
    { label: t('users.stats.suspended'), value: users.filter(u => u.status === 'Suspended').length.toString(), icon: Lock, color: 'text-[#ff0000]' },
  ];

  const handleOpenModal = (user?: SystemUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email, phone: user.phone, globalRole: user.globalRole, status: user.status });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', phone: '', globalRole: 'USER', status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const handleOpenDeleteConfirm = (user: SystemUser) => {
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      // Update
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
      showToast(t('toast.user_updated'), 'success');
    } else {
      // Create
      const newUser: SystemUser = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        location: 'Unknown',
        avatar: `https://picsum.photos/seed/${formData.name.replace(/\s+/g, '').toLowerCase()}/100/100`,
        workspaces: 0,
        lastLogin: 'Never'
      };
      setUsers([...users, newUser]);
      showToast(t('toast.user_created'), 'success');
    }
    handleCloseModal();
  };

  const handleDelete = () => {
    if (selectedUser) {
      setUsers(users.filter(u => u.id !== selectedUser.id));
      showToast(t('toast.user_deleted'), 'success');
      setIsDeleteConfirmOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-display font-medium tracking-tight tracking-tight text-[#f0f0f0]">{t('users.title')}</h2>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-[#ffffff] text-[#000000] px-6 py-2.5 rounded-[12px] font-bold shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all transform active:scale-95"
        >
          <UserPlus size={18} />
          {t('users.create')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#000000] p-4 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40">
            <p className="text-[10px] font-bold text-[#a1a4a5] uppercase tracking-widest">{stat.label}</p>
            <div className="flex items-center justify-between mt-1">
              <p className={cn("text-2xl font-black", stat.color || "text-[#f0f0f0]")}>{stat.value}</p>
              <stat.icon size={20} className="text-[rgba(255,255,255,0.3)]" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] overflow-hidden shadow-md shadow-black/40">
        {/* Table Controls */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.3)] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[rgba(255,255,255,0.02)]/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
            <input 
              type="text" 
              placeholder={t('common.search')} 
              className="w-full pl-9 pr-4 py-2 border border-[rgba(255,255,255,0.3)] outline-none transition-all bg-transparent rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <select className="w-full sm:w-auto appearance-none bg-transparent border border-[rgba(255,255,255,0.3)] pl-9 pr-8 py-2 outline-none cursor-pointer hover:bg-transparent transition-colors rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40">
                <option value="all" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Tất cả vai trò' : 'All Roles'}</option>
                <option value="admin" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Quản trị viên' : 'Admin'}</option>
                <option value="user" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Người dùng' : 'User'}</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={14} />
            </div>
            <div className="relative w-full sm:w-auto">
              <select className="w-full sm:w-auto appearance-none bg-transparent border border-[rgba(255,255,255,0.3)] pl-9 pr-8 py-2 outline-none cursor-pointer hover:bg-transparent transition-colors rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40">
                <option value="newest" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Mới nhất trước' : 'Newest First'}</option>
                <option value="oldest" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Cũ nhất trước' : 'Oldest First'}</option>
                <option value="name_asc" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Tên (A-Z)' : 'Name (A-Z)'}</option>
                <option value="name_desc" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Tên (Z-A)' : 'Name (Z-A)'}</option>
              </select>
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={14} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.02)]">
                <th className="px-6 py-4 text-xs font-bold uppercase text-[#a1a4a5] tracking-wider border-b border-[rgba(255,255,255,0.3)]">{t('users.table.user')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-[#a1a4a5] tracking-wider border-b border-[rgba(255,255,255,0.3)]">{t('users.table.role')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-[#a1a4a5] tracking-wider border-b border-[rgba(255,255,255,0.3)]">{t('users.table.status')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-[#a1a4a5] tracking-wider border-b border-[rgba(255,255,255,0.3)]">{t('users.table.last_login')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-[#a1a4a5] tracking-wider border-b border-[rgba(255,255,255,0.3)] text-right">{t('users.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.3)]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[rgba(255,255,255,0.02)]/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="size-8 rounded-full bg-[rgba(255,255,255,0.05)] object-cover border border-[rgba(255,255,255,0.3)]"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#f0f0f0]">{user.name}</p>
                        <p className="text-xs text-[#a1a4a5]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "inline-flex items-center px-0 py-0.5 text-xs font-black uppercase tracking-wider",
                      user.globalRole === 'ADMIN' ? "text-blue-500" : 
                      user.globalRole === 'OWNER' ? "text-purple-500" : "text-[#a1a4a5]"
                    )}>
                      {language === 'vi' 
                        ? (user.globalRole === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : user.globalRole === 'USER' ? 'NGƯỜI DÙNG' : user.globalRole === 'OWNER' ? 'CHỦ SỞ HỮU' : user.globalRole)
                        : user.globalRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "size-2 rounded-full",
                        user.status === 'Active' ? "bg-green-500" : "bg-rose-500"
                      )}></span>
                      <span className={cn(
                        "text-sm font-medium",
                        user.status === 'Suspended' ? "text-[#ff0000]" : "text-[#f0f0f0]"
                      )}>
                        {language === 'vi'
                          ? (user.status === 'Active' ? 'Hoạt động' : user.status === 'Suspended' ? 'Bị đình chỉ' : user.status)
                          : user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a1a4a5]">
                    {language === 'vi' 
                      ? user.lastLogin.replace('mins ago', 'phút trước').replace('hour ago', 'giờ trước').replace('days ago', 'ngày trước').replace('Just now', 'Vừa xong').replace('Never', 'Chưa từng') 
                      : user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-[#3b9eff] hover:bg-[rgba(59,158,255,0.05)] rounded-[12px] transition-all"
                        title={t('common.edit')}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteConfirm(user)}
                        className="p-2 text-[#ff0000] hover:bg-[#ff0000]/10 rounded-[12px] transition-all"
                        title={t('common.delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#a1a4a5] text-sm">
                    {t('users.no_users')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.3)] flex items-center justify-between">
          <p className="text-sm text-[#a1a4a5]">{t('users.showing')} {users.length} {t('users.users')}</p>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 text-sm font-bold bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-md disabled:opacity-50" disabled>
              <ChevronLeft size={16} />
            </button>
            <button className="px-4 py-1.5 text-sm font-bold bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-md disabled:opacity-50" disabled>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl shadow-black/50 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.3)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#f0f0f0]">
                {editingUser ? t('users.edit') : t('users.create')}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-[#a1a4a5] hover:text-[#a1a4a5] p-1 rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('team.full_name')}</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('team.email_address')}</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="jane@example.com"
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 234 567 8900"
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#f0f0f0]">{t('users.table.status')}</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                  >
                    <option value="Active" className="bg-[#000000] text-[#f0f0f0]">Active</option>
                    <option value="Suspended" className="bg-[#000000] text-[#f0f0f0]">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-[#a1a4a5] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-[#000000] bg-[#ffffff] hover:bg-[#f0f0f0] rounded-md shadow-md shadow-black/40 shadow-primary/20 transition-all"
                >
                  {editingUser ? t('common.save') : t('users.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title={t('users.confirm.delete.title')}
        description={`${t('users.confirm.delete.msg')} "${selectedUser?.name}"?`}
        warningText={t('users.confirm.delete.undone')}
        confirmText={t('common.confirm')}
      />
    </div>
  );
}
