'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ScrollReveal';
import { apiFetch, AboutPageData, AboutGalleryItem, AboutSectionItem } from '@/lib/api';
import { DynamicIcon } from '@/components/IconResolver';
import {
  ArrowRight,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera,
  CheckCircle2
} from 'lucide-react';

const FALLBACK_STATS: AboutSectionItem[] = [
  { id: 1, section_type: 'STAT', title: 'Active Job Listings', subtitle_or_value: '5,000+', description: '', icon: 'Briefcase', display_order: 1, is_active: true },
  { id: 2, section_type: 'STAT', title: 'Partner Companies', subtitle_or_value: '450+', description: '', icon: 'Building2', display_order: 2, is_active: true },
  { id: 3, section_type: 'STAT', title: 'Registered Candidates', subtitle_or_value: '35,000+', description: '', icon: 'Users', display_order: 3, is_active: true },
  { id: 4, section_type: 'STAT', title: 'Successful Placements', subtitle_or_value: '12,000+', description: '', icon: 'Award', display_order: 4, is_active: true },
];

const FALLBACK_MISSION: AboutSectionItem = {
  id: 5,
  section_type: 'MISSION',
  title: 'Our Mission',
  subtitle_or_value: 'Core Purpose',
  description: 'To empower individuals to discover fulfilling careers without friction and equip employers with intelligent tools to hire the best talent faster, objectively, and with complete transparency.',
  icon: 'Target',
  display_order: 1,
  is_active: true,
};

const FALLBACK_VISION: AboutSectionItem = {
  id: 6,
  section_type: 'VISION',
  title: 'Our Vision',
  subtitle_or_value: 'Long-Term Outlook',
  description: 'To build South Asia\'s most trusted, AI-accelerated career marketplace, fundamentally transforming how organizations scale and how ambitious individuals unlock their true potential across emerging economies.',
  icon: 'Compass',
  display_order: 2,
  is_active: true,
};

const FALLBACK_VALUES: AboutSectionItem[] = [
  {
    id: 7,
    section_type: 'VALUE',
    title: 'Integrity & Verification',
    subtitle_or_value: '100% Verified',
    description: 'We rigorously verify employers and job openings so candidates never encounter spam, scams, or phantom vacancies.',
    icon: 'ShieldCheck',
    display_order: 1,
    is_active: true,
  },
  {
    id: 8,
    section_type: 'VALUE',
    title: 'Intelligent Matching',
    subtitle_or_value: 'AI-Powered',
    description: 'Our proprietary algorithm analyzes skills, experience, and role requirements to surface the best-fit opportunities in seconds.',
    icon: 'Sparkles',
    display_order: 2,
    is_active: true,
  },
  {
    id: 9,
    section_type: 'VALUE',
    title: 'Human-Centered Growth',
    subtitle_or_value: 'People First',
    description: 'Technology powers our platform, but people drive our purpose. We champion equal opportunities and career advancement.',
    icon: 'Users',
    display_order: 3,
    is_active: true,
  },
  {
    id: 10,
    section_type: 'VALUE',
    title: 'Transparency in Hiring',
    subtitle_or_value: 'Clear Tracking',
    description: 'From clear salary indicators to live applicant milestones, we bring complete clarity to the modern recruitment cycle.',
    icon: 'TrendingUp',
    display_order: 4,
    is_active: true,
  },
];

const FALLBACK_STEPS: AboutSectionItem[] = [
  {
    id: 11,
    section_type: 'STEP',
    title: 'Create Your Profile',
    subtitle_or_value: '01',
    description: 'Highlight your technical abilities, projects, and career preferences with a modern candidate portfolio.',
    icon: 'UserCheck',
    display_order: 1,
    is_active: true,
  },
  {
    id: 12,
    section_type: 'STEP',
    title: 'Discover & Get Matched',
    subtitle_or_value: '02',
    description: 'Browse tailored positions or let our recommendation engine connect you with forward-thinking employers.',
    icon: 'Compass',
    display_order: 2,
    is_active: true,
  },
  {
    id: 13,
    section_type: 'STEP',
    title: 'Apply & Track Directly',
    subtitle_or_value: '03',
    description: 'Submit your resume with a single click and receive real-time status updates at every stage of the review.',
    icon: 'CheckCircle2',
    display_order: 3,
    is_active: true,
  },
];

