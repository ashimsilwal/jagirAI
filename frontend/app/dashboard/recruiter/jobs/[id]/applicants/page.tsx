'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, Application, Job } from '@/lib/api';
import { 
  Users, 
  ArrowLeft, 
  FileText, 
  MapPin, 
  Mail, 
  Phone, 
  Clock,
  Briefcase
} from 'lucide-react';

function getInitials(name: string): string {
  if (!name) return 'CA';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function JobApplicantsPage() {
  const { id } = useParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  const fetchApplicants = async () => {
    try {
      // Load Job info
      const jobData = await apiFetch<Job>(`/jobs/${id}/`);
      setJob(jobData);

      // Load Applicants
      const data = await apiFetch<any>(`/applications/job/${id}/`);
      const list = Array.isArray(data) ? data : data.results || [];
      setApplications(list);
    } catch (err) {
      console.error('Failed to load applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchApplicants();
    }
  }, [id]);

  const handleStatusChange = async (appId: number, newStatus: string) => {
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
      <Link
        href="/dashboard/recruiter"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Recruiter Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 px-2.5 py-0.5 rounded-md border border-sky-100 dark:border-sky-900/60">
            Candidates Review
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5">
            Applicants for "{job?.title || 'Job'}"
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {applications.length} {applications.length === 1 ? 'candidate' : 'candidates'} applied for this position
          </p>
        </div>

        <Link
          href={`/jobs/${id}`}
          className="px-4 py-2 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 transition"
        >
          View Public Post
        </Link>
      </div>

      {/* Candidate List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 p-6" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No applicants yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Candidates haven't submitted applications for this vacancy yet. Ensure your job is marked as Active so it appears in searches.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const candidateName = app.applicant.username || 'Candidate';
            const resumeUrl = app.resume || app.applicant_profile?.resume;
            const skillsList = app.applicant_profile?.skills 
              ? app.applicant_profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
              : [];

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4 hover:border-sky-300 dark:hover:border-sky-600/70 transition"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-slate-100 dark:border-slate-800 border-b">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-md bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      {getInitials(candidateName)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {candidateName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
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

                  {/* Status selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
                    <select
                      value={app.status}
                      disabled={statusUpdating === app.id}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
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

                {/* Skills */}
                {skillsList.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Candidate Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {skillsList.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {app.cover_letter && (
                  <div className="space-y-1 text-xs">
                    <span className="font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Cover Letter:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-md border border-slate-200/60 dark:border-slate-700 leading-relaxed whitespace-pre-line">
                      {app.cover_letter}
                    </p>
                  </div>
                )}

                {/* Resume download */}
                <div className="pt-2 flex justify-between items-center text-xs">
                  <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Applied on {new Date(app.applied_at).toLocaleDateString()}
                  </span>

                  {resumeUrl ? (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-100 dark:border-sky-800 transition"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Download / View Resume</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic">No resume attached</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
