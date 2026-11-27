'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch, ContactMessage, ContactStats } from '@/lib/api';
import {
  Mail,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  Filter,
  Check,
  ChevronRight,
  ShieldCheck,
  Building,
  User,
  AlertTriangle,
  Inbox,
  ArrowUpDown,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function AdminContactsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<ContactStats>({
    total: 0,
    unread: 0,
    read: 0,
    resolved: 0,
    archived: 0
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'RESOLVED' | 'ARCHIVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'GENERAL' | 'CANDIDATE' | 'EMPLOYER' | 'BUG' | 'PARTNERSHIP'>('ALL');

  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Auth protection
  useEffect(() => {
    if (!authLoading && (!user || (!user.is_staff && !user.is_superuser))) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [messagesData, statsData] = await Promise.all([
        apiFetch<any>('/contact/messages/'),
        apiFetch<ContactStats>('/contact/stats/')
      ]);

      const list: ContactMessage[] = Array.isArray(messagesData)
        ? messagesData
        : messagesData?.results || [];
      setMessages(list);

      if (statsData) {
        setStats(statsData);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch contact inquiries', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.is_staff || user.is_superuser)) {
      fetchData();
    }
  }, [user]);

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (statusFilter !== 'ALL' && msg.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'ALL' && msg.category !== categoryFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = msg.name.toLowerCase().includes(q);
        const matchesEmail = msg.email.toLowerCase().includes(q);
        const matchesSubject = msg.subject.toLowerCase().includes(q);
        const matchesMsg = msg.message.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesSubject || matchesMsg;
      }
      return true;
    });
  }, [messages, statusFilter, categoryFilter, search]);

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await apiFetch('/contact/mark-all-read/', { method: 'POST' });
      toast.success('All unread messages marked as read', 'Updated');
      setMessages((prev) =>
        prev.map((m) => (m.status === 'UNREAD' ? { ...m, status: 'READ' } : m))
      );
      setStats((prev) => ({ ...prev, unread: 0, read: prev.read + prev.unread }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('contact-updated'));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update messages', 'Error');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleQuickResolve = async (msg: ContactMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextStatus = msg.status === 'RESOLVED' ? 'READ' : 'RESOLVED';
      await apiFetch(`/contact/messages/${msg.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: nextStatus } : m))
      );
      toast.success(
        nextStatus === 'RESOLVED' ? 'Marked inquiry as resolved' : 'Reopened inquiry',
        'Status Updated'
      );
      fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('contact-updated'));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status', 'Error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await apiFetch(`/contact/messages/${deleteTarget.id}/`, { method: 'DELETE' });
      toast.success('Contact inquiry deleted successfully', 'Deleted');
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
      fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('contact-updated'));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete inquiry', 'Error');
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'EMPLOYER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Building className="w-3.5 h-3.5" /> Employer
          </span>
        );
      case 'CANDIDATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <User className="w-3.5 h-3.5" /> Candidate
          </span>
        );
      case 'BUG':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3.5 h-3.5" /> Bug / Issue
          </span>
        );
      case 'PARTNERSHIP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldCheck className="w-3.5 h-3.5" /> Partnership
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750">
            <Mail className="w-3.5 h-3.5" /> General
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Unread
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Read
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 min-w-0">
      {/* 1. HEADER SECTION */}
      <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 dark:from-black dark:via-black dark:to-black border border-sky-100/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          {/* <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
              <Mail className="w-3.5 h-3.5" />
              Inquiry Management
            </span>
          </div> */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
            Contact Inquiries & Messages
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Review incoming public messages, candidate support requests, employer partnership inquiries, and feedback submitted through the contact page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/contact"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>View Public Contact Page</span>
          </Link>

          {stats.unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Mark All as Read</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-500' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. AGGREGATE STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Messages
          </p>
          <p className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            {stats.total}
          </p>
          <p className="text-[11px] text-slate-400">All submissions received</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-200 dark:border-sky-900/60 p-5 sm:p-6 shadow-sm space-y-2 bg-gradient-to-br from-sky-50/50 to-transparent dark:from-sky-950/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            Unread Inquiries
          </p>
          <p className="text-2xl sm:text-4xl font-extrabold text-sky-600 dark:text-sky-400">
            {stats.unread}
          </p>
          <p className="text-[11px] text-sky-600/80 dark:text-sky-400/80">Pending admin attention</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            In Review / Read
          </p>
          <p className="text-2xl sm:text-4xl font-extrabold text-slate-700 dark:text-slate-200">
            {stats.read}
          </p>
          <p className="text-[11px] text-slate-400">Viewed by team</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 p-5 sm:p-6 shadow-sm space-y-2 bg-gradient-to-br from-emerald-50/40 to-transparent dark:from-emerald-950/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Resolved
          </p>
          <p className="text-2xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {stats.resolved}
          </p>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">Answered & resolved</p>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-6">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by sender name, email, subject, or message content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="ALL">All Statuses ({messages.length})</option>
              <option value="UNREAD">Unread ({stats.unread})</option>
              <option value="READ">Read ({stats.read})</option>
              <option value="RESOLVED">Resolved ({stats.resolved})</option>
              <option value="ARCHIVED">Archived ({stats.archived})</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e: any) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General Inquiries</option>
              <option value="CANDIDATE">Candidate Help</option>
              <option value="EMPLOYER">Employer Inquiries</option>
              <option value="BUG">Report an Issue</option>
              <option value="PARTNERSHIP">Partnership</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. MESSAGES LIST CONTAINER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500">Loading contact messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="py-24 text-center space-y-4 px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No inquiries found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              {search || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? 'Try adjusting your search query or selecting a different filter option.'
                : 'There are currently no contact messages submitted from the public site.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => router.push(`/dashboard/admin/contacts/${msg.id}`)}
                className={`p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer ${
                  msg.status === 'UNREAD'
                    ? 'bg-sky-50/40 dark:bg-sky-950/20 border-l-4 border-l-sky-500'
                    : ''
                }`}
              >
                {/* Left Section: Sender Details & Content */}
                <div className="space-y-3 flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {msg.name}
                    </span>
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(msg.email)}&su=${encodeURIComponent(`Re: ${msg.subject} [Jagir AI Support]`)}&body=${encodeURIComponent(`Hi ${msg.name},\n\nThank you for contacting Jagir AI regarding:\n"${msg.subject}"\n\n`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={`Open Gmail compose to ${msg.email}`}
                      className="text-xs text-slate-500 dark:text-slate-400 font-mono hover:text-sky-600 dark:hover:text-sky-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>&lt;{msg.email}&gt;</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                    {getCategoryBadge(msg.category)}
                    {getStatusBadge(msg.status)}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1 leading-snug">
                    {msg.subject}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {msg.message}
                  </p>
                </div>

                {/* Right Section: Timestamps & Action Buttons */}
                <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left md:text-right space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center md:justify-end gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(msg.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(msg.created_at).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleQuickResolve(msg, e)}
                      title={msg.status === 'RESOLVED' ? 'Reopen inquiry' : 'Mark as Resolved'}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                        msg.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:text-emerald-600 hover:border-emerald-300 shadow-2xs'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {msg.status === 'RESOLVED' ? 'Resolved' : 'Resolve'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(msg)}
                      title="Delete inquiry"
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-slate-700 hover:border-rose-300 transition cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(msg.email)}&su=${encodeURIComponent(`Re: ${msg.subject} [Jagir AI Support]`)}&body=${encodeURIComponent(`Hi ${msg.name},\n\nThank you for contacting Jagir AI regarding:\n"${msg.subject}"\n\n`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Reply to ${msg.name} via Gmail`}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/60 transition cursor-pointer shadow-2xs flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="hidden sm:inline">Gmail</span>
                    </a>

                    <Link
                      href={`/dashboard/admin/contacts/${msg.id}`}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-semibold text-xs transition shadow-2xs"
                      title="View full details"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer info bar */}
        {filteredMessages.length > 0 && (
          <div className="py-4 px-6 sm:px-8 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Showing {filteredMessages.length} of {messages.length} total messages</span>
            <span>Refreshes automatically</span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Contact Inquiry?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete the message from{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {deleteTarget.name}
                </span>{' '}
                (&quot;{deleteTarget.subject}&quot;)? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
