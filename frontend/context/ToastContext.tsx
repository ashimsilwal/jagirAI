'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastOptions {
  type?: ToastType;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => string;
    error: (message: string, title?: string, duration?: number) => string;
    info: (message: string, title?: string, duration?: number) => string;
    warning: (message: string, title?: string, duration?: number) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, options?: ToastOptions): string => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const type = options?.type || 'success';
      const title = options?.title || (type === 'success' ? 'Save Done' : type === 'error' ? 'Action Failed' : 'Notice');
      const duration = options?.duration ?? 4500;

      const newToast: ToastItem = {
        id,
        type,
        message,
        title,
        duration,
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 4));

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const toastMethods = useMemo(
    () => ({
      success: (message: string, title: string = 'Save Done', duration?: number) =>
        showToast(message, { type: 'success', title, duration }),
      error: (message: string, title: string = 'Action Failed', duration?: number) =>
        showToast(message, { type: 'error', title, duration }),
      info: (message: string, title: string = 'Information', duration?: number) =>
        showToast(message, { type: 'info', title, duration }),
      warning: (message: string, title: string = 'Attention', duration?: number) =>
        showToast(message, { type: 'warning', title, duration }),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        toast: toastMethods,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

