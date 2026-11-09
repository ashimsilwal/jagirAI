'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch, Job, JobSeekerProfile, getMediaUrl } from '@/lib/api';
import JobLocationMapView from '@/components/JobLocationMapView';
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
  Users,
  Share2,
  Bookmark,
  Check,
  Clock,
  FileText,
  Pencil,
  ShieldCheck,
  ExternalLink,
  Lock,
  Sparkles,
  Download,
  RefreshCw,
  RotateCcw
} from 'lucide-react';

const COMMON_TECH_KEYWORDS = [
  'React', 'Next.js', 'Vue', 'Angular', 'Svelte',
  'Node.js', 'Express', 'Django', 'Flask', 'FastAPI',
  'Python', 'TypeScript', 'JavaScript', 'Java', 'Kotlin', 'Go', 'Golang', 'Rust', 'C++', 'C#', '.NET', 'PHP', 'Ruby', 'Rails', 'Swift',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQL', 'GraphQL', 'REST API',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
  'Tailwind CSS', 'Tailwind', 'CSS', 'HTML', 'Figma', 'UI/UX',
  'Machine Learning', 'AI', 'NLP', 'Data Science', 'Pandas', 'PyTorch', 'TensorFlow',
  'Microservices', 'Linux', 'DevOps'
];

const AVATAR_PALETTES = [
  'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200/70 dark:border-sky-800',
  'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800',
  'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800',
  'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200/70 dark:border-cyan-800',
  'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-200/70 dark:border-teal-800',
];

