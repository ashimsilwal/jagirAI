'use client';

import React, { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, Job, PaginatedResponse } from '@/lib/api';
import { JobCard } from '@/components/JobCard';
import { Pagination } from '@/components/Pagination';
import {
  Search,
  MapPin,
  Briefcase,
  Filter,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  Bookmark,
  SlidersHorizontal,
  X,
  RotateCcw
} from 'lucide-react';

function JobsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search parameters from URL
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const urlPageSize = parseInt(searchParams.get('page_size') || '12', 10);
  const initialSearch = searchParams.get('search') || '';
  const initialLocation = searchParams.get('location') || '';
  const initialEmploymentType = searchParams.get('employment_type') || '';

  const [page, setPage] = useState<number>(urlPage > 0 ? urlPage : 1);
  const [pageSize, setPageSize] = useState<number>(urlPageSize > 0 ? urlPageSize : 12);
  const [search, setSearch] = useState<string>(initialSearch);
  const [location, setLocation] = useState<string>(initialLocation);
  const [employmentType, setEmploymentType] = useState<string>(initialEmploymentType);

  // Server-side paginated data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Seeker Specific States
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [appliedCount, setAppliedCount] = useState<number>(0);
  const [savedJobIds, setSavedJobIds] = useState<number[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [showUnappliedOnly, setShowUnappliedOnly] = useState<boolean>(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('NEWEST');

  const isSeeker = user?.role === 'JOB_SEEKER';

  // Load Seeker Applications & Saved Jobs
  useEffect(() => {
    if (isSeeker) {
      apiFetch<any>('/applications/my-applications/')
        .then((data) => {
          const list = Array.isArray(data) ? data : data.results || [];
          setAppliedCount(typeof data.count === 'number' ? data.count : list.length);
          const ids = new Set<number>(list.map((app: any) => app.job?.id || app.job));
          setAppliedJobIds(ids);
        })
        .catch(() => {});
    }

    if (typeof window !== 'undefined') {
      try {
        const saved: number[] = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
        setSavedJobIds(saved);
      } catch {
        setSavedJobIds([]);
      }
    }
  }, [isSeeker]);

  // Sync state with URL params on back/forward navigation
  useEffect(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    const ps = parseInt(searchParams.get('page_size') || '12', 10);
    const s = searchParams.get('search') || '';
    const l = searchParams.get('location') || '';
    const e = searchParams.get('employment_type') || '';

    setPage(p > 0 ? p : 1);
    setPageSize(ps > 0 ? ps : 12);
    setSearch(s);
    setLocation(l);
    setEmploymentType(e);
  }, [searchParams]);

  // Fetch full server-paginated job catalog
  const fetchJobs = useCallback(async (
    targetPage = page,
    targetPageSize = pageSize,
    searchQuery = search,
    locQuery = location,
    typeQuery = employmentType
  ) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(targetPage));
      params.append('page_size', String(targetPageSize));
      if (searchQuery) params.append('search', searchQuery);
      if (locQuery) params.append('location', locQuery);
      if (typeQuery) params.append('employment_type', typeQuery);

      const queryString = `?${params.toString()}`;
      const data = await apiFetch<PaginatedResponse<Job>>(`/jobs/${queryString}`);

      if (data && Array.isArray(data.results)) {
        setJobs(data.results);
        setTotalCount(data.count);
      } else if (Array.isArray(data)) {
        setJobs(data);
        setTotalCount((data as Job[]).length);
      } else {
        setJobs([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.error('Failed to load jobs:', err);
      // If 404 on page change (e.g. out of range), fallback to page 1
      if (targetPage > 1) {
        handlePageChange(1);
      } else {
        setFetchError('Unable to load vacancies. Please check your connection and try again.');
        setJobs([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, location, employmentType]);

  useEffect(() => {
    fetchJobs(page, pageSize, search, location, employmentType);
  }, [page, pageSize, employmentType]);

  // Push URL update helper
  const updateUrlParams = (
    newPage: number,
    newPageSize: number,
    newSearch: string,
    newLoc: string,
    newType: string
  ) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.append('page', String(newPage));
    if (newPageSize !== 12) params.append('page_size', String(newPageSize));
    if (newSearch) params.append('search', newSearch);
    if (newLoc) params.append('location', newLoc);
    if (newType) params.append('employment_type', newType);

    const qs = params.toString() ? `?${params.toString()}` : '';
    router.push(`/jobs${qs}`, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateUrlParams(1, pageSize, search, location, employmentType);
    fetchJobs(1, pageSize, search, location, employmentType);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrlParams(newPage, pageSize, search, location, employmentType);
    fetchJobs(newPage, pageSize, search, location, employmentType);

    // Smooth scroll to top of catalog
    const headerElem = document.getElementById('jobs-results-header');
    if (headerElem) {
      headerElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
    updateUrlParams(1, newPageSize, search, location, employmentType);
    fetchJobs(1, newPageSize, search, location, employmentType);
  };

  const handleResetFilters = () => {
    setSearch('');
    setLocation('');
    setEmploymentType('');
    setShowSavedOnly(false);
    setShowUnappliedOnly(false);
    setSortBy('NEWEST');
    setPage(1);
    updateUrlParams(1, pageSize, '', '', '');
    fetchJobs(1, pageSize, '', '', '');
  };

  // Local sorting/filtering for client bookmark and application toggles
  const displayedJobs = useMemo(() => {
    let list = [...jobs];

    if (showSavedOnly) {
      list = list.filter((j) => savedJobIds.includes(j.id));
    }

    if (showUnappliedOnly) {
      list = list.filter((j) => !appliedJobIds.has(j.id));
    }

    if (sortBy === 'NEWEST') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'OLDEST') {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'TITLE') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [jobs, showSavedOnly, showUnappliedOnly, savedJobIds, appliedJobIds, sortBy]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="flex-1 flex flex-col bg-slate-50/60 dark:bg-slate-950 min-h-screen">
      {/* 1. HERO / SEARCH HEADER */}
      <section className="bg-gradient-to-b from-sky-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 border-b border-sky-100/80 dark:border-slate-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link
                  href="/"
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Home
                </Link>
                <span className="text-xs text-slate-400">/</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Find Jobs
                </span>
                <span className="text-xs text-slate-400">•</span>
                {/* <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                  <Sparkles className="w-3 h-3" />
                  {totalCount > 0 ? `${totalCount.toLocaleString()} Verified Vacancies` : 'Explore Opportunities'}
                </span> */}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Find Your Next Career Move
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Explore thousands of verified job vacancies from leading companies, startups, and tech innovators across Nepal and remote worldwide.
              </p>
            </div>

            {/* Quick Action links */}
            {isSeeker && (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/seeker"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
                >
                  <Briefcase className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>My Applications</span>
                  {appliedCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
                      {appliedCount}
                    </span>
                  )}
                </Link>
              </div>
            )}
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            aria-label="Search jobs"
            className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl shadow-md shadow-slate-950/5 dark:shadow-none border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-2 transition-all hover:border-slate-300 dark:hover:border-slate-700 focus-within:border-slate-300 dark:focus-within:border-slate-700"
          >
            <div className="flex-1 flex items-center px-3 py-2 bg-slate-50/80 dark:bg-slate-800/60 md:bg-transparent dark:md:bg-transparent rounded-xl">
              <Search aria-hidden="true" className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />
              <input
                type="text"
                aria-label="Search by job title, company, or skills"
                placeholder="Job title, keywords, or skills (e.g. React, Python, Django)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div aria-hidden="true" className="hidden md:block w-px bg-slate-200 dark:bg-slate-800 my-1" />

            <div className="flex-1 flex items-center px-3 py-2 bg-slate-50/80 dark:bg-slate-800/60 md:bg-transparent dark:md:bg-transparent rounded-xl">
              <MapPin aria-hidden="true" className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />
              <input
                type="text"
                aria-label="Filter by location or remote"
                placeholder="City, location, or Remote..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div aria-hidden="true" className="hidden md:block w-px bg-slate-200 dark:bg-slate-800 my-1" />

            <div className="flex items-center px-3 py-2 bg-slate-50/80 dark:bg-slate-800/60 md:bg-transparent dark:md:bg-transparent rounded-xl">
              <Filter aria-hidden="true" className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mr-2" />
              <select
                aria-label="Filter by employment type"
                value={employmentType}
                onChange={(e) => {
                  setEmploymentType(e.target.value);
                  setPage(1);
                  updateUrlParams(1, pageSize, search, location, e.target.value);
                  fetchJobs(1, pageSize, search, location, e.target.value);
                }}
                className="text-xs sm:text-sm bg-transparent focus:outline-none font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="" className="dark:bg-slate-900">All Employment Types</option>
                <option value="FULL_TIME" className="dark:bg-slate-900">Full Time</option>
                <option value="PART_TIME" className="dark:bg-slate-900">Part Time</option>
                <option value="CONTRACT" className="dark:bg-slate-900">Contract</option>
                <option value="INTERNSHIP" className="dark:bg-slate-900">Internship</option>
                <option value="REMOTE" className="dark:bg-slate-900">Remote</option>
              </select>
            </div>

            <button
              type="submit"
              aria-label="Search jobs catalog"
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm transition shadow-sm shadow-sky-500/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Search aria-hidden="true" className="w-4 h-4" />
              <span>Search</span>
            </button>
          </form>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter by:
            </span>

            {[
              { label: 'All Jobs', type: '' },
              { label: 'Remote', type: 'REMOTE' },
              { label: 'Full-Time', type: 'FULL_TIME' },
              { label: 'Internships', type: 'INTERNSHIP' },
              { label: 'Contract', type: 'CONTRACT' },
              { label: 'Part-Time', type: 'PART_TIME' },
            ].map((pill, idx) => {
              const isActive = employmentType === pill.type && !showSavedOnly && !showUnappliedOnly;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setShowSavedOnly(false);
                    setShowUnappliedOnly(false);
                    setEmploymentType(pill.type);
                    setPage(1);
                    updateUrlParams(1, pageSize, search, location, pill.type);
                    fetchJobs(1, pageSize, search, location, pill.type);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}

            {/* Saved Jobs Pill */}
            <button
              type="button"
              onClick={() => {
                setShowSavedOnly(!showSavedOnly);
                setShowUnappliedOnly(false);
              }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                showSavedOnly
                  ? 'bg-amber-500 text-white shadow-sm font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-white' : 'text-amber-500'}`} />
              <span>Saved ({savedJobIds.length})</span>
            </button>

            {/* Not Yet Applied Pill (Seekers) */}
            {isSeeker && (
              <button
                type="button"
                onClick={() => {
                  setShowUnappliedOnly(!showUnappliedOnly);
                  setShowSavedOnly(false);
                }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  showUnappliedOnly
                    ? 'bg-sky-600 text-white shadow-sm font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>Not Applied</span>
              </button>
            )}

            {/* Clear All Filters */}
            {(search || location || employmentType || showSavedOnly || showUnappliedOnly || page > 1) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 ml-auto cursor-pointer font-medium"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. RESULTS CATALOG */}
      <section id="jobs-results-header" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full scroll-mt-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {showSavedOnly
                ? 'Saved & Bookmarked Vacancies'
                : showUnappliedOnly
                ? 'Vacancies You Haven’t Applied To'
                : 'All Job Vacancies'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Page <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span> ({totalCount.toLocaleString()} total positions)
              {isSeeker && appliedCount > 0 && (
                <span className="text-sky-600 dark:text-sky-400 ml-1.5 font-medium">
                  • {appliedCount} applied
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="TITLE">Title (A-Z)</option>
              </select>
            </div>

            {/* Layout Toggle: Grid / List */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setLayout('grid')}
                aria-label="Grid View"
                title="Grid View"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  layout === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLayout('list')}
                aria-label="List View"
                title="List View"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  layout === 'list'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className={layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm animate-pulse space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                    <div className="w-1/2 h-4 bg-slate-100 dark:bg-slate-800/60 rounded-sm" />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800/60 rounded" />
                    <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </div>
                </div>
                <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800">
                  <div className="w-full h-9 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">
              Failed to Load Vacancies
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {fetchError}
            </p>
            <button
              onClick={() => fetchJobs(page, pageSize, search, location, employmentType)}
              className="mt-5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition shadow-sm cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : displayedJobs.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-slate-800 flex items-center justify-center mx-auto text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-slate-700 mb-4">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {showSavedOnly ? 'No Saved Jobs' : 'No Vacancies Found'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
              {showSavedOnly
                ? 'You haven’t saved any jobs yet. Click the bookmark icon on any position card to save it for quick access.'
                : showUnappliedOnly
                ? 'You have already applied to all current vacancies matching this filter criteria.'
                : "We couldn't find any positions matching your search filters. Try adjusting your keywords or clearing filters."}
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-6 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition shadow-sm cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* Job Cards Grid/List */
          <>
            <div className={layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3.5"}>
              {displayedJobs.map((job) => (
                <div key={job.id}>
                  <JobCard
                    job={job}
                    isApplied={appliedJobIds.has(job.id)}
                    layout={layout}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-10 border-t border-slate-200/80 dark:border-slate-800/80 pt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[12, 24, 48, 96]}
                itemName="vacancies"
                disabled={loading}
                align="center"
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function JobsLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<JobsLoadingSkeleton />}>
      <JobsContent />
    </Suspense>
  );
}
