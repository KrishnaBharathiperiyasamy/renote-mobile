'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  FileText,
  Settings,
  Info,
  Shield,
  Trash2,
  LogOut,
  Home,
  Phone,
  RefreshCw,
  Package,
  Link2,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Users,
  Palette,
  Receipt,
  LayoutGrid,
  LifeBuoy,
  AlertTriangle,
  Menu as MenuIcon,
  Store,
  X,
  Pin,
  PinOff,
} from 'lucide-react';
import Modal from '@components/Modal';
import { useUser } from '@context/UserContext';
import { MobileSidebarProps } from '@app-types/components';
import { ConfirmationPopUp } from '@components/ConfirmationPopUp';
import DeleteAccountFlow from '@components/DeleteAccount';
import { toast } from 'react-toastify';

/* 🔥 Original Brand Droplet / Flame Logo SVG 🔥 */
export function BrandFlameLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="sidebarFlameGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E63900" />
          <stop offset="50%" stopColor="#FF5722" />
          <stop offset="100%" stopColor="#FFA100" />
        </linearGradient>
        <linearGradient id="sidebarFlameInner" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF5722" />
          <stop offset="100%" stopColor="#FFD54F" />
        </linearGradient>
      </defs>
      {/* Inner teardrop core */}
      <path
        d="M12 2C10.2 4.8 8.5 7.2 8.5 10.2C8.5 13 10.2 14.8 12 15.8C13.8 14.8 15.5 13 15.5 10.2C15.5 7.2 13.8 4.8 12 2Z"
        fill="url(#sidebarFlameInner)"
        opacity="0.95"
      />
      {/* Outer droplet/flame contour */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 22C16.6395 22 20.4 18.2395 20.4 13.6C20.4 8.87 16.2 5.2 12 1C7.8 5.2 3.6 8.87 3.6 13.6C3.6 18.2395 7.3605 22 12 22ZM12 18C14.43 18 16.4 16.03 16.4 13.6C16.4 10.85 14.2 8.65 12 6.45C9.8 8.65 7.6 10.85 7.6 13.6C7.6 16.03 9.57 18 12 18Z"
        fill="url(#sidebarFlameGrad)"
      />
    </svg>
  );
}

/* ─── Types ─── */
export interface NavItem {
  label: string;
  icon: React.ReactElement<{ className?: string }>;
  path?: string;
  action?: () => void;
}

export interface Section {
  id: string;
  title: string;
  icon: React.ReactElement<{ className?: string }>;
  items: NavItem[];
}

export const DEFAULT_OPEN_SECTIONS: Record<string, boolean> = {
  create: true,
  account: true,
  support: true,
  danger: true,
};

/* ─── Helpers ─── */
export function isActivePath(
  pathname: string,
  itemPath: string,
  searchParams?: string | null
): boolean {
  if (!pathname || !itemPath) return false;

  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '').toLowerCase() || '/';
  const [rawItemBase, rawItemQuery] = itemPath.split('?');
  const cleanItemBase = rawItemBase.replace(/\/+$/, '').toLowerCase() || '/';

  // 1. If item targets a specific query param (e.g. /pages/Settings?tab=company or ?tab=account)
  if (rawItemQuery) {
    if (cleanPath !== cleanItemBase) return false;

    const itemParams = new URLSearchParams(rawItemQuery);
    const expectedTab = itemParams.get('tab')?.toLowerCase();

    let search = searchParams;
    if (search === undefined && typeof window !== 'undefined') {
      search = window.location.search;
    }
    const currentParams = new URLSearchParams(search || '');
    const currentTab = currentParams.get('tab')?.toLowerCase();

    if (expectedTab === 'account') {
      // Default tab on /pages/Settings is 'account' when tab param is absent or 'account'
      return currentTab === 'account' || !currentTab;
    }
    return currentTab === expectedTab;
  }

  // 2. If current path is /pages/Settings, non-queried items must not match
  if (cleanPath === '/pages/settings') {
    return false;
  }

  // 3. Marketplace & Home: /pages/marketplace, /pages/home, and /
  if (cleanItemBase === '/pages/marketplace') {
    return (
      cleanPath === '/pages/marketplace' ||
      cleanPath === '/pages/home' ||
      cleanPath === '/' ||
      cleanPath.startsWith('/pages/marketplace/')
    );
  }

  // 4. Estimations: only /pages/estimation and /pages/createestimation
  if (cleanItemBase === '/pages/estimation') {
    return (
      cleanPath === '/pages/estimation' ||
      cleanPath === '/pages/createestimation' ||
      cleanPath.startsWith('/pages/estimation/')
    );
  }

  // 5. Posters: only /pages/poster and /pages/createposter
  if (cleanItemBase === '/pages/poster') {
    return (
      cleanPath === '/pages/poster' ||
      cleanPath === '/pages/createposter' ||
      cleanPath.startsWith('/pages/poster/')
    );
  }

  // 6. Invoices: only /pages/invoice and /pages/createinvoice
  if (cleanItemBase === '/pages/invoice') {
    return (
      cleanPath === '/pages/invoice' ||
      cleanPath === '/pages/createinvoice' ||
      cleanPath.startsWith('/pages/invoice/')
    );
  }

  // 7. My Customers: exact match /pages/customer or nested /pages/customer/...
  if (cleanItemBase === '/pages/customer') {
    return cleanPath === '/pages/customer' || cleanPath.startsWith('/pages/customer/');
  }

  // 8. General exact match or intentional nested routes with strict separator
  return cleanPath === cleanItemBase || cleanPath.startsWith(cleanItemBase + '/');
}

