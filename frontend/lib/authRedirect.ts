import { User } from './api';

/**
 * Validates and resolves the safe destination URL after login or registration.
 * - Prevents open redirects to external phishing domains
 * - Prevents redirect loops back to /login or /register
 * - Enforces role-based authorization before granting access to the destination
 * - Fallbacks safely to the user's authorized role dashboard
 */
export function getSafeRedirectUrl(nextUrl: string | null | undefined, user: User): string {
  const isAdmin = !!(user.is_staff || user.is_superuser);
  const defaultDashboard = isAdmin
    ? '/dashboard/admin'
    : user.role === 'JOB_RECRUITER'
    ? '/dashboard/recruiter'
    : '/dashboard/seeker';

  if (!nextUrl || typeof nextUrl !== 'string') {
    return defaultDashboard;
  }

  // Must be an internal path starting with a single '/'
  // Reject protocol-relative '//', backslashes '/\', or external URLs
  if (!nextUrl.startsWith('/') || nextUrl.startsWith('//') || nextUrl.startsWith('/\\')) {
    return defaultDashboard;
  }

  // Strip query/hash for path validation
  const cleanPath = nextUrl.split('?')[0].split('#')[0];

  // Prevent redirect loops back to auth pages
  if (cleanPath === '/login' || cleanPath === '/register') {
    return defaultDashboard;
  }

  // Check Admin-only routes
  if (cleanPath.startsWith('/dashboard/admin')) {
    if (isAdmin) return nextUrl;
    return defaultDashboard;
  }

  // Check Recruiter-only routes
  if (cleanPath.startsWith('/dashboard/recruiter')) {
    if (user.role === 'JOB_RECRUITER' || isAdmin) {
      return nextUrl;
    }
    // Job Seeker attempted to access recruiter page -> redirect safely to seeker dashboard
    return '/dashboard/seeker';
  }

  // Check Job Seeker routes
  if (cleanPath.startsWith('/dashboard/seeker')) {
    if (user.role === 'JOB_SEEKER' || isAdmin) {
      return nextUrl;
    }
    // Recruiter attempted to access seeker page -> redirect safely to recruiter dashboard
    return '/dashboard/recruiter';
  }

  // Generic /dashboard index -> resolve to default dashboard
  if (cleanPath === '/dashboard') {
    return defaultDashboard;
  }

  // Public relative routes (e.g. /jobs/5, /about, /contact, /)
  return nextUrl;
}
