import React from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Mail, 
  MapPin 
} from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = 2026;

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

            {/* Social Media Real Logos in Footer */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
                className="hover:scale-110 hover:opacity-90 transition-transform"
              >
                <svg className="w-5 h-5 shrink-0 drop-shadow-sm" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="12" fill="#1877F2" />
                  <path
                    fill="#FFFFFF"
                    d="M15.12 12.72l.53-3.44h-3.3v-2.23c0-.94.46-1.85 1.93-1.85h1.5V2.26s-1.36-.23-2.66-.23c-2.71 0-4.48 1.64-4.48 4.62v2.63H5.57v3.44h3.07v8.31c.62.1 1.25.15 1.88.15.63 0 1.26-.05 1.88-.15v-8.31h2.72z"
                  />
                </svg>
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="hover:scale-110 hover:opacity-90 transition-transform"
              >
                <svg className="w-5 h-5 shrink-0 rounded-md overflow-hidden drop-shadow-sm" viewBox="0 0 24 24" aria-hidden="true">
                  <defs>
                    <radialGradient id="ig-gradient-footer" cx="20%" cy="110%" r="135%">
                      <stop offset="0%" stopColor="#FFD521" />
                      <stop offset="10%" stopColor="#FFD521" />
                      <stop offset="35%" stopColor="#F50000" />
                      <stop offset="60%" stopColor="#B900B4" />
                      <stop offset="90%" stopColor="#4A00E0" />
                    </radialGradient>
                  </defs>
                  <rect width="24" height="24" rx="6" fill="url(#ig-gradient-footer)" />
                  <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="3.4" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
                  <circle cx="15.8" cy="8.2" r="1" fill="#FFFFFF" />
                </svg>
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                title="Twitter"
                className="hover:scale-110 hover:opacity-90 transition-transform"
              >
                <svg className="w-5 h-5 shrink-0 drop-shadow-sm" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="12" fill="#1DA1F2" />
                  <path
                    fill="#FFFFFF"
                    d="M18.8 8.1c-.5.2-1 .4-1.6.5.6-.4 1-.9 1.2-1.6-.5.3-1.1.5-1.8.7-.5-.5-1.2-.9-2-.9-1.5 0-2.8 1.2-2.8 2.8 0 .2 0 .4.1.7-2.3-.1-4.4-1.2-5.7-2.9-.2.4-.4.9-.4 1.4 0 1 .5 1.8 1.2 2.3-.5 0-.9-.1-1.3-.4v.1c0 1.3.9 2.5 2.2 2.7-.2.1-.5.1-.7.1-.2 0-.3 0-.5-.1.3 1.1 1.4 2 2.6 2-1 .8-2.2 1.2-3.5 1.2-.2 0-.5 0-.7 0 1.2.8 2.7 1.3 4.3 1.3 5.1 0 7.9-4.2 7.9-7.9v-.4c.6-.4 1-.9 1.4-1.5z"
                  />
                </svg>
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                title="LinkedIn"
                className="hover:scale-110 hover:opacity-90 transition-transform"
              >
                <svg className="w-5 h-5 shrink-0 drop-shadow-sm" viewBox="0 0 24 24" aria-hidden="true">
                  <rect width="24" height="24" rx="4.5" fill="#0A66C2" />
                  <path
                    fill="#FFFFFF"
                    d="M7.12 6.56a1.56 1.56 0 1 1-3.12 0 1.56 1.56 0 0 1 3.12 0zM4.16 9.24h2.8v10.6h-2.8V9.24zm4.44 0h2.68v1.45h.04c.37-.7 1.28-1.45 2.63-1.45 2.81 0 3.33 1.85 3.33 4.26v6.34h-2.8v-5.62c0-1.34-.02-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.72h-2.8V9.24z"
                  />
                </svg>
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
                <Link href="/" className="text-sky-100 hover:text-white transition-colors inline-flex items-center gap-1.5">
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
                <Link href="/register" className="text-sky-100 hover:text-white transition-colors inline-flex items-center gap-1.5">
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
            <Link href="/" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
