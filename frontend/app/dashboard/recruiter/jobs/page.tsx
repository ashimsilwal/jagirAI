'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch, Job, JobCategory, hasPermission } from '@/lib/api';
import {
  Briefcase,
  PlusCircle,
  Search,
  Filter,
  MapPin,
  Banknote,
  Calendar,
  Clock,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Trash2,
  Power,
  RotateCcw,
  Tag,
  Plus,
  Eye,
  ArrowRight,
  ChevronDown,
  Check,
  Send,
  Pencil
} from 'lucide-react';

function MyJobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const canCreateVacancy = hasPermission(user, 'vacancy.create');
  const canPublishVacancy = hasPermission(user, 'vacancy.publish');
  const canEditVacancy = hasPermission(user, 'vacancy.edit');
  const canDeleteVacancy = hasPermission(user, 'vacancy.delete');
  const canViewApplications = hasPermission(user, 'application.view');

  // Job Listing State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'CLOSED'>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Categories list
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Popup Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Modal Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formResponsibilities, setFormResponsibilities] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formEmploymentType, setFormEmploymentType] = useState('FULL_TIME');
  const [formDeadline, setFormDeadline] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [categoryQuery, setCategoryQuery] = useState<string>('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryComboboxRef = useRef<HTMLDivElement>(null);

  // Selected Category Object in Modal
  const selectedCategory = useMemo(() => {
    return categories.find((c) => String(c.id) === formCategoryId) || null;
  }, [categories, formCategoryId]);

  // Filter Categories in Modal Dropdown according to typed text
  const filteredModalCategories = useMemo(() => {
    if (!categoryQuery.trim()) return categories;
    const q = categoryQuery.toLowerCase().trim();
    return categories.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, categoryQuery]);

  // Click outside listener for category combobox dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryComboboxRef.current &&
        !categoryComboboxRef.current.contains(e.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
        if (selectedCategory) {
          setCategoryQuery(selectedCategory.name);
        } else {
          setCategoryQuery('');
        }
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen, selectedCategory]);

  // Form Submission State
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Form Reset Helper
  const resetForm = useCallback(() => {
    setEditingJob(null);
    setFormTitle('');
    setFormDescription('');
    setFormRequirements('');
    setFormResponsibilities('');
    setFormLocation('');
    setFormSalary('');
    setFormEmploymentType('FULL_TIME');
    setFormDeadline('');
    setFormStatus('ACTIVE');
    setFormCategoryId('');
    setCategoryQuery('');
    setIsCategoryDropdownOpen(false);
    setFormError(null);
  }, []);

  // Modal Open & Close Helpers
  const openModal = useCallback(() => {
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  // Open Modal in Edit Mode for an existing vacancy
  const handleEditJob = useCallback((job: Job) => {
    setEditingJob(job);
    setFormTitle(job.title || '');
    setFormDescription(job.description || '');
    setFormRequirements(job.requirements || '');
    setFormResponsibilities(job.responsibilities || '');
    setFormLocation(job.location || '');
    setFormSalary(job.salary || '');
    setFormEmploymentType(job.employment_type || 'FULL_TIME');
    setFormDeadline(job.deadline ? job.deadline.split('T')[0] : '');
    setFormStatus(job.status || 'ACTIVE');
    setFormCategoryId(job.category ? String(job.category.id) : '');
    setCategoryQuery(job.category ? job.category.name : '');
    setIsCategoryDropdownOpen(false);
    setFormError(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (formSubmitting) return;
    setIsModalOpen(false);
    resetForm();
  }, [formSubmitting, resetForm]);

  // When modal is closed via any mechanism, ensure form state is fully reset
  useEffect(() => {
    if (!isModalOpen) {
      resetForm();
    }
  }, [isModalOpen, resetForm]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen && !formSubmitting) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, formSubmitting, closeModal]);

  // Initial check: if recruiter or not
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'JOB_RECRUITER') {
        router.replace('/jobs');
      }
    }
  }, [user, authLoading, router]);

  // Check query param e.g. /jobs?create=1 or /jobs?edit=123
  useEffect(() => {
    if (searchParams?.get('create') === '1' && canCreateVacancy) {
      openModal();
    }
    const editId = searchParams?.get('edit');
    if (editId && canEditVacancy && jobs.length > 0) {
      const targetJob = jobs.find((j) => String(j.id) === editId);
      if (targetJob) {
        handleEditJob(targetJob);
      }
    }
  }, [searchParams, canCreateVacancy, canEditVacancy, jobs, openModal, handleEditJob]);

  // Background Scroll Prevention when Modal is Open
  useEffect(() => {
    if (isModalOpen) {
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
  }, [isModalOpen]);

  // Load Recruiter's Jobs
  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<any>('/jobs/my-jobs/?page_size=100');
      const list = Array.isArray(data) ? data : data.results || [];
      setJobs(list);
    } catch (err: any) {
      console.error('Failed to load my jobs:', err);
      setError(err?.data?.detail || err?.message || 'Failed to load your vacancies.');
    } finally {
      setLoading(false);
    }
  };

  // Load Job Categories
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await apiFetch<JobCategory[] | { results: JobCategory[] }>('/job-categories/');
      const list = Array.isArray(data) ? data : data.results || [];
      setCategories(list);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadCategories();
  }, []);

  // Handle Job Form Submit
  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = formTitle.trim();
    const trimmedDesc = formDescription.trim();
    const trimmedLoc = formLocation.trim();

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

    setFormSubmitting(true);

    try {
      const payload: Record<string, any> = {
        title: trimmedTitle,
        description: trimmedDesc,
        requirements: formRequirements.trim(),
        responsibilities: formResponsibilities.trim(),
        location: trimmedLoc,
        salary: formSalary.trim(),
        employment_type: formEmploymentType,
        deadline: formDeadline || null,
        status: formStatus,
      };

      if (formCategoryId) {
        payload.category_id = parseInt(formCategoryId, 10);
      } else {
        payload.category_id = null;
      }

      if (editingJob) {
        const updated = await apiFetch<Job>(`/jobs/${editingJob.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });

        // Update local vacancy state
        setJobs((prev) =>
          prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j))
        );

        // Reset modal form and close
        closeModal();

        const successMsg = `Vacancy "${updated.title}" updated successfully!`;
        setActionMessage(successMsg);
        toast.success(successMsg, 'Vacancy Saved');
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        await apiFetch('/jobs/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        // Reset modal form and close
        closeModal();

        const successMsg = 'New vacancy posted successfully! It is now live on Jagir AI.';
        setActionMessage(successMsg);
        toast.success(successMsg, 'Vacancy Published');
        setTimeout(() => setActionMessage(null), 4000);

        // Reload jobs
        await loadJobs();
      }
    } catch (err: any) {
      const errMsg =
        err?.data?.detail ||
        err?.message ||
        (editingJob ? 'Failed to update vacancy. Please check inputs.' : 'Failed to publish vacancy. Please check inputs.');
      setFormError(errMsg);
      toast.error(errMsg, editingJob ? 'Save Failed' : 'Publish Failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Job Status (ACTIVE <-> CLOSED)
  const handleToggleStatus = async (job: Job) => {
    if (!canPublishVacancy && !canEditVacancy) {
      toast.warning('You do not have permission to change vacancy status.', 'Access Denied');
      return;
    }

    const newStatus = job.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    setActionLoadingId(job.id);
    try {
      await apiFetch(`/jobs/${job.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: newStatus as any } : j))
      );
      const statusMsg = `Job "${job.title}" marked as ${newStatus}.`;
      setActionMessage(statusMsg);
      toast.success(statusMsg, 'Status Updated');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      toast.error('Failed to update job status.', 'Action Failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Job Vacancy
  const handleDeleteJob = async (jobId: number, title: string) => {
    if (!canDeleteVacancy) {
      toast.warning('You do not have permission to delete vacancies.', 'Access Denied');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setActionLoadingId(jobId);
    try {
      await apiFetch(`/jobs/${jobId}/`, {
        method: 'DELETE',
      });

      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      const delMsg = `Vacancy "${title}" deleted successfully.`;
      setActionMessage(delMsg);
      toast.success(delMsg, 'Vacancy Deleted');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      toast.error('Failed to delete vacancy.', 'Action Failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Status filter
      if (statusFilter !== 'ALL' && job.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (selectedCategoryFilter !== 'ALL') {
        if (!job.category || String(job.category.id) !== selectedCategoryFilter) {
          return false;
        }
      }
      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesLoc = job.location.toLowerCase().includes(q);
        const matchesCat = job.category?.name.toLowerCase().includes(q);
        return matchesTitle || matchesLoc || matchesCat;
      }
      return true;
    });
  }, [jobs, statusFilter, selectedCategoryFilter, search]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = jobs.length;
    const active = jobs.filter((j) => j.status === 'ACTIVE').length;
    const closed = jobs.filter((j) => j.status === 'CLOSED').length;
    const drafts = jobs.filter((j) => j.status === 'DRAFT').length;
    const totalApplications = jobs.reduce((acc, j) => acc + (j.applications_count || 0), 0);
    return { total, active, closed, drafts, totalApplications };
  }, [jobs]);

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
      {/* 1. TOP HEADER & POST VACANCY BUTTON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/recruiter"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Dashboard
            </Link>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">My Jobs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            My Posted Vacancies
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your company’s active job openings, applicant pipelines, and categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/recruiter/categories"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <Tag className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Request Category</span>
          </Link>

          {canCreateVacancy && (
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/25 transition cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post New Vacancy</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. NOTIFICATION / ACTION BANNER */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:underline text-[11px] font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Vacancies</span>
            <Briefcase className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {metrics.total}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Listings</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {metrics.active}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Applicants</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {metrics.totalApplications}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Closed / Draft</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-300 mt-2">
            {metrics.closed + metrics.drafts}
          </p>
        </div>
      </div>

      {/* 4. SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, location, category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[180px] truncate"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          {(search || statusFilter !== 'ALL' || selectedCategoryFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setSelectedCategoryFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 5. JOBS CATALOG CARDS */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-9 h-9 rounded-full border-2 border-sky-600 border-t-transparent animate-spin mb-3" />
          <p className="text-xs text-slate-500">Loading your vacancies...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No vacancies found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {jobs.length === 0
              ? 'You have not published any job vacancies yet. Click the button below to post your first opening.'
              : 'No vacancies match your current search and filter criteria.'}
          </p>
          {canCreateVacancy && jobs.length === 0 && (
            <button
              type="button"
              onClick={openModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post First Vacancy</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredJobs.map((job) => {
            const isActionLoading = actionLoadingId === job.id;
            return (
              <div
                key={job.id}
                className="group p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-sky-300 dark:hover:border-sky-500/50 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition truncate"
                    >
                      {job.title}
                    </Link>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        job.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                          : job.status === 'DRAFT'
                          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {job.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      <span>{job.status}</span>
                    </span>

                    {/* Category Pill */}
                    {job.category && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{job.category.name}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.location}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.employment_type.replace('_', ' ')}</span>
                    </span>
                    {job.salary && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <Banknote className="w-3.5 h-3.5" />
                          <span>{job.salary}</span>
                        </span>
                      </>
                    )}
                    {job.deadline && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                  {/* View Applicants Link */}
                  {canViewApplications && (
                    <Link
                      href={`/dashboard/recruiter/jobs/${job.id}/applicants`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition"
                      title="View candidates who applied for this vacancy"
                    >
                      <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Applicants</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-600 text-white ml-0.5">
                        {job.applications_count || 0}
                      </span>
                    </Link>
                  )}

                  {/* Edit Vacancy Button */}
                  {canEditVacancy && (
                    <button
                      type="button"
                      onClick={() => handleEditJob(job)}
                      disabled={isActionLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/60 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-700 transition cursor-pointer disabled:opacity-50"
                      title="Edit this vacancy"
                    >
                      <Pencil className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Edit</span>
                    </button>
                  )}

                  {/* Public Link */}
                  <Link
                    href={`/jobs/${job.id}`}
                    target="_blank"
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    title="View public listing in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {/* Toggle Status (Active <-> Closed) */}
                  {(canPublishVacancy || canEditVacancy) && (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(job)}
                      disabled={isActionLoading}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer disabled:opacity-50 ${
                        job.status === 'ACTIVE'
                          ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40'
                          : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                      title={job.status === 'ACTIVE' ? 'Close vacancy to new applicants' : 'Activate vacancy'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{job.status === 'ACTIVE' ? 'Close' : 'Activate'}</span>
                    </button>
                  )}

                  {/* Delete Button */}
                  {canDeleteVacancy && (
                    <button
                      type="button"
                      onClick={() => handleDeleteJob(job.id, job.title)}
                      disabled={isActionLoading}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer disabled:opacity-50"
                      title="Delete this vacancy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. POPUP FORM (MODAL): POST NEW VACANCY                               */}
      {/* Background scrolling is disabled while this modal is displayed        */}
      {/* ===================================================================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overscroll-none"
          onClick={(e) => {
            // Close if clicking outside the modal content container
            if (e.target === e.currentTarget && !formSubmitting) {
              closeModal();
            }
          }}
        >
          <div
            className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-post-vacancy-title"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                  {editingJob ? <Pencil className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                </div>
                <div>
                  <h2
                    id="modal-post-vacancy-title"
                    className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                  >
                    {editingJob ? 'Edit Vacancy' : 'Post New Vacancy'}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {editingJob
                      ? `Editing vacancy #${editingJob.id} ("${editingJob.title}"). Changes reflect immediately.`
                      : 'Create a vacancy and categorize it so matching candidates discover it first.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={formSubmitting}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                aria-label="Close popup form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable inside popup) */}
            <form onSubmit={handleJobSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Form Error Alert */}
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Job Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none text-xs sm:text-sm transition"
                  />
                </div>

                {/* Job Category Dropdown (Searchable / Filterable by typing) */}
                <div ref={categoryComboboxRef} className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Job Category <span className="text-rose-500">*</span>
                    </label>
                    <Link
                      href="/dashboard/recruiter/categories"
                      target="_blank"
                      className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Tag className="w-3 h-3" />
                      <span>Manage / Request</span>
                    </Link>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={categoryQuery}
                      onFocus={() => setIsCategoryDropdownOpen(true)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCategoryQuery(val);
                        setIsCategoryDropdownOpen(true);
                        const exactMatch = categories.find((c) => c.name.toLowerCase() === val.toLowerCase().trim());
                        if (exactMatch) {
                          setFormCategoryId(String(exactMatch.id));
                        } else {
                          setFormCategoryId('');
                        }
                      }}
                      placeholder="Type to search & select category..."
                      className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none text-xs sm:text-sm transition"
                    />

                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {(formCategoryId || categoryQuery) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormCategoryId('');
                            setCategoryQuery('');
                            setIsCategoryDropdownOpen(true);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                          title="Clear category"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                        title="Toggle category list"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180 text-sky-600' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Filtered Dropdown Menu */}
                  {isCategoryDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
                      {filteredModalCategories.length === 0 ? (
                        <div className="p-4 text-center space-y-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            No category matching &ldquo;<span className="font-semibold text-slate-700 dark:text-slate-300">{categoryQuery}</span>&rdquo;
                          </p>
                          <Link
                            href="/dashboard/recruiter/categories"
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            <Send className="w-3 h-3" />
                            <span>Request this category from Admin</span>
                          </Link>
                        </div>
                      ) : (
                        filteredModalCategories.map((cat) => {
                          const isSelected = String(cat.id) === formCategoryId;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setFormCategoryId(String(cat.id));
                                setCategoryQuery(cat.name);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 font-semibold'
                                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-sky-600 dark:hover:text-sky-400'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{cat.name}</div>
                                {cat.description && (
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                    {cat.description}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 mt-1">
                    {selectedCategory ? (
                      <span className="text-sky-600 dark:text-sky-400 font-medium">
                        ✓ Selected: {selectedCategory.name}
                      </span>
                    ) : (
                      'Type keyword (e.g. "finance", "health", "eng") or click dropdown to choose.'
                    )}
                  </p>
                </div>
              </div>

              {/* Employment Type & Location Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Employment Type
                  </label>
                  <select
                    value={formEmploymentType}
                    onChange={(e) => setFormEmploymentType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none text-xs sm:text-sm transition cursor-pointer"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Kathmandu, Nepal or Remote Worldwide"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none text-xs sm:text-sm transition"
                  />
                </div>
              </div>

              {/* Salary, Deadline & Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Salary Range (Optional)
                  </label>
                  <input
                    type="text"
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    placeholder="e.g. Rs. 80,000 - 120,000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none text-xs sm:text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none text-xs sm:text-sm transition cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Publish Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none text-xs sm:text-sm transition cursor-pointer"
                  >
                    <option value="ACTIVE">Active (Publish Now)</option>
                    <option value="DRAFT">Draft (Save for Later)</option>
                  </select>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Outline the core purpose of this role, day-to-day work, and team structure..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none text-xs sm:text-sm transition resize-none"
                />
              </div>

              {/* Requirements & Responsibilities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Key Requirements
                  </label>
                  <textarea
                    rows={3}
                    value={formRequirements}
                    onChange={(e) => setFormRequirements(e.target.value)}
                    placeholder="e.g. 3+ years experience with Python, Django, PostgreSQL, Docker..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none text-xs sm:text-sm transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Key Responsibilities
                  </label>
                  <textarea
                    rows={3}
                    value={formResponsibilities}
                    onChange={(e) => setFormResponsibilities(e.target.value)}
                    placeholder="e.g. Design backend APIs, collaborate with frontend team, optimize queries..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none text-xs sm:text-sm transition resize-none"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={formSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/25 transition cursor-pointer disabled:opacity-60"
                >
                  {formSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{editingJob ? 'Saving Changes...' : 'Publishing Vacancy...'}</span>
                    </>
                  ) : (
                    <>
                      {editingJob ? <Check className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                      <span>{editingJob ? 'Save Changes' : 'Publish Vacancy'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <MyJobsContent />
    </Suspense>
  );
}
