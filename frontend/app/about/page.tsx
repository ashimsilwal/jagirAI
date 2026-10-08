'use client';

import React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Target,
  Sparkles,
  Users,
  ShieldCheck,
  TrendingUp,
  Heart,
  Award,
  ArrowRight,
  CheckCircle2,
  Building2,
  Compass
} from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { label: 'Active Job Listings', value: '5,000+' },
    { label: 'Partner Companies', value: '450+' },
    { label: 'Registered Candidates', value: '35,000+' },
    { label: 'Successful Placements', value: '12,000+' }
  ];

  const values = [
    {
      icon: ShieldCheck,
      title: 'Integrity & Verification',
      description: 'We rigorously verify employers and job openings so job seekers never have to worry about spam, scams, or phantom roles.'
    },
    {
      icon: Sparkles,
      title: 'Intelligent Matching',
      description: 'Our proprietary algorithm analyzes skills, experience, and role requirements to surface the best-fit opportunities in seconds.'
    },
    {
      icon: Users,
      title: 'Human-Centered Growth',
      description: 'Technology powers our platform, but people drive our purpose. We champion fair opportunities and career acceleration for everyone.'
    },
    {
      icon: TrendingUp,
      title: 'Transparency in Hiring',
      description: 'From clear salary indicators to live applicant status milestones, we bring absolute clarity to the modern recruitment cycle.'
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
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-100/70 via-blue-50/40 to-slate-50 py-20 px-4 sm:px-6 lg:px-8 border-b border-sky-100/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Connecting Ambitious Talent with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Nepal's Top Employers
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-slate-600 text-base sm:text-lg leading-relaxed">
            Jagri AI is an intelligent recruitment ecosystem built to eliminate the inefficiencies of traditional job boards. 
            We connect top professionals with visionary organizations through transparency, speed, and cutting-edge technology.
          </p>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-lg shadow-sky-950/5">
          {stats.map((stat, i) => (
            <div key={i} className="text-center space-y-1">
              <p className="text-2xl sm:text-4xl font-extrabold text-sky-600 tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Mission Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mb-6 shadow-2xs group-hover:scale-105 transition-transform">
              <Target className="w-6 h-6 text-sky-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Our Mission</h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              To empower individuals to discover fulfilling careers without friction and equip employers with intelligent tools 
              to hire the best talent faster, objectively, and transparently.
            </p>
          </div>

          {/* Vision Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-6 shadow-2xs group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Our Vision</h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              To build South Asia’s most trusted, AI-accelerated career marketplace, transforming how organizations grow 
              and how individuals realize their potential across emerging economies.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div>
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Our Core Values
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              The foundational principles that guide every feature we ship and every relationship we nurture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val, idx) => {
              const IconComp = val.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-2xs">
                      <IconComp className="w-5 h-5 text-sky-600" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900">
                      {val.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {val.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How It Works Timeline */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-xs">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              How Jagri AI Works
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Designed from the ground up for seamless navigation and rapid hiring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {milestones.map((item, i) => (
              <div key={i} className="space-y-3 relative">
                <span className="text-4xl font-extrabold text-sky-200 tracking-tight block">
                  {item.step}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-sky-900/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to Accelerate Your Career or Hiring?
            </h3>
            <p className="text-sky-100 text-sm sm:text-base max-w-xl">
              Join thousands of job seekers and hundreds of companies who trust Jagri AI for smart recruitment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-semibold text-sm transition-colors shadow-sm"
            >
              Browse Jobs
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-sky-800/80 hover:bg-sky-800 text-white font-semibold text-sm transition-colors border border-sky-400/40"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
