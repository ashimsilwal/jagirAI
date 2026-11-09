'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiFetch, hasPermission } from '@/lib/api';
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
  Search,
  CheckCircle2,
  Info,
  Mail,
  LifeBuoy,
  Tag,
  BookOpen,
  X
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
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

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
      return () => {
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
      };
    }
  }, [mobileOpen]);

  if (!user) return null;

  const isAdmin = !!(user.is_staff || user.is_superuser);
  const isRecruiter = user.role === 'JOB_RECRUITER';

  // Live support ticket and contact inquiries counters for admin
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);
  const [unreadContactsCount, setUnreadContactsCount] = useState<number>(0);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchCounts = () => {
      apiFetch<any>('/admin/tickets/?status=OPEN')
        .then((data) => {
          const list = Array.isArray(data) ? data : data.results || [];
          setOpenTicketsCount(typeof data.count === 'number' ? data.count : list.length);
        })
        .catch(() => {});

      apiFetch<any>('/contact/stats/')
        .then((stats) => {
          setUnreadContactsCount(stats?.unread || 0);
        })
        .catch(() => {});
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);

    const handleCustomEvent = () => fetchCounts();
    window.addEventListener('ticket-updated', handleCustomEvent);
    window.addEventListener('contact-updated', handleCustomEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('ticket-updated', handleCustomEvent);
      window.removeEventListener('contact-updated', handleCustomEvent);
    };
  }, [isAdmin]);

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
        label: 'Contact Inquiries',
        href: '/dashboard/admin/contacts',
        icon: Mail,
        badge: unreadContactsCount > 0 ? `${unreadContactsCount} New` : undefined,
        badgeColor: 'bg-sky-100 dark:bg-sky-950/90 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 animate-pulse',
      },
      {
        label: 'Support Tickets',
        href: '/dashboard/admin/tickets',
        icon: LifeBuoy,
        badge: openTicketsCount > 0 ? `${openTicketsCount} Open` : undefined,
        badgeColor: 'bg-amber-100 dark:bg-amber-950/90 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse',
      },
      {
        label: 'Job Categories',
        href: '/dashboard/admin/categories',
        icon: Tag,
      },
      {
        label: 'Manage Blogs',
        href: '/dashboard/admin/blogs',
        icon: BookOpen,
      },
      {
        label: 'About Page',
        href: '/dashboard/admin/about',
        icon: Info,
      },
    ];
  } else if (isRecruiter) {
    navItems = [
      {
        label: 'Recruiter Dashboard',
        href: '/dashboard/recruiter',
        icon: LayoutDashboard,
      },
      ...(hasPermission(user, 'application.view')
        ? [
            {
              label: 'All Applications',
              href: '/dashboard/recruiter/applications',
              icon: FileText,
            },
          ]
        : []),
      ...(hasPermission(user, 'vacancy.create') || hasPermission(user, 'vacancy.view')
        ? [
            {
              label: 'My Jobs',
              href: '/dashboard/recruiter/jobs',
              icon: Briefcase,
            },
            ...(hasPermission(user, 'vacancy.create')
              ? [
                  {
                    label: 'Post a Vacancy',
                    href: '/dashboard/recruiter/jobs/new',
                    icon: PlusCircle,
                  },
                ]
              : []),
            {
              label: 'Job Categories',
              href: '/dashboard/recruiter/categories',
              icon: Tag,
            },
          ]
        : []),
      ...(hasPermission(user, 'team.view')
        ? [
            {
              label: 'Team & Staff',
              href: '/dashboard/recruiter/team',
              icon: Users,
            },
          ]
        : []),
      ...(hasPermission(user, 'organization.view') || hasPermission(user, 'organization.update')
        ? [
            {
              label: 'Company Profile',
              href: '/dashboard/recruiter/profile',
              icon: Building2,
            },
          ]
        : []),
    ];
  } else {
    // Job Seeker
    navItems = [
      {
        label: 'Dashboard Overview',
        href: '/dashboard/seeker',
        icon: LayoutDashboard,
      },
      {
        label: 'Find Jobs',
        href: '/jobs',
        icon: Briefcase,
      },
      {
        label: 'Applied Jobs',
        href: '/dashboard/seeker/applications',
        icon: FileText,
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
          label: 'Help & Support',
          href: '/dashboard/support',
          icon: LifeBuoy,
        },
      ];

  const isCurrentActive = (href: string) => {
    if (href === '/') return pathname === '/';
    const [pathPart, queryPart] = href.split('?');
    const cleanPath = pathPart.split('#')[0];
    if (cleanPath === '/jobs') {
      return pathname === '/jobs' || (Boolean(pathname?.startsWith('/jobs/')) && pathname !== '/jobs/new');
    }
    if (pathname !== cleanPath) return false;

    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (queryPart) {
        return search.includes(queryPart);
      }
    }
    return true;
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
            type="button"
            onClick={toggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            {collapsed ? <ChevronRight aria-hidden="true" className="w-4 h-4" /> : <ChevronLeft aria-hidden="true" className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          {onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Close sidebar navigation"
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X aria-hidden="true" className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Link List - Scrollable if content overflows */}
        <nav aria-label="Dashboard navigation" className="p-3 space-y-4 flex-1 overflow-y-auto">
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
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      active
                        ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/60 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Icon
                      aria-hidden="true"
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
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.badgeColor || 'bg-sky-100 dark:bg-sky-900/80 text-sky-700 dark:text-sky-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {collapsed && item.badge && (
                      <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute top-2 right-2 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
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
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
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
