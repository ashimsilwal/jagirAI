const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'JOB_SEEKER' | 'JOB_RECRUITER';
  is_staff?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
  date_joined: string;
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