export function buildSections(
  isLoggedIn: boolean,
  isSuperAdmin: boolean,
  callbacks: { onDeleteAccount: () => void; onDeleteLocal: () => void; onLogout?: () => void }
): Section[] {
  return [
    {
      id: 'create',
      title: 'Create & Manage',
      icon: <LayoutGrid />,
      items: [
        { label: 'Marketplace', icon: <Store />, path: '/pages/marketplace' },
        { label: 'Posters', icon: <Palette />, path: '/pages/poster' },
        { label: 'Estimations', icon: <Home />, path: '/pages/estimation' },
        { label: 'Invoices', icon: <Receipt />, path: '/pages/invoice' },
        { label: 'Product Warehouse', icon: <Package />, path: '/pages/productWareHouse' },
        { label: 'My Poster Links', icon: <Link2 />, path: '/pages/PosterLink' },
      ],
    },
    {
      id: 'account',
      title: 'Account',
      icon: <Settings />,
      items: [
        { label: 'My Companies', icon: <Building2 />, path: '/pages/Settings?tab=company' },
        { label: 'My Customers', icon: <Users />, path: '/pages/customer' },
        { label: 'Account Settings', icon: <Settings />, path: '/pages/Settings?tab=account' },
        ...(isSuperAdmin ? [{ label: 'Super Admin', icon: <ShieldCheck />, path: '/pages/superadmin' }] : []),
        ...(isLoggedIn && callbacks.onLogout ? [{ label: 'Log Out', icon: <LogOut />, action: callbacks.onLogout }] : []),
      ],
    },
    {
      id: 'support',
      title: 'Support',
      icon: <LifeBuoy />,
      items: [
        { label: 'About Us', icon: <Info />, path: '/pages/about' },
        { label: 'Contact Us', icon: <Phone />, path: '/pages/contact' },
        { label: 'Terms & Conditions', icon: <FileText />, path: '/pages/terms' },
        { label: 'Privacy Policy', icon: <Shield />, path: '/pages/privacy' },
        { label: 'Refund Policy', icon: <RefreshCw />, path: '/pages/refund' },
      ],
    },
    {
      id: 'danger',
      title: 'Danger Zone',
      icon: <AlertTriangle />,
      items: [
        isLoggedIn
          ? { label: 'Delete Account', icon: <Trash2 />, action: callbacks.onDeleteAccount }
          : { label: 'Delete Local Data', icon: <Trash2 />, action: callbacks.onDeleteLocal },
      ],
    },
  ];
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Shared Menu Items Renderer
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function ReNoteSidebarMenu({
  sections,
  openSections,
  openSectionId,
  onToggleSection,
  pathname,
  searchParams,
  onItemClick,
  isDarkMode = true,
  isCollapsed = false,
  onHoverItem,
  onLeaveItem,
  isPinned = false,
  onTogglePin,
}: {
  sections: Section[];
  openSections?: Record<string, boolean>;
  openSectionId?: string | null;
  onToggleSection: (id: string) => void;
  pathname: string;
  searchParams?: string | null;
  onItemClick?: (item: NavItem) => void;
  notificationCount?: number;
  isDarkMode?: boolean;
  isCollapsed?: boolean;
  onHoverItem?: (e: React.MouseEvent<HTMLButtonElement>, label: string) => void;
  onLeaveItem?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-2 transition-all duration-400"
      style={{
        transitionDuration: '400ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {sections.map((section, sIdx) => {
        const isSectionOpen = openSectionId !== undefined
          ? openSectionId === section.id
          : openSections !== undefined
            ? (openSections[section.id] ?? true)
            : true;
        const isCreateSection = section.id === 'create';

        return (
          <div key={section.id}>
            {/* Divider between sections in collapsed mode */}
            {sIdx > 0 && (
              <div
                className={`transition-all duration-400 mx-auto ${isCollapsed
                    ? 'w-8 h-px bg-gray-200 dark:bg-white/[0.08] my-1.5 opacity-100'
                    : 'w-0 h-0 my-0 opacity-0 overflow-hidden'
                  }`}
                style={{
                  transitionDuration: '400ms',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            )}

            {/* Section Header (Visible when expanded) */}
            <div
              className={`transition-all duration-400 ${isCollapsed
                  ? 'max-h-0 opacity-0 -translate-x-2 pointer-events-none overflow-hidden'
                  : 'max-h-10 opacity-100 translate-x-0'
                }`}
              style={{
                transitionDuration: '400ms',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div
                className={`w-full flex items-center justify-between px-1.5 py-1 rounded-lg ${isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-orange-50/60'
                  } transition`}
              >
                <button
                  type="button"
                  onClick={() => onToggleSection(section.id)}
                  className="flex-1 flex items-center gap-2.5 py-1 text-left cursor-pointer min-w-0"
                  aria-label={`${isSectionOpen ? 'Collapse' : 'Expand'} ${section.title}`}
                >
                  <span className={`flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-[#64748B]'
                    }`}>
                    {React.cloneElement(section.icon, {
                      className: `w-[18px] h-[18px] ${isDarkMode ? 'text-gray-400' : 'text-[#64748B]'
                        } stroke-[2] flex-shrink-0`,
                    })}
                    <span className="truncate">{section.title}</span>
                  </span>
                </button>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {isCreateSection && onTogglePin && (
                    <div className="relative group/pin flex items-center justify-center">
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin();
                        }}
                        aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                        className={`w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 ${
                          isPinned
                            ? isDarkMode
                              ? 'text-orange-400 bg-orange-500/20 hover:bg-orange-500/30'
                              : 'text-[#F65E1B] bg-orange-100 hover:bg-orange-200'
                            : isDarkMode
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.08]'
                              : 'text-[#64748B] hover:text-gray-800 hover:bg-orange-100/60'
                        }`}
                      >
                        {isPinned ? (
                          <>
                            <Pin className="w-3.5 h-3.5 fill-current stroke-[2] group-hover/pin:hidden transition-transform" />
                            <PinOff className="w-3.5 h-3.5 stroke-[2] hidden group-hover/pin:block transition-transform" />
                          </>
                        ) : (
                          <Pin className="w-3.5 h-3.5 stroke-[2] -rotate-45 group-hover/pin:scale-110 transition-transform" />
                        )}
                      </button>

                      {/* Subtle Floating Tooltip */}
                      <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 hidden group-hover/pin:flex group-focus-within/pin:flex items-center px-2 py-1 text-[11px] font-medium leading-none text-white bg-gray-900/95 dark:bg-[#1E2028] dark:text-gray-100 border border-gray-700/50 dark:border-white/10 rounded-md shadow-lg whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-150">
                        {isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                        <span className="absolute -bottom-1 right-2 w-2 h-2 rotate-45 bg-gray-900/95 dark:bg-[#1E2028] border-r border-b border-gray-700/50 dark:border-white/10" />
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleSection(section.id)}
                    aria-label={`${isSectionOpen ? 'Collapse' : 'Expand'} ${section.title}`}
                    className={`w-6 h-6 flex items-center justify-center rounded-md cursor-pointer ${
                      isDarkMode ? 'hover:bg-white/[0.08]' : 'hover:bg-orange-100/60'
                    } transition-colors`}
                  >
                    <ChevronDown
                      className={`w-[18px] h-[18px] ${isDarkMode ? 'text-gray-400' : 'text-[#64748B]'
                        } transition-transform duration-300 ease-in-out stroke-[2] flex-shrink-0 ${isSectionOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Section Items */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isCollapsed || isSectionOpen
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
            >
              <div className="overflow-hidden min-h-0">
                <div className={`flex flex-col gap-1 ${isCollapsed ? 'py-0.5' : 'pt-1 pb-1'}`}>
                  {section.items.map((item) => {
                    const active = item.path ? isActivePath(pathname, item.path, searchParams) : false;
                    return (
                      <div key={item.label} className="relative group/item flex items-center w-full">
                        <button
                          type="button"
                          aria-label={item.label}
                          onClick={() => onItemClick && onItemClick(item)}
                          onMouseEnter={(e) => onHoverItem && onHoverItem(e, item.label)}
                          onMouseLeave={() => onLeaveItem && onLeaveItem()}
                          className={`flex items-center w-full h-10 rounded-xl transition-all duration-400 text-[15px] group/item cursor-pointer select-none relative ${active
                              ? isDarkMode
                                ? 'bg-orange-500/20 text-orange-400 font-semibold'
                                : 'bg-[#FFEDD4] text-[#F65E1B] font-semibold'
                              : isDarkMode
                                ? 'text-gray-300 hover:bg-white/[0.05] hover:text-orange-400 font-medium'
                                : 'text-[#434D5D] hover:bg-[#FFF7ED] hover:text-[#F65E1B] font-medium'
                            }`}
                          style={{
                            transitionDuration: '400ms',
                            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          <div className="w-12 h-10 flex-shrink-0 flex items-center justify-center">
                            {React.cloneElement(item.icon, {
                              className: `w-5 h-5 flex-shrink-0 transition-colors duration-150 stroke-[2] ${active
                                  ? isDarkMode
                                    ? 'text-orange-400'
                                    : 'text-[#F65E1B]'
                                  : isDarkMode
                                    ? 'text-gray-400 group-hover/item:text-orange-400'
                                    : 'text-gray-500 group-hover/item:text-[#F65E1B]'
                                }`,
                            })}
                          </div>
                          <span
                            className={`whitespace-nowrap overflow-hidden transition-all duration-400 ${isCollapsed
                                ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                                : 'max-w-[170px] opacity-100 translate-x-0 ml-1'
                              }`}
                            style={{
                              transitionDuration: '400ms',
                              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            {item.label}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Desktop Rail — icon strip on md+
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function DesktopRailContent({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams?.toString() ? `?${searchParams.toString()}` : '';
  const { isLoggedIn, logout } = useUser();
  const isSuperAdmin = typeof window !== 'undefined' && localStorage.getItem('role') === 'super-admin';

  const railSections = buildSections(isLoggedIn, isSuperAdmin, {
    onDeleteAccount: () => { },
    onDeleteLocal: () => { },
    onLogout: () => {
      logout();
      window.location.href = '/';
    },
  }).filter((s) => s.id === 'create' || s.id === 'account');

  return (
    <nav className="desktop-rail hidden md:flex fixed top-0 left-0 h-full w-16 bg-white dark:bg-[#16181E] border-r border-gray-200 dark:border-white/[0.08] flex-col items-center py-3 z-50">
      <div className="mb-4 flex-shrink-0 cursor-pointer flex items-center justify-center" onClick={() => router.push('/pages/home')} title="ReNote Home">
        <BrandFlameLogo className="w-7 h-7" />
      </div>

      <div className="flex-1 flex flex-col items-center gap-0.5 overflow-y-auto hide-scrollbar">
        {railSections.map((section, sIdx) => (
          <React.Fragment key={section.id}>
            {sIdx > 0 && <div className="w-8 border-t border-gray-200 dark:border-white/[0.08] my-2" />}
            {section.items
              .filter((item) => item.path)
              .map((item) => {
                const active = isActivePath(pathname, item.path!, currentSearch);
                return (
                  <div key={item.label} className="relative group/rail">
                    <button
                      onClick={() => router.push(item.path!)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 relative ${active
                          ? 'bg-[#FFEDD4] text-[#F65E1B] font-bold dark:bg-orange-500/20 dark:text-orange-400'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
                        }`}
                    >
                      {React.cloneElement(item.icon, { className: 'w-5 h-5 stroke-[2]' })}
                    </button>
                    <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/rail:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-[60]">
                      {item.label}
                    </span>
                  </div>
                );
              })}
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1 mt-2 flex-shrink-0">
        <div className="relative group/rail">
          <button
            onClick={onOpenSidebar}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white transition"
          >
            <MenuIcon className="w-5 h-5 stroke-[2]" />
          </button>
          <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/rail:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-[60]">
            More
          </span>
        </div>

        {isLoggedIn && (
          <div className="relative group/rail">
            <button
              onClick={() => {
                logout();
                window.location.href = '/pages/login';
              }}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <LogOut className="w-5 h-5 stroke-[2]" />
            </button>
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/rail:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-[60]">
              Log Out
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}

export function DesktopRail(props: { onOpenSidebar: () => void }) {
  return (
    <React.Suspense fallback={<nav className="desktop-rail hidden md:flex fixed top-0 left-0 h-full w-16 bg-white dark:bg-[#16181E] border-r border-gray-200 dark:border-white/[0.08]" />}>
      <DesktopRailContent {...props} />
    </React.Suspense>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Desktop Shared Sidebar — for pages using persistent desktop aside
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function DesktopSidebarContent({ className = '', isDarkMode: propDarkMode }: { className?: string; isDarkMode?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams?.toString() ? `?${searchParams.toString()}` : '';
  const { logout, isLoggedIn, notificationCount } = useUser();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Default state: collapsed (icon-only mode) unless pinned in localStorage
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('renote_sidebar_pinned') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });
  const [isFullyExpanded, setIsFullyExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('renote_sidebar_pinned') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide hover-to-expand: expanded when hovered or pinned, collapsed when cursor leaves
  const isCollapsed = !isHovered && !isPinned;

  const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number } | null>(null);

  const isHoveredRef = useRef(isHovered);
  isHoveredRef.current = isHovered;
  const isPinnedRef = useRef(isPinned);
  isPinnedRef.current = isPinned;

  const updatePinned = (nextPinned: boolean) => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
    setIsPinned(nextPinned);
    try {
      localStorage.setItem('renote_sidebar_pinned', String(nextPinned));
    } catch {}
    if (nextPinned) {
      setIsFullyExpanded(true);
    } else {
      // If unpinning while cursor is inside sidebar, keep expanded until cursor leaves
      setIsFullyExpanded(isHoveredRef.current);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sidebar-pin-change'));
    }
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'renote_sidebar_pinned') {
        const val = e.newValue === 'true';
        setIsPinned(val);
        if (val) {
          setIsFullyExpanded(true);
        } else {
          setIsFullyExpanded(isHoveredRef.current);
          if (!isHoveredRef.current) {
            setIsHovered(false);
          }
        }
      }
    };
    const handleCustomSync = () => {
      try {
        const val = localStorage.getItem('renote_sidebar_pinned') === 'true';
        setIsPinned(val);
        if (val) {
          setIsFullyExpanded(true);
        } else {
          setIsFullyExpanded(isHoveredRef.current);
          if (!isHoveredRef.current) {
            setIsHovered(false);
          }
        }
      } catch {}
    };
    handleCustomSync();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('sidebar-pin-change', handleCustomSync);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sidebar-pin-change', handleCustomSync);
    };
  }, []);

  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsHovered(true);
    if (isPinned) {
      setIsFullyExpanded(true);
      return;
    }
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
    }
    expandTimeoutRef.current = setTimeout(() => {
      setIsFullyExpanded(true);
    }, 380);
  };

  const handleMouseLeave = () => {
    setTooltip(null);
    if (isPinned) return;
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
    setIsFullyExpanded(false);
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    // 150ms delay before collapsing to prevent accidental closing while moving the cursor
    collapseTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  const toggleCollapse = () => {
    if (isPinned) {
      updatePinned(false);
      setIsHovered(false);
      setIsFullyExpanded(false);
    } else if (isHovered) {
      setIsHovered(false);
      setIsFullyExpanded(false);
    } else {
      updatePinned(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        const next = !isPinnedRef.current;
        if (!next) {
          setIsHovered(false);
          setIsFullyExpanded(false);
        }
        updatePinned(next);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setTooltip(null);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const handleHoverItem = (e: React.MouseEvent<HTMLButtonElement>, label: string) => {
    if (isFullyExpanded) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const handleLeaveItem = () => {
    setTooltip(null);
  };

  const [internalDark, setInternalDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spa_theme') || localStorage.getItem('poster_theme') || localStorage.getItem('theme');
      return saved ? saved === 'dark' : document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    const handleThemeSync = () => {
      const saved = localStorage.getItem('spa_theme') || localStorage.getItem('poster_theme') || localStorage.getItem('theme');
      setInternalDark(saved ? saved === 'dark' : document.documentElement.classList.contains('dark'));
    };
    handleThemeSync();
    window.addEventListener('themechange', handleThemeSync);
    window.addEventListener('storage', handleThemeSync);
    return () => {
      window.removeEventListener('themechange', handleThemeSync);
      window.removeEventListener('storage', handleThemeSync);
    };
  }, []);

  const isDark = propDarkMode !== undefined ? propDarkMode : internalDark;

  const isSuperAdmin = typeof window !== 'undefined' && localStorage.getItem('role') === 'super-admin';

  const sections = buildSections(isLoggedIn, isSuperAdmin, {
    onDeleteAccount: () => setIsDeleteModalOpen(true),
    onDeleteLocal: () => setConfirmOpen(true),
    onLogout: () => {
      logout();
      window.location.href = '/';
    },
  });

  // Multi-section expanded state: keep all sections visible, preserve user toggles across navigation
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('renote_sidebar_open_sections');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            return {
              ...DEFAULT_OPEN_SECTIONS,
              ...parsed,
            };
          }
        }
      } catch {}
    }
    return DEFAULT_OPEN_SECTIONS;
  });

  useEffect(() => {
    const handleSectionsStorage = (e: StorageEvent) => {
      if (e.key === 'renote_sidebar_open_sections' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setOpenSections((prev) => ({
              ...prev,
              ...parsed,
            }));
          }
        } catch {}
      }
    };
    const handleSectionsCustomSync = () => {
      try {
        const saved = localStorage.getItem('renote_sidebar_open_sections');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setOpenSections((prev) => ({
              ...prev,
              ...parsed,
            }));
          }
        }
      } catch {}
    };
    handleSectionsCustomSync();
    window.addEventListener('storage', handleSectionsStorage);
    window.addEventListener('sidebar-sections-change', handleSectionsCustomSync);
    return () => {
      window.removeEventListener('storage', handleSectionsStorage);
      window.removeEventListener('sidebar-sections-change', handleSectionsCustomSync);
    };
  }, []);

  // Multi-expand toggle: clicking a section toggles it without collapsing other sections
  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const currentVal = prev[id] ?? true;
      const next = {
        ...prev,
        [id]: !currentVal,
      };
      try {
        localStorage.setItem('renote_sidebar_open_sections', JSON.stringify(next));
      } catch {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sidebar-sections-change'));
      }
      return next;
    });
  };

  return (
    <>
      <aside
        suppressHydrationWarning
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`print:hidden shrink-0 ${isCollapsed ? 'w-[72px]' : 'w-[260px]'
          } ${isDark ? 'bg-[#0E1017] border-[#1C1F2B]' : 'bg-[#FFFFFF] border-[#E5E7EB]'
          } border-r flex flex-col px-3 py-5 h-screen sticky top-0 select-none overflow-y-auto overflow-x-hidden hide-scrollbar z-30 will-change-[width] ${className}`}
        style={{
          transitionProperty: 'width, background-color, border-color',
          transitionDuration: '400ms',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="flex flex-col gap-5">
          {/* Brand Logo, Tagline & Toggle Button */}
          <div
            className="flex items-center min-h-[44px] w-full"
            style={{
              transitionDuration: '400ms',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Logo & Text */}
            <div
              className="flex items-center cursor-pointer select-none group min-w-0"
              onClick={() => router.push('/pages/home')}
              title="ReNote Home"
            >
              <div className="w-12 h-10 flex-shrink-0 flex items-center justify-center">
                <BrandFlameLogo className="w-7 h-7 shrink-0 group-hover:scale-105 transition-transform" />
              </div>
              <div
                className={`flex flex-col transition-all duration-400 overflow-hidden ${isCollapsed
                    ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
                    : 'opacity-100 max-w-[140px] translate-x-0 ml-1'
                  }`}
                style={{
                  transitionDuration: '400ms',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <span
                  className={`text-lg font-black tracking-tight leading-none whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'
                    }`}
                >
                  Re<span className="text-[#FF5722]">Note</span>
                </span>
                <span
                  className={`text-[10px] ${isDark ? 'text-[#7E8698]' : 'text-gray-500'
                    } font-medium tracking-wide mt-0.5 whitespace-nowrap`}
                >
                  Buy · Sell · Connect
                </span>
              </div>
            </div>

            {/* Collapse/Expand Toggle Button */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={toggleCollapse}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-400 cursor-pointer shrink-0 ml-auto ${isCollapsed
                  ? 'opacity-0 max-w-0 overflow-hidden pointer-events-none'
                  : 'opacity-100 max-w-8'
                } ${isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/[0.08]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              style={{
                transitionDuration: '400ms',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              title={isPinned ? 'Unpin sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-[18px] h-[18px] stroke-[2] transition-transform" />
              ) : (
                <ChevronLeft className="w-[18px] h-[18px] stroke-[2] transition-transform" />
              )}
            </button>
          </div>

          {/* Navigation Menu */}
          <ReNoteSidebarMenu
            sections={sections}
            openSections={openSections}
            onToggleSection={toggleSection}
            pathname={pathname}
            searchParams={currentSearch}
            notificationCount={notificationCount}
            isDarkMode={isDark}
            isCollapsed={isCollapsed}
            onHoverItem={handleHoverItem}
            onLeaveItem={handleLeaveItem}
            isPinned={isPinned}
            onTogglePin={() => updatePinned(!isPinned)}
            onItemClick={(item) => {
              setTooltip(null);
              if (item.action) item.action();
              else if (item.path) router.push(item.path);
            }}
          />
        </div>
      </aside>

      {/* Floating Tooltip in Collapsed / Transition Mode */}
      {tooltip && !isFullyExpanded && (
        <div
          style={{ top: tooltip.top, left: tooltip.left }}
          className={`fixed -translate-y-1/2 px-2.5 py-1.5 text-xs font-semibold rounded-lg pointer-events-none whitespace-nowrap z-[9999] shadow-2xl border transition-all duration-150 animate-in fade-in zoom-in-95 ${isDark
              ? 'bg-[#161822] text-white border-[#2A2E3D] shadow-black/80'
              : 'bg-gray-900 text-white border-gray-800 shadow-xl'
            }`}
        >
          {tooltip.label}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <DeleteAccountFlow onClose={() => setIsDeleteModalOpen(false)} />
      </Modal>
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <ConfirmationPopUp
          message={<p className="text-sm text-gray-600 dark:text-gray-300">This will delete all saved local data from this device.</p>}
          onYes={() => {
            localStorage.clear();
            setConfirmOpen(false);
            toast.success('Local data deleted successfully');
            window.location.reload();
          }}
          onNo={() => setConfirmOpen(false)}
        />
      </Modal>
    </>
  );
}

export function DesktopSidebar(props: { className?: string; isDarkMode?: boolean }) {
  const isPinnedDefault = typeof window !== 'undefined' ? localStorage.getItem('renote_sidebar_pinned') === 'true' : false;
  return (
    <React.Suspense
      fallback={
        <aside
          className={`print:hidden ${isPinnedDefault ? 'w-[260px]' : 'w-[72px]'} shrink-0 ${props.isDarkMode ? 'bg-[#0E1017] border-[#1C1F2B]' : 'bg-[#FFFFFF] border-[#E5E7EB]'
            } border-r flex flex-col px-3 py-5 h-screen sticky top-0 ${props.className || ''}`}
        />
      }
    >
      <DesktopSidebarContent {...props} />
    </React.Suspense>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Mobile Sidebar — slide-out drawer matching reference design
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function MobileSidebarContent({ isOpen, onClose }: MobileSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams?.toString() ? `?${searchParams.toString()}` : '';
  const { logout, isLoggedIn, notificationCount } = useUser();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spa_theme') || localStorage.getItem('poster_theme');
      return saved ? saved === 'dark' : document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    const handleThemeSync = () => {
      const saved = localStorage.getItem('spa_theme') || localStorage.getItem('poster_theme');
      setIsDarkMode(saved ? saved === 'dark' : document.documentElement.classList.contains('dark'));
    };
    handleThemeSync();
    window.addEventListener('themechange', handleThemeSync);
    window.addEventListener('storage', handleThemeSync);
    return () => {
      window.removeEventListener('themechange', handleThemeSync);
      window.removeEventListener('storage', handleThemeSync);
    };
  }, []);

  const isSuperAdmin = typeof window !== 'undefined' && localStorage.getItem('role') === 'super-admin';

  const sections = buildSections(isLoggedIn, isSuperAdmin, {
    onDeleteAccount: () => setIsDeleteModalOpen(true),
    onDeleteLocal: () => setConfirmOpen(true),
    onLogout: () => {
      logout();
      window.location.href = '/';
    },
  });

  // Multi-section expanded state: keep all sections visible, preserve user toggles across navigation
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('renote_sidebar_open_sections');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            return {
              ...DEFAULT_OPEN_SECTIONS,
              ...parsed,
            };
          }
        }
      } catch {}
    }
    return DEFAULT_OPEN_SECTIONS;
  });

  useEffect(() => {
    const handleSectionsStorage = (e: StorageEvent) => {
      if (e.key === 'renote_sidebar_open_sections' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setOpenSections((prev) => ({
              ...prev,
              ...parsed,
            }));
          }
        } catch {}
      }
    };
    const handleSectionsCustomSync = () => {
      try {
        const saved = localStorage.getItem('renote_sidebar_open_sections');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setOpenSections((prev) => ({
              ...prev,
              ...parsed,
            }));
          }
        }
      } catch {}
    };
    handleSectionsCustomSync();
    window.addEventListener('storage', handleSectionsStorage);
    window.addEventListener('sidebar-sections-change', handleSectionsCustomSync);
    return () => {
      window.removeEventListener('storage', handleSectionsStorage);
      window.removeEventListener('sidebar-sections-change', handleSectionsCustomSync);
    };
  }, []);

  // Multi-expand toggle: clicking a section toggles it without collapsing other sections
  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const currentVal = prev[id] ?? true;
      const next = { ...prev, [id]: !currentVal };
      try {
        localStorage.setItem('renote_sidebar_open_sections', JSON.stringify(next));
      } catch {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sidebar-sections-change'));
      }
      return next;
    });
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 ${isDarkMode ? 'bg-[#16181E] text-white' : 'bg-[#FFFDF9] text-gray-900'} shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0 border-b border-gray-100 dark:border-white/[0.05]">
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => { router.push('/pages/home'); onClose(); }} title="ReNote Home">
            <BrandFlameLogo className="w-7 h-7 shrink-0" />
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight leading-none text-gray-900 dark:text-white">
                Re<span className="text-[#FF5722]">Note</span>
              </span>
              <span className={`text-[10px] ${isDarkMode ? 'text-[#7E8698]' : 'text-gray-500'} font-medium tracking-wide mt-0.5`}>
                Buy · Sell · Connect
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/[0.08] transition cursor-pointer"
            title="Close Menu"
          >
            <X className="w-[18px] h-[18px] stroke-[2]" />
          </button>
        </div>

        {/* Sections Container */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4">
          <ReNoteSidebarMenu
            sections={sections}
            openSections={openSections}
            onToggleSection={toggleSection}
            pathname={pathname}
            searchParams={currentSearch}
            notificationCount={notificationCount}
            isDarkMode={isDarkMode}
            isCollapsed={false}
            onItemClick={(item) => {
              if (item.action) item.action();
              else if (item.path) router.push(item.path);
              onClose();
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <DeleteAccountFlow onClose={() => setIsDeleteModalOpen(false)} />
      </Modal>
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <ConfirmationPopUp
          message={<p className="text-sm text-gray-600 dark:text-gray-300">This will delete all saved local data from this device.</p>}
          onYes={() => {
            localStorage.clear();
            setConfirmOpen(false);
            toast.success('Local data deleted successfully');
            window.location.reload();
          }}
          onNo={() => setConfirmOpen(false)}
        />
      </Modal>
    </>
  );
}

export default function MobileSidebar(props: MobileSidebarProps) {
  if (!props.isOpen) return null;
  return (
    <React.Suspense fallback={null}>
      <MobileSidebarContent {...props} />
    </React.Suspense>
  );
}
