'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, Job } from '@/lib/api';
import { JobCard } from '@/components/JobCard';
import { WhyChooseUs } from '@/components/WhyChooseUs';
import { ScrollReveal } from '@/components/ScrollReveal';
import {
  Search,
  MapPin,
  Briefcase,
  Banknote,
  Clock,
  Building2,
  ArrowRight,
  Filter,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  Bookmark,
  SlidersHorizontal,
  X,
  FileText,
  RefreshCw
} from 'lucide-react';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<string>('');

  // Seeker Specific States
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [appliedCount, setAppliedCount] = useState<number>(0);
  const [savedJobIds, setSavedJobIds] = useState<number[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [showUnappliedOnly, setShowUnappliedOnly] = useState<boolean>(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('NEWEST');

  const isSeeker = user?.role === 'JOB_SEEKER';

  useEffect(() => {
    if (!authLoading && user && (user.is_staff || user.is_superuser)) {
      router.replace('/dashboard/admin');
    }
  }, [user, authLoading, router]);

  // Load Seeker Applications & Saved Jobs
  useEffect(() => {
    if (isSeeker) {
      apiFetch<any>('/applications/my-applications/')
        .then((data) => {
          const list = Array.isArray(data) ? data : data.results || [];
          setAppliedCount(list.length);
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

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (location) params.append('location', location);
      if (employmentType) params.append('employment_type', employmentType);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetch<any>(`/jobs/${queryString}`);
      const jobList = Array.isArray(data) ? data : data.results || [];
      setJobs(jobList);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [employmentType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setLocation('');
    setEmploymentType('');
    setShowSavedOnly(false);
    setShowUnappliedOnly(false);
    // Fetch reset jobs
    apiFetch<any>('/jobs/').then((data) => {
      setJobs(Array.isArray(data) ? data : data.results || []);
    });
  };

  // Filter & Sort Jobs locally
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

  return (
    <div className="flex-1 flex flex-col">
      {/* 1. HERO SECTION: Different for Job Seeker vs Guest */}
      {isSeeker ? (
        /* JOB SEEKER DEDICATED HEADER */
        <section className="bg-gradient-to-r from-sky-50/90 via-blue-50/50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-sky-100/80 dark:border-slate-800 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {jobs.length} Verified Vacancies
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1.5">
                  Find Your Next Role, <span className="text-sky-600 dark:text-sky-400">{user?.username}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                  Browse matching positions, view hiring requirements, and submit applications directly.
                </p>
              </div>

              {/* Seeker Quick Links */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link
                  href="/dashboard/seeker"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
                >
                  <Briefcase className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>My Applications</span>
                  {appliedCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">
                      {appliedCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard/seeker/profile"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile & Resume</span>
                </Link>
              </div>
            </div>

            {/* Seeker Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-xl shadow-sm border border-slate-200/90 dark:border-slate-800 flex flex-col md:flex-row gap-2"
            >
              <div className="flex-1 flex items-center px-3 py-2 bg-slate-50/80 dark:bg-slate-800/60 md:bg-transparent dark:md:bg-transparent rounded-lg">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or tech stack (e.g. Python, React)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-800 my-1" />

              <div className="flex-1 flex items-center px-3 py-2 bg-slate-50/80 dark:bg-slate-800/60 md:bg-transparent dark:md:bg-transparent rounded-lg">
                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />
                <input
                  type="text"
                  placeholder="Location or Remote..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-800 my-1" />

              <div className="flex items-center px-3 py-2 bg-slate-50/80 dark:bg-slate-800/60 md:bg-transparent dark:md:bg-transparent rounded-lg">
                <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mr-2" />
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="text-xs sm:text-sm bg-transparent focus:outline-none font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="" className="dark:bg-slate-900">All Job Types</option>
                  <option value="FULL_TIME" className="dark:bg-slate-900">Full Time</option>
                  <option value="PART_TIME" className="dark:bg-slate-900">Part Time</option>
                  <option value="CONTRACT" className="dark:bg-slate-900">Contract</option>
                  <option value="INTERNSHIP" className="dark:bg-slate-900">Internship</option>
                  <option value="REMOTE" className="dark:bg-slate-900">Remote</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm transition shadow-sm shadow-sky-500/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters:
              </span>

              {[
                { label: 'All Types', type: '' },
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

              {/* Bookmarked Filter Pill */}
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
                <span>Saved Jobs ({savedJobIds.length})</span>
              </button>

              {/* Not Yet Applied Pill */}
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
                <span>Not Applied Yet</span>
              </button>

              {/* Clear All Filters */}
              {(search || location || employmentType || showSavedOnly || showUnappliedOnly) && (
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
      ) : (
        /* GUEST / VISITOR MARKETING HERO */
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-100/80 via-blue-50/50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 text-slate-900 dark:text-slate-100 py-20 px-4 sm:px-6 lg:px-8 border-b border-sky-100/80 dark:border-slate-800/80 transition-colors duration-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_50%)] pointer-events-none" />
          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white animate-fade-in-up">
              Connecting Top Talent with <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 dark:from-sky-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Visionary Companies
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-300 text-base sm:text-lg animate-fade-in-up animation-delay-100">
              Browse verified job vacancies, apply seamlessly with your resume, and track your career trajectory in real time.
            </p>

            {/* Search Bar Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl shadow-xl shadow-sky-900/5 dark:shadow-none flex flex-col md:flex-row gap-2 max-w-4xl mx-auto border border-sky-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 animate-fade-in-up animation-delay-200 hover:border-sky-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex-1 flex items-center px-3 py-2 bg-slate-50 dark:bg-slate-800/50 md:bg-transparent dark:md:bg-transparent rounded-lg">
                <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or skills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-sm bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-800 my-1" />

              <div className="flex-1 flex items-center px-3 py-2 bg-slate-50 dark:bg-slate-800/50 md:bg-transparent dark:md:bg-transparent rounded-lg">
                <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />
                <input
                  type="text"
                  placeholder="City, state, or Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-sm bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-800 my-1" />

              <div className="flex items-center px-3 py-2 bg-slate-50 dark:bg-slate-800/50 md:bg-transparent dark:md:bg-transparent rounded-lg">
                <Filter className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mr-2" />
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="text-sm bg-transparent focus:outline-none font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="" className="dark:bg-slate-900">All Job Types</option>
                  <option value="FULL_TIME" className="dark:bg-slate-900">Full Time</option>
                  <option value="PART_TIME" className="dark:bg-slate-900">Part Time</option>
                  <option value="CONTRACT" className="dark:bg-slate-900">Contract</option>
                  <option value="INTERNSHIP" className="dark:bg-slate-900">Internship</option>
                  <option value="REMOTE" className="dark:bg-slate-900">Remote</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-sm transition-all duration-200 shadow-sm shadow-sky-200 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Search Jobs
              </button>
            </form>

            {/* Quick popular tags with staggered fade in */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400 animate-fade-in animation-delay-300">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Popular Searches:</span>
              {['Frontend Developer', 'Python Engineer', 'Product Manager', 'Data Analyst', 'Remote'].map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearch(tag);
                    fetchJobs();
                  }}
                  className="px-2.5 py-1 rounded-md bg-white/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. JOB LISTINGS SECTION */}
      <section id="jobs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Results Toolbar with ScrollReveal */}
        <ScrollReveal durationMs={500} distance={14}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {showSavedOnly
                ? 'Saved & Bookmarked Jobs'
                : showUnappliedOnly
                ? 'Opportunities You Haven’t Applied To'
                : isSeeker
                ? 'Explore Available Vacancies'
                : 'Explore Active Positions'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Showing {displayedJobs.length} {displayedJobs.length === 1 ? 'verified position' : 'verified positions'}
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
        </ScrollReveal>

        {/* Listings Content */}
        {loading ? (
          <div className={layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        ) : displayedJobs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-8 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60 mb-3">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {showSavedOnly ? 'No Saved Jobs' : 'No Vacancies Found'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {showSavedOnly
                ? 'You haven’t saved any jobs yet. Click the bookmark icon on any position card to save it for later.'
                : showUnappliedOnly
                ? 'You have already applied to all current vacancies matching this search.'
                : "We couldn't find any positions matching your search filters. Try clearing your filters to explore other roles."}
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-5 px-4 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200/80 dark:border-sky-800 rounded-xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3.5"}>
            {displayedJobs.map((job, idx) => (
              <div
                key={job.id}
                style={{ animationDelay: `${Math.min(idx * 60, 480)}ms` }}
                className="animate-fade-in-up"
              >
                <JobCard
                  job={job}
                  isApplied={appliedJobIds.has(job.id)}
                  layout={layout}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. ONLY SHOW MARKETING PROMO FOR NON-JOB-SEEKERS (GUESTS) */}
      {!isSeeker && (
        <ScrollReveal durationMs={550} distance={20}>
          <WhyChooseUs />
        </ScrollReveal>
      )}
    </div>
  );
}
