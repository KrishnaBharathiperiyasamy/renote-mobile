import { toast } from "react-toastify";
import { clearTokens, redirectToLogin } from "./tokenManager";

/**
 * Handles error toasts for API failures.
 *
 * NOTE: Redirects + localStorage.clear() for auth failures (401 / 403 /
 * "User Account not found") are handled centrally by the axios response
 * interceptor in apiClient.ts. This helper only owns user-facing messaging.
 *
 * Returns `true` when the error was an auth failure (caller can stop further
 * handling), `false` otherwise.
 */
export function handleAuthErrorAndToast(err: any, fallbackMsg: string) {
  const status = err?.response?.status;
  const message: string | undefined = err?.response?.data?.message;

  // 🔹 Account deleted / not found
  if (status === 404 && message === "User Account not found") {
    clearTokens();
    redirectToLogin();
    toast.info("User account was deleted. Please create a new one.", {
      toastId: "userDeleted",
      autoClose: 8000,
    });
    return true;
  }

  // 🔹 Auth failures that still reached caller.
  if (status === 401 || status === 403) {
    return true;
  }

  // 🔹 Generic error - log silently without displaying annoying popup
  console.warn("API request failed:", message || fallbackMsg);
  return false;
}
