'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, Application, getMediaUrl } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Pagination } from '@/components/Pagination';
import {
  Briefcase,
  Search,
  Filter,
  Clock,
  MapPin,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  ArrowRight,
  Sparkles,
  Users,
  Award,
  RefreshCw,
  XCircle,
  HelpCircle,
  DollarSign,
  ChevronRight
} from 'lucide-react';

const AVATAR_PALETTES = [
  'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200/70 dark:border-sky-800',
  'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800',
  'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800',
  'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-200/70 dark:border-teal-800',
  'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800',
  'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800',
];

function getCompanyPalette(name?: string) {
  if (!name) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

function getCompanyInitials(name?: string) {
  if (!name) return 'CO';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type StatusFilterType = 'ALL' | 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW' | 'HIRED' | 'REJECTED';
type SortOption = 'newest' | 'oldest' | 'company';

export default function SeekerApplicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Expanded cards state for cover letter
  const [expandedCoverLetters, setExpandedCoverLetters] = useState<Record<number, boolean>>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchApplications = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await apiFetch<any>('/applications/my-applications/?page_size=200');
      const list: Application[] = Array.isArray(data) ? data : data.results || [];
      setApplications(list);
      if (isManualRefresh) {
        toast.success('Your applications list has been refreshed.', 'Updated');
      }
    } catch (err: any) {
      console.error('Failed to load applications:', err);
      if (isManualRefresh) {
        toast.error('Could not refresh applications. Please try again.', 'Error');
      }
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    const interval = setInterval(() => {
      fetchApplications();
    }, 15000);

    const handleNotifUpdate = () => {
      fetchApplications();
    };

    window.addEventListener('notification-updated', handleNotifUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-updated', handleNotifUpdate);
    };
  }, []);

  const toggleCoverLetter = (appId: number) => {
    setExpandedCoverLetters((prev) => ({
      ...prev,
      [appId]: !prev[appId],
    }));
  };

  // Metrics calculation
  const stats = useMemo(() => {
    return {
      total: applications.length,
      applied: applications.filter((a) => a.status === 'APPLIED').length,
      shortlisted: applications.filter((a) => a.status === 'SHORTLISTED').length,
      interview: applications.filter((a) => a.status === 'INTERVIEW').length,
      hired: applications.filter((a) => a.status === 'HIRED').length,
      rejected: applications.filter((a) => a.status === 'REJECTED').length,
    };
  }, [applications]);

  // Filtering & Sorting
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Search query (Title, Company, Location)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const title = a.job?.title?.toLowerCase() || '';
        const company = a.job?.company_name?.toLowerCase() || '';
        const location = a.job?.location?.toLowerCase() || '';
        return title.includes(q) || company.includes(q) || location.includes(q);
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
      }
      if (sortBy === 'company') {
        return (a.job?.company_name || '').localeCompare(b.job?.company_name || '');
      }
      return 0;
    });

    return result;
  }, [applications, statusFilter, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredApplications.length / pageSize) || 1;
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, sortBy]);

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'APPLIED':
        return {
          label: 'In Review',
          className: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800',
          dotColor: 'bg-blue-500',
        };
      case 'SHORTLISTED':
        return {
          label: 'Shortlisted',
          className: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800',
          dotColor: 'bg-amber-500',
        };
      case 'INTERVIEW':
        return {
          label: 'Interview',
          className: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800',
          dotColor: 'bg-purple-500 animate-pulse',
        };
      case 'HIRED':
        return {
          label: 'Hired',
          className: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800',
          dotColor: 'bg-emerald-500',
        };
      case 'REJECTED':
        return {
          label: 'Not Selected',
          className: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800',
          dotColor: 'bg-rose-500',
        };
      default:
        return {
          label: status,
          className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dotColor: 'bg-slate-400',
        };
    }
  };

  const renderStepper = (status: Application['status']) => {
    // 4 stages:
    // 1: Application Received
    // 2: Shortlisted
    // 3: Interview
    // 4: Final Decision (Hired or Not Selected)
    const isRejected = status === 'REJECTED';
    const isHired = status === 'HIRED';

    // Step state helper
    // 'done', 'current', 'upcoming', 'rejected'
    let step1State: 'done' = 'done';
    let step2State: 'done' | 'current' | 'upcoming' | 'rejected' = 'upcoming';
    let step3State: 'done' | 'current' | 'upcoming' | 'rejected' = 'upcoming';
    let step4State: 'done' | 'current' | 'upcoming' | 'rejected' = 'upcoming';

    if (status === 'APPLIED') {
      step2State = 'current';
    } else if (status === 'SHORTLISTED') {
      step2State = 'done';
      step3State = 'current';
    } else if (status === 'INTERVIEW') {
      step2State = 'done';
      step3State = 'done';
      step4State = 'current';
    } else if (status === 'HIRED') {
      step2State = 'done';
      step3State = 'done';
      step4State = 'done';
    } else if (status === 'REJECTED') {
      step4State = 'rejected';
    }

    const steps = [
      {
        id: 1,
        title: 'Application Sent',
        state: step1State,
      },
      {
        id: 2,
        title: 'Resume Review',
        state: isRejected ? 'rejected' : step2State,
      },
      {
        id: 3,
        title: 'Interview Stage',
        state: isRejected ? 'rejected' : step3State,
      },
      {
        id: 4,
        title: isHired ? 'Hired / Offer' : isRejected ? 'Not Selected' : 'Final Decision',
        state: step4State,
      },
    ];

    return (
      <div className="w-full py-2">
        <div className="grid grid-cols-4 gap-2 relative">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;

            let circleClass = 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700';
            let textClass = 'text-slate-400 dark:text-slate-500 font-medium';
            let lineClass = 'bg-slate-200 dark:bg-slate-800';

            if (step.state === 'done') {
              circleClass = 'bg-emerald-500 text-white border-emerald-500 shadow-xs shadow-emerald-500/20';
              textClass = 'text-emerald-700 dark:text-emerald-400 font-semibold';
              lineClass = 'bg-emerald-500';
            } else if (step.state === 'current') {
              circleClass = 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border-sky-500 ring-2 ring-sky-500/20 animate-pulse';
              textClass = 'text-sky-600 dark:text-sky-400 font-bold';
            } else if (step.state === 'rejected') {
              if (step.id === 4) {
                circleClass = 'bg-rose-500 text-white border-rose-500';
                textClass = 'text-rose-600 dark:text-rose-400 font-bold';
              } else {
                circleClass = 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60';
                textClass = 'text-slate-400 dark:text-slate-500 line-through text-[11px]';
              }
            }

            return (
              <div key={step.id} className="flex flex-col items-center relative text-center">
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`absolute top-3.5 left-1/2 w-full h-0.5 -z-0 transition-colors ${
                      step.state === 'done' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs relative z-10 font-bold transition-all ${circleClass}`}
                >
                  {step.state === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : step.state === 'rejected' && step.id === 4 ? (
                    <XCircle className="w-4 h-4 text-white" />
                  ) : (
                    step.id
                  )}
                </div>

                <span className={`text-[11px] sm:text-xs mt-1.5 line-clamp-1 ${textClass}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
      {/* 1. Header & Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/seeker"
              className="text-xs font-semibold text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
            >
              Seeker Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              Applied Jobs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Applied Jobs & Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track your recruitment stages, employer decisions, and review your submitted resumes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchApplications(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer shadow-xs disabled:opacity-60"
            title="Refresh application statuses"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Explore More Jobs</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
            statusFilter === 'ALL'
              ? 'bg-sky-50/70 dark:bg-sky-950/50 border-sky-300 dark:border-sky-800 ring-2 ring-sky-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Applied
          </span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {stats.total}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('APPLIED')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
            statusFilter === 'APPLIED'
              ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            In Review
          </span>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {stats.applied}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('SHORTLISTED')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
            statusFilter === 'SHORTLISTED'
              ? 'bg-amber-50/70 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Shortlisted
          </span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {stats.shortlisted}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('INTERVIEW')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
            statusFilter === 'INTERVIEW'
              ? 'bg-purple-50/70 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Interviews
          </span>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
            {stats.interview}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('HIRED')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
            statusFilter === 'HIRED'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Hired
          </span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.hired}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-50/70 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Not Selected
          </span>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            {stats.rejected}
          </p>
        </button>
      </div>

      {/* 3. Search Bar, Status Filter Tabs & Sort Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, company name, or location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="newest">Newest Applied</option>
              <option value="oldest">Oldest Applied</option>
              <option value="company">Company (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          {(
            [
              { label: 'All Applications', value: 'ALL', count: stats.total },
              { label: 'In Review', value: 'APPLIED', count: stats.applied },
              { label: 'Shortlisted', value: 'SHORTLISTED', count: stats.shortlisted },
              { label: 'Interview', value: 'INTERVIEW', count: stats.interview },
              { label: 'Hired', value: 'HIRED', count: stats.hired },
              { label: 'Not Selected', value: 'REJECTED', count: stats.rejected },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.value
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  statusFilter === tab.value
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Applications List Section */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4"
            >
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2" />
              <div className="h-10 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : paginatedApplications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-100 dark:border-sky-900">
            <Briefcase className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {applications.length === 0
                ? 'No Applications Submitted Yet'
                : 'No Applications Match Your Filter'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {applications.length === 0
                ? 'You have not submitted an application for any open positions. Browse available vacancies across Nepal and apply with your saved profile resume.'
                : 'Try adjusting your search query or selecting a different status filter above to find what you are looking for.'}
            </p>
          </div>

          {applications.length === 0 ? (
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-sm transition"
            >
              <span>Explore Vacancies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              Reset Filters & View All
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedApplications.map((app) => {
            const badge = getStatusBadge(app.status);
            const palette = getCompanyPalette(app.job?.company_name);
            const initials = getCompanyInitials(app.job?.company_name);
            const hasCoverLetter = Boolean(app.cover_letter && app.cover_letter.trim());
            const isCoverLetterOpen = Boolean(expandedCoverLetters[app.id]);
            const resumeUrl = getMediaUrl(app.resume);

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition p-5 sm:p-6 space-y-5"
              >
                {/* Header: Company, Job Title, Status Pill */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Company Avatar */}
                    {app.job?.company_logo ? (
                      <img
                        src={getMediaUrl(app.job.company_logo) || ''}
                        alt={app.job.company_name || 'Company Logo'}
                        className="w-12 h-12 rounded-xl object-contain border border-slate-200 dark:border-slate-800 bg-white p-1 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-sm tracking-wide shrink-0 shadow-xs ${palette}`}
                      >
                        {initials}
                      </div>
                    )}

                    {/* Job Details */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/jobs/${app.job?.id}`}
                          className="font-bold text-base sm:text-lg text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition"
                        >
                          {app.job?.title || `Position #${app.job?.id || 'N/A'}`}
                        </Link>
                        {app.job?.employment_type && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            {app.job.employment_type.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {app.job?.company_name || 'Hiring Organization'}
                        </span>
                        {app.job?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {app.job.location}
                          </span>
                        )}
                        {app.job?.salary && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <DollarSign className="w-3.5 h-3.5" />
                            {app.job.salary}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Applied{' '}
                          {new Date(app.applied_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-start shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs ${badge.className}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badge.dotColor}`} />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Recruitment Pipeline Stepper */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Recruitment Pipeline Stage
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      Last Updated:{' '}
                      {new Date(app.updated_at || app.applied_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {renderStepper(app.status)}
                </div>

                {/* Rejection Feedback Box */}
                {app.status === 'REJECTED' && (
                  <div className="p-4 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-xs font-bold">Feedback from Employer</span>
                    </div>
                    <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed whitespace-pre-wrap pl-6">
                      {app.rejection_reason && app.rejection_reason.trim()
                        ? app.rejection_reason
                        : `Thank you for taking the time to apply for the position at ${
                            app.job?.company_name || 'this company'
                          }. While we were impressed with your qualifications, we have chosen to move forward with other candidates whose experience more closely matches the current requirements for this role.`}
                    </p>
                  </div>
                )}

                {/* Hired Celebration Box */}
                {app.status === 'HIRED' && (
                  <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Congratulations! You have been selected for this position.
                      </p>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                        The employer at {app.job?.company_name} will be in touch with onboarding and contract details.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submissions: Resume, Cover Letter, Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Resume Download / View */}
                    {resumeUrl ? (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition font-medium"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-500" />
                        <span>Submitted Resume</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        Default Profile Resume Used
                      </span>
                    )}

                    {/* Cover Letter Accordion Toggle */}
                    {hasCoverLetter && (
                      <button
                        type="button"
                        onClick={() => toggleCoverLetter(app.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition font-medium cursor-pointer"
                      >
                        <span>Cover Letter</span>
                        {isCoverLetterOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/jobs/${app.job?.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/60 transition"
                    >
                      <span>View Job Posting</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Expanded Cover Letter Content */}
                {hasCoverLetter && isCoverLetterOpen && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Your Submitted Cover Letter
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                      {app.cover_letter}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {filteredApplications.length > pageSize && (
            <div className="pt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={filteredApplications.length}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                itemName="applied jobs"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

