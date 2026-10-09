'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, AdminUser, AdminStats, SupportTicket } from '@/lib/api';
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
  ArrowRight,
  LifeBuoy,
  MessageSquare,
  Send,
  Clock
} from 'lucide-react';
import { DonutChart, BarChart } from '@/components/charts';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTab, setActiveTab] = useState<'USERS' | 'TICKETS'>('USERS');
  const [loading, setLoading] = useState(true);

  // User filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'JOB_SEEKER' | 'JOB_RECRUITER' | 'ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Ticket filter & solve state
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketSolution, setTicketSolution] = useState('');
  const [ticketNewStatus, setTicketNewStatus] = useState<SupportTicket['status']>('RESOLVED');
  const [savingTicket, setSavingTicket] = useState(false);

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

  // Hash watcher for direct navigation to #tickets
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#tickets') {
      setActiveTab('TICKETS');
    }
  }, []);

  // User breakdown donut chart
  const userDonutSegments = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Job Seekers', value: stats.job_seekers, color: '#10b981' },
      { label: 'Recruiters', value: stats.recruiters, color: '#0284c7' },
      { label: 'Staff / Admins', value: stats.staff_users || 1, color: '#8b5cf6' },
      { label: 'Inactive / Suspended', value: stats.inactive_users, color: '#f43f5e' },
    ];
  }, [stats]);

  // Platform metrics comparison bars
  const platformBars = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Total Users', value: stats.total_users, color: '#0284c7', secondaryLabel: `${stats.active_users} active` },
      { label: 'Job Postings', value: stats.total_jobs, color: '#38bdf8', secondaryLabel: `${stats.active_jobs} open` },
      { label: 'Active Vacancies', value: stats.active_jobs, color: '#10b981', secondaryLabel: 'Publicly listed' },
      { label: 'Applications', value: stats.total_applications, color: '#8b5cf6', secondaryLabel: 'Submissions' },
    ];
  }, [stats]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, ticketsData] = await Promise.all([
        apiFetch<AdminStats>('/admin/stats/'),
        apiFetch<AdminUser[]>('/admin/users/'),
        apiFetch<SupportTicket[]>('/admin/tickets/').catch(() => [])
      ]);
      setStats(statsData);
      setUsers(usersData);
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
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

  // Open Solve Ticket Modal
  const handleOpenSolveModal = (t: SupportTicket) => {
    setSelectedTicket(t);
    setTicketSolution(t.admin_response || '');
    setTicketNewStatus(t.status === 'OPEN' ? 'IN_PROGRESS' : t.status);
  };

  // Save Ticket Solution & Status Update
  const handleSaveTicketSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setSavingTicket(true);
      const updated = await apiFetch<SupportTicket>(`/admin/tickets/${selectedTicket.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: ticketNewStatus,
          admin_response: ticketSolution.trim(),
        }),
      });

      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
      setSelectedTicket(null);
      showNotification('success', `Ticket #${selectedTicket.id} updated successfully.`);
    } catch (err: any) {
      showNotification('error', err?.data?.detail || err?.message || 'Failed to update support ticket.');
    } finally {
      setSavingTicket(false);
    }
  };

  // Filtered support tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.message.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        (t.user_email && t.user_email.toLowerCase().includes(ticketSearch.toLowerCase())) ||
        (t.user_username && t.user_username.toLowerCase().includes(ticketSearch.toLowerCase()));

      let matchesStatus = true;
      if (ticketStatusFilter !== 'ALL') {
        matchesStatus = t.status === ticketStatusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [tickets, ticketSearch, ticketStatusFilter]);

  const openTicketsCount = useMemo(() => {
    return tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  }, [tickets]);

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
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Privileges Required</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You do not have administrative permissions to view or manage users on Jagir AI.
        </p>
        <div className="pt-2">
          <Link
            href={user?.role === 'JOB_RECRUITER' ? '/dashboard/recruiter' : '/dashboard/seeker'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm shadow-sky-100 dark:shadow-none"
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
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-sky-100/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
            User Management & System Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Manage all platform users, control roles and statuses, and monitor system growth.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-sky-800 dark:text-sky-300 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-sky-200 dark:border-slate-700 transition shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Section 1: Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution Donut */}
        <DonutChart
          title="Platform User Distribution"
          description="Breakdown of registered accounts across seekers, recruiters, and administrators"
          segments={userDonutSegments}
          centerLabel="Total Users"
          centerValue={stats ? stats.total_users : 0}
        />

        {/* Platform Volume Comparison */}
        <BarChart
          title="Platform Volume & Core Metrics"
          description="Comparison of platform scale across users, vacancies, and applications"
          data={platformBars}
          orientation="horizontal"
          emptyMessage="No platform data available"
        />
      </div>

      {/* Section 2: Key Performance Indicators Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1.5 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Users</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats ? stats.total_users : '—'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {stats ? `${stats.active_users} active / ${stats.inactive_users} inactive` : ''}
          </p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full"
              style={{ width: `${stats && stats.total_users > 0 ? (stats.active_users / stats.total_users) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1.5 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Job Seekers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats ? stats.job_seekers : '—'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Candidates</p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${stats && stats.total_users > 0 ? (stats.job_seekers / stats.total_users) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1.5 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Recruiters</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats ? stats.recruiters : '—'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Employers</p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full"
              style={{ width: `${stats && stats.total_users > 0 ? (stats.recruiters / stats.total_users) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1.5 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Active Jobs</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats ? stats.active_jobs : '—'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {stats ? `${stats.total_jobs} total posted` : ''}
          </p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${stats && stats.total_jobs > 0 ? (stats.active_jobs / stats.total_jobs) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1 space-y-1.5 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats ? stats.total_applications : '—'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Candidate files</p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Management Section: User Registry vs Support Tickets */}
      <div id="users" className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* View Switcher Tabs Header */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-3 bg-slate-50/50 dark:bg-slate-900/50 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('USERS')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'USERS'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 dark:border-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
            <span className="px-2 py-0.2 rounded-md text-[10px] bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {users.length}
            </span>
          </button>

          <button
            id="tickets"
            type="button"
            onClick={() => setActiveTab('TICKETS')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'TICKETS'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 dark:border-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Support Tickets & Inquiries</span>
            {openTicketsCount > 0 ? (
              <span className="px-2 py-0.2 rounded-md text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold">
                {openTicketsCount} open
              </span>
            ) : (
              <span className="px-2 py-0.2 rounded-md text-[10px] bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {tickets.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'USERS' ? (
          <>
            {/* Table Filters & Search */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Role Filter Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
                  <button
                    onClick={() => setRoleFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      roleFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setRoleFilter('JOB_SEEKER')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      roleFilter === 'JOB_SEEKER'
                        ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Candidates
                  </button>
                  <button
                    onClick={() => setRoleFilter('JOB_RECRUITER')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      roleFilter === 'JOB_RECRUITER'
                        ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Recruiters
                  </button>
                  <button
                    onClick={() => setRoleFilter('ADMIN')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      roleFilter === 'ADMIN'
                        ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Staff
                  </button>
                </div>

                {/* Status Select */}
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 cursor-pointer"
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">Loading user registry...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No users found</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    No user records match your search or filter criteria.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3.5 px-5">User</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Entity Stats</th>
                      <th className="py-3.5 px-4">Joined</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((u) => {
                      const isSelf = user?.id === u.id;
                      return (
                        <tr key={u.id} className="hover:bg-sky-50/30 dark:hover:bg-slate-800/40 transition-colors">
                          {/* User Info */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 dark:text-white">{u.username}</span>
                                  {isSelf && (
                                    <span className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-sky-200 dark:border-sky-800">
                                      You
                                    </span>
                                  )}
                                  {(u.is_staff || u.is_superuser) && (
                                    <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5 border border-amber-200 dark:border-amber-800">
                                      <ShieldCheck className="w-2.5 h-2.5" />
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                                u.role === 'JOB_RECRUITER'
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
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
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border ${
                                u.is_active
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                              } ${isSelf ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {u.is_active ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  Suspended
                                </>
                              )}
                            </button>
                          </td>

                          {/* Entity Stats */}
                          <td className="py-4 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                            {u.role === 'JOB_RECRUITER' ? (
                              <span>
                                <strong className="text-slate-900 dark:text-white">{u.jobs_count ?? 0}</strong> jobs posted
                              </span>
                            ) : (
                              <span>
                                <strong className="text-slate-900 dark:text-white">{u.applications_count ?? 0}</strong> applications
                              </span>
                            )}
                            {u.profile_summary?.location && (
                              <span className="block text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                                {u.profile_summary.location}
                              </span>
                            )}
                          </td>

                          {/* Joined Date */}
                          <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                            {new Date(u.date_joined).toLocaleDateString()}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* View details */}
                              <button
                                onClick={() => setSelectedUser(u)}
                                title="View Profile Details"
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit role/status */}
                              <button
                                onClick={() => handleOpenEdit(u)}
                                title="Edit User Role & Permissions"
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
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
                                    ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer'
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
            <div className="py-3 px-5 bg-slate-50/60 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Showing {filteredUsers.length} of {users.length} users</span>
              <span className="text-[11px]">Admin Control Panel • Jagir AI</span>
            </div>
          </>
        ) : (
          <>
            {/* Support Tickets Filters & Search */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Ticket Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ticket subject, user email, or issue text..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition"
                />
                {ticketSearch && (
                  <button
                    onClick={() => setTicketSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setTicketStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    ticketStatusFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({tickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketStatusFilter('OPEN')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    ticketStatusFilter === 'OPEN'
                      ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => setTicketStatusFilter('IN_PROGRESS')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    ticketStatusFilter === 'IN_PROGRESS'
                      ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => setTicketStatusFilter('RESOLVED')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    ticketStatusFilter === 'RESOLVED'
                      ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Resolved
                </button>
                <button
                  type="button"
                  onClick={() => setTicketStatusFilter('CLOSED')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    ticketStatusFilter === 'CLOSED'
                      ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Closed
                </button>
              </div>
            </div>

            {/* Tickets Table / List */}
            <div className="overflow-x-auto">
              {filteredTickets.length === 0 ? (
                <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <LifeBuoy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No support tickets found</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    No tickets match the current filter or search criteria.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3.5 px-5">Ticket #</th>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Subject & Issue</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-sky-50/30 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-5 font-mono font-bold text-slate-500 dark:text-slate-400">
                          #TKT-{t.id}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{t.user_username || 'User'}</div>
                          <div className="text-[11px] text-slate-400">{t.user_email}</div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {t.user_role === 'JOB_RECRUITER' ? 'Recruiter' : 'Seeker'}
                          </span>
                        </td>
                        <td className="py-4 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{t.subject}</div>
                          <div className="text-slate-500 dark:text-slate-400 truncate text-[11px]">{t.message}</div>
                          {t.admin_response && (
                            <div className="text-emerald-600 dark:text-emerald-400 font-medium text-[10px] mt-0.5 truncate">
                              ✓ Solved: {t.admin_response}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            t.priority === 'URGENT'
                              ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                              : 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            t.status === 'RESOLVED'
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900'
                              : t.status === 'CLOSED'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                          }`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenSolveModal(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-xs cursor-pointer"
                          >
                            <span>Solve & Reply</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Footer Info */}
            <div className="py-3 px-5 bg-slate-50/60 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Showing {filteredTickets.length} of {tickets.length} tickets</span>
              <span className="text-[11px]">Platform Support Hub • Jagir AI</span>
            </div>
          </>
        )}
      </div>

      {/* MODAL 1: User Details View */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 dark:border-slate-800 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-500 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-sky-100 dark:shadow-none">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {selectedUser.username}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 rounded-md font-semibold border border-sky-100 dark:border-sky-900/60">
                {selectedUser.role.replace('_', ' ')}
              </span>
              <span
                className={`px-2.5 py-1 rounded-md font-semibold border ${
                  selectedUser.is_active
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/60'
                    : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/60'
                }`}
              >
                {selectedUser.is_active ? 'Active Account' : 'Suspended Account'}
              </span>
              {(selectedUser.is_staff || selectedUser.is_superuser) && (
                <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 rounded-md font-semibold border border-amber-100 dark:border-amber-900/60">
                  Staff / Admin
                </span>
              )}
            </div>

            {/* Profile Summary info */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">
                Profile Information
              </h4>

              {selectedUser.profile_summary?.company_name && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>
                    <strong>Company:</strong> {selectedUser.profile_summary.company_name}
                  </span>
                </div>
              )}

              {selectedUser.profile_summary?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>
                    <strong>Phone:</strong> {selectedUser.profile_summary.phone}
                  </span>
                </div>
              )}

              {selectedUser.profile_summary?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>
                    <strong>Location:</strong> {selectedUser.profile_summary.location}
                  </span>
                </div>
              )}

              {selectedUser.profile_summary?.company_website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <a
                    href={selectedUser.profile_summary.company_website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline"
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
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-600 dark:text-slate-300"
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
                  <p className="text-slate-600 dark:text-slate-300">{selectedUser.profile_summary.bio}</p>
                </div>
              )}

              {selectedUser.profile_summary?.resume && (
                <div className="pt-2">
                  <a
                    href={selectedUser.profile_summary.resume}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-500 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Resume
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-400 dark:text-slate-500 flex justify-between">
                <span>User ID: #{selectedUser.id}</span>
                <span>
                  Registered on: {new Date(selectedUser.date_joined).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit User Role & Status */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 dark:border-slate-800 space-y-5 animate-in fade-in duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit User: {editingUser.username}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{editingUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Role selector */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Role
                </label>
                <select
                  value={editRole}
                  onChange={(e: any) => setEditRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 cursor-pointer outline-none"
                >
                  <option value="JOB_SEEKER" className="dark:bg-slate-800 dark:text-white">Job Seeker (Candidate)</option>
                  <option value="JOB_RECRUITER" className="dark:bg-slate-800 dark:text-white">Job Recruiter (Employer)</option>
                </select>
              </div>

              {/* Active status */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">Account Active</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Inactive users cannot sign in.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 text-sky-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-sky-500 cursor-pointer"
                />
              </div>

              {/* Staff / Admin status */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">Staff / Administrator</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Grants access to this Admin Control Panel.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editIsStaff}
                  onChange={(e) => setEditIsStaff(e.target.checked)}
                  className="w-4 h-4 text-sky-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-sky-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition shadow-sm shadow-sky-100 dark:shadow-none cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-150 text-center">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete User Account?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{deleteConfirmUser.username}</strong> ({deleteConfirmUser.email})?
                This action is permanent and removes all associated profiles, jobs, and applications.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition shadow-sm shadow-rose-100 dark:shadow-none cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Solve Support Ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 dark:border-slate-800 space-y-5 animate-in fade-in duration-150 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded">
                    Ticket #{selectedTicket.id}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                    selectedTicket.user_role === 'JOB_RECRUITER'
                      ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                      : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {selectedTicket.user_role === 'JOB_RECRUITER' ? 'Recruiter' : 'Job Seeker'}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                  {selectedTicket.subject}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Submitted by <strong className="text-slate-700 dark:text-slate-300">{selectedTicket.user_email}</strong> on {new Date(selectedTicket.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original Ticket Content */}
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  <span className="font-medium">User Message / Problem Description:</span>
                  <span className="text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Category: {selectedTicket.category.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                  {selectedTicket.message}
                </p>
              </div>
            </div>

            {/* Admin Solution Form */}
            <form onSubmit={handleSaveTicketSolution} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Ticket Status
                  </label>
                  <select
                    value={ticketNewStatus}
                    onChange={(e: any) => setTicketNewStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 cursor-pointer outline-none"
                  >
                    <option value="OPEN">Open (Awaiting Review)</option>
                    <option value="IN_PROGRESS">In Progress (Investigating)</option>
                    <option value="RESOLVED">Resolved (Solved & Handled)</option>
                    <option value="CLOSED">Closed (Archived)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Ticket Priority
                  </label>
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                    {selectedTicket.priority}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Solution & Response
                </label>
                <textarea
                  rows={4}
                  value={ticketSolution}
                  onChange={(e) => setTicketSolution(e.target.value)}
                  placeholder="Explain the resolution or provide the steps taken to fix the user's issue..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  This solution will be visible immediately to the {selectedTicket.user_role === 'JOB_RECRUITER' ? 'recruiter' : 'job seeker'} on their Support Page.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTicket}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition shadow-sm shadow-sky-100 dark:shadow-none cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {savingTicket ? 'Saving...' : 'Save & Update Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
