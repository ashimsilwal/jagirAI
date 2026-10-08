'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, Job } from '@/lib/api';
import { 
  Building2, 
  MapPin, 
  Banknote, 
  Calendar, 
  Briefcase, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  FileUp, 
  ArrowLeft,
  Users
} from 'lucide-react';

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Application Form State
  const [coverLetter, setCoverLetter] = useState('');
  const [customResume, setCustomResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await apiFetch<Job>(`/jobs/${id}/`);
        setJob(data);
      } catch (err: any) {
        setError('Failed to load job details. The job may no longer be available.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('job', String(id));
      if (coverLetter) {
        formData.append('cover_letter', coverLetter);
      }
      if (customResume) {
        formData.append('resume', customResume);
      }

      await apiFetch('/applications/', {
        method: 'POST',
        body: formData,
      });

      setApplySuccess(true);
    } catch (err: any) {
      const errorMsg =
        err.data?.non_field_errors?.[0] ||
        err.data?.resume?.[0] ||
        err.data?.job?.[0] ||
        err.data?.detail ||
        err.message ||
        'Failed to submit application.';
      setApplyError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-1/4" />
        <div className="h-64 bg-slate-100 rounded-lg" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Job Not Found</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{error || 'This vacancy does not exist.'}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-sky-600 hover:text-sky-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
      </div>
    );
  }

  const isOwnerRecruiter = user?.role === 'JOB_RECRUITER' && user.id === job.recruiter.id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job Overview & Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div>
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span>{job.company_name}</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded text-xs font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/60">
                  {job.employment_type.replace('_', ' ')}
                </span>
              </div>

              {/* Key metadata chips */}
              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-350">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{job.location}</span>
                </div>
                {job.salary && (
                  <div className="flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{job.salary}</span>
                  </div>
                )}
                {job.deadline && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Apply before: {new Date(job.deadline).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                About The Role
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && (
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Key Responsibilities
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {job.responsibilities}
                </p>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Requirements & Qualifications
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {job.requirements}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Application Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-xs sticky top-24 space-y-5">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Apply for this Job</h3>

            {isOwnerRecruiter ? (
              <div className="p-4 bg-sky-50 dark:bg-sky-950/50 rounded-md space-y-3 text-sm border border-sky-100 dark:border-sky-900/60">
                <p className="text-sky-950 dark:text-sky-200 font-medium">You posted this job.</p>
                <Link
                  href={`/dashboard/recruiter/jobs/${job.id}/applicants`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm shadow-sky-100"
                >
                  <Users className="w-4 h-4" />
                  View Applicants
                </Link>
              </div>
            ) : applySuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-md text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">Application Submitted!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  The recruiter will review your profile and contact you soon.
                </p>
                <Link
                  href="/dashboard/seeker"
                  className="inline-block mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 underline"
                >
                  Track in My Applications
                </Link>
              </div>
            ) : user?.role === 'JOB_SEEKER' ? (
              <form onSubmit={handleApply} className="space-y-4">
                {applyError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-md text-rose-800 dark:text-rose-200 text-xs flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Briefly introduce yourself and why you're a great fit..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Custom Resume (PDF/Word, optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-300 rounded-md text-xs text-slate-600 dark:text-slate-300 hover:text-sky-600 cursor-pointer bg-slate-50 dark:bg-slate-800/60 transition">
                      <FileUp className="w-4 h-4" />
                      <span className="truncate">
                        {customResume ? customResume.name : 'Upload New Resume'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setCustomResume(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    If omitted, the resume from your Job Seeker profile will be sent automatically.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-md shadow-sky-200 dark:shadow-none cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </form>
            ) : user?.role === 'JOB_RECRUITER' ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-md text-xs text-slate-600 dark:text-slate-350">
                You are currently signed in as a Recruiter. Only Job Seekers can apply for jobs.
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-350">
                  Please sign in or create an account to apply for this vacancy.
                </p>
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm shadow-sky-100"
                >
                  Sign In to Apply
                </Link>
                <Link
                  href="/register"
                  className="block text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Don't have an account? Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
