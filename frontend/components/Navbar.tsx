'use client';

import React, { useState } from 'react';
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
  Moon,
  Home,
  Menu,
  X
} from 'lucide-react';
import { AnnouncementBar } from './AnnouncementBar';
import { ProfileDropdown } from './ProfileDropdown';
import { NotificationDropdown } from './NotificationDropdown';
import { useSidebar } from '@/context/SidebarContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setMobileSidebarOpen } = useSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = !!(user && (user.is_staff || user.is_superuser));

  const isActive = (path: string) => pathname === path;

  // Hide Navbar completely on setup pages for full-screen Google-style onboarding
  if (pathname?.startsWith('/dashboard/setup')) {
    return null;
  }

  return (
    <>
      {/* Top Announcement Bar - only shown for non-logged-in visitors */}
      {!user && <AnnouncementBar />}

      {/* Main Navbar */}
      <header role="banner" className="sticky top-0 z-40 w-full bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center min-h-16 sm:min-h-18 py-1 sm:py-0 gap-2">
          
          {/* Logo - only displayed for logged-out visitors */}
          {!user ? (
            <Link
              href="/"
              aria-label="Jagir AI Homepage"
              className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0"
            >
              <div aria-hidden="true" className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-sky-200 group-hover:scale-105 transition-transform shrink-0">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-lg sm:text-xl leading-tight tracking-tight text-gray-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Jagir<span className="text-sky-600 dark:text-sky-400">AI</span>
                </span>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wider truncate">
                  Intelligent Hiring
                </span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              {/* Mobile Sidebar Button in top bar */}
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open sidebar navigation"
                className="md:hidden p-2 rounded-lg border border-gray-200/80 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/80 text-gray-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Mobile Logo for logged-in user */}
              <Link
                href="/"
                aria-label="Jagir AI Homepage"
                className="flex md:hidden items-center gap-2 min-w-0"
              >
                <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-gray-900 dark:text-white truncate">
                  Jagir<span className="text-sky-600 dark:text-sky-400">AI</span>
                </span>
              </Link>
            </div>
          )}

          {/* Navigation Links - ONLY displayed for visitors who are NOT logged in */}
          {!user && (
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                aria-current={isActive('/') ? 'page' : undefined}
                className={`px-3.5 py-2 rounded-md text-[15px] font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/') 
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <Home aria-hidden="true" className="w-4 h-4" />
                <span>Home</span>
              </Link>

              <Link
                href="/jobs"
                aria-current={isActive('/jobs') ? 'page' : undefined}
                className={`px-3.5 py-2 rounded-md text-[15px] font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/jobs') 
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <Search aria-hidden="true" className="w-4 h-4" />
                <span>Find Jobs</span>
              </Link>

              <Link
                href="/about"
                aria-current={isActive('/about') ? 'page' : undefined}
                className={`px-3.5 py-2 rounded-md text-[15px] font-medium transition-colors ${
                  isActive('/about') 
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                About Us
              </Link>

              <Link
                href="/contact"
                aria-current={isActive('/contact') ? 'page' : undefined}
                className={`px-3.5 py-2 rounded-md text-[15px] font-medium transition-colors ${
                  isActive('/contact') 
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                Contact
              </Link>
            </nav>
          )}



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
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Recruiter application submission notifications */}
                <NotificationDropdown />
                {/* Facebook-style Profile Dropdown with online status & actions */}
                <ProfileDropdown />
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
                  className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition shadow-sm hover:shadow-md"
                >
                  Get Started
                </Link>

                {/* Mobile Menu Toggle Button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                  className="md:hidden p-2 rounded-md text-gray-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Mobile Navigation Drawer for Visitors */}
        {!user && mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-4 py-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/') 
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                  : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Home</span>
            </Link>

            <Link
              href="/jobs"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/jobs') 
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                  : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Find Jobs</span>
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/about') 
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                  : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>About Us</span>
            </Link>

            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/contact') 
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold' 
                  : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>Contact</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  </>
  );
};
