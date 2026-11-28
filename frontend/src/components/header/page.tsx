"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  Store,
  Crown,
  Sun,
  Moon,
  Check,
  Menu,
} from "lucide-react";
import { useUser } from "@context/UserContext";
import { useFinancialYear } from "@context/FinancialYearContext";
import ProfileModal from "@components/ProfileModal";
import MobileSidebar from "@components/Sidebar/page";

/**
 * Resolves the dynamic page heading based on current pathname and query parameters.
 */
export function resolvePageTitle(
  pathname: string | null | undefined,
  searchParams?: { get: (key: string) => string | null } | null
): string {
  if (!pathname) return "Marketplace";

  const cleanPath = pathname.split("?")[0].replace(/\/+$/, "").toLowerCase();

  // 1. Specific sub-pages & creation/edit flows
  if (cleanPath === "/pages/createposter") return "Create Poster";
  if (cleanPath === "/pages/createestimation") return "Create Estimation";
  if (cleanPath === "/pages/createinvoice") return "Create Invoice";
  if (cleanPath.startsWith("/pages/posterlink")) return "My Poster Links";
  if (cleanPath.startsWith("/pages/subscription")) return "Subscription";
  if (cleanPath.startsWith("/pages/notifications")) return "Notifications";
  if (cleanPath.startsWith("/pages/superadmin")) return "Super Admin";

  // 2. Settings tab-specific routes
  if (cleanPath === "/pages/settings") {
    const tab = searchParams?.get("tab")?.toLowerCase();
    if (tab === "company") return "My Companies";
    return "Account Settings";
  }

  // 3. Core Sidebar Section Pages
  if (cleanPath === "/pages/poster" || cleanPath.startsWith("/pages/poster/")) return "Posters";
  if (cleanPath === "/pages/estimation" || cleanPath.startsWith("/pages/estimation/")) return "Estimations";
  if (cleanPath === "/pages/invoice" || cleanPath.startsWith("/pages/invoice/")) return "Invoices";
  if (cleanPath === "/pages/productwarehouse" || cleanPath.startsWith("/pages/productwarehouse/")) return "Product Warehouse";
  if (cleanPath === "/pages/customer" || cleanPath.startsWith("/pages/customer/")) return "My Customers";

  // 4. Support Pages
  if (cleanPath === "/pages/about") return "About Us";
  if (cleanPath === "/pages/contact") return "Contact Us";
  if (cleanPath === "/pages/terms") return "Terms & Conditions";
  if (cleanPath === "/pages/privacy") return "Privacy Policy";
  if (cleanPath === "/pages/refund") return "Refund Policy";

  // 5. Auth & Utility Pages
  if (cleanPath === "/pages/login") return "Login";
  if (cleanPath === "/pages/register") return "Sign Up";
  if (cleanPath === "/pages/forgotpassword") return "Forgot Password";
  if (cleanPath.startsWith("/pages/view")) return "View Document";

  // 6. Marketplace / Home / Root
  if (
    cleanPath === "" ||
    cleanPath === "/" ||
    cleanPath === "/pages/home" ||
    cleanPath === "/pages/marketplace" ||
    cleanPath.startsWith("/pages/marketplace/")
  ) {
    return "Marketplace";
  }

  // 7. Dynamic fallback: extract from path segment (e.g. /pages/myRoute -> "My Route")
  const segments = cleanPath.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "Marketplace";
  return last
    .replace(/^pages\//, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Inner title element that reads useSearchParams safely inside Suspense
 */
function HeaderTitle({
  title,
  isEditorPage,
  isDarkMode,
}: {
  title?: string;
  isEditorPage: boolean;
  isDarkMode: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const displayTitle = title || resolvePageTitle(pathname, searchParams);

  return (
    <h1
      className={`font-['Manrope',sans-serif] font-[600] ${
        isEditorPage ? "text-[18px] sm:text-[20px]" : "text-[20px]"
      } tracking-[-0.3px] leading-tight ${
        isDarkMode ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" : "text-[#0F172A]"
      } truncate select-none transition-colors duration-200`}
    >
      {displayTitle}
    </h1>
  );
}

export default function Header({ title }: { title?: string } = {}) {
  const { profileImageUrl, fullName, isLoggedIn, userLoading } = useUser();
  const { selectedFY, setSelectedFY, fyOptions, currentFYLabel } = useFinancialYear();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFyDropdownOpen, setIsFyDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const fyDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Sync theme with global app state & localStorage
  useEffect(() => {
    const syncTheme = () => {
      const saved = localStorage.getItem("poster_theme") || localStorage.getItem("spa_theme") || localStorage.getItem("theme");
      const dark = saved ? saved === "dark" : document.documentElement.classList.contains("dark");
      setIsDarkMode(dark);
    };
    syncTheme();
    window.addEventListener("themechange", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("themechange", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const toggleTheme = (dark: boolean) => {
    setIsDarkMode(dark);
    const themeStr = dark ? "dark" : "light";
    localStorage.setItem("poster_theme", themeStr);
    localStorage.setItem("spa_theme", themeStr);
    localStorage.setItem("theme", themeStr);
    if (typeof document !== "undefined") {
      if (dark) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        document.documentElement.style.colorScheme = "dark";
        document.body.classList.add("dark");
        document.body.classList.remove("light");
        document.body.style.backgroundColor = "#0D0E12";
        document.body.style.color = "#E0E2EC";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        document.documentElement.style.colorScheme = "light";
        document.body.classList.remove("dark");
        document.body.classList.add("light");
        document.body.style.backgroundColor = "#F8F9FC";
        document.body.style.color = "#111827";
      }
      window.dispatchEvent(new Event("themechange"));
    }
  };

  const handleProfileClick = () => {
    setShowProfileModal((prev) => !prev);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fyDropdownRef.current && !fyDropdownRef.current.contains(e.target as Node)) {
        setIsFyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayUserName =
    fullName ||
    (typeof window !== "undefined" ? localStorage.getItem("firstName") : "") ||
    "User";

  if (!mounted) return null;

  const isEditorPage = pathname?.toLowerCase().startsWith("/pages/createposter");

  return (
    <>
      <header
        className={`${isEditorPage ? "h-11 sm:h-12 px-3 sm:px-6" : "h-16 px-4 sm:px-8"
          } border-b sticky top-0 z-40 flex items-center justify-between shadow-sm transition-colors duration-200 shrink-0 ${isDarkMode
            ? "bg-[#16181E] border-white/[0.08] text-white"
            : "bg-[#FFFFFF] border-[#E5E7EB] text-gray-900 shadow-sm"
          }`}
      >
        {/* Left: Mobile Sidebar Hamburger Toggle + Dynamic Current-Page Heading */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-xl bg-[#FF5722] hover:bg-[#FF7043] transition-colors shadow-sm shrink-0 cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-[18px] h-[18px] text-white stroke-[2]" />
          </button>

          {/* Dynamic Current Page Heading */}
          <div className="flex items-center gap-2 truncate min-w-0">
            <Suspense
              fallback={
                <h1
                  className={`font-['Manrope',sans-serif] font-[600] ${
                    isEditorPage ? "text-[18px] sm:text-[20px]" : "text-[20px]"
                  } tracking-[-0.3px] leading-tight ${
                    isDarkMode ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" : "text-[#0F172A]"
                  } truncate select-none transition-colors duration-200`}
                >
                  {title || resolvePageTitle(pathname, null)}
                </h1>
              }
            >
              <HeaderTitle title={title} isEditorPage={isEditorPage} isDarkMode={isDarkMode} />
            </Suspense>
          </div>
        </div>

        {/* Right Controls: Financial Year, Marketplace Link, Theme Toggle, Get Premium, Profile Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Financial Year Dropdown */}
          <div className="relative" ref={fyDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFyDropdownOpen(!isFyDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold ${isDarkMode
                  ? "text-white bg-[#1B1E26] hover:bg-[#252A36] border-white/[0.08]"
                  : "text-gray-800 bg-gray-100 hover:bg-gray-200 border-gray-200"
                } border hover:border-[#FF5722]/50 rounded-xl transition-all shadow-sm cursor-pointer`}
              title="Select Financial Year"
            >
              <Calendar className="w-[18px] h-[18px] text-[#FF5722] stroke-[2] shrink-0" />
              <span className={`${isDarkMode ? "text-white" : "text-gray-900"} text-xs font-bold hidden sm:inline`}>
                {currentFYLabel || "FY 2026-27"}
              </span>
              <span className={`${isDarkMode ? "text-white" : "text-gray-900"} text-xs font-bold sm:hidden`}>
                {currentFYLabel?.replace("FY ", "") || "26-27"}
              </span>
              <ChevronDown className="w-[18px] h-[18px] text-gray-400 ml-0.5 stroke-[2] shrink-0" />
            </button>

            {isFyDropdownOpen && (
              <div
                className={`absolute right-0 z-50 mt-2 w-44 ${isDarkMode
                    ? "bg-[#16181E] border-white/[0.1] text-gray-300"
                    : "bg-white border-gray-200 text-gray-700 shadow-xl"
                  } border shadow-2xl rounded-2xl p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100`}
              >
                {fyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedFY(opt.value);
                      setIsFyDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors cursor-pointer ${selectedFY === opt.value
                        ? isDarkMode
                          ? "bg-[#281611] text-[#FF5722] border border-[#FF5722]/30"
                          : "bg-orange-50 text-[#FF5722] border border-orange-200"
                        : isDarkMode
                          ? "text-gray-300 hover:bg-[#1B1E26] hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                  >
                    <span>{opt.label}</span>
                    {selectedFY === opt.value && <Check className="w-[18px] h-[18px] text-[#FF5722] stroke-[2] shrink-0" />}
                  </button>
                ))}
                <div className={`border-t ${isDarkMode ? "border-white/[0.08]" : "border-gray-100"} my-1`} />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFY("ALL");
                    setIsFyDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors cursor-pointer ${selectedFY === "ALL"
                      ? isDarkMode
                        ? "bg-[#281611] text-[#FF5722] border border-[#FF5722]/30"
                        : "bg-orange-50 text-[#FF5722] border border-orange-200"
                      : isDarkMode
                        ? "text-gray-300 hover:bg-[#1B1E26] hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  <span>All Financial Years</span>
                  {selectedFY === "ALL" && <Check className="w-[18px] h-[18px] text-[#FF5722] stroke-[2] shrink-0" />}
                </button>
              </div>
            )}
          </div>

          {/* Marketplace Button */}
          <Link
            href="/pages/marketplace"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold ${isDarkMode
                ? "text-white bg-[#1B1E26] hover:bg-[#252A36] border-white/[0.08]"
                : "text-gray-800 bg-gray-100 hover:bg-gray-200 border-gray-200"
              } border hover:border-[#FF5722]/50 rounded-xl transition-all shadow-sm cursor-pointer`}
            title="Go to Marketplace"
          >
            <Store className="w-[18px] h-[18px] text-[#FF5722] stroke-[2] shrink-0" />
            <span className="hidden sm:inline">Marketplace</span>
          </Link>

          {/* Dual Theme Switch: Sun / Moon */}
          <div
            className={`flex items-center ${isDarkMode ? "bg-[#1B1E26] border-white/[0.08]" : "bg-gray-100 border-gray-200"
              } border rounded-xl p-0.5 gap-0.5 shadow-sm`}
          >
            <button
              type="button"
              onClick={() => toggleTheme(false)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isDarkMode
                  ? "bg-[#FF5722] text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-white"
                }`}
              title="Light Mode"
            >
              <Sun className="w-[18px] h-[18px] stroke-[2]" />
            </button>
            <button
              type="button"
              onClick={() => toggleTheme(true)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${isDarkMode
                  ? "bg-[#FF5722] text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-white"
                }`}
              title="Dark Mode"
            >
              <Moon className="w-[18px] h-[18px] stroke-[2]" />
            </button>
          </div>

          {/* Get Premium Orange Button */}
          <Link
            href="/pages/subscription"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#E63900] hover:from-[#FF7043] hover:to-[#FF5722] text-white text-xs font-bold shadow-[0_4px_15px_rgba(255,87,34,0.35)] active:scale-95 transition-all cursor-pointer"
            title="Upgrade to Premium"
          >
            <Crown className="w-[18px] h-[18px] fill-white stroke-[2] shrink-0" />
            <span>Get Premium</span>
          </Link>

          {/* User Profile Avatar or Login/SignUp */}
          {!userLoading && !isLoggedIn ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => router.push("/pages/login")}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${isDarkMode
                    ? "text-white bg-[#1B1E26] hover:bg-[#252A36] border-white/[0.08]"
                    : "text-gray-800 bg-gray-100 hover:bg-gray-200 border-gray-200"
                  }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => router.push("/pages/register")}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#FF5722] to-[#E63900] text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="relative">
              <div
                onClick={handleProfileClick}
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5722] to-[#FFA040] text-white text-xs font-black flex items-center justify-center border-2 border-[#FF5722]/40 shadow-md cursor-pointer hover:scale-105 transition-transform overflow-hidden shrink-0"
                title={`Profile: ${displayUserName}`}
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={displayUserName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  displayUserName.charAt(0).toUpperCase() || "A"
                )}
              </div>

              {/* Anchored Profile Dropdown Menu */}
              <ProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </div>
      </header>

      {/* Mobile Drawer Navigation Sidebar */}
      <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}
