'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  User as UserIcon,
  LayoutDashboard,
  Briefcase,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Shield,
  FileText,
  PlusCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const ProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  if (!user) return null;

  const isAdmin = !!(user.is_staff || user.is_superuser);
  const isRecruiter = !isAdmin && user.role === 'JOB_RECRUITER';

  // Extract initials
  const initials = user.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'US';

  const roleLabel = isAdmin 
    ? 'System Administrator' 
    : isRecruiter 
    ? 'Recruiter / Employer' 
    : 'Job Candidate';

  const profileHref = isAdmin
    ? '/dashboard/admin'
    : isRecruiter
    ? '/dashboard/recruiter/profile'
    : '/dashboard/seeker/profile';

  const dashboardHref = isAdmin
    ? '/dashboard/admin'
    : isRecruiter
    ? '/dashboard/recruiter'
    : '/dashboard/seeker';

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Facebook-style Avatar Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User account menu"
        className="group flex items-center gap-2 p-1 pl-1.5 sm:pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer"
      >
        {/* Avatar with Online Presence Badge */}
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white dark:ring-slate-900 group-hover:scale-105 transition-transform">
            {initials}
          </div>
          {/* Active online green dot */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
        </div>

        {/* User Handle & Chevron for Desktop */}
        <div className="hidden sm:flex items-center gap-1.5 text-left">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[110px] truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            {user.username}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-sky-600 dark:text-sky-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Facebook-style Elevated Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2.5 w-76 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 py-2.5 z-50 transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Card: User Info */}
          <div className="px-4 py-3 mx-2 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white text-base font-bold shadow-md ring-2 ring-white dark:ring-slate-800 shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user.username}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                    isAdmin 
                      ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                      : isRecruiter
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {isAdmin && <Shield className="w-2.5 h-2.5" />}
                    {isRecruiter && <Briefcase className="w-2.5 h-2.5" />}
                    {!isAdmin && !isRecruiter && <Sparkles className="w-2.5 h-2.5" />}
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

          {/* Primary Navigation Links */}
          <div className="px-2 space-y-0.5">
            {/* Direct Link to Profile Modification */}
            <Link
              href={profileHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-semibold leading-tight">View & Edit Profile</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Update personal details & credentials</p>
              </div>
            </Link>

            {/* Dashboard Link */}
            <Link
              href={dashboardHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-semibold leading-tight">Dashboard Overview</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Statistics, pipeline & management</p>
              </div>
            </Link>

            {/* Role-specific Action Links */}
            {isAdmin && (
              <Link
                href="/dashboard/admin#users"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold leading-tight">User Registry & Roles</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Manage permissions and accounts</p>
                </div>
              </Link>
            )}

            {!isAdmin && isRecruiter && (
              <Link
                href="/dashboard/recruiter/jobs/new"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold leading-tight">Post New Vacancy</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Publish a new job listing</p>
                </div>
              </Link>
            )}

            {!isAdmin && !isRecruiter && (
              <Link
                href="/#jobs"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold leading-tight">Explore Open Jobs</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Discover and apply to top roles</p>
                </div>
              </Link>
            )}
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

          {/* Quick Preferences: Theme Switcher */}
          <div className="px-2">
            <button
              onClick={() => {
                toggleTheme();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </div>
                <span className="font-semibold">Display Theme</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

          {/* Logout Action */}
          <div className="px-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold leading-tight">Sign Out</p>
                <p className="text-[11px] text-rose-500/80 dark:text-rose-400/70">Securely end your session</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
