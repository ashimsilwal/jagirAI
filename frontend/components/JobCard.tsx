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
  Bookmark
} from 'lucide-react';

interface JobCardProps {
  job: Job;
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
  'bg-sky-50 text-sky-700 border-sky-200/70',
  'bg-blue-50 text-blue-700 border-blue-200/70',
  'bg-indigo-50 text-indigo-700 border-indigo-200/70',
  'bg-cyan-50 text-cyan-700 border-cyan-200/70',
  'bg-teal-50 text-teal-700 border-teal-200/70',
  'bg-slate-100 text-slate-700 border-slate-200/70',
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

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
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
    // If the user clicked inside a button, link or bookmark, don't trigger outer card navigation
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    router.push(`/jobs/${job.id}`);
  };

  const skills = extractSkills(job);
  const palette = getCompanyPalette(job.company_name);
  const initials = getCompanyInitials(job.company_name);

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300/80 p-5 sm:p-6 shadow-xs hover:shadow-xl hover:shadow-sky-500/8 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div className="space-y-4">
        {/* Top Header Row: Company Logo (Left) & Bookmark / Date (Right) */}
        <div className="flex items-start justify-between gap-3">
          {/* Company Avatar / Logo */}
          <div className="relative">
            {job.company_logo && !logoError ? (
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/70 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group-hover:border-sky-200 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={job.company_logo}
                  alt={`${job.company_name} logo`}
                  className="w-full h-full object-contain rounded-lg"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-sm tracking-wider shadow-2xs transition-transform group-hover:scale-105 ${palette}`}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Top Right: Posted Date & Bookmark Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatPostedDate(job.created_at)}</span>
            </span>

            <button
              type="button"
              onClick={handleBookmarkToggle}
              aria-label={saved ? 'Remove bookmark' : 'Bookmark job'}
              title={saved ? 'Bookmarked' : 'Save job'}
              className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                saved
                  ? 'bg-sky-50 text-sky-600 border-sky-200/80 hover:bg-sky-100'
                  : 'bg-white text-slate-400 border-slate-100 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50/50'
              }`}
            >
              <Bookmark
                className={`w-4 h-4 transition-transform active:scale-90 ${
                  saved ? 'fill-sky-600 text-sky-600' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Job Title & Company */}
        <div className="space-y-1">
          <Link
            href={`/jobs/${job.id}`}
            className="block group-hover:text-sky-600 transition-colors focus:outline-none"
          >
            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1 leading-snug tracking-tight">
              {job.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.company_name}</span>
          </div>
        </div>

        {/* Key Metadata Row: Location, Employment Type, Salary */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {/* Location */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/60 max-w-[180px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>

          {/* Employment Type */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
            <Briefcase className="w-3 h-3 text-sky-600 shrink-0" />
            <span>{formatEmploymentType(job.employment_type)}</span>
          </div>

          {/* Salary when available */}
          {job.salary && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{job.salary}</span>
            </div>
          )}
        </div>

        {/* Short 1–2 Line Job Description */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {/* Technology / Skill Tags */}
        {skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/70 group-hover:border-slate-300 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Action / View Job Button */}
      <div className="pt-4 mt-5 border-t border-slate-100">
        <Link
          href={`/jobs/${job.id}`}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-50 group-hover:bg-sky-600 text-slate-700 group-hover:text-white border border-slate-200/80 group-hover:border-transparent text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-2xs group/btn"
        >
          <span>View Job</span>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
};
