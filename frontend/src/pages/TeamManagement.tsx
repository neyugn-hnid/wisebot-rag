import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  Shield, 
  Infinity,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useRole } from '../contexts/RoleContext';
import DeleteModal from '../components/DeleteModal';

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
};

const initialMembers: Member[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@company.com', role: 'OWNER', status: 'Active', avatar: 'https://picsum.photos/seed/alex/100/100' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@company.com', role: 'ADMIN', status: 'Active', avatar: 'https://picsum.photos/seed/sarah/100/100' },
  { id: '3', name: 'Michael Smith', email: 'michael@company.com', role: 'USER', status: 'Pending', avatar: 'https://picsum.photos/seed/michael/100/100' },
  { id: '4', name: 'Emily Brown', email: 'emily@company.com', role: 'USER', status: 'Active', avatar: 'https://picsum.photos/seed/emily/100/100' },
  { id: '5', name: 'David Wilson', email: 'david@company.com', role: 'USER', status: 'Active', avatar: 'https://picsum.photos/seed/david/100/100' },
];

export default function TeamManagement() {
  const { role: userRole, setRole } = useRole();
  const { t, language } = useLanguage();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Viewer' });

  const stats = [
    { label: t('team.stats.total'), value: members.length.toString(), icon: Users },
    { label: t('team.stats.admins'), value: members.filter(m => m.role === 'ADMIN' || m.role === 'OWNER').length.toString(), icon: Shield },
    { label: t('team.stats.pending'), value: members.filter(m => m.status === 'Pending').length.toString(), icon: UserPlus, color: 'text-[#3b9eff]' },
    { label: t('team.stats.seats'), value: '∞', icon: Infinity },
  ];

  const handleOpenModal = (member?: Member) => {
    setInviteLink(null);
    if (member) {
      setEditingMember(member);
      setFormData({ name: member.name, email: member.email, role: member.role });
    } else {
      setEditingMember(null);
      setFormData({ name: '', email: '', role: 'USER' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleOpenDeleteConfirm = (member: Member) => {
    setSelectedMember(member);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = () => {
    if (selectedMember) {
      setMembers(members.filter(m => m.id !== selectedMember.id));
      setIsDeleteConfirmOpen(false);
      setSelectedMember(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      setMembers(members.map(m => m.id === editingMember.id ? { ...m, ...formData } : m));
      handleCloseModal();
    } else {
      const baseUrl = window.location.origin;
      const params = new URLSearchParams({
        email: formData.email,
        role: formData.role,
        invitedBy: 'Alex Rivet' // Mock current user
      });
      const link = `${baseUrl}/register?${params.toString()}`;
      setInviteLink(link);
      
      if (userRole === 'USER') {
        setRole('OWNER');
      }
      
      const newMember: Member = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        status: 'Pending',
        avatar: `https://picsum.photos/seed/${formData.email}/100/100`
      };
      setMembers([...members, newMember]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-display font-medium tracking-tight tracking-tight text-[#f0f0f0]">{t('nav.team')}</h2>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-[#ffffff] text-[#000000] px-6 py-2.5 rounded-[12px] font-bold shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all transform active:scale-95"
        >
          <UserPlus size={18} />
          {t('team.invite')}
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
        {}
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
                <option value="owner" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Chủ sở hữu' : 'Owner'}</option>
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
                <th className="px-6 py-4 text-xs font-bold uppercase text-[#a1a4a5] tracking-wider border-b border-[rgba(255,255,255,0.3)]">{t('team.table.name')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-[#a1a4a5] tracking-wider border-b border-[rgba(255,255,255,0.3)]">{t('team.table.email')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-[#a1a4a5] tracking-wider border-b border-[rgba(255,255,255,0.3)]">{t('team.table.status')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-[#a1a4a5] tracking-wider border-b border-[rgba(255,255,255,0.3)] text-right">{t('team.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.3)]">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-[rgba(255,255,255,0.02)]/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="size-8 rounded-full bg-[rgba(255,255,255,0.05)] object-cover border border-[rgba(255,255,255,0.3)]"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-sm font-semibold text-[#f0f0f0]">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a1a4a5]">{member.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "size-2 rounded-full",
                        member.status === 'Active' ? "bg-green-500" : "bg-amber-400 animate-pulse"
                      )}></span>
                      <span className={cn(
                        "text-sm font-medium",
                        member.status === 'Pending' ? "text-amber-500 italic" : "text-[#f0f0f0]"
                      )}>
                        {language === 'vi'
                          ? (member.status === 'Active' ? 'Hoạt động' : member.status === 'Pending' ? 'Đang chờ' : member.status)
                          : member.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(userRole === 'ADMIN' || userRole === 'OWNER') && member.role !== 'OWNER' && (
                        <button 
                          onClick={() => handleOpenDeleteConfirm(member)}
                          className="p-2 text-[#ff0000] hover:bg-[#ff0000]/10 rounded-[12px] transition-colors"
                          title={t('team.remove_member')}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#a1a4a5] text-sm">
                    {t('team.no_members')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.3)] flex items-center justify-between">
          <p className="text-sm text-[#a1a4a5]">{t('team.showing')} {members.length} {t('team.members')}</p>
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

      {}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl shadow-black/50 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.3)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#f0f0f0]">
                {inviteLink ? t('team.invite_sent') : editingMember ? t('team.edit_member') : t('team.invite_new')}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-[#a1a4a5] hover:text-[#a1a4a5] p-1 rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {inviteLink ? (
              <div className="p-6 space-y-6 animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="size-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#f0f0f0]">{t('team.link_generated')}</h4>
                    <p className="text-sm text-[#a1a4a5]">{t('team.link_sent_to')} {formData.email}.</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#a1a4a5] uppercase tracking-wider">{t('team.copy_manually')}</label>
                  <div className="flex gap-2">
                    <input 
                      readOnly
                      value={inviteLink}
                      className="flex-1 bg-transparent border border-[rgba(255,255,255,0.3)] px-4 py-2 font-mono outline-none rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        alert(t('team.copied'));
                      }}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-[16px] hover:bg-slate-800 transition-colors"
                    >
                      {t('team.copy')}
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={handleCloseModal}
                  className="w-full py-3 bg-[#ffffff] text-[#000000] font-bold rounded-md shadow-md shadow-black/40 shadow-primary/20 hover:bg-[#f0f0f0] transition-all"
                >
                  {t('common.done')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {!editingMember && (
                  <div className="mb-4">
                  </div>
                )}
                {editingMember && (
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
                )}
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
                {editingMember && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#f0f0f0]">{t('team.table.role')}</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                    >
                      <option value="ADMIN" className="bg-[#000000] text-[#f0f0f0]">ADMIN</option>
                      <option value="USER" className="bg-[#000000] text-[#f0f0f0]">USER</option>
                    </select>
                  </div>
                )}
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2.5 text-sm font-bold bg-[#000000] border border-[rgba(255,255,255,0.3)] text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.02)] hover:text-[#f0f0f0] rounded-md transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-[#000000] bg-[#ffffff] hover:bg-[#f0f0f0] rounded-md shadow-md shadow-black/40 shadow-primary/20 transition-all"
                  >
                    {editingMember ? t('common.save') : t('team.generate_link')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {}
      <DeleteModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title={t('team.remove_member')}
        description={`${t('kb.confirm.delete.msg')} "${selectedMember?.name}"?`}
        warningText={t('kb.confirm.delete.undone')}
      />
    </div>
  );
}
