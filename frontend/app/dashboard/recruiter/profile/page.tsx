'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, RecruiterProfile } from '@/lib/api';
import { 
  Building2, 
  Globe, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ArrowLeft,
  FileUp,
  Image as ImageIcon
} from 'lucide-react';

export default function RecruiterProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);

  useEffect(() => {
    if (!authLoading && user && (user.is_staff || user.is_superuser)) {
      router.replace('/dashboard/admin');
    }
  }, [user, authLoading, router]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('company_name', companyName);
      formData.append('company_description', companyDescription);
      formData.append('company_website', companyWebsite);
      formData.append('location', location);
      formData.append('phone', phone);
      if (companyLogo) {
        formData.append('company_logo', companyLogo);
      }

      const updated = await apiFetch<RecruiterProfile>('/profile/recruiter/', {
        method: 'PATCH',
        body: formData,
      });

      setProfile(updated);
      setCompanyLogo(null);
      setMessage('Company profile updated successfully!');
    } catch (err: any) {
      setError(err.data?.company_logo?.[0] || err.message || 'Failed to update company profile.');
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
        href="/dashboard/recruiter"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Recruiter Dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Company & Recruiter Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            This information will be displayed to candidates on your job vacancy postings.
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
                Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Headquarters / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, NY / Global"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Website URL
              </label>
              <input
                type="url"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="https://company.example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Company Description
            </label>
            <textarea
              rows={4}
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              placeholder="Tell candidates about your mission, product, culture, and achievements..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          {/* Logo Upload Box */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Company Logo (PNG, JPG, max 2MB)
            </label>

            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-xl text-xs text-slate-600 hover:text-sky-600 cursor-pointer bg-slate-50 transition">
              <FileUp className="w-4 h-4" />
              <span>{companyLogo ? companyLogo.name : 'Upload New Logo Image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCompanyLogo(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-200 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Company Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
