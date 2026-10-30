'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen, collapsed, setCollapsed } = useSidebar();

  // If user is not logged in or on profile setup page, render children directly without sidebar
  if (!user || pathname?.startsWith('/dashboard/setup')) {
    return <>{children}</>;
  }

  // When user is logged in, the enterprise Sidebar takes the whole height and overlaps the navbar
  return (
    <div className="flex-1 flex flex-col w-full min-h-[calc(100vh-4rem)] bg-slate-50/60 dark:bg-black">
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
