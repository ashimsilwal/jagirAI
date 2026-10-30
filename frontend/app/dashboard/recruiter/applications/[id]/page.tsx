'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, Application, getMediaUrl, hasPermission } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { 
  ArrowLeft, 
  ExternalLink, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Award, 
  AlertCircle, 
  ShieldAlert, 
  Check, 
  Building2, 
  Calendar,
  Sparkles,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

const STATUS_OPTIONS: Array<{
  value: Application['status'];
  label: string;
  badgeStyle: string;
  activeBtnStyle: string;
  description: string;
}> = [
  {
    value: 'APPLIED',
    label: 'Applied',
    badgeStyle: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800',
    activeBtnStyle: 'bg-amber-600 text-white ring-amber-500',
    description: 'Initial submission pending review by hiring team',
  },
  {
    value: 'SHORTLISTED',
    label: 'Shortlisted',
    badgeStyle: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800',
    activeBtnStyle: 'bg-purple-600 text-white ring-purple-500',
    description: 'Candidate matches key requirements and advanced to shortlist',
  },
  {
    value: 'INTERVIEW',
    label: 'Interview',
    badgeStyle: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800',
    activeBtnStyle: 'bg-blue-600 text-white ring-blue-500',
    description: 'Candidate scheduled or currently in interview rounds',
  },
  {
    value: 'HIRED',
    label: 'Hired',
    badgeStyle: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800',
    activeBtnStyle: 'bg-emerald-600 text-white ring-emerald-500',
    description: 'Job offer extended and accepted for this role',
  },
  {
    value: 'REJECTED',
    label: 'Rejected',
    badgeStyle: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800',
    activeBtnStyle: 'bg-rose-600 text-white ring-rose-500',
    description: 'Candidate not proceeding further in the hiring pipeline',
  },
];

