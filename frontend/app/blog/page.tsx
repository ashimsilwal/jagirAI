'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiFetch, BlogPost } from '@/lib/api';
import {
  BookOpen,
  Calendar,
  Clock,
  Eye,
  ArrowRight,
  Sparkles,
  Tag,
  User,
  SlidersHorizontal,
  RotateCcw,
  TrendingUp,
  Bookmark
} from 'lucide-react';

export default function BlogIndexPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    async function loadBlogs() {
      try {
        setLoading(true);
        const data = await apiFetch<any>('/blogs/');
        const list = Array.isArray(data) ? data : data.results || [];
        setBlogs(list);
      } catch (err: any) {
        setError(err.message || 'Failed to load blog posts.');
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, []);

  // Distinct Categories from posts
  const categories = useMemo(() => {
    const set = new Set<string>();
    blogs.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [blogs]);

  // Filtered Blogs by Category
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      if (selectedCategory !== 'ALL' && b.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [blogs, selectedCategory]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-black transition-colors duration-200">
      {/* MAIN BLOG CONTAINER */}
      <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 min-w-0">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Articles & Career Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Career guidance, interview preparation, hiring strategies, and market trends across Nepal.
          </p>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Topics:
          </span>

          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All Articles ({blogs.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}

          {selectedCategory !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline ml-auto font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Show All Articles
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Loading dynamic blog posts...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-8 max-w-lg mx-auto">
            <p className="text-sm text-rose-600 dark:text-rose-400 font-bold">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBlogs.length === 0 && (
          <div className="py-24 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No articles in this topic
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                There are currently no published articles in &ldquo;{selectedCategory}&rdquo;.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>View All Articles</span>
            </button>
          </div>
        )}

        {/* 3. UNIFORM BLOGS GRID (All blogs rendered at identical size) */}
        {!loading && !error && filteredBlogs.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {selectedCategory === 'ALL' ? 'All Publications' : `${selectedCategory} Articles`}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {filteredBlogs.length} article{filteredBlogs.length > 1 ? 's' : ''} available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredBlogs.map((post) => (
                <article
                  key={post.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-sky-300 dark:hover:border-slate-700 transition flex flex-col overflow-hidden group"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block relative h-48 sm:h-52 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0"
                  >
                    {post.effective_cover_image ? (
                      <img
                        src={post.effective_cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <BookOpen className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/95 dark:bg-black/90 backdrop-blur-md text-sky-700 dark:text-sky-300 shadow-xs">
                        {post.category}
                      </span>
                    </div>
                  </Link>

                  {/* Body */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {post.read_time} min read
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views_count.toLocaleString()} views
                        </span>
                      </div>

                      <Link href={`/blog/${post.slug}`} className="block">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Author & Footer */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {(post.author_name || 'J').slice(0, 1).toUpperCase()}
                        </div>
                        <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                          {post.author_name || 'Jagir AI'}
                        </span>
                      </div>

                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-sky-600 dark:text-sky-400 font-bold inline-flex items-center gap-1 hover:underline shrink-0"
                      >
                        <span>Read</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

