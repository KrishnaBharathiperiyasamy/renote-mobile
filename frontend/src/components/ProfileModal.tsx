"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronRight, ShieldCheck } from "lucide-react";
import { useUser } from "@context/UserContext";
import { safeToastSuccess } from "@utilis/toastHelper";

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats?: {
    listings?: number;
    sold?: number;
    saved?: number;
  };
  onNavigateNav?: (navKey: string) => void;
  onLogout?: () => void;
  isDarkMode?: boolean;
  activeNav?: string;
  className?: string;
}

export default function ProfileModal({
  isOpen,
  onClose,
  onLogout,
  isDarkMode: propDarkMode,
  className = "",
}: ProfileModalProps) {
  const router = useRouter();
  const { profileImageUrl, fullName, logout: contextLogout } = useUser();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Sync theme
  const [internalDark, setInternalDark] = useState<boolean>(() => {
    if (propDarkMode !== undefined) return propDarkMode;
    if (typeof window !== "undefined") {
      const saved =
        localStorage.getItem("spa_theme") ||
        localStorage.getItem("poster_theme") ||
        localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  useEffect(() => {
    if (propDarkMode !== undefined) {
      setInternalDark(propDarkMode);
    }
  }, [propDarkMode]);

  useEffect(() => {
    const handleThemeSync = () => {
      const saved =
        localStorage.getItem("spa_theme") ||
        localStorage.getItem("poster_theme") ||
        localStorage.getItem("theme");
      if (saved) {
        setInternalDark(saved === "dark");
      } else if (typeof document !== "undefined") {
        setInternalDark(document.documentElement.classList.contains("dark"));
      }
    };
    handleThemeSync();
    window.addEventListener("themechange", handleThemeSync);
    window.addEventListener("storage", handleThemeSync);
    return () => {
      window.removeEventListener("themechange", handleThemeSync);
      window.removeEventListener("storage", handleThemeSync);
    };
  }, []);

  const isDarkMode = propDarkMode !== undefined ? propDarkMode : internalDark;

  // Resolve user profile attributes
  const [userData, setUserData] = useState({
    displayName: "User",
    initial: "U",
    contactInfo: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    setImageLoadError(false);
    const firstName = typeof window !== "undefined" ? localStorage.getItem("firstName") || "" : "";
    const lastName = typeof window !== "undefined" ? localStorage.getItem("lastName") || "" : "";
    const phone = typeof window !== "undefined" ? localStorage.getItem("phoneNumber") || "" : "";
    const email = typeof window !== "undefined" ? localStorage.getItem("email") || "" : "";

    const resolvedName =
      fullName ||
      [firstName, lastName].filter(Boolean).join(" ").trim() ||
      firstName ||
      "User";

    const contactStr = email || (phone ? `+91 ${phone.replace(/^(\+91|0)/, "").trim()}` : "Verified Member");

    setUserData({
      displayName: resolvedName,
      initial: resolvedName.charAt(0).toUpperCase() || "U",
      contactInfo: contactStr,
    });
  }, [isOpen, fullName]);

  // Handle outside click dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Handle Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Actions
  const handleEditProfile = () => {
    onClose();
    router.push("/pages/Settings");
  };

  const handleLogoutAction = () => {
    onClose();
    if (onLogout) {
      onLogout();
    } else {
      contextLogout();
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      safeToastSuccess("Logged out successfully");
      router.push("/pages/login");
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`absolute right-0 top-full mt-2.5 z-50 w-64 sm:w-72 rounded-2xl p-2 shadow-2xl border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 select-none ${
        isDarkMode
          ? "bg-[#16181E] border-white/[0.1] text-white shadow-black/80"
          : "bg-white border-gray-200 text-gray-900 shadow-xl"
      } ${className}`}
      role="menu"
      aria-label="User Profile Dropdown"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Compact Profile Information Section ── */}
      <div
        className={`p-2.5 rounded-xl flex items-center gap-3 border ${
          isDarkMode
            ? "bg-white/[0.03] border-white/[0.06]"
            : "bg-gray-50 border-gray-100"
        }`}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF5722] to-[#FFA040] text-white font-black flex items-center justify-center border border-[#FF5722]/40 shadow-sm shrink-0 overflow-hidden text-sm">
          {profileImageUrl && !imageLoadError ? (
            <img
              src={profileImageUrl}
              alt={userData.displayName}
              className="w-full h-full object-cover"
              onError={() => setImageLoadError(true)}
            />
          ) : (
            userData.initial
          )}
        </div>

        {/* User Details */}
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold truncate leading-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {userData.displayName}
          </p>
          <p className={`text-xs truncate mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {userData.contactInfo}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-[#FF5722]">
            <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
            <span>Verified Account</span>
          </div>
        </div>
      </div>

      {/* ── Subtle Separator ── */}
      <div className={`border-t ${isDarkMode ? "border-white/[0.08]" : "border-gray-100"} my-1.5`} />

      {/* ── Menu Options: Edit Profile & Logout ── */}
      <div className="flex flex-col gap-0.5">
        {/* 1. Edit Profile */}
        <button
          type="button"
          onClick={handleEditProfile}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
            isDarkMode
              ? "text-gray-200 hover:text-white hover:bg-white/[0.06]"
              : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          }`}
          role="menuitem"
        >
          <User className="w-4 h-4 text-[#FF5722] stroke-[2] shrink-0" />
          <span>Edit Profile</span>
          <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 2. Logout */}
        <button
          type="button"
          onClick={handleLogoutAction}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
            isDarkMode
              ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
              : "text-red-600 hover:text-red-700 hover:bg-red-50"
          }`}
          role="menuitem"
        >
          <LogOut className="w-4 h-4 text-red-500 stroke-[2] shrink-0" />
          <span>Logout</span>
          <ChevronRight className="w-3.5 h-3.5 ml-auto text-red-400 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>
    </div>
  );
}
