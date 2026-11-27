'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { 
  apiFetch, 
  RecruiterProfile, 
  getMediaUrl, 
  hasPermission 
} from '@/lib/api';
import { 
  Building2, 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ArrowLeft, 
  FileUp, 
  Lock, 
  Edit3, 
  BookOpen, 
  FileText, 
  ExternalLink, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Camera, 
  Share2,
  Eye,
  X
} from 'lucide-react';

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

export default function RecruiterProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview');

  const canEdit = hasPermission(user, 'organization.update');
  const canView = hasPermission(user, 'organization.view') || canEdit;

  useEffect(() => {
    if (!authLoading && user) {
      if (user.is_staff || user.is_superuser) {
        router.replace('/dashboard/admin');
      } else if (!canView) {
        router.replace('/dashboard/recruiter');
      }
    }
  }, [user, authLoading, canView, router]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);
  const [isViewingLogo, setIsViewingLogo] = useState(false);

  // Close logo modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isViewingLogo) {
        setIsViewingLogo(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewingLogo]);

  // Lock background body & html scroll completely when logo modal is open
  useEffect(() => {
    if (isViewingLogo) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
      };
    }
  }, [isViewingLogo]);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiFetch<RecruiterProfile>('/profile/recruiter/');
        setProfile(data);
        setCompanyName(data.company_name || '');
        setCompanyDescription(data.company_description || '');
        setCompanyWebsite(data.company_website || '');
        setLocation(data.location || '');
        setPhone(data.phone || '');
      } catch (err: any) {
        setError('Failed to load company profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogoChange = (file: File | null) => {
    setIsViewingLogo(false);
    setCompanyLogo(file);
    if (file) {
      const preview = URL.createObjectURL(file);
      setLogoPreviewUrl(preview);
    } else {
      setLogoPreviewUrl(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setError('Company name is required.');
      return;
    }

    const trimmedWebsite = companyWebsite.trim();
    if (trimmedWebsite && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i.test(trimmedWebsite)) {
      setError('Please provide a valid website URL (e.g. https://example.com).');
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('company_name', trimmedName);
      formData.append('company_description', companyDescription.trim());
      formData.append('company_website', trimmedWebsite);
      formData.append('location', location.trim());
      formData.append('phone', phone.trim());
      if (companyLogo) {
        formData.append('company_logo', companyLogo);
      }

      const updated = await apiFetch<RecruiterProfile>('/profile/recruiter/', {
        method: 'PATCH',
        body: formData,
      });

      setProfile(updated);
      setCompanyLogo(null);
      setLogoPreviewUrl(null);
      setMessage('Company profile updated successfully!');
      toast.success('Company profile changes have been saved successfully!', 'Profile Saved');
      setActiveTab('overview');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      const errMsg = err.data?.company_logo?.[0] || err.message || 'Failed to update company profile.';
      setError(errMsg);
      toast.error(errMsg, 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  // Profile calculations
  const companySlug = useMemo(() => {
    const base = companyName || profile?.company_name || 'organization';
    return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }, [companyName, profile?.company_name]);

  const profileCompleteness = useMemo(() => {
    let score = 0;
    if (companyName.trim()) score += 20;
    if (companyDescription.trim()) score += 25;
    if (profile?.company_logo || companyLogo) score += 20;
    if (companyWebsite.trim()) score += 15;
    if (location.trim()) score += 10;
    if (phone.trim()) score += 10;
    return Math.min(score, 100);
  }, [companyName, companyDescription, profile?.company_logo, companyLogo, companyWebsite, location, phone]);

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return 'Recently';
    const d = new Date(profile.created_at);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [profile?.created_at]);

  const handleShareProfile = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const palette = getCompanyPalette(companyName || profile?.company_name);
  const initials = getCompanyInitials(companyName || profile?.company_name);
  const displayLogoUrl = logoPreviewUrl || (profile?.company_logo ? getMediaUrl(profile.company_logo) : null);

  if (loading) {
    return (
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-12 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800" />
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-72 lg:w-80 shrink-0 space-y-4">
            <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-full md:h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg w-full" />
          </div>
          <div className="flex-1 w-full space-y-6">
            <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800" />
            <div className="h-56 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-black text-slate-800 dark:text-slate-200">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/recruiter"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Recruiter Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Link>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                <Building2 className="w-4 h-4 text-sky-500" />
                <span className="truncate max-w-[160px] sm:max-w-xs">{companyName || 'Organization Profile'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition cursor-pointer"
                title="Copy profile link"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Share Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* GitHub-Style Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 -mb-px overflow-x-auto scrollbar-none pt-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Overview</span>
            </button>

            {canEdit && (
              <button
                onClick={() => setActiveTab(activeTab === 'edit' ? 'overview' : 'edit')}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'edit'
                    ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Edit3 className="w-4 h-4 text-slate-400" />
                <span>Settings & Edit</span>
                {activeTab === 'edit' && (
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                )}
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Messages / Notifications Banner */}
      {message && (
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium">{message}</span>
            </div>
            <button 
              onClick={() => setMessage('')} 
              className="text-emerald-700 dark:text-emerald-400 hover:underline text-[11px] font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between shadow-sm">
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
        </div>
      )}

      {!canEdit && (
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
            <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>View-Only Access:</strong> You are authorized to review this organization's company details. Profile modifications are reserved for Organization Administrators and Owners.
            </span>
          </div>
        </div>
      )}

      {/* 2. MAIN TWO-COLUMN GITHUB-STYLE PROFILE BODY */}
      <main className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* ================================================================= */}
          {/* LEFT COLUMN: GITHUB-STYLE ORGANIZATION SIDEBAR                    */}
          {/* ================================================================= */}
          <aside className="w-full md:w-72 lg:w-80 shrink-0 space-y-6">
            {/* Big Company Avatar / Logo */}
            <div 
              onClick={() => setIsViewingLogo(true)}
              className="relative group cursor-pointer"
              title="Click to view full company logo"
            >
              <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-full md:h-72 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex items-center justify-center p-4 group-hover:border-sky-400 dark:group-hover:border-sky-500 transition-colors">
                {displayLogoUrl ? (
                  <img
                    src={displayLogoUrl}
                    alt={`${companyName} logo`}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className={`w-full h-full rounded-xl flex items-center justify-center font-extrabold text-4xl sm:text-5xl tracking-wider shadow-inner ${palette}`}>
                    {initials}
                  </div>
                )}
              </div>

              {/* Hover button */}
              <div className="absolute inset-0 rounded-2xl bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-[2px]">
                <Eye className="w-6 h-6 text-sky-400" />
                <span>View Company Logo</span>
                <span className="text-[10px] text-slate-300 font-normal">Click to view full image</span>
              </div>
            </div>

            {/* Company Name, Slug & Badges */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 break-words leading-tight">
                {companyName || 'Unnamed Organization'}
              </h1>
              
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-mono">
                <span>@{companySlug}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-400 font-sans">Employer</span>
              </div>

              {/* Verified Status Badge */}
              {/* <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Recruiter</span>
                </span>
              </div> */}
            </div>

            {/* GitHub-Styled Full-Width "Edit Profile" Button */}
            {canEdit ? (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'edit' ? 'overview' : 'edit')}
                className="w-full py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {activeTab === 'edit' ? (
                  <>
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span>View Public Profile</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 text-slate-500" />
                    <span>Edit Company Profile</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Organization Member (Read-Only)</span>
              </div>
            )}

            {/* Profile Bio / Tagline */}
            {companyDescription && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {companyDescription.split('\n')[0]}
              </p>
            )}

            {/* Metadata List (GitHub Left Rail Style) */}
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800/80 pt-4">
              {location && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}

              {companyWebsite && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <a
                    href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline truncate inline-flex items-center gap-1"
                  >
                    <span className="truncate">{companyWebsite.replace(/^https?:\/\//i, '')}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}

              {phone && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${phone}`} className="hover:text-sky-600 dark:hover:text-sky-400 truncate">
                    {phone}
                  </a>
                </div>
              )}

              {user?.email && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 min-w-0">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Member since {memberSince}</span>
              </div>
            </div>

            {/* Achievements & Trust Badges (GitHub Style) */}
            <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-4 space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Achievements & Trust
              </h2>
              
              <div className="flex flex-wrap gap-2">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Verified Recruiter</div>
                    <div className="text-[10px] text-slate-400">JagirAI Certified</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-sky-50 dark:bg-sky-950/80 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Direct Employer</div>
                    <div className="text-[10px] text-slate-400">Official Organization</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Health Score Progress */}
            <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Profile Health</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">{profileCompleteness}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${profileCompleteness}%` }}
                />
              </div>
              {profileCompleteness < 100 && canEdit && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Add more details to boost candidate discovery and trust score.
                </p>
              )}
            </div>
          </aside>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: MAIN CONTENT CANVAS                                 */}
          {/* ================================================================= */}
          <section className="flex-1 min-w-0 w-full space-y-8">
            
            {/* ----------------------------------------------------------------- */}
            {/* TAB: OVERVIEW (DESCRIPTION & ORGANIZATION DETAILS)                */}
            {/* ----------------------------------------------------------------- */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 1. COMPANY DESCRIPTION CARD */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
                  {/* Description Header Bar */}
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <FileText className="w-4 h-4 text-sky-500" />
                      <span>Company Description</span>
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => setActiveTab('edit')}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 font-medium transition cursor-pointer"
                        title="Edit Description"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {/* Description Content Body */}
                  <div className="p-6 sm:p-8 space-y-6">
                    {companyDescription ? (
                      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-4">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            About {companyName}
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Official organization profile on JagirAI Recruitment Network.
                          </p>
                        </div>

                        {/* Description Paragraphs */}
                        <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
                          {companyDescription}
                        </div>

                        {/* Quick Highlights Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Location</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                              {location || 'Not Specified'}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Web Portal</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                              {companyWebsite ? (
                                <a
                                  href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                                >
                                  <span>{companyWebsite.replace(/^https?:\/\//i, '')}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                'Not Specified'
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Empty Description State */
                      <div className="text-center py-10 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 flex items-center justify-center mx-auto text-sky-600 dark:text-sky-400">
                          <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Introduce {companyName || 'your organization'} to potential talent
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                          Your company description acts as your storefront on JagirAI. Add your mission statement, culture, workplace benefits, and engineering ethos.
                        </p>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('edit')}
                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Write Company Description</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. ORGANIZATION AT A GLANCE CARD */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-500" />
                      <span>Organization Overview</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Verified details registered on the JagirAI Employer Network.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Organization Name</span>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{companyName || 'Not Set'}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Headquarters</span>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{location || 'Not Specified'}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Official Website</span>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {companyWebsite ? (
                          <a
                            href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>{companyWebsite}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          'Not Specified'
                        )}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Primary Phone</span>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{phone || 'Not Specified'}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Verified Status</span>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Recruiter</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Registration Date</span>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{memberSince}</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* TAB: SETTINGS & EDIT (CLEAN GITHUB SETTINGS FORM)                 */}
            {/* ----------------------------------------------------------------- */}
            {activeTab === 'edit' && canEdit && (
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* 1. PUBLIC BRANDING */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Public Organization Branding
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      How candidates identify your company across vacancy boards and candidate notifications.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Acme Innovations Nepal"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                      />
                    </div>

                    {/* Logo Upload Section */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Company Logo
                      </label>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40">
                        <div 
                          onClick={() => setIsViewingLogo(true)}
                          className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs cursor-pointer group relative hover:border-sky-400 dark:hover:border-sky-500 transition-all"
                          title="Click to view full logo"
                        >
                          {displayLogoUrl ? (
                            <img
                              src={displayLogoUrl}
                              alt="Logo preview"
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <Building2 className="w-8 h-8 text-slate-400" />
                          )}
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs transition">
                            <FileUp className="w-3.5 h-3.5 text-sky-500" />
                            <span>{companyLogo ? companyLogo.name : 'Choose New Logo File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleLogoChange(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[11px] text-slate-400">
                            Square PNG or JPG recommended. Maximum allowed size is 2MB.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. CONTACT & ONLINE PRESENCE */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Contact & Online Presence
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Direct candidates to your official digital presence and headquarters.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Headquarters / Location
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Kathmandu, Nepal / Global"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Official Website
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          placeholder="https://company.com"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Contact Phone
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+977 1-4234567"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. COMPANY DESCRIPTION & STORY */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Company Description & Culture Story
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      This will be showcased on your profile overview. Describe your company mission, tech stack, workplace perks, and career growth.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6">
                    <textarea
                      rows={8}
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      placeholder="Share your company mission, history, work culture, engineering values, and employee benefits..."
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition leading-relaxed font-sans"
                    />
                  </div>
                </div>

                {/* Action Save Bar */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            )}
          </section>

        </div>
      </main>

      {/* 4. COMPANY LOGO LIGHTBOX MODAL */}
      {isViewingLogo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overscroll-none"
          onClick={() => setIsViewingLogo(false)}
        >
          <div 
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Company Logo
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {companyName || 'Organization'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsViewingLogo(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 transition cursor-pointer"
                title="Close viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Area */}
            <div className="p-6 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/40">
              {displayLogoUrl ? (
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-900 flex items-center justify-center p-4">
                  <img
                    src={displayLogoUrl}
                    alt={`${companyName} logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl flex flex-col items-center justify-center gap-3 border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-800">
                  <div className={`w-28 h-28 rounded-2xl flex items-center justify-center font-extrabold text-5xl ${palette}`}>
                    {initials}
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    No custom company logo uploaded
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              {displayLogoUrl ? (
                <a
                  href={displayLogoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Resolution</span>
                </a>
              ) : (
                <span className="text-xs text-slate-400">Default Logo Monogram</span>
              )}

              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewingLogo(false);
                      setActiveTab('edit');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Change Logo</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsViewingLogo(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
