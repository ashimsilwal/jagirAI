'use client';

import React from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';

export const ReadingGuide: React.FC = () => {
  const { settings, readingGuideY } = useAccessibility();

  if (!settings.readingGuide) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 z-[9990] transition-transform duration-75 ease-out"
      style={{
        top: 0,
        transform: `translate3d(0, ${readingGuideY}px, 0)`,
      }}
    >
      {/* Subtle guide band with highlighted focus strip */}
      <div className="w-full h-8 -mt-4 bg-sky-500/10 dark:bg-sky-400/15 border-y-2 border-sky-500/50 dark:border-sky-400/60 shadow-[0_0_15px_rgba(14,165,233,0.15)]" />
    </div>
  );
};