function getCompanyPalette(name?: string): string {
  if (!name) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getCompanyInitials(name?: string): string {
  if (!name) return 'CO';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatEmploymentType(type?: string): string {
  switch (type) {
    case 'FULL_TIME': return 'Full-Time';
    case 'PART_TIME': return 'Part-Time';
    case 'CONTRACT': return 'Contract';
    case 'INTERNSHIP': return 'Internship';
    case 'REMOTE': return 'Remote';
    default: return type ? type.replace(/_/g, ' ') : 'Full-Time';
  }
}

function getEmploymentTypeColor(type?: string): string {
  switch (type) {
    case 'FULL_TIME': return 'bg-sky-500';
    case 'REMOTE': return 'bg-emerald-500';
    case 'CONTRACT': return 'bg-amber-500';
    case 'INTERNSHIP': return 'bg-purple-500';
    case 'PART_TIME': return 'bg-indigo-500';
    default: return 'bg-sky-500';
  }
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function extractSkills(job: Job): string[] {
  const text = `${job.title} ${job.description || ''} ${job.requirements || ''} ${job.responsibilities || ''}`;
  const found = new Set<string>();
  COMMON_TECH_KEYWORDS.forEach((kw) => {
    const regex = new RegExp(`\\b${kw.replace('+', '\\+')}\\b`, 'i');
    if (regex.test(text)) {
      found.add(kw);
    }
  });
  return Array.from(found).slice(0, 8);
}

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoError, setLogoError] = useState(false);

  // Bookmarking & Sharing State
  const [saved, setSaved] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Application Form State
  const [coverLetter, setCoverLetter] = useState('');
  const [customResume, setCustomResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');

  // Seeker profile & CV rendering state
  const [seekerProfile, setSeekerProfile] = useState<JobSeekerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [blobPdfUrl, setBlobPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'JOB_SEEKER') {
      setLoadingProfile(true);
      apiFetch<JobSeekerProfile>('/profile/job-seeker/')
        .then((data) => {
          setSeekerProfile(data);
        })
        .catch((err) => {
          console.warn('Failed to load seeker profile:', err);
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    }
  }, [user]);

  // Determine active CV to display & submit
  const activeResumeInfo = useMemo(() => {
    if (customResume) {
      const isPdf = customResume.type === 'application/pdf' || customResume.name.toLowerCase().endsWith('.pdf');
      const isDoc = customResume.name.toLowerCase().endsWith('.doc') || customResume.name.toLowerCase().endsWith('.docx');
      return {
        url: URL.createObjectURL(customResume),
        fileName: customResume.name,
        isCustom: true,
        isPdf,
        isDoc,
      };
    }
    if (seekerProfile?.resume) {
      const fullUrl = getMediaUrl(seekerProfile.resume) || '';
      const cleanUrl = seekerProfile.resume.split('?')[0].split('#')[0];
      const rawName = cleanUrl.split('/').pop() || 'Profile_Resume.pdf';
      const fileName = decodeURIComponent(rawName);
      const isPdf = cleanUrl.toLowerCase().endsWith('.pdf');
      const isDoc = cleanUrl.toLowerCase().endsWith('.doc') || cleanUrl.toLowerCase().endsWith('.docx');
      return {
        url: fullUrl,
        fileName,
        isCustom: false,
        isPdf,
        isDoc,
      };
    }
    return null;
  }, [customResume, seekerProfile?.resume]);

  // Load PDF as blob for clean embedding
  useEffect(() => {
    if (!activeResumeInfo || !activeResumeInfo.isPdf) {
      setBlobPdfUrl(null);
      return;
    }

    if (activeResumeInfo.isCustom) {
      setBlobPdfUrl(activeResumeInfo.url);
      setPdfLoading(false);
      return;
    }

    let active = true;
    setPdfLoading(true);

    fetch(activeResumeInfo.url)
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
          setBlobPdfUrl(activeResumeInfo.url);
          setPdfLoading(false);
        }
      });

    return () => {
      active = false;
      if (blobPdfUrl && !activeResumeInfo.isCustom) {
        URL.revokeObjectURL(blobPdfUrl);
      }
    };
  }, [activeResumeInfo]);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await apiFetch<Job>(`/jobs/${id}/`);
        setJob(data);
      } catch (err: any) {
        setError('Failed to load job details. The vacancy may no longer be available.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id]);

  // Check saved jobs in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      try {
        const savedIds: number[] = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
        setSaved(savedIds.includes(Number(id)));
      } catch {
        // ignore
      }
    }
  }, [id]);

  // Check if current user has already applied
  useEffect(() => {
    if (user?.role === 'JOB_SEEKER' && id) {
      apiFetch<any>('/applications/my-applications/')
        .then((data) => {
          const list = Array.isArray(data) ? data : data.results || [];
          const hasApplied = list.some((app: any) => (app.job?.id || app.job) === Number(id));
          if (hasApplied) {
            setAlreadyApplied(true);
          }
        })
        .catch(() => {});
    }
  }, [user, id]);

  const handleBookmarkToggle = () => {
    if (!id) return;
    try {
      const savedIds: number[] = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
      let updated: number[];
      if (saved) {
        updated = savedIds.filter(num => num !== Number(id));
        setSaved(false);
      } else {
        updated = [...savedIds, Number(id)];
        setSaved(true);
      }
      localStorage.setItem('saved_jobs', JSON.stringify(updated));
    } catch {
      setSaved(!saved);
    }
  };

  const handleShareVacancy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const scrollToApply = () => {
    const section = document.getElementById('apply-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('job', String(id));
      if (coverLetter.trim()) {
        formData.append('cover_letter', coverLetter.trim());
      }
      if (customResume) {
        formData.append('resume', customResume);
      }

      await apiFetch('/applications/', {
        method: 'POST',
        body: formData,
      });

      setApplySuccess(true);
      setAlreadyApplied(true);
      toast.success('Your job application has been submitted successfully!', 'Application Sent');
    } catch (err: any) {
      const errorMsg =
        err.data?.non_field_errors?.[0] ||
        err.data?.resume?.[0] ||
        err.data?.job?.[0] ||
        err.data?.detail ||
        err.message ||
        'Failed to submit application.';
      setApplyError(errorMsg);
      toast.error(errorMsg, 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const skills = useMemo(() => {
    return job ? extractSkills(job) : [];
  }, [job]);

  const palette = useMemo(() => {
    return getCompanyPalette(job?.company_name);
  }, [job?.company_name]);

  const initials = useMemo(() => {
    return getCompanyInitials(job?.company_name);
  }, [job?.company_name]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-36" />
        <div className="h-48 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-80 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800" />
            <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800" />
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/60 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Vacancy Not Found</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {error || 'This job vacancy is no longer accepting applications or has been closed.'}
        </p>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Available Vacancies</span>
        </Link>
      </div>
    );
  }

  const isOwnerRecruiter = user?.role === 'JOB_RECRUITER' && user.id === job.recruiter.id;

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
      {/* 1. TOP BREADCRUMB & QUICK ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vacancies</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleShareVacancy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
            title="Share vacancy link"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Share</span>
              </>
            )}
          </button>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleBookmarkToggle}
            aria-label={saved ? 'Remove bookmark' : 'Bookmark vacancy'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer shadow-xs ${
              saved
                ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-sky-600 dark:fill-sky-400' : 'text-slate-400'}`} />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* 2. HERO VACANCY HEADER BANNER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
            {/* Company Logo / Avatar */}
            <div className="relative shrink-0">
              {job.company_logo && !logoError ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-2 flex items-center justify-center overflow-hidden shadow-xs">
                  <img
                    src={getMediaUrl(job.company_logo) || ''}
                    alt={`${job.company_name} logo`}
                    className="w-full h-full object-contain rounded-xl"
                    onError={() => setLogoError(true)}
                  />
                </div>
              ) : (
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border flex items-center justify-center font-extrabold text-xl sm:text-2xl tracking-wider shadow-inner ${palette}`}>
                  {initials}
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight break-words">
                  {job.title}
                </h1>
                {job.status === 'ACTIVE' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Actively Hiring</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1 text-slate-900 dark:text-slate-100 font-semibold">
                  <Building2 className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>{job.company_name}</span>
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Organization</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header CTA */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 self-stretch md:self-auto justify-end">
            {isOwnerRecruiter ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/dashboard/recruiter/jobs?edit=${job.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/60 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-700 font-semibold text-xs sm:text-sm shadow-xs transition"
                >
                  <Pencil className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Edit Vacancy</span>
                </Link>
                <Link
                  href={`/dashboard/recruiter/jobs/${job.id}/applicants`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
                >
                  <Users className="w-4 h-4" />
                  <span>Review Applicants</span>
                </Link>
              </div>
            ) : alreadyApplied ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Application Submitted</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={scrollToApply}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Apply for this Position</span>
              </button>
            )}
          </div>
        </div>

        {/* Key Attribute Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{job.location}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/60 font-medium">
            <span className={`w-2 h-2 rounded-full ${getEmploymentTypeColor(job.employment_type)}`} />
            <span>{formatEmploymentType(job.employment_type)}</span>
          </div>

          {job.salary && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60 font-semibold">
              <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{job.salary}</span>
            </div>
          )}

          {job.created_at && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5" />
              <span>Posted {formatDate(job.created_at)}</span>
            </div>
          )}

          {job.deadline && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Apply before: {formatDate(job.deadline)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN TWO-COLUMN CONTENT CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN: ROLE SPECIFICATIONS & APPLICATION FORM               */}
        {/* ================================================================= */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          
          {/* Role Overview */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Briefcase className="w-4 h-4 text-sky-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Role Overview
              </h2>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans">
              {job.description}
            </p>
          </div>

          {/* Key Responsibilities */}
          {job.responsibilities && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Key Responsibilities
                </h2>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {job.responsibilities}
              </div>
            </div>
          )}

          {/* Requirements & Qualifications */}
          {job.requirements && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <FileText className="w-4 h-4 text-indigo-500" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Requirements & Qualifications
                </h2>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {job.requirements}
              </div>
            </div>
          )}

          {/* Skills & Technologies Tags */}
          {skills.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Tech Stack & Skill Highlights
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Workplace Map Location */}
          {job.latitude && job.longitude && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-500" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Office & Workplace Location
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">{job.location}</span>
              </div>

              <JobLocationMapView
                latitude={job.latitude}
                longitude={job.longitude}
                locationName={job.location}
                companyName={job.company_name}
                jobTitle={job.title}
                className="h-64 sm:h-80"
              />
            </div>
          )}

          {/* 4. IN-PAGE APPLICATION FORM CARD */}
          <div id="apply-section" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5 scroll-mt-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-500" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Submit Candidate Application
                </h2>
              </div>
              <span className="text-xs text-slate-400">Position #{job.id}</span>
            </div>

            {isOwnerRecruiter ? (
              <div className="p-5 bg-sky-50 dark:bg-sky-950/50 rounded-xl space-y-3 text-sm border border-sky-100 dark:border-sky-900/60">
                <p className="text-sky-950 dark:text-sky-200 font-semibold">
                  You are the hiring manager who published this vacancy.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  You can review incoming candidate applications, filter resumes, and update hiring pipeline stages in your recruiter workspace.
                </p>
                <Link
                  href={`/dashboard/recruiter/jobs/${job.id}/applicants`}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm"
                >
                  <Users className="w-4 h-4" />
                  <span>View All Received Applicants</span>
                </Link>
              </div>
            ) : applySuccess || alreadyApplied ? (
              <div role="status" aria-live="polite" className="p-6 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center space-y-2.5">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-emerald-950 dark:text-emerald-100 text-base">
                  Application Submitted Successfully!
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
                  The hiring team at {job.company_name} has received your profile and resume. You will receive notifications as your application moves through review stages.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard/seeker"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 underline hover:text-emerald-900"
                  >
                    <span>Track Status in My Applications</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : user?.role === 'JOB_SEEKER' ? (
              <form onSubmit={handleApply} className="space-y-5">
                {applyError && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{applyError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="cover-letter"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    id="cover-letter"
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Introduce yourself, your recent work, and why you are excited about this position at {job.company_name}..."
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition leading-relaxed"
                  />
                </div>

                {/* CV / Resume Section with Automatic Rendering */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Candidate Curriculum Vitae (CV)
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {activeResumeInfo?.isCustom ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">Custom Uploaded CV</span>
                      ) : activeResumeInfo ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Auto-Loaded from Profile</span>
                      ) : (
                        <span className="font-semibold text-rose-500">No CV attached</span>
                      )}
                    </span>
                  </div>

                  {activeResumeInfo ? (
                    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs space-y-0">
                      {/* CV Header Bar */}
                      <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate" title={activeResumeInfo.fileName}>
                              {activeResumeInfo.fileName}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {activeResumeInfo.isCustom
                                ? 'Custom resume uploaded for this vacancy'
                                : 'Active resume saved in your Job Seeker profile'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {activeResumeInfo.isCustom && seekerProfile?.resume && (
                            <button
                              type="button"
                              onClick={() => setCustomResume(null)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
                              title="Revert to your profile resume"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Use Profile CV</span>
                            </button>
                          )}

                          <label
                            htmlFor="custom-resume"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200/80 dark:border-sky-800 transition flex items-center gap-1 cursor-pointer"
                          >
                            <FileUp className="w-3.5 h-3.5" />
                            <span>Upload Different CV</span>
                            <input
                              id="custom-resume"
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => setCustomResume(e.target.files?.[0] || null)}
                              className="sr-only"
                            />
                          </label>

                          <a
                            href={activeResumeInfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {/* Rendered CV Preview Box */}
                      <div className="p-3 sm:p-4">
                        {activeResumeInfo.isPdf ? (
                          <div className="space-y-2">
                            {pdfLoading ? (
                              <div className="w-full h-[450px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-2 text-slate-500">
                                <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
                                <span className="text-xs font-medium">Rendering CV preview...</span>
                              </div>
                            ) : (
                              <div className="relative w-full h-[480px] sm:h-[540px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white overflow-hidden shadow-inner">
                                <iframe
                                  key={blobPdfUrl || activeResumeInfo.url}
                                  src={blobPdfUrl || activeResumeInfo.url}
                                  className="w-full h-full border-0"
                                  title={`CV Preview: ${activeResumeInfo.fileName}`}
                                />
                              </div>
                            )}
                            <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>This CV will be submitted with your application.</span>
                              </span>
                              <a
                                href={activeResumeInfo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1"
                              >
                                <span>Fullscreen</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ) : activeResumeInfo.isDoc ? (
                          <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {activeResumeInfo.fileName}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Word document (.docx/.doc) attached. This will be sent directly to the employer.
                              </p>
                            </div>
                            <div className="pt-1">
                              <a
                                href={activeResumeInfo.url}
                                download={activeResumeInfo.fileName}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition shadow-2xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download to Verify</span>
                              </a>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    /* When user has no CV in profile and hasn't uploaded custom resume */
                    <div className="p-6 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 text-center space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          No CV found in your profile
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                          Please upload your CV (PDF or Word) below, or save one to your Job Seeker profile so employers can review your qualifications.
                        </p>
                      </div>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                        <label
                          htmlFor="custom-resume"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
                        >
                          <FileUp className="w-4 h-4" />
                          <span>Upload CV Document</span>
                          <input
                            id="custom-resume"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setCustomResume(e.target.files?.[0] || null)}
                            className="sr-only"
                          />
                        </label>
                        <Link
                          href="/dashboard/seeker/profile?tab=resume"
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition"
                        >
                          <span>Save CV to Profile</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting Application...' : 'Submit Application Now'}</span>
                  </button>
                </div>
              </form>
            ) : !user ? (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950 flex items-center justify-center mx-auto text-sky-600 dark:text-sky-400">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sign in to apply for this vacancy
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Create a candidate profile or log in with your JagirAI account to submit your application and track responses.
                </p>
                <div className="pt-1">
                  <Link
                    href={`/login?redirect=/jobs/${job.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <span>Sign In as Job Seeker</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                You are currently signed in with a Recruiter account. Candidate applications require a Job Seeker profile.
              </div>
            )}
          </div>

        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: VACANCY SNAPSHOT & HIRING ORGANIZATION               */}
        {/* ================================================================= */}
        <div className="space-y-6 min-w-0">
          
          {/* Vacancy Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sky-500" />
              <span>Vacancy Snapshot</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Vacancy Reference</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">#{job.id}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Position Type</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatEmploymentType(job.employment_type)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Workplace Location</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                  {job.location}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Offered Salary</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]">
                  {job.salary || 'Negotiable'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Application Deadline</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {job.deadline ? formatDate(job.deadline) : 'Open until filled'}
                </span>
              </div>
            </div>
          </div>

          {/* Hiring Organization Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-500" />
              <span>Hiring Organization</span>
            </h3>

            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {job.company_logo && !logoError ? (
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-1 flex items-center justify-center overflow-hidden shadow-xs">
                    <img
                      src={getMediaUrl(job.company_logo) || ''}
                      alt={`${job.company_name} logo`}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-sm tracking-wider shadow-inner ${palette}`}>
                    {initials}
                  </div>
                )}
              </div>

              <div className="space-y-0.5 min-w-0">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {job.company_name}
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Verified Employer</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Official employer partner registered on JagirAI Recruitment Network. All candidate submissions are delivered directly to the recruitment manager.
            </p>

            <div className="pt-1">
              <Link
                href="/jobs"
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-1.5"
              >
                <span>Browse More Vacancies</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Quick Apply Sticky Callout for Non-Applied Seekers */}
          {user?.role === 'JOB_SEEKER' && !alreadyApplied && (
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-sky-50 via-blue-50/60 to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-sky-200/80 dark:border-slate-800 space-y-3">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                  Ready to take the next step?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Fast 1-click submission using your JagirAI verified candidate resume.
                </p>
              </div>
              <button
                type="button"
                onClick={scrollToApply}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                Apply Now →
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
