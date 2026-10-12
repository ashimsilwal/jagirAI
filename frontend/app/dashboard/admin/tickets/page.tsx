'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, SupportTicket } from '@/lib/api';
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  MessageSquare,
  ArrowLeft,
  Send,
  User,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function AdminTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'JOB_SEEKER' | 'JOB_RECRUITER'>('ALL');

  // Solution modal state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketSolution, setTicketSolution] = useState('');
  const [ticketNewStatus, setTicketNewStatus] = useState<SupportTicket['status']>('RESOLVED');
  const [savingTicket, setSavingTicket] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/admin/tickets/');
      const list = Array.isArray(data) ? data : data.results || [];
      setTickets(list);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Lock background body & html scroll completely when ticket solve modal is open
  useEffect(() => {
    if (selectedTicket) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
      };
    }
  }, [selectedTicket]);

  // Compute metrics
  const totalCount = tickets.length;
  const openCount = useMemo(() => tickets.filter((t) => t.status === 'OPEN').length, [tickets]);
  const inProgressCount = useMemo(() => tickets.filter((t) => t.status === 'IN_PROGRESS').length, [tickets]);
  const urgentCount = useMemo(
    () => tickets.filter((t) => t.priority === 'URGENT' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length,
    [tickets]
  );
  const resolvedCount = useMemo(
    () => tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    [tickets]
  );

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Search
      const q = search.toLowerCase().trim();
      if (q) {
        const matchesSubject = t.subject?.toLowerCase().includes(q);
        const matchesMessage = t.message?.toLowerCase().includes(q);
        const matchesEmail = t.user_email?.toLowerCase().includes(q);
        const matchesUsername = t.user_username?.toLowerCase().includes(q);
        const matchesId = `#tkt-${t.id}`.includes(q) || `${t.id}` === q;
        if (!matchesSubject && !matchesMessage && !matchesEmail && !matchesUsername && !matchesId) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false;
      }

      // Priority
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) {
        return false;
      }

      // Role
      if (roleFilter !== 'ALL' && t.user_role !== roleFilter) {
        return false;
      }

      return true;
    });
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter, roleFilter]);

  const handleOpenSolveModal = (t: SupportTicket) => {
    setSelectedTicket(t);
    setTicketSolution(t.admin_response || '');
    setTicketNewStatus(t.status === 'OPEN' ? 'RESOLVED' : t.status);
    setFeedbackMsg(null);
  };

  const handleQuickStatusChange = async (ticket: SupportTicket, newStatus: SupportTicket['status']) => {
    try {
      const updated = await apiFetch<SupportTicket>(`/admin/tickets/${ticket.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      window.dispatchEvent(new Event('ticket-updated'));
      setFeedbackMsg({
        type: 'success',
        text: `Ticket #TKT-${ticket.id} status updated to ${newStatus.replace('_', ' ')}.`,
      });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Failed to update ticket status.',
      });
    }
  };

  const handleSaveTicketSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSavingTicket(true);
    setFeedbackMsg(null);

    try {
      const updated = await apiFetch<SupportTicket>(`/admin/tickets/${selectedTicket.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          admin_response: ticketSolution,
          status: ticketNewStatus,
        }),
      });

      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      window.dispatchEvent(new Event('ticket-updated'));
      setSelectedTicket(null);
      setFeedbackMsg({
        type: 'success',
        text: `Ticket #TKT-${updated.id} successfully answered and marked as ${updated.status.replace('_', ' ')}.`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Failed to update support ticket.',
      });
    } finally {
      setSavingTicket(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
    setRoleFilter('ALL');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-8 sm:space-y-10">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-sky-100/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-colors">
        <div className="space-y-2">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link
              href="/dashboard/admin"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Overview</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold">Support Tickets & Help Desk</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-sm shadow-sky-600/30">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <span>Support Tickets Hub</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Review user inquiries, troubleshoot platform issues, provide answers, and track ticket resolutions across Jagir AI.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchTickets}
            disabled={loading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/dashboard/admin"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm shadow-sky-600/20"
          >
            <span>System Overview</span>
          </Link>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* High-Visibility Notification Alert for Pending / Urgent Tickets */}
      {(openCount > 0 || urgentCount > 0) && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 shadow-sm animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800 shadow-sm mt-0.5 md:mt-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Action Required: {openCount} Unresolved {openCount === 1 ? 'Ticket' : 'Tickets'}
                  </h3>
                  {urgentCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500 text-white animate-pulse shadow-sm">
                      {urgentCount} URGENT PRIORITY
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                  Users are awaiting response on their support inquiries. Prompt replies ensure high platform trust and satisfaction.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('OPEN');
                  setPriorityFilter('ALL');
                }}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm cursor-pointer"
              >
                Show Open ({openCount})
              </button>
              {urgentCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPriorityFilter('URGENT');
                    setStatusFilter('ALL');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm cursor-pointer"
                >
                  Show Urgent ({urgentCount})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stat Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* Total Tickets */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md ${
            statusFilter === 'ALL'
              ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20 dark:bg-sky-950/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Total Tickets</span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalCount}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">All time inquiries</div>
        </div>

        {/* Open Tickets */}
        <div
          onClick={() => setStatusFilter('OPEN')}
          className={`p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md ${
            statusFilter === 'OPEN'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>Open (Pending)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {openCount}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Awaiting staff review</div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md ${
            statusFilter === 'IN_PROGRESS'
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20 dark:bg-purple-950/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
            <span>In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-purple-600 dark:text-purple-400">
            {inProgressCount}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Under investigation</div>
        </div>

        {/* Urgent Tickets */}
        <div
          onClick={() => setPriorityFilter('URGENT')}
          className={`p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md ${
            priorityFilter === 'URGENT'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
            <span>Urgent Attention</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {urgentCount}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">High severity issues</div>
        </div>

        {/* Resolved & Closed */}
        <div
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md ${
            statusFilter === 'RESOLVED'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>Resolved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {resolvedCount}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Handled successfully</div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filter Controls Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 space-y-6 bg-slate-50/40 dark:bg-slate-900/40">
          {/* Top Row: Search & Status Pills */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket #, subject, description, or user email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition shadow-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs sm:text-sm font-semibold gap-1 shrink-0">
              {[
                { label: 'All', value: 'ALL' },
                { label: `Open (${openCount})`, value: 'OPEN' },
                { label: `In Progress (${inProgressCount})`, value: 'IN_PROGRESS' },
                { label: `Resolved (${resolvedCount})`, value: 'RESOLVED' },
                { label: 'Closed', value: 'CLOSED' },
              ].map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setStatusFilter(pill.value)}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                    statusFilter === pill.value
                      ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Row: Secondary Dropdown Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
                <span>Filter By:</span>
              </div>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-2 focus:ring-sky-500 transition shadow-xs"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-2 focus:ring-sky-500 transition shadow-xs"
              >
                <option value="ALL">All Categories</option>
                <option value="TECHNICAL">Technical Issues</option>
                <option value="ACCOUNT">Account & Verification</option>
                <option value="BILLING">Billing & Payments</option>
                <option value="VACANCY">Job Vacancy</option>
                <option value="CANDIDATE">Candidate / Application</option>
                <option value="OTHER">Other Support</option>
              </select>

              {/* Submitter Role Filter */}
              <select
                value={roleFilter}
                onChange={(e: any) => setRoleFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-2 focus:ring-sky-500 transition shadow-xs"
              >
                <option value="ALL">All User Roles</option>
                <option value="JOB_SEEKER">Job Seekers</option>
                <option value="JOB_RECRUITER">Employers & Recruiters</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || roleFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 inline-flex items-center gap-1.5 cursor-pointer font-bold px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                <X className="w-4 h-4" />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-9 h-9 text-sky-600 animate-spin mx-auto" />
              <p className="text-sm text-slate-500 font-medium">Loading platform support tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-20 px-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                <LifeBuoy className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  No Support Tickets Found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  No tickets match the selected filters or search terms. Try adjusting your search query or reset filters.
                </p>
              </div>
              {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || roleFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6">Ticket #</th>
                  <th className="py-4 px-5">User</th>
                  <th className="py-4 px-5">Subject & Message</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Priority</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-sky-50/30 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Ticket ID */}
                    <td className="py-5 px-6 font-mono font-bold text-slate-700 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs">
                        #TKT-{t.id}
                      </span>
                    </td>

                    {/* Submitter */}
                    <td className="py-5 px-5 min-w-[170px]">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {t.user_username || 'User'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{t.user_email}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700">
                        {t.user_role === 'JOB_RECRUITER' ? 'Recruiter' : 'Job Seeker'}
                      </span>
                    </td>

                    {/* Subject & Message */}
                    <td className="py-5 px-5 max-w-sm">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {t.subject}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 line-clamp-2 text-xs mt-1 leading-relaxed">
                        {t.message}
                      </div>
                      {t.admin_response && (
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-1.5 line-clamp-1 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Staff Response: {t.admin_response}</span>
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                        {t.category.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          t.priority === 'URGENT'
                            ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                            : t.priority === 'HIGH'
                            ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                            : t.priority === 'MEDIUM'
                            ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900'
                            : t.status === 'CLOSED'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-5 px-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-5 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {t.status === 'OPEN' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(t, 'IN_PROGRESS')}
                            title="Mark as Investigating"
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 transition cursor-pointer"
                          >
                            Investigate
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenSolveModal(t)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-xs cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Solve & Reply</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Info */}
        <div className="py-4 px-6 bg-slate-50/60 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {filteredTickets.length} of {tickets.length} tickets</span>
          <span className="font-medium">Jagir AI • Support Center</span>
        </div>
      </div>

      {/* INSPECT & SOLVE TICKET MODAL */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overscroll-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTicket(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in duration-200 overscroll-contain"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-md">
                    #TKT-{selectedTicket.id}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                      selectedTicket.user_role === 'JOB_RECRUITER'
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                        : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {selectedTicket.user_role === 'JOB_RECRUITER' ? 'Recruiter' : 'Job Seeker'}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-1">
                  {selectedTicket.subject}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Submitted by <strong className="text-slate-800 dark:text-slate-200">{selectedTicket.user_email}</strong> on{' '}
                  {new Date(selectedTicket.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Admin Solution Form */}
            <form onSubmit={handleSaveTicketSolution} className="flex flex-col flex-1 min-h-0 overflow-hidden pt-4">
              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto pr-1.5 space-y-5 my-1 overscroll-contain">
                {/* Original Ticket Content */}
                <div className="space-y-2">
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-bold uppercase tracking-wider text-[11px]">User Inquiry Details:</span>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Category: {selectedTicket.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                      {selectedTicket.message}
                    </p>
                  </div>
                </div>

                {/* Status & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Ticket Status
                    </label>
                    <select
                      value={ticketNewStatus}
                      onChange={(e: any) => setTicketNewStatus(e.target.value)}
                      className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 cursor-pointer outline-none font-semibold transition"
                    >
                      <option value="OPEN">Open (Awaiting Staff)</option>
                      <option value="IN_PROGRESS">In Progress (Investigating)</option>
                      <option value="RESOLVED">Resolved (Solved & Handled)</option>
                      <option value="CLOSED">Closed (Archived)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Priority Level
                    </label>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                      <span>{selectedTicket.priority}</span>
                      <span className="text-[11px] text-slate-400 font-normal">Fixed priority</span>
                    </div>
                  </div>
                </div>

                {/* Staff Resolution Message */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Staff Resolution / Response Message
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Visible immediately to user
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={ticketSolution}
                    onChange={(e) => setTicketSolution(e.target.value)}
                    placeholder="Explain the solution, provide instructions, or clarify details for the user..."
                    className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none leading-relaxed transition"
                    required
                  />

                  {/* Quick Response Templates */}
                  <div className="flex flex-wrap gap-2 items-center pt-1">
                    <span className="text-[11px] text-slate-400 font-bold">Quick Templates:</span>
                    {[
                      'Issue resolved. Verified and updated.',
                      'Account unlocked and verified.',
                      'Thank you for reporting. The bug has been resolved.',
                    ].map((tpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTicketSolution(tpl)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer"
                      >
                        {tpl.slice(0, 32)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTicket || !ticketSolution.trim()}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow-sm shadow-sky-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{savingTicket ? 'Saving...' : 'Send Response & Update'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
