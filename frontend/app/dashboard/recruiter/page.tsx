'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, Job, Application } from '@/lib/api';
import { 
  Briefcase, 
  PlusCircle, 
  Users, 
  MapPin, 
  Building2, 
  Trash2, 
  Power, 
  Clock, 
  Banknote,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Inbox,
  Filter
} from 'lucide-react';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function getInitials(name: string): string {
  if (!name) return 'CA';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function RecruiterDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
  const [appFilter, setAppFilter] = useState<'ALL' | 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW' | 'HIRED' | 'REJECTED'>('ALL');
  const [expandedLetters, setExpandedLetters] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!authLoading && user && (user.is_staff || user.is_superuser)) {
      router.replace('/dashboard/admin');
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const [jobsData, appsData] = await Promise.all([
        apiFetch<any>('/jobs/my-jobs/').catch((err) => {
          console.error('Failed to load recruiter jobs:', err);
          return [];
        }),
        apiFetch<any>('/applications/').catch((err) => {
          console.error('Failed to load applications:', err);
          return [];
        }),
      ]);

      const jobsList = Array.isArray(jobsData) ? jobsData : jobsData?.results || [];
      const appsList = Array.isArray(appsData) ? appsData : appsData?.results || [];

      setJobs(jobsList);
      setApplications(appsList);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (jobId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      await apiFetch(`/jobs/${jobId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: nextStatus as any } : j))
      );
    } catch (err) {
      alert('Failed to update job status.');
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job vacancy?')) return;
    try {
      await apiFetch(`/jobs/${jobId}/`, {
        method: 'DELETE',
      });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setApplications((prev) => prev.filter((a) => a.job?.id !== jobId));
    } catch (err) {
      alert('Failed to delete job.');
    }
  };

  const handleAppStatusChange = async (appId: number, newStatus: string) => {
    setStatusUpdating(appId);
    try {
      await apiFetch(`/applications/${appId}/status/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus as any } : app))
      );
    } catch (err) {
      alert('Failed to update candidate status.');
    } finally {
      setStatusUpdating(null);
    }
  };

  const toggleCoverLetter = (appId: number) => {
    setExpandedLetters((prev) => ({
      ...prev,
      [appId]: !prev[appId],
    }));
  };

  // Metrics
  const activeJobsCount = useMemo(() => jobs.filter((j) => j.status === 'ACTIVE').length, [jobs]);
  const newAppsCount = useMemo(() => applications.filter((a) => a.status === 'APPLIED').length, [applications]);
  const shortlistedCount = useMemo(() => applications.filter((a) => a.status === 'SHORTLISTED').length, [applications]);
  const interviewCount = useMemo(() => applications.filter((a) => a.status === 'INTERVIEW').length, [applications]);
  const hiredCount = useMemo(() => applications.filter((a) => a.status === 'HIRED').length, [applications]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    if (appFilter === 'ALL') return applications;
    return applications.filter((app) => app.status === appFilter);
  }, [applications, appFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Recruiter Header */}
      <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-sky-100/80 dark:border-slate-800 rounded-lg p-6 sm:p-8 text-slate-900 dark:text-white shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
            Welcome, {user?.username}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Manage your open vacancies, review incoming candidate applications, and track your recruitment pipeline.
          </p>
        </div>

        <div className="flex gap-2 sm:gap-3 shrink-0">
          <Link
            href="/dashboard/recruiter/profile"
            className="px-4 py-2.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs transition shadow-xs"
          >
            Company Profile
          </Link>
          <Link
            href="/dashboard/recruiter/jobs/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm shadow-sky-200 dark:shadow-none transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Vacancy</span>
          </Link>
        </div>
      </div>

      {/* Metrics Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Jobs</span>
            <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {activeJobsCount}
            <span className="text-xs font-normal text-slate-400 ml-1.5">/ {jobs.length} total</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Applicants</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {applications.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">New / Pending</span>
            <Inbox className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {newAppsCount}
            </p>
            {newAppsCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800">
                Needs Review
              </span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">In Pipeline</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {shortlistedCount + interviewCount}
            <span className="text-xs font-normal text-slate-400 ml-1.5">({hiredCount} hired)</span>
          </p>
        </div>
      </div>

      {/* SECTION 1: NEW & RECENT APPLICATIONS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                New & Recent Applications
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {applications.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Candidate resumes and submissions for all your job openings
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-md border border-slate-200/70 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setAppFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                appFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({applications.length})
            </button>
            <button
              type="button"
              onClick={() => setAppFilter('APPLIED')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                appFilter === 'APPLIED'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              New ({newAppsCount})
            </button>
            <button
              type="button"
              onClick={() => setAppFilter('SHORTLISTED')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                appFilter === 'SHORTLISTED'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Shortlisted ({shortlistedCount})
            </button>
            <button
              type="button"
              onClick={() => setAppFilter('INTERVIEW')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                appFilter === 'INTERVIEW'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Interview ({interviewCount})
            </button>
            <button
              type="button"
              onClick={() => setAppFilter('HIRED')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                appFilter === 'HIRED'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hired ({hiredCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 p-5" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-10 text-center space-y-3">
            <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Applications Received Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              When candidates submit their resumes for your active positions, they will automatically appear here with applicant contact details and cover letters.
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-2">
            <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No applications match the "{appFilter}" filter.
            </p>
            <button
              type="button"
              onClick={() => setAppFilter('ALL')}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              View all applications
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app) => {
              const resumeUrl = app.resume || app.applicant_profile?.resume;
              const isExpanded = !!expandedLetters[app.id];
              const candidateName = app.applicant.username || 'Candidate';
              const skillsList = app.applicant_profile?.skills 
                ? app.applicant_profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
                : [];

              return (
                <div
                  key={app.id}
                  className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:border-sky-300 dark:hover:border-sky-600/70 transition-all space-y-4"
                >
                  {/* Top Row: Candidate info + Job applied info + Status updater */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-md bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                        {getInitials(candidateName)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                            {candidateName}
                          </h3>
                          <span className="text-xs text-slate-400">•</span>
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

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {app.applicant.email}
                          </span>
                          {app.applicant_profile?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {app.applicant_profile.phone}
                            </span>
                          )}
                          {app.applicant_profile?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {app.applicant_profile.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status badge & selector */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatRelativeTime(app.applied_at)}
                      </span>

                      <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                        <select
                          value={app.status}
                          disabled={statusUpdating === app.id}
                          onChange={(e) => handleAppStatusChange(app.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold border transition cursor-pointer ${
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
                          <option value="APPLIED">Applied (New)</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="INTERVIEW">Interview</option>
                          <option value="HIRED">Hired</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {skillsList.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
                        Candidate Skills:
                      </span>
                      {skillsList.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Cover Letter Section (Expandable) */}
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
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-md border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line animate-in fade-in duration-150">
                          {app.cover_letter}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom Row Actions */}
                  <div className="flex flex-wrap justify-between items-center gap-3 pt-2 text-xs">
                    <div className="text-slate-400 dark:text-slate-500">
                      Position:{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {app.job?.title} ({app.job?.location})
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {resumeUrl ? (
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-100 dark:border-sky-800 transition shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Resume</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                          No resume attached
                        </span>
                      )}

                      <Link
                        href={`/dashboard/recruiter/jobs/${app.job?.id}/applicants`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-semibold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 transition"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>All Applicants</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: POSTED JOBS */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center pb-1 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              My Job Postings ({jobs.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active and closed vacancies published under your organization
            </p>
          </div>

          <Link
            href="/dashboard/recruiter/jobs/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Vacancy</span>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 p-6" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
            <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Job Postings Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You haven't posted any positions yet. Publish your first vacancy to start receiving applicants.
            </p>
            <Link
              href="/dashboard/recruiter/jobs/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Vacancy</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs overflow-hidden">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-5 sm:p-6 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-bold text-base text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition"
                    >
                      {job.title}
                    </Link>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        job.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800'
                          : job.status === 'DRAFT'
                          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700'
                      }`}
                    >
                      {job.status}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {job.employment_type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {job.salary}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Posted on {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                  <Link
                    href={`/dashboard/recruiter/jobs/${job.id}/applicants`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-100 dark:border-sky-800 transition"
                  >
                    <Users className="w-4 h-4" />
                    <span>Review Applicants</span>
                  </Link>

                  <button
                    onClick={() => handleToggleStatus(job.id, job.status)}
                    title={job.status === 'ACTIVE' ? 'Close Job' : 'Activate Job'}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                  >
                    <Power className={`w-4 h-4 ${job.status === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  </button>

                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    title="Delete Job"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
