'use client';

import React from 'react';

export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2.5 focus:bg-sky-600 focus:text-white focus:text-sm focus:font-semibold focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-800 transition-all"
    >
      Skip to main content
    </a>
  );
};
