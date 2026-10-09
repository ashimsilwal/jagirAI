'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  FileText,
  UserCheck,
  PlusCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  ExternalLink,
  Sparkles,
  Search,
  Bookmark,
  CheckCircle2,
  Info,
  Mail,
  LifeBuoy
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  exact?: boolean;
}

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  mobileOpen = false,
  onMobileClose,
  collapsed: controlledCollapsed,
  onCollapseChange,
}) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = () => {
    const next = !collapsed;
    if (onCollapseChange) {
      onCollapseChange(next);
    } else {
      setInternalCollapsed(next);
    }
  };

  if (!user) return null;

  const isAdmin = !!(user.is_staff || user.is_superuser);
  const isRecruiter = user.role === 'JOB_RECRUITER';

  // Role-based Nav items
  let navItems: SidebarItem[] = [];

  if (isAdmin) {
    navItems = [
      {
        label: 'System Overview',
        href: '/dashboard/admin',
        icon: ShieldCheck,
      },
      {
        label: 'User Management',
        href: '/dashboard/admin#users',
        icon: Users,
      },
      {
        label: 'Support Tickets',
        href: '/dashboard/admin#tickets',
        icon: LifeBuoy,
      },
      {
        label: 'Job Vacancies',
        href: '/dashboard/admin#jobs',
        icon: Briefcase,
      },
      {
        label: 'Platform Front',
        href: '/',
        icon: ExternalLink,
      },
    ];
  } else if (isRecruiter) {
    navItems = [
      {
        label: 'Recruiter Dashboard',
        href: '/dashboard/recruiter',
        icon: LayoutDashboard,
      },
      {
        label: 'Post New Vacancy',
        href: '/dashboard/recruiter/jobs/new',
        icon: PlusCircle,
        badge: 'New',
      },
      {
        label: 'Company Profile',
        href: '/dashboard/recruiter/profile',
        icon: Building2,
      },
    ];
  } else {
    // Job Seeker
    navItems = [
      {
        label: 'My Applications',
        href: '/dashboard/seeker',
        icon: FileText,
      },
      {
        label: 'Find Jobs',
        href: '/',
        icon: Briefcase,
      },
      {
        label: 'Profile & Resume',
        href: '/dashboard/seeker/profile',
        icon: UserCheck,
      },
    ];
  }

  const secondaryNavItems: SidebarItem[] = isAdmin
    ? []
    : [
        {
          label: 'About Jagir AI',
          href: '/about',
          icon: Info,
        },
        {
          label: 'Help & Support',
          href: '/dashboard/support',
          icon: LifeBuoy,
        },
      ];

  const isCurrentActive = (href: string) => {
    if (href === '/') return pathname === '/';
    const cleanHref = href.split('#')[0];
    return pathname === cleanHref;
  };

  const initials = user.username ? user.username.slice(0, 2).toUpperCase() : 'US';

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between select-none overflow-hidden">
      {/* Top Header & Navigation */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Brand Bar in Sidebar */}
        <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} border-b border-slate-100 dark:border-slate-800 shrink-0`}>
          {!collapsed ? (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-sky-200">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base leading-tight tracking-tight text-slate-900 dark:text-white">
                  Jagir<span className="text-sky-600 dark:text-sky-400">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {isAdmin ? 'Admin Console' : isRecruiter ? 'Recruiter Space' : 'Career Portal'}
                </span>
              </div>
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-sky-200">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Link List - Scrollable if content overflows */}
        <nav className="p-3 space-y-4 flex-1 overflow-y-auto">
          <div>
            {!collapsed && (
              <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Workspace
              </p>
            )}
            <div className="space-y-1">
              {navItems.map((item, idx) => {
                const active = isCurrentActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      active
                        ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/60 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        active
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-900/80 text-sky-700 dark:text-sky-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {secondaryNavItems.length > 0 && (
            <div>
              {!collapsed && (
                <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Platform & Support
                </p>
              )}
              <div className="space-y-1">
                {secondaryNavItems.map((item, idx) => {
                  const active = isCurrentActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={idx}
                      href={item.href}
                      onClick={onMobileClose}
                      title={collapsed ? item.label : undefined}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        active
                          ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/60 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`}
                      />
                      {!collapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Full-Height Fixed Sidebar overlapping Navbar */}
      <aside
        className={`hidden md:block shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 z-50 fixed inset-y-0 left-0 h-screen shadow-lg md:shadow-none ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
