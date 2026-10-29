'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, Application, Job, getMediaUrl, hasPermission } from '@/lib/api';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  ExternalLink, 
  Clock, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Building2, 
  CheckCircle2, 
  ShieldAlert, 
  Inbox,
  ChevronDown,
  ChevronUp,
  X,
  PlusCircle,
  Users
} from 'lucide-react';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return `${mins}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function getInitials(name?: string): string {
  if (!name) return 'CA';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

type StatusFilter = 'ALL' | 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW' | 'HIRED' | 'REJECTED';

export default function AllRecruiterApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'NAME'>('NEWEST');
  const [expandedLetters, setExpandedLetters] = useState<Record<number, boolean>>({});

  const canViewApplications = hasPermission(user, 'application.view');
  const canCreateVacancy = hasPermission(user, 'vacancy.create');

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'JOB_RECRUITER') {
      router.push('/dashboard');
      return;
    }

    if (!canViewApplications) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [appsData, jobsData] = await Promise.all([
          apiFetch<any>('/applications/?page_size=200').catch((err) => {
            console.error('Failed to load applications:', err);
            return [];
          }),
          apiFetch<any>('/jobs/my-jobs/?page_size=100').catch((err) => {
            console.error('Failed to load jobs:', err);
            return [];
          }),
        ]);

        const appsList: Application[] = Array.isArray(appsData) ? appsData : appsData?.results || [];
        const jobsList: Job[] = Array.isArray(jobsData) ? jobsData : jobsData?.results || [];

        setApplications(appsList);
        setJobs(jobsList);
      } catch (err: any) {
        console.error('Failed to load application data:', err);
        setError(err?.message || 'Failed to load candidate applications.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, canViewApplications, router]);

  // Counts by status
  const counts = useMemo(() => {
    return {
      all: applications.length,
      applied: applications.filter((a) => a.status === 'APPLIED').length,
      shortlisted: applications.filter((a) => a.status === 'SHORTLISTED').length,
      interview: applications.filter((a) => a.status === 'INTERVIEW').length,
      hired: applications.filter((a) => a.status === 'HIRED').length,
      rejected: applications.filter((a) => a.status === 'REJECTED').length,
    };
  }, [applications]);

  // Filtered and sorted applications
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Vacancy filter
    if (selectedJobId !== 'ALL') {
      const jId = parseInt(selectedJobId, 10);
      result = result.filter((a) => a.job?.id === jId);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const candidateName = (a.applicant?.username || '').toLowerCase();
        const candidateEmail = (a.applicant?.email || '').toLowerCase();
        const jobTitle = (a.job?.title || '').toLowerCase();
        const skills = (a.applicant_profile?.skills || '').toLowerCase();
        return (
          candidateName.includes(q) ||
          candidateEmail.includes(q) ||
          jobTitle.includes(q) ||
          skills.includes(q)
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
      }
      if (sortBy === 'NAME') {
        return (a.applicant?.username || '').localeCompare(b.applicant?.username || '');
      }
      return 0;
    });

    return result;
  }, [applications, statusFilter, selectedJobId, searchQuery, sortBy]);

  const toggleCoverLetter = (appId: number) => {
    setExpandedLetters((prev) => ({
      ...prev,
      [appId]: !prev[appId],
    }));
  };

  // Permission access check
  if (!canViewApplications) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-8 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-amber-900 dark:text-amber-200">
            Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 max-w-md mx-auto leading-relaxed">
            Your staff account does not have permission to review candidate applications. Please contact your organization administrator if you need candidate review access.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/recruiter"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Recruiter Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
      
      {/* 1. TOP BREADCRUMB & HEADER */}
      <div className="space-y-3">
        <Link
          href="/dashboard/recruiter"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Recruiter Dashboard</span>
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 px-2.5 py-0.5 rounded-md border border-sky-100 dark:border-sky-900/60">
                Candidate Management
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {applications.length} {applications.length === 1 ? 'Submission' : 'Submissions'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1.5">
              All Candidate Applications
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Complete applicant pipeline across all your published job vacancies. Review candidate CVs, qualifications, cover letters, and manage hiring statuses.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {canCreateVacancy && (
              <Link
                href="/dashboard/recruiter/jobs/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post New Vacancy</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4">
        
        {/* Search & Select Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, email, skills, or job title..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Job Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition cursor-pointer"
            >
              <option value="ALL">All Vacancies ({jobs.length})</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id.toString()}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition cursor-pointer"
            >
              <option value="NEWEST">Sort: Newest Submissions</option>
              <option value="OLDEST">Sort: Oldest Submissions</option>
              <option value="NAME">Sort: Candidate Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-1.5 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('APPLIED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'APPLIED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
            }`}
          >
            Applied ({counts.applied})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('SHORTLISTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'SHORTLISTED'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60'
            }`}
          >
            Shortlisted ({counts.shortlisted})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('INTERVIEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'INTERVIEW'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60'
            }`}
          >
            Interview ({counts.interview})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('HIRED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'HIRED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
            }`}
          >
            Hired ({counts.hired})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60'
            }`}
          >
            Rejected ({counts.rejected})
          </button>

          {(searchQuery || statusFilter !== 'ALL' || selectedJobId !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setSelectedJobId('ALL');
              }}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* 3. APPLICATION CARDS LIST */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Candidate Applications Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            When candidates submit their profiles and CVs for your vacancies, they will automatically appear here with full candidate background details.
          </p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-10 text-center space-y-3">
          <Filter className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Applications Match Your Criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, status tabs, or vacancy filter to find candidate submissions.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setSelectedJobId('ALL');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center px-1">
            <span>
              Showing {filteredApplications.length} of {applications.length} applications
            </span>
          </div>

          {filteredApplications.map((app) => {
            const candidateName = app.applicant?.username || 'Candidate';
            const candidateAvatar = app.applicant_profile?.profile_picture || app.applicant?.profile_picture;
            const resumeUrl = app.resume || app.applicant_profile?.resume;
            const skillsList = app.applicant_profile?.skills
              ? app.applicant_profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
              : [];
            const isExpanded = !!expandedLetters[app.id];

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm hover:border-sky-300 dark:hover:border-sky-600/70 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-slate-200/60 dark:border-slate-700">
                      {candidateAvatar ? (
                        <img
                          src={getMediaUrl(candidateAvatar) || ''}
                          alt={candidateName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(candidateName)}</span>
                      )}
                    </div>

                    {/* Candidate metadata */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/recruiter/applications/${app.id}`}
                          className="font-bold text-base text-slate-900 dark:text-white leading-tight hover:text-sky-600 dark:hover:text-sky-400 transition"
                          title="Review application"
                        >
                          {candidateName}
                        </Link>
                        <span className="text-xs text-slate-400 shrink-0">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Applied for{' '}
                          <Link
                            href={`/dashboard/recruiter/jobs/${app.job?.id}/applicants`}
                            className="font-semibold text-sky-700 dark:text-sky-300 hover:underline"
                          >
                            {app.job?.title || 'Job Opening'}
                          </Link>
                        </span>
                      </div>

                      {/* Contact row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5 min-w-0">
                        {app.applicant?.email && (
                          <span className="flex items-center gap-1 min-w-0 break-all">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{app.applicant.email}</span>
                          </span>
                        )}
                        {app.applicant_profile?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{app.applicant_profile.phone}</span>
                          </span>
                        )}
                        {app.applicant_profile?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{app.applicant_profile.location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status badge & Review button */}
                  <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatRelativeTime(app.applied_at)}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        app.status === 'APPLIED'
                          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
                          : app.status === 'SHORTLISTED'
                          ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800'
                          : app.status === 'INTERVIEW'
                          ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800'
                          : app.status === 'HIRED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800'
                      }`}
                    >
                      {app.status === 'APPLIED' ? 'Applied (New)' : app.status}
                    </span>

                    <Link
                      href={`/dashboard/recruiter/applications/${app.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs text-white bg-sky-600 hover:bg-sky-500 shadow-sm transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Application</span>
                    </Link>
                  </div>
                </div>

                {/* Candidate Skills */}
                {skillsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
                      Skills:
                    </span>
                    {skillsList.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Cover letter section */}
                {app.cover_letter && (
                  <div className="text-xs space-y-1.5">
                    <button
                      type="button"
                      onClick={() => toggleCoverLetter(app.id)}
                      className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Cover Letter' : 'Read Cover Letter'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line animate-in fade-in duration-150">
                        {app.cover_letter}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Row Actions */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-2 text-xs">
                  <div className="text-slate-400 dark:text-slate-500">
                    Vacancy:{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {app.job?.title}
                    </span>{' '}
                    <span className="text-slate-400">({app.job?.location || 'Remote / Office'})</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Link
                      href={`/dashboard/recruiter/applications/${app.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-100 dark:border-sky-800 transition shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details & CV</span>
                    </Link>

                    {/* {resumeUrl && (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View CV</span>
                      </a>
                    )} */}

                    <Link
                      href={`/dashboard/recruiter/jobs/${app.job?.id}/applicants`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 transition"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>All Position Applicants</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
