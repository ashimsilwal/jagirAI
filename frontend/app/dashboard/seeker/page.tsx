'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, Application } from '@/lib/api';
import { 
  Briefcase, 
  Clock, 
  MapPin, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function SeekerDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const data = await apiFetch<any>('/applications/my-applications/');
        const list = Array.isArray(data) ? data : data.results || [];
        setApplications(list);
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Summary Metrics
  const stats = useMemo(() => {
    return {
      total: applications.length,
      applied: applications.filter((a) => a.status === 'APPLIED').length,
      shortlisted: applications.filter((a) => a.status === 'SHORTLISTED').length,
      interview: applications.filter((a) => a.status === 'INTERVIEW').length,
      hired: applications.filter((a) => a.status === 'HIRED').length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (statusFilter === 'ALL') return applications;
    return applications.filter((app) => app.status === statusFilter);
  }, [applications, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 shadow-sm">
            Applied
          </span>
        );
      case 'SHORTLISTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 shadow-sm">
            Shortlisted
          </span>
        );
      case 'INTERVIEW':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60 shadow-sm">
            Interview Scheduled
          </span>
        );
      case 'HIRED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 shadow-sm">
            Hired 🎉
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60 shadow-sm">
            Not Selected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-50/90 via-blue-50/60 to-indigo-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-sky-100/90 dark:border-slate-800 p-6 sm:p-8 text-slate-900 dark:text-white shadow-sm transition-colors">
        {/* Subtle decorative glow elements */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome, <span className="text-sky-600 dark:text-sky-400">{user?.username}</span>!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl">
              Track your job applications, recruitment stages, and status updates in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/dashboard/seeker/profile"
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 dark:hover:border-slate-200/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 dark:hover:text-white font-semibold text-xs transition shadow-sm"
            >
              Edit Profile & Resume
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm shadow-sky-500/25 transition cursor-pointer"
            >
              <span>Browse More Jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Applied</span>
            <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Under Review</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.applied}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Shortlisted</span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.shortlisted}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Interviews</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.interview}
            </p>
            {stats.hired > 0 && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ({stats.hired} hired)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Applications Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              My Applications
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800">
              {applications.length}
            </span>
          </div>

          {/* Status Filters */}
          {applications.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700 text-xs">
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Applied', value: 'APPLIED' },
                { label: 'Shortlisted', value: 'SHORTLISTED' },
                { label: 'Interviews', value: 'INTERVIEW' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    statusFilter === tab.value
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="h-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between"
              >
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {statusFilter === 'ALL' ? 'No applications yet' : `No applications found with status "${statusFilter}"`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {statusFilter === 'ALL'
                  ? "You haven't applied for any positions yet. Explore active vacancies and submit your application to get started."
                  : 'Try selecting a different filter above to view your other submitted applications.'}
              </p>
            </div>
            {statusFilter === 'ALL' ? (
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-sm shadow-sky-500/25 transition cursor-pointer"
              >
                <span>Explore Vacancies</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-sm overflow-hidden transition-colors">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="p-5 sm:p-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {app.job.title}
                    </h3>
                    <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {app.job.company_name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {app.job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Applied on {new Date(app.applied_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 self-end sm:self-center shrink-0">
                  {getStatusBadge(app.status)}
                  <Link
                    href={`/jobs/${app.job.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-100 dark:border-sky-800/60 transition"
                  >
                    <span>View Job</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
