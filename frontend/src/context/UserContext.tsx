"use client";

import {
  API_ENDPOINTS,
  AUTH_APP_CODE,
  DATA_API_BASE_URL,
} from "@constants/api";
import axios from "axios";
import apiClient from "@utilis/apiClient";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { UserContextType } from "@app-types/userContext";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  parseJwt,
  refreshAccessToken,
} from "@utilis/tokenManager";

const UserContext = createContext<UserContextType>({
  profileImageUrl: null,
  setProfileImageUrl: () => {},
  fullName: "",
  setFullName: () => {},
  refreshUser: () => {},
  isLoggedIn: false,
  userLoading: true,
  logout: () => {},
  notificationCount: 0,
  fetchNotificationCount: () => {},
  setNotificationCount: () => {},
});

export const useUser = () => useContext(UserContext);

/** Convert an auth-service image URL into the Next.js proxy path. */
export const resolveAuthImageUrl = (rawUrl?: string | null): string | null => {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) return rawUrl;

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.port === "3004" || parsed.pathname.startsWith("/auth-proxy")) {
        const cleanedPath = parsed.pathname.replace(/^\/+/, "").replace(/^auth-proxy\//, "");
        return `/auth-proxy/${cleanedPath}`;
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  }

  const cleaned = rawUrl.replace(/\\/g, "/").replace(/^\/+/, "");
  if (cleaned.startsWith("auth-proxy/")) return `/${cleaned}`;
  return `/auth-proxy/${cleaned}`;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [profileImageUrl, setProfileImageUrlState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("profileImageUrl");
    return stored ? resolveAuthImageUrl(stored) : null;
  });

  const setProfileImageUrl = useCallback((url: string | null) => {
    const resolved = resolveAuthImageUrl(url);
    setProfileImageUrlState(resolved);
    if (resolved) {
      localStorage.setItem("profileImageUrl", resolved);
    } else {
      localStorage.removeItem("profileImageUrl");
    }
  }, []);
  const [fullName, setFullName] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  // Synchronous client-mount cache restoration to prevent initial render flicker
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = getAccessToken();
      const hasSession = !!token || localStorage.getItem("spa_logged_in") === "true";
      const savedName = [localStorage.getItem("firstName"), localStorage.getItem("lastName")]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (hasSession) {
        setIsLoggedIn(true);
        if (savedName) setFullName(savedName);
      }
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    if (typeof window === "undefined") return;

    let token = getAccessToken();
    let authId = localStorage.getItem("authId");

    setUserLoading(true);

    // If token exists, extract authId from JWT payload if missing in localStorage
    if (token && !authId) {
      const payload = parseJwt(token);
      const extractedAuthId = payload?.authId || payload?.sub || payload?.id || payload?.userId;
      if (extractedAuthId) {
        authId = String(extractedAuthId);
        localStorage.setItem("authId", authId);
      }
    }

    // No session in storage → user is logged out.
    if (!token && !getRefreshToken()) {
      clearTokens();
      setIsLoggedIn(false);
      setFullName("");
      setProfileImageUrl(null);
      setUserLoading(false);
      return;
    }

    // Proactive refresh on page load if access token is missing or expired, but refresh token exists
    if ((!token || isTokenExpired(token, 10)) && getRefreshToken()) {
      const refreshResult = await refreshAccessToken(token);
      if (refreshResult.ok) {
        token = refreshResult.accessToken;
      } else if (refreshResult.permanent) {
        clearTokens();
        setIsLoggedIn(false);
        setFullName("");
        setProfileImageUrl(null);
        setUserLoading(false);
        return;
      }
    }

    try {
      let user: any = null;

      // Try Auth Service /users/me first
      try {
        const { data } = await apiClient.get(API_ENDPOINTS.AUTH.GET_ME, {
          headers: { "app-code": AUTH_APP_CODE },
        });
        user = data?.data?.user || data?.user;
      } catch (authErr) {
        const status = axios.isAxiosError(authErr) ? authErr.response?.status : undefined;
        // If 401/403, pass through so it can refresh or confirm permanent auth error
        if (status === 401 || status === 403) throw authErr;

        // Fallback to backend /api/users/me if auth-service is unavailable
        try {
          const { data } = await apiClient.get(API_ENDPOINTS.USERS.GET_CURRENT_USER);
          user = data?.user || data?.data?.user;
        } catch {
          throw authErr;
        }
      }

      const nameFromParts = [user?.firstName, user?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      const resolvedPic = resolveAuthImageUrl(
        user?.uploadedImage || user?.profilePic || user?.profileImageUrl || user?.profileImage || null
      );
      if (resolvedPic) {
        setProfileImageUrl(resolvedPic);
        localStorage.setItem("profileImageUrl", resolvedPic);
      }
      setFullName(nameFromParts || user?.fullName || "User");

      const resolvedAuthId = user?.authId || user?.id || user?._id || user?.sub || user?.userId;
      if (resolvedAuthId) localStorage.setItem("authId", String(resolvedAuthId));
      if (user?._id) localStorage.setItem("user_id", String(user._id));
      else if (user?.id) localStorage.setItem("user_id", String(user.id));
      if (user?.firstName) localStorage.setItem("firstName", user.firstName);
      if (user?.lastName) localStorage.setItem("lastName", user.lastName);
      if (user?.phone || user?.phoneNumber) {
        localStorage.setItem("phoneNumber", user.phone || user.phoneNumber);
      }
      if (user?.email) localStorage.setItem("email", user.email);
      localStorage.setItem("spa_logged_in", "true");

      setIsLoggedIn(true);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const hasRefreshToken = !!getRefreshToken();

      // Only end the session on confirmed permanent auth errors (401/403) when no refresh token is available
      if ((status === 401 || status === 403) && !hasRefreshToken) {
        clearTokens();
        setIsLoggedIn(false);
        setFullName("");
        setProfileImageUrl(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("authchange"));
        }
      } else {
        // Transient / offline auth-service errors keep the user connected if they have saved profile data
        const savedName = [localStorage.getItem("firstName"), localStorage.getItem("lastName")]
          .filter(Boolean)
          .join(" ")
          .trim();
        const savedAvatar = localStorage.getItem("profileImageUrl");
        if (savedAvatar) setProfileImageUrl(savedAvatar);

        if (savedName || localStorage.getItem("authId") || token) {
          setFullName(savedName || "User");
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setFullName("");
        }
      }
    } finally {
      setUserLoading(false);
    }
  }, [setProfileImageUrl]);

  const fetchNotificationCount = useCallback(async () => {
    if (typeof window === "undefined") return;

    const userId = localStorage.getItem("user_id");
    if (!userId || !getAccessToken()) return;

    try {
      const { data } = await apiClient.get(
        `${DATA_API_BASE_URL}/api/notifications/count/${userId}`,
      );
      setNotificationCount(data?.count ?? 0);
    } catch (err) {
      // Gracefully fall back to 0 without flooding console errors
      setNotificationCount(0);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (process.env.NODE_ENV === "development" && status && ![401, 403, 404, 500].includes(status)) {
        console.warn("Notifications count temporarily unavailable");
      }
    }
  }, []);

  useEffect(() => {
    setHasMounted(true);
    fetchUserData();
    fetchNotificationCount();
  }, [fetchUserData, fetchNotificationCount]);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await apiClient.post(`${DATA_API_BASE_URL}/api/users/logout`, { refreshToken }).catch(() => {});
      }
    } catch {}

    clearTokens();
    setIsLoggedIn(false);
    setProfileImageUrl(null);
    setFullName("");
    setNotificationCount(0);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("authchange"));
      const path = window.location.pathname;
      if (path !== "/" && path !== "/pages/marketplace" && path !== "/pages/home") {
        window.location.href = "/";
      }
    }
  }, [setProfileImageUrl]);

  // Automatic session expiry & background proactive refresh interval
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkSessionInterval = setInterval(async () => {
      const token = getAccessToken();
      const refreshToken = getRefreshToken();

      // If both tokens are missing but state still claims logged-in, sync logout
      if (!token && !refreshToken) {
        if (isLoggedIn) logout();
        return;
      }

      // If access token is missing or expiring within 60s, refresh if refresh token exists
      if ((!token || isTokenExpired(token, 60)) && refreshToken) {
        const res = await refreshAccessToken(token);
        if (!res.ok && res.permanent) {
          logout();
        }
      } else if (token && !refreshToken && isTokenExpired(token, 0)) {
        // Only log out if token has actually expired (not 60s early) when no refresh token exists
        logout();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkSessionInterval);
  }, [logout, isLoggedIn]);

  // Cross-tab session synchronization: sync immediately when other tabs log in or out
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageEvent = (e: StorageEvent) => {
      if (
        e.key === null ||
        e.key === "token" ||
        e.key === "refreshToken" ||
        e.key === "authId" ||
        e.key === "spa_logged_in"
      ) {
        const currentToken = getAccessToken();
        if (!currentToken && !getRefreshToken()) {
          setIsLoggedIn(false);
          setFullName("");
          setProfileImageUrl(null);
        } else {
          fetchUserData();
        }
      }
    };

    const handleAuthChange = () => {
      const currentToken = getAccessToken();
      if (!currentToken && !getRefreshToken()) {
        setIsLoggedIn(false);
        setFullName("");
        setProfileImageUrl(null);
      } else {
        fetchUserData();
      }
    };

    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener("authchange", handleAuthChange);
    window.addEventListener("session-cleared", handleAuthChange);
    window.addEventListener("session-refreshed", handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("authchange", handleAuthChange);
      window.removeEventListener("session-cleared", handleAuthChange);
      window.removeEventListener("session-refreshed", handleAuthChange);
    };
  }, [fetchUserData, setProfileImageUrl]);

  const contextValue = useMemo<UserContextType>(
    () => ({
      profileImageUrl,
      setProfileImageUrl,
      fullName,
      setFullName,
      refreshUser: fetchUserData,
      logout,
      isLoggedIn,
      userLoading,
      notificationCount,
      fetchNotificationCount,
      setNotificationCount,
    }),
    [
      profileImageUrl,
      setProfileImageUrl,
      fullName,
      setFullName,
      fetchUserData,
      logout,
      isLoggedIn,
      userLoading,
      notificationCount,
      fetchNotificationCount,
      setNotificationCount,
    ]
  );

  if (!hasMounted) return null;

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
