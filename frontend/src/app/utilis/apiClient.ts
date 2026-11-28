import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  redirectToLogin,
  refreshAccessToken,
} from "./tokenManager";

type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean; _skipCache?: boolean };

interface CacheEntry {
  timestamp: number;
  data: any;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

const apiGetCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 10000; // 10 seconds

export const clearApiCache = () => {
  apiGetCache.clear();
  inFlightRequests.clear();
};

const buildCacheKey = (config: AxiosRequestConfig): string => {
  const method = (config.method || "get").toLowerCase();
  const url = config.url || "";
  const params = config.params ? JSON.stringify(config.params) : "";
  const auth = config.headers?.Authorization ? String(config.headers.Authorization).slice(-10) : "";
  return `${method}:${url}:${params}:${auth}`;
};

const isAccountDeleted = (status?: number, message?: string) =>
  status === 404 &&
  typeof message === "string" &&
  message.toLowerCase().includes("user account not found");

const forceLogout = () => {
  clearTokens();
  redirectToLogin();
};

let isServerMaintenance = false;

export const setServerMaintenance = (state: boolean) => {
  isServerMaintenance = state;
};

export const getServerMaintenance = () => isServerMaintenance;

const attachAuthInterceptors = (client: AxiosInstance) => {
  // --- Request: attach Bearer token and check GET cache ---
  client.interceptors.request.use(async (config) => {
    if (isServerMaintenance) {
      return Promise.reject(new axios.Cancel("Server under maintenance: API calls stopped"));
    }

    const method = (config.method || "get").toLowerCase();

    // Invalidate GET cache on mutations
    if (method !== "get") {
      clearApiCache();
    }

    let token = getAccessToken();
    const reqUrl = config?.url || "";
    const isAuthRoute =
      reqUrl.includes("/login") ||
      reqUrl.includes("/register") ||
      reqUrl.includes("/forgot-password") ||
      reqUrl.includes("/reset-password") ||
      reqUrl.includes("/otp");

    if (!isAuthRoute) {
      // Proactive refresh: if token is missing or expiring within 15s, refresh before sending
      if ((!token || isTokenExpired(token, 15)) && getRefreshToken()) {
        try {
          const refreshRes = await refreshAccessToken(token);
          if (refreshRes.ok) {
            token = refreshRes.accessToken;
          }
        } catch {}
      }

      if (token) {
        config.headers = config.headers ?? {};
        if (typeof (config.headers as any).set === "function") {
          (config.headers as any).set("Authorization", `Bearer ${token}`);
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }

    // Check GET cache for idempotent read queries
    if (method === "get" && !(config as RetriableRequestConfig)._skipCache) {
      const cacheKey = buildCacheKey(config);
      const cached = apiGetCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        config.adapter = () =>
          Promise.resolve({
            data: cached.data,
            status: cached.status,
            statusText: cached.statusText,
            headers: cached.headers,
            config,
            request: {},
          });
        return config;
      }
    }

    return config;
  });

  // --- Response: handle caching + account-deleted + 401 refresh-and-retry ---
  client.interceptors.response.use(
    (response) => {
      const method = (response.config.method || "get").toLowerCase();
      if (method === "get" && !(response.config as RetriableRequestConfig)._skipCache) {
        const cacheKey = buildCacheKey(response.config);
        apiGetCache.set(cacheKey, {
          timestamp: Date.now(),
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: response.config,
        });
      }
      return response;
    },
    async (error) => {
      const status: number | undefined = error?.response?.status;
      const message: string | undefined = error?.response?.data?.message;
      const originalRequest = error?.config as RetriableRequestConfig | undefined;

      // Account deleted server-side → force logout immediately.
      if (isAccountDeleted(status, message)) {
        forceLogout();
        return Promise.reject(error);
      }

      const reqUrl = originalRequest?.url || "";
      const isAuthRoute =
        reqUrl.includes("/login") ||
        reqUrl.includes("/register") ||
        reqUrl.includes("/forgot-password") ||
        reqUrl.includes("/reset-password") ||
        reqUrl.includes("/otp");

      // Access token rejected (401) → try one refresh then replay (never for login/auth endpoints).
      if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
        originalRequest._retry = true;

        const failedToken = getAccessToken();
        const result = await refreshAccessToken(failedToken);
        if (result.ok) {
          originalRequest.headers = originalRequest.headers ?? {};
          if (typeof (originalRequest.headers as any).set === "function") {
            (originalRequest.headers as any).set("Authorization", `Bearer ${result.accessToken}`);
          } else {
            (originalRequest.headers as Record<string, string>).Authorization =
              `Bearer ${result.accessToken}`;
          }
          return client(originalRequest);
        }

        // Refresh failed permanently → end the session.
        if (result.permanent) forceLogout();
        return Promise.reject(error);
      }

      // Transparent fallback: if direct cross-origin request to backend port 6003 failed with Network Error,
      // fallback to the Next.js same-origin rewrite proxy (/api/...)
      if (
        !status &&
        originalRequest &&
        !(originalRequest as any)._networkRetried &&
        typeof window !== "undefined" &&
        reqUrl.includes(":6003/api/")
      ) {
        (originalRequest as any)._networkRetried = true;
        const relativeUrl = reqUrl.replace(/^https?:\/\/[^\/]+:6003/, "");
        originalRequest.url = relativeUrl;
        return client(originalRequest);
      }

      return Promise.reject(error);
    },
  );
};

const apiClient = axios.create();
attachAuthInterceptors(apiClient);

if (typeof window !== "undefined") {
  window.addEventListener("session-cleared", clearApiCache);
  window.addEventListener("authchange", clearApiCache);
}

/**
 * Public axios instance — no auth interceptors.
 * Use for shared/public endpoints so session tokens don't accidentally
 * trigger auth middleware on the server.
 */
export const publicApiClient = axios.create();
publicApiClient.interceptors.request.use((config) => {
  if (isServerMaintenance) {
    return Promise.reject(new axios.Cancel("Server under maintenance: API calls stopped"));
  }
  return config;
});
publicApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;
    const reqUrl = originalRequest?.url || "";
    if (
      !status &&
      originalRequest &&
      !originalRequest._networkRetried &&
      typeof window !== "undefined" &&
      reqUrl.includes(":6003/api/")
    ) {
      originalRequest._networkRetried = true;
      originalRequest.url = reqUrl.replace(/^https?:\/\/[^\/]+:6003/, "");
      return publicApiClient(originalRequest);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
