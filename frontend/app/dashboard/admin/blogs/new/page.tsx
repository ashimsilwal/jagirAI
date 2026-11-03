'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch } from '@/lib/api';
import { JoditEditorWrapper } from '@/components/JoditEditorWrapper';
import {
  ArrowLeft,
  Check,
  Eye,
  FileText,
  ImageIcon,
  Sparkles,
  Tag,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  FolderOpen
} from 'lucide-react';

const COMMON_CATEGORIES = [
  'Career Advice',
  'Hiring Tips',
  'Industry Trends',
  'Tech & AI',
  'Resume Guides',
  'Interview Prep',
  'Workplace Culture',
  'Company News',
];

export default function CreateBlogPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Career Advice');
  const [customCategory, setCustomCategory] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [readTime, setReadTime] = useState<number>(5);
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');

  const [submitting, setSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && (!user || (!user.is_staff && !user.is_superuser))) {
      router.replace('/dashboard');
    } else if (user && !authorName) {
      setAuthorName(user.username || 'Jagir AI Editorial Team');
    }
  }, [user, authLoading, router, authorName]);

  // Calculate estimated read time from content
  useEffect(() => {
    if (content) {
      const plainText = content.replace(/<[^>]*>/g, ' ').trim();
      const words = plainText.split(/\s+/).filter(Boolean).length;
      setReadTime(Math.max(1, Math.ceil(words / 200)));
    }
  }, [content]);

  // Handle Cover Image File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverImagePreview(previewUrl);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Article title is required.', 'Validation Error');
      return;
    }
    if (!content.trim() || content === '<p><br></p>') {
      toast.error('Article content cannot be empty.', 'Validation Error');
      return;
    }

    const finalCategory = category === 'Custom' ? customCategory.trim() || 'General' : category;

    try {
      setSubmitting(true);

      if (coverImageFile) {
        const formData = new FormData();
        formData.append('title', title.trim());
        if (slug.trim()) formData.append('slug', slug.trim());
        formData.append('category', finalCategory);
        formData.append('author_name', authorName.trim());
        formData.append('cover_image', coverImageFile);
        if (coverImageUrl.trim()) formData.append('cover_image_url', coverImageUrl.trim());
        formData.append('excerpt', excerpt.trim());
        formData.append('content', content);
        formData.append('tags', tags.trim());
        formData.append('read_time', readTime.toString());
        formData.append('status', status);

        const newPost = await apiFetch('/blogs/', {
          method: 'POST',
          body: formData,
        });
        toast.success(`"${title}" has been published!`, 'Blog Created');
        router.push(`/dashboard/admin/blogs`);
      } else {
        const payload: Record<string, any> = {
          title: title.trim(),
          category: finalCategory,
          author_name: authorName.trim(),
          cover_image_url: coverImageUrl.trim(),
          excerpt: excerpt.trim(),
          content,
          tags: tags.trim(),
          read_time: readTime,
          status,
        };
        if (slug.trim()) payload.slug = slug.trim();

        const newPost = await apiFetch('/blogs/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success(`"${title}" has been published!`, 'Blog Created');
        router.push(`/dashboard/admin/blogs`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create blog post.', 'Save Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link
              href="/dashboard/admin/blogs"
              className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Manage Blogs</span>
            </Link>
            <span>/</span>
            <span>New Post</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Create Blog Article
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Compose and format rich articles using Jodit WYSIWYG editor with full support for tables, lists, and media.
          </p>
        </div>

        {/* Live Preview Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
              previewMode
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{previewMode ? 'Return to Editor' : 'Live Article Preview'}</span>
          </button>
        </div>
      </div>

      {previewMode ? (
        /* LIVE ARTICLE PREVIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
              {category === 'Custom' ? customCategory || 'General' : category}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">{readTime} min read</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            {title || 'Untitled Blog Post'}
          </h1>

          {coverImagePreview && (
            <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <img src={coverImagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
            </div>
          )}

          {excerpt && (
            <div className="p-4 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic text-base">
              &ldquo;{excerpt}&rdquo;
            </div>
          )}

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Rendered HTML content with tables and bullets */}
          <div
            className="jodit-content-rendered text-slate-800 dark:text-slate-200"
            dangerouslySetInnerHTML={{ __html: content || '<p>No content written yet.</p>' }}
          />
        </div>
      ) : (
        /* EDITOR FORM */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column (8 cols): Title, Excerpt, Jodit Editor */}
          <div className="lg:col-span-8 space-y-6">
            {/* Title */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Article Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Navigating Remote Tech Opportunities from Kathmandu"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* URL Slug */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Custom Slug (Optional)
                </label>
                <span className="text-[11px] text-slate-400">Auto-generated from title if blank</span>
              </div>
              <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                <span className="text-xs text-slate-400 font-mono select-none">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="custom-article-slug"
                  className="w-full bg-transparent text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Short Excerpt */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Short Excerpt / Summary
                </label>
                <span className="text-[11px] text-slate-400">{excerpt.length} characters</span>
              </div>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A concise 1-2 sentence preview displayed on card grids..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
              />
            </div>

            {/* JODIT WYSIWYG EDITOR */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Full Article Content (Jodit Editor) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
                  Tables, Bullets & Media enabled
                </span>
              </div>

              <JoditEditorWrapper
                value={content}
                onChange={(newContent) => setContent(newContent)}
                placeholder="Compose full content here. Use the toolbar above to insert tables, bulleted lists, headings, links, and media..."
                minHeight={520}
              />
            </div>
          </div>

          {/* Sidebar Column (4 cols): Publish Status, Category, Cover, Tags */}
          <div className="lg:col-span-4 space-y-6">
            {/* Publish & Status Card */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Publication Settings
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Post Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="PUBLISHED">Published (Visible to public)</option>
                    <option value="DRAFT">Draft (Admin eyes only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Estimated Read Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={readTime}
                    onChange={(e) => setReadTime(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Author Display Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Editorial Team"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Article...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{status === 'PUBLISHED' ? 'Publish Article Now' : 'Save As Draft'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Category Card */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Category
              </h3>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Custom">+ Custom Category...</option>
              </select>

              {category === 'Custom' && (
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              )}
            </div>

            {/* Cover Image Card */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Cover Image
              </h3>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Upload Image File:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Or External Image URL:
                </label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => {
                    setCoverImageUrl(e.target.value);
                    if (!coverImageFile) setCoverImagePreview(e.target.value);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {coverImagePreview && (
                <div className="pt-2 space-y-1.5">
                  <img
                    src={coverImagePreview}
                    alt="Cover Preview"
                    className="w-full h-36 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cover image ready
                  </p>
                </div>
              )}
            </div>

            {/* Tags Card */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Tags & Keywords
              </h3>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Careers, Interview, Tech, Nepal"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[11px] text-slate-400">Separate keywords with commas</p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

