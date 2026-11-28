'use client';

import React, { useState, useEffect, useRef } from "react";
import {
    X,
    ExternalLink,
    Copy,
    Check,
    Globe,
    AlertCircle,
    Crown,
    Sparkles,
} from "lucide-react";
import Modal from "@components/Modal";
import { OrangeSpinner } from "@components/Button";
import apiClient, { clearApiCache } from "@utilis/apiClient";
import { API_ENDPOINTS, FRONT_END_URL, shortUrl, viewUrl } from "@constants/api";
import { safeToastSuccess, safeToastError } from "@utilis/toastHelper";

export interface CustomShortUrlModalProps {
    isOpen: boolean;
    onClose: () => void;
    poster?: any;
    posterIds?: string[];
    onSuccess?: (result: any) => void;
}

const RESERVED_SLUGS = new Set([
    "api", "admin", "auth", "login", "register", "pages", "view", "marketplace",
    "subscription", "settings", "terms", "privacy", "about", "contact", "home",
    "s", "p", "qr", "short", "invoice", "quotation", "poster", "posters", "create"
]);

export default function CustomShortUrlModal({
    isOpen,
    onClose,
    poster,
    posterIds,
    onSuccess,
}: CustomShortUrlModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [planLimitInfo, setPlanLimitInfo] = useState<{ limit: number; planName: string; message: string } | null>(null);
    const [activeToken, setActiveToken] = useState<string | null>(null);
    const [slugInput, setSlugInput] = useState("");
    const [savedSlug, setSavedSlug] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("poster_theme") || localStorage.getItem("spa_theme");
            if (saved) return saved === "dark";
            return document.documentElement.classList.contains("dark");
        }
        return true;
    });

    const activeSessionRef = useRef<string | null>(null);

    useEffect(() => {
        const handleThemeSync = () => {
            const saved = localStorage.getItem("poster_theme") || localStorage.getItem("spa_theme");
            if (saved) setIsDarkMode(saved === "dark");
            else setIsDarkMode(document.documentElement.classList.contains("dark"));
        };
        window.addEventListener("themechange", handleThemeSync);
        window.addEventListener("storage", handleThemeSync);
        return () => {
            window.removeEventListener("themechange", handleThemeSync);
            window.removeEventListener("storage", handleThemeSync);
        };
    }, []);

    const resolvedTitle =
        poster?.poster_title ||
        poster?.poster_name ||
        poster?.product_name ||
        "Poster";

    const posterKey = React.useMemo(() => {
        if (posterIds && posterIds.length > 0) return posterIds.map(String).sort().join(",");
        if (poster?._id) return String(poster._id);
        return "";
    }, [posterIds, poster?._id]);

    // Validate slug as user types
    const validateSlug = (raw: string) => {
        const clean = raw.trim().toLowerCase();
        if (!clean) {
            setValidationError(null);
            return;
        }
        if (clean.length < 3) {
            setValidationError("Slug must be at least 3 characters");
            return;
        }
        if (clean.length > 40) {
            setValidationError("Slug cannot exceed 40 characters");
            return;
        }
        if (!/^[a-z0-9_-]+$/.test(clean)) {
            setValidationError("Only letters, numbers, hyphens, and underscores are allowed");
            return;
        }
        if (RESERVED_SLUGS.has(clean)) {
            setValidationError(`"${clean}" is a reserved system keyword`);
            return;
        }
        setValidationError(null);
    };

    // Initialize or fetch link when modal opens
    useEffect(() => {
        if (!isOpen) {
            activeSessionRef.current = null;
            setActiveToken(null);
            setSlugInput("");
            setSavedSlug(null);
            setErrorMsg(null);
            setPlanLimitInfo(null);
            setValidationError(null);
            setLoading(false);
            return;
        }

        const sessionKey = `${posterKey}_shorturl`;
        if (activeSessionRef.current === sessionKey) return;
        activeSessionRef.current = sessionKey;

        initLink();
    }, [isOpen, posterKey]);

    const initLink = async () => {
        setLoading(true);
        setErrorMsg(null);
        setPlanLimitInfo(null);

        // Check if single poster already has token
        const existingToken = poster?.token || poster?.shareableLinkToken;
        if (existingToken) {
            setActiveToken(existingToken);
            if (poster?.customSlug) {
                setSavedSlug(poster.customSlug);
                setSlugInput(poster.customSlug);
            } else {
                // Generate a default slug recommendation based on title
                const defaultSlug = (resolvedTitle || "poster")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")
                    .slice(0, 30);
                setSlugInput(defaultSlug);
            }
            setLoading(false);
            return;
        }

        // Generate / retrieve active link from backend
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const userId = typeof window !== "undefined"
                ? localStorage.getItem("user_id") || localStorage.getItem("authId")
                : null;

            let targetIds: string[] = [];
            if (posterIds && posterIds.length > 0) {
                targetIds = posterIds.map(String);
            } else if (poster?._id) {
                targetIds = [String(poster._id)];
            }

            if (targetIds.length === 0) {
                setErrorMsg("No poster selected to create short URL");
                setLoading(false);
                return;
            }

            const res = await apiClient.post(API_ENDPOINTS.SHARABLE_LINKS.SHARE, {
                posterIds: targetIds,
                force: false,
                userId,
            });

            const data = res.data;
            if (data?.token) {
                setActiveToken(data.token);
                if (data.customSlug) {
                    setSavedSlug(data.customSlug);
                    setSlugInput(data.customSlug);
                } else {
                    const defaultSlug = (resolvedTitle || "poster")
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "")
                        .slice(0, 30);
                    setSlugInput(defaultSlug);
                }
            } else {
                throw new Error("Failed to initialize shareable link");
            }
        } catch (err: any) {
            console.error("Error creating link for short URL:", err);
            const status = err?.response?.status;
            const data = err?.response?.data;
            const errMsg = data?.message || err?.message || "Failed to initialize shareable link";
            const isPlanLimit = status === 403 && (data?.code === "PLAN_LIMIT_REACHED" || String(errMsg).toLowerCase().includes("plan allows"));
            if (isPlanLimit) {
                setPlanLimitInfo({
                    limit: data?.limit || 1,
                    planName: data?.planName || "Free",
                    message: errMsg,
                });
            } else {
                setErrorMsg(errMsg);
            }
            safeToastError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSlug = async () => {
        if (!activeToken) {
            safeToastError("No active share link found");
            return;
        }
        const clean = slugInput.trim().toLowerCase();
        if (!clean) {
            safeToastError("Please enter a custom slug");
            return;
        }
        if (clean.length < 3 || clean.length > 40) {
            safeToastError("Slug must be between 3 and 40 characters");
            return;
        }
        if (!/^[a-z0-9_-]+$/.test(clean)) {
            safeToastError("Only letters, numbers, hyphens, and underscores are allowed");
            return;
        }
        if (RESERVED_SLUGS.has(clean)) {
            safeToastError(`"${clean}" is a reserved system keyword`);
            return;
        }

        try {
            setSaving(true);
            const userId = typeof window !== "undefined"
                ? localStorage.getItem("user_id") || localStorage.getItem("authId")
                : null;

            const res = await apiClient.patch(API_ENDPOINTS.SHARABLE_LINKS.CUSTOM_SLUG(activeToken), {
                slug: clean,
                userId,
            });

            if (res.data?.success) {
                setSavedSlug(clean);
                safeToastSuccess(`Custom Short URL saved: /s/${clean}`);
                clearApiCache();
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("poster-link-updated", {
                        detail: { token: activeToken, customSlug: clean }
                    }));
                }
                onSuccess?.(res.data);
            }
        } catch (err: any) {
            console.error("Failed to save custom slug:", err);
            const msg = err?.response?.data?.message || err?.message || "Failed to save custom short URL";
            safeToastError(msg);
        } finally {
            setSaving(false);
        }
    };

    const generatedShortUrl = savedSlug ? shortUrl(savedSlug) : "";

    const handleCopy = async () => {
        if (!generatedShortUrl) return;
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(generatedShortUrl);
            }
            setCopied(true);
            safeToastSuccess("Short URL copied to clipboard!");
            setTimeout(() => setCopied(false), 2500);
        } catch {
            safeToastError("Failed to copy short URL");
        }
    };

    const handleOpenInNewTab = () => {
        if (!generatedShortUrl) return;
        window.open(generatedShortUrl, "_blank");
    };

    // Clean display domain prefix
    const displayDomain = FRONT_END_URL.replace(/^https?:\/\//, "");

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div
                className={`rounded-2xl p-6 shadow-2xl max-w-[440px] w-full relative mx-auto border transition-colors duration-200 animate-in fade-in zoom-in-95 ${
                    isDarkMode
                        ? "bg-[#141620] border-[#222636] text-white"
                        : "bg-white border-gray-200 text-gray-900"
                }`}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                    title="Close"
                >
                    <X className="w-4 h-4 stroke-[2]" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-2.5 mb-4 pr-6">
                    <div className="w-9 h-9 rounded-xl bg-[#FF5722]/10 border border-[#FF5722]/20 flex items-center justify-center text-[#FF5722]">
                        <Globe className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold tracking-tight">
                            Custom Short URL
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Create a branded, memorable short link
                        </p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <OrangeSpinner size={32} />
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Preparing short URL...
                        </p>
                    </div>
                ) : planLimitInfo ? (
                    <div className="flex flex-col items-center justify-center py-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF5722]/10 border border-[#FF5722]/20 flex items-center justify-center text-[#FF5722] mb-3">
                            <Crown className="w-6 h-6 stroke-[2]" />
                        </div>
                        <h4 className="text-sm sm:text-base font-bold mb-1">Share Link Limit Reached</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{planLimitInfo.message}</p>
                        <button
                            type="button"
                            onClick={() => { onClose(); window.location.href = "/pages/subscription"; }}
                            className="w-full py-2.5 rounded-xl bg-[#FF5722] text-white text-xs font-bold"
                        >
                            Upgrade to Premium
                        </button>
                    </div>
                ) : errorMsg ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                        <p className="text-xs text-red-500">{errorMsg}</p>
                        <button
                            type="button"
                            onClick={initLink}
                            className="px-4 py-2 rounded-xl bg-[#FF5722] text-white text-xs font-bold"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* Slug Form Input */}
                        <div className="mb-4">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                                Branded Short Slug
                            </label>
                            <div className="flex items-center rounded-xl border overflow-hidden bg-gray-50 dark:bg-[#1A1D29] border-gray-200 dark:border-white/10 focus-within:border-[#FF5722]">
                                <span className="px-3 py-2 text-xs font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-black/30 border-r border-gray-200 dark:border-white/10 shrink-0 select-none">
                                    {displayDomain}/s/
                                </span>
                                <input
                                    type="text"
                                    value={slugInput}
                                    onChange={(e) => {
                                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                                        setSlugInput(val);
                                        validateSlug(val);
                                    }}
                                    placeholder="my-poster-deal"
                                    className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono bg-transparent outline-none text-gray-900 dark:text-white"
                                />
                            </div>
                            {validationError ? (
                                <p className="text-[11px] text-red-500 mt-1 font-medium">{validationError}</p>
                            ) : (
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                                    Letters, numbers, hyphens, and underscores (3–40 characters)
                                </p>
                            )}
                        </div>

                        {/* Save Button */}
                        <button
                            type="button"
                            onClick={handleSaveSlug}
                            disabled={saving || !slugInput.trim() || Boolean(validationError)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#E63900] hover:from-[#FF7043] hover:to-[#FF5722] disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-95 mb-4"
                        >
                            <Sparkles className="w-4 h-4 stroke-[2]" />
                            <span>{saving ? "Saving Short URL..." : savedSlug === slugInput ? "Short URL Active" : "Save Short URL"}</span>
                        </button>

                        {/* Display Active Branded Short URL if saved */}
                        {savedSlug && (
                            <div className="p-3.5 rounded-xl border bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40 animate-in fade-in duration-200">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                                    Active Short URL
                                </span>
                                <p className="text-xs font-mono text-emerald-900 dark:text-emerald-200 truncate mb-3 select-all">
                                    {generatedShortUrl}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[2]" />}
                                        <span>{copied ? "Copied!" : "Copy Short URL"}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleOpenInNewTab}
                                        className="h-8 px-3 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 stroke-[2]" />
                                        <span>Open</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}

