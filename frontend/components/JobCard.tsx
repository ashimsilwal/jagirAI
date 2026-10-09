'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Job } from '@/lib/api';
import {
  MapPin,
  Briefcase,
  Banknote,
  Clock,
  Building2,
  ArrowRight,
  Bookmark,
  CheckCircle2
} from 'lucide-react';

interface JobCardProps {
  job: Job;
  isApplied?: boolean;
  layout?: 'grid' | 'list';
}

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
  'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700',
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

function formatEmploymentType(type: string): string {
  switch (type) {
    case 'FULL_TIME':
      return 'Full-time';
    case 'PART_TIME':
      return 'Part-time';
    case 'CONTRACT':
      return 'Contract';
    case 'INTERNSHIP':
      return 'Internship';
    case 'REMOTE':
      return 'Remote';
    default:
      return type ? type.replace(/_/g, ' ') : 'Full-time';
  }
}

function formatPostedDate(dateString?: string | null): string {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays <= 0) {
      if (diffHours <= 0) {
        if (diffMin <= 1) return 'Just now';
        return `${diffMin}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks}w ago`;
    }
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months}mo ago`;
  } catch {
    return 'Recently';
  }
}

function extractSkills(job: Job): string[] {
  const extracted: string[] = [];
  const textToScan = `${job.title} ${job.requirements || ''} ${job.description || ''}`;

  // 1. If requirements has comma or bullet separated tokens
  if (job.requirements) {
    const rawItems = job.requirements
      .split(/[,;\n•*–-]/)
      .map(s => s.trim().replace(/^[-•*]\s*/, ''))
      .filter(s => s.length > 1 && s.length <= 20 && !s.includes('.') && !/^(we|you|must|should|have|experience|years|strong|work|ability|knowledge|looking|plus|good)/i.test(s));

    for (const item of rawItems) {
      if (!extracted.some(e => e.toLowerCase() === item.toLowerCase())) {
        if (COMMON_TECH_KEYWORDS.some(k => k.toLowerCase() === item.toLowerCase()) || item.length <= 15) {
          extracted.push(item);
        }
      }
      if (extracted.length >= 4) break;
    }
  }

  // 2. Scan known tech keywords if we have fewer than 3 skills
  if (extracted.length < 3) {
    for (const kw of COMMON_TECH_KEYWORDS) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-zA-Z0-9_#+])${escaped}([^a-zA-Z0-9_#+]|$)`, 'i');
      if (regex.test(textToScan)) {
        if (!extracted.some(e => e.toLowerCase() === kw.toLowerCase())) {
          extracted.push(kw);
        }
      }
      if (extracted.length >= 4) break;
    }
  }

  // 3. Fallback smart tags based on job title / category
  if (extracted.length === 0) {
    if (job.employment_type === 'REMOTE') extracted.push('Remote');
    if (/front\s*end|ui|ux/i.test(job.title)) extracted.push('Frontend', 'UI Design');
    else if (/back\s*end|api/i.test(job.title)) extracted.push('Backend', 'API');
    else if (/full\s*stack/i.test(job.title)) extracted.push('Full Stack');
    else if (/design/i.test(job.title)) extracted.push('Design', 'UI/UX');
    else if (/data/i.test(job.title)) extracted.push('Data', 'Analytics');
    else extracted.push('Communication', 'Problem Solving');
  }

  return extracted.slice(0, 4);
}

