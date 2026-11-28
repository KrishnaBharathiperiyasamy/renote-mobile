"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  ArrowLeft,
  Share2,
  Pencil,
  Copy,
  Download,
  ChevronDown,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import apiClient, { clearApiCache } from "@utilis/apiClient";
import { API_ENDPOINTS, getPosterImageSrc } from "@constants/api";
import { OrangeSpinner } from "@components/Button";
import { safeToastSuccess, safeToastError, safeToastInfo } from "@utilis/toastHelper";
import { exportPoster } from "@utilis/posterExport";
import { PosterCanvasView, normalizePosterData } from "@components/PosterCanvasView";

export interface PosterShowcaseItem {
  _id: string;
  posterId?: string;
  poster_title?: string;
  poster_name?: string;
  product_name?: string;
  product_description?: string;
  product_price?: number | string;
  product_image?: string;
  product_gallery_images?: string[];
  company_logo?: string;
  template?: string;
  company_id?: {
    _id?: string;
    name?: string;
    logo?: string;
    phone?: string;
    city?: string;
    address?: string;
  };
  [key: string]: any;
}

interface PosterShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  posterId: string | null;
  initialPoster?: PosterShowcaseItem | null;
  postersList?: PosterShowcaseItem[];
  currentIndex?: number;
  onNavigate?: (newIndex: number) => void;
}

