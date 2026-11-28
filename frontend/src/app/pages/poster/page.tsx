"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { isAxiosError } from "axios";
import apiClient, { clearApiCache } from "@utilis/apiClient";
import { toast } from "react-toastify";
import { Heart } from "lucide-react";
import { getImageFromIndexedDB } from "@utilis/indexDB";
import PosterFilterPanel from "@components/PosterFilterPanel";
import { handleAuthErrorAndToast } from "@utilis/catchhandle";
import ShareLinkModal from "@components/ShareLinkModal";
import CustomShortUrlModal from "@components/CustomShortUrlModal";
import QrCodeModal from "@components/QrCodeModal";
import { ConfirmationPopUp } from "@components/ConfirmationPopUp";
import { useVideoControls } from "@utilis/videoControls";
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import Header from "@components/header/page";
import { useUser } from "@context/UserContext";
import { Poster, PosterFilters } from "@app-types/posterHomepage";
import { useAutoPlayVideos } from "@utilis/VideoPoster";
import {
    Pencil,
    Trash2,
    Search,
    Filter,
    Link2,
    Download,
    Plus,
    Store,
    X,
    Check,
    ChevronDown,
    Share2,
    Globe,
    QrCode,
    Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrangeSpinner } from "@components/Button";
import { API_ENDPOINTS, getPosterImageSrc } from "@constants/api";
import PublishMarketplaceModal from "@components/PublishMarketplaceModal";
import Modal from "@components/Modal";
import PosterShowcaseModal from "@components/PosterShowcaseModal";
import { PosterCanvasView, normalizePosterData } from "@components/PosterCanvasView";
import { exportPoster } from "@utilis/posterExport";

const formatPosterDate = (dateVal?: string | Date | null): string => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }); // e.g. 23 Nov 2026
};
import {
    MAIN_CATEGORIES,
    DEFAULT_CATEGORY,
    DEFAULT_SUBCATEGORY,
    useDBCategories,
} from "@constants/categories";

const CATEGORY_OPTIONS = ["All Categories", ...MAIN_CATEGORIES];

