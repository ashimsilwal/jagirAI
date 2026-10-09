'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { Menu } from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // If user is not logged in, render children directly in the public layout
  if (!user) {
    return <>{children}</>;
  }

  // When user is logged in, the enterprise Sidebar takes the whole height and overlaps the navbar
  return (
    <div className="flex-1 flex flex-col w-full min-h-[calc(100vh-4rem)] bg-slate-50/60 dark:bg-slate-950">
      {/* Mobile bar with navigation menu toggle */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-16 z-20">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <Menu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Navigation Menu</span>
        </button>

        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Sidebar Navigation
        </span>
      </div>

      {/* Full-Height Modern Sidebar overlapping Navbar */}
      <DashboardSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        collapsed={collapsed}
        onCollapseChange={setCollapsed}
      />

      {/* Main Content Area: offset on desktop to account for fixed full-height sidebar */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'md:ml-18' : 'md:ml-64'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
