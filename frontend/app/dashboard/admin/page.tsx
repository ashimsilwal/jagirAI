'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, AdminUser, AdminStats } from '@/lib/api';
import {
  ShieldCheck,
  Users,
  UserCheck,
  Building,
  Briefcase,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  X,
  Phone,
  MapPin,
  Globe,
  Download,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'JOB_SEEKER' | 'JOB_RECRUITER' | 'ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit form state
  const [editRole, setEditRole] = useState<'JOB_SEEKER' | 'JOB_RECRUITER'>('JOB_SEEKER');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsStaff, setEditIsStaff] = useState(false);

  const isAdmin = user && (user.is_staff || user.is_superuser);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        apiFetch<AdminStats>('/admin/stats/'),
        apiFetch<AdminUser[]>('/admin/users/')
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setFeedbackMsg({
        type: 'error',
        text: err?.data?.detail || 'Failed to load administrator dashboard data.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (isAdmin) {
        fetchAdminData();
      }
    }
  }, [user, authLoading, isAdmin]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  // Quick toggle user status
  const handleToggleActive = async (targetUser: AdminUser) => {
    try {
      setActionLoading(true);
      const updated = await apiFetch<AdminUser>(`/admin/users/${targetUser.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !targetUser.is_active })
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: updated.is_active } : u))
      );
      showNotification(
        'success',
        `User ${targetUser.username} has been ${updated.is_active ? 'activated' : 'deactivated'}.`
      );
      // Refresh stats
      apiFetch<AdminStats>('/admin/stats/').then(setStats).catch(() => {});
    } catch (err: any) {
      showNotification('error', err?.data?.detail || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit modal
  const handleOpenEdit = (targetUser: AdminUser) => {
    setEditingUser(targetUser);
    setEditRole(targetUser.role);
    setEditIsActive(targetUser.is_active ?? true);
    setEditIsStaff(targetUser.is_staff ?? false);
  };

  // Save edit form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setActionLoading(true);
      const updated = await apiFetch<AdminUser>(`/admin/users/${editingUser.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: editRole,
          is_active: editIsActive,
          is_staff: editIsStaff
        })
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...updated } : u))
      );
      setEditingUser(null);
      showNotification('success', `User ${editingUser.username} updated successfully.`);
      apiFetch<AdminStats>('/admin/stats/').then(setStats).catch(() => {});
    } catch (err: any) {
      showNotification('error', err?.data?.detail || 'Failed to save user changes.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    try {
      setActionLoading(true);
      await apiFetch(`/admin/users/${deleteConfirmUser.id}/`, {
        method: 'DELETE'
      });

      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
      showNotification('success', `User ${deleteConfirmUser.username} deleted successfully.`);
      setDeleteConfirmUser(null);
      apiFetch<AdminStats>('/admin/stats/').then(setStats).catch(() => {});
    } catch (err: any) {
      showNotification('error', err?.data?.detail || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      const matchesSearch =
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      // Role filter
      let matchesRole = true;
      if (roleFilter === 'JOB_SEEKER') matchesRole = u.role === 'JOB_SEEKER';
      else if (roleFilter === 'JOB_RECRUITER') matchesRole = u.role === 'JOB_RECRUITER';
      else if (roleFilter === 'ADMIN') matchesRole = !!(u.is_staff || u.is_superuser);

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') matchesStatus = u.is_active === true;
      else if (statusFilter === 'INACTIVE') matchesStatus = u.is_active === false;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Unauthorized view
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Admin Privileges Required</h2>
        <p className="text-sm text-slate-600">
          You do not have administrative permissions to view or manage users on Jagir AI.
        </p>
        <div className="pt-2">
          <Link
            href={user?.role === 'JOB_RECRUITER' ? '/dashboard/recruiter' : '/dashboard/seeker'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm shadow-sky-100"
          >
            <span>Back to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 border border-sky-100/80 rounded-2xl p-6 sm:p-8 text-slate-900 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            User Management & System Overview
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Manage all platform users, control roles and statuses, and monitor system growth.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-sky-800 bg-white hover:bg-sky-50 border border-sky-200 transition shadow-xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats ? stats.total_users : '—'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats ? `${stats.active_users} active / ${stats.inactive_users} inactive` : ''}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Job Seekers</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats ? stats.job_seekers : '—'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Registered candidates</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Recruiters</span>
            <Building className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats ? stats.recruiters : '—'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Employer accounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Jobs</span>
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats ? stats.active_jobs : '—'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats ? `Out of ${stats.total_jobs} total posted` : ''}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Applications</span>
            <FileText className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats ? stats.total_applications : '—'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Candidate submissions</p>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  roleFilter === 'ALL'
                    ? 'bg-white text-sky-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRoleFilter('JOB_SEEKER')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  roleFilter === 'JOB_SEEKER'
                    ? 'bg-white text-sky-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Candidates
              </button>
              <button
                onClick={() => setRoleFilter('JOB_RECRUITER')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  roleFilter === 'JOB_RECRUITER'
                    ? 'bg-white text-sky-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Recruiters
              </button>
              <button
                onClick={() => setRoleFilter('ADMIN')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  roleFilter === 'ADMIN'
                    ? 'bg-white text-sky-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Staff
              </button>
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Suspended Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading user registry...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No users found</p>
              <p className="text-xs text-slate-400">
                No user records match your search or filter criteria.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Entity Stats</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isSelf = user?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-sky-50/30 transition-colors">
                      {/* User Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{u.username}</span>
                              {isSelf && (
                                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                  You
                                </span>
                              )}
                              {(u.is_staff || u.is_superuser) && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 block text-[11px]">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            u.role === 'JOB_RECRUITER'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {u.role === 'JOB_RECRUITER' ? (
                            <>
                              <Building className="w-3 h-3" />
                              Recruiter
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" />
                              Job Seeker
                            </>
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={actionLoading || isSelf}
                          title={isSelf ? 'Cannot toggle self' : 'Click to toggle status'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          } ${isSelf ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {u.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Suspended
                            </>
                          )}
                        </button>
                      </td>

                      {/* Entity Stats */}
                      <td className="py-4 px-4 text-slate-600 text-[11px]">
                        {u.role === 'JOB_RECRUITER' ? (
                          <span>
                            <strong>{u.jobs_count ?? 0}</strong> jobs posted
                          </span>
                        ) : (
                          <span>
                            <strong>{u.applications_count ?? 0}</strong> applications
                          </span>
                        )}
                        {u.profile_summary?.location && (
                          <span className="block text-slate-400 truncate max-w-[140px]">
                            {u.profile_summary.location}
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        {new Date(u.date_joined).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setSelectedUser(u)}
                            title="View Profile Details"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit role/status */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User Role & Permissions"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete user */}
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            disabled={isSelf}
                            title={isSelf ? 'Cannot delete self' : 'Delete User'}
                            className={`p-1.5 transition rounded-lg ${
                              isSelf
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer Info */}
        <div className="py-3 px-5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredUsers.length} of {users.length} users</span>
          <span className="text-[11px]">Admin Control Panel • Jagir AI</span>
        </div>
      </div>

      {/* MODAL 1: User Details View */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-500 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-sky-100">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {selectedUser.username}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full font-semibold">
                {selectedUser.role.replace('_', ' ')}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full font-semibold ${
                  selectedUser.is_active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {selectedUser.is_active ? 'Active Account' : 'Suspended Account'}
              </span>
              {(selectedUser.is_staff || selectedUser.is_superuser) && (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-semibold">
                  Staff / Admin
                </span>
              )}
            </div>

            {/* Profile Summary info */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-xs text-slate-700">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500">
                Profile Information
              </h4>

              {selectedUser.profile_summary?.company_name && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong>Company:</strong> {selectedUser.profile_summary.company_name}
                  </span>
                </div>
              )}

              {selectedUser.profile_summary?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong>Phone:</strong> {selectedUser.profile_summary.phone}
                  </span>
                </div>
              )}

              {selectedUser.profile_summary?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong>Location:</strong> {selectedUser.profile_summary.location}
                  </span>
                </div>
              )}

              {selectedUser.profile_summary?.company_website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <a
                    href={selectedUser.profile_summary.company_website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:underline"
                  >
                    {selectedUser.profile_summary.company_website}
                  </a>
                </div>
              )}

              {selectedUser.profile_summary?.skills && (
                <div>
                  <strong className="block mb-1">Skills:</strong>
                  <div className="flex flex-wrap gap-1">
                    {selectedUser.profile_summary.skills
                      .split(',')
                      .map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-600"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {selectedUser.profile_summary?.bio && (
                <div>
                  <strong className="block mb-0.5">Bio:</strong>
                  <p className="text-slate-600">{selectedUser.profile_summary.bio}</p>
                </div>
              )}

              {selectedUser.profile_summary?.resume && (
                <div className="pt-2">
                  <a
                    href={selectedUser.profile_summary.resume}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-sky-300 rounded-lg text-xs font-semibold text-sky-700 hover:text-sky-800 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Resume
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-400 flex justify-between">
                <span>User ID: #{selectedUser.id}</span>
                <span>
                  Registered on: {new Date(selectedUser.date_joined).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit User Role & Status */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Edit User: {editingUser.username}
                </h3>
                <p className="text-xs text-slate-500">{editingUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Role selector */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Account Role
                </label>
                <select
                  value={editRole}
                  onChange={(e: any) => setEditRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="JOB_SEEKER">Job Seeker (Candidate)</option>
                  <option value="JOB_RECRUITER">Job Recruiter (Employer)</option>
                </select>
              </div>

              {/* Active status */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-900 block">Account Active</span>
                  <span className="text-[11px] text-slate-500">
                    Inactive users cannot sign in.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                />
              </div>

              {/* Staff / Admin status */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-900 block">Staff / Administrator</span>
                  <span className="text-[11px] text-slate-500">
                    Grants access to this Admin Control Panel.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editIsStaff}
                  onChange={(e) => setEditIsStaff(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition shadow-sm shadow-sky-100 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in duration-150 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Delete User Account?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>{deleteConfirmUser.username}</strong> ({deleteConfirmUser.email})?
                This action is permanent and removes all associated profiles, jobs, and applications.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition shadow-sm shadow-rose-100 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
