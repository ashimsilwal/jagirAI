'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, Job } from '@/lib/api';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Building2, 
  ArrowRight,
  Filter,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<string>('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (location) params.append('location', location);
      if (employmentType) params.append('employment_type', employmentType);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetch<any>(`/jobs/${queryString}`);
      const jobList = Array.isArray(data) ? data : data.results || [];
      setJobs(jobList);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-100/80 via-blue-50/50 to-slate-50 text-slate-900 py-20 px-4 sm:px-6 lg:px-8 border-b border-sky-100/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_50%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 border border-sky-200/80 text-sky-800 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>AI-Driven Recruitment Experience</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
            Connecting Top Talent with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Visionary Companies
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-600 text-base sm:text-lg">
            Browse verified job vacancies, apply seamlessly with your resume, and track your career trajectory in real time.
          </p>

          {/* Search Bar Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl shadow-sky-900/5 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto border border-sky-100 text-slate-900"
          >
            {/* Keyword Input */}
            <div className="flex-1 flex items-center px-3 py-2 bg-slate-50 md:bg-transparent rounded-xl">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="Job title, keywords, or skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm bg-transparent focus:outline-none placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="hidden md:block w-px bg-slate-200 my-1" />

            {/* Location Input */}
            <div className="flex-1 flex items-center px-3 py-2 bg-slate-50 md:bg-transparent rounded-xl">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="City, state, or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-sm bg-transparent focus:outline-none placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="hidden md:block w-px bg-slate-200 my-1" />

            {/* Employment Type */}
            <div className="flex items-center px-3 py-2 bg-slate-50 md:bg-transparent rounded-xl">
              <Filter className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="text-sm bg-transparent focus:outline-none font-medium text-slate-700 cursor-pointer"
              >
                <option value="">All Job Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="REMOTE">Remote</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition shadow-sm shadow-sky-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              Search Jobs
            </button>
          </form>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Explore Active Positions
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Showing verified opportunities matching your criteria
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
            {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} Available
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 bg-white rounded-2xl border border-slate-100 p-6 animate-pulse space-y-4">
                <div className="w-2/3 h-5 bg-slate-200 rounded" />
                <div className="w-1/2 h-4 bg-slate-100 rounded" />
                <div className="w-full h-12 bg-slate-50 rounded" />
                <div className="w-1/3 h-4 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 p-8">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">No Jobs Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any positions matching your search filters. Try clearing your filters or searching a different keyword.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setLocation('');
                setEmploymentType('');
                fetchJobs();
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-lg transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="group bg-white rounded-2xl border border-slate-200/80 hover:border-sky-300 p-6 shadow-xs hover:shadow-xl hover:shadow-sky-500/5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{job.company_name}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 shrink-0">
                      {job.employment_type.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.location}</span>
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{job.salary}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/jobs/${job.id}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 group-hover:bg-sky-600 text-slate-700 group-hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Details & Apply</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
