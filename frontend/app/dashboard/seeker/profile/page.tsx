'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, JobSeekerProfile } from '@/lib/api';
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
  Download
} from 'lucide-react';

export default function SeekerProfilePage() {
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      if (newResume) {
        formData.append('resume', newResume);
      }

      const updated = await apiFetch<JobSeekerProfile>('/profile/job-seeker/', {
        method: 'PATCH',
        body: formData,
      });

      setProfile(updated);
      setNewResume(null);
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.data?.resume?.[0] || err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
      <Link
        href="/dashboard/seeker"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Candidate Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Keep your skills, resume, and experience up to date for recruiters.
          </p>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA / Remote"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Professional Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A brief summary of your background, passions, and career goals..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Skills (Comma-separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Python, Django, React, Next.js, PostgreSQL, Docker"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Work Experience
            </label>
            <textarea
              rows={4}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Detail your previous roles, responsibilities, and achievements..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Education
            </label>
            <textarea
              rows={3}
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Degrees, universities, certifications, relevant coursework..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          {/* Resume Upload Box */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Default Resume (PDF or Word)
            </label>

            {profile?.resume && (
              <div className="mb-3 p-3 bg-sky-50/60 border border-sky-100 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-sky-950 font-medium truncate">
                  <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="truncate">Current Resume on file</span>
                </div>
                <a
                  href={profile.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  View
                </a>
              </div>
            )}

            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-xl text-xs text-slate-600 hover:text-sky-600 cursor-pointer bg-slate-50 transition">
              <FileUp className="w-4 h-4" />
              <span>{newResume ? newResume.name : 'Upload New Resume (.pdf, .doc, .docx)'}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setNewResume(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-200 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