export default function PosterHomePage() {
    const { taxonomy, mainCategories } = useDBCategories();
    const router = useRouter();
    const searchParams = useSearchParams();
    const addToLinkToken = searchParams.get("addToLink");
    const isAddToLinkMode = !!addToLinkToken;
    const [existingLinkPosterIds, setExistingLinkPosterIds] = useState<string[]>([]);
    const [addingToLink, setAddingToLink] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showCustomShortUrlModal, setShowCustomShortUrlModal] = useState(false);
    const [showQrCodeModal, setShowQrCodeModal] = useState(false);
    const [isGenerateLinkDropdownOpen, setIsGenerateLinkDropdownOpen] = useState(false);
    const generateLinkDropdownRef = useRef<HTMLDivElement>(null);
    const [shareLink, setShareLink] = useState("");
    const [targetPosterForShare, setTargetPosterForShare] = useState<Poster | null>(null);
    const [targetPosterIdsForShare, setTargetPosterIdsForShare] = useState<string[]>([]);
    const [isShareModalRegenerate, setIsShareModalRegenerate] = useState(false);
    const [generatingLink, setGeneratingLink] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [selectedSubcategory, setSelectedSubcategory] = useState("All Subcategories");
    const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
    const [filters, setFilters] = useState<PosterFilters>({
        favoritesOnly: false,
        minPrice: "",
        maxPrice: "",
        sortOption: "",
        tags: [], // if using tags
    });

    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("poster_theme") || localStorage.getItem("spa_theme");
            if (saved) return saved === "dark";
            return document.documentElement.classList.contains("dark");
        }
        return false;
    });

    const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const companyDropdownRef = useRef<HTMLDivElement>(null);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const filterDropdownRef = useRef<HTMLDivElement>(null);

    const { isLoggedIn } = useUser();
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedPosters, setSelectedPosters] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false); // toggle when at least one selected
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isMobileBulkMode, setIsMobileBulkMode] = useState(false);
    const [posters, setPosters] = useState<Poster[]>([]);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const hasActiveFilters = Boolean(filters.favoritesOnly || filters.minPrice || filters.maxPrice || filters.sortOption || (filters.tags && filters.tags.length > 0));
    const [shareLinkName, setShareLinkName] = useState("");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
    const { isVideoFile } = useVideoControls();
    const [totalPages, setTotalPages] = useState(1);
    const [showcasePosterId, setShowcasePosterId] = useState<string | null>(null);
    const [showcaseIndex, setShowcaseIndex] = useState<number>(-1);
    const [downloadingPoster, setDownloadingPoster] = useState<Poster | null>(null);
    const offscreenCardRef = useRef<HTMLDivElement>(null);
    const [failedPosterIds, setFailedPosterIds] = useState<string[]>([]);
    useAutoPlayVideos(videoRefs, [posters]);

    const displayedPosters = useMemo(() => {
        return posters.filter((p) => {
            if (selectedCategory && selectedCategory !== "All Categories") {
                const pCat = p.marketplaceCategory || DEFAULT_CATEGORY;
                if (pCat !== selectedCategory) return false;
            }
            if (selectedSubcategory && selectedSubcategory !== "All Subcategories") {
                const pSubCat = p.marketplaceSubcategory || DEFAULT_SUBCATEGORY;
                if (pSubCat !== selectedSubcategory) return false;
            }
            return true;
        });
    }, [posters, selectedCategory, selectedSubcategory]);
    const [exporting, setExporting] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>("");
    const [marketplacePoster, setMarketplacePoster] = useState<Poster | null>(null);
    const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);


    const handleUploadPosters = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const userId = localStorage.getItem("user_id");
        const formData = new FormData();
        formData.append("zipFile", file);
        formData.append("userId", userId as string);
        const toastId = toast.loading("⏳ Uploading posters… Please wait");
        try {
            const token = localStorage.getItem("token");
            const res = await apiClient.post(API_ENDPOINTS.POSTERS.IMPORT_POSTERS, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            toast.success(res.data.message || "Posters uploaded successfully!");
            fetchPosters(1, search, filters, selectedCompany);
        } catch (error) {
            console.error(error);
            toast.error("Upload failed. Try again.");
        } finally {
            toast.dismiss(toastId);
            e.target.value = "";
        }
    };


    const handleExportPosters = async () => {
        if (selectedPosters.length === 0)
            return toast.error("Select at least one poster to export");
        const token = localStorage.getItem("token");
        if (!token)
            return toast.error("Please login to export posters");
        try {
            toast.info("Preparing your posters zip...");
            const response = await apiClient.post(API_ENDPOINTS.POSTERS.EXPORT_POSTERS,
                { ids: selectedPosters },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob",
                }
            );
            const blob = new Blob([response.data], { type: "application/zip" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `posters_${Date.now()}.zip`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Posters exported successfully!");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export posters ❌");
        }
    };

    const getCompanies = async (): Promise<string> => {
        const userId = localStorage.getItem("user_id") || localStorage.getItem("authId") || "";
        if (!userId) {
            const localCompanies = JSON.parse(localStorage.getItem("vendor_companies") || "[]");
            setCompanies(localCompanies);
            return "";
        }
        const token = localStorage.getItem("token");
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        try {
            const response = await apiClient.get(API_ENDPOINTS.COMPANIES.GET_COMPANY_BY_USER_ID(userId), {
                params: { flag: "vendor" },
                headers,
            });
            const fetchedCompanies = response.data?.company || [];
            setCompanies(fetchedCompanies);
            const savedCompany = sessionStorage.getItem("selectedPosterCompany");
            if (savedCompany && fetchedCompanies.some((c: any) => c._id === savedCompany)) {
                setSelectedCompany(savedCompany);
                return savedCompany;
            } else {
                setSelectedCompany("");
                return "";
            }
        } catch {
            return "";
        }
    };

    const handleCompanyChange = (value: string) => {
        if (value === "add") {
            router.push("/pages/Settings?tab=company&openModal=true");
            return;
        }
        setSelectedCompany(value);
        sessionStorage.setItem("selectedPosterCompany", value);
        setCurrentPage(1);
        fetchPosters(1, search, filters, value);
    };

    const fetchPostersLocal = async (): Promise<void> => {
        try {
            setLoading(true);
            const postersRaw: Partial<Poster>[] = JSON.parse(
                localStorage.getItem("guest_posters") || "[]"
            );
            const postersWithImages: Poster[] = await Promise.all(
                postersRaw.map(async (p, i) => {
                    const id = p._id || `guest-${i}-${Date.now()}`;
                    let productImage = p.product_image || "/placeholder.png";
                    if (p.product_image_id) {
                        const img = await getImageFromIndexedDB(p.product_image_id);
                        if (img) productImage = img;
                    }
                    let logoImage = p.company_logo || "/uploads/companies/default-company/logo-1779622107439-878996187.webp";
                    if (p.company_logo_id) {
                        const logo = await getImageFromIndexedDB(p.company_logo_id);
                        if (logo) logoImage = logo;
                    }
                    return {
                        _id: id,
                        posterId: p.posterId,
                        poster_name: p.poster_name || "Untitled Poster",
                        product_name: p.product_name || "Unnamed Product",
                        product_description: p.product_description || "",
                        product_image_id: p.product_image_id || null,
                        company_logo_id: p.company_logo_id || null,
                        product_price: p.product_price ?? 0,
                        company_logo: logoImage,
                        product_image: productImage,
                        createdAt: p.createdAt || new Date().toISOString(),
                        updatedAt: p.updatedAt || p.createdAt || new Date().toISOString(),
                        isHeart: p.isHeart ?? false,
                        marketplaceCategory: p.marketplaceCategory,
                        marketplaceSubcategory: p.marketplaceSubcategory,
                        company_id: p.company_id,
                    } as Poster;
                })
            );
            setPosters(postersWithImages);
            setCurrentPage(1);
            setTotalPages(1);
        } catch (err) {
            console.error("Error fetching posters from local:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPosters = async (
        page = 1,
        searchQuery = "",
        filters?: PosterFilters,
        companyId?: string,
        isAppend = false
    ) => {
        const userId = localStorage.getItem("user_id") || localStorage.getItem("authId") || "";
        if (!userId) {
            const localData = JSON.parse(localStorage.getItem("guest_posters") || "[]");
            setPosters(localData);
            setLoading(false);
            setLoadingMore(false);
            return;
        }
        const token = localStorage.getItem("token");
        if (isAppend) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const params: any = {
                page,
                limit: 20,
                search: searchQuery,
            };

            if (companyId) {
                params.companyId = companyId;
            }

            if (filters) {
                if (filters.favoritesOnly) params.favoritesOnly = true;
                if (filters.minPrice) params.minPrice = filters.minPrice;
                if (filters.maxPrice) params.maxPrice = filters.maxPrice;
                if (filters.sortOption) params.sortOption = filters.sortOption;
                if (filters.tags && filters.tags.length > 0) {
                    params.tags = filters.tags.join(","); // ✅ send tags as comma-separated string
                }
            }

            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await apiClient.get(API_ENDPOINTS.POSTERS.GET_POSTER(userId), {
                headers,
                params,
                _skipCache: true,
            } as any);

            if (res.data?.posters && Array.isArray(res.data.posters)) {
                const fetched = res.data.posters;
                if (isAppend) {
                    setPosters((prev) => {
                        const existingIds = new Set(prev.map((p) => p._id));
                        const uniqueNew = fetched.filter((p: any) => !existingIds.has(p._id));
                        return [...prev, ...uniqueNew];
                    });
                } else {
                    setPosters(fetched);
                }

                const cur = res.data.pagination?.page || page;
                const total = res.data.pagination?.totalPages || 1;
                setCurrentPage(cur);
                setTotalPages(total);
                setHasMore(cur < total);
            } else {
                if (!isAppend) await fetchPostersLocal();
                setHasMore(false);
            }
        } catch (err: any) {
            if (!isAppend) await fetchPostersLocal();
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (loading || loadingMore || !hasMore) return;
        fetchPosters(currentPage + 1, search, filters, selectedCompany, true);
    };

    useEffect(() => {
        if (!loadMoreSentinelRef.current || !hasMore || loading || loadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    handleLoadMore();
                }
            },
            { rootMargin: "350px" }
        );

        observer.observe(loadMoreSentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading, loadingMore, currentPage, search, filters, selectedCompany]);


    const selectedPostersList = useMemo(() => {
        return posters.filter((p) => selectedPosters.includes(p._id));
    }, [posters, selectedPosters]);

    const hasOnlyPublishedSelected = useMemo(() => {
        return selectedPostersList.length > 0 && selectedPostersList.every((p) => Boolean(p.shareableLinkToken));
    }, [selectedPostersList]);

    const eligibleDraftCount = useMemo(() => {
        return selectedPostersList.filter((p) => !p.shareableLinkToken).length;
    }, [selectedPostersList]);

    const handleOpenShareModal = (poster: Poster) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            safeToastError("Please login to share posters");
            return;
        }
        setTargetPosterForShare(poster);
        setTargetPosterIdsForShare([poster._id]);
        setIsShareModalRegenerate(false);
        setShowShareModal(true);
    };

    const handleOpenShareModalForSelected = () => {
        if (selectedPosters.length === 0) {
            safeToastError("Select at least one poster");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            safeToastError("Please login to generate a shareable link");
            return;
        }

        if (selectedPosters.length === 1) {
            const single = posters.find((p) => p._id === selectedPosters[0]);
            setTargetPosterForShare(single || null);
            setTargetPosterIdsForShare(selectedPosters);
            setIsShareModalRegenerate(false);
            setShowShareModal(true);
            return;
        }

        // Multiple posters selected: bundle all selected posters
        const selectedList = posters.filter((p) => selectedPosters.includes(p._id));
        setTargetPosterIdsForShare(selectedPosters);
        setTargetPosterForShare(selectedList[0] || null);
        setIsShareModalRegenerate(false);
        setShowShareModal(true);
    };

    const handleGenerateShareLink = async () => {
        handleOpenShareModalForSelected();
    };

    const handleQuickShare = () => {
        setIsGenerateLinkDropdownOpen(false);
        handleOpenShareModalForSelected();
    };

    const handleCustomShortUrl = () => {
        setIsGenerateLinkDropdownOpen(false);
        if (selectedPosters.length === 0) {
            safeToastError("Select at least one poster");
            return;
        }
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            safeToastError("Please login to create a custom short URL");
            return;
        }
        const single = posters.find((p) => p._id === selectedPosters[0]) || null;
        setTargetPosterForShare(single);
        setTargetPosterIdsForShare(selectedPosters);
        setShowCustomShortUrlModal(true);
    };

    const handleQrCodeLink = () => {
        setIsGenerateLinkDropdownOpen(false);
        if (selectedPosters.length === 0) {
            safeToastError("Select at least one poster");
            return;
        }
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            safeToastError("Please login to generate a QR code");
            return;
        }
        const single = posters.find((p) => p._id === selectedPosters[0]) || null;
        setTargetPosterForShare(single);
        setTargetPosterIdsForShare(selectedPosters);
        setShowQrCodeModal(true);
    };

    const handlePublishToMarketplace = () => {
        setIsGenerateLinkDropdownOpen(false);
        if (selectedPosters.length === 0) {
            safeToastError("Select a poster to publish to marketplace");
            return;
        }
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            safeToastError("Please login to publish to marketplace");
            return;
        }
        const single = posters.find((p) => p._id === selectedPosters[0]) || null;
        if (!single) {
            safeToastError("Selected poster not found");
            return;
        }
        if (selectedPosters.length > 1) {
            toast.info(`Publishing selected poster: "${single.poster_title || single.product_name || 'Poster'}"`);
        }
        setMarketplacePoster(single);
        setShowMarketplaceModal(true);
    };

    useEffect(() => {
        const handleThemeSync = () => {
            const saved = localStorage.getItem("poster_theme") || localStorage.getItem("spa_theme");
            const dark = saved ? saved === "dark" : document.documentElement.classList.contains("dark");
            setIsDarkMode(dark);
        };
        handleThemeSync();
        const handlePosterLinkUpdated = () => {
            clearApiCache();
            fetchPosters(currentPage, search, filters, selectedCompany);
        };
        window.addEventListener("themechange", handleThemeSync);
        window.addEventListener("storage", handleThemeSync);
        window.addEventListener("poster-link-updated", handlePosterLinkUpdated);
        return () => {
            window.removeEventListener("themechange", handleThemeSync);
            window.removeEventListener("storage", handleThemeSync);
            window.removeEventListener("poster-link-updated", handlePosterLinkUpdated);
        };
    }, [currentPage, search, filters, selectedCompany]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) {
                setIsCompanyDropdownOpen(false);
            }
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
                setShowFilterPanel(false);
            }
            if (generateLinkDropdownRef.current && !generateLinkDropdownRef.current.contains(e.target as Node)) {
                setIsGenerateLinkDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        const initialize = async () => {
            const savedToast = sessionStorage.getItem("poster_success_toast");
            if (savedToast) {
                sessionStorage.removeItem("poster_success_toast");
                sessionStorage.removeItem("selectedPosterCompany");
                setSelectedCompany("");
                setSelectedCategory("All Categories");
                setSelectedSubcategory("All Subcategories");
                setTimeout(() => {
                    toast.success(savedToast);
                }, 100);
            }
            const savedCompanyId = savedToast ? "" : await getCompanies();
            const savedPage = Number(sessionStorage.getItem("poster_page")) || 1;
            setCurrentPage(savedPage);
            clearApiCache();
            fetchPosters(savedPage, "", filters, savedCompanyId);
            setTimeout(() => sessionStorage.removeItem("poster_page"), 1000);
        };
        initialize();

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Add-to-Link mode: hydrate existing link poster ids and force selection mode
    useEffect(() => {
        if (!isAddToLinkMode || !addToLinkToken) return;
        try {
            const raw = sessionStorage.getItem(`link_existing_posters_${addToLinkToken}`);
            const ids: string[] = raw ? JSON.parse(raw) : [];
            setExistingLinkPosterIds(ids);
        } catch {
            setExistingLinkPosterIds([]);
        }
        setIsBulkMode(true);
        setIsMobileBulkMode(true);
        setSelectedPosters([]);
    }, [isAddToLinkMode, addToLinkToken]);

    const handleAddSelectedToLink = async () => {
        if (!addToLinkToken) return;
        if (selectedPosters.length === 0) {
            toast.error("Select at least one poster to add");
            return;
        }
        const authToken = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id");
        if (!authToken || !userId) {
            toast.error("Please login");
            return;
        }
        try {
            setAddingToLink(true);
            const res = await apiClient.patch(
                API_ENDPOINTS.SHARABLE_LINKS.UPDATE_SHARED_LINK(addToLinkToken),
                { userId, addPosterIds: selectedPosters },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            if (res.data.success) {
                toast.success(`${selectedPosters.length} poster(s) added`);
                sessionStorage.removeItem(`link_existing_posters_${addToLinkToken}`);
                router.replace(`/pages/view?token=${addToLinkToken}&edit=true`);
            } else {
                toast.error(res.data.message || "Failed to add posters");
            }
        } catch (err) {
            const msg = isAxiosError(err) ? err.response?.data?.message : "Error adding posters";
            toast.error(msg || "Error adding posters");
        } finally {
            setAddingToLink(false);
        }
    };

    // Debounced search: re-fetch posters 400ms after the user stops typing.
    const isFirstSearchRun = useRef(true);
    useEffect(() => {
        if (isFirstSearchRun.current) {
            isFirstSearchRun.current = false;
            return;
        }
        const timer = setTimeout(() => {
            fetchPosters(1, search, filters, selectedCompany);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handlePreview = (posterId: string) => {
        const idx = displayedPosters.findIndex((p) => p._id === posterId);
        setShowcaseIndex(idx >= 0 ? idx : 0);
        setShowcasePosterId(posterId);
    };

    const handleEdit = (posterId: string) => {
        sessionStorage.setItem("poster_page", currentPage.toString());
        router.push(`/pages/createPoster?posterId=${posterId}&edit=true`);
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
        setShowConfirm(true);
    };

    const toggleFavorite = async (posterId: string) => {
        const token = localStorage.getItem("token");
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        try {
            const res = await apiClient.post(
                API_ENDPOINTS.POSTERS.TOGGLE_FAVORITE(posterId),
                {},
                { headers }
            );
            setPosters((prev) =>
                prev.map((p) =>
                    p._id === posterId ? { ...p, isHeart: res.data.isHeart } : p
                )
            );

            safeToastSuccess("Favourite status updated");
        } catch (err: any) {
            if (handleAuthErrorAndToast(err, "Failed to toggle favourites")) return;
        }
    };

    useEffect(() => {
        setIsBulkMode(selectedPosters.length > 0);
    }, [selectedPosters]);


    const confirmDelete = async () => {
        if (!deleteId && selectedPosters.length === 0) return;

        const idsToDelete: string[] = (selectedPosters.length > 0 ? selectedPosters : [deleteId!]).filter(Boolean) as string[];
        const token = localStorage.getItem("token");

        try {
            let remainingPosters: Poster[] = [];

            if (!token) {
                // Guest/local posters
                const success = await deletePosterLocal(idsToDelete);
                if (!success) return;
                remainingPosters = JSON.parse(localStorage.getItem("guest_posters") || "[]");
            } else {
                // Logged-in user
                await apiClient.post(
                    API_ENDPOINTS.POSTERS.DELETE_POSTER,
                    { ids: idsToDelete },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                remainingPosters = posters.filter(p => !idsToDelete.includes(p._id));
            }

            setPosters(remainingPosters);
            safeToastSuccess(`${idsToDelete.length} poster(s) deleted successfully ✅`);

            // --- Smart pagination ---
            const pageSize = 12; // same as fetchPosters
            const startIdx = (currentPage - 1) * pageSize;
            const pagePosters = remainingPosters.slice(startIdx, startIdx + pageSize);

            let newPage = currentPage;
            if (pagePosters.length === 0 && currentPage > 1) {
                newPage = currentPage - 1; // move back if current page empty
            }

            setCurrentPage(newPage);
            fetchPosters(newPage, search, filters, selectedCompany);

        } catch (err: any) {
            if (handleAuthErrorAndToast(err, "Failed to fetch posters")) return;
        } finally {
            setShowConfirm(false);
            setDeleteId(null);
            setSelectedPosters([]);
        }
    };

    const deletePosterLocal = async (idsToDelete: string[]): Promise<boolean> => {
        try {
            let posters: Poster[] = JSON.parse(localStorage.getItem("guest_posters") || "[]");

            if (posters.length === 0) {
                safeToastError("No posters found in local storage ❌");
                return false;
            }
            const updated = posters.filter((p) => !idsToDelete.includes(p._id));
            if (updated.length === posters.length) {
                safeToastError("Poster not found in local storage ❌");
                return false;
            }
            localStorage.setItem("guest_posters", JSON.stringify(updated));
            setPosters(updated);
            safeToastSuccess(`${idsToDelete.length} poster(s) deleted locally ✅`);
            setShowConfirm(false);
            return true;
        } catch (err) {
            safeToastError("Failed to delete poster locally ❌");
            return false;
        }
    };

    const handleDownloadPosterA4 = async (poster: Poster) => {
        const hasImage = Boolean((poster.product_image || (poster as any).productImage || "").trim());
        if (!hasImage) {
            safeToastError("Please upload a product image before creating your poster.");
            return;
        }
        try {
            setDownloadingPoster(poster);
            // Wait for offscreen poster canvas to mount
            await new Promise((resolve) => setTimeout(resolve, 100));

            const element = offscreenCardRef.current;
            if (!element) {
                // If offscreen element isn't available, open showcase preview modal
                setShowcasePosterId(poster._id);
                const idx = displayedPosters.findIndex((p) => p._id === poster._id);
                setShowcaseIndex(idx);
                return;
            }

            const cleanFileName = (poster.product_name || poster.poster_name || (poster as any).poster_title || "renote-poster")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "-")
                .slice(0, 32);

            await exportPoster({
                element,
                format: "pdf",
                fileName: cleanFileName,
            });
        } catch (err) {
            console.error("Download error:", err);
            safeToastError("Failed to download A4 PDF");
        } finally {
            setDownloadingPoster(null);
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-[#0D0E12] text-[#E0E2EC]" : "bg-[#F8F9FC] text-gray-900"} pb-12 transition-colors duration-200 overflow-x-hidden font-sans`}>
            <Header />

            {/* ════════════════ TOOLBAR ════════════════ */}
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 pb-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">

                    {/* Left: Connected Company + Category + Search Input Bar + Filter Button */}
                    <div className="flex items-center gap-2 flex-1 max-w-3xl">

                        {/* Connected Segmented Bar (Screenshot 1 & 2) */}
                        <div className={`flex items-center w-full rounded-xl border shadow-xs overflow-visible relative transition-colors ${isDarkMode
                            ? "border-[#2B3044] bg-[#141620]"
                            : "border-gray-300 bg-white"
                            }`}>

                            {/* 1. Search Posters Input (FIRST) */}
                            <div className="relative flex-1 min-w-0 border-r border-inherit">
                                <input
                                    type="text"
                                    placeholder="Search posters.."
                                    value={search}
                                    disabled={isBulkMode || isMobileBulkMode}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className={`w-full h-9 sm:h-10 pl-3.5 pr-9 text-xs sm:text-sm bg-transparent outline-none rounded-l-xl ${isDarkMode ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                                        }`}
                                />
                                {search ? (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                                    >
                                        <X className="w-[18px] h-[18px] stroke-[2]" />
                                    </button>
                                ) : (
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px] stroke-[2] pointer-events-none" />
                                )}
                            </div>

                            {/* 2. All Companies Dropdown (Screenshot 2) */}
                            <div className="relative shrink-0" ref={companyDropdownRef}>
                                <button
                                    type="button"
                                    disabled={isBulkMode || isMobileBulkMode}
                                    onClick={() => {
                                        setIsCompanyDropdownOpen(!isCompanyDropdownOpen);
                                        setIsCategoryDropdownOpen(false);
                                    }}
                                    className={`h-9 sm:h-10 px-3 text-xs sm:text-sm font-semibold border-r flex items-center gap-1.5 transition-colors cursor-pointer select-none ${isDarkMode
                                        ? "bg-[#181B26] text-gray-200 border-[#2B3044] hover:bg-[#1E2232]"
                                        : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                                        }`}
                                >
                                    <span className="truncate max-w-[110px] sm:max-w-[140px]">
                                        {selectedCompany ? (companies.find(c => c._id === selectedCompany)?.name || "Company") : "All Companies"}
                                    </span>
                                    <ChevronDown className={`w-[18px] h-[18px] text-gray-500 stroke-[2] transition-transform ${isCompanyDropdownOpen ? "rotate-180" : ""}`} />
                                </button>

                                {/* Company Dropdown Menu (Exact Match to Screenshot 2) */}
                                {isCompanyDropdownOpen && (
                                    <div className={`absolute top-full left-0 mt-1.5 w-56 rounded-xl shadow-2xl py-1 z-50 border transition-all animate-in fade-in zoom-in-95 duration-100 ${isDarkMode
                                        ? "bg-[#161824] border-[#2B3044] text-gray-200"
                                        : "bg-white border-gray-200 text-gray-800"
                                        }`}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleCompanyChange("");
                                                setIsCompanyDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between cursor-pointer transition-colors ${!selectedCompany
                                                ? "bg-orange-50 dark:bg-[#281611] text-[#FF5722] font-bold"
                                                : isDarkMode ? "hover:bg-[#1E2230] text-gray-300" : "hover:bg-gray-100 text-gray-700"
                                                }`}
                                        >
                                            <span>All Companies</span>
                                            {!selectedCompany && <Check className="w-[18px] h-[18px] text-[#FF5722] stroke-[2]" />}
                                        </button>

                                        {companies.map((comp) => {
                                            const isSel = selectedCompany === comp._id;
                                            return (
                                                <button
                                                    key={comp._id}
                                                    type="button"
                                                    onClick={() => {
                                                        handleCompanyChange(comp._id);
                                                        setIsCompanyDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-colors ${isSel
                                                        ? "bg-orange-50 dark:bg-[#281611] text-[#FF5722] font-bold"
                                                        : isDarkMode ? "hover:bg-[#1E2230] text-gray-300" : "hover:bg-gray-100 text-gray-700"
                                                        }`}
                                                >
                                                    <span className="truncate">{comp.name}</span>
                                                    {isSel && <Check className="w-[18px] h-[18px] text-[#FF5722] stroke-[2]" />}
                                                </button>
                                            );
                                        })}

                                        <div className={`border-t my-1 ${isDarkMode ? "border-[#222636]" : "border-gray-100"}`} />

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCompanyDropdownOpen(false);
                                                handleCompanyChange("add");
                                            }}
                                            className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-[#FF5722] ${isDarkMode ? "hover:bg-[#281611]" : "hover:bg-orange-50"
                                                }`}
                                        >
                                            <Plus className="w-[18px] h-[18px] stroke-[2]" />
                                            <span>Add Company</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 3. All Categories Dropdown (Screenshot 1: Tinted Orange) */}
                            <div className="relative shrink-0" ref={categoryDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                                        setIsCompanyDropdownOpen(false);
                                    }}
                                    className={`h-9 sm:h-10 px-3 text-xs sm:text-sm font-semibold rounded-r-xl flex items-center gap-1.5 transition-colors cursor-pointer select-none ${isDarkMode
                                        ? "bg-[#181B26] text-gray-200 border-[#2B3044] hover:bg-[#1E2232]"
                                        : "bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100"
                                        }`}
                                >
                                    <span className="truncate max-w-[110px] sm:max-w-[140px]">{selectedCategory}</span>
                                    <ChevronDown className={`w-[18px] h-[18px] text-gray-500 stroke-[2] transition-transform ${isCategoryDropdownOpen ? "rotate-180" : ""}`} />
                                </button>

                                {/* Category Dropdown Menu */}
                                {isCategoryDropdownOpen && (
                                    <div className={`absolute top-full left-0 mt-1.5 w-60 rounded-xl shadow-2xl py-1 z-50 border max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${isDarkMode
                                        ? "bg-[#161824] border-[#2B3044] text-gray-200"
                                        : "bg-white border-gray-200 text-gray-800"
                                        }`}>
                                        {CATEGORY_OPTIONS.map((cat) => {
                                            const isSel = selectedCategory === cat;
                                            return (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCategory(cat);
                                                        setSelectedSubcategory("All Subcategories");
                                                        setIsCategoryDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-colors ${isSel
                                                        ? "bg-orange-50 dark:bg-[#281611] text-[#FF5722] font-bold"
                                                        : isDarkMode ? "hover:bg-[#1E2230] text-gray-300" : "hover:bg-gray-100 text-gray-700"
                                                        }`}
                                                >
                                                    <span>{cat}</span>
                                                    {isSel && <Check className="w-[18px] h-[18px] text-[#FF5722] stroke-[2]" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Filter Funnel Icon Button & Compact Dropdown Panel */}
                        {isLoggedIn && (
                            <div className="relative shrink-0" ref={filterDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowFilterPanel((prev) => !prev)}
                                    disabled={isBulkMode || isMobileBulkMode}
                                    className={`h-9 sm:h-10 w-9 sm:w-10 shrink-0 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shadow-xs relative ${showFilterPanel || hasActiveFilters
                                        ? "border-[#FF5722] text-[#FF5722] bg-[#FF5722]/10 shadow-[0_0_12px_rgba(255,87,34,0.25)]"
                                        : isDarkMode
                                            ? "border-[#2B3044] bg-[#141620] text-gray-300 hover:border-[#FF5722] hover:text-[#FF5722]"
                                            : "border-gray-300 bg-white text-gray-600 hover:border-[#FF5722] hover:text-[#FF5722]"
                                        }`}
                                    title="Filter Posters"
                                >
                                    <Filter className="w-[18px] h-[18px] stroke-[2]" />
                                    {hasActiveFilters && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF5722] rounded-full border-2 border-[#12141D]" />
                                    )}
                                </button>

                                {/* Dropdown panel directly below Filter button, right-aligned */}
                                {showFilterPanel && (
                                    <div className="absolute top-full right-0 mt-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                                        <PosterFilterPanel
                                            filters={filters}
                                            isDarkMode={isDarkMode}
                                            onApply={(appliedFilters) => {
                                                setFilters(appliedFilters);
                                                fetchPosters(1, search, appliedFilters, selectedCompany);
                                                setShowFilterPanel(false);
                                            }}
                                            onReset={() => {
                                                const resetFilters: PosterFilters = {
                                                    favoritesOnly: false,
                                                    minPrice: "",
                                                    maxPrice: "",
                                                    sortOption: "",
                                                    tags: [],
                                                };
                                                setFilters(resetFilters);
                                                fetchPosters(1, search, resetFilters, selectedCompany);
                                                setShowFilterPanel(false);
                                            }}
                                            onClose={() => setShowFilterPanel(false)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Actions, Upload & Create Poster */}
                    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 justify-end">
                        {/* Selective Checkbox of all posters & Action Icons (Link, Delete) */}
                        {displayedPosters.length > 0 && (
                            <div className="flex items-center gap-2 mr-1">
                                {/* Selective Checkbox for all posters on page */}
                                <label
                                    className={`flex items-center gap-1.5 cursor-pointer text-xs font-semibold select-none transition-colors ${selectedPosters.length > 0
                                        ? "text-[#FF5722]"
                                        : "text-gray-500 hover:text-[#FF5722] dark:text-gray-400 dark:hover:text-[#FF5722]"
                                        }`}
                                    title={
                                        displayedPosters.every((p) => selectedPosters.includes(p._id))
                                            ? "Deselect all posters on this page"
                                            : "Select all posters on this page"
                                    }
                                >
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-[#FF5722] cursor-pointer rounded"
                                        checked={displayedPosters.length > 0 && displayedPosters.every((p) => selectedPosters.includes(p._id))}
                                        onChange={() => {
                                            const pageIds = displayedPosters.map((p) => p._id);
                                            const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedPosters.includes(id));
                                            if (allOnPageSelected) {
                                                setSelectedPosters((prev) => prev.filter((id) => !pageIds.includes(id)));
                                            } else {
                                                setSelectedPosters((prev) => Array.from(new Set([...prev, ...pageIds])));
                                            }
                                        }}
                                    />
                                    <span className="hidden sm:inline">Select All</span>
                                    {selectedPosters.length > 0 && (
                                        <span className="font-bold">({selectedPosters.length} selected)</span>
                                    )}
                                </label>

                                {/* When posters are selected: Generate Link icon beside Delete icon */}
                                {selectedPosters.length > 0 && (
                                    <div className="flex items-center gap-1.5 ml-1">
                                        {/* 1. Generate Link Icon */}
                                        {isAddToLinkMode ? (
                                            <button
                                                type="button"
                                                onClick={handleAddSelectedToLink}
                                                disabled={addingToLink}
                                                className="h-9 px-3 rounded-xl bg-[#FF5722] hover:bg-[#FF7043] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                                                title={`Add ${selectedPosters.length} poster(s) to link`}
                                            >
                                                {addingToLink ? "Adding..." : `Add ${selectedPosters.length}`}
                                            </button>
                                        ) : (
                                            <div className="relative" ref={generateLinkDropdownRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsGenerateLinkDropdownOpen((prev) => !prev)}
                                                    disabled={generatingLink}
                                                    className={`h-9 px-2.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${isDarkMode
                                                        ? "border-[#2B3044] bg-[#141620] text-gray-300 hover:text-[#FF5722] hover:border-[#FF5722]/60 hover:bg-[#FF5722]/10"
                                                        : "border-gray-300 bg-white text-gray-600 hover:text-[#FF5722] hover:border-[#FF5722]/60 hover:bg-orange-50"
                                                        } ${isGenerateLinkDropdownOpen ? "border-[#FF5722] text-[#FF5722]" : ""} disabled:opacity-40 disabled:cursor-not-allowed`}
                                                    title="Generate Link options"
                                                >
                                                    <Link2 className="w-[18px] h-[18px] stroke-[2]" />
                                                    <ChevronDown className={`w-3.5 h-3.5 stroke-[2] transition-transform duration-200 ${isGenerateLinkDropdownOpen ? "rotate-180" : ""}`} />
                                                </button>

                                                {/* Dropdown Menu Popup */}
                                                {isGenerateLinkDropdownOpen && (
                                                    <div
                                                        className={`absolute top-full right-0 mt-2 w-64 rounded-2xl shadow-2xl border p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${isDarkMode
                                                            ? "bg-[#141620] border-[#2B3044] text-white shadow-black/60"
                                                            : "bg-white border-gray-200 text-gray-800 shadow-xl"
                                                            }`}
                                                    >
                                                        <div className="px-3 py-1.5 border-b border-gray-100 dark:border-white/[0.06] mb-1">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                                                Generate Link & Share
                                                            </p>
                                                        </div>

                                                        {/* Option 1: Quick Share Link */}
                                                        <button
                                                            type="button"
                                                            onClick={handleQuickShare}
                                                            className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer group ${isDarkMode ? "hover:bg-white/[0.06]" : "hover:bg-orange-50/70"
                                                                }`}
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-[#FF5722]/10 text-[#FF5722] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#FF5722] group-hover:text-white transition-colors">
                                                                <Share2 className="w-4 h-4 stroke-[2]" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                                                                    Quick Share Link
                                                                </div>
                                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                                                                    Instant public URL with Copy & Open
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {/* Option 2: Custom Short URL */}
                                                        <button
                                                            type="button"
                                                            onClick={handleCustomShortUrl}
                                                            className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer group ${isDarkMode ? "hover:bg-white/[0.06]" : "hover:bg-blue-50/70"
                                                                }`}
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                                <Globe className="w-4 h-4 stroke-[2]" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                                                                    Custom Short URL
                                                                </div>
                                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                                                                    Branded short URL with custom slug
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {/* Option 3: QR Code Link */}
                                                        <button
                                                            type="button"
                                                            onClick={handleQrCodeLink}
                                                            className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer group ${isDarkMode ? "hover:bg-white/[0.06]" : "hover:bg-emerald-50/70"
                                                                }`}
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                                <QrCode className="w-4 h-4 stroke-[2]" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                                                                    QR Code Link
                                                                </div>
                                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                                                                    Generate & download PNG / SVG
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {/* Option 4: Publish to Marketplace */}
                                                        <button
                                                            type="button"
                                                            onClick={handlePublishToMarketplace}
                                                            className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer group ${isDarkMode ? "hover:bg-white/[0.06]" : "hover:bg-amber-50/70"
                                                                }`}
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                                                <Store className="w-4 h-4 stroke-[2]" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                                                                    Publish to Marketplace
                                                                </div>
                                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                                                                    Direct listing on reNote Marketplace
                                                                </div>
                                                            </div>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 2. Delete Icon */}
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(true)}
                                            className="h-9 w-9 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors cursor-pointer"
                                            title={`Delete ${selectedPosters.length} selected poster(s)`}
                                        >
                                            <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Create Poster Button */}
                        <button
                            type="button"
                            onClick={() => {
                                const isLoggedIn = !!localStorage.getItem("token");
                                const guestPosters = JSON.parse(localStorage.getItem("guest_posters") || "[]") as Poster[];
                                if (!isLoggedIn && guestPosters.length >= 3) {
                                    safeToastError("Limit exceeded! Please login to create more posters.");
                                    return;
                                }
                                router.push("/pages/createPoster");
                            }}
                            className="h-9 sm:h-10 px-4 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#E63900] hover:from-[#FF7043] hover:to-[#FF5722] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-[0_4px_15px_rgba(255,87,34,0.35)] active:scale-95 transition-all cursor-pointer shrink-0"
                            title="Create new poster"
                        >
                            <span>Create Poster</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* ════════════════ POSTER CARDS GRID ════════════════ */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-4">
                {loading ? (
                    <div className="flex items-center justify-center h-[50vh] w-full">
                        <OrangeSpinner size={40} />
                    </div>
                ) : displayedPosters.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pb-8 bg-transparent">
                        {displayedPosters.map((poster) => {
                            const isAlreadyInLink = isAddToLinkMode && existingLinkPosterIds.includes(poster._id);
                            const isChecked = isAlreadyInLink ? true : selectedPosters.includes(poster._id);
                            return (
                                <div
                                    key={poster._id}
                                    className={`relative rounded-2xl border overflow-hidden transition-all duration-200 group flex flex-col cursor-pointer ${isChecked
                                        ? "ring-2 ring-[#FF5722] border-[#FF5722]"
                                        : isDarkMode
                                            ? "bg-[#141620] border-[#222636] hover:border-[#FF5722]/50 shadow-md hover:shadow-2xl"
                                            : "bg-white border-gray-200/90 hover:border-[#FF5722]/50 shadow-xs hover:shadow-lg"
                                        } hover:-translate-y-1 ${isAlreadyInLink ? "opacity-50 pointer-events-none" : ""}`}
                                    onClick={() => {
                                        if (isAlreadyInLink) return;
                                        if (isMobileBulkMode || selectedPosters.length > 0) {
                                            setSelectedPosters(prev => prev.includes(poster._id) ? prev.filter(id => id !== poster._id) : [...prev, poster._id]);
                                        } else {
                                            handlePreview(poster._id);
                                        }
                                    }}
                                >
                                    {/* Media Thumbnail */}
                                    <div className="relative w-full aspect-[2.1/1] bg-gray-100 dark:bg-[#1A1D27] overflow-hidden cursor-pointer">
                                        {/* Selective Checkbox for Poster */}
                                        <div
                                            className="absolute top-2.5 left-2.5 z-20"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                disabled={isAlreadyInLink}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    if (isAlreadyInLink) return;
                                                    setSelectedPosters((prev) =>
                                                        prev.includes(poster._id)
                                                            ? prev.filter((id) => id !== poster._id)
                                                            : [...prev, poster._id]
                                                    );
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#FF5722] focus:ring-[#FF5722] accent-[#FF5722] cursor-pointer bg-white/90 dark:bg-[#141620]/90 shadow-sm transition-transform hover:scale-110"
                                                title={isChecked ? "Deselect poster" : "Select poster"}
                                            />
                                        </div>

                                        {/* Media Preview: Video or Image */}
                                        {isVideoFile(poster.product_image) ? (
                                            <video
                                                ref={(el) => {
                                                    if (el) videoRefs.current[poster._id] = el;
                                                }}
                                                src={getPosterImageSrc(poster.product_image)}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                muted
                                                loop
                                                playsInline
                                                autoPlay
                                                onError={(e) => {
                                                    const target = e.currentTarget as HTMLVideoElement;
                                                    target.style.display = "none";
                                                }}
                                            />
                                        ) : (
                                            <img
                                                src={getPosterImageSrc(poster.product_image)}
                                                alt={poster.poster_name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300 select-none"
                                                draggable={false}
                                                onError={(e) => {
                                                    const target = e.currentTarget as HTMLImageElement;
                                                    if (!target.src.endsWith("/placeholder.png")) {
                                                        target.src = "/placeholder.png";
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Card Content (Screenshot: 3 clean lines of metadata) */}
                                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-1">
                                        <div>
                                            {/* Line 1: Bold Uppercase Tag / Title (e.g. TODAYS SALE, AUGUST SPECIAL) */}
                                            <h3 className="font-black text-xs sm:text-[13px] uppercase tracking-wide truncate text-gray-900 dark:text-white transition-colors">
                                                {(poster as any).poster_title || poster.poster_name || "TODAYS SALE"}
                                            </h3>

                                            {/* Line 2: Product Name in Bold Orange (e.g. Hp elitebook 845 g8) */}
                                            <p className="text-xs sm:text-[13px] font-semibold text-[#FF5722] truncate mt-0.5">
                                                {poster.product_name || poster.poster_name || "Special Item"}
                                            </p>

                                            {/* Line 3: Formatted Date (e.g. 23 Nov 2026) */}
                                            <p
                                                className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium mt-1"
                                                title={
                                                    poster?.updatedAt && poster?.createdAt && new Date(poster.updatedAt).getTime() !== new Date(poster.createdAt).getTime()
                                                        ? `Updated: ${formatPosterDate(poster.updatedAt)} (Created: ${formatPosterDate(poster.createdAt)})`
                                                        : poster?.createdAt
                                                            ? `Created: ${formatPosterDate(poster.createdAt)}`
                                                            : undefined
                                                }
                                            >
                                                {formatPosterDate(poster?.updatedAt || poster?.createdAt) || "—"}
                                            </p>
                                        </div>

                                        {/* Bottom Actions Row: Edit, Download, Delete */}
                                        <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                {/* 1. Share */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenShareModal(poster);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:text-[#FF5722] hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors cursor-pointer"
                                                    title="Share Poster"
                                                >
                                                    <Share2 className="w-[18px] h-[18px] stroke-[2]" />
                                                </button>

                                                {/* 2. Edit */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(poster._id);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-[18px] h-[18px] stroke-[2]" />
                                                </button>

                                                {/* 3. Download */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadPosterA4(poster);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:text-[#FF5722] hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors cursor-pointer"
                                                    title="Download Poster"
                                                >
                                                    <Download className="w-[18px] h-[18px] stroke-[2]" />
                                                </button>

                                                {/* 4. Delete */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(poster._id);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={`flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border transition-colors ${isDarkMode
                        ? "bg-[#141620] border-[#222636] text-gray-400"
                        : "bg-white border-gray-200 text-gray-500 shadow-xs"
                        }`}>
                        <Store className="w-12 h-12 text-gray-400 mb-3" />
                        <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">No posters found</h4>
                        <p className="text-xs text-gray-400 max-w-sm mt-1">
                            {search || selectedCategory !== "All Categories" || selectedCompany
                                ? "No posters match your current filter criteria. Try resetting filters."
                                : "Create your first poster to start showcasing products in your catalog."}
                        </p>
                        <div className="flex items-center gap-2 mt-4">
                            {(search || selectedCategory !== "All Categories" || selectedCompany) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setSelectedCategory("All Categories");
                                        setSelectedCompany("");
                                        setCurrentPage(1);
                                        fetchPosters(1, "", filters, "");
                                    }}
                                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${isDarkMode ? "border-[#2B3044] bg-[#181B26] text-white hover:bg-[#202536]" : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    Reset Filters
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => router.push("/pages/createPoster")}
                                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#E63900] hover:from-[#FF7043] hover:to-[#FF5722] text-white text-xs font-bold cursor-pointer transition-all shadow-[0_2px_10px_rgba(255,87,34,0.35)]"
                            >
                                + Create Poster
                            </button>
                        </div>
                    </div>
                )}

                {/* Scroll sentinel for auto scroll-down loading */}
                <div ref={loadMoreSentinelRef} className="h-4 w-full" />

                {/* Load More Option */}
                {hasMore && (
                    <div className="flex justify-center items-center py-6">
                        <button
                            type="button"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF5722] to-[#E63900] hover:from-[#FF7043] hover:to-[#FF5722] active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_16px_rgba(255,87,34,0.35)] transition-all cursor-pointer disabled:opacity-60"
                        >
                            {loadingMore ? (
                                <>
                                    <OrangeSpinner size={18} />
                                    <span>Loading more posters...</span>
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-[18px] h-[18px] stroke-[2]" />
                                    <span>Load More Posters</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {!hasMore && displayedPosters.length > 0 && (
                    <div className="flex justify-center items-center py-6 text-xs text-gray-400 select-none">
                        <span>Showing all {displayedPosters.length} poster{displayedPosters.length === 1 ? "" : "s"}</span>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
                <ConfirmationPopUp
                    message={
                        selectedPosters.length > 1
                            ? `Are you sure you want to delete ${selectedPosters.length} posters?`
                            : "Are you sure you want to delete this poster?"
                    }
                    onYes={confirmDelete}
                    onNo={() => setShowConfirm(false)}
                />
            </Modal>

            <ShareLinkModal
                isOpen={showShareModal}
                onClose={() => {
                    setShowShareModal(false);
                    setTargetPosterForShare(null);
                    setTargetPosterIdsForShare([]);
                }}
                poster={targetPosterForShare}
                posterIds={
                    targetPosterIdsForShare.length > 0
                        ? targetPosterIdsForShare
                        : targetPosterForShare
                            ? [targetPosterForShare._id]
                            : selectedPosters
                }
                isRegenerate={isShareModalRegenerate}
                onSuccess={(result) => {
                    clearApiCache();
                    const affectedIds =
                        targetPosterIdsForShare.length > 0
                            ? targetPosterIdsForShare
                            : targetPosterForShare?._id
                                ? [targetPosterForShare._id]
                                : selectedPosters;

                    const setIds = new Set(affectedIds);
                    setPosters((prev) =>
                        prev.map((p) =>
                            setIds.has(p._id)
                                ? {
                                    ...p,
                                    shareableLinkToken: result.isRevoked ? undefined : result.token,
                                    hasLink: !result.isRevoked,
                                }
                                : p
                        )
                    );
                    fetchPosters(currentPage, search, filters, selectedCompany);
                }}
            />

            <CustomShortUrlModal
                isOpen={showCustomShortUrlModal}
                onClose={() => {
                    setShowCustomShortUrlModal(false);
                    setTargetPosterForShare(null);
                    setTargetPosterIdsForShare([]);
                }}
                poster={targetPosterForShare}
                posterIds={
                    targetPosterIdsForShare.length > 0
                        ? targetPosterIdsForShare
                        : targetPosterForShare
                            ? [targetPosterForShare._id]
                            : selectedPosters
                }
                onSuccess={() => {
                    clearApiCache();
                    fetchPosters(currentPage, search, filters, selectedCompany);
                }}
            />

            <QrCodeModal
                isOpen={showQrCodeModal}
                onClose={() => {
                    setShowQrCodeModal(false);
                    setTargetPosterForShare(null);
                    setTargetPosterIdsForShare([]);
                }}
                poster={targetPosterForShare}
                posterIds={
                    targetPosterIdsForShare.length > 0
                        ? targetPosterIdsForShare
                        : targetPosterForShare
                            ? [targetPosterForShare._id]
                            : selectedPosters
                }
            />

            <PublishMarketplaceModal
                isOpen={showMarketplaceModal}
                poster={marketplacePoster}
                onClose={() => {
                    setShowMarketplaceModal(false);
                    setMarketplacePoster(null);
                }}
                onSuccess={(updated) => {
                    if (updated && updated._id) {
                        setPosters((prev) =>
                            prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p))
                        );
                    }
                    clearApiCache();
                    fetchPosters(currentPage, search, filters, selectedCompany);
                }}
            />

            <PosterShowcaseModal
                isOpen={!!showcasePosterId}
                onClose={() => {
                    setShowcasePosterId(null);
                    setShowcaseIndex(-1);
                }}
                posterId={showcasePosterId}
                postersList={displayedPosters as any}
                currentIndex={showcaseIndex}
                onNavigate={(newIndex) => {
                    if (displayedPosters[newIndex]) {
                        setShowcaseIndex(newIndex);
                        setShowcasePosterId(displayedPosters[newIndex]._id);
                    }
                }}
            />

            {/* Offscreen poster canvas for direct high-quality PDF exports from poster cards */}
            {downloadingPoster && (
                <div
                    ref={offscreenCardRef}
                    style={{
                        position: "fixed",
                        left: "-9999px",
                        top: "-9999px",
                        width: "440px",
                        zIndex: -100,
                    }}
                >
                    <PosterCanvasView
                        poster={normalizePosterData(downloadingPoster as any)}
                        readOnly={true}
                    />
                </div>
            )}
        </div>
    );
}
