'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch, ContactMessage } from '@/lib/api';
import {
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  Building,
  User,
  AlertTriangle,
  ShieldCheck,
  Send,
  FileText,
  Save,
  Archive,
  RefreshCw,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminContactDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const contactId = resolvedParams.id;

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<ContactMessage | null>(null);

  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Auth protection
  useEffect(() => {
    if (!authLoading && (!user || (!user.is_staff && !user.is_superuser))) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<ContactMessage>(`/contact/messages/${contactId}/`);
      setContact(data);
      setAdminNotes(data.admin_notes || '');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('contact-updated'));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load contact inquiry', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.is_staff || user.is_superuser)) {
      fetchContact();
    }
  }, [user, contactId]);

  const handleUpdateStatus = async (newStatus: 'UNREAD' | 'READ' | 'RESOLVED' | 'ARCHIVED') => {
    try {
      setUpdatingStatus(true);
      const updated = await apiFetch<ContactMessage>(`/contact/messages/${contactId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, admin_notes: adminNotes })
      });
      setContact(updated);
      toast.success(`Inquiry status updated to ${newStatus}`, 'Updated');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('contact-updated'));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status', 'Error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      const updated = await apiFetch<ContactMessage>(`/contact/messages/${contactId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ admin_notes: adminNotes })
      });
      setContact(updated);
      toast.success('Internal admin notes saved', 'Saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notes', 'Error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await apiFetch(`/contact/messages/${contactId}/`, { method: 'DELETE' });
      toast.success('Contact inquiry deleted', 'Deleted');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('contact-updated'));
      }
      router.push('/dashboard/admin/contacts');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete inquiry', 'Error');
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'EMPLOYER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Building className="w-3.5 h-3.5" /> Employer Inquiry
          </span>
        );
      case 'CANDIDATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <User className="w-3.5 h-3.5" /> Candidate Help
          </span>
        );
      case 'BUG':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3.5 h-3.5" /> Bug / Technical Issue
          </span>
        );
      case 'PARTNERSHIP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldCheck className="w-3.5 h-3.5" /> Partnership & Media
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Mail className="w-3.5 h-3.5" /> General Inquiry
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Unread
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Read / Reviewed
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500">Loading contact message details...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <Mail className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Contact Inquiry Not Found
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          This message may have been removed or does not exist.
        </p>
        <Link
          href="/dashboard/admin/contacts"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Inquiries</span>
        </Link>
      </div>
    );
  }

  const emailSubject = `Re: ${contact.subject} [Jagir AI Support]`;
  const emailBody = `Hi ${contact.name},\n\nThank you for contacting Jagir AI regarding:\n"${contact.subject}"\n\n`;

  // Direct Gmail Web Compose link pre-filled with recipient, subject, and greeting
  const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    contact.email
  )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  // Default system mailto client fallback
  const mailtoLink = `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(
    emailSubject
  )}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 min-w-0">
      {/* 1. TOP HEADER & STATUS BAR CARD */}
      <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 dark:from-black dark:via-black dark:to-black border border-sky-100/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5 transition-colors">
        <div className="space-y-2">
          <Link
            href="/dashboard/admin/contacts"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Contact Inquiries</span>
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Inquiry from {contact.name}
            </h1>
            {getStatusBadge(contact.status)}
            {getCategoryBadge(contact.category)}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 flex-wrap">
            <span>
              Received on {new Date(contact.created_at).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })} at {new Date(contact.created_at).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            <span>•</span>
            <span className="font-mono text-slate-400">ID #{contact.id}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <a
            href={gmailLink}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open Gmail compose to reply to ${contact.email}`}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-md shadow-sky-600/20 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Reply via Gmail</span>
          </a>

          {contact.status !== 'RESOLVED' ? (
            <button
              type="button"
              onClick={() => handleUpdateStatus('RESOLVED')}
              disabled={updatingStatus}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 font-semibold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mark as Resolved</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleUpdateStatus('READ')}
              disabled={updatingStatus}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reopen Inquiry</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer shadow-xs"
            title="Delete Inquiry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT GRID (8 cols Left / 4 cols Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Subject & Full Message (8 cols) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {/* Message Container Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Inquiry Topic
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {contact.subject}
              </h2>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Full Message Text
              </span>
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-text">
                {contact.message}
              </div>
            </div>

            {/* Quick Email Reply Action Box */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50/70 dark:from-sky-950/40 dark:to-blue-950/30 border border-sky-100 dark:border-sky-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-sky-900 dark:text-sky-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-600" />
                  <span>Ready to reply to {contact.name}?</span>
                </p>
                <p className="text-xs text-sky-700/90 dark:text-sky-400/90 leading-relaxed">
                  Opens Gmail in a new tab with recipient <span className="font-mono font-semibold">{contact.email}</span>, subject line, and greeting pre-filled.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <a
                  href={gmailLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Open in Gmail</span>
                </a>
                <a
                  href={mailtoLink}
                  title="Open in default desktop mail client (Outlook, Apple Mail, etc.)"
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">Mail Client</span>
                </a>
              </div>
            </div>
          </div>

          {/* Admin Internal Notes Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-600" />
                  <span>Internal Admin Notes</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Private follow-up records visible only to administrators.
                </p>
              </div>
            </div>

            <textarea
              rows={4}
              placeholder="Record follow-up actions, phone call summaries, or private remarks regarding this inquiry..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400 leading-relaxed"
            />

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              {contact.resolved_by_name ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Resolved by {contact.resolved_by_name}
                </p>
              ) : (
                <span className="text-xs text-slate-400">
                  Changes to notes are saved immediately to the server.
                </span>
              )}

              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm ml-auto"
              >
                <Save className="w-4 h-4" />
                <span>{savingNotes ? 'Saving Notes...' : 'Save Admin Notes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sender Profile & Metadata (4 cols) */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sender Information
            </h3>

            {/* Avatar & Name */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-md">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 space-y-0.5">
                <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {contact.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Public Contact Submitter
                </p>
              </div>
            </div>

            {/* Detailed Properties */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </p>
                <a
                  href={gmailLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open Gmail to compose email to ${contact.email}`}
                  className="text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{contact.email}</span>
                  <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                </a>
              </div>

              {contact.phone && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Phone Number
                  </p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-slate-800 dark:text-slate-200 hover:text-sky-600 font-semibold flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>{contact.phone}</span>
                  </a>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Category
                </p>
                <div>
                  {getCategoryBadge(contact.category)}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Submitted At
                </p>
                <p className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {new Date(contact.created_at).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </p>
                <p className="text-slate-500 text-xs flex items-center gap-2 pl-6">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {new Date(contact.created_at).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </p>
              </div>

              {contact.updated_at && contact.updated_at !== contact.created_at && (
                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Last Status Update
                  </p>
                  <p className="text-slate-500 text-xs">
                    {new Date(contact.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DELETE MODAL */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Contact Inquiry?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to permanently delete this inquiry from{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {contact.name}
                </span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
