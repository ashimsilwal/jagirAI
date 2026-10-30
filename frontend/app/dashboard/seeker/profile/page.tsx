'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { apiFetch, JobSeekerProfile, JobCategory, getMediaUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  FileText, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ArrowLeft,
  FileUp,
  Download,
  Camera,
  Trash2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Edit3,
  BookOpen,
  Share2,
  Check,
  ShieldCheck,
  FileCheck,
  CheckCircle,
  Eye,
  X,
  Search,
  Sliders,
  Bookmark
} from 'lucide-react';

const AVATAR_PALETTES = [
  'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200/70 dark:border-sky-800',
  'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800',
  'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800',
  'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200/70 dark:border-cyan-800',
  'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-200/70 dark:border-teal-800',
];

function getCandidatePalette(name?: string): string {
  if (!name) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getCandidateInitials(name?: string): string {
  if (!name) return 'JS';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function SeekerProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'preferences' | 'edit'>('overview');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [resumeSaving, setResumeSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);
  const [isViewingPhoto, setIsViewingPhoto] = useState(false);

  // Job Preferences State
  const [availableCategories, setAvailableCategories] = useState<JobCategory[]>([]);
  const [selectedPreferenceIds, setSelectedPreferenceIds] = useState<number[]>([]);
  const [initialPreferenceIds, setInitialPreferenceIds] = useState<number[]>([]);
  const [prefSearch, setPrefSearch] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [prefSuccessMessage, setPrefSuccessMessage] = useState('');
  const [prefErrorMessage, setPrefErrorMessage] = useState('');

  // Profile Picture State
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePicture, setRemovePicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [newResume, setNewResume] = useState<File | null>(null);

  // Auto-switch to tab if query parameter tab=preferences is present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'preferences' || tabParam === 'resume' || tabParam === 'edit' || tabParam === 'overview') {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiFetch<JobSeekerProfile>('/profile/job-seeker/');
        setProfile(data);
        setPhone(data.phone || '');
        setLocation(data.location || '');
        setBio(data.bio || '');
        setSkills(data.skills || '');
        setEducation(data.education || '');
        setExperience(data.experience || '');

        if (data.job_preferences && Array.isArray(data.job_preferences)) {
          const ids = data.job_preferences.map(c => c.id);
          setSelectedPreferenceIds(ids);
          setInitialPreferenceIds(ids);
        }
      } catch (err: any) {
        setError('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch all available job categories and live preferences
  useEffect(() => {
    const fetchPreferencesData = async () => {
      setLoadingPrefs(true);
      try {
        const [catsRes, prefsRes] = await Promise.all([
          apiFetch<JobCategory[] | { results: JobCategory[] }>('/job-categories/'),
          apiFetch<{ category_ids: number[]; categories: JobCategory[] }>('/job-seeker/preferences/').catch(() => null)
        ]);

        const cats = Array.isArray(catsRes) ? catsRes : catsRes.results || [];
        setAvailableCategories(cats);

        if (prefsRes && Array.isArray(prefsRes.category_ids)) {
          setSelectedPreferenceIds(prefsRes.category_ids);
          setInitialPreferenceIds(prefsRes.category_ids);
        }
      } catch (err) {
        console.error('Failed to load categories or preferences:', err);
      } finally {
        setLoadingPrefs(false);
      }
    };

    fetchPreferencesData();
  }, []);

  const togglePreferenceCategory = (catId: number) => {
    setSelectedPreferenceIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSelectAllPreferences = () => {
    setSelectedPreferenceIds(availableCategories.map((c) => c.id));
  };

  const handleClearAllPreferences = () => {
    setSelectedPreferenceIds([]);
  };

  const handleResetPreferences = () => {
    setSelectedPreferenceIds(initialPreferenceIds);
    setPrefSuccessMessage('');
    setPrefErrorMessage('');
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setPrefSuccessMessage('');
    setPrefErrorMessage('');

    try {
      const res = await apiFetch<{ message: string; category_ids: number[]; categories: JobCategory[] }>(
        '/job-seeker/preferences/',
        {
          method: 'PUT',
          body: JSON.stringify({ category_ids: selectedPreferenceIds }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setSelectedPreferenceIds(res.category_ids);
      setInitialPreferenceIds(res.category_ids);
      if (profile) {
        setProfile({
          ...profile,
          job_preferences: res.categories,
        });
      }
      const successMsg = 'Job preferences saved successfully! Vacancies matching your selected categories are now prioritized in your jobs feed.';
      setPrefSuccessMessage(successMsg);
      toast.success(successMsg, 'Preferences Saved');
      setTimeout(() => setPrefSuccessMessage(''), 5000);
    } catch (err: any) {
      const errMsg =
        err?.data?.detail ||
        err?.data?.category_ids?.[0] ||
        err?.message ||
        'Failed to save job preferences. Please try again.';
      setPrefErrorMessage(errMsg);
      toast.error(errMsg, 'Save Failed');
    } finally {
      setSavingPrefs(false);
    }
  };

  // Cleanup object URL preview on unmount or change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Close photo lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isViewingPhoto) setIsViewingPhoto(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewingPhoto]);

  // Lock background body & html scroll completely when photo modal is open
  useEffect(() => {
    if (isViewingPhoto) {
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
  }, [isViewingPhoto]);

  const handlePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsViewingPhoto(false);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture file size cannot exceed 2MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (.jpg, .jpeg, .png, .webp).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError('');
    setNewProfilePicture(file);
    setRemovePicture(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemovePicture = () => {
    setNewProfilePicture(null);
    setPreviewUrl(null);
    setRemovePicture(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelPictureChange = () => {
    setNewProfilePicture(null);
    setPreviewUrl(null);
    setRemovePicture(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Quick save photo directly
  const handleQuickSavePhoto = async () => {
    if (!newProfilePicture && !removePicture) return;
    setPhotoSaving(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      if (removePicture) {
        formData.append('remove_profile_picture', 'true');
      } else if (newProfilePicture) {
        formData.append('profile_picture', newProfilePicture);
      }

      const updated = await apiFetch<JobSeekerProfile>('/profile/job-seeker/', {
        method: 'PATCH',
        body: formData,
      });

      setProfile(updated);
      setNewProfilePicture(null);
      setPreviewUrl(null);
      setRemovePicture(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshUser();
      const msg = removePicture ? 'Profile picture removed successfully!' : 'Profile picture updated successfully!';
      setMessage(msg);
      toast.success(msg, 'Photo Saved');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      const errMsg = err?.data?.profile_picture?.[0] || err?.message || 'Failed to update profile picture.';
      setError(errMsg);
      toast.error(errMsg, 'Save Failed');
    } finally {
      setPhotoSaving(false);
    }
  };

  // Quick save resume directly
  const handleQuickSaveResume = async () => {
    if (!newResume) return;
    setResumeSaving(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', newResume);

      const updated = await apiFetch<JobSeekerProfile>('/profile/job-seeker/', {
        method: 'PATCH',
        body: formData,
      });

      setProfile(updated);
      setNewResume(null);
      await refreshUser();
      const msg = 'Resume document uploaded and updated successfully!';
      setMessage(msg);
      toast.success(msg, 'Resume Saved');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      const errMsg = err?.data?.resume?.[0] || err?.message || 'Failed to update resume document.';
      setError(errMsg);
      toast.error(errMsg, 'Save Failed');
    } finally {
      setResumeSaving(false);
    }
  };

  // Save all profile changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('phone', phone.trim());
      formData.append('location', location.trim());
      formData.append('bio', bio.trim());
      formData.append('skills', skills.trim());
      formData.append('education', education.trim());
      formData.append('experience', experience.trim());

      if (removePicture) {
        formData.append('remove_profile_picture', 'true');
      } else if (newProfilePicture) {
        formData.append('profile_picture', newProfilePicture);
      }

      if (newResume) {
        formData.append('resume', newResume);
      }

      const updated = await apiFetch<JobSeekerProfile>('/profile/job-seeker/', {
        method: 'PATCH',
        body: formData,
      });

      setProfile(updated);
      setNewProfilePicture(null);
      setPreviewUrl(null);
      setRemovePicture(false);
      setNewResume(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshUser();
      const msg = 'Profile updated successfully!';
      setMessage(msg);
      toast.success('Your profile changes have been saved successfully!', 'Profile Saved');
      setActiveTab('overview');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      const errMsg =
        err?.data?.profile_picture?.[0] ||
        err?.data?.resume?.[0] ||
        err?.data?.detail ||
        err?.message ||
        'Failed to update profile.';
      setError(errMsg);
      toast.error(errMsg, 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleShareProfile = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  // Profile calculations
  const candidateHandle = useMemo(() => {
    const raw = profile?.user?.username || user?.username || 'candidate';
    return raw.toLowerCase().replace(/[^a-z0-9_]+/g, '');
  }, [profile?.user?.username, user?.username]);

  const candidateDisplayName = useMemo(() => {
    return profile?.user?.username || user?.username || 'Job Seeker';
  }, [profile?.user?.username, user?.username]);

  const memberSince = useMemo(() => {
    const dStr = profile?.created_at || user?.date_joined;
    if (!dStr) return 'Recently';
    const d = new Date(dStr);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [profile?.created_at, user?.date_joined]);

  // Profile completeness score
  const profileCompleteness = useMemo(() => {
    let score = 0;
    if (profile?.profile_picture || previewUrl) score += 15;
    if (bio.trim()) score += 20;
    if (phone.trim()) score += 10;
    if (location.trim()) score += 10;
    if (skills.trim()) score += 15;
    if (experience.trim()) score += 15;
    if (education.trim()) score += 10;
    if (profile?.resume || newResume) score += 5;
    return Math.min(score, 100);
  }, [profile?.profile_picture, previewUrl, bio, phone, location, skills, experience, education, profile?.resume, newResume]);

  // Parsed skills
  const skillsList = useMemo(() => {
    if (!skills.trim()) return [];
    return skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [skills]);

  // Current photo URL
  const currentPhotoUrl = previewUrl 
    ? previewUrl 
    : removePicture 
    ? null 
    : getMediaUrl(profile?.profile_picture);

  const palette = getCandidatePalette(candidateDisplayName);
  const initials = getCandidateInitials(candidateDisplayName);

  // Helper to extract clean original file name from resume URL
  const currentResumeName = useMemo(() => {
    if (newResume) return newResume.name;
    if (!profile?.resume) return 'No resume uploaded';
    try {
      const cleanUrl = profile.resume.split('?')[0].split('#')[0];
      const parts = cleanUrl.split('/');
      const rawName = parts[parts.length - 1];
      const decoded = decodeURIComponent(rawName);
      return decoded || 'Resume.pdf';
    } catch {
      return 'Resume.pdf';
    }
  }, [newResume, profile?.resume]);

  // Object URL for staged new resume file
  const [newResumeBlobUrl, setNewResumeBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!newResume) {
      setNewResumeBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(newResume);
    setNewResumeBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [newResume]);

  // Cache-busted URL for direct viewing in new tab
  const resumeViewerUrl = useMemo(() => {
    if (newResumeBlobUrl) return newResumeBlobUrl;
    if (!profile?.resume) return '';
    const base = getMediaUrl(profile.resume) || profile.resume;
    const version = profile.updated_at ? new Date(profile.updated_at).getTime() : Date.now();
    return `${base}${base.includes('?') ? '&' : '?'}v=${version}`;
  }, [newResumeBlobUrl, profile?.resume, profile?.updated_at]);

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
                href="/dashboard/seeker"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Candidate Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Link>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                <User className="w-4 h-4 text-sky-500" />
                <span className="truncate max-w-[160px] sm:max-w-xs">{candidateDisplayName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(profile?.resume || newResume) && (
                <a
                  href={resumeViewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition cursor-pointer"
                  title="View Resume in new tab"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span className="hidden sm:inline">View Resume</span>
                </a>
              )}

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
                    <span className="hidden sm:inline">Share</span>
                  </>
                )}
              </button>

              <Link
                href="/jobs"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Explore Jobs</span>
              </Link>
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

            <button
              onClick={() => setActiveTab('resume')}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'resume'
                  ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Resume & CV</span>
              {profile?.resume && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'preferences'
                  ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Bookmark className="w-4 h-4 text-sky-500" />
              <span>Job Preferences</span>
              {selectedPreferenceIds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {selectedPreferenceIds.length}
                </span>
              )}
            </button>

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

      {/* 2. MAIN TWO-COLUMN GITHUB-STYLE PROFILE BODY */}
      <main className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* ================================================================= */}
          {/* LEFT COLUMN: GITHUB-STYLE CANDIDATE SIDEBAR                       */}
          {/* ================================================================= */}
          <aside className="w-full md:w-72 lg:w-80 shrink-0 space-y-6">
            {/* Big Avatar / Profile Picture */}
            <div 
              onClick={() => setIsViewingPhoto(true)}
              className="relative group cursor-pointer"
              title="Click to view full profile picture"
            >
              <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-full md:h-72 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex items-center justify-center p-2 group-hover:border-sky-400 dark:group-hover:border-sky-500 transition-colors">
                {currentPhotoUrl ? (
                  <img
                    src={currentPhotoUrl}
                    alt={`${candidateDisplayName} avatar`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className={`w-full h-full rounded-xl flex items-center justify-center font-extrabold text-4xl sm:text-5xl tracking-wider shadow-inner ${palette}`}>
                    {initials}
                  </div>
                )}
              </div>

              {/* Hover overlay */}
              <div 
                className="absolute inset-0 rounded-2xl bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-[2px]"
              >
                <Eye className="w-6 h-6 text-sky-400" />
                <span>View Profile Picture</span>
                <span className="text-[10px] text-slate-300 font-normal">Click to view photo</span>
              </div>

              {/* Hidden file input for edit tab trigger */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePictureSelect}
                className="hidden"
              />
            </div>

            {/* Unsaved Photo Alert & Quick Actions */}
            {(newProfilePicture || removePicture) && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Unsaved Photo Selection</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleQuickSavePhoto}
                    disabled={photoSaving}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 text-center"
                  >
                    {photoSaving ? 'Saving...' : 'Save Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPictureChange}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Candidate Name, Handle & Badges */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 break-words leading-tight">
                {candidateDisplayName}
              </h1>
              
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-mono">
                <span>@{candidateHandle}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-400 font-sans">Candidate</span>
              </div>
            </div>

            {/* GitHub-Styled Full-Width Action Buttons */}
            <div className="space-y-2">
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
                    <span>Edit Profile</span>
                  </>
                )}
              </button>

              {(profile?.resume || newResume) ? (
                <a
                  href={resumeViewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-4 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs sm:text-sm font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  title="Open resume in new tab"
                >
                  <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>View Resume</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('resume')}
                  className="w-full py-2 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileUp className="w-4 h-4 text-slate-400" />
                  <span>Upload Resume</span>
                </button>
              )}
            </div>

            {/* Profile Bio / Tagline Snippet */}
            {bio && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {bio.split('\n')[0]}
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

              {phone && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${phone}`} className="hover:text-sky-600 dark:hover:text-sky-400 truncate">
                    {phone}
                  </a>
                </div>
              )}

              {(profile?.user?.email || user?.email) && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{profile?.user?.email || user?.email}</span>
                </div>
              )}

              {/* Resume Quick Indicator */}
              <div className="flex items-center justify-between gap-2.5 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 truncate">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate font-medium text-slate-700 dark:text-slate-300" title={profile?.resume ? currentResumeName : 'No Resume Uploaded'}>
                    {profile?.resume ? currentResumeName : 'No Resume Uploaded'}
                  </span>
                </div>
                {(profile?.resume || newResume) && (
                  <a
                    href={resumeViewerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline shrink-0 inline-flex items-center gap-1 font-semibold text-[11px] cursor-pointer"
                    title="Open resume in new tab"
                  >
                    <span>View</span>
                    <Eye className="w-3 h-3" />
                  </a>
                )}
              </div>

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
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Verified Candidate</div>
                    <div className="text-[10px] text-slate-400">JagirAI Certified</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-sky-50 dark:bg-sky-950/80 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Actively Seeking</div>
                    <div className="text-[10px] text-slate-400">Open to Opportunities</div>
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
              {profileCompleteness < 100 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Complete your skills, education, and resume to improve visibility with recruiters.
                </p>
              )}
            </div>
          </aside>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: MAIN CONTENT CANVAS                                 */}
          {/* ================================================================= */}
          <section className="flex-1 min-w-0 w-full space-y-6">
            
            {/* ----------------------------------------------------------------- */}
            {/* TAB 1: OVERVIEW (DESCRIPTION, SKILLS, EXPERIENCE, EDUCATION, RESUME) */}
            {/* ----------------------------------------------------------------- */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 1. PROFILE DESCRIPTION CARD */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
                  {/* Description Header Bar */}
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <FileText className="w-4 h-4 text-sky-500" />
                      <span>Description</span>
                    </div>

                    <button
                      onClick={() => setActiveTab('edit')}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 font-medium transition cursor-pointer"
                      title="Edit Description"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Description Content Body */}
                  <div className="p-6 sm:p-8 space-y-6">
                    {bio ? (
                      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-4">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            About {candidateDisplayName}
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Candidate Profile on JagirAI Recruitment Network.
                          </p>
                        </div>

                        <div className="whitespace-pre-line text-slate-600 dark:text-slate-300">
                          {bio}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                          <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          No description written yet
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                          Share your professional background, career trajectory, core strengths, and what kind of roles you are looking for.
                        </p>
                        <button
                          onClick={() => setActiveTab('edit')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Write your Description</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. TECHNICAL SKILLS & COMPETENCIES CARD */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                          Technical Skills & Competencies
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Verified competencies evaluated during application screening
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('edit')}
                      className="text-xs text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="p-5 sm:p-6">
                    {skillsList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skillsList.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-50/80 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/70 hover:border-sky-300 transition"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No skills listed yet. Add comma-separated skills in Settings & Edit.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. WORK EXPERIENCE CARD */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                          Work Experience & Roles
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Professional employment history and project achievements
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('edit')}
                      className="text-xs text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="p-5 sm:p-6">
                    {experience ? (
                      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        {experience}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No work experience detailed yet. Highlight your past roles and companies in Settings & Edit.
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. EDUCATION & CERTIFICATIONS CARD */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                          Education & Academic Credentials
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          University degrees, academic institutions, and licenses
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('edit')}
                      className="text-xs text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="p-5 sm:p-6">
                    {education ? (
                      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        {education}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No educational credentials added yet. Add your university degrees and certifications in Settings & Edit.
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. VERIFIED RESUME SNAPSHOT CARD */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                          Verified Resume Document
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Default curriculum vitae attached to all direct job applications
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('resume')}
                      className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Manage Resume</span>
                    </button>
                  </div>

                  <div className="p-5 sm:p-6">
                    {profile?.resume ? (
                      <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200/60 dark:border-sky-800">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate" title={currentResumeName}>
                              {currentResumeName}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Current stored resume • Formatted for ATS parsing
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          <a
                            href={resumeViewerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition shadow-xs cursor-pointer"
                            title="Open resume in new tab"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Resume</span>
                          </a>

                          <a
                            href={resumeViewerUrl}
                            download={currentResumeName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Download</span>
                          </a>

                          <button
                            onClick={() => setActiveTab('resume')}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                          >
                            <FileUp className="w-3.5 h-3.5" />
                            <span>Replace</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                        <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          No default resume uploaded yet
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Upload your resume in PDF or Word format so recruiters can review your full background when applying.
                        </p>
                        <button
                          onClick={() => setActiveTab('resume')}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          <span>Upload Resume</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. JOB PREFERENCES SUMMARY CARD */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Bookmark className="w-4 h-4 text-sky-500" />
                      <span>Job Preferences</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('preferences')}
                      className="inline-flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Manage Preferences</span>
                    </button>
                  </div>

                  <div className="p-6">
                    {selectedPreferenceIds.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Vacancies in these categories are prioritized at the top of your job feed:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {availableCategories
                            .filter((c) => selectedPreferenceIds.includes(c.id))
                            .map((cat) => (
                              <span
                                key={cat.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                              >
                                <Check className="w-3 h-3 text-sky-500" />
                                <span>{cat.name}</span>
                              </span>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                        <Bookmark className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          No category preferences configured
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Select your preferred job domains to receive tailored vacancy recommendations.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('preferences')}
                          className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Configure Preferences</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* TAB 2: RESUME & CV (DEDICATED RESUME MANAGEMENT HUB)              */}
            {/* ----------------------------------------------------------------- */}
            {activeTab === 'resume' && (
              <div className="space-y-6">
                
                {/* Header Banner */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-sky-500" />
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                          Resume & Curriculum Vitae
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Manage your primary resume document. This document is automatically attached to employer job applications.
                      </p>
                    </div>

                    {profile?.resume && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 shrink-0 self-start sm:self-auto">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Resume Active</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Current Resume Card */}
                {profile?.resume && (
                  <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Current Stored Resume
                    </h3>

                    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200 dark:border-sky-800">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={currentResumeName}>
                            {currentResumeName}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Status: Ready for 1-click recruiter applications
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <a
                          href={resumeViewerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm cursor-pointer"
                          title="Open resume in new tab"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Resume</span>
                        </a>

                        <a
                          href={resumeViewerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={currentResumeName}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download File</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload / Replace Resume Box */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {profile?.resume ? 'Replace Resume Document' : 'Upload New Resume'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Upload your latest resume in PDF or Word format (.pdf, .doc, .docx - max 5MB).
                    </p>
                  </div>

                  <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 rounded-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-all text-center">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">
                        {newResume ? newResume.name : 'Click to select or drag and drop your resume file'}
                      </span>
                      <span className="text-xs text-slate-400 font-normal">
                        Supports PDF, DOC, DOCX up to 5MB
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setNewResume(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>

                  {newResume && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-sky-50/80 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800">
                      <div className="flex items-center gap-2.5 text-xs text-sky-900 dark:text-sky-200 font-semibold truncate">
                        <FileCheck className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="truncate">Selected: {newResume.name} ({(newResume.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setNewResume(null)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickSaveResume}
                          disabled={resumeSaving}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        >
                          {resumeSaving ? 'Uploading...' : 'Save & Upload Resume'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Application Readiness Checklist */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Application Readiness Checklist
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        {profile?.resume ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={profile?.resume ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                          Primary Resume Uploaded
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {skills.trim() ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={skills.trim() ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                          Technical Skills Listed
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {bio.trim() ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={bio.trim() ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                          Professional Biography Added
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {phone.trim() && location.trim() ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={phone.trim() && location.trim() ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                          Contact & Location Details Complete
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* TAB: JOB PREFERENCES (CUSTOMIZE CAREER DOMAIN PRIORITIZATION)      */}
            {/* ----------------------------------------------------------------- */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                
                {/* Header Banner */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-sky-500" />
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                          Job Preferences
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Choose the types of jobs you&apos;re interested in so we can prioritize relevant opportunities for you.
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800 shrink-0 self-start sm:self-auto">
                      <Bookmark className="w-3.5 h-3.5 text-sky-500" />
                      <span>{selectedPreferenceIds.length} Categories Selected</span>
                    </span>
                  </div>
                </div>

                {/* Feedback Alerts */}
                {prefSuccessMessage && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium">{prefSuccessMessage}</span>
                    </div>
                    <button 
                      onClick={() => setPrefSuccessMessage('')} 
                      className="text-emerald-700 dark:text-emerald-400 hover:underline text-[11px] font-semibold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {prefErrorMessage && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span className="font-medium">{prefErrorMessage}</span>
                    </div>
                    <button 
                      onClick={() => setPrefErrorMessage('')} 
                      className="text-rose-700 dark:text-rose-400 hover:underline text-[11px] font-semibold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Preference Selection Grid & Controls */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
                  {/* Search and Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={prefSearch}
                        onChange={(e) => setPrefSearch(e.target.value)}
                        placeholder="Search categories (e.g. Backend, Design, Data)..."
                        className="w-full pl-10 pr-8 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none transition"
                      />
                      {prefSearch && (
                        <button
                          type="button"
                          onClick={() => setPrefSearch('')}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleSelectAllPreferences}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllPreferences}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Categories Grid */}
                  {loadingPrefs ? (
                    <div className="py-16 text-center">
                      <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin mx-auto mb-3" />
                      <p className="text-xs text-slate-500">Loading job categories...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {availableCategories
                        .filter((cat) =>
                          !prefSearch ||
                          cat.name.toLowerCase().includes(prefSearch.toLowerCase()) ||
                          (cat.description && cat.description.toLowerCase().includes(prefSearch.toLowerCase()))
                        )
                        .map((cat) => {
                          const isSelected = selectedPreferenceIds.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => togglePreferenceCategory(cat.id)}
                              className={`group text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 select-none ${
                                isSelected
                                  ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 dark:border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/70'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  isSelected
                                    ? 'bg-sky-600 text-white'
                                    : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover:border-sky-400'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-sm font-bold truncate ${
                                    isSelected
                                      ? 'text-sky-950 dark:text-sky-100 font-semibold'
                                      : 'text-slate-900 dark:text-slate-100'
                                  }`}
                                >
                                  {cat.name}
                                </p>
                                {cat.description && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                    {cat.description}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}

                  {/* Save Footer Bar */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetPreferences}
                        disabled={savingPrefs}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Reset Changes
                      </button>
                      <Link
                        href="/jobs"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Explore Jobs</span>
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      disabled={savingPrefs}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/25 transition cursor-pointer disabled:opacity-60"
                    >
                      {savingPrefs ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Saving Preferences...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Preferences</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* TAB 3: SETTINGS & EDIT (STRUCTURED GITHUB PROFILE SETTINGS)        */}
            {/* ----------------------------------------------------------------- */}
            {activeTab === 'edit' && (
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* 1. PUBLIC PROFILE & AVATAR SETTINGS */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Public Profile & Avatar
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Your identity showcased across search results and employer applications.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">
                    {/* Username & Email Read-Only Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Username
                        </label>
                        <input
                          type="text"
                          disabled
                          value={candidateDisplayName}
                          className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Account Email
                        </label>
                        <input
                          type="email"
                          disabled
                          value={profile?.user?.email || user?.email || ''}
                          className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Avatar Upload Section */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Profile Picture
                      </label>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40">
                        <div 
                          onClick={() => setIsViewingPhoto(true)}
                          className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs cursor-pointer group relative hover:border-sky-400 dark:hover:border-sky-500 transition-all"
                          title="Click to view full photo"
                        >
                          {currentPhotoUrl ? (
                            <img
                              src={currentPhotoUrl}
                              alt="Avatar preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className={`w-full h-full rounded-lg flex items-center justify-center font-bold text-lg ${palette}`}>
                              {initials}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs transition">
                              <Camera className="w-3.5 h-3.5 text-sky-500" />
                              <span>{newProfilePicture ? newProfilePicture.name : 'Choose New Photo'}</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handlePictureSelect}
                                className="hidden"
                              />
                            </label>

                            {(profile?.profile_picture || previewUrl) && !removePicture && (
                              <button
                                type="button"
                                onClick={handleRemovePicture}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove Photo</span>
                              </button>
                            )}

                            {(newProfilePicture || removePicture) && (
                              <button
                                type="button"
                                onClick={handleCancelPictureChange}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Cancel Change</span>
                              </button>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400">
                            Square PNG, JPG, WebP recommended. Maximum size 2MB.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. CONTACT & LOCATION */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Contact & Location
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      How hiring managers and automated matching systems reach you.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+977 9800000000"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Location / City
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Kathmandu, Nepal / Remote"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. PROFILE DESCRIPTION & BIOGRAPHY */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Profile Description
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Showcased prominently on your profile overview. Summarize your career ambitions, strengths, and experience.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6">
                    <textarea
                      rows={6}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Hi there! 👋 I am a full-stack software engineer passionate about building high-performance web applications and distributed systems..."
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition leading-relaxed font-sans"
                    />
                  </div>
                </div>

                {/* 4. TECHNICAL SKILLS */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Technical Skills (Comma-separated)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Enter tags separated by commas. These are parsed into candidate skill pills.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 space-y-3">
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="Python, Django, React, Next.js, PostgreSQL, Docker, AWS, TypeScript"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                    />

                    {/* Live Preview */}
                    {skillsList.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Live Pill Preview:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {skillsList.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. WORK EXPERIENCE & CAREER HISTORY */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Work Experience & Career History
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Detail your positions, companies, roles, key accomplishments, and project impacts.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6">
                    <textarea
                      rows={5}
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="• Senior Software Engineer at Tech Corp (2023 - Present)&#10;  - Built scalable microservices serving 100k daily users&#10;• Frontend Developer at Startup Inc (2021 - 2023)&#10;  - Developed Next.js client applications and design systems"
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition leading-relaxed font-sans"
                    />
                  </div>
                </div>

                {/* 6. EDUCATION & CERTIFICATIONS */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Education & Certifications
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Universities, degrees, graduation years, and certified programs.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6">
                    <textarea
                      rows={4}
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      placeholder="• B.Sc. in Computer Science - Tribhuvan University (2018 - 2022)&#10;• AWS Certified Solutions Architect (2023)"
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition leading-relaxed font-sans"
                    />
                  </div>
                </div>

                {/* 7. RESUME DOCUMENT UPLOAD */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Default Resume Document
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Attached to your platform profile for recruiter downloads.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 space-y-4">
                    {profile?.resume && (
                      <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium truncate min-w-0">
                          <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className="truncate font-semibold text-slate-900 dark:text-slate-100" title={currentResumeName}>
                            {currentResumeName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={resumeViewerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                            title="Open resume in new tab"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </a>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <a
                            href={resumeViewerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={currentResumeName}
                            className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 font-semibold"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    )}

                    <label className="flex flex-col sm:flex-row items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition text-center sm:text-left">
                      <FileUp className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="font-semibold truncate">
                        {newResume ? newResume.name : 'Select new resume file (.pdf, .doc, .docx - max 5MB)'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setNewResume(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
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

      {/* 4. PROFILE PICTURE LIGHTBOX MODAL */}
      {isViewingPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overscroll-none"
          onClick={() => setIsViewingPhoto(false)}
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
                    Profile Picture
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    @{candidateHandle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsViewingPhoto(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 transition cursor-pointer"
                title="Close viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Area */}
            <div className="p-6 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/40">
              {currentPhotoUrl ? (
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                  <img
                    src={currentPhotoUrl}
                    alt={`${candidateDisplayName} profile`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl flex flex-col items-center justify-center gap-3 border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-800">
                  <div className={`w-28 h-28 rounded-2xl flex items-center justify-center font-extrabold text-5xl ${palette}`}>
                    {initials}
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    No custom profile photo uploaded
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              {currentPhotoUrl ? (
                <a
                  href={currentPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Resolution</span>
                </a>
              ) : (
                <span className="text-xs text-slate-400">Default Avatar Monogram</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsViewingPhoto(false);
                    if (activeTab !== 'edit') {
                      setActiveTab('edit');
                    }
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Change Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewingPhoto(false)}
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