export default function PosterShowcaseModal({
  isOpen,
  onClose,
  posterId,
  initialPoster = null,
  postersList = [],
  currentIndex = -1,
  onNavigate,
}: PosterShowcaseModalProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);
  const [posterData, setPosterData] = useState<PosterShowcaseItem | null>(initialPoster);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [failedGalleryIndices, setFailedGalleryIndices] = useState<number[]>([]);
  const [isMainImageFailed, setIsMainImageFailed] = useState<boolean>(false);

  const [scale, setScale] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const availH = Math.max(100, window.innerHeight * 0.9 - 130);
      const availW = Math.max(100, Math.min(window.innerWidth * 0.9, 850) - 80);
      const s = Math.min(availW / 440, availH / 607.2, 1);
      return Math.max(0.15, s);
    }
    return 1;
  });
  const posterContainerRef = useRef<HTMLDivElement>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("poster_theme") || localStorage.getItem("spa_theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  // Gallery images list (main product_image + any gallery images)
  const galleryItems = useMemo(() => {
    if (!posterData) return [];
    const list: string[] = [];
    if (posterData.product_image) list.push(posterData.product_image);
    if (Array.isArray(posterData.product_gallery_images)) {
      posterData.product_gallery_images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list;
  }, [posterData]);

  // Active displayed image
  const activeImage = selectedGalleryImage || posterData?.product_image || "";

  // Complete normalized poster configuration for template rendering
  const normalizedPoster = useMemo(() => {
    const p = normalizePosterData(posterData);
    if (activeImage) {
      p.productImage = getPosterImageSrc(activeImage);
    }
    return p;
  }, [posterData, activeImage]);

  // Dynamically calculate scale to fit the complete poster inside available height & width
  const updateScale = useCallback(() => {
    const container = posterContainerRef.current;
    if (!container) return;

    // Available space inside container with padding clearance
    const availWidth = container.clientWidth - 16;
    const availHeight = container.clientHeight - 16;

    if (availWidth <= 0 || availHeight <= 0) return;

    // Standard poster canvas reference dimensions (440px width, aspect 1:1.38 -> 607.2px height)
    const baseWidth = 440;
    const baseHeight = 607.2;

    const scaleX = availWidth / baseWidth;
    const scaleY = availHeight / baseHeight;

    // Scale proportionally to fit within both dimensions without cropping or distortion
    const fitScale = Math.min(scaleX, scaleY, 1);
    setScale(Math.max(0.15, fitScale));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updateScale();
    const timer = setTimeout(updateScale, 60);

    const container = posterContainerRef.current;
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && container) {
      observer = new ResizeObserver(() => {
        updateScale();
      });
      observer.observe(container);
    }

    window.addEventListener("resize", updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateScale);
      observer?.disconnect();
    };
  }, [isOpen, updateScale, posterData, galleryItems.length]);

  // Fetch poster information from the backend whenever posterId changes
  useEffect(() => {
    if (!isOpen || !posterId) return;

    setIsMainImageFailed(false);
    setFailedGalleryIndices([]);

    // Seed state immediately with initialPoster if matching
    if (initialPoster && initialPoster._id === posterId) {
      setPosterData(initialPoster);
      setSelectedGalleryImage(initialPoster.product_image || "");
    } else {
      const foundInList = postersList.find((p) => p._id === posterId);
      if (foundInList) {
        setPosterData(foundInList);
        setSelectedGalleryImage(foundInList.product_image || "");
      }
    }

    let isCancelled = false;

    // Check if it's a guest poster in localStorage
    if (posterId.startsWith("guest-")) {
      try {
        const guestPosters: PosterShowcaseItem[] = JSON.parse(
          localStorage.getItem("guest_posters") || "[]"
        );
        const match = guestPosters.find((p) => p._id === posterId);
        if (match && !isCancelled) {
          setPosterData(match);
          setSelectedGalleryImage(match.product_image || "");
        }
      } catch (err) {
        console.error("Failed to load local poster:", err);
      }
      return;
    }

    // Fetch live information from the backend
    const fetchFromBackend = async () => {
      try {
        setIsLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await apiClient.get(API_ENDPOINTS.POSTERS.GET_BY_ID(posterId), {
          headers,
        });

        if (!isCancelled && res.data?.success && res.data?.poster) {
          setPosterData(res.data.poster);
          setSelectedGalleryImage(res.data.poster.product_image || "");
        }
      } catch (err) {
        console.error("Error fetching poster from backend:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchFromBackend();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, posterId, initialPoster, postersList]);


  // Navigate next / prev
  const handlePrev = useCallback(() => {
    if (!postersList || postersList.length <= 1) return;
    const effectiveIndex =
      currentIndex >= 0
        ? currentIndex
        : postersList.findIndex((p) => p._id === posterId);

    const prevIndex = effectiveIndex > 0 ? effectiveIndex - 1 : postersList.length - 1;
    if (onNavigate) {
      onNavigate(prevIndex);
    }
  }, [currentIndex, postersList, posterId, onNavigate]);

  const handleNext = useCallback(() => {
    if (!postersList || postersList.length <= 1) return;
    const effectiveIndex =
      currentIndex >= 0
        ? currentIndex
        : postersList.findIndex((p) => p._id === posterId);

    const nextIndex = effectiveIndex < postersList.length - 1 ? effectiveIndex + 1 : 0;
    if (onNavigate) {
      onNavigate(nextIndex);
    }
  }, [currentIndex, postersList, posterId, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Theme toggle
  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem("poster_theme", nextDark ? "dark" : "light");
    localStorage.setItem("spa_theme", nextDark ? "dark" : "light");
    if (typeof document !== "undefined") {
      if (nextDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        document.documentElement.style.colorScheme = "light";
      }
      window.dispatchEvent(new Event("themechange"));
    }
  };

  // Actions
  const handleShare = async () => {
    if (!posterData) return;
    const shareUrl = `${window.location.origin}/pages/poster?posterId=${posterData._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: posterData.poster_title || posterData.product_name || "Poster",
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      safeToastSuccess("Poster link copied to clipboard! 📋");
    }
  };

  const handleEdit = () => {
    if (!posterData) return;
    onClose();
    router.push(`/pages/createPoster?posterId=${posterData._id}&edit=true`);
  };

  const handleExport = async (format: "pdf" | "png" = "pdf") => {
    if (isDownloading) return;
    const hasImage = Boolean((posterData?.product_image || posterData?.productImage || "").trim());
    if (!hasImage) {
      safeToastError("Please upload a product image before creating your poster.");
      return;
    }
    const cardElement = cardRef.current || document.getElementById("poster-bill-card");
    if (!cardElement) {
      safeToastError("Poster element not ready for download");
      return;
    }

    try {
      setIsDownloading(true);
      setShowDownloadMenu(false);
      const fileName =
        posterData?.product_name ||
        posterData?.poster_title ||
        posterData?.poster_name ||
        "renote-poster";

      await exportPoster({
        element: cardElement,
        format,
        fileName,
      });
    } catch (error) {
      console.error("Poster export error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDuplicateToEditor = async () => {
    if (!posterData) return;
    setShowDownloadMenu(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userId = typeof window !== "undefined" ? (localStorage.getItem("user_id") || localStorage.getItem("authId")) : null;

    if (token && userId) {
      try {
        safeToastInfo("Duplicating poster... 📋");
        const res = await apiClient.post(
          API_ENDPOINTS.POSTERS.DUPLICATE(posterData._id),
          { userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const duplicated = res.data?.poster || res.data;
        const newId = duplicated?._id || duplicated?.posterId;
        if (newId) {
          clearApiCache();
          safeToastSuccess("Poster duplicated! Opening new copy in editor... 🎨");
          onClose();
          router.push(`/pages/createPoster?posterId=${newId}&edit=true`);
          return;
        }
      } catch (err) {
        console.warn("Backend duplicate failed, falling back to editor copy:", err);
      }
    } else {
      // Guest mode duplicate in localStorage
      try {
        const guestPosters = JSON.parse(localStorage.getItem("guest_posters") || "[]");
        const newId = `guest-${Date.now()}`;
        const sourceTitle = posterData.poster_title || posterData.poster_name || posterData.product_name || "Poster";
        const newCopy = {
          ...posterData,
          _id: newId,
          posterId: `POS-${guestPosters.length + 1}`,
          poster_name: `${sourceTitle} (Copy)`,
          poster_title: `${sourceTitle} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPublishedToMarketplace: false,
          shareableLinkToken: null,
          shareableLinkId: null,
        };
        guestPosters.unshift(newCopy);
        localStorage.setItem("guest_posters", JSON.stringify(guestPosters));
        safeToastSuccess("Poster duplicated! Opening new copy in editor... 🎨");
        onClose();
        router.push(`/pages/createPoster?posterId=${newId}&edit=true`);
        return;
      } catch (err) {
        console.warn("Guest duplicate failed:", err);
      }
    }

    onClose();
    router.push(`/pages/createPoster?posterId=${posterData._id}&duplicate=true`);
  };

  // Close download menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    if (showDownloadMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDownloadMenu]);

  // Sync theme when modal opens or theme changes
  useEffect(() => {
    const syncTheme = () => {
      const saved = localStorage.getItem("poster_theme") || localStorage.getItem("spa_theme");
      if (saved) {
        setIsDarkMode(saved === "dark");
      } else if (typeof document !== "undefined") {
        setIsDarkMode(document.documentElement.classList.contains("dark"));
      }
    };
    syncTheme();
    window.addEventListener("themechange", syncTheme);
    return () => window.removeEventListener("themechange", syncTheme);
  }, [isOpen]);

  if (!isOpen) return null;

  // Conditional removal of missing fields as per requirement:
  // "if something isnt present jkust simply remove it from the page"
  const title = (posterData?.poster_title || posterData?.poster_name || "").trim();
  const productName = (posterData?.product_name || "").trim();
  const showHeader = Boolean(title || productName);

  const imageSrc = activeImage ? getPosterImageSrc(activeImage) : "";
  const isVideo =
    typeof imageSrc === "string" &&
    (imageSrc.endsWith(".mp4") ||
      imageSrc.endsWith(".webm") ||
      imageSrc.endsWith(".mov") ||
      posterData?.isVideo);

  const companyLogo =
    posterData?.company_logo || posterData?.company_id?.logo
      ? getPosterImageSrc(posterData.company_logo || posterData.company_id?.logo || "")
      : "/uploads/companies/default-company/logo-1779622107439-878996187.webp";

  const companyName = posterData?.company_id?.name || posterData?.companyName || "KrishTech Computers";

  const hasMultiplePosters = postersList && postersList.length > 1;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Floating Top-Right Controls */}
      <div
        className="fixed top-2.5 right-2.5 sm:top-4 sm:right-4 z-[120] flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={toggleTheme}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
            isDarkMode
              ? "border-gray-700/80 bg-black/60 text-amber-400 hover:text-amber-300 hover:border-gray-500"
              : "border-gray-300 bg-white/90 text-gray-700 hover:bg-gray-100"
          }`}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onClose}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md ${
            isDarkMode
              ? "border-gray-700/80 bg-black/60 text-white/90 hover:text-white hover:bg-red-500/20 hover:border-red-500/50"
              : "border-gray-300 bg-white/90 text-gray-700 hover:text-red-600 hover:bg-red-50 hover:border-red-300"
          }`}
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ════════════════ CENTERED MODAL DIALOG CONTAINER ════════════════ */}
      <div
        className={`relative flex flex-col h-[94vh] sm:h-[92vh] max-h-[860px] max-w-4xl w-full rounded-2xl sm:rounded-3xl border shadow-2xl transition-all overflow-hidden my-auto ${
          isDarkMode
            ? "bg-[#12141D]/95 border-white/10 text-white shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl"
            : "bg-white/95 border-gray-200 text-gray-900 shadow-[0_25px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MODAL HEADER ── */}
        <div
          className={`flex items-center justify-between px-3 sm:px-5 py-2 sm:py-2.5 border-b shrink-0 ${
            isDarkMode ? "border-white/10 bg-[#161824]" : "border-gray-200 bg-gray-50/80"
          }`}
        >
          {/* Left: Company / Poster Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            {companyLogo && (
              <div
                className="w-8 h-8 rounded-full border border-white/20 bg-[#12141C] overflow-hidden flex items-center justify-center shrink-0 shadow-sm"
                title={companyName}
              >
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="w-full h-full object-contain p-0.5"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className={`text-xs sm:text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {title || productName || "Poster Preview"}
              </span>
              {hasMultiplePosters && currentIndex >= 0 && (
                <span className="text-[10px] text-gray-400 font-medium">
                  Poster {currentIndex + 1} of {postersList.length}
                </span>
              )}
            </div>
          </div>

          {/* Right: Modal Card Close Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                isDarkMode
                  ? "border-white/10 bg-white/5 text-gray-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400"
                  : "border-gray-200 bg-white text-gray-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
              }`}
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── MODAL BODY (CENTER STAGE) ── */}
        <div className="relative flex-1 flex flex-row items-center justify-center p-1.5 sm:p-2.5 overflow-hidden gap-1.5 sm:gap-3 min-h-0 min-w-0 w-full">
          {/* Gallery Sidebar / Thumbnails if multiple images exist */}
          {galleryItems.length > 1 && (
            <div className="flex flex-col items-center gap-1.5 max-w-full overflow-y-auto max-h-[60vh] py-1 px-1 shrink-0 z-10">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden sm:block">
                Gallery
              </span>
              {galleryItems.map((item, idx) => {
                if (failedGalleryIndices.includes(idx)) return null;
                const isSelected = item === activeImage;
                const src = getPosterImageSrc(item);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setIsMainImageFailed(false);
                      setSelectedGalleryImage(item);
                    }}
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 shadow-xs ${
                      isSelected
                        ? "border-[#FF5722] ring-2 ring-[#FF5722]/50 scale-105"
                        : "border-white/20 opacity-70 hover:opacity-100 hover:border-white/60"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-full object-contain p-0.5"
                      onError={() => {
                        setFailedGalleryIndices((prev) => [...prev, idx]);
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Left Prev Navigation Arrow */}
          {hasMultiplePosters && (
            <button
              type="button"
              onClick={handlePrev}
              className="flex shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FF5722] hover:bg-[#FF7043] active:scale-95 items-center justify-center text-white shadow-md transition-all cursor-pointer z-10"
              title="Previous poster (Left arrow)"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Centered Scaled Poster Container */}
          <div
            ref={posterContainerRef}
            className="flex-1 flex items-center justify-center h-full w-full min-h-0 min-w-0 overflow-hidden relative select-none"
          >
            {isLoading && !posterData ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 px-8 bg-black/10 dark:bg-white/5 rounded-2xl border border-white/10">
                <OrangeSpinner size={32} />
                <span className="text-xs text-gray-400">Loading poster details...</span>
              </div>
            ) : (
              <div
                style={{
                  width: `${440 * scale}px`,
                  height: `${607.2 * scale}px`,
                  position: "relative",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "width 0.1s ease-out, height 0.1s ease-out",
                }}
              >
                <div
                  style={{
                    width: "440px",
                    height: "607.2px",
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  <div
                    ref={cardRef}
                    id="poster-bill-card"
                    className="w-[440px] h-[607.2px] flex items-center justify-center overflow-hidden"
                  >
                    <PosterCanvasView
                      poster={normalizedPoster}
                      readOnly={true}
                      className="!w-[440px] !max-w-none !h-[607.2px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Next Navigation Arrow */}
          {hasMultiplePosters && (
            <button
              type="button"
              onClick={handleNext}
              className="flex shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FF5722] hover:bg-[#FF7043] active:scale-95 items-center justify-center text-white shadow-md transition-all cursor-pointer z-10"
              title="Next poster (Right arrow)"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* ── MODAL FOOTER / ACTION TOOLBAR ── */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2 sm:py-2.5 border-t shrink-0 ${
            isDarkMode ? "border-white/10 bg-[#161824]" : "border-gray-200 bg-gray-50/80"
          }`}
        >
          {/* Mobile Prev/Next navigation */}
          {hasMultiplePosters ? (
            <div className="flex sm:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 rounded-lg bg-[#FF5722] text-white flex items-center justify-center cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 rounded-lg bg-[#FF5722] text-white flex items-center justify-center cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : <div />}

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                isDarkMode
                  ? "border-white/10 bg-[#1B1E2B] hover:bg-[#252A3C] text-gray-300"
                  : "border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
              title="Close modal"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#FF5722] hover:bg-[#FF7043] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="Share poster link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Edit Button */}
            <button
              type="button"
              onClick={handleEdit}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#FF5722] hover:bg-[#FF7043] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="Edit poster"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            {/* Download Dropdown */}
            <div className="relative" ref={downloadMenuRef}>
              <button
                type="button"
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={isDownloading}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#FF5722] hover:bg-[#FF7043] disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                title="Download Options (PDF, PNG, Duplicate in Editor)"
              >
                {isDownloading ? <OrangeSpinner size={14} /> : <Download className="w-3.5 h-3.5" />}
                <span>{isDownloading ? "Downloading..." : "Download"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showDownloadMenu ? "rotate-180" : ""}`} />
              </button>

              {showDownloadMenu && (
                <div
                  className={`absolute right-0 bottom-full mb-2 w-52 rounded-xl border shadow-2xl p-1 z-50 flex flex-col gap-0.5 ${
                    isDarkMode ? "bg-[#181B26] border-white/10" : "bg-white border-gray-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleExport("pdf")}
                    className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      isDarkMode ? "hover:bg-white/10 text-gray-200" : "hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#FF5722]" />
                      <span>Save as PDF</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">Print A4</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExport("png")}
                    className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      isDarkMode ? "hover:bg-white/10 text-gray-200" : "hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-[#FF5722]" />
                      <span>Save as PNG</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">High-Res</span>
                  </button>

                  <div className={`h-px my-1 ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`} />

                  <button
                    type="button"
                    onClick={handleDuplicateToEditor}
                    className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                      isDarkMode ? "hover:bg-white/10 text-gray-200" : "hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5 text-[#FF5722]" />
                    <span>Duplicate in Editor</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
