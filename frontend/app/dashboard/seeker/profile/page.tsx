'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { apiFetch, JobSeekerProfile, getMediaUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  MapPin, 
  Phone, 
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
  Image as ImageIcon,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function SeekerProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      } catch (err: any) {
        setError('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Cleanup object URL preview on unmount or change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handlePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture file size cannot exceed 2MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate type
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
      setMessage(removePicture ? 'Profile picture removed successfully!' : 'Profile picture updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setError(err?.data?.profile_picture?.[0] || err?.message || 'Failed to update profile picture.');
    } finally {
      setPhotoSaving(false);
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
      formData.append('phone', phone);
      formData.append('location', location);
      formData.append('bio', bio);
      formData.append('skills', skills);
      formData.append('education', education);
      formData.append('experience', experience);

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
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setError(
        err?.data?.profile_picture?.[0] ||
        err?.data?.resume?.[0] ||
        err?.data?.detail ||
        err?.message ||
        'Failed to update profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/4" />
        <div className="h-44 bg-slate-100 dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800" />
        <div className="h-96 bg-slate-100 dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800" />
      </div>
    );
  }

  // Current display image: previewUrl > (if not removed) profile.profile_picture > null
  const currentPhotoUrl = previewUrl 
    ? previewUrl 
    : removePicture 
    ? null 
    : getMediaUrl(profile?.profile_picture);

  const userInitial = profile?.user?.username?.charAt(0).toUpperCase() || 'C';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/dashboard/seeker"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Candidate Dashboard</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-sky-100/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Candidate Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            Manage your personal profile, photo, professional biography, resume, and skills showcased to recruiters.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-sm flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            ✕
          </button>
        </div>
      )}

      {/* PROFILE PICTURE MANAGEMENT CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200/60 dark:border-sky-800">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Profile Picture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload a professional photo to stand out to employers and recruiters.
              </p>
            </div>
          </div>

          {(newProfilePicture || removePicture) && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
              Unsaved Photo Changes
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 p-1 shadow-md ring-4 ring-slate-100 dark:ring-slate-800 flex items-center justify-center aspect-square">
              <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center relative aspect-square">
                {currentPhotoUrl ? (
                  <img
                    src={currentPhotoUrl}
                    alt={profile?.user?.username || 'Profile Picture'}
                    className="w-full h-full object-cover rounded-full aspect-square"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex flex-col items-center justify-center aspect-square">
                    <span className="text-3xl sm:text-4xl font-extrabold">{userInitial}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick camera badge button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Picture"
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow-md flex items-center justify-center transition hover:scale-105 cursor-pointer ring-2 ring-white dark:ring-slate-900"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons and guidelines */}
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {profile?.user?.username}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {profile?.user?.email}
              </p>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePictureSelect}
              className="hidden"
            />

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm shadow-sky-600/20 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>{currentPhotoUrl ? 'Change Photo' : 'Upload Photo'}</span>
              </button>

              {(profile?.profile_picture || previewUrl) && !removePicture && (
                <button
                  type="button"
                  onClick={handleRemovePicture}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              )}

              {(newProfilePicture || removePicture) && (
                <button
                  type="button"
                  onClick={handleCancelPictureChange}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}

              {/* Direct Quick Save Photo Button */}
              {(newProfilePicture || removePicture) && (
                <button
                  type="button"
                  onClick={handleQuickSavePhoto}
                  disabled={photoSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{photoSaving ? 'Updating...' : 'Save Photo Now'}</span>
                </button>
              )}
            </div>

            {/* Hint guidelines */}
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
              <p>• Recommended: Square photo (at least 400x400px).</p>
              <p>• Accepted formats: JPG, PNG, WebP, or GIF (max size: 2MB).</p>
            </div>
          </div>
        </div>
      </div>

      {/* CANDIDATE DETAILS FORM */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Personal & Career Information
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Keep your skills, resume, and experience updated for platform recruiters.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+977 9800000000"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Location / City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kathmandu, Nepal / Remote"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Professional Biography
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A brief summary of your career focus, technical background, and achievements..."
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Skills (Comma-separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Python, Django, React, Next.js, PostgreSQL, Docker, Machine Learning"
              className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Work Experience
            </label>
            <textarea
              rows={4}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Detail your roles, organizations, responsibilities, and accomplishments..."
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Education & Certifications
            </label>
            <textarea
              rows={3}
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Degrees, universities, relevant certifications, graduation years..."
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition leading-relaxed"
            />
          </div>

          {/* Resume Upload Box */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Default Resume (PDF or Word)
            </label>

            {profile?.resume && (
              <div className="p-3.5 bg-sky-50/60 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/80 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-sky-950 dark:text-sky-200 font-medium truncate">
                  <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span className="truncate">Current Resume file stored on your profile</span>
                </div>
                <a
                  href={getMediaUrl(profile.resume) || profile.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-700 hover:bg-sky-50 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / View</span>
                </a>
              </div>
            )}

            <label className="flex flex-col sm:flex-row items-center justify-center gap-2.5 p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 rounded-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-all">
              <FileUp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span className="font-semibold">
                {newResume ? newResume.name : 'Upload New Resume (.pdf, .doc, .docx - max 5MB)'}
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setNewResume(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
