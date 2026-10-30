'use client';

import React from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { useSidebar } from '@/context/SidebarContext';

export const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useSidebar();

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] bg-slate-50/60 dark:bg-black">
      {/* Modern Sidebar */}
      <DashboardSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Dashboard Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
