'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, Application, Job } from '@/lib/api';
import { 
  Users, 
  ArrowLeft, 
  FileText, 
  Download, 
  MapPin, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Briefcase
} from 'lucide-react';

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

      // Update in state
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
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Recruiter Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Candidates Review
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Applicants for "{job?.title || 'Job'}"
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {applications.length} {applications.length === 1 ? 'candidate' : 'candidates'} applied for this position
          </p>
        </div>

        <Link
          href={`/jobs/${id}`}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
        >
          View Public Post
        </Link>
      </div>

      {/* Candidate List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-slate-100 p-6" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No applicants yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Candidates haven't submitted applications for this vacancy yet. Ensure your job is marked as Active so it appears in searches.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 hover:border-indigo-200 transition"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {app.applicant.username}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
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

                {/* Status selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Status:</span>
                  <select
                    value={app.status}
                    disabled={statusUpdating === app.id}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="HIRED">Hired</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Skills */}
              {app.applicant_profile?.skills && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Candidate Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {app.applicant_profile.skills.split(',').map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {app.cover_letter && (
                <div className="space-y-1 text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-400">
                    Cover Letter:
                  </span>
                  <p className="text-slate-700 p-3 bg-slate-50 rounded-xl leading-relaxed whitespace-pre-line">
                    {app.cover_letter}
                  </p>
                </div>
              )}

              {/* Resume download */}
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-slate-400">
                  Applied on {new Date(app.applied_at).toLocaleDateString()}
                </span>

                {app.resume ? (
                  <a
                    href={app.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download / View Resume</span>
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No resume attached</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
