'use client';

import React, { useEffect, useState } from 'react';
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
  UserCheck 
} from 'lucide-react';

export default function SeekerDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">Applied</span>;
      case 'SHORTLISTED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">Shortlisted</span>;
      case 'INTERVIEW':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700">Interview Scheduled</span>;
      case 'HIRED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">Hired 🎉</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700">Not Selected</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-cyan-50 border border-sky-100/80 rounded-2xl p-6 sm:p-8 text-slate-900 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 bg-sky-100/80 px-2.5 py-0.5 rounded-full">
            Candidate Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            Welcome, {user?.username}!
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Track your job applications and status updates in real time.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/seeker/profile"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
          >
            Edit Profile & Resume
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm shadow-sky-200 transition cursor-pointer"
          >
            Browse More Jobs
          </Link>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            My Applications ({applications.length})
          </h2>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 p-6" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">No applications yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't applied for any positions yet. Explore active vacancies and submit your application.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition"
            >
              <span>Explore Vacancies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-5 sm:p-6 hover:bg-slate-50/60 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">
                      {app.job.title}
                    </h3>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {app.job.company_name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {app.job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Applied on {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  {getStatusBadge(app.status)}
                  <Link
                    href={`/jobs/${app.job.id}`}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    View Job <ArrowRight className="w-3.5 h-3.5" />
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
