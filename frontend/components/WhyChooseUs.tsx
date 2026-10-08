'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  UserCheck,
  Building2,
  ShieldCheck,
  TrendingUp,
  FileText,
  Target,
  Zap,
  BarChart3,
  ArrowRight
} from 'lucide-react';

interface BenefitItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tag?: string;
}

const JOB_SEEKER_BENEFITS: BenefitItem[] = [
  {
    icon: Sparkles,
    title: 'AI Candidate Matching',
    description: 'Intelligent algorithms align your skills, experience, and career aspirations with the vacancies where you are most likely to excel.',
    tag: 'Smart Matching'
  },
  {
    icon: ShieldCheck,
    title: 'Verified Employers Only',
    description: 'Browse authentic job listings from vetted companies, ensuring transparent salary ranges, verified contacts, and genuine teams.',
    tag: '100% Verified'
  },
  {
    icon: TrendingUp,
    title: 'Live Application Tracking',
    description: 'No more waiting in the dark. Track the status of every application in real time from submission to interview invitation.',
    tag: 'Real-Time'
  },
  {
    icon: FileText,
    title: 'Streamlined Profile & Resume',
    description: 'Build a standout candidate profile, upload your latest resume, and apply to multiple top tier positions in just one click.',
    tag: 'One-Click Apply'
  }
];

const RECRUITER_BENEFITS: BenefitItem[] = [
  {
    icon: Target,
    title: 'Precision Talent Discovery',
    description: 'Filter candidates by exact tech proficiencies, experience tiers, and qualifications to instantly reach high-fit professionals.',
    tag: 'Targeted Hiring'
  },
  {
    icon: Zap,
    title: 'Post Jobs in Minutes',
    description: 'A clean, frictionless posting process lets you define roles, requirements, and hiring deadlines in under two minutes.',
    tag: 'Fast Setup'
  },
  {
    icon: LayersIcon,
    title: 'Centralized Pipeline Management',
    description: 'Organize candidate submissions, review resumes, shortlist standouts, and update hiring statuses from a single intuitive dashboard.',
    tag: 'All-In-One'
  },
  {
    icon: BarChart3,
    title: 'Data-Driven Hiring Velocity',
    description: 'Gain clear visibility into applicant numbers, profile strengths, and pipeline activity to fill critical positions without delays.',
    tag: 'High Efficiency'
  }
];

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export const WhyChooseUs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'seeker' | 'recruiter'>('seeker');

  const benefits = activeTab === 'seeker' ? JOB_SEEKER_BENEFITS : RECRUITER_BENEFITS;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-sky-50/20 to-slate-50/50 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950 py-20 border-t border-slate-200/70 dark:border-slate-800 transition-colors duration-200">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-200/20 dark:bg-sky-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Why Choose <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 dark:from-sky-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">Jagir AI</span>?
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-350 leading-relaxed">
            Whether you are taking your next major career leap or looking to assemble a powerhouse team,
            Jagir AI streamlines the journey with cutting-edge tools and zero friction.
          </p>

          {/* Interactive Toggle Switcher */}
          <div className="pt-4 flex justify-center">
            <div className="inline-flex p-1.5 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-lg shadow-inner gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('seeker')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === 'seeker'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <UserCheck className={`w-4 h-4 ${activeTab === 'seeker' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>For Job Seekers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('recruiter')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === 'recruiter'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Building2 className={`w-4 h-4 ${activeTab === 'recruiter' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>For Employers</span>
              </button>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-500/50 p-6 shadow-xs hover:shadow-xl hover:shadow-sky-500/8 dark:hover:shadow-sky-500/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-md bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white dark:group-hover:bg-sky-600 dark:group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-2xs">
                      <IconComponent className="w-6 h-6 transition-colors" />
                    </div>
                    {item.tag && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {item.tag}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Targeted Bottom Call-to-Action Bar */}
        <div className="mt-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left space-y-1">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeTab === 'seeker'
                ? 'Ready to find your dream role?'
                : 'Need to hire top-performing talent?'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {activeTab === 'seeker'
                ? 'Join thousands of candidates connecting directly with hiring teams across Nepal.'
                : 'List your vacancies and connect directly with qualified applicants today.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {activeTab === 'seeker' ? (
              <>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm shadow-sky-200 dark:shadow-none flex items-center gap-2 cursor-pointer"
                >
                  <span>Create Candidate Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#jobs"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
                >
                  Browse Vacancies
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm shadow-sky-200 dark:shadow-none flex items-center gap-2 cursor-pointer"
                >
                  <span>Start Hiring with Jagir AI</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dashboard/recruiter/jobs/new"
                  className="px-5 py-2.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
                >
                  Post a Job Opening
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
