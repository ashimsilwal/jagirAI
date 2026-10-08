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
  ShieldCheck,
  Info,
  Mail
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isAdmin = !!(user && (user.is_staff || user.is_superuser));

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          
          {/* Logo */}
          <Link href={isAdmin ? "/dashboard/admin" : "/"} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-xs shadow-sky-200 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl leading-tight tracking-tight text-gray-900 group-hover:text-sky-600 transition-colors">
                Jagri<span className="text-sky-600">AI</span>
              </span>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                {isAdmin ? 'Admin Console' : 'Intelligent Hiring'}
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isAdmin ? (
              <Link
                href="/dashboard/admin"
                className={`px-4 py-2 rounded-xl text-[15px] font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive('/dashboard/admin') 
                    ? 'bg-sky-100 text-sky-800 shadow-xs' 
                    : 'text-sky-700 hover:text-sky-900 hover:bg-sky-50'
                }`}
              >
                <ShieldCheck className="w-4.5 h-4.5 text-sky-600" />
                Admin Panel
              </Link>
            ) : (
              <>
                <Link
                  href="/"
                  className={`px-3.5 py-2 rounded-xl text-[15px] font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/') 
                      ? 'bg-sky-50 text-sky-700 font-semibold' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Find Jobs
                </Link>

                <Link
                  href="/about"
                  className={`px-3.5 py-2 rounded-xl text-[15px] font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/about') 
                      ? 'bg-sky-50 text-sky-700 font-semibold' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  About Us
                </Link>

                <Link
                  href="/contact"
                  className={`px-3.5 py-2 rounded-xl text-[15px] font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/contact') 
                      ? 'bg-sky-50 text-sky-700 font-semibold' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Contact
                </Link>

                {user?.role === 'JOB_SEEKER' && (
                  <>
                    <Link
                      href="/dashboard/seeker"
                      className={`px-3.5 py-2 rounded-xl text-[15px] font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/dashboard/seeker') 
                          ? 'bg-sky-50 text-sky-700 font-semibold' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      My Applications
                    </Link>
                    <Link
                      href="/dashboard/seeker/profile"
                      className={`px-3.5 py-2 rounded-xl text-[15px] font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/dashboard/seeker/profile') 
                          ? 'bg-sky-50 text-sky-700 font-semibold' 
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
                      className={`px-3.5 py-2 rounded-xl text-[15px] font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/dashboard/recruiter') 
                          ? 'bg-sky-50 text-sky-700 font-semibold' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      Recruiter Dashboard
                    </Link>
                    <Link
                      href="/dashboard/recruiter/profile"
                      className={`px-3.5 py-2 rounded-xl text-[15px] font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/dashboard/recruiter/profile') 
                          ? 'bg-sky-50 text-sky-700 font-semibold' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      Company Profile
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href="/dashboard/admin"
                    className="inline-flex md:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin Panel
                  </Link>
                )}

                {!isAdmin && user.role === 'JOB_RECRUITER' && (
                  <Link
                    href="/dashboard/recruiter/jobs/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 transition shadow-xs hover:shadow-md"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Post Job
                  </Link>
                )}

                <div className="flex items-center gap-2.5 pl-2.5 border-l border-gray-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {user.username}
                    </p>
                    <p className="text-[11px] font-semibold text-sky-600">
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
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4.5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs hover:shadow-md"
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