const FALLBACK_GALLERY: AboutGalleryItem[] = [
  {
    id: 1,
    title: 'Kathmandu Innovation Hub & Office',
    caption: 'Where technology meets recruitment innovation',
    description: 'Our open-concept headquarters nestled in the heart of Kathmandu is designed for cross-functional collaboration, AI research breakthroughs, and welcoming industry partners.',
    category: 'Office',
    effective_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    display_order: 1,
    is_active: true,
  },
  {
    id: 2,
    title: 'Annual Jagir AI Tech Summit & Hackathon',
    caption: 'Bringing together 500+ developers & recruiters',
    description: 'Our flagship community event connecting software engineers, designers, and hiring managers from all seven provinces of Nepal to build next-generation talent and tech solutions.',
    category: 'Events',
    effective_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    display_order: 2,
    is_active: true,
  },
  {
    id: 3,
    title: 'Candidate Mentorship & Interview Clinics',
    caption: '1-on-1 resume reviews and career coaching',
    description: 'Empowering university graduates and career changers across Nepal with portfolio polishing, mock technical interviews, and AI-assisted skill gap analysis.',
    category: 'Community',
    effective_image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    display_order: 3,
    is_active: true,
  },
  {
    id: 4,
    title: 'Our Engineering & Talent Research Team',
    caption: 'The builders powering fair hiring across South Asia',
    description: 'A passionate, multidisciplinary group of software engineers, NLP researchers, and talent specialists dedicated to removing bias, eliminating ghost job listings, and accelerating career matches.',
    category: 'Team',
    effective_image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    display_order: 4,
    is_active: true,
  },
];

