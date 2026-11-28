"use client";
import React, { useEffect, useLayoutEffect, useState } from "react";
import apiClient, { publicApiClient } from "@utilis/apiClient";
import { API_ENDPOINTS, getPosterImageSrc } from "@constants/api";
import { posterThemes } from "@constants/posterThemes";
import { POSTER_ASPECT_RATIOS, AspectRatioKey } from "@constants/posterAspectRatios";
import { PosterFrame0 } from "@components/frames/blank/PosterFrame0";
import { PosterFrame1 as PosterFrame } from "@components/frames/classic/PosterFrame1";
import { toast } from "react-toastify";
import { PosterFrame2 } from "@components/frames/classic/PosterFrame2";
import { PosterFrame3 } from "@components/frames/classic/PosterFrame3";
import { PosterFrame4 } from "@components/frames/classic/PosterFrame4";
import { PosterFrame5 } from "@components/frames/classic/PosterFrame5";
import { PosterFrame6 } from "@components/frames/classic/PosterFrame6";
import { PosterFrame7 } from "@components/frames/minimal/PosterFrame7";
import { PosterFrame8 } from "@components/frames/minimal/PosterFrame8";
import { PosterFrame9 } from "@components/frames/minimal/PosterFrame9";
import { PosterFrame10 } from "@components/frames/minimal/PosterFrame10";
import { PosterFrame11 } from "@components/frames/creative/PosterFrame11";
import { PosterFrame12 } from "@components/frames/creative/PosterFrame12";
import { PosterFrame13 } from "@components/frames/business/PosterFrame13";
import { PosterFrame14 } from "@components/frames/business/PosterFrame14";
import { PosterFrame15 } from "@components/frames/premium/PosterFrame15";
import { PosterFrame16 } from "@components/frames/premium/PosterFrame16";
import { PosterFrame17 } from "@components/frames/premium/PosterFrame17";
import { PosterFrame18 } from "@components/frames/premium/PosterFrame18";
import { PosterFrame19 } from "@components/frames/premium/PosterFrame19";
import { PosterFrame20 } from "@components/frames/premium/PosterFrame20";
import { PosterFrame21 } from "@components/frames/premium/PosterFrame21";
import { PosterFrame22 } from "@components/frames/premium/PosterFrame22";
import { PosterFrame23 } from "@components/frames/premium/PosterFrame23";
import { PosterFrame24 } from "@components/frames/premium/PosterFrame24";
import { PosterFrame25 } from "@components/frames/premium/PosterFrame25";
import { PosterFrame26 } from "@components/frames/premium/PosterFrame26";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, Clock, Heart, MessageCircle, X, Share2, Sun, Moon, ShoppingCart, Phone, Volume2, VolumeX, Trash2, Save, Plus, Tag, Store, MapPin, CheckCircle, Download } from "lucide-react";
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import { OrangeSpinner } from "@components/Button";
import * as htmlToImage from "html-to-image";
import { useRef } from "react";
import { PosterCanvasView, normalizePosterData } from "@components/PosterCanvasView";

interface PosterType {
  _id: string;
  poster_title?: string;
  product_name?: string;
  product_image?: string;
  product_gallery_images?: string[];
  product_gallery_zoom?: number[];
  product_gallery_positions?: { x: number; y: number }[];
  company_logo?: string;
  template?: "frame0" | "frame1" | "frame2" | "frame3" | "frame4" | "frame5" | "frame6" | "frame7" | "frame8" | "frame9" | "frame10" | "frame11" | "frame12" | "frame13" | "frame14" | "frame15" | "frame16" | "frame17" | "frame18" | "frame19" | "frame20" | "frame21" | "frame22" | "frame23" | "frame24" | "frame25" | "frame26";
  theme?: keyof typeof posterThemes;
  logo_zoom?: number;
  product_zoom?: number;
  product_description?: string;
  product_price?: number;
  logo_position?: { x: number; y: number };
  product_position?: { x: number; y: number };
  upiId?: string;
  companyName?: string;
  companyPhone?: string;
  aspect_ratio?: string;
  custom_colors?: string;
  isSold?: boolean;
  company_id?: {
    _id?: string;
    name?: string;
    logo?: string;
    phone?: string;
    city?: string;
  };
}
interface Reply {
  _id: string;
  userId: string | null;
  name: string | null;
  text: string;
  likes: string[];
}

interface Comment {
  _id: string;
  userId: string;
  name: string | null;
  text: string;
  showReplies?: boolean;
  likes: string[];
  replies: Reply[];
}

interface LikedUser {
  userId: string;
  name: string;
}

interface PosterInteraction {
  likesCount: number; // required
  likedByMe: boolean; // required
  likes: string[]; // required
  likedUsers: LikedUser[]; // required
  comments: Comment[];
}

type InteractionsState = Record<string, PosterInteraction>;

