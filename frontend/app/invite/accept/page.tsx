'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, getMediaUrl } from '@/lib/api';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ArrowRight,
  Lock,
  Mail,
  User,
  LogIn,
  UserPlus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface InvitationValidationData {
  valid: boolean;
  organization_name: string;
  organization_logo: string | null;
  email: string;
  role_name: string;
  role_description: string;
  permissions: string[];
  invited_by: string;
  expires_at: string;
  user_exists: boolean;
}

function InvitationAcceptContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();
  const { user, login, register, logout, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InvitationValidationData | null>(null);

  // Form State for non-logged-in visitors
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Acceptance State
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  // 1. Validate Invitation Token
  useEffect(() => {
    if (!token) {
      setError('No invitation token was provided in the link.');
      setLoading(false);
      return;
    }

    apiFetch<InvitationValidationData>(`/organizations/public-invite/validate/?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setInviteData(data);
        if (data.user_exists) {
          setAuthMode('login');
        }
      })
      .catch((err: any) => {
        console.error('Validation error:', err);
        setError(err.detail || 'This invitation is invalid, revoked, or has expired.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // 2. Perform Accept API Call
  const executeAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await apiFetch<any>('/organizations/public-invite/accept/', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      setAcceptedSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/recruiter/team');
      }, 1500);
    } catch (err: any) {
      setError(err.detail || 'Failed to accept invitation.');
    } finally {
      setAccepting(false);
    }
  };

  // 3. Handle Login and Accept
  const handleLoginAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData) return;
    setSubmittingAuth(true);
    setAuthError(null);
    try {
      await login(inviteData.email, authPassword);
      // Once logged in, execute acceptance
      await executeAccept();
    } catch (err: any) {
      setAuthError(err.detail || err.message || 'Incorrect password.');
      setSubmittingAuth(false);
    }
  };

  // 4. Handle Register and Accept
  const handleRegisterAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData) return;
    if (authPassword !== authPasswordConfirm) {
      setAuthError('Passwords do not match.');
      return;
    }
    setSubmittingAuth(true);
    setAuthError(null);
    try {
      // Register with role JOB_RECRUITER
      await register({
        username: authUsername,
        email: inviteData.email,
        password: authPassword,
        confirm_password: authPasswordConfirm,
        role: 'JOB_RECRUITER',
      });
      // Execute acceptance
      await executeAccept();
    } catch (err: any) {
      setAuthError(err.username?.[0] || err.password?.[0] || err.detail || 'Registration failed.');
      setSubmittingAuth(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-black">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-sky-600" />
          <p className="text-xs text-slate-500">Validating team invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-black">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invitation Unavailable</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {error || 'This invitation link could not be verified.'}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
            >
              Return to Jagir AI
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isMatchingUser = user && user.email.toLowerCase() === inviteData.email.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-sky-50/60 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Card Header Banner */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 p-8 text-white relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-2xl font-bold border border-white/20 shadow-md">
              {inviteData.organization_logo ? (
                <img src={getMediaUrl(inviteData.organization_logo) || ''} alt={inviteData.organization_name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                inviteData.organization_name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-sky-100">
                Official Staff Invitation
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {inviteData.organization_name}
              </h1>
              <p className="text-xs text-sky-100/90 mt-0.5">
                Invited by {inviteData.invited_by}
              </p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {acceptedSuccess ? (
            <div className="p-8 text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Welcome to {inviteData.organization_name}!
              </h2>
              <p className="text-xs text-slate-500">
                Your account is now connected as <strong className="text-slate-800 dark:text-slate-200">{inviteData.role_name}</strong>. Redirecting you to your team workspace...
              </p>
            </div>
          ) : (
            <>
              {/* Role Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Role: {inviteData.role_name}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {inviteData.permissions?.length || 0} Capabilities
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {inviteData.role_description || 'You have been granted recruitment and collaboration access.'}
                </p>
              </div>

              {/* Status & Account Binding */}
              {user ? (
                isMatchingUser ? (
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Logged in as <strong>{user.email}</strong>. Ready to activate your team access.</span>
                    </div>

                    <button
                      onClick={executeAccept}
                      disabled={accepting}
                      className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {accepting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Joining Organization...</span>
                        </>
                      ) : (
                        <>
                          <span>Accept Invitation & Join Team</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                    <p>
                      This invitation was specifically sent to <strong>{inviteData.email}</strong>, but you are currently signed in as <strong>{user.email}</strong>.
                    </p>
                    <button
                      onClick={async () => {
                        await logout();
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
                    >
                      Switch Account
                    </button>
                  </div>
                )
              ) : (
                /* Unauthenticated Flow: Tabbed Login / Register */
                <div className="space-y-4">
                  <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                    <button
                      onClick={() => setAuthMode('register')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                        authMode === 'register'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Create Account & Join
                    </button>
                    <button
                      onClick={() => setAuthMode('login')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                        authMode === 'login'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Sign In & Join
                    </button>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs">
                      {authError}
                    </div>
                  )}

                  {authMode === 'register' ? (
                    <form onSubmit={handleRegisterAndAccept} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          disabled
                          value={inviteData.email}
                          className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Choose Username
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. janesmith"
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Create Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Minimum 8 characters"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Repeat password"
                          value={authPasswordConfirm}
                          onChange={(e) => setAuthPasswordConfirm(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingAuth}
                        className="w-full mt-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/25 transition cursor-pointer disabled:opacity-50"
                      >
                        {submittingAuth ? 'Creating Account & Joining...' : 'Register & Join Team'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleLoginAndAccept} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          disabled
                          value={inviteData.email}
                          className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Your account password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingAuth}
                        className="w-full mt-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/25 transition cursor-pointer disabled:opacity-50"
                      >
                        {submittingAuth ? 'Signing In & Joining...' : 'Sign In & Join Team'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvitationAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
          <RefreshCw className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      }
    >
      <InvitationAcceptContent />
    </Suspense>
  );
}
