'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { 
  Briefcase, 
  Mail, 
  MapPin 
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { user } = useAuth();
  const currentYear = 2026;

  // For logged in users, navigation is handled through the sidebar
  if (user) return null;

  return (
    <footer className="bg-gradient-to-b from-sky-600 to-sky-700 dark:from-slate-900 dark:to-slate-950 border-t border-sky-500/40 dark:border-slate-800 text-white mt-auto transition-colors duration-200">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Column 1: Brand & About */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-md bg-white text-sky-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5 text-sky-600" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl leading-tight tracking-tight text-white group-hover:text-sky-100 transition-colors">
                  Jagir<span className="text-sky-200">AI</span>
                </span>
                <span className="text-xs text-sky-100 font-medium uppercase tracking-wider">
                  Intelligent Hiring
                </span>
              </div>
            </Link>

            <p className="text-sm text-sky-100 leading-relaxed">
              Empowering top talent and forward-thinking companies with fast, streamlined job recruitment and intelligent candidate matching.
            </p>

            <div className="space-y-2.5 pt-1 text-sm text-sky-100">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-sky-200 shrink-0" />
                <span>Kathmandu, Nepal</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-200 shrink-0" />
                <a href="mailto:support@jagirai.com" className="hover:text-white transition-colors">
                  support@jagirai.com
                </a>
              </div>
            </div>

            {/* Social Media Real Logos in Footer from /public */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
                className="hover:scale-110 hover:opacity-90 transition-transform"
              >
                <Image
                  src="/facebook.svg"
                  alt="Facebook"
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain drop-shadow-sm"
                />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="hover:scale-110 hover:opacity-90 transition-transform"
              >
                <Image
                  src="/instagram.svg"
                  alt="Instagram"
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain rounded-md drop-shadow-sm"
                />
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                title="X (formerly Twitter)"
                className="hover:scale-110 hover:opacity-90 transition-transform"
              >
                <Image
                  src="/x-formerly-twitter.svg"
                  alt="Twitter / X"
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px] object-contain drop-shadow-sm"
                />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                title="LinkedIn"
                className="hover:scale-110 hover:opacity-90 transition-transform"
              >
                <Image
                  src="/linkedin-badge.svg"
                  alt="LinkedIn"
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain drop-shadow-sm"
                />
              </a>
            </div>
          </div>

          {/* Column 2: For Candidates */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              For Job Seekers
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/#jobs" className="text-sky-100 hover:text-white transition-colors inline-flex items-center gap-1.5">
                  Browse Open Vacancies
                </Link>
              </li>
              <li>
                <Link href="/dashboard/seeker" className="text-sky-100 hover:text-white transition-colors inline-flex items-center gap-1.5">
                  My Applications
                </Link>
              </li>
              <li>
                <Link href="/dashboard/seeker/profile" className="text-sky-100 hover:text-white transition-colors inline-flex items-center gap-1.5">
                  Resume & Candidate Profile
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sky-100 hover:text-white transition-colors inline-flex items-center gap-1.5">
                  Create Candidate Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Employers */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              For Employers
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/dashboard/recruiter/jobs/new" className="text-sky-100 hover:text-white transition-colors inline-flex items-center gap-1.5">
                  Post a New Job
                </Link>
              </li>
              <li>
                <Link href="/dashboard/recruiter" className="text-sky-100 hover:text-white transition-colors inline-flex items-center gap-1.5">
                  Recruiter Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/recruiter/profile" className="text-sky-100 hover:text-white transition-colors inline-flex items-center gap-1.5">
                  Company Profile & Branding
                </Link>
              </li>
              <li>
                <Link href="/dashboard/recruiter/jobs/new" className="text-sky-100 hover:text-white transition-colors inline-flex items-center gap-1.5">
                  Hire with Jagir AI
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="mt-12 pt-6 border-t border-sky-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-sky-200">
          <p>© {currentYear} Jagir AI. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link href="/about" className="hover:text-white transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact & Support
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
