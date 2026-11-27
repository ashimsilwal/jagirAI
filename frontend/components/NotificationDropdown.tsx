'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, Application, ContactMessage, AppNotification, hasPermission, getMediaUrl } from '@/lib/api';
import {
  Bell,
  FileText,
  Check,
  ChevronRight,
  Clock,
  User,
  Sparkles,
  Mail,
  Building,
  AlertTriangle,
  ShieldCheck,
  Inbox,
  CheckCircle2,
  XCircle,
  Briefcase
} from 'lucide-react';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = !!(user && (user.is_staff || user.is_superuser));
  const isRecruiter = user?.role === 'JOB_RECRUITER';
  const isSeeker = user?.role === 'JOB_SEEKER';
  const canViewApplications = hasPermission(user, 'application.view');

  // Active tab when both admin & recruiter
  const [activeTab, setActiveTab] = useState<'CONTACTS' | 'APPLICATIONS'>('CONTACTS');

  // Recruiter Applications
  const [applications, setApplications] = useState<Application[]>([]);
  const [seenAppIds, setSeenAppIds] = useState<number[]>([]);

  // Admin Contact Inquiries
  const [contacts, setContacts] = useState<ContactMessage[]>([]);

  // Seeker In-App Notifications
  const [seekerNotifications, setSeekerNotifications] = useState<AppNotification[]>([]);

  const appStorageKey = user ? `jagir_seen_apps_${user.id}` : null;

  // Load seen app IDs
  useEffect(() => {
    if (!appStorageKey) return;
    try {
      const stored = localStorage.getItem(appStorageKey);
      if (stored) {
        setSeenAppIds(JSON.parse(stored));
      }
    } catch {
      setSeenAppIds([]);
    }
  }, [appStorageKey]);

  // Fetch recruiter applications
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
      } catch {}
    };

    fetchLatestApps();
    const interval = setInterval(fetchLatestApps, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, isRecruiter, canViewApplications]);

  // Fetch admin contact messages
  useEffect(() => {
    if (!user || !isAdmin) return;

    let isMounted = true;
    const fetchContacts = async () => {
      try {
        const data = await apiFetch<any>('/contact/messages/');
        const list: ContactMessage[] = Array.isArray(data) ? data : data?.results || [];
        if (isMounted) {
          setContacts(list);
        }
      } catch {}
    };

    fetchContacts();
    const interval = setInterval(fetchContacts, 15000);

    const handleContactUpdated = () => fetchContacts();
    window.addEventListener('contact-updated', handleContactUpdated);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('contact-updated', handleContactUpdated);
    };
  }, [user, isAdmin]);

  // Fetch seeker notifications
  useEffect(() => {
    if (!user || !isSeeker) return;

    let isMounted = true;
    const fetchSeekerNotifs = async () => {
      try {
        const data = await apiFetch<any>('/notifications/?page_size=30');
        const list: AppNotification[] = Array.isArray(data) ? data : data?.results || [];
        if (isMounted) {
          setSeekerNotifications(list);
        }
      } catch {}
    };

    fetchSeekerNotifs();
    const interval = setInterval(fetchSeekerNotifs, 15000);

    const handleNotifUpdated = () => fetchSeekerNotifs();
    window.addEventListener('notification-updated', handleNotifUpdated);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('notification-updated', handleNotifUpdated);
    };
  }, [user, isSeeker]);

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

  // If user cannot view any notifications, hide bell
  if (!user || (!isAdmin && (!isRecruiter || !canViewApplications) && !isSeeker)) {
    return null;
  }

  // Calculate unread counts
  const newApplications = applications.filter((app) => app.status === 'APPLIED');
  const unreadAppCount = newApplications.filter((app) => !seenAppIds.includes(app.id)).length;

  const unreadContactCount = contacts.filter((c) => c.status === 'UNREAD').length;

  const unreadSeekerNotifCount = isSeeker
    ? seekerNotifications.filter((n) => !n.is_read).length
    : 0;

  const totalUnreadCount =
    (isAdmin ? unreadContactCount : 0) +
    (isRecruiter && canViewApplications ? unreadAppCount : 0) +
    (isSeeker ? unreadSeekerNotifCount : 0);

  const handleMarkAllAppsRead = () => {
    if (!appStorageKey) return;
    const allIds = applications.map((a) => a.id);
    const updated = Array.from(new Set([...seenAppIds, ...allIds]));
    setSeenAppIds(updated);
    try {
      localStorage.setItem(appStorageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleMarkAllContactsRead = async () => {
    try {
      await apiFetch('/contact/mark-all-read/', { method: 'POST' });
      setContacts((prev) =>
        prev.map((c) => (c.status === 'UNREAD' ? { ...c, status: 'READ' } : c))
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('contact-updated'));
      }
    } catch {}
  };

  const handleMarkAllSeekerNotifsRead = async () => {
    try {
      await apiFetch('/notifications/mark-all-read/', { method: 'POST' });
      setSeekerNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('notification-updated'));
      }
    } catch {}
  };

  const handleSeekerNotifClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      try {
        await apiFetch(`/notifications/${notification.id}/read/`, { method: 'POST' });
        setSeekerNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('notification-updated'));
        }
      } catch {}
    }
    setIsOpen(false);
    router.push('/dashboard/seeker');
  };

  const handleAppClick = (appId: number) => {
    if (appStorageKey && !seenAppIds.includes(appId)) {
      const updated = [...seenAppIds, appId];
      setSeenAppIds(updated);
      try {
        localStorage.setItem(appStorageKey, JSON.stringify(updated));
      } catch {}
    }
    setIsOpen(false);
    router.push(`/dashboard/recruiter/applications/${appId}`);
  };

  const handleContactClick = (contactId: number) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId && c.status === 'UNREAD' ? { ...c, status: 'READ' } : c))
    );
    setIsOpen(false);
    router.push(`/dashboard/admin/contacts/${contactId}`);
  };

  const renderContactCategoryIcon = (category: string) => {
    switch (category) {
      case 'EMPLOYER':
        return <Building className="w-3 h-3 text-blue-600" />;
      case 'CANDIDATE':
        return <User className="w-3 h-3 text-emerald-600" />;
      case 'BUG':
        return <AlertTriangle className="w-3 h-3 text-rose-600" />;
      case 'PARTNERSHIP':
        return <ShieldCheck className="w-3 h-3 text-purple-600" />;
      default:
        return <Mail className="w-3 h-3 text-sky-600" />;
    }
  };

  const showTabs = isAdmin && isRecruiter && canViewApplications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications (${totalUnreadCount} unread)`}
        title={isAdmin ? 'Contact Inquiries & Alerts' : 'Candidate Application Notifications'}
        className="relative p-2.5 rounded-md border border-gray-200/80 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm animate-pulse">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isSeeker
                    ? 'Application Updates'
                    : isAdmin && !isRecruiter
                    ? 'Contact Inquiries'
                    : 'Notifications'}
                </h3>
                {totalUnreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                    {totalUnreadCount} new
                  </span>
                )}
              </div>

              {/* Mark all as read */}
              {((isAdmin && unreadContactCount > 0) ||
                (isRecruiter && unreadAppCount > 0) ||
                (isSeeker && unreadSeekerNotifCount > 0)) && (
                <button
                  type="button"
                  onClick={() => {
                    if (isAdmin) handleMarkAllContactsRead();
                    if (isRecruiter) handleMarkAllAppsRead();
                    if (isSeeker) handleMarkAllSeekerNotifsRead();
                  }}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Tabs if both admin and recruiter */}
            {showTabs && (
              <div className="grid grid-cols-2 gap-1 mt-3 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('CONTACTS')}
                  className={`py-1 rounded-md transition ${
                    activeTab === 'CONTACTS'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Contacts ({unreadContactCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('APPLICATIONS')}
                  className={`py-1 rounded-md transition ${
                    activeTab === 'APPLICATIONS'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Applicants ({unreadAppCount})
                </button>
              </div>
            )}
          </div>

          {/* Notifications List Area */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
            {/* 1. ADMIN CONTACTS LIST */}
            {(isAdmin && (!showTabs || activeTab === 'CONTACTS')) && (
              <>
                {contacts.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      No contact messages received yet
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Incoming inquiries from the Contact Us page will alert you here.
                    </p>
                  </div>
                ) : (
                  contacts.slice(0, 10).map((contact) => {
                    const isUnread = contact.status === 'UNREAD';

                    return (
                      <div
                        key={contact.id}
                        onClick={() => handleContactClick(contact.id)}
                        className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          isUnread ? 'bg-sky-50/50 dark:bg-sky-950/25' : ''
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0 mt-0.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          {isUnread && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-white dark:ring-slate-900" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {contact.name}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(contact.created_at)}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {contact.subject}
                          </p>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                            {contact.message}
                          </p>

                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              {renderContactCategoryIcon(contact.category)}
                              {contact.category_display || contact.category}
                            </span>
                            {isUnread && (
                              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                                • New inquiry
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* 2. RECRUITER APPLICATIONS LIST */}
            {(isRecruiter && (!showTabs || activeTab === 'APPLICATIONS')) && (
              <>
                {applications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      No candidate submissions received yet
                    </p>
                  </div>
                ) : newApplications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      You&apos;re all caught up!
                    </p>
                    <p className="text-[11px] text-slate-400">
                      All candidate applications have been reviewed.
                    </p>
                  </div>
                ) : (
                  newApplications.slice(0, 10).map((app) => {
                    const isUnread = !seenAppIds.includes(app.id);
                    const candidateName = app.applicant.username || 'A candidate';
                    const candidateAvatar =
                      app.applicant_profile?.profile_picture || app.applicant?.profile_picture;

                    return (
                      <div
                        key={app.id}
                        onClick={() => handleAppClick(app.id)}
                        className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          isUnread ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                        }`}
                      >
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

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {candidateName}
                            </span>{' '}
                            applied for{' '}
                            <span className="font-semibold text-sky-600 dark:text-sky-400">
                              {app.job?.title || 'Job Opening'}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatRelativeTime(app.applied_at)}</span>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              New submission
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* 3. SEEKER APPLICATION NOTIFICATIONS LIST */}
            {isSeeker && (
              <>
                {seekerNotifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      No notifications yet
                    </p>
                    <p className="text-[11px] text-slate-400">
                      When employers update your application status, you will be alerted here.
                    </p>
                  </div>
                ) : (
                  seekerNotifications.slice(0, 15).map((notif) => {
                    const isUnread = !notif.is_read;
                    const status = notif.metadata?.new_status;

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleSeekerNotifClick(notif)}
                        className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          isUnread ? 'bg-sky-50/50 dark:bg-sky-950/25' : ''
                        }`}
                      >
                        {/* Status Icon */}
                        <div className="relative shrink-0 mt-0.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs border ${
                              status === 'HIRED'
                                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : status === 'INTERVIEW'
                                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                : status === 'SHORTLISTED'
                                ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                                : status === 'REJECTED'
                                ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                : 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {status === 'HIRED' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : status === 'INTERVIEW' ? (
                              <Clock className="w-4 h-4" />
                            ) : status === 'SHORTLISTED' ? (
                              <Sparkles className="w-4 h-4" />
                            ) : status === 'REJECTED' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <Briefcase className="w-4 h-4" />
                            )}
                          </div>
                          {isUnread && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-white dark:ring-slate-900" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(notif.created_at)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>

                          {status === 'REJECTED' && notif.metadata?.rejection_reason && (
                            <div className="mt-1 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-[11px] text-rose-800 dark:text-rose-300">
                              <span className="font-semibold">Reason:</span> {notif.metadata.rejection_reason}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 pt-0.5 text-[10px]">
                            {isUnread ? (
                              <span className="font-bold text-sky-600 dark:text-sky-400">
                                • Unread status update
                              </span>
                            ) : (
                              <span className="text-slate-400">Read</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            {isSeeker ? (
              <>
                <span className="text-[11px] text-slate-400">
                  {seekerNotifications.length} total update(s)
                </span>
                <Link
                  href="/dashboard/seeker"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <span>View All Applications</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : isAdmin && (!showTabs || activeTab === 'CONTACTS') ? (
              <>
                <span className="text-[11px] text-slate-400">
                  {contacts.length} total message(s)
                </span>
                <Link
                  href="/dashboard/admin/contacts"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <span>View all inquiries</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