export const JobCard: React.FC<JobCardProps> = ({ job, isApplied = false, layout = 'grid' }) => {
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedIds: number[] = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
        setSaved(savedIds.includes(job.id));
      } catch {
        // ignore
      }
    }
  }, [job.id]);

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const savedIds: number[] = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
      let updated: number[];
      if (saved) {
        updated = savedIds.filter(id => id !== job.id);
        setSaved(false);
      } else {
        updated = [...savedIds, job.id];
        setSaved(true);
      }
      localStorage.setItem('saved_jobs', JSON.stringify(updated));
    } catch {
      setSaved(!saved);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    router.push(`/jobs/${job.id}`);
  };

  const skills = extractSkills(job);
  const palette = getCompanyPalette(job.company_name);
  const initials = getCompanyInitials(job.company_name);

  if (layout === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-sky-300/80 dark:hover:border-sky-500/50 p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer"
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Company Avatar / Logo */}
          <div className="relative shrink-0">
            {job.company_logo && !logoError ? (
              <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 p-1 flex items-center justify-center overflow-hidden shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={job.company_logo}
                  alt={`${job.company_name} logo`}
                  className="w-full h-full object-contain rounded-sm"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-lg border flex items-center justify-center font-bold text-sm tracking-wider shadow-sm ${palette}`}>
                {initials}
              </div>
            )}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/jobs/${job.id}`}
                className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1"
              >
                {job.title}
              </Link>
              {isApplied && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Applied</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-slate-800 dark:text-slate-200">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {job.company_name}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {job.location}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-sky-500" />
                {formatEmploymentType(job.employment_type)}
              </span>
              {job.salary && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Banknote className="w-3.5 h-3.5" />
                    {job.salary}
                  </span>
                </>
              )}
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {skills.slice(0, 4).map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatPostedDate(job.created_at)}</span>
            </span>
            <button
              type="button"
              onClick={handleBookmarkToggle}
              aria-label={saved ? 'Remove bookmark' : 'Bookmark job'}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                saved
                  ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-800'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-slate-700 hover:text-sky-600 dark:hover:text-sky-400'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-sky-600 text-sky-600 dark:fill-sky-400 dark:text-sky-400' : ''}`} />
            </button>
          </div>

          <Link
            href={`/jobs/${job.id}`}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm shadow-sky-500/20 transition-all cursor-pointer"
          >
            <span>View Job</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 hover:border-sky-300/80 dark:hover:border-sky-500/50 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-sky-500/8 dark:hover:shadow-sky-500/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div className="space-y-4">
        {/* Top Header Row: Company Logo (Left) & Bookmark / Date (Right) */}
        <div className="flex items-start justify-between gap-3">
          {/* Company Avatar / Logo */}
          <div className="relative">
            {job.company_logo && !logoError ? (
              <div className="w-12 h-12 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:border-sky-200 dark:group-hover:border-sky-500 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={job.company_logo}
                  alt={`${job.company_name} logo`}
                  className="w-full h-full object-contain rounded-sm"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div
                className={`w-12 h-12 rounded-md border flex items-center justify-center font-bold text-sm tracking-wider shadow-sm transition-transform group-hover:scale-105 ${palette}`}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Top Right: Applied badge, Posted Date & Bookmark Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isApplied && (
              <span className="text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                <span>Applied</span>
              </span>
            )}

            <span className="text-xs text-slate-400 dark:text-slate-400 font-medium flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatPostedDate(job.created_at)}</span>
            </span>

            <button
              type="button"
              onClick={handleBookmarkToggle}
              aria-label={saved ? 'Remove bookmark' : 'Bookmark job'}
              title={saved ? 'Bookmarked' : 'Save job'}
              className={`p-2 rounded-md border transition-all duration-200 cursor-pointer ${
                saved
                  ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900'
                  : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-600 hover:bg-sky-50/50 dark:hover:bg-slate-700'
              }`}
            >
              <Bookmark
                className={`w-4 h-4 transition-transform active:scale-90 ${
                  saved ? 'fill-sky-600 text-sky-600 dark:fill-sky-400 dark:text-sky-400' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Job Title & Company */}
        <div className="space-y-1">
          <Link
            href={`/jobs/${job.id}`}
            className="block group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors focus:outline-none"
          >
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1 leading-snug tracking-tight">
              {job.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.company_name}</span>
          </div>
        </div>

        {/* Key Metadata Row: Location, Employment Type, Salary */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {/* Location */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 max-w-[180px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>

          {/* Employment Type */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/60">
            <Briefcase className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>{formatEmploymentType(job.employment_type)}</span>
          </div>

          {/* Salary when available */}
          {job.salary && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60">
              <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">{job.salary}</span>
            </div>
          )}
        </div>

        {/* Short 1–2 Line Job Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {/* Technology / Skill Tags */}
        {skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Action / View Job Button */}
      <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800">
        <Link
          href={`/jobs/${job.id}`}
          className="w-full py-2.5 px-4 rounded-md bg-slate-50 dark:bg-slate-800 group-hover:bg-sky-600 dark:group-hover:bg-sky-600 text-slate-700 dark:text-slate-200 group-hover:text-white dark:group-hover:text-white border border-slate-200/80 dark:border-slate-700 group-hover:border-transparent dark:group-hover:border-transparent text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm group/btn cursor-pointer"
        >
          <span>View Job</span>
          <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
};
