'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen, collapsed, setCollapsed } = useSidebar();
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    const checkPreview = () => {
      if (typeof window !== 'undefined') {
        setIsPreview(window.location.search.includes('preview=true'));
      }
    };
    checkPreview();
    window.addEventListener('popstate', checkPreview);
    return () => window.removeEventListener('popstate', checkPreview);
  }, [pathname]);

  const isDashboard = Boolean(
    user &&
    !isPreview &&
    ((pathname?.startsWith('/dashboard') && !pathname?.startsWith('/dashboard/setup')) ||
     pathname === '/jobs' ||
     pathname?.startsWith('/jobs/'))
  );

  // Do NOT show the sidebar if:
  // 1. User is not logged in
  // 2. Not on a dashboard or jobs workspace route (e.g. public main pages like /blog, /about, /contact, /)
  // 3. On dashboard setup (/dashboard/setup)
  // 4. In a preview mode (?preview=true)
  if (!isDashboard) {
    return <>{children}</>;
  }

  // When user is logged in and on a dashboard route, show the enterprise DashboardSidebar
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


