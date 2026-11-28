"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserProvider, useUser } from "@context/UserContext";
import { FinancialYearProvider } from "@context/FinancialYearContext";
import { DesktopSidebar } from "@components/Sidebar/page";
import { toast, ToastContainer } from "react-toastify";
import { setServerMaintenance } from "@utilis/apiClient";
import { AUTH_API_BASE_URL, isLocalhost } from "@constants/api";
import { getAccessToken } from "@utilis/tokenManager";

const NO_SIDEBAR_PREFIXES = [
  "/pages/login",
  "/pages/register",
  "/pages/forgotPassword",
  "/pages/consent",
  "/reset-email",
  "/preview",
  "/pages/view",
];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, userLoading } = useUser();

  const isPublicRoute = (path: string | null) => {
    if (!path || path === "/" || path === "") return true;
    const publicPrefixes = [
      "/pages/login",
      "/pages/register",
      "/pages/forgotPassword",
      "/pages/home",
      "/pages/marketplace",
      "/reset-email",
      "/preview",
      "/pages/view",
      "/pages/consent",
      "/pages/terms",
      "/pages/privacy",
      "/pages/contact",
      "/pages/about",
      "/pages/maintenance",
    ];
    return publicPrefixes.some((p) => path.startsWith(p));
  };

  useEffect(() => {
    if (userLoading) return;
    const hasToken = typeof window !== "undefined" && (!!getAccessToken() || !!localStorage.getItem("token"));
    const authed = isLoggedIn || hasToken;
    const isPublic = isPublicRoute(pathname);

    // 1. Unauthenticated access to protected route -> redirect to login
    if (!authed && !isPublic) {
      router.replace(`/pages/login?redirect=${encodeURIComponent(pathname || "")}`);
      return;
    }

    // 2. Already authenticated user navigating to login/register -> redirect to destination or /
    if (authed && (pathname === "/pages/login" || pathname === "/pages/register")) {
      const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const redirectTarget = searchParams.get("redirect") || "/";
      router.replace(redirectTarget.startsWith("/") ? redirectTarget : "/");
      return;
    }
  }, [isLoggedIn, userLoading, pathname, router]);

  const hasToken = typeof window !== "undefined" && (!!getAccessToken() || !!localStorage.getItem("token"));
  const authed = isLoggedIn || hasToken;
  if (!userLoading && !authed && !isPublicRoute(pathname)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0D0E12]">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

function AppLayout({
  children,
  isDarkMode,
}: {
  children: React.ReactNode;
  isDarkMode: boolean;
}) {
  const pathname = usePathname();
  const { isLoggedIn, userLoading } = useUser();
  const [hasToken, setHasToken] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !!getAccessToken() || !!localStorage.getItem("token");
    }
    return false;
  });

  useEffect(() => {
    const syncToken = () => {
      if (typeof window !== "undefined") {
        setHasToken(!!getAccessToken() || !!localStorage.getItem("token"));
      }
    };
    syncToken();
    window.addEventListener("storage", syncToken);
    window.addEventListener("authchange", syncToken);
    window.addEventListener("session-cleared", syncToken);
    window.addEventListener("session-refreshed", syncToken);
    return () => {
      window.removeEventListener("storage", syncToken);
      window.removeEventListener("authchange", syncToken);
      window.removeEventListener("session-cleared", syncToken);
      window.removeEventListener("session-refreshed", syncToken);
    };
  }, []);

  const isPrefixExcluded = NO_SIDEBAR_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );

  // Authenticated state: user is logged in via UserContext or has tokens in storage
  const isAuthenticated = isLoggedIn || (hasToken && (userLoading || isLoggedIn));

  // The menu bar should NOT be shown during login page, and should ONLY be shown after the user logged in
  const showSidebar = isAuthenticated && !isPrefixExcluded;

  if (!showSidebar) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <div
        className={`flex h-screen w-full overflow-hidden select-none ${
          isDarkMode ? "bg-[#0E1017] text-white" : "bg-[#F8F9FC] text-gray-900"
        } transition-colors duration-200 print:block print:h-auto print:overflow-visible print:bg-white`}
      >
        <div className="print:hidden shrink-0">
          <DesktopSidebar isDarkMode={isDarkMode} />
        </div>
        <div
          className={`flex-1 h-full ${
            pathname?.toLowerCase().startsWith("/pages/createposter")
              ? "overflow-hidden"
              : "overflow-y-auto"
          } overflow-x-hidden min-w-0 relative scroll-smooth custom-scrollbar print:h-auto print:overflow-visible print:w-full print:m-0 print:p-0`}
        >
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}

export default function UserProviderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isPortRunning, setIsPortRunning] = useState<boolean>(true);

  // Health check for Port 3004: automatically stops or starts the application
  useEffect(() => {
    let isMounted = true;

    const pingPort3004 = async (): Promise<boolean> => {
      const tryPing = async (url: string) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        try {
          await fetch(url, {
            method: "GET",
            mode: "no-cors",
            cache: "no-store",
            signal: controller.signal,
          });
          clearTimeout(timeout);
          return true;
        } catch {
          clearTimeout(timeout);
          return false;
        }
      };

      const ok = (await tryPing(`${AUTH_API_BASE_URL}/docs?_chk=${Date.now()}`)) ||
                 (await tryPing(`${AUTH_API_BASE_URL}/auth/login?_chk=${Date.now()}`)) ||
                 (await tryPing(`${AUTH_API_BASE_URL}/?_chk=${Date.now()}`));
      if (ok) return true;
      if (isLocalhost) {
        return (await tryPing(`http://localhost:3004/docs?_chk=${Date.now()}`)) ||
               (await tryPing(`http://localhost:3004/auth/login?_chk=${Date.now()}`)) ||
               (await tryPing(`http://localhost:3004/?_chk=${Date.now()}`));
      }
      return false;
    };

    let failCount = 0;
    const runHealthCheck = async () => {
      const isUp = await pingPort3004();
      if (!isMounted) return;
      if (isUp) {
        failCount = 0;
        setServerMaintenance(false);
        setIsPortRunning((prev) => (prev ? prev : true));
      } else {
        failCount++;
        if (failCount >= 3) {
          setServerMaintenance(true);
          setIsPortRunning(false);
        }
      }
    };

    runHealthCheck();
    const interval = setInterval(runHealthCheck, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Dismiss any active toast notifications whenever navigating from one page/route to another
  useEffect(() => {
    toast.dismiss();
  }, [pathname]);

  useEffect(() => {
    const handleThemeSync = () => {
      const saved = localStorage.getItem("spa_theme") || localStorage.getItem("poster_theme") || localStorage.getItem("theme");
      const dark = saved ? saved === "dark" : document.documentElement.classList.contains("dark");
      setIsDarkMode(dark);
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

  // If Port 3004 is stopped or unreachable, stop the application and display maintenance screen
  if (isPortRunning === false) {
    return (
      <div className="fixed inset-0 z-[9999999] bg-black flex items-center justify-center p-4 select-none">
        <h1 className="text-white text-xl sm:text-2xl font-normal tracking-wide">
          server under maintenance
        </h1>
      </div>
    );
  }

  return (
    <UserProvider>
      <FinancialYearProvider>
        <AppLayout isDarkMode={isDarkMode}>{children}</AppLayout>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme={isDarkMode ? "dark" : "light"}
        />
      </FinancialYearProvider>
    </UserProvider>
  );
}


