'use client';

import React from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';

export const LiveAnnouncer: React.FC = () => {
  const { announcement } = useAccessibility();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};
