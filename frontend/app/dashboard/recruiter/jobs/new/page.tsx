'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch, Job, JobCategory, hasPermission } from '@/lib/api';
import JobLocationMapPicker from '@/components/JobLocationMapPicker';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  PlusCircle,
  Save,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Layers,
  Search,
  ExternalLink,
  ShieldAlert,
  X
} from 'lucide-react';

function AddVacancyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const editJobId = searchParams?.get('edit');
  const isEditMode = Boolean(editJobId);

  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [salary, setSalary] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [responsibilities, setResponsibilities] = useState('');

  // Auxiliary State
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const [loadingJob, setLoadingJob] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canCreateVacancy = hasPermission(user, 'vacancy.create');
  const canPublishVacancy = hasPermission(user, 'vacancy.publish');

  // Auth protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/dashboard/recruiter/jobs/new');
      } else if (user.role !== 'JOB_RECRUITER' && !user.is_staff && !user.is_superuser) {
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Load Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await apiFetch<JobCategory[] | { results: JobCategory[] }>('/job-categories/');
        const list = Array.isArray(data) ? data : data.results || [];
        setCategories(list);
      } catch (err) {
        console.warn('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Load existing job if in edit mode
  useEffect(() => {
    if (!editJobId) return;

    const fetchJob = async () => {
      try {
        setLoadingJob(true);
        const data = await apiFetch<Job>(`/jobs/${editJobId}/`);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setRequirements(data.requirements || '');
        setResponsibilities(data.responsibilities || '');
        setLocationName(data.location || '');
        setLatitude(typeof data.latitude === 'number' ? data.latitude : null);
        setLongitude(typeof data.longitude === 'number' ? data.longitude : null);
        setSalary(data.salary || '');
        setEmploymentType(data.employment_type || 'FULL_TIME');
        setDeadline(data.deadline ? data.deadline.split('T')[0] : '');
        setStatus(data.status || 'ACTIVE');
        if (data.category) {
          setCategoryId(String(data.category.id));
          setCategoryQuery(data.category.name);
        }
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load vacancy details', 'Error');
        router.push('/dashboard/recruiter/jobs');
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJob();
  }, [editJobId, router, toast]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = categoryQuery.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categoryQuery]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => String(c.id) === categoryId) || null;
  }, [categories, categoryId]);

  // Coordinates change callback for Map Picker
  const handleCoordinatesChange = useCallback((lat: number | null, lng: number | null) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const trimmedLoc = locationName.trim();

    if (!trimmedTitle) {
      setFormError('Job title is required.');
      return;
    }
    if (!trimmedDesc) {
      setFormError('Job description is required.');
      return;
    }
    if (!trimmedLoc) {
      setFormError('Job location is required.');
      return;
    }

    try {
      setSubmitting(true);

      const payload: Record<string, any> = {
        title: trimmedTitle,
        description: trimmedDesc,
        requirements: requirements.trim(),
        responsibilities: responsibilities.trim(),
        location: trimmedLoc,
        latitude: typeof latitude === 'number' && !isNaN(latitude) ? latitude : null,
        longitude: typeof longitude === 'number' && !isNaN(longitude) ? longitude : null,
        salary: salary.trim(),
        employment_type: employmentType,
        deadline: deadline || null,
        status: status,
      };

      if (categoryId) {
        payload.category_id = parseInt(categoryId, 10);
      } else {
        payload.category_id = null;
      }

      if (isEditMode && editJobId) {
        const updated = await apiFetch<Job>(`/jobs/${editJobId}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success(`Vacancy "${updated.title}" updated successfully!`, 'Vacancy Saved');
      } else {
        const created = await apiFetch<Job>('/jobs/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success(`Vacancy "${created.title}" published successfully!`, 'Vacancy Published');
      }

      router.push('/dashboard/recruiter/jobs');
    } catch (err: any) {
      const msg =
        err?.data?.detail ||
        err?.data?.non_field_errors?.[0] ||
        err?.message ||
        'Failed to save vacancy. Please check required fields.';
      setFormError(msg);
      toast.error(msg, 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingJob) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 rounded-full border-3 border-sky-600 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-500 font-medium">
          {isEditMode ? 'Loading vacancy details...' : 'Setting up vacancy editor...'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
      {/* 1. TOP NAVIGATION & BREADCRUMBS (Consistent with other recruiter pages) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs">
            <Link
              href="/dashboard/recruiter"
              className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Dashboard
            </Link>
            <span className="text-slate-400">/</span>
            <Link
              href="/dashboard/recruiter/jobs"
              className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              My Jobs
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500 font-medium">
              {isEditMode ? `Edit Vacancy #${editJobId}` : 'Post Vacancy'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isEditMode ? 'Edit Job Vacancy' : 'Post New Vacancy'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              {isEditMode ? `ID #${editJobId}` : 'New Posting'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEditMode
              ? 'Update role responsibilities, compensation, requirements, or workplace pin location.'
              : 'Fill in job specifics and pin your office location on the map so job seekers nearby can easily find and apply.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/recruiter/jobs"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Jobs</span>
w          </Link>
        </div>
      </div>

      {/* 2. Main Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Error Alert */}
        {formError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-rose-400 hover:text-rose-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SECTION 1: ROLE & BASIC DETAILS */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Role & Classification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define the job title, industry category, and contract type.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Full-Stack Engineer, Product Designer"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none text-xs sm:text-sm font-medium transition"
              />
            </div>

            {/* Category Picker */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Job Category <span className="text-rose-500">*</span>
                </label>
                <Link
                  href="/dashboard/recruiter/categories"
                  target="_blank"
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Request New</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-between text-xs sm:text-sm font-medium focus:border-sky-500 focus:outline-none cursor-pointer transition"
                >
                  <span className={selectedCategory ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                    {selectedCategory ? selectedCategory.name : 'Select or search category...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {isCategoryDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={categoryQuery}
                          onChange={(e) => setCategoryQuery(e.target.value)}
                          placeholder="Search categories..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border-none outline-none text-slate-900 dark:text-white"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                      {filteredCategories.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No category matches "{categoryQuery}".
                        </div>
                      ) : (
                        filteredCategories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCategoryId(String(c.id));
                              setCategoryQuery(c.name);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                              String(c.id) === categoryId
                                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>{c.name}</span>
                            {String(c.id) === categoryId && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Employment Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Employment Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none text-xs sm:text-sm font-medium transition cursor-pointer"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="REMOTE">Remote</option>
              </select>
            </div>

            {/* Salary Range */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Salary / Compensation
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. NPR 80,000 - 120,000 / month, Competitive"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none text-xs sm:text-sm font-medium transition"
                />
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Application Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none text-xs sm:text-sm font-medium transition cursor-pointer"
              />
            </div>

            {/* Publication Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Publishing Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none text-xs sm:text-sm font-medium transition cursor-pointer"
              >
                <option value="ACTIVE">Active (Published & Receiving Applications)</option>
                <option value="DRAFT">Draft (Saved Privately for Recruiter Review)</option>
                <option value="CLOSED">Closed (Archived / Position Filled)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: WORKPLACE & INTERACTIVE MAP LOCATION */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Workplace Location & Map Pinning
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select your office coordinates on the map or search by address. Candidates will see this on the job listing.
              </p>
            </div>
          </div>

          {/* Interactive Map Picker Component */}
          <JobLocationMapPicker
            locationName={locationName}
            onLocationNameChange={setLocationName}
            latitude={latitude}
            longitude={longitude}
            onCoordinatesChange={handleCoordinatesChange}
          />
        </div>

        {/* SECTION 3: JOB DESCRIPTION, REQUIREMENTS & RESPONSIBILITIES */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Job Overview & Specifics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detail the mission, candidate prerequisites, and core tasks for the vacancy.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Job Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Outline the core purpose of this role, day-to-day team work, company culture, and mission..."
                className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none text-xs sm:text-sm leading-relaxed font-sans transition"
              />
            </div>

            {/* Requirements */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Qualifications & Requirements
              </label>
              <textarea
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="e.g. 3+ years experience with Next.js, Django, Docker, PostgreSQL. Strong communication skills..."
                className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none text-xs sm:text-sm leading-relaxed font-sans transition"
              />
            </div>

            {/* Responsibilities */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Key Responsibilities
              </label>
              <textarea
                rows={4}
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="e.g. Lead frontend architecture, mentor junior developers, implement secure REST APIs..."
                className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none text-xs sm:text-sm leading-relaxed font-sans transition"
              />
            </div>
          </div>
        </div>

        {/* 4. Action Buttons Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>All updates will reflect immediately upon saving.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/dashboard/recruiter/jobs"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-sky-600/20 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isEditMode ? 'Updating...' : 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isEditMode ? 'Update Vacancy' : 'Publish Vacancy'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewJobPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Vacancy Page...</p>
        </div>
      }
    >
      <AddVacancyContent />
    </Suspense>
  );
}
