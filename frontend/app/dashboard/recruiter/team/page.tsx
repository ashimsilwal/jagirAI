'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  apiFetch,
  Organization,
  OrganizationMembership,
  OrganizationRole,
  OrganizationActivityLog,
  PermissionDefinition,
  PaginatedResponse,
  getMediaUrl,
} from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  PlusCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  X,
  AlertTriangle,
  Building2,
  History,
  Key,
  ChevronDown,
  Info,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Sliders,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';

type TabType = 'members' | 'roles' | 'activity';

export default function TeamManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Active Organization & Current User Perms
  const [org, setOrg] = useState<Organization | null>(null);
  const [currentMembership, setCurrentMembership] = useState<OrganizationMembership | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('members');

  // 1. Members State
  const [members, setMembers] = useState<OrganizationMembership[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersTotal, setMembersTotal] = useState(0);
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(10);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('');

  // 2. Roles State
  const [roles, setRoles] = useState<OrganizationRole[]>([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState<PermissionDefinition[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // 3. Activity State
  const [activities, setActivities] = useState<OrganizationActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityActionFilter, setActivityActionFilter] = useState('');

  // Modals State
  // Add Member Modal
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [addMemberName, setAddMemberName] = useState('');
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberRoleId, setAddMemberRoleId] = useState<number | ''>('');
  const [addMemberCustomPerms, setAddMemberCustomPerms] = useState<string[]>([]);
  const [showCustomPermsAccordion, setShowCustomPermsAccordion] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [createdOtpData, setCreatedOtpData] = useState<{
    email: string;
    fullName: string;
    otp: string;
  } | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Reset Member Password Modal
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetPasswordMember, setResetPasswordMember] = useState<OrganizationMembership | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Edit Member Modal
  const [editingMember, setEditingMember] = useState<OrganizationMembership | null>(null);
  const [editRoleId, setEditRoleId] = useState<number | ''>('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editCustomPerms, setEditCustomPerms] = useState<string[]>([]);
  const [updatingMember, setUpdatingMember] = useState(false);

  // Create Custom Role Modal
  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [creatingRole, setCreatingRole] = useState(false);

  // Confirmation Modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDestructive: false,
    onConfirm: async () => {},
  });

  // Check auth
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'JOB_RECRUITER')) {
      if (user?.role === 'JOB_SEEKER') {
        router.replace('/dashboard/seeker');
      } else if (!user) {
        router.replace('/login');
      }
    }
  }, [user, authLoading, router]);

  // Load Organization & User Profile
  const loadOrganization = useCallback(async () => {
    try {
      const data = await apiFetch<any>('/organizations/current/');
      setOrg(data.organization);
      setCurrentMembership(data.membership);
      setUserPermissions(data.user_permissions || []);
      setIsOwner(data.is_owner || false);
    } catch (err: any) {
      console.error('Failed to load organization:', err);
      setActionError(err.detail || 'Failed to load organization profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  // Permission helpers
  const canViewTeam = isOwner || userPermissions.includes('team.view');
  const canCreateMember = isOwner || userPermissions.includes('team.create_member') || userPermissions.includes('team.manage_members');
  const canManageTeam = isOwner || userPermissions.includes('team.manage_members');
  const canRemove = isOwner || userPermissions.includes('team.remove_members');
  const canViewActivity = isOwner || userPermissions.includes('activity.view');

  // Load Members
  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(memberPage));
      params.append('page_size', String(memberPageSize));
      if (memberSearch) params.append('search', memberSearch);
      if (memberRoleFilter) params.append('role', memberRoleFilter);
      if (memberStatusFilter) params.append('status', memberStatusFilter);

      const res = await apiFetch<PaginatedResponse<OrganizationMembership>>(`/organizations/members/?${params.toString()}`);
      if (res && Array.isArray(res.results)) {
        setMembers(res.results);
        setMembersTotal(res.count);
      } else if (Array.isArray(res)) {
        setMembers(res);
        setMembersTotal((res as any[]).length);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [memberPage, memberPageSize, memberSearch, memberRoleFilter, memberStatusFilter]);

  // Load Roles & Catalog
  const loadRolesAndCatalog = useCallback(async () => {
    setRolesLoading(true);
    try {
      const [rolesData, catalogData] = await Promise.all([
        apiFetch<OrganizationRole[]>('/organizations/roles/'),
        apiFetch<any>('/organizations/permissions-catalog/'),
      ]);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      if (catalogData && Array.isArray(catalogData.permissions)) {
        setPermissionsCatalog(catalogData.permissions);
      }
    } catch (err) {
      console.error('Failed to load roles/catalog:', err);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  // Load Activities
  const loadActivities = useCallback(async () => {
    if (!canViewActivity) return;
    setActivityLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(activityPage));
      params.append('page_size', '15');
      if (activityActionFilter) params.append('action', activityActionFilter);

      const res = await apiFetch<PaginatedResponse<OrganizationActivityLog>>(`/organizations/activity/?${params.toString()}`);
      if (res && Array.isArray(res.results)) {
        setActivities(res.results);
        setActivityTotal(res.count);
      } else if (Array.isArray(res)) {
        setActivities(res);
        setActivityTotal((res as any[]).length);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setActivityLoading(false);
    }
  }, [canViewActivity, activityPage, activityActionFilter]);

  // Tab switch effect
  useEffect(() => {
    if (activeTab === 'members') {
      loadMembers();
    } else if (activeTab === 'roles') {
      loadRolesAndCatalog();
    } else if (activeTab === 'activity') {
      loadActivities();
    }
  }, [activeTab, loadMembers, loadRolesAndCatalog, loadActivities]);

  // Notification clear timer
  useEffect(() => {
    if (actionSuccess || actionError) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess, actionError]);

  // Handle Direct Member Account Creation with One-Time Password (OTP)
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = addMemberName.trim();
    const trimmedEmail = addMemberEmail.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      setActionError('Please provide a valid full name (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setActionError('Please provide a valid work email address (e.g., name@company.com).');
      return;
    }

    if (!addMemberRoleId) {
      setActionError('Please select an organization role.');
      return;
    }

    setAddingMember(true);
    setActionError(null);
    try {
      const res = await apiFetch<any>('/organizations/members/', {
        method: 'POST',
        body: JSON.stringify({
          full_name: trimmedName,
          email: trimmedEmail,
          role_id: addMemberRoleId,
          custom_permissions: addMemberCustomPerms,
        }),
      });

      setCreatedOtpData({
        email: res.email || trimmedEmail,
        fullName: res.full_name || trimmedName,
        otp: res.one_time_password,
      });
      setCopiedOtp(false);
      loadMembers();
      loadOrganization();
    } catch (err: any) {
      const errMsg =
        err.email?.[0] ||
        err.full_name?.[0] ||
        err.role_id?.[0] ||
        err.detail ||
        err.message ||
        'Failed to create team member.';
      setActionError(errMsg);
    } finally {
      setAddingMember(false);
    }
  };

  // Handle Reset Member Password
  const openResetPassword = (member: OrganizationMembership) => {
    setResetPasswordMember(member);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setShowResetPassword(false);
    setResetPasswordModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordMember) return;
    if (resetNewPassword !== resetConfirmPassword) {
      setActionError('Passwords do not match.');
      return;
    }
    if (resetNewPassword.length < 8) {
      setActionError('Password must contain at least 8 characters.');
      return;
    }

    setResettingPassword(true);
    setActionError(null);
    try {
      const res = await apiFetch<any>(`/organizations/members/${resetPasswordMember.id}/reset_password/`, {
        method: 'POST',
        body: JSON.stringify({
          password: resetNewPassword,
          confirm_password: resetConfirmPassword,
        }),
      });
      setActionSuccess(res.message || `Password reset successfully for ${resetPasswordMember.user.email}.`);
      setResetPasswordModalOpen(false);
      setResetPasswordMember(null);
      setResetNewPassword('');
      setResetConfirmPassword('');
    } catch (err: any) {
      const errMsg =
        err.password?.[0] ||
        err.confirm_password?.[0] ||
        err.detail ||
        'Failed to reset member password.';
      setActionError(errMsg);
    } finally {
      setResettingPassword(false);
    }
  };

  // Handle Toggle Member Active/Suspended Status
  const handleToggleStatus = (member: OrganizationMembership) => {
    const isSuspending = member.status === 'ACTIVE';
    const targetStatus = isSuspending ? 'SUSPENDED' : 'ACTIVE';
    const actionVerb = isSuspending ? 'Deactivate' : 'Activate';

    setConfirmDialog({
      isOpen: true,
      title: `${actionVerb} Team Member Account`,
      message: isSuspending
        ? `Are you sure you want to deactivate ${member.user.username} (${member.user.email})? They will immediately lose access to all organization vacancies, applicants, and tools until reactivated.`
        : `Are you sure you want to reactivate ${member.user.username} (${member.user.email})?`,
      confirmText: `${actionVerb} Account`,
      isDestructive: isSuspending,
      onConfirm: async () => {
        try {
          await apiFetch(`/organizations/members/${member.id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status: targetStatus }),
          });
          setActionSuccess(`Account for ${member.user.email} is now ${targetStatus.toLowerCase()}.`);
          loadMembers();
        } catch (err: any) {
          setActionError(err.detail || `Failed to ${actionVerb.toLowerCase()} member.`);
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Handle Open Edit Member Modal
  const openEditMember = (member: OrganizationMembership) => {
    setEditingMember(member);
    setEditRoleId(member.role.id);
    setEditStatus(member.status as 'ACTIVE' | 'SUSPENDED');
    setEditCustomPerms(member.custom_permissions || []);
    if (roles.length === 0) {
      loadRolesAndCatalog();
    }
  };

  // Handle Save Member Edit
  const handleSaveMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setUpdatingMember(true);
    setActionError(null);
    try {
      await apiFetch(`/organizations/members/${editingMember.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          role_id: editRoleId,
          status: editStatus,
          custom_permissions: editCustomPerms,
        }),
      });
      setActionSuccess(`Permissions updated for ${editingMember.user.email}.`);
      setEditingMember(null);
      loadMembers();
    } catch (err: any) {
      setActionError(err.detail || 'Failed to update member permissions.');
    } finally {
      setUpdatingMember(false);
    }
  };

  // Handle Remove Member
  const handleRemoveMember = (member: OrganizationMembership) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${member.user.username} (${member.user.email}) from ${org?.name}? They will immediately lose access to all organization vacancies, applicants, and tools.`,
      confirmText: 'Remove Member',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await apiFetch(`/organizations/members/${member.id}/`, {
            method: 'DELETE',
          });
          setActionSuccess(`${member.user.email} removed from team.`);
          loadMembers();
          loadOrganization();
        } catch (err: any) {
          setActionError(err.detail || 'Failed to remove member.');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Handle Create Custom Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName || rolePermissions.length === 0) {
      setActionError('Please enter a role name and select at least one permission.');
      return;
    }
    setCreatingRole(true);
    setActionError(null);
    try {
      await apiFetch('/organizations/roles/', {
        method: 'POST',
        body: JSON.stringify({
          name: roleName,
          description: roleDescription,
          permissions: rolePermissions,
        }),
      });
      setActionSuccess(`Custom role '${roleName}' created successfully.`);
      setCreateRoleModalOpen(false);
      setRoleName('');
      setRoleDescription('');
      setRolePermissions([]);
      loadRolesAndCatalog();
    } catch (err: any) {
      setActionError(err.detail || 'Failed to create role.');
    } finally {
      setCreatingRole(false);
    }
  };

  // Delete Custom Role
  const handleDeleteRole = (role: OrganizationRole) => {
    if (role.is_predefined) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Custom Role',
      message: `Are you sure you want to permanently delete the custom role '${role.name}'?`,
      confirmText: 'Delete Role',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await apiFetch(`/organizations/roles/${role.id}/`, {
            method: 'DELETE',
          });
          setActionSuccess(`Role '${role.name}' deleted.`);
          loadRolesAndCatalog();
        } catch (err: any) {
          setActionError(err.detail || 'Failed to delete role.');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Group permissions by category for the matrix
  const permissionsByCategory = useMemo(() => {
    const groups: Record<string, PermissionDefinition[]> = {};
    for (const p of permissionsCatalog) {
      const cat = p.category.charAt(0).toUpperCase() + p.category.slice(1);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [permissionsCatalog]);

  // Computed metrics for member cards
  const memberMetrics = useMemo(() => {
    const active = members.filter((m) => m.status === 'ACTIVE').length;
    const suspended = members.filter((m) => m.status === 'SUSPENDED').length;
    const rolesInUse = new Set(members.map((m) => m.role?.id)).size;
    return {
      total: org?.members_count || membersTotal || members.length,
      active,
      suspended,
      rolesInUse,
    };
  }, [members, org?.members_count, membersTotal]);

  const activityMetrics = useMemo(() => {
    const uniqueActors = new Set(activities.map((a) => a.actor_username).filter(Boolean)).size;
    const memberActions = activities.filter((a) => a.action.includes('MEMBER')).length;
    return {
      total: activityTotal || activities.length,
      uniqueActors,
      memberActions,
    };
  }, [activities, activityTotal]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
      </div>
    );
  }

  if (!canViewTeam) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-8 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
          <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">
            Access Restricted
          </h2>
          <p className="text-xs text-amber-700 dark:text-amber-300 max-w-md mx-auto">
            Your staff account does not have permission to view or manage organization team members.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/dashboard/recruiter')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 transition shadow-sm cursor-pointer"
            >
              Return to Recruiter Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
      {/* 1. Header & Organization Identity */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 min-w-0">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 text-lg sm:text-xl font-bold overflow-hidden shrink-0">
              {org?.logo && !logoFailed ? (
                <img
                  src={getMediaUrl(org.logo) || ''}
                  alt={org.name}
                  className="w-full h-full object-cover"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                org?.name?.slice(0, 2).toUpperCase() || 'OG'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white break-words">
                  {org?.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 shrink-0">
                  {isOwner ? 'Organization Owner' : currentMembership?.role?.name || 'Team Member'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 break-words">
                {org?.description || 'Manage your recruitment team members, roles, permissions, and security credentials.'}
              </p>
            </div>
          </div>

          {canCreateMember && (
            <button
              onClick={() => {
                setAddMemberModalOpen(true);
                if (roles.length === 0) loadRolesAndCatalog();
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold transition shadow-sm shadow-sky-500/20 cursor-pointer shrink-0 w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Add Team Member</span>
            </button>
          )}
        </div>

        {/* Global Notifications */}
        {actionSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {actionError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 overflow-x-auto w-full pb-1">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
              activeTab === 'members'
                ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Team Members</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {org?.members_count || membersTotal || members.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
              activeTab === 'roles'
                ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Roles & Permissions</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {roles.length}
            </span>
          </button>

          {canViewActivity && (
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'activity'
                  ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Activity Log</span>
          </button>
          )}
        </div>
      </div>

      {/* 2. TAB CONTENT: Team Members */}
      {activeTab === 'members' && (
        <div className="w-full space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Team Staff & Active Members
              </h2>
              <p className="text-xs text-slate-500">
                Directly manage your organization’s recruitment team, role assignments, passwords, and account statuses.
              </p>
            </div>
            {canCreateMember && (
              <button
                onClick={() => {
                  setAddMemberModalOpen(true);
                  if (roles.length === 0) loadRolesAndCatalog();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition shadow-sm cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Team Member</span>
              </button>
            )}
          </div>

          {/* Metric Overview Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-2 min-w-0">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">Total Members</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white break-words">
                {memberMetrics.total}
              </div>
              <p className="text-xs text-slate-500 break-words">Active roster count</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-2 min-w-0">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">Active Staff</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 break-words">
                {memberMetrics.active}
              </div>
              <p className="text-xs text-slate-500 break-words">Authorized & active accounts</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-2 min-w-0">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">Suspended</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <UserX className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 break-words">
                {memberMetrics.suspended}
              </div>
              <p className="text-xs text-slate-500 break-words">Temporarily disabled accounts</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-2 min-w-0">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">Roles Configured</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-700 dark:text-slate-300 break-words">
                {roles.length || 6}
              </div>
              <p className="text-xs text-slate-500 break-words">Granular permission profiles</p>
            </div>
          </div>

          {/* Unified Members Table Card */}
          <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm min-w-0">
            {/* Toolbar Header */}
            <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full min-w-0">
              <div className="relative w-full md:w-80 min-w-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search team member name or email..."
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setMemberPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition min-w-0"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={memberRoleFilter}
                  onChange={(e) => {
                    setMemberRoleFilter(e.target.value);
                    setMemberPage(1);
                  }}
                  className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer min-w-0"
                >
                  <option value="">All Roles</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.slug}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <select
                  value={memberStatusFilter}
                  onChange={(e) => {
                    setMemberStatusFilter(e.target.value);
                    setMemberPage(1);
                  }}
                  className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer min-w-0"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>

                <button
                  onClick={() => {
                    setMemberSearch('');
                    setMemberRoleFilter('');
                    setMemberStatusFilter('');
                    setMemberPage(1);
                    loadMembers();
                  }}
                  title="Reset filters and refresh"
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            {/* Members Table */}
            {membersLoading ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-sky-600" />
                <p className="text-xs">Loading team roster...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Team Members Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {memberSearch || memberStatusFilter || memberRoleFilter
                    ? 'No members match the selected search criteria.'
                    : 'Add team members directly to collaborate on job vacancies and applicant reviews.'}
                </p>
                {canCreateMember && (
                  <button
                    onClick={() => {
                      setAddMemberModalOpen(true);
                      if (roles.length === 0) loadRolesAndCatalog();
                    }}
                    className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition shadow-sm cursor-pointer"
                  >
                    Add First Member
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[720px] text-left border-collapse table-auto">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 min-w-[190px]">Member</th>
                      <th className="py-3 px-4 min-w-[140px]">Assigned Role</th>
                      <th className="py-3 px-4 min-w-[110px]">Status</th>
                      <th className="py-3 px-4 min-w-[140px]">Permissions</th>
                      <th className="py-3 px-4 min-w-[110px]">Joined Date</th>
                      <th className="py-3 px-4 min-w-[140px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                    {members.map((member) => {
                      const isMemberOwner = member.is_owner;
                      const isCurrentUser = member.user.id === user?.id;

                      return (
                        <tr key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {member.user.profile_picture ? (
                                  <img src={getMediaUrl(member.user.profile_picture) || ''} alt={member.user.username} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  member.user.username.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                  <span className="break-words">{member.user.username}</span>
                                  {isCurrentUser && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium shrink-0">You</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 break-all">{member.user.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${
                              isMemberOwner
                                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                                : member.role.slug === 'admin'
                                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                                : member.role.slug === 'hr_manager'
                                ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              {member.role.name}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                              member.status === 'ACTIVE'
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              {member.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {member.effective_permissions?.length || 0}
                              </span>
                              <span>capabilities</span>
                              {member.custom_permissions?.length > 0 && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-semibold shrink-0">
                                  +{member.custom_permissions.length} custom
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                            {new Date(member.joined_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 shrink-0">
                              {/* Edit Role & Permissions */}
                              {canManageTeam && !isMemberOwner && (
                                <button
                                  onClick={() => openEditMember(member)}
                                  title="Edit role and custom permissions"
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                  Edit Role
                                </button>
                              )}

                              {/* Reset Password */}
                              {canManageTeam && !isMemberOwner && (
                                <button
                                  onClick={() => openResetPassword(member)}
                                  title="Reset password for this employee"
                                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Activate / Deactivate Toggle */}
                              {canManageTeam && !isMemberOwner && (
                                <button
                                  onClick={() => handleToggleStatus(member)}
                                  title={member.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
                                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    member.status === 'ACTIVE'
                                      ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                  }`}
                                >
                                  {member.status === 'ACTIVE' ? (
                                    <UserX className="w-3.5 h-3.5" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}

                              {/* Remove Member */}
                              {canRemove && !isMemberOwner && !isCurrentUser && (
                                <button
                                  onClick={() => handleRemoveMember(member)}
                                  title="Remove member from organization"
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {membersTotal > memberPageSize && (
              <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/30 dark:bg-slate-800/20">
                <Pagination
                  currentPage={memberPage}
                  totalPages={Math.ceil(membersTotal / memberPageSize)}
                  totalCount={membersTotal}
                  pageSize={memberPageSize}
                  onPageChange={setMemberPage}
                  onPageSizeChange={setMemberPageSize}
                  itemName="members"
                  align="between"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: Roles & Permissions Matrix */}
      {activeTab === 'roles' && (
        <div className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Roles & Granular Permissions Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Inspect capability assignments across system predefined roles and manage custom roles.
              </p>
            </div>
            {canManageTeam && (
              <button
                onClick={() => setCreateRoleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition shadow-sm cursor-pointer shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Custom Role</span>
              </button>
            )}
          </div>

          {/* Roles Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between min-w-0"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm break-words min-w-0">
                        {role.name}
                      </h3>
                    </div>
                    {role.is_predefined ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                        Predefined
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 break-words">
                    {role.description || 'Predefined system role.'}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 min-w-0">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-500 shrink-0">Capabilities:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400 truncate">
                      {role.permissions?.length || 0} granted
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {(role.permissions || []).slice(0, 6).map((perm) => (
                      <span
                        key={perm}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 break-all"
                      >
                        {perm}
                      </span>
                    ))}
                    {(role.permissions || []).length > 6 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                        +{(role.permissions || []).length - 6} more
                      </span>
                    )}
                  </div>

                  {!role.is_predefined && canManageTeam && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Role</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Granular Permissions Matrix Table */}
          <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm min-w-0">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Detailed Permissions Matrix by Category
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare granular capability authorizations across all organizational roles.
              </p>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[640px] text-left border-collapse table-auto text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-300">
                    <th className="py-3 px-4 min-w-[240px]">Permission Capability</th>
                    {roles.map((r) => (
                      <th key={r.id} className="py-3 px-3 text-center min-w-[110px]">
                        <span className="block font-bold">{r.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 block font-normal">
                          {r.slug}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(permissionsByCategory).map(([cat, perms]) => (
                    <React.Fragment key={cat}>
                      <tr className="bg-slate-100/70 dark:bg-slate-800/70">
                        <td
                          colSpan={roles.length + 1}
                          className="py-2 px-4 font-bold uppercase text-[11px] tracking-wider text-slate-700 dark:text-slate-300"
                        >
                          {cat}
                        </td>
                      </tr>
                      {perms.map((p) => (
                        <tr key={p.code} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                          <td className="py-2.5 px-4">
                            <span className="font-medium text-slate-900 dark:text-white block">
                              {p.description}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {p.code}
                            </span>
                          </td>
                          {roles.map((r) => {
                            const has = (r.permissions || []).includes(p.code);
                            return (
                              <td key={r.id} className="py-2.5 px-3 text-center">
                                {has ? (
                                  <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 items-center justify-center mx-auto">
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span className="inline-block w-2 h-0.5 bg-slate-300 dark:bg-slate-700 mx-auto" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: Activity Log */}
      {activeTab === 'activity' && canViewActivity && (
        <div className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Team Audit & Activity Trail
              </h2>
              <p className="text-xs text-slate-500">
                Immutable security logs tracking all team operations, member additions, password resets, and permission changes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={activityActionFilter}
                onChange={(e) => {
                  setActivityActionFilter(e.target.value);
                  setActivityPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="">All Operations</option>
                <option value="MEMBER_CREATED">Member Created</option>
                <option value="MEMBER_ROLE_CHANGED">Role Changed</option>
                <option value="MEMBER_PASSWORD_RESET">Password Reset</option>
                <option value="MEMBER_ACTIVATED">Member Activated</option>
                <option value="MEMBER_SUSPENDED">Member Suspended</option>
                <option value="MEMBER_REMOVED">Member Removed</option>
                <option value="ROLE_CREATED">Role Created</option>
              </select>

              <button
                onClick={loadActivities}
                title="Refresh audit log"
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metric Overview Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Audit Records</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {activityMetrics.total}
              </div>
              <p className="text-xs text-slate-500">Total logged operational actions</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Team Lifecycle Events</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                {activityMetrics.memberActions}
              </div>
              <p className="text-xs text-slate-500">Staff creation, permission & role changes</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active Operators</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {activityMetrics.uniqueActors}
              </div>
              <p className="text-xs text-slate-500">Unique administrators initiating operations</p>
            </div>
          </div>

          {/* Unified Activity Card */}
          <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Security Audit Log Stream
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {activities.length} records shown
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 w-full">
              {activityLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-sky-600" />
                </div>
              ) : activities.length === 0 ? (
                <div className="p-16 text-center text-slate-400 text-xs">
                  No activity records recorded yet.
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition min-w-0">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white break-words">
                          {act.actor_username || 'System'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800 shrink-0">
                          {act.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 break-words">
                        {act.target_repr || `${act.target_type} #${act.target_id}`}
                      </p>
                    </div>
                    <div className="text-[11px] text-slate-400 shrink-0 text-left sm:text-right">
                      {new Date(act.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Add Team Member (Direct Account Creation) */}
      {addMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92dvh] overflow-y-auto min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-base min-w-0">
                {createdOtpData ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <UserPlus className="w-5 h-5 shrink-0" />}
                <span className="truncate">{createdOtpData ? 'Member Account Created' : 'Add Team Member'}</span>
              </div>
              <button
                onClick={() => {
                  setAddMemberModalOpen(false);
                  setCreatedOtpData(null);
                  setAddMemberName('');
                  setAddMemberEmail('');
                  setAddMemberRoleId('');
                  setAddMemberCustomPerms([]);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdOtpData ? (
              <div className="space-y-4 py-2 min-w-0">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-100 break-words">
                    Team member account for {createdOtpData.fullName} has been created!
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300 break-words">
                    A temporary one-time password (OTP) has been generated below. Provide these login details to the member.
                  </p>
                </div>

                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs min-w-0">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-semibold">Employee Email:</span>
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white select-all break-all">{createdOtpData.email}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px] font-semibold mb-1">One-Time Password (OTP):</span>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 min-w-0">
                      <span className="font-mono text-base font-extrabold tracking-wider text-sky-600 dark:text-sky-400 select-all break-all">
                        {createdOtpData.otp}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const credentialsText = `Jagir AI Team Credentials\nEmail: ${createdOtpData.email}\nTemporary Password: ${createdOtpData.otp}\nLogin URL: ${window.location.origin}/login`;
                          navigator.clipboard.writeText(credentialsText);
                          setCopiedOtp(true);
                          setTimeout(() => setCopiedOtp(false), 3000);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer transition shadow-xs shrink-0"
                      >
                        {copiedOtp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedOtp ? 'Copied Details!' : 'Copy Credentials'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Mandatory Password Update on First Sign-in:</span>
                    <span className="break-words">The member will use this OTP to sign in initially, and they will be strictly required to configure their personal password before performing any recruitment tasks.</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAddMemberModalOpen(false);
                      setCreatedOtpData(null);
                      setAddMemberName('');
                      setAddMemberEmail('');
                      setAddMemberRoleId('');
                      setAddMemberCustomPerms([]);
                    }}
                    className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm cursor-pointer shadow-sm transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 break-words">
                  Directly create a team member account. A temporary one-time password (OTP) will be automatically generated for them to sign in.
                </p>

                <form onSubmit={handleAddMember} className="space-y-4 text-xs">
                  {/* Full Name */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Employee Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aayush Shrestha"
                      value={addMemberName}
                      onChange={(e) => setAddMemberName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition min-w-0"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Work Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. employee@company.com"
                      value={addMemberEmail}
                      onChange={(e) => setAddMemberEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition min-w-0"
                    />
                  </div>

                  {/* Select Role */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Select Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={addMemberRoleId}
                      onChange={(e) => setAddMemberRoleId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition cursor-pointer min-w-0"
                    >
                      <option value="">Choose an organization role...</option>
                      {roles.filter((r) => r.slug !== 'owner').map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.permissions.length} capabilities)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional Custom Permissions Accordion */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowCustomPermsAccordion(!showCustomPermsAccordion)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold cursor-pointer gap-2"
                    >
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <Sliders className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="truncate">Configure Custom Permissions (Optional)</span>
                        {addMemberCustomPerms.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold shrink-0">
                            {addMemberCustomPerms.length} extra
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${showCustomPermsAccordion ? 'rotate-180' : ''}`} />
                    </button>

                    {showCustomPermsAccordion && (
                      <div className="p-3 space-y-3 max-h-52 overflow-y-auto bg-white dark:bg-slate-900">
                        {Object.entries(permissionsByCategory).map(([cat, perms]) => (
                          <div key={cat} className="space-y-1">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{cat}</div>
                            <div className="grid grid-cols-1 gap-1">
                              {perms.map((p) => {
                                const isChecked = addMemberCustomPerms.includes(p.code);
                                return (
                                  <label
                                    key={p.code}
                                    className="flex items-start gap-2 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer min-w-0"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setAddMemberCustomPerms(addMemberCustomPerms.filter((c) => c !== p.code));
                                        } else {
                                          setAddMemberCustomPerms([...addMemberCustomPerms, p.code]);
                                        }
                                      }}
                                      className="rounded text-sky-600 cursor-pointer mt-0.5 shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <span className="font-medium text-slate-800 dark:text-slate-200 break-words block">{p.description}</span>
                                      <span className="text-[9px] text-slate-400 block font-mono break-all">{p.code}</span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form Buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddMemberModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingMember}
                      className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {addingMember ? 'Creating Account & OTP...' : 'Create Team Member'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* 6. MODAL: Reset Member Password */}
      {resetPasswordModalOpen && resetPasswordMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92dvh] overflow-y-auto min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-base min-w-0">
                <Key className="w-5 h-5 shrink-0" />
                <span className="truncate">Reset Employee Password</span>
              </div>
              <button
                onClick={() => setResetPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 break-words">
              Set a new secure password for <span className="font-semibold text-slate-900 dark:text-white break-all">{resetPasswordMember.user.email}</span>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1 shrink-0"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Re-enter new password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition min-w-0"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {resettingPassword ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: Edit Member Role & Permissions */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92dvh] overflow-y-auto min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  Manage Member Permissions
                </h3>
                <p className="text-xs text-slate-500 break-all">
                  {editingMember.user.username} ({editingMember.user.email})
                </p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMemberEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Assigned Organization Role
                </label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition cursor-pointer min-w-0"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Membership Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('ACTIVE')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold cursor-pointer ${
                      editStatus === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus('SUSPENDED')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold cursor-pointer ${
                      editStatus === 'SUSPENDED'
                        ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Suspended
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                  Custom Capabilities ({editCustomPerms.length} selected)
                </label>
                <div className="space-y-3 max-h-52 overflow-y-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-w-0">
                  {Object.entries(permissionsByCategory).map(([cat, perms]) => (
                    <div key={cat} className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{cat}</div>
                      <div className="grid grid-cols-1 gap-1">
                        {perms.map((p) => {
                          const isChecked = editCustomPerms.includes(p.code);
                          return (
                            <label
                              key={p.code}
                              className="flex items-start gap-2 p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer min-w-0"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setEditCustomPerms(editCustomPerms.filter((c) => c !== p.code));
                                  } else {
                                    setEditCustomPerms([...editCustomPerms, p.code]);
                                  }
                                }}
                                className="rounded text-sky-600 cursor-pointer mt-0.5 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-slate-800 dark:text-slate-200 break-words block">{p.description}</span>
                                <span className="text-[9px] text-slate-400 block font-mono break-all">{p.code}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingMember}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {updatingMember ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: Create Custom Role */}
      {createRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92dvh] overflow-y-auto min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                Create Custom Organization Role
              </h3>
              <button
                onClick={() => setCreateRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Role Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Technical Interviewer"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition min-w-0"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Outline responsibilities granted by this role..."
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition min-w-0"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                  Select Capabilities ({rolePermissions.length} selected)
                </label>
                <div className="space-y-3 max-h-56 overflow-y-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-w-0">
                  {Object.entries(permissionsByCategory).map(([cat, perms]) => (
                    <div key={cat} className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase">
                        {cat}
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {perms.map((p) => {
                          const isChecked = rolePermissions.includes(p.code);
                          return (
                            <label
                              key={p.code}
                              className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer min-w-0"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setRolePermissions(rolePermissions.filter((c) => c !== p.code));
                                  } else {
                                    setRolePermissions([...rolePermissions, p.code]);
                                  }
                                }}
                                className="rounded text-sky-600 cursor-pointer mt-0.5 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-slate-800 dark:text-slate-200 break-words block">{p.description}</span>
                                <span className="text-[10px] text-slate-400 block font-mono break-all">{p.code}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {creatingRole ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92dvh] overflow-y-auto min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white text-base break-words">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed break-words">
              {confirmDialog.message}
            </p>
            <div className="pt-3 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition cursor-pointer ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-sky-600 hover:bg-sky-500'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
