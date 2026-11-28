'use client';
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import apiClient, { clearApiCache } from "@utilis/apiClient";
import { ConfirmationPopUp } from "@components/ConfirmationPopUp";
import Modal from "@components/Modal";
import ShareLinkModal from "@components/ShareLinkModal";
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import {
    Eye,
    Share2,
    Trash2,
    Pencil,
    Copy,
    Check,
    ExternalLink,
    Sparkles,
    Calendar,
    Clock,
    RefreshCw,
    Search,
    X,
    AlertCircle,
    MoreVertical,
    Maximize2,
    Store,
    Link2,
    Link2Off,
    RotateCw,
    Layers,
    Plus,
} from "lucide-react";
import Header from "@components/header/page";
import { OrangeSpinner } from "@components/Button";
import { API_ENDPOINTS, viewUrl, getPosterImageSrc } from "@constants/api";
import { handleAuthErrorAndToast } from "@utilis/catchhandle";
import { useUser } from "@context/UserContext";
import type { AxiosRequestConfig } from "axios";

interface CustomRequestConfig extends AxiosRequestConfig {
    _skipCache?: boolean;
}

export interface SharedLinkData {
    _id: string;
    token: string;
    name?: string;
    posterIds?: (string | { _id?: string; posterId?: string; product_name?: string; poster_title?: string; product_price?: number; product_image?: string })[];
    posterCount?: number;
    createdAt: string;
    expiresAt?: string | null;
    isExpired?: boolean;
    isRevoked?: boolean;
    revokedAt?: string;
    isPublishedToMarketplace?: boolean;
    likes?: number;
    comments?: number;
    [key: string]: unknown;
}

export interface PosterData {
    _id?: string;
    id?: string;
    posterId?: string;
    user_id?: string | { toString(): string };
    poster_name?: string;
    product_name?: string;
    poster_title?: string;
    product_price?: number;
    product_image?: string;
    shareableLinkToken?: string;
    isPublishedToMarketplace?: boolean;
    createdAt?: string;
    [key: string]: unknown;
}

export interface PosterLinkRow {
    key: string;
    posterId?: string;
    linkId?: string;
    name: string;
    productName?: string;
    productPrice?: number;
    productImage?: string;
    token?: string;
    url?: string;
    hasLink: boolean;
    createdAt: string;
    expiresAt?: string | null;
    isExpired?: boolean;
    isRevoked?: boolean;
    revokedAt?: string;
    status: "active" | "expired" | "revoked" | "ready";
    isPublishedToMarketplace?: boolean;
    likes?: number;
    comments?: number;
    posterCount?: number;
    posters?: unknown[];
    rawPoster?: PosterData;
    rawLink?: SharedLinkData;
}

