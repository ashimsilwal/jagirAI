'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch, JobCategory, JobCategoryRequest, hasPermission } from '@/lib/api';
import {
  Tag,
  Plus,
  Search,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Layers,
  ArrowLeft,
  Clock,
  Send,
  Info,
  Check,
  Bookmark
} from 'lucide-react';

export default function RecruiterCategoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [myRequests, setMyRequests] = useState<JobCategoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'requests'>('categories');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Request Category Form State
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Role Protection
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'JOB_RECRUITER' && !user.is_staff && !user.is_superuser) {
        router.replace('/jobs');
      }
    }
  }, [user, authLoading, router]);

  // Load Categories & Requests
  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [catsData, reqsData] = await Promise.all([
        apiFetch<any>('/job-categories/').catch((err) => {
          console.error('Failed to load categories:', err);
          return [];
        }),
        apiFetch<any>('/job-category-requests/').catch((err) => {
          console.error('Failed to load requests:', err);
          return [];
        }),
      ]);

      const catList = Array.isArray(catsData) ? catsData : catsData?.results || [];
      const reqList = Array.isArray(reqsData) ? reqsData : reqsData?.results || [];
      setCategories(catList);
      setMyRequests(reqList);
    } catch (err: any) {
      setErrorMessage(err?.data?.detail || err?.message || 'Failed to load categories and requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Submit Category Request
  const handleCategoryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = requestName.trim();
    if (!trimmedName) {
      setErrorMessage('Category name is required.');
      return;
    }

    setSubmittingRequest(true);
    setErrorMessage(null);

    try {
      const newReq = await apiFetch<JobCategoryRequest>('/job-category-requests/', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          description: requestDescription.trim(),
          reason: requestReason.trim(),
        }),
      });

      setMyRequests((prev) => [newReq, ...prev]);
      setRequestName('');
      setRequestDescription('');
      setRequestReason('');
      setIsRequestOpen(false);
      setActiveTab('requests');
      const successMsg = `Category request for "${newReq.name}" submitted to the administrator for review.`;
      setActionMessage(successMsg);
      toast.success(successMsg, 'Request Submitted');
      setTimeout(() => setActionMessage(null), 6000);
    } catch (err: any) {
      const fieldError = err?.data?.name?.[0];
      const errMsg = fieldError || err?.data?.detail || err?.message || 'Failed to submit category request.';
      setErrorMessage(errMsg);
      toast.error(errMsg, 'Submission Failed');
    } finally {
      setSubmittingRequest(false);
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

  const pendingRequestsCount = useMemo(
    () => myRequests.filter((r) => r.status === 'PENDING').length,
    [myRequests]
  );

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
      {/* 1. TOP BREADCRUMB & HEADER */}
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
            <Link
              href="/dashboard/recruiter/jobs"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              My Jobs
            </Link>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">Job Categories</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Job Categories</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold">
              {categories.length} Available
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Browse all verified job categories across IT and diverse non-IT industries. Categories are curated by administrators and can be attached to your vacancies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/recruiter/jobs"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>My Jobs</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsRequestOpen(!isRequestOpen);
              setErrorMessage(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/25 transition cursor-pointer shrink-0"
          >
            {isRequestOpen ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            <span>{isRequestOpen ? 'Close Form' : 'Request New Category'}</span>
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

      {/* 3. REQUEST CATEGORY EXPANDABLE FORM */}
      {isRequestOpen && (
        <div className="bg-gradient-to-br from-sky-50/70 via-white to-blue-50/50 dark:from-black dark:via-black dark:to-black rounded-2xl border border-sky-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Request a New Category from Administrator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Categories are maintained by platform admins. If your industry or discipline is missing, submit a request below.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsRequestOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCategoryRequest} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Requested Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder="e.g. Healthcare & Nursing, Hospitality & Tourism, Renewable Energy"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Scope & Description (Optional)
                </label>
                <input
                  type="text"
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="e.g. Clinical care, registered nursing, pharmacy, and patient diagnostics"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Why is this category needed? (Optional note for Admin)
              </label>
              <textarea
                rows={2}
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="e.g. We are expanding our hospital staff and plan to post multiple nursing and doctor openings..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 text-xs sm:text-sm resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRequestOpen(false);
                  setRequestName('');
                  setRequestDescription('');
                  setRequestReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingRequest || !requestName.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submittingRequest ? 'Submitting Request...' : 'Submit Request to Admin'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. TABS: AVAILABLE CATEGORIES VS MY REQUESTS */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
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
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>My Category Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {pendingRequestsCount} Pending
              </span>
            )}
          </button>
        </div>

        {activeTab === 'categories' && (
          <div className="relative max-w-xs w-full hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter categories..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        )}
      </div>

      {/* 5. TAB CONTENT: CATEGORIES LIST */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Mobile search */}
          <div className="relative sm:hidden">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter categories..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <Tag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {search ? `No categories found matching "${search}"` : 'No Job Categories Available'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Need a category that isn't listed here? Send a request to the administrator.
              </p>
              <button
                type="button"
                onClick={() => setIsRequestOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
              >
                <Send className="w-4 h-4" />
                <span>Request Category</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 hover:border-sky-300 dark:hover:border-sky-700/60 shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight break-words">
                        {cat.name}
                      </h3>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800">
                        <Briefcase className="w-3 h-3" />
                        <span>{cat.jobs_count || 0} jobs</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {cat.slug}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed pt-1">
                      {cat.description || (
                        <span className="text-slate-400 italic">No description provided for this category.</span>
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

                    <Link
                      href={`/dashboard/recruiter/jobs?create=1`}
                      className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400"
                    >
                      <span>Post in category</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB CONTENT: MY CATEGORY REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200/80 dark:border-sky-800/80 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-3">
            <Info className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
            <div>
              <p className="font-semibold">How Category Requests Work</p>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                When you request a category, it is reviewed by the Jagir AI administration team. Once approved, the category is instantly added to the platform and can be selected when posting jobs and by job seekers in their preference profile.
              </p>
            </div>
          </div>

          {myRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No Category Requests Submitted
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                You haven't requested any custom job categories yet. Need a category for your open roles?
              </p>
              <button
                type="button"
                onClick={() => setIsRequestOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
              >
                <Send className="w-4 h-4" />
                <span>Submit Category Request</span>
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
              {myRequests.map((req) => (
                <div key={req.id} className="p-5 sm:p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
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
                          {req.status === 'APPROVED'
                            ? 'Approved & Added'
                            : req.status === 'REJECTED'
                            ? 'Declined by Admin'
                            : 'Pending Admin Review'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Requested on {new Date(req.created_at).toLocaleDateString()} at{' '}
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {req.status === 'APPROVED' && req.created_category && (
                      <Link
                        href={`/dashboard/recruiter/jobs?create=1`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Post Vacancy in this Category</span>
                      </Link>
                    )}
                  </div>

                  {req.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong className="text-slate-700 dark:text-slate-200">Scope: </strong>
                      {req.description}
                    </p>
                  )}

                  {req.reason && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <strong>Reason for request: </strong>
                      {req.reason}
                    </p>
                  )}

                  {req.admin_notes && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Admin feedback: </span>
                      <span className="text-slate-600 dark:text-slate-400">{req.admin_notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
