'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Briefcase, 
  User as UserIcon, 
  LogOut, 
  PlusCircle, 
  FileText, 
  Building2,
  Search,
  ShieldCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-xs shadow-sky-200 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-gray-900 group-hover:text-sky-600 transition-colors">
                Jagri<span className="text-sky-600">AI</span>
              </span>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                Intelligent Hiring
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/') 
                  ? 'bg-sky-50 text-sky-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Search className="w-4 h-4" />
              Find Jobs
            </Link>

            {user?.role === 'JOB_SEEKER' && (
              <>
                <Link
                  href="/dashboard/seeker"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/dashboard/seeker') 
                      ? 'bg-sky-50 text-sky-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  My Applications
                </Link>
                <Link
                  href="/dashboard/seeker/profile"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/dashboard/seeker/profile') 
                      ? 'bg-sky-50 text-sky-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  My Profile
                </Link>
              </>
            )}

            {user?.role === 'JOB_RECRUITER' && (
              <>
                <Link
                  href="/dashboard/recruiter"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/dashboard/recruiter') 
                      ? 'bg-sky-50 text-sky-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Recruiter Dashboard
                </Link>
                <Link
                  href="/dashboard/recruiter/profile"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/dashboard/recruiter/profile') 
                      ? 'bg-sky-50 text-sky-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Company Profile
                </Link>
              </>
            )}

            {(user?.is_staff || user?.is_superuser) && (
              <Link
                href="/dashboard/admin"
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive('/dashboard/admin') 
                    ? 'bg-sky-100 text-sky-800 shadow-xs' 
                    : 'text-sky-700 hover:text-sky-900 hover:bg-sky-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                Admin Panel
              </Link>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {(user?.is_staff || user?.is_superuser) && (
                  <Link
                    href="/dashboard/admin"
                    className="inline-flex md:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}

                {user.role === 'JOB_RECRUITER' && (
                  <Link
                    href="/dashboard/recruiter/jobs/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 transition shadow-xs hover:shadow-md"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Post Job
                  </Link>
                )}

                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold text-gray-900 leading-tight">
                      {user.username}
                    </p>
                    <p className="text-[10px] font-semibold text-sky-600">
                      {user.is_staff || user.is_superuser 
                        ? 'Admin' 
                        : user.role === 'JOB_RECRUITER' 
                        ? 'Recruiter' 
                        : 'Candidate'}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition shadow-xs hover:shadow-md"
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
