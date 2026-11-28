"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@constants/api";
import apiClient from "@utilis/apiClient";

export default function ConsentVerifyPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Processing verification...");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const getParamsFromLocation = () => {
      const queryParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);

      const readParam = (key: string) => queryParams.get(key) || hashParams.get(key) || "";

      return {
        code: readParam("code"),
        state: readParam("state"),
        status: readParam("status"),
        referenceId: readParam("referenceId") || readParam("refId"),
        companyId: readParam("companyId"),
        panNo: readParam("panNo"),
      };
    };

    const payload = getParamsFromLocation();

    if (!payload.state && !payload.code && !payload.referenceId && !payload.companyId) {
      setStatus("error");
      setMessage("Verification was not completed. Redirecting back...");
      setTimeout(() => router.replace("/pages/Settings?tab=company"), 2000);
      return;
    }

    const run = async () => {
      try {
        await apiClient.post(API_ENDPOINTS.COMPANIES.PAN_VERIFY_CALLBACK, payload);
        setStatus("success");
        setMessage("PAN verification updated successfully. Redirecting to Company Settings...");
        setTimeout(() => {
          router.replace("/pages/Settings?tab=company");
        }, 1400);
      } catch (error: any) {
        setStatus("error");
        setMessage(error?.response?.data?.message || "Unable to complete PAN verification. Redirecting...");
        setTimeout(() => {
          router.replace("/pages/Settings?tab=company");
        }, 1800);
      }
    };

    run();
  }, [router]);

  const title =
    status === "loading" ? "Verifying PAN..." :
    status === "success" ? "Verification Complete" :
    "Verification Failed";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0D0E12] text-gray-900 dark:text-[#E0E2EC] transition-colors px-4">
      <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] p-6 text-center shadow-lg">
        <h1 className={`text-xl font-bold ${status === "error" ? "text-red-500" : status === "success" ? "text-emerald-500" : "text-gray-800 dark:text-gray-100"}`}>
          {title}
        </h1>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
}
