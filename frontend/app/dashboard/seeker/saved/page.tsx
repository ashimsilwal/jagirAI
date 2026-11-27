'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, Job, Application, getMediaUrl } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Pagination } from '@/components/Pagination';
import {
  Bookmark,
  Search,
  Building2,
  MapPin,
  Briefcase,
  Banknote,
  Clock,
  ExternalLink,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Filter,
  Sparkles,
  RefreshCw,
  Send,
  Eye
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

function formatEmploymentType(type?: string) {
  if (!type) return 'Full Time';
  return type
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

type StatusFilterType = 'ALL' | 'NOT_APPLIED' | 'APPLIED' | 'REMOTE';
type SortOption = 'newest' | 'company' | 'title';

export default function SeekerSavedJobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [savedJobIds, setSavedJobIds] = useState<number[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadSavedJobIds = () => {
    if (typeof window === 'undefined') return [];
    try {
      const stored: number[] = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  };

  const fetchSavedJobs = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    const ids = loadSavedJobIds();
    setSavedJobIds(ids);

    if (ids.length === 0) {
      setJobs([]);
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
      return;
    }

    try {
      // 1. Fetch applied jobs to cross-reference
      if (user?.role === 'JOB_SEEKER') {
        try {
          const appData = await apiFetch<any>('/applications/my-applications/?page_size=200');
          const appList: Application[] = Array.isArray(appData) ? appData : appData.results || [];
          const appliedSet = new Set<number>(appList.map((a: any) => a.job?.id || a.job));
          setAppliedJobIds(appliedSet);
        } catch {
          // ignore
        }
      }

      // 2. Fetch the jobs matching saved IDs
      const jobData = await apiFetch<any>(`/jobs/?ids=${ids.join(',')}&page_size=100&status=ALL`);
      const jobList: Job[] = Array.isArray(jobData) ? jobData : jobData.results || [];
      setJobs(jobList);

      if (isManualRefresh) {
        toast.success('Your saved jobs list has been refreshed.', 'Updated');
      }
    } catch (err) {
      console.error('Failed to load saved jobs:', err);
      if (isManualRefresh) {
        toast.error('Could not refresh saved jobs. Please try again.', 'Error');
      }
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();

    const handleSync = () => {
      fetchSavedJobs();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('saved-jobs-updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('saved-jobs-updated', handleSync);
    };
  }, [user]);

  const handleRemoveSavedJob = (jobId: number, jobTitle: string) => {
    try {
      const currentIds = loadSavedJobIds();
      const updated = currentIds.filter((id) => id !== jobId);
      localStorage.setItem('saved_jobs', JSON.stringify(updated));
      setSavedJobIds(updated);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('saved-jobs-updated'));
      }
      toast.success(`"${jobTitle}" has been removed from your saved jobs.`, 'Bookmark Removed');
    } catch {
      toast.error('Failed to remove saved job.', 'Error');
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = jobs.length;
    const applied = jobs.filter((j) => appliedJobIds.has(j.id)).length;
    const notApplied = total - applied;
    const remote = jobs.filter((j) => j.employment_type === 'REMOTE').length;
    return { total, applied, notApplied, remote };
  }, [jobs, appliedJobIds]);

  // Filtering & Sorting
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Status / Mode filter
    if (statusFilter === 'NOT_APPLIED') {
      result = result.filter((j) => !appliedJobIds.has(j.id));
    } else if (statusFilter === 'APPLIED') {
      result = result.filter((j) => appliedJobIds.has(j.id));
    } else if (statusFilter === 'REMOTE') {
      result = result.filter((j) => j.employment_type === 'REMOTE');
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((j) => {
        const title = j.title?.toLowerCase() || '';
        const company = j.company_name?.toLowerCase() || '';
        const location = j.location?.toLowerCase() || '';
        return title.includes(q) || company.includes(q) || location.includes(q);
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'company') {
        return (a.company_name || '').localeCompare(b.company_name || '');
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return result;
  }, [jobs, statusFilter, searchQuery, sortBy, appliedJobIds]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, sortBy]);

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
              Saved Jobs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Saved Jobs & Bookmarks</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800">
              {jobs.length}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Keep track of open positions you have bookmarked, check your application status, and apply when ready.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchSavedJobs(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer shadow-xs disabled:opacity-60"
            title="Refresh saved jobs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/dashboard/seeker/applications"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-xs"
          >
            <Send className="w-3.5 h-3.5 text-sky-500" />
            <span>Applied Jobs</span>
          </Link>

          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Explore Vacancies</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
            statusFilter === 'ALL'
              ? 'bg-amber-50/70 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Total Saved
          </span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {stats.total}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('NOT_APPLIED')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
            statusFilter === 'NOT_APPLIED'
              ? 'bg-sky-50/70 dark:bg-sky-950/50 border-sky-300 dark:border-sky-800 ring-2 ring-sky-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Ready to Apply
          </span>
          <p className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-0.5">
            {stats.notApplied}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('APPLIED')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
            statusFilter === 'APPLIED'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Already Applied
          </span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.applied}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('REMOTE')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
            statusFilter === 'REMOTE'
              ? 'bg-purple-50/70 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Remote Roles
          </span>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
            {stats.remote}
          </p>
        </button>
      </div>

      {/* 3. Search Bar, Filter Pills & Sort Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved positions by job title, company, or location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              className="py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="newest">Recently Posted</option>
              <option value="company">Company (A-Z)</option>
              <option value="title">Position Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          {(
            [
              { label: 'All Saved', value: 'ALL', count: stats.total },
              { label: 'Ready to Apply', value: 'NOT_APPLIED', count: stats.notApplied },
              { label: 'Already Applied', value: 'APPLIED', count: stats.applied },
              { label: 'Remote', value: 'REMOTE', count: stats.remote },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.value
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
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

      {/* 4. Saved Jobs List Section */}
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
      ) : paginatedJobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-900">
            <Bookmark className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {jobs.length === 0 ? 'No Saved Jobs Yet' : 'No Saved Jobs Match Your Filter'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {jobs.length === 0
                ? 'When exploring job vacancies across Nepal, click the bookmark icon on any job card to save it here for easy review and quick application.'
                : 'Try adjusting your search keyword or switching between the status filter tabs above.'}
            </p>
          </div>

          {jobs.length === 0 ? (
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
          {paginatedJobs.map((job) => {
            const isApplied = appliedJobIds.has(job.id);
            const palette = getCompanyPalette(job.company_name);
            const initials = getCompanyInitials(job.company_name);

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition p-5 sm:p-6 space-y-4"
              >
                {/* Header Row: Company Avatar, Title, Badges & Bookmark Remove */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Company Logo or Avatar */}
                    {job.company_logo ? (
                      <img
                        src={getMediaUrl(job.company_logo) || ''}
                        alt={job.company_name || 'Company Logo'}
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
                          href={`/jobs/${job.id}`}
                          className="font-bold text-base sm:text-lg text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition"
                        >
                          {job.title}
                        </Link>
                        {job.employment_type && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            {formatEmploymentType(job.employment_type)}
                          </span>
                        )}
                        {job.category && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/80">
                            {job.category.name}
                          </span>
                        )}
                        {job.status === 'CLOSED' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 uppercase tracking-wider">
                            Closed
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {job.company_name || 'Hiring Organization'}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {job.location}
                          </span>
                        )}
                        {job.salary && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <Banknote className="w-3.5 h-3.5" />
                            {job.salary}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Posted{' '}
                          {new Date(job.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Right: Status Badge & Bookmark Remove Button */}
                  <div className="flex items-center gap-2 self-start shrink-0">
                    {isApplied ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 shadow-xs">
                        {/* <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> */}
                        <span>Applied</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800 shadow-xs">
                        {/* <Sparkles className="w-3.5 h-3.5 text-sky-500" /> */}
                        <span>Ready to Apply</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveSavedJob(job.id, job.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition cursor-pointer"
                      title="Remove from saved jobs"
                      aria-label={`Remove ${job.title} from saved jobs`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description Snippet */}
                {job.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {job.description.replace(/[#*`_]/g, '')}
                  </p>
                )}

                {/* Actions Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-[11px] font-medium text-slate-400">
                      Vacancy #{job.id}
                    </span>
                    {job.deadline && (
                      <span className="text-[11px] text-slate-500">
                        • Deadline:{' '}
                        {new Date(job.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition font-medium"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Details</span>
                    </Link>

                    {isApplied ? (
                      <Link
                        href="/dashboard/seeker/applications"
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800 transition shadow-xs"
                      >
                        <span>Track Application</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href={`/jobs/${job.id}#apply`}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm"
                      >
                        <span>Apply Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {filteredJobs.length > pageSize && (
            <div className="pt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={filteredJobs.length}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                itemName="saved jobs"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

