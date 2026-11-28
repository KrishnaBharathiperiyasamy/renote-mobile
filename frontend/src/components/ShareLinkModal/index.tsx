'use client';

import React, { useState, useEffect, useRef } from "react";
import {
    X,
    ExternalLink,
    Copy,
    Check,
    Share2,
    AlertCircle,
    Loader2,
} from "lucide-react";
import Modal from "@components/Modal";
import { OrangeSpinner } from "@components/Button";
import apiClient, { clearApiCache } from "@utilis/apiClient";
import { API_ENDPOINTS, viewUrl } from "@constants/api";
import { safeToastSuccess, safeToastError } from "@utilis/toastHelper";

export interface ShareLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    poster?: {
        _id?: string;
        posterId?: string;
        id?: string;
        poster_name?: string;
        poster_title?: string;
        product_name?: string;
        product_image?: string;
        productImage?: string;
        name?: string;
        shareableLinkToken?: string;
        token?: string;
        url?: string;
        hasLink?: boolean;
        expiresAt?: string | null;
        [key: string]: any;
    } | null;
    posterIds?: string[];
    initialName?: string;
    initialExpiryDate?: string | null;
    initialPublished?: boolean;
    isRegenerate?: boolean;
    onSuccess?: (result: {
        url: string;
        token: string;
        name: string;
        expiresAt?: string | null;
        isPublishedToMarketplace?: boolean;
        isRevoked?: boolean;
        status?: string;
        [key: string]: any;
    }) => void;
}

