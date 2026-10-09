'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export const AnnouncementBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          // Hide when scrolling down past 20px, reveal when returning to top (<= 10px)
          if (scrollY > 20) {
            setIsVisible(false);
          } else if (scrollY <= 10) {
            setIsVisible(true);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Check initial position on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <aside
      aria-label="Announcement"
      aria-hidden={!isVisible}
      className={`w-full overflow-hidden transition-all duration-300 ease-in-out motion-reduce:transition-none motion-reduce:transform-none ${
        isVisible
          ? 'max-h-10 opacity-100 translate-y-0'
          : 'max-h-0 opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      <div className="bg-blue-800 border-blue-700/60 text-white transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 sm:h-10 flex items-center justify-between text-xs sm:text-[13px] font-medium tracking-wide">
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
      </div>
    </aside>
  );
};
