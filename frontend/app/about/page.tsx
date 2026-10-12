'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ScrollReveal } from '@/components/ScrollReveal';
import {
  Target,
  Sparkles,
  Users,
  ShieldCheck,
  TrendingUp,
  Compass,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Building2,
  Zap,
  Award
} from 'lucide-react';

export default function AboutPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.is_staff || user.is_superuser) {
        router.replace('/dashboard/admin');
      } else if (user.role === 'JOB_RECRUITER') {
        router.replace('/dashboard/recruiter');
      } else {
        router.replace('/dashboard/seeker');
      }
    }
  }, [user, loading, router]);

  if (loading || user) {
    return null;
  }

  const stats = [
    { label: 'Active Job Listings', value: '5,000+', icon: Briefcase },
    { label: 'Partner Companies', value: '450+', icon: Building2 },
    { label: 'Registered Candidates', value: '35,000+', icon: Users },
    { label: 'Successful Placements', value: '12,000+', icon: Award }
  ];

  const values = [
    {
      icon: ShieldCheck,
      title: 'Integrity & Verification',
      description: 'We rigorously verify employers and job openings so candidates never encounter spam, scams, or phantom vacancies.',
      tag: '100% Verified'
    },
    {
      icon: Sparkles,
      title: 'Intelligent Matching',
      description: 'Our proprietary algorithm analyzes skills, experience, and role requirements to surface the best-fit opportunities in seconds.',
      tag: 'AI-Powered'
    },
    {
      icon: Users,
      title: 'Human-Centered Growth',
      description: 'Technology powers our platform, but people drive our purpose. We champion equal opportunities and career advancement.',
      tag: 'People First'
    },
    {
      icon: TrendingUp,
      title: 'Transparency in Hiring',
      description: 'From clear salary indicators to live applicant milestones, we bring complete clarity to the modern recruitment cycle.',
      tag: 'Clear Tracking'
    }
  ];

  const milestones = [
    {
      step: '01',
      title: 'Create Your Profile',
      desc: 'Highlight your technical abilities, projects, and career preferences with a modern candidate portfolio.'
    },
    {
      step: '02',
      title: 'Discover & Get Matched',
      desc: 'Browse tailored positions or let our recommendation engine connect you with forward-thinking employers.'
    },
    {
      step: '03',
      title: 'Apply & Track Directly',
      desc: 'Submit your resume with a single click and receive real-time status updates at every stage of the review.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden">
      {/* Hero Section with Homepage-Style Slower Ambient Animations */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-100/80 via-blue-50/50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 py-24 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-sky-100/80 dark:border-slate-800 transition-colors duration-500">
        {/* Ambient Slow Floating Glows (like Homepage) */}
        <div className="absolute -top-24 right-1/4 w-96 h-96 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none animate-hero-ambient-slow" />
        <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-hero-glow-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_55%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          {/* Subtle Top Trust Pill */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white animate-hero-fade-in-up">
            Connecting Ambitious Talent with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 dark:from-sky-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Nepal&apos;s Top Employers
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-slate-600 dark:text-slate-300 text-base sm:text-lg sm:leading-relaxed animate-hero-fade-in-up hero-delay-200">
            Jagir AI is an intelligent recruitment ecosystem built to eliminate the friction of traditional job portals.
            We empower professionals and forward-thinking companies through transparency, speed, and cutting-edge matching.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 animate-hero-fade-in-up hero-delay-400">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-md shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Explore Vacancies</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 font-semibold text-sm transition-all hover:scale-105 shadow-sm cursor-pointer"
            >
              <span>Join As Employer</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter Section with Scroll Animation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 w-full">
        <ScrollReveal direction="up" distance={20} durationMs={700}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-sky-950/5 dark:shadow-black/30">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center space-y-1.5 p-3 rounded-xl hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-2xl sm:text-4xl font-bold text-sky-600 dark:text-sky-400 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full space-y-20">
        {/* Mission & Vision Section (Centered Circular Icons & Attractive Glass Cards) */}
        <section className="space-y-10">
          <ScrollReveal direction="up" distance={20} durationMs={700}>
            <div className="text-center max-w-2xl mx-auto space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Guiding Purpose
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">
                Our Mission & Vision
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Building a modern recruitment standard where opportunity meets potential without hurdles.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Mission Card - Centered Circular Icon (Left Position -> Enters from Left) */}
            <ScrollReveal direction="left" distance={28} durationMs={1200} delayMs={180} className="h-full flex flex-col">
              <div className="group h-full flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-12 shadow-sm hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden text-center flex flex-col items-center justify-start">
                {/* Decorative subtle corner glow */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

                {/* Circle Icon in the Center */}
                <div
                  style={{ borderRadius: '9999px' }}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-sky-100 via-sky-50 to-blue-100 dark:from-sky-950 dark:via-slate-800 dark:to-blue-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/80 shadow-md ring-8 ring-sky-500/10 dark:ring-sky-500/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:ring-sky-500/30 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/50 transition-all duration-300 shrink-0 aspect-square"
                >
                  <Target className="w-10 h-10 transition-transform duration-300 group-hover:rotate-6 text-sky-600 dark:text-sky-400" />
                </div>

                <span className="text-xs font-medium uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1.5">
                  Core Purpose
                </span>
                <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mb-4">
                  Our Mission
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
                  To empower individuals to discover fulfilling careers without friction and equip employers with intelligent tools 
                  to hire the best talent faster, objectively, and with complete transparency.
                </p>
              </div>
            </ScrollReveal>

            {/* Vision Card - Centered Circular Icon (Right Position -> Enters from Right) */}
            <ScrollReveal direction="right" distance={28} durationMs={1200} delayMs={360} className="h-full flex flex-col">
              <div className="group h-full flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-12 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden text-center flex flex-col items-center justify-start">
                {/* Decorative subtle corner glow */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

                {/* Circle Icon in the Center */}
                <div
                  style={{ borderRadius: '9999px' }}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-blue-100 via-sky-50 to-indigo-100 dark:from-blue-950 dark:via-slate-800 dark:to-indigo-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 shadow-md ring-8 ring-blue-500/10 dark:ring-blue-500/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:ring-blue-500/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-all duration-300 shrink-0 aspect-square"
                >
                  <Compass className="w-10 h-10 transition-transform duration-300 group-hover:-rotate-6 text-blue-600 dark:text-blue-400" />
                </div>

                <span className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
                  Long-Term Outlook
                </span>
                <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mb-4">
                  Our Vision
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
                  To build South Asia&apos;s most trusted, AI-accelerated career marketplace, fundamentally transforming how organizations scale 
                  and how ambitious individuals unlock their true potential across emerging economies.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Our Core Values (Centered Circle Icons & Interactive Cards) */}
        <section className="space-y-12">
          <ScrollReveal direction="up" distance={20} durationMs={700}>
            <div className="text-center max-w-2xl mx-auto space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                What We Stand For
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">
                Our Core Values
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                The foundational principles that guide every feature we release and every interaction we nurture.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {values.map((val, idx) => {
              const IconComp = val.icon;
              // Animate from left or right based on card position (first 2 from left, last 2 from right)
              const direction = idx < 2 ? 'left' : 'right';
              // Clean staggered delays (180ms, 340ms, 500ms, 660ms)
              const delays = [180, 340, 500, 660];
              const delayMs = delays[idx] || 180;

              return (
                <ScrollReveal
                  key={idx}
                  direction={direction}
                  distance={28}
                  durationMs={1200}
                  delayMs={delayMs}
                  className="h-full flex flex-col"
                >
                  <div className="group h-full flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-500/50 p-7 shadow-sm hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden">
                    {/* Subtle Top Ambient Glow on Card Hover */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Centered Circular Icon Container */}
                    <div
                      style={{ borderRadius: '9999px' }}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/70 dark:via-slate-800 dark:to-blue-950/70 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800 shadow-sm ring-6 ring-sky-500/10 dark:ring-sky-500/5 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:ring-sky-500/30 group-hover:bg-sky-100/90 dark:group-hover:bg-sky-900/50 transition-all duration-300 shrink-0 aspect-square"
                    >
                      <IconComp className="w-8 h-8 transition-transform duration-300 group-hover:scale-105 text-sky-600 dark:text-sky-400" />
                    </div>

                    {/* Pill Tag */}
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 mb-3">
                      {val.tag}
                    </span>

                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors mb-2.5">
                      {val.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {val.description}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-14 shadow-sm relative overflow-hidden">
          <ScrollReveal direction="up" distance={20} durationMs={700}>
            <div className="text-center max-w-2xl mx-auto space-y-2.5 mb-14">
             
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">
                How Jagir AI Works
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Engineered from the ground up for seamless navigation and rapid hiring.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 relative">
            {milestones.map((item, i) => (
              <ScrollReveal
                key={i}
                direction="up"
                distance={20}
                durationMs={650}
                delayMs={i * 150}
              >
                <div className="text-center sm:text-left space-y-3.5 relative p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 hover:border-sky-200 dark:hover:border-sky-800 transition-colors">
                  <div
                    style={{ borderRadius: '9999px' }}
                    className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 to-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-sky-500/20 mx-auto sm:mx-0"
                  >
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner with Glow Animation */}
        <ScrollReveal direction="up" distance={24} durationMs={700}>
          <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-sky-700 dark:from-sky-700 dark:via-blue-700 dark:to-indigo-800 rounded-3xl p-8 sm:p-14 text-white shadow-2xl shadow-sky-950/20 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none animate-hero-ambient-slow" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none animate-hero-glow-slow" />

            <div className="space-y-3 text-center lg:text-left relative z-10 max-w-2xl">
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Ready to Accelerate Your Career or Hiring?
              </h3>
              <p className="text-sky-100 dark:text-sky-200 text-sm sm:text-base leading-relaxed">
                Join thousands of verified job seekers and hundreds of companies who trust Jagir AI for smart, fast recruitment.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3.5 shrink-0 relative z-10">
              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-sm transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
              >
                Browse Jobs
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 rounded-xl bg-sky-800/80 hover:bg-sky-800 text-white font-semibold text-sm transition-all border border-sky-300/40 hover:scale-105 active:scale-95 cursor-pointer"
              >
                Create Account
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