const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
    isOpen,
    onClose,
    poster,
    posterIds,
    initialName,
    isRegenerate = false,
    onSuccess,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [generatedResult, setGeneratedResult] = useState<{
        url: string;
        token: string;
        name: string;
        expiresAt?: string | null;
        isPublishedToMarketplace?: boolean;
    } | null>(null);
    const [linkName, setLinkName] = useState("");
    const [savingName, setSavingName] = useState(false);
    const [savedName, setSavedName] = useState<string | null>(null);

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

    const isMultiplePosters = Boolean(posterIds && posterIds.length > 1);
    const posterCount = posterIds?.length || 1;

    const resolvedTitle =
        isMultiplePosters
            ? `Bundle (${posterCount} Posters)`
            : poster?.poster_title ||
              poster?.poster_name ||
              poster?.product_name ||
              poster?.name ||
              initialName ||
              "Poster";

    const posterKey = React.useMemo(() => {
        if (posterIds && posterIds.length > 0) return posterIds.map(String).sort().join(",");
        if (poster?._id) return String(poster._id);
        if (poster?.posterId) return String(poster.posterId);
        if (poster?.id) return String(poster.id);
        return "";
    }, [posterIds, poster?._id, poster?.posterId, poster?.id]);

    useEffect(() => {
        if (!isOpen) {
            activeSessionRef.current = null;
            setGeneratedResult(null);
            setCopied(false);
            setErrorMsg(null);
            setIsGenerating(false);
            setLinkName("");
            setSavedName(null);
            return;
        }

        const sessionKey = `${posterKey}_${Boolean(isRegenerate)}`;
        if (activeSessionRef.current === sessionKey) return;
        activeSessionRef.current = sessionKey;

        setCopied(false);
        setErrorMsg(null);
        setSavedName(null);

        // 1. If single poster already has active token and not regenerating, reuse it directly
        const isRevoked = Boolean(poster?.isRevoked || poster?.status === "revoked");
        const isExpired = Boolean(
            poster?.isExpired ||
            poster?.status === "expired" ||
            (poster?.expiresAt && new Date(poster.expiresAt).getTime() < Date.now())
        );
        const existingToken = !isRegenerate && !isRevoked && !isExpired
            ? (poster?.token || poster?.shareableLinkToken)
            : null;
        if (existingToken && !isMultiplePosters) {
            const existingUrl = viewUrl(existingToken);
            const initialLinkName = poster?.name || poster?.linkName || resolvedTitle || "Link";
            setGeneratedResult({
                url: existingUrl,
                token: existingToken,
                name: initialLinkName,
                expiresAt: poster?.expiresAt || null,
                isPublishedToMarketplace: Boolean(poster?.isPublishedToMarketplace),
            });
            setLinkName(initialLinkName);
            setIsGenerating(false);
            return;
        }

        // 2. Generate new or retrieve active link from backend
        generateLink();
    }, [isOpen, posterKey, isRegenerate, isMultiplePosters, poster?.token, poster?.shareableLinkToken, poster?.isRevoked, poster?.status, poster?.isExpired, poster?.expiresAt, resolvedTitle]);

    const generateLink = async () => {
        setIsGenerating(true);
        setErrorMsg(null);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            let userId = typeof window !== "undefined"
                ? localStorage.getItem("user_id") || localStorage.getItem("authId")
                : null;

            if (!userId && token) {
                try {
                    const payloadBase64 = token.split(".")[1];
                    if (payloadBase64) {
                        const decoded = JSON.parse(atob(payloadBase64));
                        userId = decoded?.authId || decoded?.sub || decoded?.id || decoded?._id || null;
                    }
                } catch {
                    // ignore
                }
            }

            if (!token && !userId) {
                const msg = "Please log in to generate a shareable link";
                setErrorMsg(msg);
                safeToastError(msg);
                setIsGenerating(false);
                return;
            }

            // Determine target poster IDs
            let targetIds: any[] = [];
            if (posterIds && posterIds.length > 0) {
                targetIds = posterIds;
            } else if (poster?._id) {
                targetIds = [poster._id];
            } else if (poster?.id) {
                targetIds = [poster.id];
            } else if (poster?.posterId) {
                targetIds = [poster.posterId];
            }

            const cleanTargetIds: string[] = targetIds
                .map((id: any) => (typeof id === "object" && id !== null ? (id._id || id.id || String(id)) : String(id)))
                .filter(Boolean);

            if (cleanTargetIds.length === 0) {
                const msg = "No poster selected to generate link";
                setErrorMsg(msg);
                safeToastError(msg);
                setIsGenerating(false);
                return;
            }

            const payload: any = {
                posterIds: cleanTargetIds,
                force: Boolean(isRegenerate),
            };
            if (userId) payload.userId = userId;
            if (initialName && initialName.trim()) {
                payload.name = initialName.trim();
            }

            const res = await apiClient.post(API_ENDPOINTS.SHARABLE_LINKS.SHARE, payload);
            const data = res.data;

            if (!data?.token && !data?.link) {
                throw new Error(data?.message || "Failed to generate link");
            }

            clearApiCache();

            const finalToken = data.token || (data.link ? data.link.split("token=")[1] : "");
            const finalUrl = finalToken ? viewUrl(finalToken) : (data.link || "");
            const finalName = data.name || resolvedTitle || "Link";

            const result = {
                url: finalUrl,
                token: finalToken,
                name: finalName,
                expiresAt: data.expiresAt || null,
                isPublishedToMarketplace: Boolean(data.isPublishedToMarketplace),
            };

            setGeneratedResult(result);
            setLinkName(finalName);
            setErrorMsg(null);
            safeToastSuccess(`${finalName} generated`);

            if (typeof window !== "undefined") {
                localStorage.setItem("poster_link_updated_at", Date.now().toString());
                window.dispatchEvent(new CustomEvent("poster-link-updated", { detail: result }));
            }

            onSuccess?.(result);
        } catch (err: any) {
            console.error("Error generating shareable link:", err);
            const data = err?.response?.data;
            const errMsg = data?.message || err?.message || "Failed to generate shareable link";
            setErrorMsg(errMsg);
            safeToastError(errMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!generatedResult?.url) {
            safeToastError("No link available to copy");
            return;
        }
        let copiedSuccessfully = false;
        if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(generatedResult.url);
                copiedSuccessfully = true;
            } catch {
                // fall back to execCommand below
            }
        }
        if (!copiedSuccessfully && typeof document !== "undefined") {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = generatedResult.url;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                copiedSuccessfully = document.execCommand("copy");
                document.body.removeChild(textArea);
            } catch {
                copiedSuccessfully = false;
            }
        }
        if (copiedSuccessfully) {
            setCopied(true);
            safeToastSuccess("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2500);
        } else {
            safeToastError("Failed to copy link");
        }
    };

    const handleOpenInNewTab = () => {
        if (!generatedResult?.url) return;
        window.open(generatedResult.url, "_blank");
    };

    const handleNativeShare = async () => {
        if (!generatedResult?.url) return;
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({
                    title: linkName || resolvedTitle || "Shared Poster",
                    text: `Check out this poster: ${linkName || resolvedTitle}`,
                    url: generatedResult.url,
                });
                return;
            } catch (err: any) {
                if (err.name === "AbortError") return;
            }
        }
        // Fallback: copy to clipboard
        handleCopy();
    };

    const isSaved = Boolean(savedName !== null && linkName.trim() === savedName);

    const handleSaveName = async () => {
        if (!generatedResult?.token) return;
        if (!linkName.trim()) {
            safeToastError("Link name cannot be empty");
            return;
        }
        try {
            setSavingName(true);
            const res = await apiClient.patch(API_ENDPOINTS.SHARABLE_LINKS.PATCH_SHARE(generatedResult.token), {
                name: linkName.trim(),
            });
            if (res.data?.success || res.status === 200) {
                const updatedName = linkName.trim();
                setGeneratedResult(prev => prev ? { ...prev, name: updatedName } : null);
                setSavedName(updatedName);
                safeToastSuccess(`Link name updated to "${updatedName}"`);
                clearApiCache();
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("poster-link-updated"));
                }
            }
        } catch (err: any) {
            console.error("Failed to update link name:", err);
            safeToastError(err?.response?.data?.message || "Failed to update link name");
        } finally {
            setSavingName(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div
                className={`rounded-2xl p-6 shadow-2xl max-w-[420px] w-full relative mx-auto border transition-colors duration-200 animate-in fade-in zoom-in-95 ${
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

                {/* Header (Screenshot 1: Centered title & subtitle) */}
                <div className="text-center mb-5 pr-4 pl-4">
                    <h3 className="text-base sm:text-lg font-bold tracking-tight">
                        Share This Poster
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Copy or share the link below with others
                    </p>
                </div>

                {/* Body Content */}
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <OrangeSpinner size={32} />
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Generating shareable link...
                        </p>
                    </div>
                ) : errorMsg ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                        <p className="text-xs font-semibold text-red-500 dark:text-red-400 max-w-xs">
                            {errorMsg}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                activeSessionRef.current = null;
                                generateLink();
                            }}
                            className="px-4 py-2 rounded-xl bg-[#FF5722] hover:bg-[#F4511E] text-white text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* 1. URL Box with copy icon inside on right (Exact Match to Screenshot 1) */}
                        <div className="relative mb-4">
                            <input
                                type="text"
                                readOnly
                                value={generatedResult?.url || ""}
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                className={`w-full border rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-sans focus:outline-none select-all transition ${
                                    isDarkMode
                                        ? "bg-[#1A1D29] border-white/10 text-gray-200 focus:border-[#FF5722]"
                                        : "bg-gray-50 border-gray-200 text-gray-800 focus:border-[#FF5722]"
                                }`}
                            />
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                                title="Copy link"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                                ) : (
                                    <Copy className="w-4 h-4 stroke-[2]" />
                                )}
                            </button>
                        </div>

                        {/* 2. Side-by-side Open (dark) and Share (orange) buttons (Exact Match to Screenshot 1) */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <button
                                type="button"
                                onClick={handleOpenInNewTab}
                                className="h-10 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer bg-[#1E293B] hover:bg-[#0F172A] text-white active:scale-95"
                                title="Open in new tab"
                            >
                                <ExternalLink className="w-4 h-4 stroke-[2]" />
                                <span>Open</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleNativeShare}
                                className="h-10 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer bg-[#FF5722] hover:bg-[#F4511E] text-white active:scale-95 shadow-[0_4px_12px_rgba(255,87,34,0.3)]"
                                title="Share link"
                            >
                                <Share2 className="w-4 h-4 stroke-[2]" />
                                <span>Share</span>
                            </button>
                        </div>

                        {/* 3. Link Name Field with Save Button (Exact Match to Screenshot 1) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                                Link Name
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={linkName}
                                    onChange={(e) => setLinkName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !savingName && linkName.trim() && !isSaved) {
                                            handleSaveName();
                                        }
                                    }}
                                    placeholder="Link Name"
                                    className={`flex-1 border rounded-xl px-3.5 py-2 text-xs sm:text-sm font-sans focus:outline-none transition ${
                                        isDarkMode
                                            ? "bg-[#1A1D29] border-white/10 text-gray-100 focus:border-[#FF5722]"
                                            : "bg-white border-gray-200 text-gray-900 focus:border-[#FF5722]"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={handleSaveName}
                                    disabled={savingName || !linkName.trim() || isSaved}
                                    className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shrink-0 select-none ${
                                        isSaved
                                            ? isDarkMode
                                                ? "bg-white/10 text-gray-200 border border-white/10 cursor-default"
                                                : "bg-gray-100 text-gray-700 border border-gray-200 cursor-default"
                                            : savingName
                                            ? "bg-[#FF5722] text-white cursor-wait opacity-90 shadow-sm"
                                            : "bg-[#FF5722] hover:bg-[#F4511E] text-white active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    }`}
                                >
                                    {savingName ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2.5]" />
                                            <span>Saving...</span>
                                        </>
                                    ) : isSaved ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                                            <span>Saved</span>
                                        </>
                                    ) : (
                                        <span>Save</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ShareLinkModal;
