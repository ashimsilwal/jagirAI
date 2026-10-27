'use client';

import React, { useEffect, useRef } from 'react';
import { useAccessibility, TextSize } from '@/context/AccessibilityContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Accessibility,
  X,
  RotateCcw,
  Sun,
  Moon,
  Contrast,
  Type,
  Baseline,
  Link as LinkIcon,
  Underline,
  Sparkles,
  Compass,
  Scan,
  Check,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export const AccessibilityPanel: React.FC = () => {
  const {
    settings,
    updateSetting,
    increaseTextSize,
    decreaseTextSize,
    setTextSize,
    resetSettings,
    isPanelOpen,
    closePanel,
    togglePanel,
    activeOptionsCount,
  } = useAccessibility();

  const { theme, toggleTheme } = useTheme();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Focus trap & Escape key handler & Alt+A keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + A to toggle panel
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        togglePanel();
        return;
      }

      if (!isPanelOpen) return;

      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
        return;
      }

      // Tab trap
      if (e.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen, closePanel, togglePanel]);

  // Initial focus on open
  useEffect(() => {
    if (isPanelOpen) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }
  }, [isPanelOpen]);

  if (!isPanelOpen) return null;

  const textScalePresets: TextSize[] = [90, 100, 110, 120, 130, 140];

  return (
    <div
      role="region"
      aria-label="Accessibility settings modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end p-0 sm:p-6 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closePanel();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-panel-title"
        aria-describedby="a11y-panel-desc"
        className="relative w-full sm:w-[420px] max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transition-all duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm shadow-sky-600/20">
              <Accessibility className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="a11y-panel-title"
                className="text-base font-bold text-slate-900 dark:text-white leading-tight"
              >
                Accessibility Settings
              </h2>
              <p
                id="a11y-panel-desc"
                className="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
              >
                Personalize your viewing & reading experience
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={closePanel}
            aria-label="Close accessibility settings"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 text-sm divide-y divide-slate-100 dark:divide-slate-800/80">
          
          {/* SECTION 1: Text Size Scaling */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Text Sizing & Zoom
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
                {settings.textSize}%
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Scale all content smoothly without breaking page alignment or clipping text.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decreaseTextSize}
                disabled={settings.textSize <= 90}
                aria-label="Decrease text size"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition font-medium text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span>Smaller</span>
              </button>

              <button
                type="button"
                onClick={() => setTextSize(100)}
                aria-label="Reset text size to default 100 percent"
                className={`py-2 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  settings.textSize === 100
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                100% (Default)
              </button>

              <button
                type="button"
                onClick={increaseTextSize}
                disabled={settings.textSize >= 140}
                aria-label="Increase text size"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition font-medium text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Larger</span>
              </button>
            </div>

            {/* Scale Presets Grid */}
            <div className="grid grid-cols-6 gap-1 pt-1">
              {textScalePresets.map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setTextSize(scale)}
                  aria-pressed={settings.textSize === scale}
                  className={`py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                    settings.textSize === scale
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {scale}%
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: Contrast & Theme */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Contrast className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Display & Contrast
              </span>
            </div>

            {/* High Contrast Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="pr-3">
                <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                  High Contrast Mode
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  Maximizes color separation, sharpens borders, and strengthens interactive states.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.highContrast}
                aria-label="High Contrast Mode"
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  settings.highContrast ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.highContrast ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Dark Theme Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="pr-3">
                <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                  Color Theme
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Toggle theme, current is ${theme}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-600" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SECTION 3: Readability & Dyslexia Support */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Baseline className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Typography & Legibility
              </span>
            </div>

            {/* Dyslexia-Friendly Font */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="pr-3">
                <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                  Dyslexia-Friendly Font
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  Applies high-legibility letterforms with enhanced character spacing and open apertures.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.dyslexicFont}
                aria-label="Dyslexia-Friendly Font"
                onClick={() => updateSetting('dyslexicFont', !settings.dyslexicFont)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  settings.dyslexicFont ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.dyslexicFont ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Link Highlighting */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="pr-3">
                <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                  Highlight Links
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  Highlights interactive links with high-visibility background tint.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.highlightLinks}
                aria-label="Highlight Links"
                onClick={() => updateSetting('highlightLinks', !settings.highlightLinks)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  settings.highlightLinks ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.highlightLinks ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Link Underlines */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="pr-3">
                <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                  Underline Links
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  Adds clear underlines to all links so they do not rely on color alone.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.underlineLinks}
                aria-label="Underline Links"
                onClick={() => updateSetting('underlineLinks', !settings.underlineLinks)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  settings.underlineLinks ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.underlineLinks ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SECTION 4: Motion & Animations */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Motion & Comfort
              </span>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="pr-3">
                <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                  Reduced Motion
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  Silences ambient floats, page transitions, and decorative movement.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.reducedMotion}
                aria-label="Reduced Motion"
                onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  settings.reducedMotion ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SECTION 5: Reading Aids */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Visual Reading Aids
              </span>
            </div>

            {/* Reading Guide Line */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="pr-3">
                <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                  Reading Guide
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  Displays a subtle horizontal ruler tracking your pointer to assist line-by-line reading.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.readingGuide}
                aria-label="Reading Guide"
                onClick={() => updateSetting('readingGuide', !settings.readingGuide)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  settings.readingGuide ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.readingGuide ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Reading Mask Overlay */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="pr-3">
                <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                  Reading Mask
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  Dims distracting surrounding content, focusing attention on a clear viewing strip.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.readingMask}
                aria-label="Reading Mask"
                onClick={() => updateSetting('readingMask', !settings.readingMask)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  settings.readingMask ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.readingMask ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>

        {/* Panel Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetSettings}
            disabled={activeOptionsCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>

          <button
            type="button"
            onClick={closePanel}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition shadow-sm shadow-sky-600/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
