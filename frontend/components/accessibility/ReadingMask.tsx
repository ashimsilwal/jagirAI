'use client';

import React from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';

export const ReadingMask: React.FC = () => {
  const { settings, readingMaskY } = useAccessibility();

  if (!settings.readingMask) return null;

  // Reading aperture height in px
  const apertureHeight = 120;
  const halfAperture = apertureHeight / 2;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9980] overflow-hidden"
    >
      {/* Top Dimmed Area */}
      <div
        className="absolute inset-x-0 top-0 bg-slate-950/50 dark:bg-black/65 backdrop-blur-[0.5px] transition-all duration-75 ease-out"
        style={{
          height: `${Math.max(0, readingMaskY - halfAperture)}px`,
        }}
      />

      {/* Focus Aperture Border Accent */}
      <div
        className="absolute inset-x-0 border-y border-sky-400/40 dark:border-sky-500/40 pointer-events-none transition-all duration-75 ease-out"
        style={{
          top: `${Math.max(0, readingMaskY - halfAperture)}px`,
          height: `${apertureHeight}px`,
        }}
      />

      {/* Bottom Dimmed Area */}
      <div
        className="absolute inset-x-0 bottom-0 bg-slate-950/50 dark:bg-black/65 backdrop-blur-[0.5px] transition-all duration-75 ease-out"
        style={{
          top: `${readingMaskY + halfAperture}px`,
        }}
      />
    </div>
  );
};
