'use client';

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Building2,
  User
} from 'lucide-react';

interface RejectApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  jobTitle: string;
  initialReason?: string;
  onConfirm: (reason: string) => Promise<void>;
}

const QUICK_REJECTION_TEMPLATES = [
  'Role has been filled by another candidate with closer qualifications.',
  'Looking for a candidate with more hands-on experience in the required tech stack.',
  'Your profile is impressive, but does not match the specific requirements for this opening.',
  'Candidate salary expectation exceeds the allocated budget for this position.',
  'Position requires full-time onsite presence at this location.',
];

export default function RejectApplicationModal({
  isOpen,
  onClose,
  candidateName,
  jobTitle,
  initialReason = '',
  onConfirm,
}: RejectApplicationModalProps) {
  const [reason, setReason] = useState(initialReason);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Please provide a reason or constructive feedback for rejection.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(trimmed);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to reject application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overscroll-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 id="reject-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Reject Candidate Application
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Provide feedback to help the applicant understand your decision.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target info badge */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
              <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Candidate: {candidateName}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Position: {jobTitle}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Reason Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Reason for Rejection <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">Visible to Job Seeker</span>
            </div>
            <textarea
              rows={4}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain constructively why this application is not moving forward (e.g., qualifications, experience, skill mismatch, or role filled)..."
              className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none text-xs sm:text-sm leading-relaxed transition"
            />
          </div>

          {/* Quick Reason Templates */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span>Quick Feedback Templates:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REJECTION_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(tpl)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer text-left"
                >
                  {tpl.length > 50 ? `${tpl.slice(0, 50)}...` : tpl}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

