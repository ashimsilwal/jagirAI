'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export const AnnouncementBar: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOffscreen, setIsOffscreen] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;

    const updateScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      // Smoothly fade out opacity between 0 and 32px scroll
      const opacity = Math.max(0, Math.min(1, 1 - scrollY / 32));

      if (contentRef.current) {
        contentRef.current.style.opacity = `${opacity}`;
      }

      setIsOffscreen(scrollY >= 36);
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        updateScroll();
        rafId = null;
      });
    };

    // Initialize on mount
    updateScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <aside
      aria-label="Announcement"
      aria-hidden={isOffscreen}
      inert={isOffscreen ? true : undefined}
      className={`w-full bg-blue-800 border-b border-blue-700/60 text-white transition-colors duration-200 ${
        isOffscreen ? 'pointer-events-none' : ''
      }`}
    >
      <div
        ref={contentRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 sm:h-10 flex items-center justify-between text-xs sm:text-[13px] font-medium tracking-wide"
      >
        {/* Left Side: Slogan Text */}
        <div className="truncate text-white font-medium">
          Find the right opportunity. Hire the right talent.
        </div>

        {/* Right Side: Authentic Real Brand Social Media Logos from /public */}
        <div className="flex items-center gap-3 sm:gap-3.5 shrink-0">
          {/* Facebook Real Logo */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            title="Facebook"
            tabIndex={isOffscreen ? -1 : 0}
            className="inline-flex items-center justify-center hover:scale-110 hover:opacity-90 transition-transform cursor-pointer"
          >
            <Image
              src="/facebook.svg"
              alt="Facebook"
              width={20}
              height={20}
              className="w-5 h-5 object-contain drop-shadow-sm"
            />
          </a>

          {/* Instagram Real Logo */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            title="Instagram"
            tabIndex={isOffscreen ? -1 : 0}
            className="inline-flex items-center justify-center hover:scale-110 hover:opacity-90 transition-transform cursor-pointer"
          >
            <Image
              src="/instagram.svg"
              alt="Instagram"
              width={20}
              height={20}
              className="w-5 h-5 object-contain rounded-md drop-shadow-sm"
            />
          </a>

          {/* Twitter / X Real Logo */}
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter / X"
            title="X (formerly Twitter)"
            tabIndex={isOffscreen ? -1 : 0}
            className="inline-flex items-center justify-center hover:scale-110 hover:opacity-90 transition-transform cursor-pointer"
          >
            <Image
              src="/x-formerly-twitter.svg"
              alt="X / Twitter"
              width={18}
              height={18}
              className="w-[18px] h-[18px] object-contain drop-shadow-sm"
            />
          </a>

          {/* LinkedIn Real Logo */}
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            title="LinkedIn"
            tabIndex={isOffscreen ? -1 : 0}
            className="inline-flex items-center justify-center hover:scale-110 hover:opacity-90 transition-transform cursor-pointer"
          >
            <Image
              src="/linkedin-badge.svg"
              alt="LinkedIn"
              width={20}
              height={20}
              className="w-5 h-5 object-contain drop-shadow-sm"
            />
          </a>
        </div>
      </div>
    </aside>
  );
};
