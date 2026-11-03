'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch, BlogPost } from '@/lib/api';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Eye,
  Calendar,
  Clock,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Tag,
  User,
  Check,
  RotateCcw,
  SlidersHorizontal,
  FolderOpen,
  Layers
} from 'lucide-react';

export default function AdminBlogsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Delete State
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Background Scroll Locking
  useEffect(() => {
    if (deleteConfirmPost) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [deleteConfirmPost]);

  // Auth Protection
  useEffect(() => {
    if (!authLoading && (!user || (!user.is_staff && !user.is_superuser))) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  // Load All Blogs for Admin
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      // Admin request gets all posts
      const data = await apiFetch<any>('/blogs/');
      const list = Array.isArray(data) ? data : data.results || [];
      setBlogs(list);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load blog posts', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.is_staff || user.is_superuser)) {
      fetchBlogs();
    }
  }, [user]);

  // Delete Action
  const handleDeletePost = async () => {
    if (!deleteConfirmPost) return;
    try {
      setDeleting(true);
      await apiFetch(`/blogs/${deleteConfirmPost.slug}/`, {
        method: 'DELETE',
      });
      toast.success(`"${deleteConfirmPost.title}" was deleted.`, 'Blog Deleted');
      setBlogs((prev) => prev.filter((p) => p.id !== deleteConfirmPost.id));
      setDeleteConfirmPost(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete blog post', 'Delete Error');
    } finally {
      setDeleting(false);
    }
  };

  // Computed Filtered List
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      // Category Filter
      if (selectedCategory !== 'ALL' && b.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Status Filter
      if (selectedStatus !== 'ALL' && b.status !== selectedStatus) {
        return false;
      }
      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(q);
        const matchesExcerpt = (b.excerpt || '').toLowerCase().includes(q);
        const matchesAuthor = (b.author_name || '').toLowerCase().includes(q);
        const matchesTags = (b.tags || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesExcerpt && !matchesAuthor && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [blogs, selectedCategory, selectedStatus, search]);

  // Metrics
  const totalPosts = blogs.length;
  const publishedCount = blogs.filter((b) => b.status === 'PUBLISHED').length;
  const draftCount = blogs.filter((b) => b.status === 'DRAFT').length;
  const totalViews = blogs.reduce((acc, b) => acc + (b.views_count || 0), 0);

  // Distinct Categories for Filter Pill
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    blogs.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [blogs]);

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 min-w-0">
      {/* 1. HEADER SECTION */}
      <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 dark:from-black dark:via-black dark:to-black border border-sky-100/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          {/* <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
              <BookOpen className="w-3.5 h-3.5" />
              Content Management System
            </span>
          </div> */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
            Blog & Articles Hub
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Create, edit, and publish dynamic career insights, hiring guides, and industry news for job seekers and recruiters across Nepal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/blog"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>View Public Blog</span>
          </Link>

          <Link
            href="/dashboard/admin/blogs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Post</span>
          </Link>
        </div>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Posts
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {totalPosts}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Published Live
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {publishedCount}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Drafts
            </p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {draftCount}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Reader Views
            </p>
            <p className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">
              {totalViews.toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, excerpt, author, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
            {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedStatus === s
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {s === 'ALL' ? 'All Posts' : s === 'PUBLISHED' ? 'Published' : 'Drafts'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            Category:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Categories
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. BLOGS TABLE / LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading blog articles...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-20 text-center px-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No blog articles found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {search || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
                  ? 'Try adjusting your search criteria or resetting filters.'
                  : 'Get started by creating your first dynamic blog article!'}
              </p>
            </div>
            {search || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <Link
                href="/dashboard/admin/blogs/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Write First Post</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Article</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4 text-center">Views</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredBlogs.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Article Details */}
                    <td className="py-4 px-4 min-w-[280px]">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-11 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 relative">
                          {post.effective_cover_image ? (
                            <img
                              src={post.effective_cover_image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition line-clamp-1 block"
                            title={post.title}
                          >
                            {post.title}
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-mono text-[11px]">
                            /{post.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/60">
                        {post.category}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {post.status === 'PUBLISHED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800">
                          Draft
                        </span>
                      )}
                    </td>

                    {/* Author */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{post.author_name || 'Jagir AI'}</span>
                      </div>
                    </td>

                    {/* Views */}
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                        <Eye className="w-3 h-3 text-slate-400" />
                        {post.views_count.toLocaleString()}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-[11px] text-slate-400">{post.read_time} min read</p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          title="Preview public article"
                          className="w-8.5 h-8.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 dark:bg-slate-800 dark:hover:bg-sky-950/70 dark:text-slate-300 dark:hover:text-sky-400 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <ExternalLink size={19} className="w-[19px] h-[19px] stroke-[2]" />
                        </Link>
                        <Link
                          href={`/dashboard/admin/blogs/${post.slug}/edit`}
                          title="Edit article"
                          className="w-8.5 h-8.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 dark:bg-slate-800 dark:hover:bg-sky-950/70 dark:text-slate-300 dark:hover:text-sky-400 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Edit3 size={19} className="w-[19px] h-[19px] stroke-[2]" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmPost(post)}
                          title="Delete article"
                          className="w-8.5 h-8.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/70 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Trash2 size={19} className="w-[19px] h-[19px] stroke-[2]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 5. DELETE CONFIRMATION MODAL                                          */}
      {/* ===================================================================== */}
      {deleteConfirmPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overscroll-none"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setDeleteConfirmPost(null);
            }
          }}
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Blog Article?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  &ldquo;{deleteConfirmPost.title}&rdquo;
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPost(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

