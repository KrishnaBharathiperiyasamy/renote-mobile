'use client';

import React, { useState, useEffect, useRef } from "react";
import {
    X,
    QrCode,
    Download,
    Copy,
    Check,
    ExternalLink,
    AlertCircle,
    Crown,
} from "lucide-react";
import QRCode from "qrcode";
import Modal from "@components/Modal";
import { OrangeSpinner } from "@components/Button";
import apiClient from "@utilis/apiClient";
import { API_ENDPOINTS, viewUrl } from "@constants/api";
import { safeToastSuccess, safeToastError } from "@utilis/toastHelper";

export interface QrCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    poster?: any;
    posterIds?: string[];
}

export default function QrCodeModal({
    isOpen,
    onClose,
    poster,
    posterIds,
}: QrCodeModalProps) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [planLimitInfo, setPlanLimitInfo] = useState<{ limit: number; planName: string; message: string } | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [qrSvgString, setQrSvgString] = useState<string | null>(null);
    const [targetUrl, setTargetUrl] = useState<string | null>(null);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [downloadingFormat, setDownloadingFormat] = useState<"png" | "svg" | null>(null);

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

    useEffect(() => {
        if (!isOpen) {
            activeSessionRef.current = null;
            setQrDataUrl(null);
            setQrSvgString(null);
            setTargetUrl(null);
            setErrorMsg(null);
            setPlanLimitInfo(null);
            setLoading(false);
            return;
        }

        const sessionKey = `${posterKey}_qrcode`;
        if (activeSessionRef.current === sessionKey) return;
        activeSessionRef.current = sessionKey;

        initQr();
    }, [isOpen, posterKey]);

    const generateQrAssets = async (url: string) => {
        try {
            // High-res PNG data URL (1024px)
            const pngUrl = await QRCode.toDataURL(url, {
                width: 1024,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#ffffff",
                },
                errorCorrectionLevel: "H",
            });
            setQrDataUrl(pngUrl);

            // Vector SVG string
            const svgStr = await QRCode.toString(url, {
                type: "svg",
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#ffffff",
                },
                errorCorrectionLevel: "H",
            });
            setQrSvgString(svgStr);
        } catch (qrErr) {
            console.error("Failed to render QR Code:", qrErr);
            throw new Error("Failed to render QR code graphic");
        }
    };

    const initQr = async () => {
        setLoading(true);
        setErrorMsg(null);
        setPlanLimitInfo(null);

        // 1. If single poster already has token, generate QR directly
        const existingToken = poster?.token || poster?.shareableLinkToken;
        if (existingToken) {
            const url = viewUrl(existingToken);
            setTargetUrl(url);
            try {
                await generateQrAssets(url);
            } catch (err: any) {
                setErrorMsg(err.message);
            } finally {
                setLoading(false);
            }
            return;
        }

        // 2. Retrieve or generate active link from backend
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
                setErrorMsg("No poster selected to generate QR Code");
                setLoading(false);
                return;
            }

            const res = await apiClient.post(API_ENDPOINTS.SHARABLE_LINKS.SHARE, {
                posterIds: targetIds,
                force: false,
                userId,
            });

            const data = res.data;
            const finalToken = data?.token || (data?.link ? data.link.split("token=")[1] : "");
            if (!finalToken) {
                throw new Error("Failed to retrieve shareable link for QR Code");
            }

            const finalUrl = viewUrl(finalToken);
            setTargetUrl(finalUrl);
            await generateQrAssets(finalUrl);
        } catch (err: any) {
            console.error("Error generating QR code link:", err);
            const status = err?.response?.status;
            const data = err?.response?.data;
            const errMsg = data?.message || err?.message || "Failed to generate QR code";
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

    const cleanBaseFileName = (resolvedTitle || "poster")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "poster";

    const handleDownloadPng = () => {
        if (!qrDataUrl) return;
        try {
            setDownloadingFormat("png");
            const a = document.createElement("a");
            a.href = qrDataUrl;
            a.download = `${cleanBaseFileName}-qr.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            safeToastSuccess("PNG QR Code downloaded!");
        } catch {
            safeToastError("Failed to download PNG QR Code");
        } finally {
            setDownloadingFormat(null);
        }
    };

    const handleDownloadSvg = () => {
        if (!qrSvgString) return;
        try {
            setDownloadingFormat("svg");
            const blob = new Blob([qrSvgString], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${cleanBaseFileName}-qr.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            safeToastSuccess("SVG QR Code downloaded!");
        } catch {
            safeToastError("Failed to download SVG QR Code");
        } finally {
            setDownloadingFormat(null);
        }
    };

    const handleCopyUrl = async () => {
        if (!targetUrl) return;
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(targetUrl);
            }
            setCopiedUrl(true);
            safeToastSuccess("Poster URL copied!");
            setTimeout(() => setCopiedUrl(false), 2500);
        } catch {
            safeToastError("Failed to copy URL");
        }
    };

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
                        <QrCode className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold tracking-tight">
                            QR Code Link
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Instant scan & download options
                        </p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <OrangeSpinner size={32} />
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Generating QR Code...
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
                            onClick={initQr}
                            className="px-4 py-2 rounded-xl bg-[#FF5722] text-white text-xs font-bold"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* QR Code Preview Card */}
                        <div className="flex flex-col items-center justify-center p-4 rounded-xl border bg-gray-50 dark:bg-[#1A1D29] border-gray-200 dark:border-white/10 mb-4">
                            <div className="p-3 bg-white rounded-xl shadow-xs border border-gray-200">
                                {qrDataUrl && (
                                    <img
                                        src={qrDataUrl}
                                        alt={`QR Code for ${resolvedTitle}`}
                                        className="w-44 h-44 object-contain rounded-lg"
                                    />
                                )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate max-w-[280px] mt-3">
                                {resolvedTitle}
                            </h4>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate max-w-[300px] mt-0.5">
                                {targetUrl}
                            </p>
                        </div>

                        {/* Download Actions (PNG and SVG) */}
                        <div className="grid grid-cols-2 gap-2.5 mb-3">
                            <button
                                type="button"
                                onClick={handleDownloadPng}
                                disabled={downloadingFormat === "png" || !qrDataUrl}
                                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#E63900] hover:from-[#FF7043] hover:to-[#FF5722] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
                                title="Download high-resolution PNG image"
                            >
                                <Download className="w-4 h-4 stroke-[2]" />
                                <span>{downloadingFormat === "png" ? "Downloading..." : "Download PNG"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleDownloadSvg}
                                disabled={downloadingFormat === "svg" || !qrSvgString}
                                className="py-2.5 px-3 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-[#1E2232] text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#252A3D] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                                title="Download crisp vector SVG graphic"
                            >
                                <Download className="w-4 h-4 stroke-[2]" />
                                <span>{downloadingFormat === "svg" ? "Downloading..." : "Download SVG"}</span>
                            </button>
                        </div>

                        {/* Secondary Actions: Copy Link & Open */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCopyUrl}
                                className="flex-1 py-2 px-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-700 dark:text-gray-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[2]" />}
                                <span>{copiedUrl ? "URL Copied!" : "Copy Poster URL"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => targetUrl && window.open(targetUrl, "_blank")}
                                className="h-8 px-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-700 dark:text-gray-300 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                                title="Open poster in new tab"
                            >
                                <ExternalLink className="w-3.5 h-3.5 stroke-[2]" />
                                <span>Open</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