export default function SharedPosterView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const openTarget = searchParams.get("open");
  const posterId = searchParams.get("poster");
  const isEditMode = searchParams.get("edit") === "true";
  const [removedPosterIds, setRemovedPosterIds] = useState<string[]>([]);
  const [savingLinkEdit, setSavingLinkEdit] = useState(false);
  const [checkingAddable, setCheckingAddable] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const [interactions, setInteractions] = useState<InteractionsState>(() => ({}));
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"comments" | "likes">("comments");
  const [shareLinkName, setShareLinkName] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [posters, setPosters] = useState<PosterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkError, setLinkError] = useState<{ isRevoked?: boolean; isExpired?: boolean; message?: string } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [centerHeartPosterId, setCenterHeartPosterId] = useState<string | null>(null);
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);
  const [selectedModalPoster, setSelectedModalPoster] = useState<PosterType | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [flyingHearts, setFlyingHearts] = useState<{ id: string; x: number; y: number; rotate: number }[]>([]);
  const [activeCommentsId, setActiveCommentsId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("spa_theme") || localStorage.getItem("poster_theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const [showMobileButtons, setShowMobileButtons] = useState(true);
  const [scrollHintDismissed, setScrollHintDismissed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const mobileButtonsTimer = useRef<NodeJS.Timeout | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({});
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<Record<string, string>>({});
  const progressBarRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStartRef = useRef(0);
  const timerElapsedRef = useRef(0);
  const prevPosterIndexRef = useRef(0);
  const prevMediaKeyRef = useRef("");
  const chevronLastTapRef = useRef(0);
  const [viewportSize, setViewportSize] = useState(() => {
    if (typeof window !== "undefined") return { w: window.innerWidth, h: window.innerHeight };
    return { w: 550, h: 900 };
  });

  useEffect(() => {
    const handleThemeSync = () => {
      const saved = localStorage.getItem("spa_theme") || localStorage.getItem("poster_theme");
      if (saved) {
        setIsDarkMode(saved === "dark");
      } else {
        setIsDarkMode(document.documentElement.classList.contains("dark"));
      }
    };
    window.addEventListener("themechange", handleThemeSync);
    window.addEventListener("storage", handleThemeSync);
    return () => {
      window.removeEventListener("themechange", handleThemeSync);
      window.removeEventListener("storage", handleThemeSync);
    };
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("poster_theme", next ? "dark" : "light");
      localStorage.setItem("spa_theme", next ? "dark" : "light");
      if (typeof document !== "undefined") {
        if (next) {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
          document.documentElement.style.colorScheme = "dark";
          document.body.style.backgroundColor = "#0D0E12";
          document.body.style.color = "#E0E2EC";
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.classList.add("light");
          document.documentElement.style.colorScheme = "light";
          document.body.style.backgroundColor = "#F8F9FC";
          document.body.style.color = "#111827";
        }
        window.dispatchEvent(new Event("themechange"));
      }
      return next;
    });
  };

  // Auto-hide buttons on mobile after 3 seconds
  const resetMobileButtonsTimer = () => {
    if (mobileButtonsTimer.current) clearTimeout(mobileButtonsTimer.current);
    setShowMobileButtons(true);
    mobileButtonsTimer.current = setTimeout(() => setShowMobileButtons(false), 1500);
  };

  // Sync muted state to all video elements in the page
  useEffect(() => {
    const videos = document.querySelectorAll<HTMLVideoElement>('.view-mode video');
    videos.forEach((v) => {
      // Find the closest section and its data-index
      const section = v.closest('section[data-index]');
      const idx = section ? parseInt(section.getAttribute('data-index') || '-1', 10) : -1;
      if (idx === currentPosterIndex) {
        v.muted = isMuted;
        if (!isMuted) {
          const p = v.play();
          if (p && typeof p.catch === "function") p.catch(() => { });
        }
      } else {
        v.pause();
        v.muted = true;
      }
    });
  }, [isMuted, currentPosterIndex]);

  // Auto-dismiss scroll hint after 6s (only relevant while user is on first poster)
  useEffect(() => {
    if (loading || posters.length <= 1) return;
    const t = setTimeout(() => setScrollHintDismissed(true), 6000);
    return () => clearTimeout(t);
  }, [loading, posters.length]);

  // Dismiss scroll hint as soon as the user moves past the first poster
  useEffect(() => {
    if (currentPosterIndex > 0) setScrollHintDismissed(true);
  }, [currentPosterIndex]);

  // Track viewport size for poster scale computation
  useEffect(() => {
    const onResize = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    resetMobileButtonsTimer();
    return () => { if (mobileButtonsTimer.current) clearTimeout(mobileButtonsTimer.current); };
  }, [currentPosterIndex]);

  // Helper to detect video URLs
  const isVideoUrl = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase().split('?')[0];
    return ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'].some(ext => lower.endsWith(ext));
  };

  const handleToggleSold = async (posterId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const linkToken = searchParams.get("token") || "";

      const res = await apiClient.patch(
        API_ENDPOINTS.MARKETPLACE.TOGGLE_SOLD(posterId),
        { linkToken },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data?.success) {
        const isSold = res.data.isSold;
        setPosters((prev) =>
          prev.map((p) =>
            p._id === posterId || (p as any).posterId === posterId
              ? { ...p, isSold }
              : p
          )
        );
        safeToastSuccess(
          res.data.message ||
          (isSold
            ? "Marked as SOLD & removed from marketplace"
            : "Marked as Available")
        );
      }
    } catch (err: any) {
      console.error("Failed to toggle sold status:", err);
      safeToastError(err.response?.data?.message || "Failed to update sold status");
    }
  };

  // Detect video durations on poster load
  useEffect(() => {
    posters.forEach((poster) => {
      if (videoDurations[poster._id]) return;
      const src = getPosterImageSrc(poster.product_image || "");
      if (isVideoUrl(src)) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          if (video.duration && isFinite(video.duration)) {
            setVideoDurations(prev => ({ ...prev, [poster._id]: video.duration }));
          }
        };
        video.src = src;
      }
    });
  }, [posters]);

  // Auto-advance timer with progress bar
  useEffect(() => {
    const poster = posters[currentPosterIndex];
    if (!poster) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Use selected gallery image when present, otherwise use main product image
    const selectedImagePath = selectedGalleryImages[poster._id] || "";
    const src = getPosterImageSrc(selectedImagePath || poster.product_image || "");
    const currentMediaKey = `${poster._id}:${selectedImagePath || "main"}`;

    // Reset on poster change or media change within the same poster
    if (prevPosterIndexRef.current !== currentPosterIndex || prevMediaKeyRef.current !== currentMediaKey) {
      timerElapsedRef.current = 0;
      if (progressBarRef.current) progressBarRef.current.style.width = '0%';
      prevPosterIndexRef.current = currentPosterIndex;
      prevMediaKeyRef.current = currentMediaKey;
    }

    // Pause when comments are open
    if (activeCommentsId) {
      if (timerStartRef.current > 0) {
        timerElapsedRef.current = Date.now() - timerStartRef.current;
      }
      return;
    }

    const videoDur = isVideoUrl(src) ? videoDurations[poster._id] : undefined;
    const duration = videoDur ? videoDur * 1000 : 15000;

    timerStartRef.current = Date.now() - timerElapsedRef.current;

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - timerStartRef.current;
      const progress = Math.min((elapsed / duration) * 100, 100);
      if (progressBarRef.current) progressBarRef.current.style.width = `${progress}%`;
      if (progress >= 100) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        timerElapsedRef.current = 0;
        if (currentPosterIndex < posters.length - 1) {
          document.querySelector(`section[data-index='${currentPosterIndex + 1}']`)?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 50);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [currentPosterIndex, posters, videoDurations, activeCommentsId, selectedGalleryImages]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fetchPosters(token!); // fetch next page
          }
        });
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [loadMoreRef.current, hasMore, token]);

  useEffect(() => {
    if (!posters.length || !posterId) return;
    const index = posters.findIndex(p => p._id === posterId);
    if (index !== -1) {
      setCurrentPosterIndex(index);
      setTimeout(() => {
        const section = document.querySelector(`section[data-index='${index}']`);
        section?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);

      // Auto open comment panel if requested
      if (openTarget === "comments") {
        setTimeout(() => {
          openComments(posterId);
        }, 500);
      }
    }
  }, [posters, posterId, openTarget]);

  const fetchPosters = async (token: string) => {
    try {
      setLoading(true);

      const res = await publicApiClient.get(API_ENDPOINTS.SHARABLE_LINKS.GET_SHARED(token));

      if (res.data.success) {
        setPosters(res.data.posters);
        setShareLinkName(res.data.name || "");
        setHasMore(false); // No more pagination
      } else {
        safeToastError("Failed to fetch shared posters");
      }

    } catch (err: any) {
      const data = err?.response?.data;
      if (err?.response?.status === 410 || data?.isRevoked || data?.isExpired) {
        setLinkError({
          isRevoked: Boolean(data?.isRevoked),
          isExpired: Boolean(data?.isExpired),
          message: data?.message || "This shareable link is no longer accessible."
        });
      } else {
        setLinkError({
          message: data?.message || "Poster not found or invalid link."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async (token: string, posters: PosterType[]) => {
    try {
      const updated: typeof interactions = {};
      const loggedUserId = localStorage.getItem("user_id");

      for (const poster of posters) {
        const res = await publicApiClient.get(
          API_ENDPOINTS.SHARABLE_LINKS.GET_SHARED_INTERACTIONS(token, poster._id)
        );
        if (res.data.success) {
          const likesArray = res.data.likes?.map((id: any) => id.toString()) || [];
          updated[poster._id] = {
            likesCount: res.data.likesCount ?? 0,
            likedByMe: likesArray.includes(loggedUserId || ""),
            likedUsers: res.data.likedUsers || [],
            likes: likesArray,
            comments: res.data.comments.map((c: any) => ({
              _id: c._id,
              userId: c.user,
              name: c.name || "Anonymous",
              text: c.text,
              likes: c.likes || [],
              showReplies: false,
              replies: (c.replies || []).map((r: any) => ({
                _id: r._id,
                userId: r.user,
                name: r.name || "Anonymous",
                text: r.text,
                likes: r.likes || [],
              })),
            })),
          } as PosterInteraction;

        }
      }
      setInteractions(updated);
    } catch (err) {
      safeToastError("Error fetching interactions");
    }
  };

  useEffect(() => {
    if (token) {
      fetchPosters(token);
    } else {
      setLoading(false);
      setLinkError({ message: "No shareable link token provided." });
    }
  }, [token]);

  useEffect(() => {
    if (!token || !posters.length) return;
    fetchInteractions(token, posters);
  }, [token, posters]);

  useEffect(() => {
    const sections = document.querySelectorAll("section[data-poster]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute("data-index") || "0", 10);
            setCurrentPosterIndex(index);
          }
        });
      },
      { threshold: 0.6 } // detects when 60% of poster is in view
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, [posters]);

  const handleLikeClick = async (posterId: string) => {
    const userId = localStorage.getItem("user_id");
    const name = localStorage.getItem("firstName"); // <-- get name
    const tkn = localStorage.getItem("token");
    if (!userId || !tkn || !name) {
      safeToastError("Login required to like a poster");
      const currentUrl = window.location.href;
      window.location.href = `/pages/login?redirect=${encodeURIComponent(currentUrl)}${token ? `&token=${token}` : ""}`;
      return;
    }

    setCenterHeartPosterId(posterId);
    setTimeout(() => setCenterHeartPosterId(null), 1000);

    const newHearts = Array.from({ length: 7 }).map(() => ({
      id: Math.random().toString(36).substr(2, 9),
      x: (Math.random() - 0.5) * 50,
      y: (Math.random() - 0.5) * 50,
      rotate: Math.random() * 360,
    }));
    setFlyingHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setFlyingHearts((prev) => prev.filter((h) => !newHearts.includes(h)));
    }, 1200);

    try {
      const res = await apiClient.post(
        API_ENDPOINTS.SHARABLE_LINKS.LIKE(token!, posterId),
        { userId, name }, // <-- send name here
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        setInteractions((prev) => ({
          ...prev,
          [posterId]: {
            ...prev[posterId],
            likesCount: res.data.totalLikes,
            likedByMe: res.data.liked,
          },
        }));
      }
    } catch (err: any) {
      safeToastError("Error liking poster");
    }
  };

  const handleCommentPost = async (posterId: string) => {
    try {
      const userId = localStorage.getItem("user_id");
      const name = localStorage.getItem("firstName");
      const tkn = localStorage.getItem("token");
      const text = commentInput[posterId]?.trim();

      if (!text) return;

      if (!userId || !name || !tkn) {
        safeToastError("Login required to comment");
        const currentUrl = window.location.href;
        const loginUrl = `/pages/login?redirect=${encodeURIComponent(currentUrl)}${token ? `&token=${token}` : ""}`;
        window.location.href = loginUrl;
        return;
      }
      const res = await apiClient.post(
        API_ENDPOINTS.SHARABLE_LINKS.COMMENT(token!, posterId),
        { userId, name, text },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        setInteractions((prev) => {
          const posterInteraction = prev[posterId] || { likes: [], comments: [] };

          return {
            ...prev,
            [posterId]: {
              ...posterInteraction,
              comments: [
                ...(posterInteraction.comments || []),
                {
                  _id: res.data.commentId,
                  userId,
                  name,
                  text,
                  likes: [],
                  replies: [],
                },
              ],
            },
          };
        });

        setCommentInput((prev) => ({ ...prev, [posterId]: "" }));
      }
    } catch (err: any) {
      safeToastError("Error posting comment");
    }
  };

  const handleCommentLike = async (posterId: string, commentId: string) => {
    try {
      const userId = localStorage.getItem("user_id");
      const tkn = localStorage.getItem("token");
      if (!userId || !tkn) {
        safeToastError("Login required to like a comment");
        const currentUrl = window.location.href;
        window.location.href = `/pages/login?redirect=${encodeURIComponent(currentUrl)}${token ? `&token=${token}` : ""}`;
        return;
      }
      const res = await apiClient.post(
        API_ENDPOINTS.SHARABLE_LINKS.COMMENT_LIKE(token!, posterId, commentId),
        { userId },
        {
          headers: {
            Authorization: `Bearer ${tkn}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.data.success) {
        setInteractions((prev) => ({
          ...prev,
          [posterId]: {
            ...prev[posterId],
            comments: prev[posterId].comments.map((c) =>
              c._id === commentId
                ? {
                  ...c,
                  likes: res.data.liked
                    ? Array.from(new Set([...(c.likes || []), userId]))
                    : (c.likes || []).filter((id) => id !== userId),
                }
                : c
            ),
          },
        }));
      }
    } catch (err: any) {
      safeToastError("Error liking comment");
    }
  };

  const handleReplyPost = async (posterId: string, commentId: string) => {
    try {
      const userId = localStorage.getItem("user_id");
      const name = localStorage.getItem("firstName");
      const text = replyInputs[commentId]?.trim();
      const tkn = localStorage.getItem("token");
      if (!userId || !tkn) {
        safeToastError("Login required to reply");
        const currentUrl = window.location.href;
        window.location.href = `/pages/login?redirect=${encodeURIComponent(currentUrl)}${token ? `&token=${token}` : ""}`;
        return;
      }
      if (!text) return;

      const res = await apiClient.post(
        API_ENDPOINTS.SHARABLE_LINKS.REPLY_COMMENT(token!, posterId, commentId),
        { userId, name, text }
      );
      if (res.data.success) {
        setInteractions((prev) => {
          const p = prev as InteractionsState;
          const posterInteraction = p[posterId] ?? { likes: [], comments: [] };
          const updatedComments = (posterInteraction.comments ?? []).map((c) =>
            c._id === commentId
              ? {
                ...c,
                replies: [
                  ...(c.replies ?? []),
                  {
                    _id: res.data.reply._id,
                    userId,
                    name,
                    text,
                    likes: [],
                  },
                ],
              }
              : c
          );

          return {
            ...p,
            [posterId]: {
              ...posterInteraction,
              comments: updatedComments,
            },
          };
        });
        setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
        setActiveReplyCommentId(null);
      }
    } catch (err: any) {
      safeToastError("Error posting reply");
    }
  };

  const handleSharePoster = async (posterId: string, posterTitle?: string) => {
    const node = document.querySelector(`#poster-${posterId} > *`);
    if (!node) return;

    const hasVideo = !!node.querySelector("video");
    const toastId = toast.loading(
      hasVideo ? "🎬 Preparing video for sharing..." : "🖼 Preparing poster for sharing..."
    );

    try {
      let file: File;

      if (hasVideo) {
        // 🎬 Video flow (prepare from backend)
        const res = await apiClient.post(
          API_ENDPOINTS.POSTERS.RENDER_VIDEO,
          {
            user_id: localStorage.getItem("user_id"),
            poster_id: posterId,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            responseType: "blob",
          }
        );

        const blob = res.data;
        file = new File([blob], `${posterTitle || "poster"}.mp4`, { type: "video/mp4" });

        setPendingFile(file);
        toast.update(toastId, {
          render: "✅ Video ready — click Share again to send!",
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });
        return;
      }

      // 🖼 Image → capture and crop automatically
      const dataUrl = await htmlToImage.toPng(node as HTMLElement, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });

      // Auto-crop transparent or white edges
      const croppedDataUrl = await cropImageWhiteSpace(dataUrl);
      const blob = await fetch(croppedDataUrl).then((res) => res.blob());
      file = new File([blob], `${posterTitle || "poster"}.png`, { type: "image/png" });

      await navigator.share({
        title: posterTitle || "Poster",
        text: "Check out this poster!",
        files: [file],
      });

      toast.update(toastId, {
        render: "✅ Poster shared successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      toast.update(toastId, {
        render: "❌ Failed to share poster",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const cropImageWhiteSpace = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const { data, width, height } = imageData;

        let top = null,
          left = null,
          right = null,
          bottom = null;

        // Find bounding box of non-white / non-transparent pixels
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = data[index],
              g = data[index + 1],
              b = data[index + 2],
              a = data[index + 3];

            // If not white (tolerate small variations)
            if (a > 0 && !(r > 240 && g > 240 && b > 240)) {
              if (top === null) top = y;
              if (left === null || x < left) left = x;
              if (right === null || x > right) right = x;
              bottom = y;
            }
          }
        }

        if (top === null) return resolve(dataUrl); // no change if empty

        const cropWidth = right! - left! + 1;
        const cropHeight = bottom! - top! + 1;

        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;
        const croppedCtx = croppedCanvas.getContext("2d")!;
        croppedCtx.drawImage(
          img,
          left!,
          top!,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        resolve(croppedCanvas.toDataURL("image/png"));
      };
      img.src = dataUrl;
    });
  };

  const handleSharePosterClick = async (posterId: string, posterTitle?: string) => {
    if (pendingFile) {
      try {
        await navigator.share({
          title: pendingFile.name,
          text: "Check out this poster!",
          files: [pendingFile],
        });
        toast.success("🎉 Shared successfully!");
        setPendingFile(null);
      } catch (err) {
        toast.error("❌ Failed to share file");
      }
    } else {
      await handleSharePoster(posterId, posterTitle);
    }
  };

  const handleDownloadPoster = async (poster: PosterType) => {
    try {
      const src = getPosterImageSrc(poster.product_image || "");
      const isVideo = isVideoUrl(src);

      // 🎬 For video posters, download the video file
      if (isVideo) {
        if (!src) {
          safeToastError("No video media available to download");
          return;
        }
        safeToastSuccess("Preparing video download...");
        const response = await fetch(src);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanName = (poster.product_name || poster.poster_title || "renote-poster")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .slice(0, 32);
        a.download = `${cleanName || "poster"}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        safeToastSuccess("Video download started");
        return;
      }

      // 🖼 For styled image posters, capture the full rendered poster card (frame, title, price, logo)
      const node =
        document.querySelector(`#poster-${poster._id} .poster-frame-wrapper`) ||
        document.querySelector(`#poster-${poster._id} > *`) ||
        document.querySelector(`section[data-index='${currentPosterIndex}'] .poster-frame-wrapper`);

      if (node) {
        safeToastSuccess("Generating high-resolution poster...");
        const dataUrl = await htmlToImage.toPng(node as HTMLElement, {
          quality: 1,
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "#ffffff",
        });
        const croppedDataUrl = await cropImageWhiteSpace(dataUrl);
        const blob = await fetch(croppedDataUrl).then((r) => r.blob());
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanName = (poster.product_name || poster.poster_title || "renote-poster")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .slice(0, 32);
        a.download = `${cleanName || "poster"}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        safeToastSuccess("Poster downloaded successfully!");
        return;
      }

      // Fallback: direct asset download
      if (src) {
        const response = await fetch(src);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanName = (poster.product_name || poster.poster_title || "renote-poster")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .slice(0, 32);
        a.download = `${cleanName || "poster"}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        safeToastSuccess("Poster downloaded successfully!");
      }
    } catch {
      const src = getPosterImageSrc(poster.product_image || "");
      if (src) window.open(src, "_blank");
    }
  };

  const handlePosterDoubleTap = (posterId: string) => {
    handleLikeClick(posterId)
    setCenterHeartPosterId(posterId);
    setTimeout(() => setCenterHeartPosterId(null), 1200);
  };

  const openComments = (posterId: string) => setActiveCommentsId(posterId);
  const closeComments = () => setActiveCommentsId(null);

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-3 font-sans ${isDarkMode ? "bg-[#0D0E12] text-[#E0E2EC]" : "bg-[#F8F9FC] text-gray-900"}`}>
        <OrangeSpinner size={40} />
        <p className="text-xs font-semibold text-gray-400">Loading poster presentation...</p>
      </div>
    );
  }

  if (linkError) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 font-sans ${isDarkMode ? "bg-[#0D0E12] text-[#E0E2EC]" : "bg-[#F8F9FC] text-gray-900"}`}>
        <div className={`max-w-md w-full p-8 rounded-2xl border text-center shadow-2xl ${isDarkMode ? "bg-[#16181E] border-white/10" : "bg-white border-gray-200"}`}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            {linkError.isRevoked ? <AlertCircle className="w-8 h-8 text-amber-500" /> : <Clock className="w-8 h-8 text-rose-500" />}
          </div>
          <h1 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            {linkError.isRevoked ? "Link Revoked" : linkError.isExpired ? "Link Expired" : "Poster Not Found"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            {linkError.message}
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Go to ReNote
          </a>
        </div>
      </div>
    );
  }

  if (!posters.length) return <div className={`text-center py-10 h-screen flex items-center justify-center ${isDarkMode ? "bg-black text-white" : "bg-gray-50 text-gray-800"}`}>Poster not found</div>;

  const PosterCanvasViewAdapter: React.FC<any> = (props) => {
    const rawPoster = props.poster || props;
    return (
      <div className="flex items-center justify-center w-full h-full">
        <PosterCanvasView
          poster={normalizePosterData({
            ...rawPoster,
            poster_title: props.tempTitle ?? rawPoster.poster_title,
            product_name: props.tempProductName ?? rawPoster.product_name,
            product_description: props.productSpecs ?? rawPoster.product_description,
            product_price: props.tempPrice ?? rawPoster.product_price,
            product_image: props.productImage ?? rawPoster.product_image,
            company_logo: props.logoImage ?? rawPoster.company_logo,
            template: props.template || rawPoster.template || "frame113",
            imageZoom: props.productZoom ?? rawPoster.product_zoom,
            imagePosition: props.productPosition ?? rawPoster.product_position,
          })}
          readOnly={true}
        />
      </div>
    );
  };

  const templateMap: Record<string, React.FC<any>> = {
    frame0: PosterFrame0,
    frame1: PosterFrame,
    frame2: PosterFrame2,
    frame3: PosterFrame3,
    frame4: PosterFrame4,
    frame5: PosterFrame5,
    frame6: PosterFrame6,
    frame7: PosterFrame7,
    frame8: PosterFrame8,
    frame9: PosterFrame9,
    frame10: PosterFrame10,
    frame11: PosterFrame11,
    frame12: PosterFrame12,
    frame13: PosterFrame13,
    frame14: PosterFrame14,
    frame15: PosterFrame15,
    frame16: PosterFrame16,
    frame17: PosterFrame17,
    frame18: PosterFrame18,
    frame19: PosterFrame19,
    frame20: PosterFrame20,
    frame21: PosterFrame21,
    frame22: PosterFrame22,
    frame23: PosterFrame23,
    frame24: PosterFrame24,
    frame25: PosterFrame25,
    frame26: PosterFrame26,
    frame101: PosterCanvasViewAdapter,
    frame102: PosterCanvasViewAdapter,
    frame103: PosterCanvasViewAdapter,
    frame104: PosterCanvasViewAdapter,
    frame105: PosterCanvasViewAdapter,
    frame106: PosterCanvasViewAdapter,
    frame107: PosterCanvasViewAdapter,
    frame108: PosterCanvasViewAdapter,
    frame109: PosterCanvasViewAdapter,
    frame110: PosterCanvasViewAdapter,
    frame111: PosterCanvasViewAdapter,
    frame112: PosterCanvasViewAdapter,
    frame113: PosterCanvasViewAdapter,
    frame114: PosterCanvasViewAdapter,
    frame115: PosterCanvasViewAdapter,
    frame116: PosterCanvasViewAdapter,
    frame117: PosterCanvasViewAdapter,
    frame118: PosterCanvasViewAdapter,
    frame120: PosterCanvasViewAdapter,
    frame121: PosterCanvasViewAdapter,
    frame122: PosterCanvasViewAdapter,
    frame123: PosterCanvasViewAdapter,
    frame124: PosterCanvasViewAdapter,
    frame125: PosterCanvasViewAdapter,
  };
  const AutoFitText: React.FC<{ text: string }> = ({ text }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // useLayoutEffect runs before paint -> no shake/flicker.
    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const isMobile = window.innerWidth < 768;
      const startSize = isMobile ? 24 : 22;
      const minSize = isMobile ? 16 : 13;
      let newSize = startSize;
      el.style.fontSize = `${newSize}px`;
      while (
        (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) &&
        newSize > minSize
      ) {
        newSize -= 1;
        el.style.fontSize = `${newSize}px`;
      }
    }, [text]);

    return (
      <div
        ref={containerRef}
        className="max-w-full font-bold text-center break-words"
        style={{
          lineHeight: "1.2",
          whiteSpace: "normal",
          wordWrap: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {text}
      </div>
    );
  };

  return (
    <div
      onClick={resetMobileButtonsTimer}
      className={`h-screen w-screen overflow-y-scroll snap-y snap-mandatory hide-scrollbar transition-colors duration-300 ${isDarkMode ? "bg-black" : "bg-gray-50"}`}
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Sleek Standalone Top Bar */}
      <header
        className={`fixed top-0 left-0 right-0 h-12 z-50 px-4 md:px-6 flex items-center justify-between border-b backdrop-blur-md transition-colors ${isDarkMode
            ? "bg-[#0D0E12]/90 border-white/10 text-white"
            : "bg-white/90 border-gray-200 text-gray-900 shadow-xs"
          }`}
      >
        {/* Left: ReNote Brand + Poster Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5722]" />
            <span className="text-sm font-black tracking-tight text-[#FF5722]">
              reNote
            </span>
          </div>
          <span className="text-gray-300 dark:text-gray-700 select-none">|</span>
          <span className="text-xs md:text-sm font-semibold truncate text-gray-700 dark:text-gray-300">
            {posters[currentPosterIndex]?.poster_title ||
              posters[currentPosterIndex]?.product_name ||
              shareLinkName ||
              "Poster View"}
          </span>
        </div>

        {/* Center: Multi-poster navigation counter if > 1 */}
        {posters.length > 1 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 dark:bg-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                const prevIdx = Math.max(0, currentPosterIndex - 1);
                document.querySelector(`section[data-index='${prevIdx}']`)?.scrollIntoView({ behavior: "smooth" });
              }}
              disabled={currentPosterIndex === 0}
              className="hover:text-[#FF5722] disabled:opacity-30 disabled:hover:text-inherit cursor-pointer px-1"
              title="Previous poster"
            >
              ‹
            </button>
            <span>
              {currentPosterIndex + 1} / {posters.length}
            </span>
            <button
              type="button"
              onClick={() => {
                const nextIdx = Math.min(posters.length - 1, currentPosterIndex + 1);
                document.querySelector(`section[data-index='${nextIdx}']`)?.scrollIntoView({ behavior: "smooth" });
              }}
              disabled={currentPosterIndex === posters.length - 1}
              className="hover:text-[#FF5722] disabled:opacity-30 disabled:hover:text-inherit cursor-pointer px-1"
              title="Next poster"
            >
              ›
            </button>
          </div>
        )}

        {/* Right: Theme Toggle & Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isDarkMode
                ? "text-yellow-400 hover:bg-white/10"
                : "text-gray-600 hover:bg-black/5"
              }`}
            title={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 stroke-[2]" /> : <Moon className="w-4 h-4 stroke-[2]" />}
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => {
              const currentPoster = posters[currentPosterIndex] || posters[0];
              handleSharePosterClick(currentPoster?._id || "", currentPoster?.poster_title);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#FF5722] hover:bg-[#FF5722]/10 transition-colors cursor-pointer"
            title="Share poster link"
          >
            <Share2 className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={() => {
              const currentPoster = posters[currentPosterIndex] || posters[0];
              if (currentPoster) handleDownloadPoster(currentPoster);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#FF5722] hover:bg-[#FF5722]/10 transition-colors cursor-pointer"
            title="Download poster"
          >
            <Download className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </header>

      {/* Auto-advance progress bar */}
      <div className="fixed top-12 left-0 w-full h-[3px] z-[60] bg-white/20">
        <div ref={progressBarRef} className="h-full bg-orange-500 rounded-r-full" style={{ width: '0%' }} />
      </div>
      {/* Scroll-down hint — only on first poster, when more than one poster exists */}
      {posters.length > 1 && currentPosterIndex === 0 && (
        <div
          className={`scroll-hint ${isDarkMode ? "" : "scroll-hint--light"} ${scrollHintDismissed ? "scroll-hint--hide" : ""}`}
          aria-hidden="true"
        >
          <span className="scroll-hint__label">Swipe up for more</span>
          <div className="scroll-hint__arrow">
            <span className="scroll-hint__shine" />
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      )}
      {/* Add Posters Button — edit mode only */}
      {isEditMode && (
        <button
          onClick={async () => {
            if (!token || checkingAddable) return;
            const userId = localStorage.getItem("user_id");
            const authToken = localStorage.getItem("token");
            if (!userId || !authToken) {
              safeToastError("Login required");
              return;
            }
            const existingIds = posters
              .filter(p => !removedPosterIds.includes(p._id))
              .map(p => p._id);
            try {
              setCheckingAddable(true);
              const res = await apiClient.get(API_ENDPOINTS.POSTERS.GET_POSTER(userId), {
                headers: { Authorization: `Bearer ${authToken}` },
                params: { limit: 10000 },
              });
              const allPosters: Array<{ _id: string }> = res.data?.posters || [];
              const existingSet = new Set(existingIds);
              const addable = allPosters.filter(p => !existingSet.has(p._id));
              if (allPosters.length === 0) {
                safeToastError("You have no posters to add");
                return;
              }
              if (addable.length === 0) {
                safeToastError("All your posters are already in this link");
                return;
              }
              sessionStorage.setItem(`link_existing_posters_${token}`, JSON.stringify(existingIds));
              router.replace(`/pages/poster?addToLink=${token}`);
            } catch {
              safeToastError("Failed to check posters");
            } finally {
              setCheckingAddable(false);
            }
          }}
          disabled={checkingAddable}
          title="Add posters to link"
          className="fixed z-50 shadow-lg bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center rounded-full
            bottom-6 right-4 w-9 h-9
            md:bottom-6 md:right-6 md:w-auto md:h-11 md:px-5 md:gap-2 md:text-sm"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden md:inline">{checkingAddable ? "Checking..." : "Add Posters"}</span>
        </button>
      )}

      {/* ------------------------------------------------------------- */}
      {/* UNIFIED RESPONSIVE POSTER VIEWER (DESKTOP & MOBILE)           */}
      {/* ------------------------------------------------------------- */}
      {posters.filter(p => !removedPosterIds.includes(p._id)).map((poster, index) => {
        const SelectedPosterFrame =
          templateMap[poster.template || "frame1"] || PosterCanvasViewAdapter;
        const theme = posterThemes[poster.theme || "orangePink"];
        const isCommentsOpen = activeCommentsId === poster._id;
        const arKey: AspectRatioKey = "3:4";
        const aspectConfig = POSTER_ASPECT_RATIOS["3:4"];
        const parsedColors = poster.custom_colors ? (() => { try { return JSON.parse(poster.custom_colors); } catch { return null; } })() : null;
        const hasCustomColors = parsedColors && Object.values(parsedColors).some(Boolean);
        const needsReadabilityBoost = arKey === "3:4" || arKey === "4:5";

        // Compute scale: shrink native poster to fit viewport with padding
        const nativeW = aspectConfig.desktopW;
        const nativeH = aspectConfig.desktopH;
        const isMobile = viewportSize.w < 768;
        const availW = viewportSize.w * (isMobile ? 0.92 : 0.85);
        const availH = viewportSize.h * (isMobile ? 0.78 : 0.82);
        const basePosterScale = viewportSize.w > 0
          ? Math.min(availW / nativeW, availH / nativeH, 1)
          : 0.7;
        const posterScale = Math.min(basePosterScale * (needsReadabilityBoost ? 1.08 : 1), 1);

        return (
          <React.Fragment key={poster._id}>
            <section
              key={poster._id}
              data-poster
              data-index={index}
              className={`h-screen w-screen flex flex-col items-center justify-center pt-3 md:pt-0 snap-start relative overflow-hidden ${isDarkMode ? "bg-black" : "bg-gray-50"}`}
            >
              {/* Poster + Controls Wrapper */}
              <div className="relative -translate-y-4 md:translate-y-0">
                {/* Poster Frame */}
                <div
                  onDoubleClick={() => handlePosterDoubleTap(poster._id)}
                  className="view-mode"
                >
                  <div ref={posterRef} id={`poster-${poster._id}`} className="relative">
                    {isEditMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setRemovedPosterIds(prev => [...prev, poster._id]); }}
                        className="absolute top-3 right-3 z-30 bg-red-600 hover:bg-red-700 rounded-full p-2 shadow-lg"
                        title="Remove from link"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    )}
                    {isVideoUrl(getPosterImageSrc(poster.product_image || "")) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsMuted(prev => {
                            const next = !prev;
                            // Apply immediately within user gesture for autoplay policies
                            const videos = document.querySelectorAll<HTMLVideoElement>('.view-mode video');
                            videos.forEach(v => {
                              v.muted = next;
                              if (!next) {
                                const p = v.play();
                                if (p && typeof p.catch === "function") p.catch(() => { });
                              }
                            });
                            return next;
                          });
                        }}
                        className="absolute bottom-8 left-3 z-40 bg-black/60 hover:bg-black/80 rounded-full p-2 shadow-lg pointer-events-auto"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                      </button>
                    )}
                    <div
                      className={`poster-frame-wrapper ${hasCustomColors ? "custom-colors" : ""} ${/^frame(15|16|17|18|19|20|21|22|23|24|25|26)$/.test(poster.template || "") ? "premium-frame" : ""}`}
                      style={{
                        "--poster-w": `${nativeW}px`,
                        "--poster-h": `${nativeH}px`,
                        "--poster-ratio": String(aspectConfig.ratio),
                        "--poster-scale": String(posterScale),
                        "--textbox-border-boost": String(needsReadabilityBoost ? 1.15 : 1),
                        ...(hasCustomColors ? {
                          "--custom-bg": parsedColors.bg || undefined,
                          "--custom-text": parsedColors.text || undefined,
                          "--custom-accent": parsedColors.accent || undefined,
                          "--custom-border": parsedColors.border || undefined,
                          "--custom-primary": parsedColors.primary || undefined,
                        } : {}),
                      } as React.CSSProperties}
                    >
                      <SelectedPosterFrame
                        poster={poster}
                        template={poster.template}
                        editMode={false}
                        activeEditor={null}
                        toolbarRef={React.createRef()}
                        frameRef={React.createRef()}
                        textContainerRef={React.createRef()}
                        editorRef={React.createRef()}
                        tempTitle={poster.poster_title || ""}
                        setTempTitle={() => { }}
                        tempProductName={poster.product_name || ""}
                        handleProductNameChange={() => { }}
                        productSpecs={poster.product_description || ""}
                        setProductSpecs={() => { }}
                        setActiveEditor={() => { }}
                        tempPrice={
                          poster.product_price && poster.product_price > 0
                            ? poster.product_price.toString()
                            : ""
                        }
                        setTempPrice={() => { }}
                        logoImage={getPosterImageSrc(poster.company_logo || "/uploads/companies/default-company/logo-1779622107439-878996187.webp")}
                        tempLogo={getPosterImageSrc(poster.company_logo || "/uploads/companies/default-company/logo-1779622107439-878996187.webp")}
                        productImage={getPosterImageSrc(selectedGalleryImages[poster._id] || poster.product_image || "")}
                        tempProduct={getPosterImageSrc(selectedGalleryImages[poster._id] || poster.product_image || "")}
                        handleLogoChange={() => { }}
                        logoZoom={poster.logo_zoom || 1}
                        setLogoZoom={() => { }}
                        handleProductChange={() => { }}
                        productZoom={(() => {
                          const selImg = selectedGalleryImages[poster._id];
                          if (selImg && Array.isArray(poster.product_gallery_images)) {
                            const idx = poster.product_gallery_images.indexOf(selImg);
                            if (idx !== -1 && Array.isArray(poster.product_gallery_zoom)) {
                              return poster.product_gallery_zoom[idx] ?? poster.product_zoom ?? 1;
                            }
                          }
                          return poster.product_zoom || 1;
                        })()}
                        setProductZoom={() => { }}
                        AutoFitText={AutoFitText}
                        placeholderProduct=""
                        theme={theme}
                        isMuted={isMuted}
                        logoPosition={
                          poster.logo_position
                            ? {
                              x: poster.logo_position.x ?? 0,
                              y: poster.logo_position.y ?? 0,
                            }
                            : { x: 0, y: 0 }
                        }
                        productPosition={(() => {
                          const selImg = selectedGalleryImages[poster._id];
                          if (selImg && Array.isArray(poster.product_gallery_images)) {
                            const idx = poster.product_gallery_images.indexOf(selImg);
                            if (idx !== -1 && Array.isArray(poster.product_gallery_positions)) {
                              const pos = poster.product_gallery_positions[idx];
                              if (pos) return { x: pos.x ?? 0, y: pos.y ?? 0 };
                            }
                          }
                          return poster.product_position
                            ? { x: poster.product_position.x ?? 0, y: poster.product_position.y ?? 0 }
                            : { x: 0, y: 0 };
                        })()}
                      />
                    </div>
                  </div>
                </div>



                {/* Poster Info — Below Poster (IG Reels Caption Style) */}
                {(poster.poster_title || poster.product_name) && (
                  <div className="mt-2 md:mt-3 px-2 pointer-events-none">
                    {poster.poster_title && (
                      <p className={`font-bold text-sm md:text-base drop-shadow-lg truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {poster.poster_title}
                      </p>
                    )}
                    {poster.product_name && (
                      <p className={`text-xs md:text-sm drop-shadow-md truncate mt-0.5 ${isDarkMode ? "text-white/70" : "text-gray-600"}`}>
                        {poster.product_name}
                      </p>
                    )}
                  </div>
                )}

                {/* Gallery Images Strip — bottom on mobile, left side on desktop */}
                {Array.isArray(poster.product_gallery_images) && poster.product_gallery_images.length > 0 && (() => {
                  const galleryThumbs = (
                    <>
                      {/* Main product image thumbnail */}
                      {poster.product_image && (
                        <button
                          type="button"
                          onClick={() => setSelectedGalleryImages((prev) => ({ ...prev, [poster._id]: "" }))}
                          className="relative flex-shrink-0 w-11 h-11 md:w-14 md:h-14 rounded-md overflow-hidden transition-all"
                          style={{
                            outline: !selectedGalleryImages[poster._id] ? "2px solid #ff6b35" : isDarkMode ? "2px solid #4b5563" : "2px solid #e5e7eb",
                            boxShadow: !selectedGalleryImages[poster._id] ? "0 0 8px rgba(255, 107, 53, 0.4)" : "none",
                          }}
                        >
                          {isVideoUrl(getPosterImageSrc(poster.product_image)) ? (
                            <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                              <svg className={`w-3 h-3 md:w-4 md:h-4 ${isDarkMode ? "text-gray-300" : "text-gray-500"}`} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          ) : (
                            <img src={getPosterImageSrc(poster.product_image)} alt="Main" className="w-full h-full object-cover" />
                          )}
                        </button>
                      )}
                      {poster.product_gallery_images.map((imgPath, idx) => {
                        const src = getPosterImageSrc(imgPath);
                        const isSelected = selectedGalleryImages[poster._id] === imgPath;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedGalleryImages((prev) => ({ ...prev, [poster._id]: imgPath }))}
                            className="relative flex-shrink-0 w-11 h-11 md:w-14 md:h-14 rounded-md overflow-hidden transition-all"
                            style={{
                              outline: isSelected ? "2px solid #ff6b35" : isDarkMode ? "2px solid #4b5563" : "2px solid #e5e7eb",
                              boxShadow: isSelected ? "0 0 8px rgba(255, 107, 53, 0.4)" : "none",
                            }}
                          >
                            {isVideoUrl(src) ? (
                              <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                                <svg className={`w-3 h-3 md:w-4 md:h-4 ${isDarkMode ? "text-gray-300" : "text-gray-500"}`} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                              </div>
                            ) : (
                              <img src={src} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            )}
                          </button>
                        );
                      })}
                    </>
                  );
                  return (
                    <>
                      {/* Mobile: horizontal strip below title */}
                      <div
                        className="md:hidden mt-2 w-fit max-w-[78vw] px-2.5 py-1.5 rounded-2xl bg-black/50 backdrop-blur-sm flex items-center gap-2 overflow-x-auto hide-scrollbar"
                        style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
                      >
                        {galleryThumbs}
                      </div>
                      {/* Desktop: vertical strip with spacing matching right action rail */}
                      {index === currentPosterIndex && (
                        <div
                          className="hidden md:flex fixed top-[50%] -translate-y-1/2 left-2 md:left-[calc(50%-360px)] flex-col items-center gap-4 z-30 rounded-full px-2 py-3 bg-black/50 backdrop-blur-sm max-h-[70vh] overflow-y-auto hide-scrollbar"
                          style={{ scrollBehavior: "smooth" }}
                        >
                          {galleryThumbs}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div
                className={`fixed inset-0 transition-all duration-300 ease-in-out ${isCommentsOpen ? "backdrop-blur-sm bg-black/30 visible" : "invisible"
                  }`}
                style={{ zIndex: isCommentsOpen ? 50 : -1 }}
                onClick={closeComments} // click outside to close (optional)
              >
                {/* Stop click bubbling inside comment box */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed bottom-0 left-0 w-full transition-transform duration-300 ease-in-out ${isCommentsOpen ? "translate-y-0" : "translate-y-full"
                    }`}
                  style={{ height: "45vh" }} // reduced height
                >
                  <div className="flex flex-col h-full w-full rounded-t-2xl bg-white border-t-4 border-orange-500 shadow-md">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                      {/* === Comments & Likes Tabs === */}
                      <div className="flex gap-2 px-3 pt-2">
                        <button
                          onClick={() => setActiveTab("comments")}
                          className={`flex-1 py-2 w-[140px] rounded-lg text-center font-medium transition-all duration-200 
      text-sm sm:text-base
      ${activeTab === "comments"
                              ? "bg-orange-500 text-white shadow-md"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                          Comments ({interactions[poster._id]?.comments?.length || 0})
                        </button>

                        <button
                          onClick={() => setActiveTab("likes")}
                          className={`flex-1 py-2 w-[140px] rounded-lg text-center font-medium transition-all duration-200
      text-sm sm:text-base
      ${activeTab === "likes"
                              ? "bg-orange-500 text-white shadow-md"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                          Likes ({interactions[poster._id]?.likedUsers?.length || 0})
                        </button>
                      </div>

                      <button onClick={closeComments} className="text-gray-500 hover:text-gray-700 transition">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* === CONTENT AREA === */}
                    <div className="px-5 py-3 overflow-y-auto flex-1 space-y-3">
                      {activeTab === "comments" ? (
                        <>
                          {interactions[poster._id]?.comments?.length ? (
                            interactions[poster._id].comments.map((c) => {
                              const loggedUserId = localStorage.getItem("user_id");
                              const likedByMe = c.likes?.includes(loggedUserId || "");

                              return (
                                <div key={c._id} className="flex flex-col gap-1">
                                  {/* Comment */}
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                                      {c.name?.[0] || "?"}
                                    </div>
                                    <div className="bg-orange-50 rounded-xl px-3 py-2 flex-1 border border-orange-100 flex justify-between items-center">
                                      <p className="text-sm text-gray-800">
                                        <strong>{c.userId === loggedUserId ? "You" : c.name || "Anonymous"}</strong>{" "}
                                        {c.text}
                                      </p>
                                      <button
                                        onClick={() => handleCommentLike(poster._id, c._id)}
                                        className="ml-2 flex items-center gap-1"
                                      >
                                        <Heart
                                          className="w-4 h-4"
                                          stroke={likedByMe ? "none" : "currentColor"}
                                          fill={likedByMe ? "red" : "none"}
                                        />
                                        <span className="text-sm">{c.likes?.length || 0}</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Replies */}
                                  {c.replies.map((r, idx) => (
                                    <div key={r._id || `reply-${idx}`} className="flex items-start gap-3">
                                      <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold">
                                        {r.name?.[0] || "?"}
                                      </div>

                                      <div className="bg-gray-100 rounded-xl px-3 py-2 flex-1 text-sm">
                                        <p>
                                          <strong>{r.userId === loggedUserId ? "You" : r.name}</strong>{" "}
                                          {r.text}
                                        </p>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Reply Input */}
                                  <div className="ml-10 mt-1">
                                    <button
                                      onClick={() => setActiveReplyCommentId((prev) => (prev === c._id ? null : c._id))}
                                      className="text-sm text-orange-500 hover:underline mb-1 flex items-center gap-1"
                                    >
                                      {activeReplyCommentId === c._id ? "Cancel Reply" : "Reply"}
                                    </button>

                                    {activeReplyCommentId === c._id && (
                                      <div className="mt-1 flex gap-2 items-center">
                                        <input
                                          type="text"
                                          placeholder="Write a reply..."
                                          value={replyInputs[c._id] || ""}
                                          onChange={(e) =>
                                            setReplyInputs((prev) => ({ ...prev, [c._id]: e.target.value }))
                                          }
                                          className="flex-1 border border-gray-300 rounded-full px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                                        />
                                        <button
                                          onClick={() => handleReplyPost(poster._id, c._id)}
                                          className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm hover:bg-orange-600 transition"
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-gray-400 text-sm">No comments yet. Be the first to comment!</p>
                          )}
                        </>
                      ) : (
                        /* === LIKES LIST === */
                        <>
                          {interactions[poster._id]?.likedUsers?.length ? (
                            interactions[poster._id].likedUsers.map((u) => (
                              <div key={u.userId} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {u.name?.[0] || "?"}
                                </div>
                                <p className="flex-1 text-sm font-medium text-gray-700">{u.name}</p>
                                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-400 text-sm">No likes yet.</p>
                          )}
                        </>
                      )}
                    </div>
                    {/* Input Section */}
                    <div className="border-t border-orange-200 bg-white px-4 py-3 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInput[poster._id] || ""}
                        onChange={(e) =>
                          setCommentInput((prev) => ({ ...prev, [poster._id]: e.target.value }))
                        }
                        className="flex-1 border border-orange-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                      />
                      <button
                        onClick={() => handleCommentPost(poster._id)}
                        className="bg-orange-500 text-white text-sm px-4 py-2 rounded-full hover:bg-orange-600 transition"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </section>
            {/* ❤️ Big Center Heart Animation */}
            {centerHeartPosterId === poster._id && (
              <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <Heart
                  className="w-32 h-32 text-red-500 animate-big-heart"
                  fill="red"
                  stroke="none"
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
      <div ref={loadMoreRef} className="h-10 w-full"></div>
      {loading && hasMore && <div className="text-center py-4">Loading more posters...</div>}

      {/* Sticky Save Button — visible in edit mode when changes exist */}
      {isEditMode && removedPosterIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            {removedPosterIds.length} poster{removedPosterIds.length > 1 ? "s" : ""} removed
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRemovedPosterIds([])}
              disabled={savingLinkEdit}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!token) return;
                const authToken = localStorage.getItem("token");
                const userId = localStorage.getItem("user_id");
                if (!authToken || !userId) {
                  safeToastError("Please login to update this link");
                  return;
                }
                try {
                  setSavingLinkEdit(true);
                  const res = await apiClient.patch(
                    API_ENDPOINTS.SHARABLE_LINKS.UPDATE_SHARED_LINK(token),
                    { userId, removePosterIds: removedPosterIds },
                    { headers: { Authorization: `Bearer ${authToken}` } }
                  );
                  if (res.data.success) {
                    safeToastSuccess("Link updated");
                    setPosters(prev => prev.filter(p => !removedPosterIds.includes(p._id)));
                    setRemovedPosterIds([]);
                  } else {
                    safeToastError(res.data.message || "Failed to update link");
                  }
                } catch (err) {
                  safeToastError("Failed to update link");
                } finally {
                  setSavingLinkEdit(false);
                }
              }}
              disabled={savingLinkEdit}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> {savingLinkEdit ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Fixed Action Buttons + Nav Dots — Right Side */}
      {posters.length > 0 && (() => {
        const currentPoster = posters[currentPosterIndex] || posters[0];
        return (
          <div className={`fixed top-[50%] -translate-y-1/2 right-2 md:right-[calc(50%-360px)] flex flex-col items-center gap-4 z-30 rounded-full px-2 py-3 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${showMobileButtons ? "opacity-100" : "opacity-0 pointer-events-none"} md:opacity-100 md:pointer-events-auto`}>
            {/* Like Button */}
            <button
              onClick={() => handleLikeClick(currentPoster._id)}
              className="flex flex-col items-center gap-0.5 transition"
            >
              <div className="p-1 flex items-center justify-center transition hover:scale-110">
                <Heart
                  className="w-6 h-6"
                  stroke={interactions[currentPoster._id]?.likedByMe ? "none" : "white"}
                  fill={interactions[currentPoster._id]?.likedByMe ? "#ff2d55" : "none"}
                />
              </div>
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {interactions[currentPoster._id]?.likesCount || 0}
              </span>
            </button>

            {/* Comment Button */}
            <button
              onClick={() => openComments(currentPoster._id)}
              className="flex flex-col items-center gap-0.5 transition"
            >
              <div className="p-1 flex items-center justify-center transition hover:scale-110">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {interactions[currentPoster._id]?.comments?.length || 0}
              </span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => handleSharePosterClick(currentPoster._id, currentPoster.poster_title)}
              className="flex flex-col items-center gap-0.5 transition cursor-pointer"
              title="Share"
            >
              <div className="p-1 flex items-center justify-center transition hover:scale-110">
                <Share2 className="w-6 h-6 text-white" />
              </div>
            </button>

            {/* Download Button */}
            <button
              onClick={() => handleDownloadPoster(currentPoster)}
              className="flex flex-col items-center gap-0.5 transition cursor-pointer"
              title="Download Poster"
            >
              <div className="p-1 flex items-center justify-center transition hover:scale-110">
                <Download className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-lg">
                Save
              </span>
            </button>

            {/* Buy Button — only if poster has UPI and price */}
            {currentPoster.upiId && currentPoster.product_price && currentPoster.product_price > 0 && (
              <button
                onClick={() => {
                  const upi = encodeURIComponent(currentPoster.upiId!);
                  const amount = currentPoster.product_price!.toFixed(2);
                  const name = encodeURIComponent(currentPoster.companyName || 'Merchant');
                  const note = encodeURIComponent(currentPoster.product_name || currentPoster.poster_title || 'Purchase');
                  window.location.href = `upi://pay?pa=${upi}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;
                }}
                className="flex flex-col items-center gap-0.5 transition"
              >
                <div className="p-1 flex items-center justify-center transition hover:scale-110">
                  <ShoppingCart className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-[10px] font-bold text-green-400 drop-shadow-lg">
                  Buy
                </span>
              </button>
            )}

            {/* WhatsApp Chat Button */}
            {currentPoster.companyPhone && (
              <button
                onClick={() => {
                  const phone = currentPoster.companyPhone!.replace(/[^0-9]/g, '');
                  const fullPhone = phone.startsWith('91') ? phone : `91${phone}`;
                  const productName = currentPoster.product_name || currentPoster.poster_title || '';
                  const message = encodeURIComponent(
                    `Hi, I'm interested in ${productName}${currentPoster.product_price ? ` (₹${currentPoster.product_price})` : ''}. Is it available?`
                  );
                  window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
                }}
                className="flex flex-col items-center gap-0.5 transition"
              >
                <div className="p-1 flex items-center justify-center transition hover:scale-110">
                  <Phone className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-[10px] font-bold text-green-400 drop-shadow-lg">
                  Chat
                </span>
              </button>
            )}

            {/* Divider */}
            {posters.length > 1 && (
              <div className="w-4 border-t border-white/40" />
            )}

            {/* Navigation Dots — sliding window of max 5 */}
            {(() => {
              const total = posters.length;
              if (total <= 1) return null;
              const maxDots = 5;
              const cur = currentPosterIndex;
              let start = Math.max(0, cur - Math.floor(maxDots / 2));
              let end = start + maxDots;
              if (end > total) { end = total; start = Math.max(0, end - maxDots); }
              const dots = posters.slice(start, end);
              const hasAbove = start > 0;
              const hasBelow = end < total;
              const chevronClick = (target: number, jumpTo: number) => {
                return () => {
                  const now = Date.now();
                  if (now - chevronLastTapRef.current < 400) {
                    document.querySelector(`section[data-index='${jumpTo}']`)?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    document.querySelector(`section[data-index='${target}']`)?.scrollIntoView({ behavior: 'smooth' });
                  }
                  chevronLastTapRef.current = now;
                };
              };
              return (
                <>
                  {hasAbove && (
                    <button
                      onClick={chevronClick(start - 1, 0)}
                      className="text-white/60 hover:text-white transition"
                      title="Tap: prev · Double-tap: first"
                    >
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 7L6 2L11 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                  )}
                  {dots.map((_, i) => {
                    const realIdx = start + i;
                    const isActive = cur === realIdx;
                    const dist = Math.abs(cur - realIdx);
                    const sizeClass = isActive ? 'w-2.5 h-2.5' : dist >= 2 ? 'w-1.5 h-1.5' : 'w-2 h-2';
                    return (
                      <button
                        key={realIdx}
                        onClick={() => document.querySelector(`section[data-index='${realIdx}']`)?.scrollIntoView({ behavior: 'smooth' })}
                        className={`rounded-full transition-all duration-200 ${sizeClass} ${isActive
                          ? 'bg-orange-500 shadow-md shadow-orange-500/50'
                          : 'bg-white/50 hover:bg-white/80'
                          }`}
                      />
                    );
                  })}
                  {hasBelow && (
                    <button
                      onClick={chevronClick(end, total - 1)}
                      className="text-white/60 hover:text-white transition"
                      title="Tap: next · Double-tap: last"
                    >
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        );
      })()}
    </div>
  );
}
