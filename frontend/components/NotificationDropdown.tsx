'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, Application, hasPermission, getMediaUrl } from '@/lib/api';
import { Bell, FileText, Check, ChevronRight, Clock, User, Sparkles } from 'lucide-react';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return `${mins}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const NotificationDropdown: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isRecruiter = user?.role === 'JOB_RECRUITER';
  const canViewApplications = hasPermission(user, 'application.view');

  const storageKey = user ? `jagir_seen_apps_${user.id}` : null;

  // Load seen IDs from localStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSeenIds(JSON.parse(stored));
      }
    } catch {
      setSeenIds([]);
    }
  }, [storageKey]);

  // Fetch applications for notification bell
  useEffect(() => {
    if (!user || !isRecruiter || !canViewApplications) return;

    let isMounted = true;

    const fetchLatestApps = async () => {
      try {
        const data = await apiFetch<any>('/applications/?page_size=25');
        const list: Application[] = Array.isArray(data) ? data : data?.results || [];
        if (isMounted) {
          setApplications(list);
        }
      } catch (err) {
        // Silently handle background polling errors
      }
    };

    fetchLatestApps();
    const interval = setInterval(fetchLatestApps, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, isRecruiter, canViewApplications]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Permission check: only recruiters with application.view permission can see notifications
  if (!user || !isRecruiter || !canViewApplications) {
    return null;
  }

  // Filter for unreviewed/new submissions (status === 'APPLIED')
  const newApplications = applications.filter((app) => app.status === 'APPLIED');
  const unreadApplications = newApplications.filter((app) => !seenIds.includes(app.id));
  const unreadCount = unreadApplications.length;

  const handleMarkAllAsRead = () => {
    if (!storageKey) return;
    const allIds = applications.map((a) => a.id);
    const updated = Array.from(new Set([...seenIds, ...allIds]));
    setSeenIds(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleNotificationClick = (appId: number) => {
    if (storageKey && !seenIds.includes(appId)) {
      const updated = [...seenIds, appId];
      setSeenIds(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
    }
    setIsOpen(false);
    router.push(`/dashboard/recruiter/applications/${appId}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} unread candidate submissions)`}
        title="Candidate Application Notifications"
        className="relative p-2.5 rounded-md border border-gray-200/80 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Candidate Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
            {applications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  No candidate submissions received yet
                </p>
                <p className="text-[11px] text-slate-400">
                  New applications will alert you here as candidates apply.
                </p>
              </div>
            ) : newApplications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  You're all caught up!
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  All current candidate applications have been reviewed.
                </p>
              </div>
            ) : (
              newApplications.slice(0, 10).map((app) => {
                const isUnread = !seenIds.includes(app.id);
                const candidateName = app.applicant.username || 'A candidate';
                const candidateAvatar = app.applicant_profile?.profile_picture || app.applicant?.profile_picture;

                return (
                  <div
                    key={app.id}
                    onClick={() => handleNotificationClick(app.id)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      isUnread ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                    }`}
                  >
                    {/* Candidate Avatar / Icon */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-slate-200/60 dark:border-slate-700">
                        {candidateAvatar ? (
                          <img
                            src={getMediaUrl(candidateAvatar) || ''}
                            alt={candidateName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{candidateName.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      {isUnread && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                        <span className="font-bold text-slate-900 dark:text-white">{candidateName}</span>{' '}
                        applied for{' '}
                        <span className="font-semibold text-sky-600 dark:text-sky-400">
                          {app.job?.title || 'Job Opening'}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(app.applied_at)}</span>
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400 font-medium">New submission</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              {applications.length} total applicant(s)
            </span>
            <Link
              href="/dashboard/recruiter/applications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              <span>View all applications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      )}
    </div>
  );
};