function getInitials(name?: string): string {
  if (!name) return 'CA';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const canViewApplications = hasPermission(user, 'application.view');
  const canUpdateStatus = hasPermission(user, 'application.update_status');

  const fetchApplicationDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Application>(`/applications/${id}/`);
      setApplication(data);
    } catch (err: any) {
      console.error('Failed to load application details:', err);
      setError(err?.message || 'Unable to load application details or access is restricted.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewApplications) {
      fetchApplicationDetail();
    } else {
      setLoading(false);
    }
  }, [id, canViewApplications]);

  const handleStatusChange = async (newStatus: Application['status']) => {
    if (!application || application.status === newStatus || statusUpdating) return;
    if (!canUpdateStatus) {
      setError('You do not have permission to update candidate status.');
      return;
    }

    setStatusUpdating(true);
    setSuccessMessage('');
    setError('');

    try {
      await apiFetch(`/applications/${application.id}/status/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setApplication((prev) => (prev ? { ...prev, status: newStatus } : null));
      const statusObj = STATUS_OPTIONS.find((s) => s.value === newStatus);
      const successMsg = `Application status successfully updated to "${statusObj?.label || newStatus}".`;
      setSuccessMessage(successMsg);
      toast.success(successMsg, 'Status Saved');
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      const errMsg = err?.message || 'Failed to update candidate application status.';
      setError(errMsg);
      toast.error(errMsg, 'Save Failed');
    } finally {
      setStatusUpdating(false);
    }
  };

  const resumeUrl = useMemo(() => {
    if (!application) return null;
    const raw = application.resume || application.applicant_profile?.resume;
    return raw ? getMediaUrl(raw) || raw : null;
  }, [application]);

  const resumeFileName = useMemo(() => {
    if (!resumeUrl) return 'Resume Document';
    try {
      const cleanUrl = resumeUrl.split('?')[0].split('#')[0];
      const parts = cleanUrl.split('/');
      const raw = parts[parts.length - 1];
      return decodeURIComponent(raw) || 'Resume.pdf';
    } catch {
      return 'Resume.pdf';
    }
  }, [resumeUrl]);

  const isResumePdf = useMemo(() => {
    if (!resumeUrl) return false;
    const cleanUrl = resumeUrl.split('?')[0].split('#')[0].toLowerCase();
    return cleanUrl.endsWith('.pdf');
  }, [resumeUrl]);

  // Blob Object URL to ensure 100% same-origin preview inside the iframe
  const [blobPdfUrl, setBlobPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    if (!resumeUrl || !isResumePdf) {
      setBlobPdfUrl(null);
      return;
    }

    let active = true;
    setPdfLoading(true);
    setPdfError(false);

    fetch(resumeUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        const objectUrl = URL.createObjectURL(blob);
        setBlobPdfUrl(objectUrl);
        setPdfLoading(false);
      })
      .catch((err) => {
        console.warn('PDF blob load failed, falling back to direct URL:', err);
        if (active) {
          setPdfError(true);
          setPdfLoading(false);
        }
      });

    return () => {
      active = false;
      if (blobPdfUrl) {
        URL.revokeObjectURL(blobPdfUrl);
      }
    };
  }, [resumeUrl, isResumePdf]);

  const candidateDisplayName = useMemo(() => {
    return application?.applicant?.username || 'Applicant';
  }, [application]);

  const candidateAvatar = useMemo(() => {
    return application?.applicant_profile?.profile_picture || application?.applicant?.profile_picture;
  }, [application]);

  const skillsList = useMemo(() => {
    const raw = application?.applicant_profile?.skills;
    if (!raw) return [];
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }, [application?.applicant_profile?.skills]);

  // Access check
  if (!canViewApplications) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-8 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-amber-900 dark:text-amber-200">
            Candidate Review Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 max-w-md mx-auto leading-relaxed">
            Your account permissions do not allow viewing applicant submissions. Please contact your organization administrator if you need candidate review access.
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="h-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800" />
            <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800" />
          </div>
          <div className="lg:col-span-5">
            <div className="h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !application) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-600 dark:text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-rose-900 dark:text-rose-200">
            Unable to Load Application
          </h2>
          <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 max-w-md mx-auto leading-relaxed">
            {error}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={fetchApplicationDetail}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
            <Link
              href="/dashboard/recruiter"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const currentStatusConfig = STATUS_OPTIONS.find((s) => s.value === application.status) || STATUS_OPTIONS[0];

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
      
      {/* 1. TOP BREADCRUMB & BACK NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-wrap">
          <Link
            href="/dashboard/recruiter"
            className="hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          {application.job?.id && (
            <>
              <Link
                href={`/dashboard/recruiter/jobs/${application.job.id}/applicants`}
                className="hover:text-sky-600 dark:hover:text-sky-400 transition truncate max-w-[200px]"
                title={application.job.title}
              >
                {application.job.title} Applicants
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            </>
          )}
          <span className="font-semibold text-slate-900 dark:text-white">
            Application #{application.id} ({candidateDisplayName})
          </span>
        </div>

        {application.job?.id && (
          <Link
            href={`/jobs/${application.job.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition"
          >
            <span>View Job Posting</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* FEEDBACK BANNERS */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 dark:text-emerald-400 hover:underline text-[11px] font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-rose-700 dark:text-rose-400 hover:underline text-[11px] font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. HERO APPLICANT & PIPELINE STATUS CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Applicant Meta Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl shrink-0 shadow-md border-2 border-slate-100 dark:border-slate-800">
              {candidateAvatar ? (
                <img
                  src={getMediaUrl(candidateAvatar) || ''}
                  alt={candidateDisplayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(candidateDisplayName)}</span>
              )}
            </div>

            {/* Info Details */}
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {candidateDisplayName}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${currentStatusConfig.badgeStyle}`}>
                  {currentStatusConfig.label}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                <Briefcase className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Applying for:</span>
                <span className="font-bold text-slate-900 dark:text-white">{application.job?.title}</span>
                {application.job?.employment_type && (
                  <span className="text-slate-400 text-xs">({application.job.employment_type.replace('_', ' ')})</span>
                )}
              </p>

              {/* Contact Chips */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1.5">
                {application.applicant?.email && (
                  <a
                    href={`mailto:${application.applicant.email}`}
                    className="flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400 transition"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{application.applicant.email}</span>
                  </a>
                )}

                {application.applicant_profile?.phone && (
                  <a
                    href={`tel:${application.applicant_profile.phone}`}
                    className="flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400 transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{application.applicant_profile.phone}</span>
                  </a>
                )}

                {application.applicant_profile?.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{application.applicant_profile.location}</span>
                  </span>
                )}

                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Applied on {new Date(application.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick CV Action */}
          {resumeUrl && (
            <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full md:w-auto shrink-0">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
              >
                <FileText className="w-4 h-4" />
                <span>Open CV in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>
          )}
        </div>

        {/* 3. RECRUITER STATUS MANAGEMENT BAR */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Application Review Status
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update the hiring stage for this candidate. Changes immediately notify the applicant and reflect in reporting.
              </p>
            </div>

            {statusUpdating && (
              <span className="text-xs font-medium text-sky-600 dark:text-sky-400 flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Updating stage...
              </span>
            )}
          </div>

          {/* Status Buttons Segment */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {STATUS_OPTIONS.map((statusItem) => {
              const isSelected = application.status === statusItem.value;
              return (
                <button
                  key={statusItem.value}
                  type="button"
                  disabled={statusUpdating || !canUpdateStatus}
                  onClick={() => handleStatusChange(statusItem.value)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/60 shadow-sm ring-1 ring-sky-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold ${isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      {statusItem.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-tight">
                    {statusItem.description}
                  </span>
                </button>
              );
            })}
          </div>

          {!canUpdateStatus && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
              * Your role has read-only access to applicant records; status changes are restricted.
            </p>
          )}
        </div>
      </div>

      {/* 4. MAIN DETAILS & CV VIEWER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN: CANDIDATE COVER LETTER, BIOGRAPHY & PROFILE (7 COLS) */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Cover Letter Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-7 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                <span>Candidate Cover Letter</span>
              </h3>
              <span className="text-xs text-slate-400">
                Submitted with application
              </span>
            </div>

            {application.cover_letter ? (
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                {application.cover_letter}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                No personalized cover letter attached with this submission.
              </div>
            )}
          </div>

          {/* Profile Description / Bio Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-7 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-sky-500" />
                <span>Professional Description</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Summary provided by {candidateDisplayName} on their platform profile
              </p>
            </div>

            {application.applicant_profile?.bio ? (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {application.applicant_profile.bio}
              </p>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                No professional biography written on the candidate profile.
              </p>
            )}
          </div>

          {/* Candidate Skills Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-7 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-500" />
                <span>Skills & Expertise ({skillsList.length})</span>
              </h3>
            </div>

            {skillsList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                No specific skills tags listed on candidate profile.
              </p>
            )}
          </div>

          {/* Work Experience Card */}
          {application.applicant_profile?.experience && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-7 space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-sky-500" />
                  <span>Work Experience</span>
                </h3>
              </div>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {application.applicant_profile.experience}
              </div>
            </div>
          )}

          {/* Education Card */}
          {application.applicant_profile?.education && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-7 space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-sky-500" />
                  <span>Education & Credentials</span>
                </h3>
              </div>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {application.applicant_profile.education}
              </div>
            </div>
          )}

          {/* Target Vacancy Context Card */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-sky-500" />
              <span>Target Role Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Position Title:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {application.job?.title}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Employment Type:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {application.job?.employment_type ? application.job.employment_type.replace('_', ' ') : 'Full Time'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Job Location:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {application.job?.location || 'Remote / Office'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Salary:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {application.job?.salary || 'Competitive / Negotiable'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: RESUME / CV VIEWER & ACTIONS (5 COLS)                */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
            
            {/* CV Header Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate" title={resumeFileName}>
                    {resumeFileName}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Candidate Resume & Credentials
                  </p>
                </div>
              </div>

              {resumeUrl && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                    title="Open CV in New Tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <a
                    href={resumeUrl}
                    download={resumeFileName}
                    className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition shadow-xs"
                    title="Download CV"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* CV Viewer Body */}
            <div className="p-4 sm:p-5 space-y-4">
              {resumeUrl ? (
                <>
                  {isResumePdf ? (
                    <div className="space-y-3">
                      {pdfLoading ? (
                        <div className="w-full h-[580px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-3 text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
                          <span className="text-xs font-medium">Loading CV document preview...</span>
                        </div>
                      ) : (
                        <div className="relative w-full h-[580px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white overflow-hidden shadow-inner">
                          <iframe
                            key={blobPdfUrl || resumeUrl}
                            src={blobPdfUrl || resumeUrl}
                            className="w-full h-full border-0"
                            title={`Resume: ${candidateDisplayName}`}
                          />
                        </div>
                      )}

                      {/* <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <span>Inline PDF document viewer</span>
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>Full Screen Tab</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div> */}
                      
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {resumeFileName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                          This document is stored as a Word / OpenDocument file. Browsers do not inline-render Word files.
                        </p>
                      </div>
                      <div className="pt-2 flex flex-col gap-2">
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={resumeFileName}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download & Open Document</span>
                        </a>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No Resume Attached
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                    The candidate did not attach a resume document with this application submission.
                  </p>
                </div>
              )}
            </div>

            {/* CV Footer Quick Actions */}
            {resumeUrl && (
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Ready to review full profile?
                </span>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>Open CV Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