export default function AboutPage() {
  const [stats, setStats] = useState<AboutSectionItem[]>(FALLBACK_STATS);
  const [mission, setMission] = useState<AboutSectionItem>(FALLBACK_MISSION);
  const [vision, setVision] = useState<AboutSectionItem>(FALLBACK_VISION);
  const [values, setValues] = useState<AboutSectionItem[]>(FALLBACK_VALUES);
  const [milestones, setMilestones] = useState<AboutSectionItem[]>(FALLBACK_STEPS);
  const [gallery, setGallery] = useState<AboutGalleryItem[]>(FALLBACK_GALLERY);

  // Active Lightbox Photo for "View Contents"
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadAboutData() {
      try {
        const data = await apiFetch<AboutPageData>('/about/');
        if (data.stats && data.stats.length > 0) setStats(data.stats);
        if (data.mission) setMission(data.mission);
        if (data.vision) setVision(data.vision);
        if (data.values && data.values.length > 0) setValues(data.values);
        if (data.steps && data.steps.length > 0) setMilestones(data.steps);
        if (data.gallery && data.gallery.length > 0) setGallery(data.gallery);
      } catch (err) {
        // Fallbacks remain in place seamlessly
      }
    }
    loadAboutData();
  }, []);

  // Keyboard navigation for Lightbox modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePhotoIndex === null) return;
      if (e.key === 'Escape') {
        setActivePhotoIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev !== null ? (prev + 1) % gallery.length : 0));
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) =>
          prev !== null ? (prev - 1 + gallery.length) % gallery.length : 0
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, gallery.length]);

  // Bulletproof lock of background scroll when "View Contents" modal is open
  useEffect(() => {
    if (activePhotoIndex === null) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar disappearance so layout doesn't shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');

    // Intercept wheel events to strictly prevent background page scroll/overscroll
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const scrollable = target?.closest('.modal-scrollable') as HTMLElement | null;
      if (!scrollable) {
        // Not inside the scrollable story area; prevent scrolling the background
        e.preventDefault();
        return;
      }
      // If inside scrollable, prevent chaining to background when reaching top/bottom bounds
      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
      if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
        e.preventDefault();
      }
    };

    // Intercept touchmove to prevent mobile background drag while allowing modal story scrolling
    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const scrollable = target?.closest('.modal-scrollable');
      if (!scrollable) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalBodyPaddingRight;
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [activePhotoIndex]);

  const activePhoto = activePhotoIndex !== null ? gallery[activePhotoIndex] : null;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-100/80 via-blue-50/50 to-slate-50 dark:from-black dark:via-black dark:to-black py-24 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-sky-100/80 dark:border-slate-800 transition-colors duration-500">
        <div className="dark:hidden absolute -top-24 right-1/4 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none animate-hero-ambient-slow" />
        <div className="dark:hidden absolute -bottom-20 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none animate-hero-glow-slow" />
        <div className="dark:hidden absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_55%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
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
              href="/jobs"
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

      {/* 2. STATS COUNTER SECTION (Dynamic Icons & Values managed by Admin) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 w-full">
        <ScrollReveal direction="up" distance={20} durationMs={700}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-sky-950/5 dark:shadow-black/30">
            {stats.map((stat, i) => (
              <div
                key={stat.id || i}
                className="text-center space-y-1.5 p-3 rounded-xl hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                  <DynamicIcon name={stat.icon} customIconUrl={stat.effective_custom_icon} alt={stat.title} className="w-5 h-5" />
                </div>
                <p className="text-2xl sm:text-4xl font-bold text-sky-600 dark:text-sky-400 tracking-tight">
                  {stat.subtitle_or_value}
                </p>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                  {stat.title}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full space-y-24">
        {/* 3. MISSION & VISION SECTION (Dynamic Icons managed by Admin) */}
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
            {/* Mission Card */}
            <ScrollReveal direction="left" distance={28} durationMs={1200} delayMs={180} className="h-full flex flex-col">
              <div className="group h-full flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-12 shadow-sm hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden text-center flex flex-col items-center justify-start">
                <div className="absolute top-0 right-0 w-44 h-44 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

                <div
                  style={{ borderRadius: '9999px' }}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-sky-100 via-sky-50 to-blue-100 dark:from-sky-950 dark:via-slate-800 dark:to-blue-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/80 shadow-md ring-8 ring-sky-500/10 dark:ring-sky-500/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:ring-sky-500/30 transition-all duration-300 shrink-0 aspect-square overflow-hidden"
                >
                  <DynamicIcon name={mission.icon} customIconUrl={mission.effective_custom_icon} alt={mission.title} className="w-10 h-10 transition-transform duration-300 group-hover:rotate-6 text-sky-600 dark:text-sky-400" />
                </div>

                <span className="text-xs font-medium uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1.5">
                  {mission.subtitle_or_value || 'Core Purpose'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mb-4">
                  {mission.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
                  {mission.description}
                </p>
              </div>
            </ScrollReveal>

            {/* Vision Card */}
            <ScrollReveal direction="right" distance={28} durationMs={1200} delayMs={360} className="h-full flex flex-col">
              <div className="group h-full flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-12 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden text-center flex flex-col items-center justify-start">
                <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

                <div
                  style={{ borderRadius: '9999px' }}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-blue-100 via-sky-50 to-indigo-100 dark:from-blue-950 dark:via-slate-800 dark:to-indigo-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 shadow-md ring-8 ring-blue-500/10 dark:ring-blue-500/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:ring-blue-500/30 transition-all duration-300 shrink-0 aspect-square overflow-hidden"
                >
                  <DynamicIcon name={vision.icon} customIconUrl={vision.effective_custom_icon} alt={vision.title} className="w-10 h-10 transition-transform duration-300 group-hover:-rotate-6 text-blue-600 dark:text-blue-400" />
                </div>

                <span className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
                  {vision.subtitle_or_value || 'Long-Term Outlook'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mb-4">
                  {vision.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
                  {vision.description}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 4. PHOTO SHOWCASE & VIEW CONTENTS SECTION (Managed by Admin) */}
        {gallery.length > 0 && (
          <section className="space-y-12">
            <ScrollReveal direction="up" distance={20} durationMs={700}>
              <div className="text-center max-w-2xl mx-auto space-y-2.5">
                {/* <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 mb-1">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Visual Stories & Culture</span>
                </div> */}
                <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">
                  Life at Jagir AI & Community Showcase
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                  Explore moments from our Kathmandu headquarters, engineering milestones, and candidate workshops across Nepal.
                </p>
              </div>
            </ScrollReveal>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {gallery.map((item, idx) => (
                <ScrollReveal
                  key={item.id || idx}
                  direction="up"
                  distance={24}
                  durationMs={800}
                  delayMs={idx * 120}
                  className="h-full flex flex-col"
                >
                  <div className="group h-full flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      {/* Photo Container */}
                      <div className="w-full h-52 sm:h-56 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                        <img
                          src={item.effective_image || 'https://images.unsplash.com/photo-1497366216548-37526070297c'}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/20">
                          {item.category}
                        </span>
                      </div>

                      {/* Header details */}
                      <div className="p-5 space-y-1.5">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        {item.caption && (
                          <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 line-clamp-1">
                            {item.caption}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 pt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* View Contents Action Button */}
                    <div className="p-5 pt-0">
                      <button
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/80 flex items-center justify-center gap-1.5 transition-all shadow-2xs group/btn cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        <span>View Contents</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}

        {/* 5. CORE VALUES SECTION (Dynamic Icons & Tags managed by Admin) */}
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
              const direction = idx < 2 ? 'left' : 'right';
              const delays = [180, 340, 500, 660];
              const delayMs = delays[idx] || 180;

              return (
                <ScrollReveal
                  key={val.id || idx}
                  direction={direction}
                  distance={28}
                  durationMs={1200}
                  delayMs={delayMs}
                  className="h-full flex flex-col"
                >
                  <div className="group h-full flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-500/50 p-7 shadow-sm hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div
                      style={{ borderRadius: '9999px' }}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/70 dark:via-slate-800 dark:to-blue-950/70 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800 shadow-sm ring-6 ring-sky-500/10 dark:ring-sky-500/5 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:ring-sky-500/30 transition-all duration-300 shrink-0 aspect-square overflow-hidden"
                    >
                      <DynamicIcon name={val.icon} customIconUrl={val.effective_custom_icon} alt={val.title} className="w-8 h-8 transition-transform duration-300 group-hover:scale-105 text-sky-600 dark:text-sky-400" />
                    </div>

                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 mb-3">
                      {val.subtitle_or_value || 'Principle'}
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

        {/* 6. HOW IT WORKS SECTION */}
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
                key={item.id || i}
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
                    {item.subtitle_or_value || `0${i + 1}`}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* 7. BOTTOM CTA BANNER */}
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
                href="/jobs"
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

      {/* ===================================================================== */}
      {/* 8. INTERACTIVE LIGHTBOX MODAL: "VIEW CONTENTS" FOR SHOWCASE PHOTOS    */}
      {/* ===================================================================== */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overscroll-contain select-none"
          onClick={() => setActivePhotoIndex(null)}
        >
          <div
            className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[92vh] overscroll-contain select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close & Counter Bar */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-sm">
                {(activePhotoIndex || 0) + 1} / {gallery.length}
              </span>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition cursor-pointer backdrop-blur-sm"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Res Photo Area */}
            <div className="w-full h-80 sm:h-[440px] bg-slate-950 relative shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={activePhoto.effective_image || ''}
                alt={activePhoto.title}
                className="w-full h-full object-cover"
              />

              {/* Prev / Next Floating Arrows */}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex((prev) =>
                        prev !== null ? (prev - 1 + gallery.length) % gallery.length : 0
                      );
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition cursor-pointer backdrop-blur-sm shadow-md"
                    title="Previous photo (Left arrow)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex((prev) =>
                        prev !== null ? (prev + 1) % gallery.length : 0
                      );
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition cursor-pointer backdrop-blur-sm shadow-md"
                    title="Next photo (Right arrow)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              <span className="absolute bottom-4 left-4 px-3 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white shadow-md">
                {activePhoto.category}
              </span>
            </div>

            {/* View Contents Details Area */}
            <div className="modal-scrollable p-6 sm:p-8 overflow-y-auto overscroll-contain space-y-3 bg-white dark:bg-slate-900">
              {/* <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Showcase Story & Contents
                </span>
              </div> */}

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {activePhoto.title}
              </h2>

              {activePhoto.caption && (
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 italic border-l-4 border-sky-500 pl-3">
                  {activePhoto.caption}
                </p>
              )}

              <div className="pt-2 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line border-t border-slate-100 dark:border-slate-800">
                {activePhoto.description}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
