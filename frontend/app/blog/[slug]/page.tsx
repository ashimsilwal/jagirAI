'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, BlogPost } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Share2,
  Bookmark,
  Check,
  BookOpen,
  Tag,
  User,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogPostDetailPage({ params }: BlogPostPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { toast } = useToast();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadPost() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch<BlogPost>(`/blogs/${slug}/`);
        setPost(data);

        // Increment view count dynamically in database
        apiFetch(`/blogs/${slug}/increment_view/`, { method: 'POST' }).catch(() => {});

        // Load related posts in same category
        if (data.category) {
          apiFetch<any>(`/blogs/?category=${encodeURIComponent(data.category)}`)
            .then((res) => {
              const list = Array.isArray(res) ? res : res.results || [];
              setRelatedPosts(list.filter((item: BlogPost) => item.id !== data.id).slice(0, 3));
            })
            .catch(() => {});
        }
      } catch (err: any) {
        setError(err.message || 'The requested article could not be found.');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadPost();
    }
  }, [slug]);

  // Handle Share / Copy Link
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Article link copied to clipboard!', 'Link Copied');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Helper function to render markdown / structured text into readable HTML elements
  const renderFormattedContent = (rawContent: string) => {
    if (!rawContent) return null;

    const lines = rawContent.split('\n');
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];

    const flushParagraph = (index: number) => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ').trim();
        if (text) {
          elements.push(
            <p key={`p-${index}`} className="text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              {text}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Heading 1
      if (trimmed.startsWith('# ')) {
        flushParagraph(idx);
        elements.push(
          <h1 key={`h1-${idx}`} className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white pt-6 pb-2">
            {trimmed.replace('# ', '')}
          </h1>
        );
        return;
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        flushParagraph(idx);
        elements.push(
          <h2 key={`h2-${idx}`} className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            {trimmed.replace('## ', '')}
          </h2>
        );
        return;
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        flushParagraph(idx);
        elements.push(
          <h3 key={`h3-${idx}`} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white pt-4 pb-1">
            {trimmed.replace('### ', '')}
          </h3>
        );
        return;
      }

      // Blockquote
      if (trimmed.startsWith('>')) {
        flushParagraph(idx);
        const quoteText = trimmed.replace(/^>\s*/, '');
        elements.push(
          <blockquote key={`quote-${idx}`} className="border-l-4 border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 p-4 sm:p-5 rounded-r-2xl my-4 text-slate-800 dark:text-slate-200 font-medium italic text-sm sm:text-base">
            {quoteText}
          </blockquote>
        );
        return;
      }

      // Horizontal Rule
      if (trimmed === '---' || trimmed === '***') {
        flushParagraph(idx);
        elements.push(
          <hr key={`hr-${idx}`} className="my-8 border-slate-200 dark:border-slate-800" />
        );
        return;
      }

      // List Item
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        flushParagraph(idx);
        elements.push(
          <li key={`li-${idx}`} className="ml-5 list-disc text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300 py-1">
            {trimmed.replace(/^[-*]\s*/, '')}
          </li>
        );
        return;
      }

      // Empty line -> paragraph separator
      if (!trimmed) {
        flushParagraph(idx);
        return;
      }

      // Otherwise accumulate into paragraph
      currentParagraph.push(trimmed);
    });

    flushParagraph(lines.length);
    return elements;
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-black">
        <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Loading article...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-black">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Article Not Found</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {error || 'This blog post does not exist or may have been unlisted.'}
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to All Articles</span>
          </Link>
        </div>
      </div>
    );
  }

  const tagsArray = post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-black min-h-screen transition-colors duration-200">
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="bg-white dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3.5">
            {/* Breadcrumb Links */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-0">
              <Link href="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href="/blog" className="hover:text-sky-600 dark:hover:text-sky-400 transition">
                Blog
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs font-bold">
                {post.title}
              </span>
            </div>

            {/* Top Share CTA */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ARTICLE MAIN CONTAINER */}
      <article className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 min-w-0">
        {/* Back Link */}
        {/* <div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </Link>
        </div> */}

        {/* Article Meta Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {post.status === 'DRAFT' && (
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Draft Preview
              </span>
            )}
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              {post.category}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.read_time} min read
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {post.views_count.toLocaleString()} views
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {post.title}
          </h1>

          {/* Author & Publish Date Row */}
          <div className="pt-2 flex items-center justify-between flex-wrap gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                {(post.author_name || 'J').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {post.author_name || 'Jagir AI Editorial Team'}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Share Button in Header */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
            </button>
          </div>
        </header>

        {/* Cover Image Banner */}
        {post.effective_cover_image && (
          <div className="w-full h-72 sm:h-96 lg:h-[480px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-sm relative">
            <img
              src={post.effective_cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Excerpt Lead Paragraph */}
        {post.excerpt && (
          <div className="p-5 sm:p-6 rounded-2xl bg-sky-50/50 dark:bg-slate-900/60 border border-sky-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-base sm:text-lg font-medium leading-relaxed italic">
            &ldquo;{post.excerpt}&rdquo;
          </div>
        )}

        {/* Formatted Content Body */}
        <div className="pt-2">
          {post.content && /<[a-z][\s\S]*>/i.test(post.content) ? (
            <div
              className="jodit-content-rendered text-slate-800 dark:text-slate-200"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="space-y-4">
              {renderFormattedContent(post.content)}
            </div>
          )}
        </div>

        {/* Tags Section */}
        {tagsArray.length > 0 && (
          <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Related Topics & Tags
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {tagsArray.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Tag className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Share & Navigation Callout */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xl shadow-sky-600/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Found this article insightful?</h3>
            <p className="text-xs sm:text-sm text-sky-100 max-w-lg">
              Share it with your colleagues or explore open job vacancies on Jagir AI today.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-sky-700 hover:bg-sky-50 shadow-sm transition cursor-pointer"
            >
              {copied ? 'Link Copied!' : 'Share Article'}
            </button>
            <Link
              href="/jobs"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white border border-sky-400/40 transition"
            >
              Explore Vacancies
            </Link>
          </div>
        </div>

        {/* 3. RELATED ARTICLES */}
        {relatedPosts.length > 0 && (
          <section className="pt-12 border-t border-slate-200/80 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  More in {post.category}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Continue exploring related guides and industry updates.
                </p>
              </div>

              <Link
                href="/blog"
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-sky-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                      {rel.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition line-clamp-2 leading-snug">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {rel.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{rel.read_time} min read</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      Read <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

