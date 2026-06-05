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
  ChevronDown,
  Check,
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
import { isValidEmail, isValidPhone } from '../lib/validation';

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
type FieldErrors = Record<string, string | undefined>;

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
  const [inviteErrors, setInviteErrors] = useState<FieldErrors>({});
  const [inviteTouched, setInviteTouched] = useState<Record<string, boolean>>({});
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const roleDropdownRef = React.useRef<HTMLDivElement>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);
  const sortDropdownRef = React.useRef<HTMLDivElement>(null);

  const validateInviteField = (name: 'email', value: string) => {
    if (name === 'email') {
      if (!value.trim()) return 'Vui lòng nhập email người dùng.';
      if (!isValidEmail(value)) return 'Email không đúng định dạng.';
    }
    return undefined;
  };

  const validateEditField = (name: 'name' | 'email' | 'phone', value: string) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Vui lòng nhập họ và tên.';
        if (value.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự.';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Vui lòng nhập email.';
        if (!isValidEmail(value)) return 'Email không đúng định dạng.';
        return undefined;
      case 'phone':
        if (!value.trim()) return undefined;
        if (!isValidPhone(value)) return 'Số điện thoại không đúng định dạng.';
        return undefined;
      default:
        return undefined;
    }
  };

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(targetNode)) {
        setIsRoleDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(targetNode)) {
        setIsStatusDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(targetNode)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stats = [
    { label: t('users.stats.total'), value: totalElements.toString(), icon: Users },
    { label: t('users.stats.admins'), value: users.filter((u) => u.globalRole === 'ADMIN').length.toString(), icon: Shield },
    { label: t('users.stats.active'), value: users.filter((u) => u.status === 'Active').length.toString(), icon: Activity, color: 'text-green-500' },
    { label: t('users.stats.suspended'), value: users.filter((u) => u.status === 'Suspended').length.toString(), icon: Lock, color: 'text-[#ff0000]' },
  ];

  const openInviteModal = () => {
    setInviteEmail('');
    setInviteErrors({});
    setInviteTouched({});
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
    setEditErrors({});
    setEditTouched({});
    setIsEditModalOpen(true);
  };

  const openDeleteConfirm = (user: SystemUser) => {
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const roleOptions: Array<{ id: typeof roleFilter; label: string }> = [
    { id: 'all', label: language === 'vi' ? 'Tất cả vai trò' : 'All Roles' },
    { id: 'admin', label: language === 'vi' ? 'Quản trị viên' : 'Admin' },
    { id: 'owner', label: language === 'vi' ? 'Chủ sở hữu' : 'Owner' },
    { id: 'user', label: language === 'vi' ? 'Người dùng' : 'User' },
  ];
  const statusOptions: Array<{ id: typeof statusFilter; label: string }> = [
    { id: 'all', label: language === 'vi' ? 'Tất cả trạng thái' : 'All Statuses' },
    { id: 'active', label: language === 'vi' ? 'Hoạt động' : 'Active' },
    { id: 'pending', label: language === 'vi' ? 'Chờ kích hoạt' : 'Pending' },
    { id: 'suspended', label: language === 'vi' ? 'Bị đình chỉ' : 'Suspended' },
  ];
  const sortOptions: Array<{ id: typeof sortOption; label: string }> = [
    { id: 'newest', label: language === 'vi' ? 'Mới nhất trước' : 'Newest First' },
    { id: 'oldest', label: language === 'vi' ? 'Cũ nhất trước' : 'Oldest First' },
    { id: 'name_asc', label: language === 'vi' ? 'Tên (A-Z)' : 'Name (A-Z)' },
    { id: 'name_desc', label: language === 'vi' ? 'Tên (Z-A)' : 'Name (Z-A)' },
  ];
  const roleLabel = roleOptions.find((item) => item.id === roleFilter)?.label || roleOptions[0].label;
  const statusLabel = statusOptions.find((item) => item.id === statusFilter)?.label || statusOptions[0].label;
  const sortLabel = sortOptions.find((item) => item.id === sortOption)?.label || sortOptions[0].label;
  const editRoleOptions = [
    { id: 'ADMIN', label: language === 'vi' ? 'Quản trị viên' : 'Admin', tone: 'blue' },
    { id: 'OWNER', label: language === 'vi' ? 'Chủ sở hữu' : 'Owner', tone: 'purple' },
    { id: 'USER', label: language === 'vi' ? 'Người dùng' : 'User', tone: 'neutral' },
  ];
  const editStatusOptions: Array<{ id: SystemUser['status']; label: string; tone: 'green' | 'orange' | 'red' }> = [
    { id: 'Active', label: language === 'vi' ? 'Hoạt động' : 'Active', tone: 'green' },
    { id: 'Pending', label: language === 'vi' ? 'Chờ kích hoạt' : 'Pending', tone: 'orange' },
    { id: 'Suspended', label: language === 'vi' ? 'Bị đình chỉ' : 'Suspended', tone: 'red' },
  ];

  const handleInviteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors: FieldErrors = {
      email: validateInviteField('email', inviteEmail),
    };
    setInviteErrors(nextErrors);
    setInviteTouched({ email: true });
    if (nextErrors.email) {
      return;
    }

    setIsSubmittingInvite(true);
    try {
      await inviteUser({ email: inviteEmail.trim() });

      showToast(t('toast.user_created') || 'Đã gửi lời mời người dùng.', 'success');
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteErrors({});
      setInviteTouched({});
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

    const nextErrors: FieldErrors = {
      name: validateEditField('name', editForm.name),
      email: validateEditField('email', editForm.email),
      phone: validateEditField('phone', editForm.phone),
    };
    setEditErrors(nextErrors);
    setEditTouched({ name: true, email: true, phone: true });
    if (nextErrors.name || nextErrors.email || nextErrors.phone) {
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
      setEditErrors({});
      setEditTouched({});
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
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="rounded-[24px] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#9fa3a5]">
              <Shield size={13} />
              {t('nav.users')}
            </div>
          </div>
          <button
            onClick={openInviteModal}
            className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#ffffff] px-5 py-2.5 text-sm font-bold text-[#000000] shadow-[0_14px_30px_rgba(0,0,0,0.22)] transition-colors hover:bg-[#f0f0f0] active:scale-95"
          >
            <UserPlus size={18} />
            {t('users.create')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[20px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.18)] transition-colors hover:border-[rgba(59,158,255,0.24)]">
            <div className="mb-5 flex items-center justify-between">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)]', stat.color || 'text-[#3b9eff]')}>
                <stat.icon size={19} />
              </div>
              <span className="rounded-full bg-[rgba(255,255,255,0.04)] px-2 py-1 text-[11px] font-bold text-[#8b8f91]">
                {language === 'vi' ? 'Hệ thống' : 'System'}
              </span>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8b8f91]">{stat.label}</p>
            <p className={cn('mt-2 text-[28px] font-display font-medium tracking-tight', stat.color || 'text-[#f0f0f0]')}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
        <div className="border-b border-[rgba(255,255,255,0.08)] p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a4a5]" size={16} />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={t('common.search')}
              className="w-full rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] py-2.5 pl-9 pr-4 text-[14px] text-[#f0f0f0] outline-none transition-colors placeholder:text-[#a1a4a5]/40 focus:border-[rgba(59,158,255,0.5)] focus:ring-2 focus:ring-[rgba(59,158,255,0.18)]"
            />
          </form>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 xl:w-auto">
            <div ref={roleDropdownRef} className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                className="flex w-full sm:min-w-[170px] items-center justify-between gap-3 rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-left text-sm text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,158,255,0.24)]"
              >
                <span className="min-w-0 truncate">{roleLabel}</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "shrink-0 text-[#8d9295] transition-transform",
                    isRoleDropdownOpen ? "rotate-180" : ""
                  )}
                />
              </button>
              {isRoleDropdownOpen ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[#0b0b0c] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.42)]">
                  <div className="space-y-1">
                    {roleOptions.map((item) => {
                      const isSelected = item.id === roleFilter;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setRoleFilter(item.id);
                            setCurrentPage(1);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
                            isSelected
                              ? "bg-[rgba(59,158,255,0.10)] text-[#f0f0f0]"
                              : "text-[#c9cdcf] hover:bg-[rgba(255,255,255,0.05)]"
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                          {isSelected ? <Check size={15} className="text-[#3b9eff]" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <div ref={statusDropdownRef} className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                className="flex w-full sm:min-w-[170px] items-center justify-between gap-3 rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-left text-sm text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,158,255,0.24)]"
              >
                <span className="min-w-0 truncate">{statusLabel}</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "shrink-0 text-[#8d9295] transition-transform",
                    isStatusDropdownOpen ? "rotate-180" : ""
                  )}
                />
              </button>
              {isStatusDropdownOpen ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[#0b0b0c] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.42)]">
                  <div className="space-y-1">
                    {statusOptions.map((item) => {
                      const isSelected = item.id === statusFilter;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setStatusFilter(item.id);
                            setCurrentPage(1);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
                            isSelected
                              ? "bg-[rgba(59,158,255,0.10)] text-[#f0f0f0]"
                              : "text-[#c9cdcf] hover:bg-[rgba(255,255,255,0.05)]"
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                          {isSelected ? <Check size={15} className="text-[#3b9eff]" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <div ref={sortDropdownRef} className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                className="flex w-full sm:min-w-[170px] items-center justify-between gap-3 rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-left text-sm text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,158,255,0.24)]"
              >
                <span className="min-w-0 truncate">{sortLabel}</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "shrink-0 text-[#8d9295] transition-transform",
                    isSortDropdownOpen ? "rotate-180" : ""
                  )}
                />
              </button>
              {isSortDropdownOpen ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[#0b0b0c] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.42)]">
                  <div className="space-y-1">
                    {sortOptions.map((item) => {
                      const isSelected = item.id === sortOption;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSortOption(item.id);
                            setCurrentPage(1);
                            setIsSortDropdownOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
                            isSelected
                              ? "bg-[rgba(59,158,255,0.10)] text-[#f0f0f0]"
                              : "text-[#c9cdcf] hover:bg-[rgba(255,255,255,0.05)]"
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                          {isSelected ? <Check size={15} className="text-[#3b9eff]" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.02)]">
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('users.table.user')}</th>
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('users.table.role')}</th>
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('users.table.status')}</th>
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('users.table.last_login')}</th>
                <th className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 text-right text-xs font-black uppercase tracking-[0.14em] text-[#8b8f91]">{t('users.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
              {isLoadingUsers ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`user-skeleton-${index}`}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-12 animate-pulse rounded-[12px] bg-[rgba(255,255,255,0.04)]" />
                    </td>
                  </tr>
                ))
              ) : users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-[rgba(255,255,255,0.03)]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="size-10 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] object-cover"
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
                      'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider',
                      user.globalRole === 'ADMIN' ? 'border-[#3b9eff]/20 bg-[#3b9eff]/10 text-[#3b9eff]' :
                        user.globalRole === 'OWNER' ? 'border-[#a78bfa]/20 bg-[#a78bfa]/10 text-[#a78bfa]' : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[#a1a4a5]'
                    )}>
                      {language === 'vi'
                        ? (user.globalRole === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : user.globalRole === 'USER' ? 'NGƯỜI DÙNG' : user.globalRole === 'OWNER' ? 'CHỦ SỞ HỮU' : user.globalRole)
                        : user.globalRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
                      user.status === 'Active' ? 'border-[#11ff99]/20 bg-[#11ff99]/10' :
                        user.status === 'Pending' ? 'border-[#ff801f]/20 bg-[#ff801f]/10' : 'border-[#ff0000]/20 bg-[#ff0000]/10'
                    )}>
                      <span className={cn(
                        'size-2 rounded-full',
                        user.status === 'Active' ? 'bg-[#11ff99]' : user.status === 'Pending' ? 'bg-[#ff801f]' : 'bg-[#ff0000]'
                      )}></span>
                      <span className={cn(
                        'text-xs font-bold',
                        user.status === 'Suspended' ? 'text-[#ff0000]' : user.status === 'Pending' ? 'text-[#ff801f]' : 'text-[#11ff99]'
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
                          'rounded-[12px] border border-transparent p-2 transition-all disabled:opacity-60',
                          user.status === 'Suspended'
                            ? 'text-[#ff801f] hover:border-[#ff801f]/20 hover:bg-[#ff801f]/10'
                            : 'text-[#11ff99] hover:border-[#11ff99]/20 hover:bg-[#11ff99]/10'
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
                        className="rounded-[12px] border border-transparent p-2 text-[#3b9eff] transition-all hover:border-[#3b9eff]/20 hover:bg-[rgba(59,158,255,0.08)]"
                        title={t('common.edit')}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(user)}
                        className="rounded-[12px] border border-transparent p-2 text-[#ff0000] transition-all hover:border-[#ff0000]/20 hover:bg-[#ff0000]/10"
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
        <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-6 py-4">
          <p className="text-sm text-[#a1a4a5]">{t('users.showing')} {displayedCount} / {totalElements} {t('users.users')}</p>
          <div className="flex gap-2">
            <button
              className="rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-bold text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.07)] disabled:opacity-50"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-bold text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.07)] disabled:opacity-50"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[#050505] shadow-[0_28px_90px_rgba(0,0,0,0.62)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-[18px] border border-[#3b9eff]/20 bg-[#3b9eff]/10 text-[#3b9eff]">
                  <UserPlus size={19} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b8f91]">{t('nav.users')}</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#ffffff]">{t('users.create')}</h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteErrors({});
                  setInviteTouched({});
                }}
                className="rounded-[12px] p-2 text-[#a1a4a5] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#ffffff]"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="space-y-5 p-6">
              <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                <p className="text-sm font-semibold text-[#f0f0f0]">{language === 'vi' ? 'Gửi lời mời qua email' : 'Send email invitation'}</p>
                <p className="mt-1 text-xs leading-5 text-[#8b8f91]">
                  {language === 'vi' ? 'Người dùng sẽ nhận liên kết đăng ký và tham gia tenant hiện tại.' : 'The user will receive a registration link to join the current tenant.'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('team.email_address')}</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setInviteEmail(nextValue);
                    setInviteErrors((current) => inviteTouched.email
                      ? { ...current, email: validateInviteField('email', nextValue) }
                      : current);
                  }}
                  onBlur={() => {
                    setInviteTouched((current) => ({ ...current, email: true }));
                    setInviteErrors((current) => ({ ...current, email: validateInviteField('email', inviteEmail) }));
                  }}
                  placeholder="jane@example.com"
                  className="w-full rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm text-[#ffffff] outline-none transition-colors focus:border-[rgba(59,158,255,0.5)] focus:ring-2 focus:ring-[rgba(59,158,255,0.18)]"
                  aria-invalid={inviteTouched.email && !!inviteErrors.email}
                />
                {inviteTouched.email && inviteErrors.email && (
                  <p className="text-[11px] text-[#ff0000] font-medium">{inviteErrors.email}</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    setInviteErrors({});
                    setInviteTouched({});
                  }}
                  className="flex-1 rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm font-bold text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.12)] hover:text-[#ffffff]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="flex-1 rounded-[14px] bg-[#ffffff] px-4 py-2.5 text-sm font-bold text-[#000000] shadow-[0_14px_30px_rgba(0,0,0,0.22)] transition-colors hover:bg-[#f0f0f0] disabled:opacity-60"
                >
                  {isSubmittingInvite ? 'Đang gửi...' : t('users.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[#050505] shadow-[0_28px_90px_rgba(0,0,0,0.62)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6 py-6">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="size-12 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b8f91]">{t('users.details.title')}</p>
                  <h3 className="mt-1 truncate text-lg font-semibold text-[#ffffff]">{selectedUser.name}</h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                  setEditErrors({});
                  setEditTouched({});
                }}
                className="rounded-[12px] p-2 text-[#a1a4a5] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#ffffff]"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="max-h-[calc(90vh-104px)] overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('team.full_name')}</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setEditForm((prev) => ({ ...prev, name: nextValue }));
                    setEditErrors((current) => editTouched.name
                      ? { ...current, name: validateEditField('name', nextValue) }
                      : current);
                  }}
                  onBlur={() => {
                    setEditTouched((current) => ({ ...current, name: true }));
                    setEditErrors((current) => ({ ...current, name: validateEditField('name', editForm.name) }));
                  }}
                  className="w-full rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm text-[#ffffff] outline-none transition-colors focus:border-[rgba(59,158,255,0.5)] focus:ring-2 focus:ring-[rgba(59,158,255,0.18)]"
                  aria-invalid={editTouched.name && !!editErrors.name}
                />
                {editTouched.name && editErrors.name && (
                  <p className="text-[11px] text-[#ff0000] font-medium">{editErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#ffffff]">{t('team.email_address')}</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setEditForm((prev) => ({ ...prev, email: nextValue }));
                    setEditErrors((current) => editTouched.email
                      ? { ...current, email: validateEditField('email', nextValue) }
                      : current);
                  }}
                  onBlur={() => {
                    setEditTouched((current) => ({ ...current, email: true }));
                    setEditErrors((current) => ({ ...current, email: validateEditField('email', editForm.email) }));
                  }}
                  className="w-full rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm text-[#ffffff] outline-none transition-colors focus:border-[rgba(59,158,255,0.5)] focus:ring-2 focus:ring-[rgba(59,158,255,0.18)]"
                  aria-invalid={editTouched.email && !!editErrors.email}
                />
                {editTouched.email && editErrors.email && (
                  <p className="text-[11px] text-[#ff0000] font-medium">{editErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#ffffff]">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setEditForm((prev) => ({ ...prev, phone: nextValue }));
                    setEditErrors((current) => editTouched.phone
                      ? { ...current, phone: validateEditField('phone', nextValue) }
                      : current);
                  }}
                  onBlur={() => {
                    setEditTouched((current) => ({ ...current, phone: true }));
                    setEditErrors((current) => ({ ...current, phone: validateEditField('phone', editForm.phone) }));
                  }}
                  className="w-full rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm text-[#ffffff] outline-none transition-colors focus:border-[rgba(59,158,255,0.5)] focus:ring-2 focus:ring-[rgba(59,158,255,0.18)]"
                  aria-invalid={editTouched.phone && !!editErrors.phone}
                />
                {editTouched.phone && editErrors.phone && (
                  <p className="text-[11px] text-[#ff0000] font-medium">{editErrors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#ffffff]">{t('users.table.role')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {editRoleOptions.map((option) => {
                    const selected = editForm.globalRole === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setEditForm((prev) => ({ ...prev, globalRole: option.id }))}
                        className={cn(
                          'rounded-[14px] border px-3 py-2.5 text-xs font-bold transition-colors',
                          selected
                            ? option.tone === 'blue'
                              ? 'border-[#3b9eff]/35 bg-[#3b9eff]/10 text-[#3b9eff]'
                              : option.tone === 'purple'
                                ? 'border-[#a78bfa]/35 bg-[#a78bfa]/10 text-[#a78bfa]'
                                : 'border-[#ffffff]/20 bg-[#ffffff]/10 text-[#ffffff]'
                            : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.035)] text-[#8b8f91] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f0f0f0]'
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">Last Login</label>
                <input
                  type="text"
                  value={selectedUser.lastLogin}
                  readOnly
                  className="w-full rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-[#a1a4a5] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#f0f0f0]">{t('users.table.status')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {editStatusOptions.map((option) => {
                    const selected = editForm.status === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setEditForm((prev) => ({ ...prev, status: option.id }))}
                        className={cn(
                          'rounded-[14px] border px-3 py-2.5 text-xs font-bold transition-colors',
                          selected
                            ? option.tone === 'green'
                              ? 'border-[#11ff99]/35 bg-[#11ff99]/10 text-[#11ff99]'
                              : option.tone === 'orange'
                                ? 'border-[#ff801f]/35 bg-[#ff801f]/10 text-[#ff801f]'
                                : 'border-[#ff0000]/35 bg-[#ff0000]/10 text-[#ff0000]'
                            : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.035)] text-[#8b8f91] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f0f0f0]'
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              </div>
              <div className="mt-6 flex gap-3 border-t border-[rgba(255,255,255,0.08)] pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                    setEditErrors({});
                    setEditTouched({});
                  }}
                  className="flex-1 rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm font-bold text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.12)] hover:text-[#ffffff]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="flex-1 rounded-[14px] bg-[#ffffff] px-4 py-2.5 text-sm font-bold text-[#000000] shadow-[0_14px_30px_rgba(0,0,0,0.22)] transition-colors hover:bg-[#f0f0f0] disabled:opacity-60"
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
