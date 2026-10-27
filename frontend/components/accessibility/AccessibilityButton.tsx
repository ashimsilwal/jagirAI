'use client';

import React from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';
import { Accessibility, Sparkles } from 'lucide-react';

export const AccessibilityButton: React.FC = () => {
  const { togglePanel, isPanelOpen, activeOptionsCount, triggerButtonRef } =
    useAccessibility();

  return (
    <aside aria-label="Accessibility toolbar">
      <button
        ref={triggerButtonRef}
        type="button"
        id="accessibility-trigger-button"
        onClick={togglePanel}
        aria-label="Accessibility settings"
        aria-haspopup="dialog"
        aria-expanded={isPanelOpen}
        aria-controls="accessibility-panel"
        title="Accessibility settings (Alt + A)"
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-lg shadow-sky-600/30 hover:shadow-xl hover:shadow-sky-600/40 border-2 border-white/90 dark:border-slate-800 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
      >
        <Accessibility className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-white transition-transform group-hover:scale-110" />

        {/* Active options badge indicator */}
        {activeOptionsCount > 0 && (
          <span
            aria-label={`${activeOptionsCount} active accessibility settings`}
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-extrabold shadow-sm border border-white dark:border-slate-900"
          >
            {activeOptionsCount}
          </span>
        )}

        {/* Tooltip for mouse hover */}
        <span
          role="tooltip"
          className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-slate-900/90 dark:bg-slate-800/95 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md border border-slate-700/60 hidden sm:block"
        >
          Accessibility Settings
        </span>
      </button>
    </aside>
  );
};
