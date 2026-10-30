'use client';

import React from 'react';
import { useToast, ToastType } from '@/context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none flex flex-col items-center gap-2.5 max-w-md sm:max-w-lg w-[calc(100vw-1.5rem)] px-2 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto w-full flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
              isSuccess
                ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-300 dark:border-emerald-700/60 shadow-emerald-500/10 dark:shadow-emerald-950/50 ring-1 ring-emerald-500/20'
                : isError
                ? 'bg-white/95 dark:bg-slate-900/95 border-rose-300 dark:border-rose-800/60 shadow-rose-500/10 dark:shadow-rose-950/50 ring-1 ring-rose-500/20'
                : isWarning
                ? 'bg-white/95 dark:bg-slate-900/95 border-amber-300 dark:border-amber-700/60 shadow-amber-500/10 dark:shadow-amber-950/50 ring-1 ring-amber-500/20'
                : 'bg-white/95 dark:bg-slate-900/95 border-sky-300 dark:border-sky-700/60 shadow-sky-500/10 dark:shadow-sky-950/50 ring-1 ring-sky-500/20'
            }`}
          >
            {/* Type Icon Badge */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm ${
                isSuccess
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : isError
                  ? 'bg-rose-600 shadow-rose-600/30'
                  : isWarning
                  ? 'bg-amber-600 shadow-amber-600/30'
                  : 'bg-sky-600 shadow-sky-600/30'
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-4 h-4" />}
              {isError && <AlertCircle className="w-4 h-4" />}
              {isWarning && <AlertTriangle className="w-4 h-4" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4" />}
            </div>

            {/* Message Body */}
            <div className="flex-1 min-w-0 pt-0.5">
              {toast.title && (
                <h4
                  className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 ${
                    isSuccess
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : isError
                      ? 'text-rose-700 dark:text-rose-300'
                      : isWarning
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-sky-700 dark:text-sky-300'
                  }`}
                >
                  {toast.title}
                </h4>
              )}
              <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 break-words leading-relaxed">
                {toast.message}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0 mt-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

