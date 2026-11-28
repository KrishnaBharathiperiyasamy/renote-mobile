import axios from "axios";
import { API_ENDPOINTS, AUTH_APP_CODE, DATA_API_BASE_URL } from "@constants/api";

/**
 * Auth-related storage keys. Centralized so login/refresh/logout all
 * touch the same set of keys.
 */
export const TOKEN_KEYS = {
  ACCESS: "token",
  REFRESH: "refreshToken",
} as const;

const SESSION_KEYS = [
  TOKEN_KEYS.ACCESS,
  TOKEN_KEYS.REFRESH,
  "authId",
  "user_id",
  "firstName",
  "lastName",
  "phoneNumber",
  "email",
  "role",
  "spa_logged_in",
  "spa_active_nav",
  "vendor_companies",
  "customer_companies",
  "guestInvoices",
  "local_quotations",
  "guest_posters",
];

// Helper functions for cookie management without external types dependency
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === "undefined") return;
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {}
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
};

const removeCookie = (name: string) => {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  } catch {}
};

/** Safely decode JWT token payload without throwing */
export function parseJwt(token: string | null): Record<string, any> | null {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check whether a JWT token is expired or about to expire within bufferSeconds.
 * If token is null, invalid, or unparseable, it is considered expired (true).
 */
export function isTokenExpired(token: string | null, bufferSeconds = 30): boolean {
  if (!token || typeof token !== "string") return true;
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return Date.now() >= (payload.exp - bufferSeconds) * 1000;
}

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem(TOKEN_KEYS.ACCESS);
  if (token === "undefined" || token === "null" || token === "") token = null;
  if (!token) {
    token = getCookie(TOKEN_KEYS.ACCESS);
    if (token === "undefined" || token === "null" || token === "") token = null;
    if (token) {
      localStorage.setItem(TOKEN_KEYS.ACCESS, token);
    }
  }
  return token;
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem(TOKEN_KEYS.REFRESH);
  if (token === "undefined" || token === "null" || token === "") token = null;
  if (!token) {
    token = getCookie(TOKEN_KEYS.REFRESH);
    if (token === "undefined" || token === "null" || token === "") token = null;
    if (token) {
      localStorage.setItem(TOKEN_KEYS.REFRESH, token);
    }
  }
  return token;
};

export const setTokens = (accessToken: string, refreshToken?: string) => {
  if (typeof window === "undefined") return;
  if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    setCookie(TOKEN_KEYS.ACCESS, accessToken, 7);
  }

  if (refreshToken && refreshToken !== "undefined" && refreshToken !== "null") {
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
    setCookie(TOKEN_KEYS.REFRESH, refreshToken, 30);
  }
};

/** Clears auth/session keys in localStorage and cookies — leaves unrelated app state intact. */
export const clearTokens = () => {
  if (typeof window === "undefined") return;
  SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  removeCookie(TOKEN_KEYS.ACCESS);
  removeCookie(TOKEN_KEYS.REFRESH);
  try {
    window.dispatchEvent(new Event("session-cleared"));
    window.dispatchEvent(new Event("authchange"));
  } catch {}
};

/**
 * Hard-redirects to the login page. Skips when already there to avoid loops.
 */
export const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path.startsWith("/login") || path.startsWith("/pages/login")) return;
  window.location.href = "/pages/login";
};

/** Result of a refresh attempt. */
export type RefreshResult =
  | { ok: true; accessToken: string }
  | { ok: false; permanent: boolean };

// Single-flight: concurrent callers within the same tab share one in-flight refresh.
let refreshPromise: Promise<RefreshResult> | null = null;

/**
 * Calls refresh-token endpoint, persists new tokens, and reports the outcome.
 *
 * - Deduplicates concurrent calls in the same tab.
 * - Coordinates across tabs via Web Locks API (navigator.locks) to prevent duplicate refresh rotations.
 * - Detects cross-tab refreshes (uses newly refreshed token if another tab just updated it).
 * - Synchronizes across localStorage and Cookies.
 * - Dispatches 'session-refreshed' and 'authchange' events on success.
 */
export const refreshAccessToken = (failedToken?: string | null): Promise<RefreshResult> => {
  if (refreshPromise) return refreshPromise;

  const currentToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.resolve({ ok: false, permanent: true });
  }

  // Cross-tab check: Did another tab already refresh the token recently?
  if (failedToken && currentToken && currentToken !== failedToken && !isTokenExpired(currentToken, 10)) {
    return Promise.resolve({ ok: true, accessToken: currentToken });
  }

  const executeRefresh = async (): Promise<RefreshResult> => {
    // Re-check after acquiring cross-tab lock: Did another tab finish refreshing while we waited?
    const freshToken = getAccessToken();
    if (freshToken && freshToken !== currentToken && !isTokenExpired(freshToken, 10)) {
      return { ok: true, accessToken: freshToken };
    }

    try {
      // Primary: Auth service refresh endpoint
      let res;
      try {
        res = await axios.post(
          API_ENDPOINTS.AUTH.REFRESH_TOKEN,
          { refreshToken, appCode: AUTH_APP_CODE },
          { timeout: 12000 }
        );
      } catch (authErr: any) {
        // Fallback to backend refresh endpoint if auth-service is unreachable or returns 404/5xx
        const status = authErr.response?.status;
        const isNetworkOrServerErr = !status || status >= 500 || status === 404;
        if (isNetworkOrServerErr) {
          const backendRefreshUrl = `${DATA_API_BASE_URL}/api/users/refresh-token`;
          res = await axios.post(
            backendRefreshUrl,
            { refreshToken, appCode: AUTH_APP_CODE },
            { timeout: 12000 }
          );
        } else {
          throw authErr;
        }
      }

      const accessToken: string | undefined = res?.data?.data?.accessToken || res?.data?.accessToken;
      const newRefreshToken: string | undefined = res?.data?.data?.refreshToken || res?.data?.refreshToken;

      if (!accessToken) {
        return { ok: false, permanent: true };
      }

      setTokens(accessToken, newRefreshToken || refreshToken);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("session-refreshed", { detail: { accessToken } }));
        window.dispatchEvent(new Event("authchange"));
      }

      return { ok: true, accessToken };
    } catch (err: any) {
      // Cross-tab recovery: Check if another tab refreshed the token while this tab was waiting!
      const latestToken = getAccessToken();
      if (latestToken && latestToken !== currentToken && !isTokenExpired(latestToken, 10)) {
        return { ok: true, accessToken: latestToken };
      }

      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const permanent = status === 400 || status === 401 || status === 403;
      return { ok: false, permanent };
    }
  };

  refreshPromise = (async (): Promise<RefreshResult> => {
    try {
      if (typeof navigator !== "undefined" && (navigator as any).locks?.request) {
        return await (navigator as any).locks.request("renote_token_refresh", executeRefresh);
      }
      return await executeRefresh();
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