const UserPosterLinks: React.FC = () => {
    const router = useRouter();
    const { isLoggedIn } = useUser();
    const [rows, setRows] = useState<PosterLinkRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Search, Filter & Sort states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "revoked" | "ready" | "published">("all");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name_asc" | "name_desc" | "expiring_soon">("newest");

    // Inline Rename states
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string>("");
    const [isSavingRename, setIsSavingRename] = useState<boolean>(false);

    // Action Menu & Confirmation States
    const [activeMenuKey, setActiveMenuKey] = useState<string | null>(null);
    const [activeMenuRow, setActiveMenuRow] = useState<PosterLinkRow | null>(null);
    const [menuPosition, setMenuPosition] = useState<{
        top?: number;
        bottom?: number;
        left: number;
        transformOrigin: string;
    } | null>(null);
    const [isMounted, setIsMounted] = useState<boolean>(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Generate Link Popup Modal
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [targetPosterForGenerate, setTargetPosterForGenerate] = useState<PosterLinkRow | null>(null);
    const [isRegenerateModal, setIsRegenerateModal] = useState<boolean>(false);

    // Page-level Poster Picker Modal
    const [posterSelectorOpen, setPosterSelectorOpen] = useState(false);
    const [posterSearchQuery, setPosterSearchQuery] = useState("");

    // Delete Modal (Single)
    const [deleteTarget, setDeleteTarget] = useState<PosterLinkRow | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Revoke Modal (Single)
    const [revokeTarget, setRevokeTarget] = useState<PosterLinkRow | null>(null);
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);

    // Expiry & Link Details Modal
    const [selectedLinkForSettings, setSelectedLinkForSettings] = useState<PosterLinkRow | null>(null);
    const [editLinkName, setEditLinkName] = useState("");
    const [editExpiryDate, setEditExpiryDate] = useState("");
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Image Zoom Modal
    const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

    // Action loaders & copy state
    const [publishingToken, setPublishingToken] = useState<string | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    // Theme state
    const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

    useEffect(() => {
        const handleThemeSync = () => {
            const saved = localStorage.getItem("spa_theme") || localStorage.getItem("poster_theme");
            if (saved) {
                setIsDarkMode(saved === "dark");
            } else {
                setIsDarkMode(document.documentElement.classList.contains("dark"));
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

    const closeActionMenu = useCallback(() => {
        setActiveMenuKey(null);
        setActiveMenuRow(null);
        setMenuPosition(null);
    }, []);

    const handleToggleMenu = useCallback((e: React.MouseEvent<HTMLButtonElement>, row: PosterLinkRow) => {
        e.stopPropagation();
        if (activeMenuKey === row.key) {
            closeActionMenu();
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const menuWidth = 192; // w-48 is 192px
        const menuEstimatedHeight = 230; // height for up to 6 items
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        let top: number | undefined;
        let bottom: number | undefined;
        let transformOrigin = "top right";

        // If space below is limited and space above is larger, flip upward
        if (spaceBelow < menuEstimatedHeight && spaceAbove > spaceBelow) {
            bottom = Math.max(8, viewportHeight - rect.top + 6);
            transformOrigin = "bottom right";
        } else {
            top = Math.max(8, rect.bottom + 6);
            transformOrigin = "top right";
        }

        // Align right edge to trigger button right edge
        let left = rect.right - menuWidth;
        // Clamp horizontally within viewport bounds
        if (left < 8) {
            left = Math.max(8, rect.left);
        }
        if (left + menuWidth > viewportWidth - 8) {
            left = Math.max(8, viewportWidth - menuWidth - 8);
        }

        setMenuPosition({
            top,
            bottom,
            left,
            transformOrigin,
        });
        setActiveMenuKey(row.key);
        setActiveMenuRow(row);
    }, [activeMenuKey, closeActionMenu]);

    // Close action popup on outside click, scroll (capturing all containers including table), resize, or Escape key
    useEffect(() => {
        if (!activeMenuKey) return;

        const handleScrollOrResize = () => {
            closeActionMenu();
        };

        const handlePointerDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest(".action-menu-popup") || target.closest(".action-menu-trigger")) {
                return;
            }
            closeActionMenu();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeActionMenu();
            }
        };

        window.addEventListener("scroll", handleScrollOrResize, true);
        window.addEventListener("resize", handleScrollOrResize);
        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [activeMenuKey, closeActionMenu]);

    const fetchData = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        const userId = localStorage.getItem("user_id") || localStorage.getItem("authId") || "";
        const token = localStorage.getItem("token");

        if (!userId && !token) {
            setRows([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const headers: Record<string, string> = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            // 1. Fetch user's shareable links
            let links: SharedLinkData[] = [];
            try {
                const linksRes = await apiClient.get(API_ENDPOINTS.SHARABLE_LINKS.GET_USER_LINKS(userId), {
                    headers,
                    _skipCache: true,
                } as CustomRequestConfig);
                if (linksRes.data?.success && Array.isArray(linksRes.data?.links)) {
                    links = linksRes.data.links;
                }
            } catch (err: unknown) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status !== 404) {
                    console.warn("Could not fetch user shared links:", err);
                }
            }

            // 2. Fetch user's created posters
            let posters: PosterData[] = [];
            try {
                const postersRes = await apiClient.get(API_ENDPOINTS.POSTERS.GET_POSTER(userId), {
                    headers,
                    params: {
                        limit: 1000,
                        fallback: "false",
                        onlyUser: "true",
                    },
                    _skipCache: true,
                } as CustomRequestConfig);
                if (postersRes.data?.posters && Array.isArray(postersRes.data?.posters)) {
                    posters = postersRes.data.posters.filter((p: PosterData) => {
                        if (!p) return false;
                        if (
                            p.user_id &&
                            p.user_id.toString() === "69d362ca7421b5bc1882903d" &&
                            userId !== "69d362ca7421b5bc1882903d"
                        ) {
                            return false;
                        }
                        return true;
                    });
                }
            } catch (err) {
                console.warn("Could not fetch user posters:", err);
            }

            // 3. Build unified rows
            const posterToLinkMap = new Map<string, SharedLinkData>();
            const tokenToLinkMap = new Map<string, SharedLinkData>();
            const handledLinkIds = new Set<string>();

            // Map each poster to its active link
            links.forEach((l) => {
                if (l.token) tokenToLinkMap.set(l.token, l);
                if (Array.isArray(l.posterIds)) {
                    l.posterIds.forEach((p) => {
                        const pid = typeof p === "string" ? p : (p?._id ? p._id.toString() : p?.posterId ? String(p.posterId) : "");
                        if (pid) {
                            const current = posterToLinkMap.get(pid);
                            if (!current) {
                                posterToLinkMap.set(pid, l);
                            } else if (current.isRevoked && !l.isRevoked) {
                                posterToLinkMap.set(pid, l);
                            } else if (current.isExpired && !l.isExpired && !l.isRevoked) {
                                posterToLinkMap.set(pid, l);
                            }
                        }
                    });
                }
            });

            const unifiedRows: PosterLinkRow[] = [];

            // A. User's posters
            posters.forEach((p: PosterData) => {
                const pid = p._id?.toString() || p.id?.toString() || (p.posterId ? String(p.posterId) : undefined);
                const matchedLink = (pid ? posterToLinkMap.get(pid) : null) || (p.shareableLinkToken ? tokenToLinkMap.get(p.shareableLinkToken) : null);

                if (matchedLink) {
                    if (matchedLink._id) handledLinkIds.add(String(matchedLink._id));
                    const isRevoked = Boolean(matchedLink.isRevoked);
                    const isExpired = !isRevoked && matchedLink.expiresAt
                        ? new Date(matchedLink.expiresAt).getTime() < Date.now()
                        : Boolean(matchedLink.isExpired);
                    const status: "active" | "expired" | "revoked" | "ready" = isRevoked
                        ? "revoked"
                        : isExpired
                            ? "expired"
                            : "active";

                    unifiedRows.push({
                        key: `poster_${pid || matchedLink._id}`,
                        posterId: pid,
                        linkId: matchedLink._id,
                        name: matchedLink.name || p.poster_name || p.product_name || p.poster_title || "Untitled Poster",
                        productName: p.product_name || p.poster_title,
                        productPrice: p.product_price,
                        productImage: p.product_image,
                        token: matchedLink.token,
                        url: matchedLink.token ? viewUrl(matchedLink.token) : undefined,
                        hasLink: true,
                        createdAt: matchedLink.createdAt || p.createdAt || new Date().toISOString(),
                        expiresAt: matchedLink.expiresAt,
                        isExpired,
                        isRevoked,
                        revokedAt: matchedLink.revokedAt,
                        status,
                        isPublishedToMarketplace: Boolean(matchedLink.isPublishedToMarketplace || p.isPublishedToMarketplace),
                        likes: matchedLink.likes,
                        comments: matchedLink.comments,
                        rawPoster: p,
                        rawLink: matchedLink,
                    });
                } else if (p.shareableLinkToken) {
                    unifiedRows.push({
                        key: `poster_${pid || p.shareableLinkToken}`,
                        posterId: pid,
                        name: p.poster_name || p.product_name || p.poster_title || "Untitled Poster",
                        productName: p.product_name || p.poster_title,
                        productPrice: p.product_price,
                        productImage: p.product_image,
                        token: p.shareableLinkToken,
                        url: viewUrl(p.shareableLinkToken),
                        hasLink: true,
                        createdAt: p.createdAt || new Date().toISOString(),
                        status: "active",
                        isPublishedToMarketplace: Boolean(p.isPublishedToMarketplace),
                        rawPoster: p,
                    });
                } else {
                    unifiedRows.push({
                        key: `poster_${pid || Math.random()}`,
                        posterId: pid,
                        name: p.poster_name || p.product_name || p.poster_title || "Untitled Poster",
                        productName: p.product_name || p.poster_title,
                        productPrice: p.product_price,
                        productImage: p.product_image,
                        hasLink: false,
                        status: "ready",
                        createdAt: p.createdAt || new Date().toISOString(),
                        isPublishedToMarketplace: Boolean(p.isPublishedToMarketplace),
                        rawPoster: p,
                    });
                }
            });

            // B. Standalone or bundle links
            links.forEach((l) => {
                const linkIdStr = String(l._id);
                if (!handledLinkIds.has(linkIdStr)) {
                    const firstPoster = Array.isArray(l.posterIds) && l.posterIds.length > 0 ? l.posterIds[0] : null;
                    const posterImage =
                        firstPoster && typeof firstPoster === "object" ? firstPoster.product_image : undefined;
                    const firstPid = firstPoster && typeof firstPoster === "object"
                        ? (firstPoster._id?.toString() || (firstPoster.posterId ? String(firstPoster.posterId) : undefined))
                        : (typeof firstPoster === "string" ? firstPoster : undefined);
                    const firstProdName = firstPoster && typeof firstPoster === "object"
                        ? (firstPoster.product_name || firstPoster.poster_title)
                        : undefined;
                    const firstPrice = firstPoster && typeof firstPoster === "object"
                        ? firstPoster.product_price
                        : undefined;
                    const count = l.posterCount || (Array.isArray(l.posterIds) ? l.posterIds.length : 1);
                    const nameSuffix = count > 1 ? ` (${count} posters)` : "";
                    const isRevoked = Boolean(l.isRevoked);
                    const isExpired = !isRevoked && l.expiresAt
                        ? new Date(l.expiresAt).getTime() < Date.now()
                        : Boolean(l.isExpired);
                    const status: "active" | "expired" | "revoked" | "ready" = isRevoked
                        ? "revoked"
                        : isExpired
                            ? "expired"
                            : "active";

                    unifiedRows.push({
                        key: `link_${l._id}`,
                        posterId: firstPid,
                        linkId: l._id,
                        name: `${l.name || "Untitled Link"}${nameSuffix}`,
                        productName: firstProdName,
                        productPrice: firstPrice,
                        productImage: posterImage,
                        token: l.token,
                        url: l.token ? viewUrl(l.token) : undefined,
                        hasLink: true,
                        createdAt: l.createdAt || new Date().toISOString(),
                        expiresAt: l.expiresAt,
                        isExpired,
                        isRevoked,
                        revokedAt: l.revokedAt,
                        status,
                        isPublishedToMarketplace: Boolean(l.isPublishedToMarketplace),
                        likes: l.likes,
                        comments: l.comments,
                        posterCount: count,
                        posters: l.posterIds,
                        rawLink: l,
                    });
                }
            });

            setRows(unifiedRows);
        } catch (err) {
            if (handleAuthErrorAndToast(err, "Failed to fetch data")) return;
            setRows([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const handleUpdate = () => {
            fetchData();
        };
        window.addEventListener("poster-link-updated", handleUpdate);
        window.addEventListener("storage", handleUpdate);
        window.addEventListener("focus", handleUpdate);
        return () => {
            window.removeEventListener("poster-link-updated", handleUpdate);
            window.removeEventListener("storage", handleUpdate);
            window.removeEventListener("focus", handleUpdate);
        };
    }, [isLoggedIn, fetchData]);

    // Summary Metrics: Total Posters, Active Links, Not Shared
    const summaryMetrics = useMemo(() => {
        const total = rows.length;
        const active = rows.filter((r) => r.hasLink && r.status === "active").length;
        const notShared = rows.filter((r) => !r.hasLink || r.status === "ready").length;
        const expired = rows.filter((r) => r.status === "expired").length;
        const revoked = rows.filter((r) => r.status === "revoked").length;
        return { total, active, notShared, expired, revoked };
    }, [rows]);

    // Selectable posters for page-level link generation modal
    const selectablePosters = useMemo(() => {
        let list = [...rows];
        if (posterSearchQuery.trim()) {
            const q = posterSearchQuery.toLowerCase().trim();
            list = list.filter((r) => r.name?.toLowerCase().includes(q) || r.productName?.toLowerCase().includes(q));
        }
        return list.sort((a, b) => {
            if (!a.hasLink && b.hasLink) return -1;
            if (a.hasLink && !b.hasLink) return 1;
            return 0;
        });
    }, [rows, posterSearchQuery]);

    // Filtered & Sorted rows for table
    const filteredRows = useMemo(() => {
        let list = [...rows];

        // 1. Search Query: poster name, product name, or token
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(
                (r) =>
                    r.name?.toLowerCase().includes(q) ||
                    r.productName?.toLowerCase().includes(q) ||
                    r.token?.toLowerCase().includes(q) ||
                    r.url?.toLowerCase().includes(q)
            );
        }

        // 2. Status Filter
        if (statusFilter === "active") {
            list = list.filter((r) => r.hasLink && r.status === "active");
        } else if (statusFilter === "expired") {
            list = list.filter((r) => r.status === "expired");
        } else if (statusFilter === "revoked") {
            list = list.filter((r) => r.status === "revoked");
        } else if (statusFilter === "ready") {
            list = list.filter((r) => !r.hasLink || r.status === "ready");
        } else if (statusFilter === "published") {
            list = list.filter((r) => r.isPublishedToMarketplace);
        }

        // 3. Sorting
        list.sort((a, b) => {
            if (sortBy === "oldest") {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }
            if (sortBy === "name_asc") {
                return a.name.localeCompare(b.name);
            }
            if (sortBy === "name_desc") {
                return b.name.localeCompare(a.name);
            }
            if (sortBy === "expiring_soon") {
                if (!a.expiresAt && !b.expiresAt) return 0;
                if (!a.expiresAt) return 1;
                if (!b.expiresAt) return -1;
                return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
            }
            // Default newest first
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return list;
    }, [rows, searchQuery, statusFilter, sortBy]);

    // Displayed rows
    const paginatedRows = useMemo(() => {
        return filteredRows;
    }, [filteredRows]);

    // Actions: Inline Rename
    const handleStartRename = (row: PosterLinkRow) => {
        setEditingKey(row.key);
        setEditingName(row.name);
    };

    const handleCancelRename = () => {
        setEditingKey(null);
        setEditingName("");
    };

    const handleSaveRename = async (row: PosterLinkRow) => {
        const trimmed = editingName.trim();
        if (!trimmed || trimmed === row.name) {
            setEditingKey(null);
            return;
        }

        const userId = localStorage.getItem("user_id") || localStorage.getItem("authId");
        const token = localStorage.getItem("token");

        if (!userId || !token) {
            safeToastError("Please login to update name");
            return;
        }

        try {
            setIsSavingRename(true);

            // If link exists, update link name
            if (row.token) {
                const res = await apiClient.patch(
                    API_ENDPOINTS.SHARABLE_LINKS.UPDATE_SHARED_LINK(row.token),
                    {
                        userId,
                        name: trimmed,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (!res.data?.success) {
                    safeToastError(res.data?.message || "Failed to update link name");
                    return;
                }
            }

            // Also update poster name if posterId is present
            if (row.posterId) {
                try {
                    await apiClient.patch(
                        API_ENDPOINTS.POSTERS.UPDATE_POSTER(row.posterId),
                        { poster_name: trimmed, product_name: trimmed },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } catch (e) {
                    console.warn("Could not sync poster name:", e);
                }
            }

            setRows((prev) =>
                prev.map((r) => (r.key === row.key ? { ...r, name: trimmed } : r))
            );
            safeToastSuccess("Name updated successfully!");
            setEditingKey(null);
        } catch (err: unknown) {
            console.error("Failed to rename:", err);
            const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update name";
            safeToastError(errorMsg);
        } finally {
            setIsSavingRename(false);
        }
    };

    // Actions: Open Generate Link Popup
    const handleOpenGenerateModal = (row: PosterLinkRow, isRegenerate = false) => {
        setTargetPosterForGenerate(row);
        setIsRegenerateModal(isRegenerate);
        setGenerateModalOpen(true);
    };

    // Actions: Copy Link
    const handleCopyLink = async (url?: string) => {
        const linkToCopy = url || "";
        if (!linkToCopy) {
            safeToastError("No link generated to copy");
            return;
        }
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(linkToCopy);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = linkToCopy;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
            }
            setCopiedUrl(linkToCopy);
            setTimeout(() => setCopiedUrl(null), 2500);
            safeToastSuccess("Link copied to clipboard!");
        } catch {
            safeToastError("Failed to copy link");
        }
    };

    // Actions: Share Link
    const handleShare = async (url?: string, title?: string) => {
        if (!url) {
            safeToastError("Please generate a link first");
            return;
        }
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || "Check out my poster on ReNote!",
                    url,
                });
            } catch {
                // Share dismissed
            }
        } else {
            handleCopyLink(url);
        }
    };

    // Actions: Revoke Single Link
    const handleOpenRevokeModal = (row: PosterLinkRow) => {
        setRevokeTarget(row);
        setIsRevokeModalOpen(true);
    };

    const confirmRevokeLink = async () => {
        if (!revokeTarget?.token) return;
        const userId = localStorage.getItem("user_id") || localStorage.getItem("authId");
        const token = localStorage.getItem("token");

        try {
            setIsRevoking(true);
            const res = await apiClient.patch(
                API_ENDPOINTS.SHARABLE_LINKS.REVOKE(revokeTarget.token),
                { userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data?.success) {
                safeToastSuccess("Shareable link revoked successfully");
                setRows((prev) =>
                    prev.map((r) =>
                        r.token === revokeTarget.token
                            ? { ...r, isRevoked: true, status: "revoked" }
                            : r
                    )
                );
                setIsRevokeModalOpen(false);
                await fetchData();
            } else {
                safeToastError(res.data?.message || "Failed to revoke link");
            }
        } catch (err: unknown) {
            console.error("Revoke failed:", err);
            const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to revoke link";
            safeToastError(errorMsg);
        } finally {
            setIsRevoking(false);
            setRevokeTarget(null);
        }
    };

    // Actions: Delete Single Link or Poster
    const handleSingleDelete = (row: PosterLinkRow) => {
        setDeleteTarget(row);
        setIsDeleteModalOpen(true);
    };

    const confirmSingleDelete = async () => {
        if (!deleteTarget) return;
        const row = deleteTarget;
        setIsDeleteModalOpen(false);

        const token = localStorage.getItem("token");
        try {
            if (row.linkId) {
                const res = await apiClient.post(
                    API_ENDPOINTS.SHARABLE_LINKS.DELETE_MULTIPLE,
                    { ids: [row.linkId] },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                if (res.data?.success) {
                    safeToastSuccess("Shared link deleted successfully");
                    await fetchData();
                } else {
                    safeToastError(res.data?.message || "Failed to delete shared link");
                }
            } else if (row.posterId) {
                const res = await apiClient.post(
                    API_ENDPOINTS.POSTERS.DELETE_POSTER,
                    { ids: [row.posterId] },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data?.success) {
                    safeToastSuccess("Poster deleted successfully");
                    await fetchData();
                } else {
                    safeToastError(res.data?.message || "Failed to delete poster");
                }
            }
        } catch (err: unknown) {
            console.error("Delete failed:", err);
            const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete";
            safeToastError(errorMsg);
        } finally {
            setDeleteTarget(null);
        }
    };

    // Actions: Manage Expiry Modal
    const handleOpenSettingsModal = (row: PosterLinkRow) => {
        setSelectedLinkForSettings(row);
        setEditLinkName(row.name);
        if (row.expiresAt) {
            const d = new Date(row.expiresAt);
            if (!isNaN(d.getTime())) {
                setEditExpiryDate(d.toISOString().split("T")[0]);
            } else {
                setEditExpiryDate("");
            }
        } else {
            setEditExpiryDate("");
        }
    };

    const handleSaveLinkSettings = async () => {
        if (!selectedLinkForSettings?.token) return;
        const userId = localStorage.getItem("user_id") || localStorage.getItem("authId");
        const token = localStorage.getItem("token");

        if (!userId || !token) {
            safeToastError("Please login to update link settings");
            return;
        }

        try {
            setIsSavingSettings(true);
            let expiresAtIso: string | null = null;
            if (editExpiryDate) {
                const parsedDate = new Date(`${editExpiryDate}T23:59:59`);
                if (!isNaN(parsedDate.getTime())) {
                    expiresAtIso = parsedDate.toISOString();
                }
            }

            const payload = {
                userId,
                name: editLinkName.trim() || selectedLinkForSettings.name,
                expiresAt: expiresAtIso,
            };

            const res = await apiClient.patch(
                API_ENDPOINTS.SHARABLE_LINKS.UPDATE_SHARED_LINK(selectedLinkForSettings.token),
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data?.success) {
                safeToastSuccess("Link settings updated successfully!");
                setSelectedLinkForSettings(null);
                await fetchData();
            } else {
                safeToastError(res.data?.message || "Failed to update link settings");
            }
        } catch (err: unknown) {
            console.error("Failed to update link settings:", err);
            const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update link settings";
            safeToastError(errorMsg);
        } finally {
            setIsSavingSettings(false);
        }
    };

    const setExpiryPresetDays = (days: number) => {
        if (days === -1) {
            setEditExpiryDate("");
            return;
        }
        const d = new Date();
        d.setDate(d.getDate() + days);
        setEditExpiryDate(d.toISOString().split("T")[0]);
    };

    // Actions: Marketplace Publish / Unpublish Toggle
    const handleDirectPublishLink = async (row: PosterLinkRow) => {
        if (!row.token) {
            safeToastError("Please generate a shareable link first");
            return;
        }
        const token = localStorage.getItem("token");
        try {
            setPublishingToken(row.token);
            const targetStatus = !row.isPublishedToMarketplace;

            const res = await apiClient.patch(
                API_ENDPOINTS.MARKETPLACE.PUBLISH_LINK(row.token),
                { isPublishedToMarketplace: targetStatus },
                token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
            );

            if (res.data?.success) {
                safeToastSuccess(
                    res.data.message ||
                    (targetStatus
                        ? "Published to Marketplace!"
                        : "Unpublished from Marketplace")
                );
                setRows((prev) =>
                    prev.map((r) =>
                        r.token === row.token ? { ...r, isPublishedToMarketplace: targetStatus } : r
                    )
                );
            }
        } catch (err: unknown) {
            console.error("Failed to publish link to marketplace:", err);
            const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update Marketplace status";
            safeToastError(errorMsg);
        } finally {
            setPublishingToken(null);
        }
    };

    // Helper: Format Shortened URL
    const formatShortUrl = (fullUrl?: string) => {
        if (!fullUrl) return "";
        try {
            const u = new URL(fullUrl);
            const path = u.pathname + (u.search ? u.search : "");
            return `${u.host}${path.length > 25 ? path.slice(0, 25) + "..." : path}`;
        } catch {
            return fullUrl.length > 30 ? fullUrl.slice(0, 30) + "..." : fullUrl;
        }
    };

    // Helper: Date Formatter
    const formatDate = (dateStr?: string | Date | null) => {
        if (!dateStr) return "Never";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "Never";
            return d.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return "Never";
        }
    };

    return (
        <div
            className={`min-h-screen ${isDarkMode ? "bg-[#0D0E12] text-[#E0E2EC]" : "bg-[#F8F9FC] text-[#111827]"
                } transition-colors font-sans selection:bg-orange-500 selection:text-white`}
        >
            <Header />

            {/* ════════════════ 1. TOOLBAR: SEARCH, FILTERS & ACTIONS (MERGED DIRECTLY WITH HEADER) ════════════════ */}
            <div className={`sticky top-16 z-30 px-3 sm:px-6 py-2.5 sm:py-3 transition-colors ${isDarkMode
                ? "bg-[#12141D]/95 border-b border-[#222636] backdrop-blur-md"
                : "bg-white/95 border-b border-gray-200 shadow-xs backdrop-blur-md"
                }`}>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 max-w-[1600px] mx-auto w-full">
                    {/* Left: Search Bar & Filters */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1 min-w-0">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-[18px] h-[18px] stroke-[2] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by poster name, product, or token..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs md:text-sm outline-none border transition-colors ${isDarkMode
                                        ? "bg-[#1A1D28] border-white/10 text-white focus:border-orange-500 placeholder-gray-500"
                                        : "bg-gray-50 border-gray-300 text-gray-900 focus:border-orange-500 placeholder-gray-400"
                                    }`}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-0.5"
                                >
                                    <X className="w-4 h-4 stroke-[2]" />
                                </button>
                            )}
                        </div>

                        {/* Filters & Sorting */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "expired" | "revoked" | "ready" | "published")}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold outline-none border transition-colors cursor-pointer ${isDarkMode
                                        ? "bg-[#1A1D28] border-white/10 text-gray-200 hover:bg-[#202432] focus:border-orange-500"
                                        : "bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100 focus:border-orange-500"
                                    }`}
                            >
                                <option value="all" className={isDarkMode ? "bg-[#1A1D28] text-gray-200" : "bg-white text-gray-800"}>All Statuses ({summaryMetrics.total})</option>
                                <option value="active" className={isDarkMode ? "bg-[#1A1D28] text-gray-200" : "bg-white text-gray-800"}>Active Links ({summaryMetrics.active})</option>
                                <option value="ready" className={isDarkMode ? "bg-[#1A1D28] text-gray-200" : "bg-white text-gray-800"}>Not Shared ({summaryMetrics.notShared})</option>
                                <option value="expired" className={isDarkMode ? "bg-[#1A1D28] text-gray-200" : "bg-white text-gray-800"}>Expired Links ({summaryMetrics.expired})</option>
                                <option value="revoked" className={isDarkMode ? "bg-[#1A1D28] text-gray-200" : "bg-white text-gray-800"}>Revoked Links ({summaryMetrics.revoked})</option>
                                <option value="published" className={isDarkMode ? "bg-[#1A1D28] text-gray-200" : "bg-white text-gray-800"}>Published to Marketplace</option>
                            </select>

                            {/* Sort Selector */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name_asc" | "name_desc" | "expiring_soon")}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold outline-none border transition-colors cursor-pointer ${isDarkMode
                                        ? "bg-[#1A1D28] border-white/10 text-gray-200 hover:bg-[#202432] focus:border-orange-500"
                                        : "bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100 focus:border-orange-500"
                                    }`}
                            >
                                <option value="newest" className={isDarkMode ? "bg-[#1A1D28] text-gray-200" : "bg-white text-gray-800"}>Sort: Newest First</option>
                                <option value="oldest" className={isDarkMode ? "bg-[#1A1D28] text-gray-200" : "bg-white text-gray-800"}>Sort: Oldest First</option>
                                <option value="name_asc" className={isDarkMode ? "bg-[#1A1D28] text-gray-200" : "bg-white text-gray-800"}>Sort: Name (A-Z)</option>
                                <option value="name_desc" className={isDarkMode ? "bg-[#1A1D28] text-gray-200" : "bg-white text-gray-800"}>Sort: Name (Z-A)</option>
                                <option value="expiring_soon" className={isDarkMode ? "bg-[#1A1D28] text-gray-200" : "bg-white text-gray-800"}>Sort: Expiring Soon</option>
                            </select>

                            {/* Reset Button */}
                            {(searchQuery || statusFilter !== "all" || sortBy !== "newest") && (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("all");
                                        setSortBy("newest");
                                    }}
                                    className="text-xs text-orange-400 hover:text-orange-300 font-bold px-2.5 py-1.5 transition"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions Moved Upwards */}
                    <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                        {/* Refresh Button */}
                        <button
                            type="button"
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition cursor-pointer ${isDarkMode
                                    ? "bg-[#1A1D28] border-white/10 text-gray-300 hover:bg-white/[0.04]"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm"
                                }`}
                            title="Refresh poster links"
                        >
                            <RefreshCw className={`w-[18px] h-[18px] stroke-[2] ${refreshing ? "animate-spin text-orange-500" : ""}`} />
                            <span>Refresh</span>
                        </button>

                        {/* Catalog Button */}
                        <button
                            type="button"
                            onClick={() => router.push("/pages/poster")}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition cursor-pointer ${isDarkMode
                                    ? "bg-[#1A1D28] border-white/10 text-gray-300 hover:bg-white/[0.04]"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm"
                                }`}
                        >
                            <span>Poster Catalog →</span>
                        </button>

                        {/* Single Page-Level Link Generation Action */}
                        <button
                            type="button"
                            onClick={() => setPosterSelectorOpen(true)}
                            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md transition transform active:scale-95 cursor-pointer"
                        >
                            <Plus className="w-[18px] h-[18px] stroke-[2.2]" />
                            <span>Generate Link</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ════════════════ MAIN CONTENT CONTAINER ════════════════ */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-4 pb-12 space-y-6">
                {/* ════════════════ 2. SUMMARY METRIC CARDS ════════════════ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 rounded-2xl shadow-2xl">
                    {/* Card 1: Total Posters */}
                    <div
                        onClick={() => setStatusFilter("all")}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === "all"
                            ? isDarkMode
                                ? "bg-[#161822] border-orange-500/50 shadow-lg shadow-orange-500/5"
                                : "bg-orange-50/50 border-orange-400 shadow-sm"
                            : isDarkMode
                                ? "bg-[#141620] border-[#222636] hover:border-white/20"
                                : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                Total Posters
                            </span>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDarkMode
                                ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                : "bg-orange-50 text-orange-600 border border-orange-200"
                                }`}>
                                <Layers className="w-4 h-4 stroke-[2]" />
                            </div>
                        </div>
                        <div className="mt-2.5 flex items-baseline gap-2">
                            <span className={`text-2xl md:text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {summaryMetrics.total}
                            </span>
                            <span className={`text-[11px] font-medium ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>in your account</span>
                        </div>
                    </div>

                    {/* Card 2: Active Links */}
                    <div
                        onClick={() => setStatusFilter("active")}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === "active"
                            ? isDarkMode
                                ? "bg-[#161822] border-emerald-500/50 shadow-lg shadow-emerald-500/5"
                                : "bg-emerald-50/50 border-emerald-400 shadow-sm"
                            : isDarkMode
                                ? "bg-[#141620] border-[#222636] hover:border-white/20"
                                : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                Active Links
                            </span>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDarkMode
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}>
                                <Link2 className="w-4 h-4 stroke-[2]" />
                            </div>
                        </div>
                        <div className="mt-2.5 flex items-baseline gap-2">
                            <span className={`text-2xl md:text-3xl font-black tracking-tight ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                                {summaryMetrics.active}
                            </span>
                            <span className={`text-[11px] font-medium ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>publicly shared</span>
                        </div>
                    </div>

                    {/* Card 3: Not Shared */}
                    <div
                        onClick={() => setStatusFilter("ready")}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === "ready"
                            ? isDarkMode
                                ? "bg-[#161822] border-amber-500/50 shadow-lg shadow-amber-500/5"
                                : "bg-amber-50/50 border-amber-400 shadow-sm"
                            : isDarkMode
                                ? "bg-[#141620] border-[#222636] hover:border-white/20"
                                : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                Not Shared
                            </span>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDarkMode
                                ? "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                                }`}>
                                <Link2Off className="w-4 h-4 stroke-[2]" />
                            </div>
                        </div>
                        <div className="mt-2.5 flex items-baseline gap-2">
                            <span className={`text-2xl md:text-3xl font-black tracking-tight ${isDarkMode ? "text-gray-400" : "text-gray-900"}`}>
                                {summaryMetrics.notShared}
                            </span>
                            <span className={`text-[11px] font-medium ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>awaiting link</span>
                        </div>
                    </div>
                </div>

                {/* ════════════════ 4. DESKTOP 5-COLUMN TABLE ════════════════ */}
                <div
                    className={`hidden md:block rounded-2xl border ${isDarkMode ? "bg-[#141620] border-[#222636]" : "bg-white border-gray-200"
                        } p-4 shadow-2xl transition-colors`}
                >
                    <div className="max-h-[70vh] overflow-y-auto relative rounded-xl">
                        <table className="w-full border-separate border-spacing-0 text-sm">
                            <thead
                                className={`sticky top-0 z-[10] ${isDarkMode
                                    ? "bg-[#1A1D28] text-gray-300 border-[#222636]"
                                    : "bg-gray-100 text-gray-700 border-gray-200"
                                    } border-b`}
                            >
                                <tr className="font-bold text-xs tracking-wider uppercase">
                                    {/* 1. Poster */}
                                    <th className={`p-3.5 text-left border-b ${isDarkMode ? "border-[#222636]" : "border-gray-200"} w-[32%]`}>
                                        Poster
                                    </th>

                                    {/* 2. Shareable Link */}
                                    <th className={`p-3.5 text-left border-b ${isDarkMode ? "border-[#222636]" : "border-gray-200"} w-[30%]`}>
                                        Shareable Link
                                    </th>

                                    {/* 3. Created Date */}
                                    <th className={`p-3.5 text-left border-b ${isDarkMode ? "border-[#222636]" : "border-gray-200"} w-[16%]`}>
                                        Created Date
                                    </th>

                                    {/* 4. Link Status */}
                                    <th className={`p-3.5 text-center border-b ${isDarkMode ? "border-[#222636]" : "border-gray-200"} w-[10%]`}>
                                        Link Status
                                    </th>

                                    {/* 5. Actions */}
                                    <th className={`p-3.5 text-center border-b ${isDarkMode ? "border-[#222636]" : "border-gray-200"} w-[12%]`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <OrangeSpinner size={42} />
                                                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading poster links...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-1">
                                                    <Link2 className="w-7 h-7 stroke-[1.8]" />
                                                </div>
                                                <p className="text-base font-bold">
                                                    {searchQuery || statusFilter !== "all"
                                                        ? "No matching posters found"
                                                        : "No posters created yet"}
                                                </p>
                                                <p className={`text-xs max-w-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                                    {searchQuery || statusFilter !== "all"
                                                        ? "Try clearing your search query or adjusting your status filter."
                                                        : "Create your first poster or generate a public link to share with clients."}
                                                </p>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => router.push("/pages/createPoster")}
                                                        className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition"
                                                    >
                                                        Create Poster
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRows.map((row) => {
                                        const isCopied = copiedUrl === row.url;
                                        const isMenuOpen = activeMenuKey === row.key;
                                        const isRenaming = editingKey === row.key;
                                        const hasActiveLink = Boolean(row.hasLink && row.status === "active" && row.url);

                                        return (
                                            <tr
                                                key={row.key}
                                                className={`transition-colors border-b ${isDarkMode
                                                    ? "border-white/[0.05] hover:bg-white/[0.02]"
                                                    : "border-gray-100 hover:bg-gray-50/80"
                                                    } ${row.status === "revoked" ? "opacity-75" : ""}`}
                                            >
                                                {/* ── 1. Poster (Thumbnail + Title + Rename) ── */}
                                                <td className="p-3.5 font-medium">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {/* Thumbnail */}
                                                        {row.productImage ? (
                                                            <div
                                                                onClick={() =>
                                                                    setPreviewImage({
                                                                        src: getPosterImageSrc(row.productImage!),
                                                                        title: row.name,
                                                                    })
                                                                }
                                                                className="relative group cursor-pointer flex-shrink-0"
                                                                title="Click to view full image"
                                                            >
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={getPosterImageSrc(row.productImage)}
                                                                    alt={row.name}
                                                                    className="w-11 h-11 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform shadow-sm"
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity">
                                                                    <Maximize2 className="w-4 h-4 stroke-[2] text-white" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 text-orange-500">
                                                                <Sparkles className="w-5 h-5 stroke-[2]" />
                                                            </div>
                                                        )}

                                                        {/* Title & Product Info */}
                                                        <div className="min-w-0 flex-1">
                                                            {isRenaming ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <input
                                                                        type="text"
                                                                        value={editingName}
                                                                        onChange={(e) => setEditingName(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") handleSaveRename(row);
                                                                            else if (e.key === "Escape") handleCancelRename();
                                                                        }}
                                                                        disabled={isSavingRename}
                                                                        autoFocus
                                                                        className={`px-2.5 py-1 text-xs rounded-lg border outline-none font-bold ${isDarkMode
                                                                            ? "bg-[#1B1E26] border-orange-500 text-white"
                                                                            : "bg-white border-orange-500 text-gray-900"
                                                                            } w-full max-w-[220px]`}
                                                                    />
                                                                    <button
                                                                        onClick={() => handleSaveRename(row)}
                                                                        disabled={isSavingRename}
                                                                        className="p-1 text-emerald-400 hover:text-emerald-300"
                                                                        title="Save Name"
                                                                    >
                                                                        <Check className="w-[18px] h-[18px] stroke-[2]" />
                                                                    </button>
                                                                    <button
                                                                        onClick={handleCancelRename}
                                                                        disabled={isSavingRename}
                                                                        className={`p-1 ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
                                                                        title="Cancel"
                                                                    >
                                                                        <X className="w-[18px] h-[18px] stroke-[2]" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 group/title">
                                                                    <span
                                                                        className="truncate font-bold text-sm hover:text-orange-400 transition cursor-pointer max-w-[240px]"
                                                                        title={row.name}
                                                                        onClick={() => {
                                                                            if (hasActiveLink && row.url) {
                                                                                window.open(row.url, "_blank");
                                                                            } else if (row.posterId) {
                                                                                router.push(`/pages/createPoster?posterId=${row.posterId}&edit=true`);
                                                                            } else if (row.token) {
                                                                                router.push(`/pages/view?token=${row.token}&edit=true`);
                                                                            }
                                                                        }}
                                                                    >
                                                                        {row.name}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleStartRename(row)}
                                                                        className="opacity-0 group-hover/title:opacity-100 p-0.5 text-gray-400 hover:text-orange-400 transition"
                                                                        title="Rename poster"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {row.productName && row.productName !== row.name && (
                                                                <p className={`text-[11px] truncate max-w-[220px] ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                                                    {row.productName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* ── 2. Shareable Link (Actual URL + Copy Icon or Not Shared) ── */}
                                                <td className="p-3.5 text-xs">
                                                    {hasActiveLink && row.url ? (
                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={row.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`font-mono text-xs ${isDarkMode ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-700"} hover:underline truncate max-w-[210px] flex items-center gap-1`}
                                                                title={row.url}
                                                            >
                                                                <ExternalLink className={`w-3 h-3 stroke-[2] shrink-0 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`} />
                                                                <span className="truncate">{formatShortUrl(row.url)}</span>
                                                            </a>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopyLink(row.url)}
                                                                className={`p-1.5 rounded-lg border transition cursor-pointer shrink-0 ${isCopied
                                                                    ? isDarkMode
                                                                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                                                        : "border-emerald-300 bg-emerald-50 text-emerald-700"
                                                                    : isDarkMode
                                                                        ? "border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                                                                        : "border-gray-200 text-gray-600 hover:bg-gray-100"
                                                                    }`}
                                                                title={isCopied ? "Copied!" : "Copy URL"}
                                                            >
                                                                {isCopied ? (
                                                                    <Check className="w-3.5 h-3.5 stroke-[2]" />
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5 stroke-[2]" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    ) : row.status === "revoked" ? (
                                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${isDarkMode
                                                            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                                            : "text-amber-800 bg-amber-50 border-amber-200"
                                                            }`}>
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            <span>Link Revoked</span>
                                                        </span>
                                                    ) : row.status === "expired" ? (
                                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${isDarkMode
                                                            ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                                                            : "text-rose-700 bg-rose-50 border-rose-200"
                                                            }`}>
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>Link Expired</span>
                                                        </span>
                                                    ) : (
                                                        /* Requirement 8: Clear Not Shared State */
                                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${isDarkMode
                                                            ? "text-gray-400 bg-white/[0.03] border-white/[0.06]"
                                                            : "text-gray-700 bg-gray-100 border-gray-200"
                                                            }`}>
                                                            <Link2Off className={`w-3.5 h-3.5 ${isDarkMode ? "text-gray-500" : "text-gray-600"}`} />
                                                            <span>Not Shared</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* ── 3. Created Date (Date + Optional Expiry Subtitle) ── */}
                                                <td className="p-3.5 text-xs">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-semibold">{formatDate(row.createdAt)}</span>
                                                        {row.expiresAt && row.status === "active" ? (
                                                            <div className={`flex items-center gap-1 text-[11px] ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                                                <span>Expires: {formatDate(row.expiresAt)}</span>
                                                                <button
                                                                    onClick={() => handleOpenSettingsModal(row)}
                                                                    className={`p-0.5 ${isDarkMode ? "hover:text-orange-400" : "hover:text-orange-600"} transition`}
                                                                    title="Configure Expiry"
                                                                >
                                                                    <Calendar className="w-3 h-3 stroke-[2]" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className={`text-[11px] ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>
                                                                {row.hasLink ? "Never expires" : "No link"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* ── 4. Link Status ── */}
                                                <td className="p-3.5 text-center">
                                                    {row.status === "active" ? (
                                                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${isDarkMode
                                                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            }`}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                            Active
                                                        </span>
                                                    ) : row.status === "expired" ? (
                                                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${isDarkMode
                                                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                                            }`}>
                                                            <Clock className="w-3 h-3 stroke-[2]" />
                                                            Expired
                                                        </span>
                                                    ) : row.status === "revoked" ? (
                                                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${isDarkMode
                                                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                                            : "bg-amber-50 text-amber-800 border-amber-200"
                                                            }`}>
                                                            <AlertCircle className="w-3 h-3 stroke-[2]" />
                                                            Revoked
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${isDarkMode
                                                            ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                                            : "bg-gray-100 text-gray-700 border-gray-200"
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? "bg-gray-500" : "bg-gray-400"}`}></span>
                                                            Not Shared
                                                        </span>
                                                    )}

                                                    {row.isPublishedToMarketplace && (
                                                        <div className="mt-1">
                                                            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${isDarkMode
                                                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                                                : "text-emerald-700 bg-emerald-50 border-emerald-200"
                                                                }`}>
                                                                <Store className="w-3 h-3 stroke-[2]" /> Store
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* ── 5. Actions (View, Copy, Share, 3-Dot Menu) ── */}
                                                <td className="p-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {/* View */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (hasActiveLink && row.url) {
                                                                    window.open(row.url, "_blank");
                                                                } else if (row.posterId) {
                                                                    router.push(`/pages/createPoster?posterId=${row.posterId}&edit=true`);
                                                                } else if (row.token) {
                                                                    router.push(`/pages/view?token=${row.token}&edit=true`);
                                                                }
                                                            }}
                                                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition cursor-pointer ${isDarkMode
                                                                ? "border-white/10 text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                                                                : "border-gray-200 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
                                                                }`}
                                                            title={hasActiveLink ? "Open Public Preview" : "Edit Poster"}
                                                        >
                                                            <Eye className="w-[18px] h-[18px] stroke-[2]" />
                                                        </button>

                                                        {/* Generate Link / Link action */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenGenerateModal(row, Boolean(row.hasLink))}
                                                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition cursor-pointer ${hasActiveLink
                                                                ? isDarkMode
                                                                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                                                                    : "border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                                                                : isDarkMode
                                                                    ? "border-white/10 text-gray-300 hover:text-[#FF5722] hover:bg-orange-500/10 hover:border-[#FF5722]/30"
                                                                    : "border-gray-200 text-gray-600 hover:text-[#FF5722] hover:bg-orange-50 hover:border-[#FF5722]/30"
                                                                }`}
                                                            title={hasActiveLink ? "Manage Shareable Link" : "Generate Shareable Link"}
                                                        >
                                                            <Link2 className="w-[18px] h-[18px] stroke-[2]" />
                                                        </button>

                                                        {/* Copy */}
                                                        <button
                                                            type="button"
                                                            onClick={() => hasActiveLink && handleCopyLink(row.url)}
                                                            disabled={!hasActiveLink}
                                                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${hasActiveLink
                                                                ? isDarkMode
                                                                    ? "border-white/10 text-gray-300 hover:text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/30 cursor-pointer"
                                                                    : "border-gray-200 text-gray-600 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 cursor-pointer"
                                                                : isDarkMode
                                                                    ? "opacity-35 border-white/[0.06] text-gray-600 cursor-not-allowed"
                                                                    : "opacity-40 border-gray-200 text-gray-400 cursor-not-allowed"
                                                                }`}
                                                            title={hasActiveLink ? "Copy Shareable Link" : "No link to copy"}
                                                        >
                                                            <Copy className="w-[18px] h-[18px] stroke-[2]" />
                                                        </button>

                                                        {/* Revoke or Regenerate Direct Action */}
                                                        {hasActiveLink ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenRevokeModal(row)}
                                                                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition cursor-pointer ${isDarkMode
                                                                    ? "border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
                                                                    : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                                                    }`}
                                                                title="Revoke Share Link"
                                                            >
                                                                <Link2Off className="w-[18px] h-[18px] stroke-[2]" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenGenerateModal(row, Boolean(row.hasLink))}
                                                                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition cursor-pointer ${isDarkMode
                                                                    ? "border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20"
                                                                    : "border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100"
                                                                    }`}
                                                                title={row.hasLink ? "Regenerate Share Link" : "Generate Share Link"}
                                                            >
                                                                <RotateCw className="w-[18px] h-[18px] stroke-[2]" />
                                                            </button>
                                                        )}

                                                        {/* Share */}
                                                        <button
                                                            type="button"
                                                            onClick={() => hasActiveLink && handleShare(row.url, row.name)}
                                                            disabled={!hasActiveLink}
                                                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${hasActiveLink
                                                                ? isDarkMode
                                                                    ? "border-white/10 text-gray-300 hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30 cursor-pointer"
                                                                    : "border-gray-200 text-gray-600 hover:text-sky-600 hover:bg-sky-50 hover:border-sky-200 cursor-pointer"
                                                                : isDarkMode
                                                                    ? "opacity-35 border-white/[0.06] text-gray-600 cursor-not-allowed"
                                                                    : "opacity-40 border-gray-200 text-gray-400 cursor-not-allowed"
                                                                }`}
                                                            title={hasActiveLink ? "Share Link" : "Generate a link to share"}
                                                        >
                                                            <Share2 className="w-[18px] h-[18px] stroke-[2]" />
                                                        </button>

                                                        {/* Three-Dot Dropdown */}
                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleToggleMenu(e, row)}
                                                                className={`action-menu-trigger w-8 h-8 flex items-center justify-center rounded-lg border transition cursor-pointer ${isMenuOpen
                                                                    ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                                                    : isDarkMode
                                                                        ? "border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.04]"
                                                                        : "border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                                    }`}
                                                                title="More Actions"
                                                                aria-expanded={isMenuOpen}
                                                            >
                                                                <MoreVertical className="w-[18px] h-[18px] stroke-[2]" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ════════════════ 5. MOBILE RESPONSIVE CARDS ════════════════ */}
                <div className="md:hidden flex flex-col gap-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-3">
                            <OrangeSpinner size={40} />
                            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading poster links...</p>
                        </div>
                    ) : paginatedRows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                            <p className="text-sm font-semibold">No poster links found</p>
                        </div>
                    ) : (
                        paginatedRows.map((row) => {
                            const isCopied = copiedUrl === row.url;
                            const hasActiveLink = Boolean(row.hasLink && row.status === "active" && row.url);

                            return (
                                <div
                                    key={row.key}
                                    className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-[#141620] border-[#222636]" : "bg-white border-gray-200 shadow-sm"
                                        }`}
                                >
                                    {/* Poster Row */}
                                    <div className="flex items-start gap-3">
                                        {row.productImage ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={getPosterImageSrc(row.productImage)}
                                                alt={row.name}
                                                className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0 cursor-pointer"
                                                onClick={() =>
                                                    setPreviewImage({
                                                        src: getPosterImageSrc(row.productImage!),
                                                        title: row.name,
                                                    })
                                                }
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 text-orange-500">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">{row.name}</p>
                                            {row.productName && row.productName !== row.name && (
                                                <p className={`text-[11px] truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{row.productName}</p>
                                            )}

                                            {/* Link state */}
                                            {hasActiveLink && row.url ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <a
                                                        href={row.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`font-mono text-xs ${isDarkMode ? "text-orange-400" : "text-orange-600"} hover:underline truncate max-w-[170px]`}
                                                    >
                                                        {formatShortUrl(row.url)}
                                                    </a>
                                                    <button
                                                        onClick={() => handleCopyLink(row.url)}
                                                        className={`p-0.5 ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                                                        title="Copy URL"
                                                    >
                                                        {isCopied ? <Check className={`w-3.5 h-3.5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1 text-[11px] mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>
                                                    <Link2Off className={`w-3 h-3 ${isDarkMode ? "text-gray-500" : "text-gray-600"}`} /> Not Shared
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dates & Status */}
                                    <div className={`flex items-center justify-between gap-2 mt-3 pt-2.5 border-t text-xs ${isDarkMode ? "border-white/[0.06]" : "border-gray-100"}`}>
                                        <div className={`flex flex-col text-[11px] ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                            <span>Created: {formatDate(row.createdAt)}</span>
                                            {row.expiresAt && <span>Expires: {formatDate(row.expiresAt)}</span>}
                                        </div>

                                        {/* Status */}
                                        <div>
                                            {row.status === "active" ? (
                                                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border ${isDarkMode
                                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    }`}>
                                                    Active
                                                </span>
                                            ) : row.status === "expired" ? (
                                                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border ${isDarkMode
                                                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                                    }`}>
                                                    Expired
                                                </span>
                                            ) : row.status === "revoked" ? (
                                                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border ${isDarkMode
                                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                                    }`}>
                                                    Revoked
                                                </span>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border ${isDarkMode
                                                    ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                                    : "bg-gray-100 text-gray-700 border-gray-200"
                                                    }`}>
                                                    Not Shared
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className={`flex items-center justify-end gap-2 mt-3 pt-2 border-t ${isDarkMode ? "border-white/[0.06]" : "border-gray-100"}`}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (hasActiveLink && row.url) window.open(row.url, "_blank");
                                                else if (row.posterId) router.push(`/pages/createPoster?posterId=${row.posterId}&edit=true`);
                                                else if (row.token) router.push(`/pages/view?token=${row.token}&edit=true`);
                                            }}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${isDarkMode ? "border-white/10 text-gray-300 hover:text-white hover:bg-white/[0.06]" : "border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                }`}
                                            title="View"
                                        >
                                            <Eye className="w-[18px] h-[18px] stroke-[2]" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => hasActiveLink && handleCopyLink(row.url)}
                                            disabled={!hasActiveLink}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${hasActiveLink
                                                ? isDarkMode
                                                    ? "border-white/10 text-gray-300 hover:text-orange-400 hover:bg-orange-500/10 cursor-pointer"
                                                    : "border-gray-200 text-gray-600 hover:text-orange-600 hover:bg-orange-50 cursor-pointer"
                                                : isDarkMode
                                                    ? "opacity-35 border-white/[0.06] text-gray-600 cursor-not-allowed"
                                                    : "opacity-40 border-gray-200 text-gray-400 cursor-not-allowed"
                                                }`}
                                            title="Copy"
                                        >
                                            <Copy className="w-[18px] h-[18px] stroke-[2]" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => hasActiveLink && handleShare(row.url, row.name)}
                                            disabled={!hasActiveLink}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${hasActiveLink
                                                ? isDarkMode
                                                    ? "border-white/10 text-gray-300 hover:text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                                                    : "border-gray-200 text-gray-600 hover:text-sky-600 hover:bg-sky-50 cursor-pointer"
                                                : isDarkMode
                                                    ? "opacity-35 border-white/[0.06] text-gray-600 cursor-not-allowed"
                                                    : "opacity-40 border-gray-200 text-gray-400 cursor-not-allowed"
                                                }`}
                                            title="Share"
                                        >
                                            <Share2 className="w-[18px] h-[18px] stroke-[2]" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenGenerateModal(row, Boolean(row.hasLink))}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition cursor-pointer ${hasActiveLink
                                                ? isDarkMode
                                                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                                                    : "border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                                                : isDarkMode
                                                    ? "border-white/10 text-gray-300 hover:text-[#FF5722] hover:bg-orange-500/10 hover:border-[#FF5722]/30"
                                                    : "border-gray-200 text-gray-600 hover:text-[#FF5722] hover:bg-orange-50 hover:border-[#FF5722]/30"
                                                }`}
                                            title={hasActiveLink ? "Regenerate Share Link" : "Generate Share Link"}
                                        >
                                            <Link2 className="w-[18px] h-[18px] stroke-[2]" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSingleDelete(row)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ════════════════ MODAL: PAGE-LEVEL POSTER PICKER ════════════════ */}
            <Modal isOpen={posterSelectorOpen} onClose={() => setPosterSelectorOpen(false)}>
                <div
                    className={`p-5 sm:p-6 max-w-lg w-full rounded-2xl ${isDarkMode ? "bg-[#16181E] text-white" : "bg-white text-gray-900"
                        }`}
                >
                    <div className={`flex items-center justify-between pb-3 border-b ${isDarkMode ? "border-white/[0.08]" : "border-gray-200"}`}>
                        <div>
                            <h2 className="text-base font-bold flex items-center gap-2">
                                <Link2 className="w-[18px] h-[18px] stroke-[2] text-orange-500" />
                                <span>Generate Shareable Link</span>
                            </h2>
                            <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Select a poster to generate a public shareable link</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPosterSelectorOpen(false)}
                            className={`${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"} cursor-pointer`}
                        >
                            <X className="w-5 h-5 stroke-[2]" />
                        </button>
                    </div>

                    {/* Search posters in selector */}
                    <div className="mt-4 relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filter your posters..."
                            value={posterSearchQuery}
                            onChange={(e) => setPosterSearchQuery(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none border transition ${isDarkMode
                                ? "bg-[#1B1E26] border-white/10 text-white placeholder-gray-500 focus:border-orange-500"
                                : "bg-gray-50 border-gray-300 text-gray-900 focus:border-orange-500"
                                }`}
                        />
                    </div>

                    {/* Posters list */}
                    <div className="mt-3 max-h-[50vh] overflow-y-auto space-y-2 pr-1">
                        {selectablePosters.length === 0 ? (
                            <div className={`py-8 text-center text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                {rows.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <p>You haven&apos;t created any posters yet.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPosterSelectorOpen(false);
                                                router.push("/pages/createPoster");
                                            }}
                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white"
                                        >
                                            Create Poster
                                        </button>
                                    </div>
                                ) : (
                                    <p>No matching posters found.</p>
                                )}
                            </div>
                        ) : (
                            selectablePosters.map((row) => (
                                <div
                                    key={row.key}
                                    onClick={() => {
                                        setPosterSelectorOpen(false);
                                        handleOpenGenerateModal(row);
                                    }}
                                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${isDarkMode
                                        ? "border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 bg-[#1B1E26]"
                                        : "border-gray-200 hover:border-orange-400 hover:bg-orange-50/50 bg-gray-50"
                                        }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {row.productImage ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={getPosterImageSrc(row.productImage)}
                                                alt={row.name}
                                                className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center flex-shrink-0">
                                                <Sparkles className="w-4 h-4 stroke-[2]" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold truncate max-w-[200px] sm:max-w-[240px]">{row.name}</p>
                                            <span className={`text-[11px] ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                                {row.hasLink && row.status === "active" ? (
                                                    <span className={`${isDarkMode ? "text-emerald-400" : "text-emerald-600"} font-medium`}>Link active</span>
                                                ) : (
                                                    <span className={isDarkMode ? "text-gray-500" : "text-gray-600"}>Not Shared</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-500 hover:bg-orange-600 text-white shadow-sm flex-shrink-0 transition"
                                    >
                                        {row.hasLink ? "Regenerate" : "Select"}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Modal>

            {/* ════════════════ MODAL: SHARE LINK (POPUP) ════════════════ */}
            <ShareLinkModal
                isOpen={generateModalOpen}
                onClose={() => {
                    setGenerateModalOpen(false);
                    setTargetPosterForGenerate(null);
                }}
                poster={
                    targetPosterForGenerate
                        ? {
                            _id:
                                targetPosterForGenerate.posterId ||
                                (Array.isArray(targetPosterForGenerate.posters) &&
                                    targetPosterForGenerate.posters[0]
                                    ? typeof targetPosterForGenerate.posters[0] === "string"
                                        ? targetPosterForGenerate.posters[0]
                                        : (targetPosterForGenerate.posters[0] as { _id?: string })._id
                                    : ""),
                            posterId: targetPosterForGenerate.posterId,
                            name: targetPosterForGenerate.name,
                            poster_name: targetPosterForGenerate.name,
                            poster_title: targetPosterForGenerate.name,
                            product_name: targetPosterForGenerate.productName,
                            product_image: targetPosterForGenerate.productImage,
                            productImage: targetPosterForGenerate.productImage,
                            isPublishedToMarketplace: Boolean(targetPosterForGenerate.isPublishedToMarketplace),
                            hasLink: Boolean(targetPosterForGenerate.hasLink),
                            expiresAt: targetPosterForGenerate.expiresAt,
                            token: targetPosterForGenerate.status === "revoked" ? undefined : targetPosterForGenerate.token,
                            url: targetPosterForGenerate.status === "revoked" ? undefined : targetPosterForGenerate.url,
                            status: targetPosterForGenerate.status,
                            isRevoked: targetPosterForGenerate.isRevoked,
                        }
                        : null
                }
                posterIds={
                    targetPosterForGenerate?.posterId
                        ? [targetPosterForGenerate.posterId]
                        : Array.isArray(targetPosterForGenerate?.posters)
                            ? targetPosterForGenerate.posters
                                .map((p) => {
                                    if (typeof p === "string") return p;
                                    if (p && typeof p === "object" && "_id" in p) {
                                        return String((p as { _id?: string })._id || "");
                                    }
                                    return "";
                                })
                                .filter(Boolean)
                            : []
                }
                initialName={targetPosterForGenerate?.name || targetPosterForGenerate?.productName}
                initialExpiryDate={
                    targetPosterForGenerate?.expiresAt
                        ? new Date(targetPosterForGenerate.expiresAt).toISOString().split("T")[0]
                        : undefined
                }
                initialPublished={Boolean(targetPosterForGenerate?.isPublishedToMarketplace)}
                isRegenerate={isRegenerateModal || targetPosterForGenerate?.status === "revoked" || Boolean(targetPosterForGenerate?.isRevoked)}
                onSuccess={async (result) => {
                    clearApiCache();
                    if (targetPosterForGenerate) {
                        setRows((prev) =>
                            prev.map((r) =>
                                r.key === targetPosterForGenerate.key
                                    ? {
                                        ...r,
                                        hasLink: !result.isRevoked,
                                        token: result.isRevoked ? undefined : result.token,
                                        url: result.isRevoked ? undefined : result.url,
                                        status: (result.status as "active" | "expired" | "revoked" | "ready") || (result.isRevoked ? "revoked" : "active"),
                                        isRevoked: Boolean(result.isRevoked),
                                        isExpired: false,
                                        expiresAt: result.expiresAt ?? r.expiresAt,
                                        isPublishedToMarketplace:
                                            result.isPublishedToMarketplace ?? r.isPublishedToMarketplace,
                                    }
                                    : r
                            )
                        );
                    }
                    await fetchData(true);
                }}
            />

            {/* ════════════════ MODAL: LINK SETTINGS & EXPIRY ════════════════ */}
            <Modal isOpen={Boolean(selectedLinkForSettings)} onClose={() => setSelectedLinkForSettings(null)}>
                <div
                    className={`p-6 max-w-md w-full rounded-2xl ${isDarkMode ? "bg-[#16181E] text-white" : "bg-white text-gray-900"
                        }`}
                >
                    <div className={`flex items-center justify-between pb-3 border-b ${isDarkMode ? "border-white/[0.08]" : "border-gray-200"}`}>
                        <h2 className="text-base font-bold flex items-center gap-2">
                            <Calendar className="w-[18px] h-[18px] stroke-[2] text-orange-500" />
                            <span>Manage Expiry & Link Details</span>
                        </h2>
                        <button
                            type="button"
                            onClick={() => setSelectedLinkForSettings(null)}
                            className={`${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"} cursor-pointer`}
                        >
                            <X className="w-5 h-5 stroke-[2]" />
                        </button>
                    </div>

                    <div className="mt-4 space-y-4">
                        <div>
                            <label className={`text-xs font-semibold block mb-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                                Link Title / Name
                            </label>
                            <input
                                type="text"
                                value={editLinkName}
                                onChange={(e) => setEditLinkName(e.target.value)}
                                placeholder="Enter link display name..."
                                className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition ${isDarkMode
                                    ? "bg-[#1B1E26] border-white/10 text-white focus:border-orange-500"
                                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-orange-500"
                                    }`}
                            />
                        </div>

                        <div>
                            <label className={`text-xs font-semibold block mb-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                                Expiration Options
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setExpiryPresetDays(-1)}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${editExpiryDate === ""
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold"
                                        : isDarkMode
                                            ? "border-white/10 hover:border-emerald-500 text-gray-200"
                                            : "border-gray-200 hover:border-emerald-500 text-gray-800"
                                        }`}
                                >
                                    Never
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExpiryPresetDays(1)}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${isDarkMode
                                        ? "border-white/10 hover:border-orange-500 hover:bg-orange-500/10 text-gray-200"
                                        : "border-gray-200 hover:border-orange-500 hover:bg-orange-50 text-gray-800"
                                        }`}
                                >
                                    1 Day
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExpiryPresetDays(7)}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${isDarkMode
                                        ? "border-white/10 hover:border-orange-500 hover:bg-orange-500/10 text-gray-200"
                                        : "border-gray-200 hover:border-orange-500 hover:bg-orange-50 text-gray-800"
                                        }`}
                                >
                                    7 Days
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExpiryPresetDays(30)}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${isDarkMode
                                        ? "border-white/10 hover:border-orange-500 hover:bg-orange-500/10 text-gray-200"
                                        : "border-gray-200 hover:border-orange-500 hover:bg-orange-50 text-gray-800"
                                        }`}
                                >
                                    30 Days
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className={`text-xs font-semibold block mb-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                                Custom Expiration Date
                            </label>
                            <input
                                type="date"
                                value={editExpiryDate}
                                onChange={(e) => setEditExpiryDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition ${isDarkMode
                                    ? "bg-[#1B1E26] border-white/10 text-white focus:border-orange-500"
                                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-orange-500"
                                    }`}
                            />
                            <p className={`text-[11px] mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                {editExpiryDate
                                    ? `Expires on ${formatDate(editExpiryDate)} at 23:59.`
                                    : "Never expires. Link remains active until revoked."}
                            </p>
                        </div>

                        <div className={`flex items-center justify-end gap-2.5 pt-3 border-t ${isDarkMode ? "border-white/[0.08]" : "border-gray-200"}`}>
                            <button
                                type="button"
                                onClick={() => setSelectedLinkForSettings(null)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${isDarkMode
                                    ? "border-white/10 text-gray-300 hover:bg-white/[0.04]"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveLinkSettings}
                                disabled={isSavingSettings}
                                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition disabled:opacity-60"
                            >
                                {isSavingSettings ? "Saving..." : "Save Settings"}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ════════════════ MODAL: REVOKE CONFIRMATION ════════════════ */}
            <Modal isOpen={isRevokeModalOpen} onClose={() => setIsRevokeModalOpen(false)}>
                <ConfirmationPopUp
                    message={`Are you sure you want to revoke the shareable link for "${revokeTarget?.name}"? The public URL will immediately become inaccessible.`}
                    onYes={confirmRevokeLink}
                    onNo={() => setIsRevokeModalOpen(false)}
                    deleting={isRevoking}
                />
            </Modal>

            {/* ════════════════ MODAL: DELETE CONFIRMATION ════════════════ */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <ConfirmationPopUp
                    message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                    onYes={confirmSingleDelete}
                    onNo={() => setIsDeleteModalOpen(false)}
                />
            </Modal>

            {/* ════════════════ MODAL: ZOOM THUMBNAIL PREVIEW ════════════════ */}
            <Modal isOpen={Boolean(previewImage)} onClose={() => setPreviewImage(null)}>
                {previewImage && (
                    <div className="p-4 max-w-lg w-full flex flex-col items-center">
                        <div className="flex items-center justify-between w-full pb-2 mb-2 border-b border-white/10">
                            <p className="text-xs font-bold truncate text-white">{previewImage.title}</p>
                            <button onClick={() => setPreviewImage(null)} className="text-gray-400 hover:text-white cursor-pointer" title="Close">
                                <X className="w-5 h-5 stroke-[2]" />
                            </button>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewImage.src}
                            alt={previewImage.title}
                            className="max-h-[70vh] rounded-xl object-contain shadow-2xl border border-white/10"
                        />
                    </div>
                )}
            </Modal>
            {/* ════════════════ FIXED POPUP: THREE-DOT ACTION MENU (PORTAL) ════════════════ */}
            {isMounted && typeof document !== "undefined" && activeMenuKey && menuPosition && activeMenuRow && createPortal(
                <div
                    className={`action-menu-popup fixed w-48 rounded-xl border shadow-2xl z-[99999] py-1.5 text-xs font-medium backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 ${
                        isDarkMode
                            ? "bg-[#1B1E26]/95 border-white/10 text-gray-200 shadow-black/60"
                            : "bg-white/95 border-gray-200 text-gray-700 shadow-xl"
                    }`}
                    style={{
                        top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
                        bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
                        left: `${menuPosition.left}px`,
                        transformOrigin: menuPosition.transformOrigin,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 1. Generate or Regenerate Link */}
                    <button
                        type="button"
                        onClick={() => {
                            const target = activeMenuRow;
                            closeActionMenu();
                            handleOpenGenerateModal(target, Boolean(target.hasLink));
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 transition text-left cursor-pointer ${
                            isDarkMode
                                ? "hover:bg-white/[0.06] hover:text-orange-400"
                                : "hover:bg-orange-50 hover:text-orange-600"
                        }`}
                    >
                        <RotateCw className="w-[18px] h-[18px] stroke-[2] text-orange-400 shrink-0" />
                        <span>{activeMenuRow.hasLink ? "Regenerate Link" : "Generate Link"}</span>
                    </button>

                    {/* 2. Edit Poster */}
                    <button
                        type="button"
                        onClick={() => {
                            const target = activeMenuRow;
                            closeActionMenu();
                            if (target.posterId) {
                                router.push(`/pages/createPoster?posterId=${target.posterId}&edit=true`);
                            } else if (target.token) {
                                router.push(`/pages/view?token=${target.token}&edit=true`);
                            }
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 transition text-left cursor-pointer ${
                            isDarkMode
                                ? "hover:bg-white/[0.06] hover:text-orange-400"
                                : "hover:bg-orange-50 hover:text-orange-600"
                        }`}
                    >
                        <Pencil className="w-[18px] h-[18px] stroke-[2] text-orange-400 shrink-0" />
                        <span>Edit Poster</span>
                    </button>

                    {/* 3. Link Settings & Expiry */}
                    {activeMenuRow.hasLink && (
                        <button
                            type="button"
                            onClick={() => {
                                const target = activeMenuRow;
                                closeActionMenu();
                                handleOpenSettingsModal(target);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 transition text-left cursor-pointer ${
                                isDarkMode
                                    ? "hover:bg-white/[0.06] hover:text-sky-400"
                                    : "hover:bg-sky-50 hover:text-sky-600"
                            }`}
                        >
                            <Calendar className="w-[18px] h-[18px] stroke-[2] text-sky-400 shrink-0" />
                            <span>Link Settings & Expiry</span>
                        </button>
                    )}

                    {/* 4. Revoke Link */}
                    {activeMenuRow.hasLink && activeMenuRow.status === "active" && (
                        <button
                            type="button"
                            onClick={() => {
                                const target = activeMenuRow;
                                closeActionMenu();
                                handleOpenRevokeModal(target);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 transition text-left text-amber-500 cursor-pointer ${
                                isDarkMode ? "hover:bg-white/[0.06]" : "hover:bg-amber-50"
                            }`}
                        >
                            <AlertCircle className="w-[18px] h-[18px] stroke-[2] text-amber-500 shrink-0" />
                            <span>Revoke Link</span>
                        </button>
                    )}

                    {/* 5. Publish to Marketplace */}
                    {activeMenuRow.hasLink && (
                        <button
                            type="button"
                            onClick={() => {
                                const target = activeMenuRow;
                                closeActionMenu();
                                handleDirectPublishLink(target);
                            }}
                            disabled={publishingToken === activeMenuRow.token}
                            className={`w-full flex items-center gap-2 px-3 py-2 transition text-left cursor-pointer ${
                                isDarkMode
                                    ? "hover:bg-white/[0.06] hover:text-emerald-400"
                                    : "hover:bg-emerald-50 hover:text-emerald-600"
                            }`}
                        >
                            <Store className="w-[18px] h-[18px] stroke-[2] text-emerald-400 shrink-0" />
                            <span>{activeMenuRow.isPublishedToMarketplace ? "Unpublish from Store" : "Publish to Store"}</span>
                        </button>
                    )}

                    {/* 6. Delete */}
                    <button
                        type="button"
                        onClick={() => {
                            const target = activeMenuRow;
                            closeActionMenu();
                            handleSingleDelete(target);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition text-left border-t border-white/[0.06] cursor-pointer"
                    >
                        <Trash2 className="w-[18px] h-[18px] stroke-[2] text-red-400 shrink-0" />
                        <span>Delete</span>
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

export default UserPosterLinks;
