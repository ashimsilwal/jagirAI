'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

export type TextSize = 90 | 100 | 110 | 120 | 130 | 140;

export interface AccessibilitySettings {
  textSize: TextSize;
  highContrast: boolean;
  dyslexicFont: boolean;
  highlightLinks: boolean;
  underlineLinks: boolean;
  reducedMotion: boolean;
  readingGuide: boolean;
  readingMask: boolean;
}

export const defaultAccessibilitySettings: AccessibilitySettings = {
  textSize: 100,
  highContrast: false,
  dyslexicFont: false,
  highlightLinks: false,
  underlineLinks: false,
  reducedMotion: false,
  readingGuide: false,
  readingMask: false,
};

const STORAGE_KEY = 'jagir_a11y_settings';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  increaseTextSize: () => void;
  decreaseTextSize: () => void;
  setTextSize: (size: TextSize) => void;
  resetSettings: () => void;
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  readingGuideY: number;
  readingMaskY: number;
  announcement: string;
  triggerButtonRef: React.RefObject<HTMLButtonElement | null>;
  activeOptionsCount: number;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(
  undefined
);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(
    defaultAccessibilitySettings
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [readingGuideY, setReadingGuideY] = useState(200);
  const [readingMaskY, setReadingMaskY] = useState(300);
  const [announcement, setAnnouncement] = useState('');
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

  // Announce messages to screen readers
  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
  }, []);

  // Sync DOM classes and attributes whenever settings change
  const applySettingsToDOM = useCallback((current: AccessibilitySettings) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // 1. Text scale attribute
    if (current.textSize === 100) {
      root.removeAttribute('data-a11y-text-scale');
      root.style.removeProperty('--a11y-font-scale');
    } else {
      root.setAttribute('data-a11y-text-scale', current.textSize.toString());
      root.style.setProperty(
        '--a11y-font-scale',
        (current.textSize / 100).toString()
      );
    }

    // 2. High Contrast
    root.classList.toggle('a11y-high-contrast', current.highContrast);

    // 3. Dyslexic-friendly Font
    root.classList.toggle('a11y-dyslexic-font', current.dyslexicFont);

    // 4. Link Highlight
    root.classList.toggle('a11y-highlight-links', current.highlightLinks);

    // 5. Link Underline
    root.classList.toggle('a11y-underline-links', current.underlineLinks);

    // 6. Reduced Motion
    root.classList.toggle('a11y-reduced-motion', current.reducedMotion);
  }, []);

  // Initial load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged: AccessibilitySettings = {
          ...defaultAccessibilitySettings,
          ...parsed,
        };
        setSettings(merged);
        applySettingsToDOM(merged);
        return;
      }
    } catch {
      // Fallback if localStorage is inaccessible
    }

    // Check system preference for reduced motion if no user setting is stored
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setSettings((prev) => {
        const next = { ...prev, reducedMotion: true };
        applySettingsToDOM(next);
        return next;
      });
    }
  }, [applySettingsToDOM]);

  // Persist to localStorage and apply to DOM on update
  const persistSettings = useCallback(
    (newSettings: AccessibilitySettings) => {
      setSettings(newSettings);
      applySettingsToDOM(newSettings);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch {
        // Ignore restricted storage
      }
    },
    [applySettingsToDOM]
  );

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K]
    ) => {
      setSettings((prev) => {
        const updated = { ...prev, [key]: value };
        persistSettings(updated);

        // Meaningful screen-reader announcements
        const labelMap: Record<string, string> = {
          highContrast: value ? 'High contrast mode enabled' : 'High contrast mode disabled',
          dyslexicFont: value ? 'Dyslexia-friendly font enabled' : 'Standard font restored',
          highlightLinks: value ? 'Link highlighting enabled' : 'Link highlighting disabled',
          underlineLinks: value ? 'Link underlines enabled' : 'Link underlines disabled',
          reducedMotion: value ? 'Reduced motion enabled' : 'Animations enabled',
          readingGuide: value ? 'Reading guide enabled' : 'Reading guide disabled',
          readingMask: value ? 'Reading mask enabled' : 'Reading mask disabled',
        };

        if (labelMap[key]) {
          announce(labelMap[key]);
        }

        return updated;
      });
    },
    [persistSettings, announce]
  );

  const setTextSize = useCallback(
    (size: TextSize) => {
      setSettings((prev) => {
        const updated = { ...prev, textSize: size };
        persistSettings(updated);
        announce(`Text size set to ${size} percent`);
        return updated;
      });
    },
    [persistSettings, announce]
  );

  const increaseTextSize = useCallback(() => {
    const scales: TextSize[] = [90, 100, 110, 120, 130, 140];
    setSettings((prev) => {
      const currentIndex = scales.indexOf(prev.textSize);
      const nextIndex = Math.min(currentIndex + 1, scales.length - 1);
      const newSize = scales[nextIndex];
      const updated = { ...prev, textSize: newSize };
      persistSettings(updated);
      announce(`Text size increased to ${newSize} percent`);
      return updated;
    });
  }, [persistSettings, announce]);

  const decreaseTextSize = useCallback(() => {
    const scales: TextSize[] = [90, 100, 110, 120, 130, 140];
    setSettings((prev) => {
      const currentIndex = scales.indexOf(prev.textSize);
      const nextIndex = Math.max(currentIndex - 1, 0);
      const newSize = scales[nextIndex];
      const updated = { ...prev, textSize: newSize };
      persistSettings(updated);
      announce(`Text size decreased to ${newSize} percent`);
      return updated;
    });
  }, [persistSettings, announce]);

  const resetSettings = useCallback(() => {
    persistSettings(defaultAccessibilitySettings);
    announce('All accessibility settings have been reset to defaults');
  }, [persistSettings, announce]);

  // Reading Guide & Mask pointer tracker
  useEffect(() => {
    if (!settings.readingGuide && !settings.readingMask) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientY = e.touches[0].clientY;
      } else if ('clientY' in e) {
        clientY = (e as MouseEvent).clientY;
      }

      if (settings.readingGuide) {
        setReadingGuideY(clientY);
      }
      if (settings.readingMask) {
        setReadingMaskY(clientY);
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [settings.readingGuide, settings.readingMask]);

  // Track active count of custom options (excluding defaults)
  const activeOptionsCount =
    (settings.textSize !== 100 ? 1 : 0) +
    (settings.highContrast ? 1 : 0) +
    (settings.dyslexicFont ? 1 : 0) +
    (settings.highlightLinks ? 1 : 0) +
    (settings.underlineLinks ? 1 : 0) +
    (settings.reducedMotion ? 1 : 0) +
    (settings.readingGuide ? 1 : 0) +
    (settings.readingMask ? 1 : 0);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    // Return focus to the trigger button for WCAG compliance
    setTimeout(() => {
      triggerButtonRef.current?.focus();
    }, 50);
  }, []);
  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => {
      if (prev) {
        setTimeout(() => triggerButtonRef.current?.focus(), 50);
      }
      return !prev;
    });
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        increaseTextSize,
        decreaseTextSize,
        setTextSize,
        resetSettings,
        isPanelOpen,
        openPanel,
        closePanel,
        togglePanel,
        readingGuideY,
        readingMaskY,
        announcement,
        triggerButtonRef,
        activeOptionsCount,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      'useAccessibility must be used within an AccessibilityProvider'
    );
  }
  return context;
};
