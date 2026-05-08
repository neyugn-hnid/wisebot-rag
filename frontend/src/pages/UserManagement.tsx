import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import {
  Users,
  UserPlus,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  Trash2,
  Lock,
  LockOpen,
  Search,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  listUsers,
  adminUpdateUser,
  deleteUser,
  changeUserStatus,
  type UserResponse,
  type UserPageResponse,
} from '../api/users';
import { inviteUser } from '../api/auth';
import DeleteModal from '../components/DeleteModal';

type SystemUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  globalRole: string;
  status: 'Active' | 'Suspended' | 'Pending';
  avatar: string;
  lastLogin: string;
};

const DEFAULT_PAGE_SIZE = 10;

export default function UserManagement() {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    globalRole: 'USER',
    status: 'Active' as SystemUser['status'],
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedSearchKeyword, setAppliedSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'owner' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusActionUserId, setStatusActionUserId] = useState<string | null>(null);

  const toDisplayStatus = (status?: string): SystemUser['status'] => {
    if (status === 'DISABLED') return 'Suspended';
    if (status === 'PENDING') return 'Pending';
    return 'Active';
  };

  const toApiStatus = (status: SystemUser['status']) => {
    if (status === 'Suspended') return 'DISABLED';
    if (status === 'Pending') return 'PENDING';
    return 'ACTIVE';
  };

  const formatLastLogin = (value?: string | null) => {
    if (!value) {
      return 'Never';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Never';
    }

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} mins ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hours ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} days ago`;
  };

  const mapUser = (user: UserResponse): SystemUser => ({
    id: user.id,
    name: user.fullName || user.username || user.email,
    email: user.email,
    phone: user.phone || 'N/A',
    globalRole: user.role || 'USER',
    status: toDisplayStatus(user.status),
    avatar: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.email)}&background=111111&color=f0f0f0`,
    lastLogin: formatLastLogin(user.lastLogin),
  });

  const resolveSortQuery = () => {
    switch (sortOption) {
      case 'oldest':
        return 'createdAt:asc';
      case 'name_asc':
        return 'fullName:asc';
      case 'name_desc':
        return 'fullName:desc';
      default:
        return 'createdAt:desc';
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const pageData = await listUsers({
        page: currentPage,
        size: pageSize,
        sort: resolveSortQuery(),
        keyword: appliedSearchKeyword.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter.toUpperCase() : undefined,
        status: statusFilter !== 'all' ? (statusFilter === 'suspended' ? 'DISABLED' : statusFilter.toUpperCase()) : undefined,
      });

      setUsers((pageData.users || []).map(mapUser));
      setTotalPages(Math.max(pageData.totalPages || 1, 1));
      setTotalElements(pageData.totalElements || 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không tải được danh sách người dùng.';
      showToast(message, 'error');
      setUsers([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [appliedSearchKeyword, roleFilter, statusFilter, currentPage, pageSize, sortOption]);

  const stats = [
    { label: t('users.stats.total'), value: totalElements.toString(), icon: Users },
    { label: t('users.stats.admins'), value: users.filter((u) => u.globalRole === 'ADMIN').length.toString(), icon: Shield },
    { label: t('users.stats.active'), value: users.filter((u) => u.status === 'Active').length.toString(), icon: Activity, color: 'text-green-500' },
    { label: t('users.stats.suspended'), value: users.filter((u) => u.status === 'Suspended').length.toString(), icon: Lock, color: 'text-[#ff0000]' },
  ];

  const openInviteModal = () => {
    setInviteEmail('');
    setIsInviteModalOpen(true);
  };

  const openEditModal = (user: SystemUser) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone === 'N/A' ? '' : user.phone,
      globalRole: user.globalRole,
      status: user.status,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteConfirm = (user: SystemUser) => {
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleInviteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      showToast('Vui lòng nhập email người dùng.', 'error');
      return;
    }

    setIsSubmittingInvite(true);
    try {
      await inviteUser({ email: inviteEmail.trim() });

      showToast(t('toast.user_created') || 'Đã gửi lời mời người dùng.', 'success');
      setIsInviteModalOpen(false);
      setInviteEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gửi lời mời người dùng.';
      showToast(message, 'error');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await adminUpdateUser(selectedUser.id, {
        fullName: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        role: editForm.globalRole,
        status: toApiStatus(editForm.status),
      });

      setUsers((prev) => prev.map((user) => (
        user.id === selectedUser.id
          ? {
            ...user,
            name: editForm.name.trim(),
            email: editForm.email.trim(),
            phone: editForm.phone.trim() || 'N/A',
            globalRole: editForm.globalRole,
            status: editForm.status,
          }
          : user
      )));
      showToast(t('toast.user_updated') || 'Cập nhật trạng thái thành công.', 'success');
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật người dùng.';
      showToast(message, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await deleteUser(selectedUser.id);

      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));
      setTotalElements((prev) => Math.max(prev - 1, 0));
      showToast(t('toast.user_deleted') || 'Xóa người dùng thành công.', 'success');
      setIsDeleteConfirmOpen(false);
      setSelectedUser(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xóa người dùng.';
      showToast(message, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleToggleUserStatus = async (user: SystemUser) => {
    const nextStatus: SystemUser['status'] = user.status === 'Suspended' ? 'Active' : 'Suspended';
    setStatusActionUserId(user.id);

    try {
      await changeUserStatus(user.id, toApiStatus(nextStatus));

      if (statusFilter === 'all') {
        setUsers((prev) => prev.map((item) => (
          item.id === user.id
            ? { ...item, status: nextStatus }
            : item
        )));
      } else {
        await loadUsers();
      }

      showToast(
        nextStatus === 'Suspended'
          ? 'Đã khóa tài khoản người dùng.'
          : 'Đã mở khóa tài khoản người dùng.',
        'success',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái người dùng.';
      showToast(message, 'error');
    } finally {
      setStatusActionUserId(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAppliedSearchKeyword(searchKeyword);
    setCurrentPage(1);
  };

  const displayedCount = users.length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-display font-medium tracking-tight tracking-tight text-[#f0f0f0]">{t('users.title')}</h2>
        </div>
        <button
          onClick={openInviteModal}
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
              <p className={cn('text-2xl font-black', stat.color || 'text-[#f0f0f0]')}>{stat.value}</p>
              <stat.icon size={20} className="text-[rgba(255,255,255,0.3)]" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] overflow-hidden shadow-md shadow-black/40">
        <div className="p-4 border-b border-[rgba(255,255,255,0.3)] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[rgba(255,255,255,0.02)]/50">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-9 pr-4 py-2 border border-[rgba(255,255,255,0.3)] outline-none transition-all bg-transparent rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-[#a1a4a5]/40"
            />
          </form>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as typeof roleFilter);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto appearance-none bg-transparent border border-[rgba(255,255,255,0.3)] pl-9 pr-8 py-2 outline-none cursor-pointer hover:bg-transparent transition-colors rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40"
              >
                <option value="all" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Tất cả vai trò' : 'All Roles'}</option>
                <option value="admin" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Quản trị viên' : 'Admin'}</option>
                <option value="owner" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Chủ sở hữu' : 'Owner'}</option>
                <option value="user" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Người dùng' : 'User'}</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={14} />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as typeof statusFilter);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto appearance-none bg-transparent border border-[rgba(255,255,255,0.3)] pl-9 pr-8 py-2 outline-none cursor-pointer hover:bg-transparent transition-colors rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40"
              >
                <option value="all" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Tất cả trạng thái' : 'All Statuses'}</option>
                <option value="active" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Hoạt động' : 'Active'}</option>
                <option value="pending" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Chờ kích hoạt' : 'Pending'}</option>
                <option value="suspended" className="bg-[#000000] text-[#f0f0f0]">{language === 'vi' ? 'Bị đình chỉ' : 'Suspended'}</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={14} />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value as typeof sortOption);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto appearance-none bg-transparent border border-[rgba(255,255,255,0.3)] pl-9 pr-8 py-2 outline-none cursor-pointer hover:bg-transparent transition-colors rounded-[8px] text-[#f0f0f0] text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40"
              >
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
              {isLoadingUsers ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`user-skeleton-${index}`}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-12 animate-pulse rounded-[12px] bg-[rgba(255,255,255,0.04)]" />
                    </td>
                  </tr>
                ))
              ) : users.map((user) => (
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
                      'inline-flex items-center px-0 py-0.5 text-xs font-black uppercase tracking-wider',
                      user.globalRole === 'ADMIN' ? 'text-blue-500' :
                        user.globalRole === 'OWNER' ? 'text-purple-500' : 'text-[#a1a4a5]'
                    )}>
                      {language === 'vi'
                        ? (user.globalRole === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : user.globalRole === 'USER' ? 'NGƯỜI DÙNG' : user.globalRole === 'OWNER' ? 'CHỦ SỞ HỮU' : user.globalRole)
                        : user.globalRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'size-2 rounded-full',
                        user.status === 'Active' ? 'bg-green-500' : user.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'
                      )}></span>
                      <span className={cn(
                        'text-sm font-medium',
                        user.status === 'Suspended' ? 'text-[#ff0000]' : user.status === 'Pending' ? 'text-amber-400' : 'text-[#f0f0f0]'
                      )}>
                        {language === 'vi'
                          ? (user.status === 'Active' ? 'Hoạt động' : user.status === 'Suspended' ? 'Bị đình chỉ' : 'Chờ kích hoạt')
                          : user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a1a4a5]">
                    {language === 'vi'
                      ? user.lastLogin
                        .replace('mins ago', 'phút trước')
                        .replace('hours ago', 'giờ trước')
                        .replace('days ago', 'ngày trước')
                        .replace('Just now', 'Vừa xong')
                        .replace('Never', 'Chưa từng')
                      : user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        disabled={statusActionUserId === user.id}
                        className={cn(
                          'p-2 rounded-[12px] transition-all disabled:opacity-60',
                          user.status === 'Suspended'
                            ? 'text-orange-400 hover:bg-orange-500/10'
                            : 'text-emerald-400 hover:bg-emerald-500/10'
                        )}
                        title={
                          language === 'vi'
                            ? user.status === 'Suspended' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'
                            : user.status === 'Suspended' ? 'Unlock user' : 'Lock user'
                        }
                      >
                        {user.status === 'Suspended' ? <Lock size={18} /> : <LockOpen size={18} />}
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-[#3b9eff] hover:bg-[rgba(59,158,255,0.05)] rounded-[12px] transition-all"
                        title={t('common.edit')}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(user)}
                        className="p-2 text-[#ff0000] hover:bg-[#ff0000]/10 rounded-[12px] transition-all"
                        title={t('common.delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoadingUsers && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#a1a4a5] text-sm">
                    {t('users.no_users')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.3)] flex items-center justify-between">
          <p className="text-sm text-[#a1a4a5]">{t('users.showing')} {displayedCount} / {totalElements} {t('users.users')}</p>
          <div className="flex gap-2">
            <button
              className="px-4 py-1.5 text-sm font-bold bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-md disabled:opacity-50"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="px-4 py-1.5 text-sm font-bold bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-md disabled:opacity-50"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(44,44,46,0.48)] backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[rgba(44,44,46,0.92)] border border-[rgba(255,255,255,0.08)] rounded-[16px] shadow-2xl shadow-black/35 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#ffffff]">{t('users.create')}</h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-[#a1a4a5] hover:text-[#a1a4a5] p-1 rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('team.email_address')}</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <p className="text-xs text-[#a1a4a5]">
                {language === 'vi' ? 'Hệ thống sẽ gửi lời mời tham gia tenant hiện tại qua email.' : 'The system will send an invitation to join the current tenant by email.'}
              </p>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-[#a1a4a5] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-[#000000] bg-[#ffffff] hover:bg-[#f0f0f0] rounded-md shadow-md shadow-black/40 shadow-primary/20 transition-all disabled:opacity-60"
                >
                  {isSubmittingInvite ? 'Đang gửi...' : t('users.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(44,44,46,0.48)] backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[rgba(44,44,46,0.92)] border border-[rgba(255,255,255,0.08)] rounded-[16px] shadow-2xl shadow-black/35 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#ffffff]">{t('users.edit')}</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                }}
                className="text-[#a1a4a5] hover:text-[#a1a4a5] p-1 rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('team.full_name')}</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('team.email_address')}</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('users.table.role')}</label>
                <select
                  value={editForm.globalRole}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, globalRole: e.target.value }))}
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                >
                  <option value="ADMIN" className="bg-[#000000] text-[#f0f0f0]">ADMIN</option>
                  <option value="OWNER" className="bg-[#000000] text-[#f0f0f0]">OWNER</option>
                  <option value="USER" className="bg-[#000000] text-[#f0f0f0]">USER</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">Last Login</label>
                <input
                  type="text"
                  value={selectedUser.lastLogin}
                  readOnly
                  className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.2)] rounded-[8px] px-4 py-2.5 text-sm text-[#a1a4a5] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('users.table.status')}</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as SystemUser['status'] }))}
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                >
                  <option value="Active" className="bg-[#000000] text-[#f0f0f0]">Active</option>
                  <option value="Pending" className="bg-[#000000] text-[#f0f0f0]">Pending</option>
                  <option value="Suspended" className="bg-[#000000] text-[#f0f0f0]">Suspended</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-[#a1a4a5] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-[#000000] bg-[#ffffff] hover:bg-[#f0f0f0] rounded-md shadow-md shadow-black/40 shadow-primary/20 transition-all disabled:opacity-60"
                >
                  {isUpdatingStatus ? 'Đang lưu...' : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDelete}
        isDeleting={isUpdatingStatus}
        title={t('users.confirm.delete.title')}
        description={`${t('users.confirm.delete.msg')} "${selectedUser?.name}"?`}
        warningText={t('users.confirm.delete.undone')}
        confirmText={t('common.delete')}
      />
    </div>
  );
}
