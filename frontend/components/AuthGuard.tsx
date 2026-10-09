'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Lock, 
  ShieldAlert, 
  ArrowLeft, 
  Briefcase, 
  LogIn, 
  UserPlus, 
  LogOut,
  Building2,
  UserCheck
} from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'JOB_SEEKER' | 'JOB_RECRUITER';
  requireAdmin?: boolean;
}

/**
 * Returns a user-friendly readable name for private destination paths.
 */
function getDestinationTitle(pathname: string): string {
  if (pathname.includes('/dashboard/recruiter/jobs/new')) return 'Post a New Job';
  if (pathname.includes('/dashboard/recruiter/profile')) return 'Company Profile & Branding';
  if (pathname.includes('/dashboard/recruiter/jobs/')) return 'Job Applicant Management';
  if (pathname.includes('/dashboard/recruiter')) return 'Recruiter Dashboard';
  if (pathname.includes('/dashboard/seeker/profile')) return 'Candidate Resume & Profile';
  if (pathname.includes('/dashboard/seeker')) return 'My Applications';
  if (pathname.includes('/dashboard/admin')) return 'Administrator Console';
  return 'Protected Portal';
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRole,
  requireAdmin = false,
}) => {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // 1. Loading State - Protect private content during initial token verification
  if (loading) {
    return (
      <div 
        role="status" 
        aria-live="polite"
        className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4"
      >
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-sky-200 dark:border-slate-800 border-t-sky-600 dark:border-t-sky-400 animate-spin" />
          <Briefcase className="w-6 h-6 text-sky-600 dark:text-sky-400" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Verifying security clearance...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated Visitor - Show Professional Access Message (Requirement 3)
  if (!user) {
    const destinationTitle = getDestinationTitle(pathname);
    const loginUrl = `/login?next=${encodeURIComponent(pathname)}`;
    const registerUrl = `/register?next=${encodeURIComponent(pathname)}`;

    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-200 transition-colors">
          {/* Security Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-sky-500/25">
            <Lock className="w-7 h-7" />
          </div>

          {/* Heading and Description */}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Authentication Required
          </h1>
          <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            You need to log in or create an account to access this page.
          </p>

          {/* Target Resource Pill */}
          <div className="mt-4 py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium text-slate-600 dark:text-slate-300 inline-block max-w-full truncate">
            Target destination: <span className="text-sky-600 dark:text-sky-400 font-semibold">{destinationTitle}</span>
          </div>

          {/* Two Clear Actions: Log In & Sign Up */}
          <div className="mt-6 space-y-3">
            <Link
              href={loginUrl}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 active:scale-[0.99] transition shadow-md shadow-sky-200 dark:shadow-none cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </Link>

            <Link
              href={registerUrl}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.99] transition border border-slate-200/80 dark:border-slate-700 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </Link>
          </div>

          {/* Dismissal / Return Home */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Home Page</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Admin Authorization Check
  const isAdmin = !!(user.is_staff || user.is_superuser);

  if (requireAdmin && !isAdmin) {
    const userDashboard = user.role === 'JOB_RECRUITER' ? '/dashboard/recruiter' : '/dashboard/seeker';

    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-amber-200/80 dark:border-amber-900/60 text-center animate-in fade-in zoom-in-95 duration-200 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/20">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Administrator Access Required
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            This console is restricted to platform administrators. Your account ({user.email}) does not have administrative privileges.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href={userDashboard}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-md shadow-sky-200 dark:shadow-none cursor-pointer"
            >
              <span>Go to My Dashboard</span>
            </Link>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Role-Based Authorization Check (Requirement 5)
  // Superadmins/staff can access any view
  if (!isAdmin && requiredRole && user.role !== requiredRole) {
    const isJobSeekerTryingRecruiter = user.role === 'JOB_SEEKER' && requiredRole === 'JOB_RECRUITER';
    const isRecruiterTryingSeeker = user.role === 'JOB_RECRUITER' && requiredRole === 'JOB_SEEKER';

    const authorizedDashboard = user.role === 'JOB_RECRUITER' ? '/dashboard/recruiter' : '/dashboard/seeker';
    const authorizedLabel = user.role === 'JOB_RECRUITER' ? 'Recruiter Dashboard' : 'My Candidate Applications';

    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-amber-200/80 dark:border-amber-900/60 text-center animate-in fade-in zoom-in-95 duration-200 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/20">
            {isJobSeekerTryingRecruiter ? (
              <Building2 className="w-7 h-7" />
            ) : (
              <UserCheck className="w-7 h-7" />
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isJobSeekerTryingRecruiter ? 'Recruiter Access Required' : 'Candidate Access Required'}
          </h1>

          <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {isJobSeekerTryingRecruiter ? (
              <>
                You are currently signed in as a <strong className="text-slate-900 dark:text-white">Job Seeker</strong> ({user.email}). Only employer and recruiter accounts can post job vacancies and access recruiter management features.
              </>
            ) : isRecruiterTryingSeeker ? (
              <>
                You are currently signed in as a <strong className="text-slate-900 dark:text-white">Recruiter</strong> ({user.email}). This section is reserved for candidates to manage their personal applications and resume profile.
              </>
            ) : (
              <>
                Your current account role does not have authorization to access this private section.
              </>
            )}
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href={authorizedDashboard}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 active:scale-[0.99] transition shadow-md shadow-sky-200 dark:shadow-none cursor-pointer"
            >
              <span>Go to {authorizedLabel}</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign in with a different account</span>
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Home Page</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Authorized Authenticated User - Render Protected Page Content
  return <>{children}</>;
};
