'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  Briefcase, 
  LogOut, 
  PlusCircle, 
  Search,
  Sun,
  Moon
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const isAdmin = !!(user && (user.is_staff || user.is_superuser));

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          
          {/* Logo */}
          <Link
            href={isAdmin ? "/dashboard/admin" : user?.role === 'JOB_RECRUITER' ? "/dashboard/recruiter" : "/"}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-md bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-xs shadow-sky-200 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl leading-tight tracking-tight text-gray-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Jagir<span className="text-sky-600 dark:text-sky-400">AI</span>
              </span>
              <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                {isAdmin ? 'Admin Console' : user?.role === 'JOB_RECRUITER' ? 'Recruiter Console' : 'Intelligent Hiring'}
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isAdmin ? (
              <Link
                href="/dashboard/admin"
                className={`px-4 py-2 rounded-md text-[15px] font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive('/dashboard/admin') 
                    ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 shadow-xs' 
                    : 'text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-200 hover:bg-sky-50 dark:hover:bg-slate-800'
                }`}
              >
                Admin Panel
              </Link>
            ) : user?.role === 'JOB_RECRUITER' ? (
              <>
                {/* For Recruiter: Only show Dashboard and Company Profile */}
                <Link
                  href="/dashboard/recruiter"
                  className={`px-3.5 py-2 rounded-md text-[15px] font-medium transition-colors ${
                    isActive('/dashboard/recruiter') 
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/recruiter/profile"
                  className={`px-3.5 py-2 rounded-md text-[15px] font-medium transition-colors ${
                    isActive('/dashboard/recruiter/profile') 
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Company Profile
                </Link>
              </>
            ) : (
              <>
                {/* 1. Find Jobs (Only item with an icon) */}
                <Link
                  href="/"
                  className={`px-3.5 py-2 rounded-md text-[15px] font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/') 
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Find Jobs</span>
                </Link>

                {/* 2 & 3. Application & Profile for Job Seekers */}
                {user?.role === 'JOB_SEEKER' && (
                  <>
                    <Link
                      href="/dashboard/seeker"
                      className={`px-3.5 py-2 rounded-md text-[15px] font-medium transition-colors ${
                        isActive('/dashboard/seeker') 
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                          : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Application
                    </Link>
                    <Link
                      href="/dashboard/seeker/profile"
                      className={`px-3.5 py-2 rounded-md text-[15px] font-medium transition-colors ${
                        isActive('/dashboard/seeker/profile') 
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                          : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Profile
                    </Link>
                  </>
                )}

                {/* 4. About Us */}
                <Link
                  href="/about"
                  className={`px-3.5 py-2 rounded-md text-[15px] font-medium transition-colors ${
                    isActive('/about') 
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  About Us
                </Link>

                {/* 5. Contact */}
                <Link
                  href="/contact"
                  className={`px-3.5 py-2 rounded-md text-[15px] font-medium transition-colors ${
                    isActive('/contact') 
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Contact
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Bar: Theme Toggle + User Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2.5 rounded-md border border-gray-200/80 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-slate-700" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {isAdmin && (
                  <Link
                    href="/dashboard/admin"
                    className="inline-flex md:hidden items-center px-3 py-1.5 rounded-md text-xs font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 transition"
                  >
                    Admin Panel
                  </Link>
                )}

                {!isAdmin && user.role === 'JOB_RECRUITER' && (
                  <Link
                    href="/dashboard/recruiter/jobs/new"
                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 transition shadow-xs hover:shadow-md"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Post Job</span>
                  </Link>
                )}

                <div className="flex items-center gap-2.5 pl-2.5 border-l border-gray-200 dark:border-slate-800">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      {user.username}
                    </p>
                    <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                      {user.is_staff || user.is_superuser 
                        ? 'Administrator' 
                        : user.role === 'JOB_RECRUITER' 
                        ? 'Recruiter' 
                        : 'Candidate'}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-2 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 sm:px-4.5 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition shadow-xs hover:shadow-md"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
