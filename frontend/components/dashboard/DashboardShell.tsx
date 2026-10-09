'use client';

import React, { useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { Menu, X, Briefcase } from 'lucide-react';
import Link from 'next/link';

export const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50/60 dark:bg-slate-950">
      {/* Mobile Top Sub-Header with Sidebar Toggle */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-16 z-20">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <Menu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Dashboard Menu</span>
        </button>

        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Navigation
        </span>
      </div>

      {/* Modern Sidebar */}
      <DashboardSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Dashboard Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
