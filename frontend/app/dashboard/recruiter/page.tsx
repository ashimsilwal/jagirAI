'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, Job } from '@/lib/api';
import { 
  Briefcase, 
  PlusCircle, 
  Users, 
  MapPin, 
  Building2, 
  Eye, 
  Trash2, 
  Power, 
  Clock,
  ArrowRight,
  DollarSign
} from 'lucide-react';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyJobs = async () => {
    try {
      const data = await apiFetch<any>('/jobs/my-jobs/');
      const list = Array.isArray(data) ? data : data.results || [];
      setJobs(list);
    } catch (err) {
      console.error('Failed to load recruiter jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const handleToggleStatus = async (jobId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      await apiFetch(`/jobs/${jobId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchMyJobs();
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
      fetchMyJobs();
    } catch (err) {
      alert('Failed to delete job.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Recruiter Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-slate-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Recruiter Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome, {user?.username}!
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Manage your open vacancies, view incoming candidate resumes, and update statuses.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/dashboard/recruiter/profile"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition backdrop-blur-md"
          >
            Company Profile
          </Link>
          <Link
            href="/dashboard/recruiter/jobs/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Vacancy</span>
          </Link>
        </div>
      </div>

      {/* Posted Jobs Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            My Job Postings ({jobs.length})
          </h2>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-6" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">No Job Postings Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't posted any positions yet. Publish your first vacancy to start receiving applicants.
            </p>
            <Link
              href="/dashboard/recruiter/jobs/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Vacancy</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-5 sm:p-6 hover:bg-slate-50/60 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">
                      {job.title}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        job.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : job.status === 'DRAFT'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {job.status}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-medium">
                      {job.employment_type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                  >
                    <Users className="w-4 h-4" />
                    <span>Review Applicants</span>
                  </Link>

                  <button
                    onClick={() => handleToggleStatus(job.id, job.status)}
                    title={job.status === 'ACTIVE' ? 'Close Job' : 'Activate Job'}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    <Power className={`w-4 h-4 ${job.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </button>

                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    title="Delete Job"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
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
