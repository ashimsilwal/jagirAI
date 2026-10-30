const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export function getMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const backendBase = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'JOB_SEEKER' | 'JOB_RECRUITER';
  profile_picture?: string | null;
  is_profile_setup?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
  must_change_password?: boolean;
  is_org_owner?: boolean;
  org_permissions?: string[];
  org_role?: { name: string; slug: string } | null;
  date_joined: string;
}

export function hasPermission(user: User | null | undefined, permissionCode: string): boolean {
  if (!user) return false;
  if (user.is_staff || user.is_superuser || user.is_org_owner) return true;
  return Array.isArray(user.org_permissions) && user.org_permissions.includes(permissionCode);
}

export interface AdminUser extends User {
  profile_summary?: {
    phone?: string;
    location?: string;
    skills?: string;
    resume?: string | null;
    bio?: string;
    company_name?: string;
    company_website?: string;
    company_description?: string;
  };
  jobs_count?: number;
  applications_count?: number;
}

export interface AdminStats {
  total_users: number;
  job_seekers: number;
  recruiters: number;
  active_users: number;
  inactive_users: number;
  staff_users: number;
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
}

export interface JobSeekerProfile {
  id: number;
  user: User;
  phone: string;
  profile_picture: string | null;
  bio: string;
  resume: string | null;
  skills: string;
  education: string;
  experience: string;
  location: string;
  job_preferences?: JobCategory[];
  created_at: string;
  updated_at: string;
}

export interface JobCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  jobs_count?: number;
}

export interface JobCategoryRequest {
  id: number;
  name: string;
  description: string;
  reason?: string;
  requester: User;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_notes?: string;
  created_category?: JobCategory | null;
  created_at: string;
  updated_at: string;
}

export interface RecruiterProfile {
  id: number;
  user: User;
  company_name: string;
  company_description: string;
  company_logo: string | null;
  company_website: string;
  location: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  recruiter: User;
  company_name: string;
  company_logo: string | null;
  category?: JobCategory | null;
  category_id?: number | null;
  is_preferred?: boolean;
  applications_count?: number;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  location: string;
  salary: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'REMOTE';
  deadline: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  job: Job;
  applicant: User;
  applicant_profile: JobSeekerProfile | null;
  resume: string | null;
  cover_letter: string;
  status: 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW' | 'REJECTED' | 'HIRED';
  applied_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: number;
  user: number;
  user_email?: string;
  user_username?: string;
  user_role?: 'JOB_SEEKER' | 'JOB_RECRUITER';
  subject: string;
  category: 'TECHNICAL' | 'ACCOUNT' | 'BILLING' | 'VACANCY' | 'CANDIDATE' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  admin_response: string;
  resolved_by?: number | null;
  resolved_by_username?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  website: string;
  location: string;
  phone: string;
  owner?: User;
  members_count: number;
  open_vacancies_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationRole {
  id: number;
  organization: number | null;
  name: string;
  slug: string;
  description: string;
  is_predefined: boolean;
  permissions: string[];
  permissions_display?: { code: string; description: string }[];
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationMembership {
  id: number;
  organization: number;
  user: User;
  role: OrganizationRole;
  custom_permissions: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'LEFT';
  joined_at: string;
  updated_at: string;
  effective_permissions: string[];
  is_owner: boolean;
}

export interface OrganizationInvitation {
  id: number;
  organization: number;
  email: string;
  role: OrganizationRole;
  custom_permissions: string[];
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  invited_by_username: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  is_expired: boolean;
}

export interface OrganizationActivityLog {
  id: number;
  organization: number;
  actor_username: string;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string;
  target_repr: string;
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export interface PermissionDefinition {
  code: string;
  description: string;
  category: string;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If body is not FormData, set Content-Type JSON
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle Token Expiry & Automatic Refresh
  if (response.status === 401 && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken && endpoint !== '/auth/login/' && endpoint !== '/auth/refresh/') {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem('access_token', refreshData.access);
          if (refreshData.refresh) {
            localStorage.setItem('refresh_token', refreshData.refresh);
          }

          // Retry the original request with the new access token
          headers.set('Authorization', `Bearer ${refreshData.access}`);
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          // Token expired and refresh failed
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          if (window.location.pathname.startsWith('/dashboard')) {
            window.location.href = '/login';
          }
        }
      } catch (err) {
        console.error('Refresh token error:', err);
      }
    }
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: 'An unexpected server error occurred.' };
    }
    const error: any = new Error(errorData.detail || errorData.message || 'Request failed');
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
