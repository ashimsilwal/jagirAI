'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch, JobCategory, JobCategoryRequest } from '@/lib/api';
import {
  Tag,
  Plus,
  Search,
  Briefcase,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Clock,
  Check,
  Inbox,
  User,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [requests, setRequests] = useState<JobCategoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'requests'>('categories');
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Category State (Admin Direct Add)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit Category State
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Request Action State (Approve / Reject)
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
  const [actionModalRequest, setActionModalRequest] = useState<JobCategoryRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Admin access control
  useEffect(() => {
    if (!authLoading && user) {
      if (!user.is_staff && !user.is_superuser) {
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Lock background body & html scroll completely when any modal is open
  useEffect(() => {
    if (isAddModalOpen || editingCategory || actionModalRequest) {
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
  }, [isAddModalOpen, editingCategory, actionModalRequest]);

  // Load all categories and recruiter requests
  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [catsData, reqsData] = await Promise.all([
        apiFetch<any>('/job-categories/'),
        apiFetch<any>('/job-category-requests/'),
      ]);

      const catList = Array.isArray(catsData) ? catsData : catsData?.results || [];
      const reqList = Array.isArray(reqsData) ? reqsData : reqsData?.results || [];

      setCategories(catList);
      setRequests(reqList);
    } catch (err: any) {
      setErrorMessage(err?.data?.detail || err?.message || 'Failed to load category data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Admin directly creates category
  const handleAdminAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = addName.trim();
    if (!trimmed) {
      setErrorMessage('Category name is required.');
      return;
    }

    setAddSubmitting(true);
    setErrorMessage(null);
    try {
      const created = await apiFetch<JobCategory>('/job-categories/', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmed,
          description: addDescription.trim(),
        }),
      });

      setCategories((prev) => {
        if (prev.some((c) => c.id === created.id)) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });

      setAddName('');
      setAddDescription('');
      setIsAddModalOpen(false);
      const successMsg = `Job Category "${created.name}" created and published system-wide.`;
      setActionMessage(successMsg);
      toast.success(successMsg, 'Category Created');
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      const fieldError = err?.data?.name?.[0];
      const errMsg = fieldError || err?.data?.detail || err?.message || 'Failed to create category.';
      setErrorMessage(errMsg);
      toast.error(errMsg, 'Create Failed');
    } finally {
      setAddSubmitting(false);
    }
  };

  // Admin edits category
  const handleAdminUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setErrorMessage('Category name is required.');
      return;
    }

    setEditSubmitting(true);
    setErrorMessage(null);
    try {
      const updated = await apiFetch<JobCategory>(`/job-categories/${editingCategory.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: trimmed,
          description: editDescription.trim(),
        }),
      });

      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
      );

      setEditingCategory(null);
      const successMsg = `Category "${updated.name}" updated successfully.`;
      setActionMessage(successMsg);
      toast.success(successMsg, 'Category Updated');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      const fieldError = err?.data?.name?.[0];
      const errMsg = fieldError || err?.data?.detail || err?.message || 'Failed to update category.';
      setErrorMessage(errMsg);
      toast.error(errMsg, 'Update Failed');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Admin deletes category
  const handleAdminDeleteCategory = async (cat: JobCategory) => {
    const warning = (cat.jobs_count || 0) > 0
      ? `This category has ${cat.jobs_count} job vacancy(ies). Deleting it will leave those vacancies uncategorized.\n\nAre you sure you want to delete "${cat.name}"?`
      : `Are you sure you want to delete category "${cat.name}"?`;

    if (!confirm(warning)) return;

    setDeletingId(cat.id);
    try {
      await apiFetch(`/job-categories/${cat.id}/`, {
        method: 'DELETE',
      });

      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      const successMsg = `Category "${cat.name}" deleted successfully.`;
      setActionMessage(successMsg);
      toast.success(successMsg, 'Category Deleted');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      const errMsg = err?.data?.detail || err?.message || 'Failed to delete category.';
      setErrorMessage(errMsg);
      toast.error(errMsg, 'Delete Failed');
    } finally {
      setDeletingId(null);
    }
  };

  // Open Request Action Modal
  const openActionModal = (req: JobCategoryRequest, type: 'approve' | 'reject') => {
    setActionModalRequest(req);
    setActionType(type);
    setAdminNoteInput(type === 'approve' ? 'Approved for platform use.' : '');
    setErrorMessage(null);
  };

  // Confirm Request Action (Approve / Reject)
  const handleConfirmRequestAction = async () => {
    if (!actionModalRequest) return;
    setProcessingRequestId(actionModalRequest.id);
    setErrorMessage(null);

    try {
      const endpoint = `/job-category-requests/${actionModalRequest.id}/${actionType}/`;
      const res = await apiFetch<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          admin_notes: adminNoteInput.trim(),
        }),
      });

      // Update local request state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === actionModalRequest.id
            ? {
                ...r,
                status: actionType === 'approve' ? 'APPROVED' : 'REJECTED',
                admin_notes: adminNoteInput.trim(),
                created_category: res.category || r.created_category,
              }
            : r
        )
      );

      // If approved, refresh categories
      if (actionType === 'approve' && res.category) {
        setCategories((prev) => {
          if (prev.some((c) => c.id === res.category.id)) return prev;
          return [...prev, res.category].sort((a, b) => a.name.localeCompare(b.name));
        });
      }

      const successMsg = res.detail || `Category request ${actionType}d.`;
      setActionMessage(successMsg);
      toast.success(successMsg, actionType === 'approve' ? 'Request Approved' : 'Request Rejected');
      setActionModalRequest(null);
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      const errMsg = err?.data?.detail || err?.message || `Failed to ${actionType} request.`;
      setErrorMessage(errMsg);
      toast.error(errMsg, 'Action Failed');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, search]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    if (requestFilter === 'ALL') return requests;
    return requests.filter((r) => r.status === requestFilter);
  }, [requests, requestFilter]);

  const pendingRequestsCount = useMemo(
    () => requests.filter((r) => r.status === 'PENDING').length,
    [requests]
  );

  const totalCategorizedJobs = useMemo(
    () => categories.reduce((acc, c) => acc + (c.jobs_count || 0), 0),
    [categories]
  );

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
      {/* 1. TOP HEADER & DIRECT ADD BUTTON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/admin"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Admin Dashboard
            </Link>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">Job Categories</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-sky-600" />
            <span>Job Categories Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Admin console to create, update, or remove job categories, and review pending category requests from recruiters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <span>Overview</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsAddModalOpen(true);
              setErrorMessage(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/25 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* 2. NOTIFICATIONS */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:underline text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 dark:text-rose-400 hover:underline text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Active Categories
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {categories.length}
          </p>
          <p className="text-[11px] text-slate-400">
            Available across job listings and candidate preference options
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Recruiter Requests
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {pendingRequestsCount}
            </p>
            {pendingRequestsCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Action Needed
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Pending category requests submitted by recruiters
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Categorized Openings
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {totalCategorizedJobs}
          </p>
          <p className="text-[11px] text-slate-400">
            Jobs assigned to approved standardized categories
          </p>
        </div>
      </div>

      {/* 4. PRIMARY TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>All Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Recruiter Requests ({requests.length})</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                {pendingRequestsCount} Pending
              </span>
            )}
          </button>
        </div>

        {activeTab === 'categories' ? (
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setRequestFilter(st)}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  requestFilter === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. TAB: ALL CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-36 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <Tag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {search ? `No categories found matching "${search}"` : 'No Categories Configured'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {search ? 'Try clearing search terms.' : 'Create categories to allow recruiters and seekers to select standard roles.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 hover:border-sky-300 dark:hover:border-sky-700/60 shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight break-words">
                          {cat.name}
                        </h3>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {cat.slug}
                        </span>
                      </div>

                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800">
                        <Briefcase className="w-3 h-3" />
                        <span>{cat.jobs_count || 0} jobs</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {cat.description || (
                        <span className="text-slate-400 italic">No description provided.</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <Link
                      href={`/jobs?category=${cat.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      <span>View public vacancies</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditName(cat.name);
                          setEditDescription(cat.description || '');
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAdminDeleteCategory(cat)}
                        disabled={deletingId === cat.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer disabled:opacity-50"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB: RECRUITER CATEGORY REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No Category Requests Match Filter "{requestFilter}"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                When recruiters submit requests for missing domains or industries, they appear here for your review and approval.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
              {filteredRequests.map((req) => (
                <div key={req.id} className="p-5 sm:p-6 space-y-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">
                          {req.name}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Requested by {req.requester.username} ({req.requester.email})
                        </span>
                        <span>•</span>
                        <span>{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {req.status === 'PENDING' ? (
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => openActionModal(req, 'approve')}
                          disabled={processingRequestId === req.id}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Add Category</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openActionModal(req, 'reject')}
                          disabled={processingRequestId === req.id}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    ) : req.status === 'APPROVED' && req.created_category ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ Category active in system (ID #{req.created_category.id})
                      </span>
                    ) : null}
                  </div>

                  {req.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong className="text-slate-800 dark:text-slate-200">Scope description: </strong>
                      {req.description}
                    </p>
                  )}

                  {req.reason && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <strong>Recruiter note: </strong>
                      {req.reason}
                    </p>
                  )}

                  {req.admin_notes && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Admin Response: </span>
                      <span className="text-slate-600 dark:text-slate-400">{req.admin_notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. MODAL: ADMIN DIRECT ADD CATEGORY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overscroll-none">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                <span>Create New Job Category</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Healthcare & Nursing, Construction & Civil"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Scope & Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  placeholder="Describe the discipline, key responsibilities, and relevant industries..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting || !addName.trim()}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
                >
                  {addSubmitting ? 'Publishing...' : 'Publish Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: EDIT CATEGORY */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overscroll-none">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-600" />
                <span>Edit Job Category</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting || !editName.trim()}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: APPROVE / REJECT REQUEST */}
      {actionModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overscroll-none">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {actionType === 'approve' ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>Approve Category Request</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-rose-600" />
                    <span>Decline Category Request</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setActionModalRequest(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {actionModalRequest.name}
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Requested by: {actionModalRequest.requester.username} ({actionModalRequest.requester.email})
              </p>
              {actionModalRequest.description && (
                <p className="text-slate-600 dark:text-slate-300">
                  {actionModalRequest.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Admin Response Note (Optional)
              </label>
              <textarea
                rows={2}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="Message for the recruiter..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActionModalRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRequestAction}
                disabled={processingRequestId === actionModalRequest.id}
                className={`px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {processingRequestId === actionModalRequest.id
                  ? 'Processing...'
                  : actionType === 'approve'
                  ? 'Approve & Create Category'
                  : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

