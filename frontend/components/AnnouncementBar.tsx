'use client';

import React, { useEffect, useState } from 'react';

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
      <div className="bg-blue-800  border-blue-700/60  text-white transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 sm:h-10 flex items-center justify-between text-xs sm:text-[13px] font-medium tracking-wide">
          {/* Left Side: Slogan Text */}
          <div className="truncate text-white font-medium">
            Find the right opportunity. Hire the right talent.
          </div>

          {/* Right Side: Authentic Real Brand Social Media Logos */}
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
              <svg className="w-5 h-5 shrink-0 drop-shadow-sm" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="12" fill="#1877F2" />
                <path
                  fill="#FFFFFF"
                  d="M15.12 12.72l.53-3.44h-3.3v-2.23c0-.94.46-1.85 1.93-1.85h1.5V2.26s-1.36-.23-2.66-.23c-2.71 0-4.48 1.64-4.48 4.62v2.63H5.57v3.44h3.07v8.31c.62.1 1.25.15 1.88.15.63 0 1.26-.05 1.88-.15v-8.31h2.72z"
                />
              </svg>
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
              <svg className="w-5 h-5 shrink-0 rounded-md overflow-hidden drop-shadow-sm" viewBox="0 0 24 24" aria-hidden="true">
                <defs>
                  <radialGradient id="ig-gradient-real" cx="20%" cy="110%" r="135%">
                    <stop offset="0%" stopColor="#FFD521" />
                    <stop offset="10%" stopColor="#FFD521" />
                    <stop offset="35%" stopColor="#F50000" />
                    <stop offset="60%" stopColor="#B900B4" />
                    <stop offset="90%" stopColor="#4A00E0" />
                  </radialGradient>
                </defs>
                <rect width="24" height="24" rx="6" fill="url(#ig-gradient-real)" />
                <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3.4" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
                <circle cx="15.8" cy="8.2" r="1" fill="#FFFFFF" />
              </svg>
            </a>

            {/* Twitter Real Logo (Official Iconic Twitter Blue Bird) */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              title="Twitter"
              className="inline-flex items-center justify-center hover:scale-110 hover:opacity-90 transition-transform cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0 drop-shadow-sm" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="12" fill="#1DA1F2" />
                <path
                  fill="#FFFFFF"
                  d="M18.8 8.1c-.5.2-1 .4-1.6.5.6-.4 1-.9 1.2-1.6-.5.3-1.1.5-1.8.7-.5-.5-1.2-.9-2-.9-1.5 0-2.8 1.2-2.8 2.8 0 .2 0 .4.1.7-2.3-.1-4.4-1.2-5.7-2.9-.2.4-.4.9-.4 1.4 0 1 .5 1.8 1.2 2.3-.5 0-.9-.1-1.3-.4v.1c0 1.3.9 2.5 2.2 2.7-.2.1-.5.1-.7.1-.2 0-.3 0-.5-.1.3 1.1 1.4 2 2.6 2-1 .8-2.2 1.2-3.5 1.2-.2 0-.5 0-.7 0 1.2.8 2.7 1.3 4.3 1.3 5.1 0 7.9-4.2 7.9-7.9v-.4c.6-.4 1-.9 1.4-1.5z"
                />
              </svg>
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
              <svg className="w-5 h-5 shrink-0 drop-shadow-sm" viewBox="0 0 24 24" aria-hidden="true">
                <rect width="24" height="24" rx="4.5" fill="#0A66C2" />
                <path
                  fill="#FFFFFF"
                  d="M7.12 6.56a1.56 1.56 0 1 1-3.12 0 1.56 1.56 0 0 1 3.12 0zM4.16 9.24h2.8v10.6h-2.8V9.24zm4.44 0h2.68v1.45h.04c.37-.7 1.28-1.45 2.63-1.45 2.81 0 3.33 1.85 3.33 4.26v6.34h-2.8v-5.62c0-1.34-.02-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.72h-2.8V9.24z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};
