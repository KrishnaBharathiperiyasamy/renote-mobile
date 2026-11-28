'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Home,
  Store,
  MessageSquare,
  Heart,
  User,
  Headphones,
  LogOut,
  Sparkles,
  Search,
  SlidersHorizontal,
  MapPin,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  ArrowRight,
  Laptop,
  Shirt,
  BookOpen,
  Trophy,
  Car,
  Wrench,
  LayoutGrid,
  List,
  Clock,
  ShieldCheck,
  Zap,
  Users,
  Leaf,
  X,
  Phone,
  Share2,
  Eye,
  Star,
  Building,
  CheckCircle,
  CheckCircle2,
  Play,
  RefreshCw,
  Maximize2,
  Plus,
  Filter
} from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient, { clearApiCache } from "@utilis/apiClient";
import { API_ENDPOINTS, normalizeImageUrl } from "@constants/api";
import { useUser } from "@context/UserContext";
import { safeToastSuccess, safeToastError } from "@utilis/toastHelper";
import { isVideoUrl } from "@utilis/videoControls";
import ProfileModal from "@components/ProfileModal";
import MarketplaceFilterPanel, { MarketplaceFilters, DEFAULT_MARKETPLACE_FILTERS } from "@components/MarketplaceFilterPanel";

/* ── Brand Flame Logo ── */
function BrandFlameLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="mpFlameGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E63900" />
          <stop offset="50%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#FFA100" />
        </linearGradient>
        <linearGradient id="mpFlameInner" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#FFD54F" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C10.2 4.8 8.5 7.2 8.5 10.2C8.5 13 10.2 14.8 12 15.8C13.8 14.8 15.5 13 15.5 10.2C15.5 7.2 13.8 4.8 12 2Z"
        fill="url(#mpFlameInner)"
        opacity="0.95"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 22C16.6395 22 20.4 18.2395 20.4 13.6C20.4 8.87 16.2 5.2 12 1C7.8 5.2 3.6 8.87 3.6 13.6C3.6 18.2395 7.3605 22 12 22ZM12 18C14.43 18 16.4 16.03 16.4 13.6C16.4 10.85 14.2 8.65 12 6.45C9.8 8.65 7.6 10.85 7.6 13.6C7.6 16.03 9.57 18 12 18Z"
        fill="url(#mpFlameGrad)"
      />
    </svg>
  );
}

const gridColsClassMap: Record<3 | 4 | 5 | 6, string> = {
  3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6",
};

interface ListingItem {
  _id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  isVideo?: boolean;
  condition: string;
  location: string;
  companyAddress?: string;
  timeAgo: string;
  likesCount?: number;
  isFavorite?: boolean;
  description?: string;
  phone?: string;
  whatsapp?: string;
  companyName?: string;
  companyLogo?: string;
  viewsCount?: number;
  createdAt?: string;
}

const CATEGORIES = [
  { id: "electronics", label: "Electronics", icon: Laptop },
  { id: "fashion", label: "Fashion", icon: Shirt },
  { id: "home-living", label: "Home & Living", icon: Building },
  { id: "books", label: "Books & Education", icon: BookOpen },
  { id: "sports", label: "Sports & Hobbies", icon: Trophy },
  { id: "vehicles", label: "Vehicles", icon: Car },
  { id: "services", label: "Services", icon: Wrench },
  { id: "others", label: "Others", icon: LayoutGrid },
];

export default function MarketplaceLandingPage() {
  const router = useRouter();
  const { fullName, isLoggedIn, logout, profileImageUrl } = useUser();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [sortOption, setSortOption] = useState("Newest First");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [gridColumns, setGridColumns] = useState<3 | 4 | 5 | 6>(5);

  // Filter option and panel state
  const [filters, setFilters] = useState<MarketplaceFilters>({
    minPrice: "",
    maxPrice: "",
    category: "All",
    city: "All",
    sortOption: "Newest First",
    favoritesOnly: false,
    verifiedOnly: false,
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideToolbar = filterDropdownRef.current && filterDropdownRef.current.contains(target);
      if (!insideToolbar) {
        setShowFilterPanel(false);
      }
    };
    if (showFilterPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterPanel]);

  const hasActiveFilters = Boolean(
    filters.minPrice ||
    filters.maxPrice ||
    (filters.category && filters.category !== "All") ||
    (filters.city && filters.city !== "All") ||
    (filters.sortOption && filters.sortOption !== "Newest First") ||
    filters.favoritesOnly ||
    filters.verifiedOnly
  );

  const activeFilterCount = [
    Boolean(filters.minPrice || filters.maxPrice),
    Boolean(filters.category && filters.category !== "All"),
    Boolean(filters.city && filters.city !== "All"),
    Boolean(filters.sortOption && filters.sortOption !== "Newest First"),
    Boolean(filters.favoritesOnly),
    Boolean(filters.verifiedOnly),
  ].filter(Boolean).length;

  const handleApplyFilters = (applied: MarketplaceFilters) => {
    setFilters(applied);
    setSelectedCategory(applied.category);
    setSelectedCity(applied.city);
    setSortOption(applied.sortOption);
    setShowFilterPanel(false);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_MARKETPLACE_FILTERS);
    setSelectedCategory("All");
    setSelectedCity("All");
    setSortOption("Newest First");
    setShowFilterPanel(false);
  };
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("spa_theme") || localStorage.getItem("poster_theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  const toggleTheme = (dark: boolean) => {
    setIsDarkMode(dark);
    const themeStr = dark ? "dark" : "light";
    localStorage.setItem("spa_theme", themeStr);
    localStorage.setItem("poster_theme", themeStr);
    localStorage.setItem("theme", themeStr);
    if (typeof document !== "undefined") {
      if (dark) {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
        document.body.style.backgroundColor = "#0D0E12";
        document.body.style.color = "#E0E2EC";
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
        document.body.style.backgroundColor = "#F8F9FC";
        document.body.style.color = "#111827";
      }
      window.dispatchEvent(new Event("themechange"));
    }
  };

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

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewImage) setPreviewImage(null);
        else if (selectedItem) setSelectedItem(null);
      }
    };
    if (selectedItem || previewImage) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, previewImage]);

  const SORT_OPTIONS = ["Newest First", "Price: Low to High", "Price: High to Low", "Most Popular"];

  // User display info
  const userName = fullName || (typeof window !== "undefined" ? localStorage.getItem("firstName") : "") || "Account";
  const userInitial = userName.charAt(0).toUpperCase() || "A";

  // Fetch real items from backend DB
  const fetchMarketplaceData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.MARKETPLACE.FEED, {
        params: {
          search: searchQuery || undefined,
          city: selectedCity !== "All" ? selectedCity : undefined,
          category: selectedCategory !== "All" ? selectedCategory : undefined,
          limit: 50
        }
      });

      const rawPosters = res.data?.posters || res.data?.items || [];
      if (Array.isArray(rawPosters) && rawPosters.length > 0) {
        const validPosters = rawPosters;

        const mappedListings: ListingItem[] = validPosters.map((p: any, idx: number) => {
          const rawImg = p.product_image || (p.product_gallery_images && p.product_gallery_images[0]) || "";
          const imgUrl = rawImg ? normalizeImageUrl(rawImg) : "/placeholder.png";
          const isVid = p.isVideo || isVideoUrl(imgUrl);
          const rawTitle = p.product_name || p.poster_title || p.poster_name || "Electronic Device";
          const title = rawTitle.replace(/[\?\uFFFD\u200B-\u200D\uFEFF]/g, "").trim() || "Electronic Device";
          const t = title.toLowerCase();

          // Subcategory allocation
          let subcat = p.marketplaceSubcategory || "";
          if (!subcat || subcat === "All") {
            if (t.includes("mini") || t.includes("prodesk") || t.includes("elitedesk") || t.includes("tiny pc") || t.includes("workstation") || t.includes("desktop")) {
              subcat = "COMPUTERS & WORKSTATIONS";
            } else if (t.includes("latitude") || t.includes("thinkpad") || t.includes("elitebook") || t.includes("macbook") || t.includes("laptop") || t.includes("notebook")) {
              subcat = "LAPTOPS & COMPUTERS";
            } else if (t.includes("iphone") || t.includes("galaxy") || t.includes("pixel") || t.includes("phone") || t.includes("mobile")) {
              subcat = "SMARTPHONES & MOBILES";
            } else if (t.includes("headphone") || t.includes("audio") || t.includes("earbuds") || t.includes("speaker")) {
              subcat = "AUDIO & HEADPHONES";
            } else if (t.includes("camera") || t.includes("dslr") || t.includes("lens")) {
              subcat = "CAMERAS & OPTICS";
            } else if (p.marketplaceCategory) {
              subcat = p.marketplaceCategory.toUpperCase();
            } else {
              subcat = "LAPTOPS & COMPUTERS";
            }
          } else {
            subcat = subcat.toUpperCase();
          }

          // Price allocation
          let price = Number(p.marketplacePrice ?? p.product_price ?? 0);
          if (!price || price <= 0) {
            if (t.includes("macbook pro m3") || t.includes("m3 chip")) price = 125000;
            else if (t.includes("macbook")) price = 59000;
            else if (t.includes("think workstation") || t.includes("workstation")) price = 68000;
            else if (t.includes("elitemini") || t.includes("800 g9")) price = 82000;
            else if (t.includes("dell precision") || t.includes("precision")) price = 45000;
            else if (t.includes("latitude 5430")) price = 40000;
            else if (t.includes("elitebook 840") || t.includes("elitebook")) price = 32000;
            else if (t.includes("prodesk 400") || t.includes("prodesk")) price = 30000;
            else if (t.includes("t480s") || t.includes("latitude 7300")) price = 26000;
            else if (t.includes("tiny pc") || t.includes("thinkpad")) price = 22000;
            else if (t.includes("elitedesk") || t.includes("t470")) price = 18000;
            else if (t.includes("e7470")) price = 16000;
            else price = 35000;
          }

          const timeString = p.createdAt
            ? `${Math.max(1, Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60)))} hours ago`
            : `${idx + 1} hours ago`;

          return {
            _id: p._id || `db-${idx}`,
            title,
            category: subcat,
            price,
            image: imgUrl,
            isVideo: isVid,
            condition: idx % 2 === 0 ? "Used - Good" : "Used - Excellent",
            location: (p.marketplaceCity || p.company_id?.city || "RS PURAM").toUpperCase(),
            companyAddress: p.company_id?.address || "",
            timeAgo: timeString,
            likesCount: p.likesCount || 0,
            description: p.product_description || "",
            phone: p.contactPhone || p.company_id?.phone || "9092024444",
            whatsapp: p.whatsappNumber || p.contactPhone || "",
            companyName: p.company_id?.name || "KrishTech Computers",
            companyLogo: p.company_id?.logo ? normalizeImageUrl(p.company_id.logo) : "/uploads/companies/default-company/logo-1779622107439-878996187.webp",
            viewsCount: p.viewsCount || 12,
            createdAt: p.createdAt,
          };
        });

        setListings(mappedListings);
      } else {
        setListings([]);
      }
    } catch (err) {
      console.error("Error fetching real marketplace feed:", err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCity, selectedCategory]);

  useEffect(() => {
    fetchMarketplaceData();
  }, [fetchMarketplaceData]);

  useEffect(() => {
    const handleMarketplaceUpdated = () => {
      clearApiCache();
      fetchMarketplaceData();
    };
    window.addEventListener("marketplace-updated", handleMarketplaceUpdated);
    window.addEventListener("poster-link-updated", handleMarketplaceUpdated);
    return () => {
      window.removeEventListener("marketplace-updated", handleMarketplaceUpdated);
      window.removeEventListener("poster-link-updated", handleMarketplaceUpdated);
    };
  }, [fetchMarketplaceData]);

  // Filtered and sorted listings based on user selection
  const filteredAndSortedListings = useMemo(() => {
    // Strictly remove every layout which costs 0 rupees
    let result = listings.filter(item => item.price > 0);

    // Filter by saved items
    if (activeTab === "saved" || filters.favoritesOnly) {
      result = result.filter(item => favorites[item._id] || item.isFavorite);
    }

    // Filter by verified only
    if (filters.verifiedOnly) {
      result = result.filter(item => Boolean(item.companyName || item.companyLogo));
    }

    // Filter by price range
    if (filters.minPrice) {
      const minP = Number(filters.minPrice);
      if (!isNaN(minP)) {
        result = result.filter(item => item.price >= minP);
      }
    }
    if (filters.maxPrice) {
      const maxP = Number(filters.maxPrice);
      if (!isNaN(maxP)) {
        result = result.filter(item => item.price <= maxP);
      }
    }

    // Filter by location / city
    const activeCity = filters.city !== "All" ? filters.city : selectedCity;
    if (activeCity && activeCity !== "All") {
      const c = activeCity.toLowerCase().trim();
      result = result.filter(item => {
        const loc = item.location.toLowerCase();
        const addr = (item.companyAddress || "").toLowerCase();
        if (loc.includes(c) || addr.includes(c)) return true;
        if (c.includes("coimbatore") && (loc.includes("rs puram") || loc.includes("r s puram") || addr.includes("rs puram") || addr.includes("coimbatore"))) return true;
        if ((c.includes("rs puram") || c.includes("r s puram")) && (loc.includes("coimbatore") || addr.includes("coimbatore") || loc.includes("rs puram"))) return true;
        if ((c.includes("bangalore") || c.includes("bengaluru")) && (loc.includes("bangalore") || loc.includes("bengaluru") || addr.includes("bangalore") || addr.includes("bengaluru"))) return true;
        return false;
      });
    }

    // Filter by category
    const activeCategory = filters.category !== "All" ? filters.category : selectedCategory;
    if (activeCategory !== "All") {
      const sel = activeCategory.toLowerCase();
      result = result.filter(item => {
        const cat = item.category.toLowerCase();
        if (cat === sel) return true;
        if (sel.includes("electronic") && (
          cat.includes("laptop") || cat.includes("computer") || cat.includes("workstation") ||
          cat.includes("mobile") || cat.includes("phone") || cat.includes("audio") || cat.includes("camera") || cat.includes("tech")
        )) return true;
        if (sel.includes("vehicle") && (cat.includes("car") || cat.includes("bike") || cat.includes("vehicle"))) return true;
        if (sel.includes("home") && (cat.includes("furniture") || cat.includes("living") || cat.includes("appliance") || cat.includes("building"))) return true;
        return cat.includes(sel) || sel.includes(cat);
      });
    }

    // Sort
    const activeSort = filters.sortOption || sortOption;
    if (activeSort === "Newest First") {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (activeSort === "Price: Low to High") {
      result.sort((a, b) => a.price - b.price);
    } else if (activeSort === "Price: High to Low") {
      result.sort((a, b) => b.price - a.price);
    } else if (activeSort === "Most Popular") {
      result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }

    return result;
  }, [listings, activeTab, selectedCategory, sortOption, favorites, filters, selectedCity]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      safeToastError("Please log in to save items to favorites");
      const current = typeof window !== "undefined" ? window.location.pathname : "/";
      router.push(`/pages/login?redirect=${encodeURIComponent(current)}`);
      return;
    }
    setFavorites(prev => {
      const next = { ...prev, [id]: !prev[id] };
      safeToastSuccess(next[id] ? "Saved to favorites!" : "Removed from favorites");
      return next;
    });
  };

  const handleLogout = () => {
    logout();
  };

  const handleCreatePosterClick = () => {
    if (!isLoggedIn) {
      safeToastError("Please log in to create listings and posters");
      router.push(`/pages/login?redirect=${encodeURIComponent("/pages/createPoster")}`);
      return;
    }
    router.push("/pages/createPoster");
  };

  const themeBg = isDarkMode ? "bg-[#0A0B10] text-[#E0E2EC]" : "bg-[#F8F9FC] text-[#111827]";
  const themeHeader = isDarkMode ? "bg-[#0E1017] border-[#1C1F2B]" : "bg-[#FFFFFF] border-[#E5E7EB] shadow-sm";
  const themeInput = isDarkMode ? "bg-[#141620] border-[#232736] text-white" : "bg-[#F3F4F6] border-[#E5E7EB] text-gray-900";

  return (
    <div className={`min-h-screen ${themeBg} flex flex-col overflow-x-hidden font-sans selection:bg-[#FF6B00] selection:text-white`}>

      {/* ════════════════ MAIN CONTENT AREA ════════════════ */}
      <main className={`flex-1 flex flex-col min-w-0 ${themeBg}`}>

        {/* ── Top Header ── */}
        <header className={`h-16 px-4 sm:px-6 ${themeHeader} border-b flex items-center justify-between gap-3 sm:gap-4 sticky top-0 z-20`}>

          {/* Left: Page Title & Mobile/Public Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
            {/* Mobile / Unauthenticated Brand Flame Logo */}
            <div
              onClick={() => router.push("/")}
              className={`items-center gap-2 shrink-0 cursor-pointer select-none group ${isLoggedIn ? "lg:hidden flex" : "flex"}`}
              title="ReNote Home"
            >
              <BrandFlameLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            </div>

            {/* Clear "Marketplace" Heading — matching other page titles */}
            <h1
              className={`font-['Manrope',sans-serif] font-[600] text-[18px] sm:text-[20px] tracking-[-0.3px] leading-tight ${
                isDarkMode ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" : "text-[#0F172A]"
              } truncate select-none transition-colors duration-200`}
            >
              Marketplace
            </h1>
          </div>

          {/* Header Search Input */}
          <div className="relative flex-1 max-w-xl flex items-center gap-2">
            <div className={`h-10 flex-1 ${isDarkMode ? "bg-[#141620] border-[#232736]" : "bg-gray-50 border-gray-200"} border focus-within:border-[#FF7A00] rounded-xl flex items-center px-3.5 gap-2.5 transition-all`}>
              <Search
                onClick={fetchMarketplaceData}
                className={`w-[18px] h-[18px] stroke-[2] ${isDarkMode ? "text-[#606778]" : "text-gray-400"} shrink-0 hover:text-[#FF7A00] cursor-pointer transition-colors`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchMarketplaceData();
                }}
                placeholder="Search for products, electronics, furniture..."
                className={`w-full bg-transparent ${isDarkMode ? "text-white placeholder-[#555C6E]" : "text-gray-900 placeholder-gray-400"} text-xs sm:text-sm outline-none`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`${isDarkMode ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-700"} p-0.5 transition-colors cursor-pointer`}
                >
                  <X className="w-[18px] h-[18px] stroke-[2]" />
                </button>
              )}
              <button
                type="button"
                onClick={fetchMarketplaceData}
                className="h-7 px-3 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FF4500] hover:from-[#FF881A] hover:to-[#FF5500] text-white text-xs font-bold cursor-pointer transition-all shadow-sm hidden sm:inline-flex items-center gap-1 shrink-0"
              >
                Search
              </button>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Dark / Light Toggle */}
            {/* Theme Toggle Button (Light/Dark) */}
            <div className={`flex items-center ${themeInput} rounded-xl p-1 gap-1`}>
              <button
                type="button"
                onClick={() => toggleTheme(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${!isDarkMode ? "bg-[#FF6B00] text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                title="Switch to Light Theme"
              >
                <Sun className="w-[18px] h-[18px] stroke-[2]" />
              </button>
              <button
                type="button"
                onClick={() => toggleTheme(true)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${isDarkMode ? "bg-[#FF6B00] text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                title="Switch to Dark Theme"
              >
                <Moon className="w-[18px] h-[18px] stroke-[2]" />
              </button>
            </div>

            {/* Wishlist Heart */}
            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  safeToastError("Please log in to view your saved items");
                  const current = typeof window !== "undefined" ? window.location.pathname : "/";
                  router.push(`/pages/login?redirect=${encodeURIComponent(current)}`);
                  return;
                }
                setActiveTab(activeTab === "saved" ? "home" : "saved");
              }}
              title="Saved items"
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${activeTab === "saved"
                ? "bg-[#FF6B00] border-[#FF6B00] text-white shadow-[0_2px_10px_rgba(255,107,0,0.3)]"
                : isDarkMode
                  ? "bg-[#141620] border-[#232736] hover:border-[#383E54] text-gray-300 hover:text-white"
                  : "bg-white border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 shadow-sm"
                }`}
            >
              <Heart className={`w-[18px] h-[18px] stroke-[2] ${activeTab === "saved" ? "fill-white" : ""}`} />
            </button>

            {/* User Profile Pill / Auth Actions */}
            {!isLoggedIn ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push("/pages/login")}
                  className={`h-9 px-3.5 sm:px-4 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                    isDarkMode
                      ? "border-[#2A2E3D] bg-[#141620] text-gray-200 hover:text-white hover:border-[#FF6B00]/60 hover:bg-[#1A1D2A]"
                      : "border-gray-200 bg-white text-gray-700 hover:text-gray-900 hover:border-[#FF6B00]/60 hover:bg-gray-50 shadow-xs"
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Log In</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/pages/register")}
                  className="h-9 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E63900] hover:from-[#FF7A1A] hover:to-[#F44336] text-white text-xs font-bold cursor-pointer transition-all shadow-sm hover:shadow-[0_2px_12px_rgba(255,107,0,0.35)] flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <div
                  onClick={() => setShowProfileModal(!showProfileModal)}
                  className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl ${isDarkMode
                    ? "bg-[#141620] border-[#232736] hover:border-[#383E54]"
                    : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                    } border cursor-pointer transition-colors`}
                  title={`Profile: ${userName}`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#FFA040] text-white text-xs font-bold flex items-center justify-center shadow-sm overflow-hidden">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={userName}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                      />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{userName}</span>
                  <ChevronDown className="w-[18px] h-[18px] text-gray-500 stroke-[2]" />
                </div>

                {showProfileModal && (
                  <ProfileModal
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    onLogout={logout}
                    isDarkMode={isDarkMode}
                  />
                )}
              </div>
            )}
          </div>
        </header>

        {/* ── Scrollable Body Content ── */}
        <div className="px-6 pt-5 pb-8 md:px-8 md:pt-6 md:pb-10 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">


          {/* ════════════════ 1. BROWSE BY CATEGORY ════════════════ */}
          <div className="flex flex-col gap-3.5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-5 bg-[#FF6B00] rounded-full" />
                <h2 className={`text-base sm:text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"} tracking-tight`}>
                  Browse by Category
                </h2>
              </div>
              {selectedCategory !== "All" ? (
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="text-[#FF7A00] hover:text-[#FFA040] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Show All Categories</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"} font-medium hidden sm:inline`}>
                  Click a category to filter listings
                </span>
              )}
            </div>

            {/* Category Cards Grid (8 items in 1 row on desktop) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 bg-transparent">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory.toLowerCase() === cat.label.toLowerCase();
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? "All" : cat.label)}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between cursor-pointer group ${isSelected
                      ? isDarkMode
                        ? "bg-[#251711] border-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.2)]"
                        : "bg-orange-50 border-[#FF6B00] shadow-sm"
                      : isDarkMode
                        ? "bg-[#12141D] border-[#222636] hover:border-[#FF6B00]/40 hover:bg-[#161824]"
                        : "bg-white border-gray-200 hover:border-[#FF6B00]/60 hover:bg-orange-50/20 shadow-sm"
                      }`}
                  >
                    <div className="flex flex-col gap-1.5">
                      <IconComponent className="w-5 h-5 text-[#FF7A00] group-hover:scale-110 transition-transform" />
                      <span className={`text-xs font-semibold ${isDarkMode ? "text-white" : "text-gray-800"} tracking-tight`}>
                        {cat.label}
                      </span>
                    </div>
                    <span className={`${isDarkMode ? "text-gray-600" : "text-gray-400"} group-hover:text-[#FF7A00] text-xs transition-colors`}>
                      ›
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ════════════════ 2. FEATURED LISTINGS ════════════════ */}
          <div className="flex flex-col gap-4">

            {/* ── Section Title & Count ── */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-5 bg-[#FF6B00] rounded-full" />
                <h2 className={`text-base sm:text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"} tracking-tight`}>
                  {activeTab === "saved"
                    ? "Saved Listings"
                    : selectedCategory !== "All"
                      ? `${selectedCategory} Listings`
                      : "Featured Listings"}
                </h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full ${isDarkMode
                  ? "bg-[#141620] text-gray-400 border-[#232736]"
                  : "bg-gray-100 text-gray-600 border-gray-200"
                  } font-semibold border`}>
                  {filteredAndSortedListings.length} {filteredAndSortedListings.length === 1 ? "item" : "items"}
                </span>
              </div>
            </div>

            {/* ── Redesigned Marketplace Toolbar ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Left: Filter & Sort */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* ── Filter Option Button & Popover Panel ── */}
                <div className="relative" ref={filterDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowFilterPanel((prev) => !prev)}
                    className={`h-9 px-3 sm:px-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-xs relative ${
                      showFilterPanel || hasActiveFilters
                        ? "border-[#FF5722] text-[#FF5722] bg-[#FF5722]/10 shadow-[0_0_12px_rgba(255,87,34,0.25)]"
                        : isDarkMode
                          ? "bg-[#12141D] border-[#222636] text-gray-300 hover:border-[#FF5722] hover:text-[#FF5722]"
                          : "bg-white border-gray-200 text-gray-700 hover:border-[#FF5722] hover:text-[#FF5722] shadow-sm"
                    }`}
                    title="Filter marketplace listings"
                  >
                    <Filter className="w-4 h-4 stroke-[2]" />
                    <span>Filter</span>
                    {hasActiveFilters && (
                      <span className="flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-black rounded-full bg-[#FF5722] text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown panel directly below Filter button, left-aligned */}
                  {showFilterPanel && (
                    <div className="absolute top-full left-0 mt-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <MarketplaceFilterPanel
                        filters={filters}
                        isDarkMode={isDarkMode}
                        onApply={handleApplyFilters}
                        onReset={handleResetFilters}
                        onClose={() => setShowFilterPanel(false)}
                      />
                    </div>
                  )}
                </div>

                {/* ── Sorting Filter Dropdown ── */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSortDropdownOpen(prev => !prev);
                    }}
                    className={`h-9 flex items-center gap-2 px-3 rounded-xl ${isDarkMode
                      ? "bg-[#12141D] border-[#222636] text-white hover:border-[#FF5722]"
                      : "bg-white border-gray-200 text-gray-800 hover:border-[#FF5722] shadow-sm"
                      } border text-xs font-bold cursor-pointer transition-colors`}
                    title="Sort listings"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-[#FF7A00] stroke-[2]" />
                    <span>{sortOption}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 stroke-[2] transition-transform ${isSortDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isSortDropdownOpen && (
                    <div className={`absolute top-full mt-1.5 left-0 w-44 ${isDarkMode ? "bg-[#141620] border-[#232736]" : "bg-white border-gray-200 shadow-xl"
                      } border rounded-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100`}>
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setSortOption(opt);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between ${isDarkMode ? "hover:bg-[#1C202E]" : "hover:bg-gray-100"
                            } transition-colors cursor-pointer ${sortOption === opt
                              ? isDarkMode
                                ? "text-[#FF7A00] font-bold bg-[#1C202E]/60"
                                : "text-[#FF7A00] font-bold bg-orange-50"
                              : isDarkMode
                                ? "text-gray-300"
                                : "text-gray-700"
                            }`}
                        >
                          <span>{opt}</span>
                          {sortOption === opt && <CheckCircle className="w-4 h-4 text-[#FF7A00] stroke-[2]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Columns & View Mode (Unified Segmented Control) */}
              <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                {/* ── Unified Segmented Control: Columns (3, 4, 5, 6) & View Mode (Grid/List) ── */}
                <div 
                  className={`flex items-center h-9 p-0.5 rounded-xl border ${
                    isDarkMode ? "bg-[#12141D] border-[#222636]" : "bg-white border-gray-200 shadow-sm"
                  }`}
                >
                  {/* Column Selection Segment (active when in grid mode on sm+ screens) */}
                  {viewMode === "grid" && (
                    <div className="hidden sm:flex items-center">
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 px-2 select-none uppercase tracking-wider hidden md:inline">
                        COLUMNS
                      </span>
                      {([3, 4, 5, 6] as const).map((cols) => (
                        <button
                          key={cols}
                          type="button"
                          onClick={() => setGridColumns(cols)}
                          className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            gridColumns === cols
                              ? "bg-[#FF5722] text-white shadow-xs"
                              : isDarkMode
                                ? "text-gray-400 hover:text-white hover:bg-white/5"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                          title={`${cols} columns per row`}
                        >
                          {cols}
                        </button>
                      ))}
                      <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />
                    </div>
                  )}

                  {/* View Mode Toggle Segment */}
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`h-7 px-2.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-[#FF5722] text-white shadow-xs"
                        : isDarkMode
                          ? "text-gray-400 hover:text-white hover:bg-white/5"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    title="Grid View"
                    aria-label="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`h-7 px-2.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      viewMode === "list"
                        ? "bg-[#FF5722] text-white shadow-xs"
                        : isDarkMode
                          ? "text-gray-400 hover:text-white hover:bg-white/5"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    title="List View"
                    aria-label="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filter Chips Bar */}
            {hasActiveFilters && (
              <div className="flex items-center flex-wrap gap-1.5 px-1 py-1">
                <span className="text-[11px] text-gray-400 font-semibold mr-1">Active Filters:</span>
                {filters.category !== "All" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF5722]/15 border border-[#FF5722]/40 text-[#FF5722] text-[11px] font-bold">
                    Category: {filters.category}
                    <button
                      type="button"
                      onClick={() => {
                        setFilters((prev: MarketplaceFilters) => ({ ...prev, category: "All" }));
                        setSelectedCategory("All");
                      }}
                      className="hover:text-white cursor-pointer ml-0.5 p-0.5"
                      title="Remove category filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF5722]/15 border border-[#FF5722]/40 text-[#FF5722] text-[11px] font-bold">
                    ₹{filters.minPrice ? Number(filters.minPrice).toLocaleString("en-IN") : "0"} - {filters.maxPrice ? `₹${Number(filters.maxPrice).toLocaleString("en-IN")}` : "Any"}
                    <button
                      type="button"
                      onClick={() => setFilters((prev: MarketplaceFilters) => ({ ...prev, minPrice: "", maxPrice: "" }))}
                      className="hover:text-white cursor-pointer ml-0.5 p-0.5"
                      title="Remove price filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.city !== "All" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF5722]/15 border border-[#FF5722]/40 text-[#FF5722] text-[11px] font-bold">
                    City: {filters.city}
                    <button
                      type="button"
                      onClick={() => {
                        setFilters((prev: MarketplaceFilters) => ({ ...prev, city: "All" }));
                        setSelectedCity("All");
                      }}
                      className="hover:text-white cursor-pointer ml-0.5 p-0.5"
                      title="Remove city filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.favoritesOnly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF5722]/15 border border-[#FF5722]/40 text-[#FF5722] text-[11px] font-bold">
                    Favorites Only
                    <button
                      type="button"
                      onClick={() => setFilters((prev: MarketplaceFilters) => ({ ...prev, favoritesOnly: false }))}
                      className="hover:text-white cursor-pointer ml-0.5 p-0.5"
                      title="Remove favorites filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.verifiedOnly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold">
                    Verified Sellers Only
                    <button
                      type="button"
                      onClick={() => setFilters((prev: MarketplaceFilters) => ({ ...prev, verifiedOnly: false }))}
                      className="hover:text-white cursor-pointer ml-0.5 p-0.5"
                      title="Remove verified filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] text-[#FF5722] hover:text-[#FFA040] font-bold underline cursor-pointer ml-1.5"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Listings Content (Grid or List View) */}
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin text-[#FF6B00]" />
                <span className="text-sm font-semibold">Loading marketplace listings...</span>
              </div>
            ) : filteredAndSortedListings.length === 0 ? (
              <div className={`py-16 flex flex-col items-center justify-center gap-3 text-gray-400 ${isDarkMode ? "bg-[#12141D]/50 border-[#222636]" : "bg-white border-gray-200 shadow-sm"
                } border border-dashed rounded-2xl`}>
                <Store className="w-10 h-10 text-gray-600" />
                <span className={`text-base font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {activeTab === "saved" ? "No saved listings yet" : "No marketplace listings found"}
                </span>
                <p className="text-xs text-gray-500">
                  {activeTab === "saved"
                    ? "Click the heart icon on any listing to save it here."
                    : "Try changing your search keywords, location or category filter."}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      handleResetFilters();
                      setActiveTab("home");
                    }}
                    className={`px-4 py-2 rounded-xl ${isDarkMode
                      ? "bg-[#1B1E26] hover:bg-[#252A36] text-white border-white/10"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200"
                      } text-xs font-bold border cursor-pointer transition-colors`}
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={handleCreatePosterClick}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#E63900] hover:from-[#FF7043] hover:to-[#FF5722] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Publish Poster</span>
                  </button>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              <div className={`grid ${gridColsClassMap[gridColumns]} gap-3 bg-transparent`}>
                {filteredAndSortedListings.map((item) => {
                  const isFav = favorites[item._id] || item.isFavorite;
                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedItem(item)}
                      className={`${isDarkMode
                        ? "bg-[#12141D] border-[#222636] hover:border-[#FF6B00]/50"
                        : "bg-white border-gray-200 hover:border-[#FF6B00]/60 shadow-sm hover:shadow-md"
                        } border rounded-xl overflow-hidden group transition-all duration-300 hover:-translate-y-1 flex flex-col cursor-pointer`}
                    >

                      {/* Media Thumbnail */}
                      <div className={`relative w-full aspect-[4/3] ${isDarkMode ? "bg-[#161822]" : "bg-gray-100"} overflow-hidden`}>
                        {item.isVideo ? (
                          <div className="w-full h-full relative">
                            <video
                              src={item.image}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              muted
                              playsInline
                              loop
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Play className="w-7 h-7 text-white fill-white/80 drop-shadow" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/sample.png";
                            }}
                          />
                        )}

                        {/* Condition Badge */}
                        <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-md text-white text-[9px] font-semibold px-1.5 py-0.5 rounded border border-white/10 shadow-sm">
                          {item.condition}
                        </span>

                        {/* Wishlist Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(item._id, e)}
                          className={`absolute top-2 right-2 w-6 h-6 rounded-full backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer z-10 ${isFav
                            ? "bg-[#FF6B00] text-white"
                            : "bg-black/60 text-white hover:bg-black/90"
                            }`}
                          title={isFav ? "Saved to wishlist" : "Add to wishlist"}
                        >
                          <Heart className={`w-3 h-3 ${isFav ? "fill-white" : ""}`} />
                        </button>
                      </div>

                      {/* Content Details */}
                      <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 flex flex-col flex-1 justify-between gap-1">
                        <div>
                          {/* Title & City Location Row */}
                          <div className="flex items-start justify-between gap-1.5">
                            <h3 className={`text-xs sm:text-[13px] font-black ${isDarkMode ? "text-[#F97316]" : "text-gray-900 group-hover:text-[#FF7A00]"
                              } tracking-tight line-clamp-1 transition-colors leading-tight`}>
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-0.5 text-[#F97316] text-[10px] font-bold tracking-wider shrink-0 uppercase">
                              <MapPin className="w-3 h-3 text-[#F97316]" />
                              <span>{item.location}</span>
                            </div>
                          </div>

                          {/* Subcategory Outlined Badge (Minimized) */}
                          <div className="mt-0.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded border ${isDarkMode
                              ? "border-[#F97316]/40 bg-[#F97316]/10 text-[#F97316]"
                              : "border-orange-200 bg-orange-50 text-orange-700"
                              } text-[9px] font-bold tracking-wide uppercase leading-normal`}>
                              {item.category}
                            </span>
                          </div>

                          {/* Company Line with Verified Badge (Fully Visible) */}
                          <div className={`flex items-center flex-wrap gap-1.5 text-xs ${isDarkMode ? "text-[#94A3B8]" : "text-gray-600"
                            } tracking-tight mt-0.5 sm:mt-1 min-w-0`}>
                            <span className={`${isDarkMode ? "text-[#64748B]" : "text-gray-500"} font-medium text-[11px] shrink-0`}>Company:</span>
                            <img
                              src={item.companyLogo || "/uploads/companies/default-company/logo-1779622107439-878996187.webp"}
                              alt={item.companyName || "KrishTech Computers"}
                              className={`w-3.5 h-3.5 rounded object-contain ${isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"
                                } border shrink-0`}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.src.includes("logo-1779622107439-878996187.webp")) {
                                  target.src = "/uploads/companies/default-company/logo-1779622107439-878996187.webp";
                                }
                              }}
                            />
                            <span className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"} text-[11px] whitespace-normal break-words leading-tight`}>{item.companyName || "KrishTech Computers"}</span>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          </div>
                        </div>

                        {/* Price & Views Row */}
                        <div className={`flex items-center justify-between mt-1 pt-1 border-t ${isDarkMode ? "border-white/[0.08]" : "border-gray-100"
                          }`}>
                          <span className="text-sm sm:text-base font-black text-[#FF7A00] tracking-tight leading-tight">
                            ₹{item.price.toLocaleString("en-IN")}
                          </span>

                          <div className={`flex items-center gap-1 text-[10px] ${isDarkMode ? "text-[#94A3B8]" : "text-gray-500"
                            } font-semibold tracking-wider`}>
                            <Eye className={`w-3 h-3 ${isDarkMode ? "text-[#64748B]" : "text-gray-400"}`} />
                            <span>{item.viewsCount || 12}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 bg-transparent">
                {filteredAndSortedListings.map((item) => {
                  const isFav = favorites[item._id] || item.isFavorite;
                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedItem(item)}
                      className={`${isDarkMode
                        ? "bg-[#12141D] border-[#222636] hover:border-[#FF6B00]/50"
                        : "bg-white border-gray-200 hover:border-[#FF6B00]/60 shadow-sm hover:shadow-md"
                        } border rounded-xl overflow-hidden group transition-all duration-300 hover:shadow-lg flex flex-col sm:flex-row sm:h-40 sm:max-h-40 min-h-0 items-stretch cursor-pointer`}
                    >
                      {/* Left Media Area */}
                      <div className={`relative w-full sm:w-48 md:w-52 h-44 sm:h-full shrink-0 overflow-hidden ${isDarkMode ? "bg-[#161822]" : "bg-gray-100"}`}>
                        {item.isVideo ? (
                          <div className="w-full h-full relative overflow-hidden">
                            <video
                              src={item.image}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              muted
                              playsInline
                              loop
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Play className="w-7 h-7 text-white fill-white/80 drop-shadow" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/sample.png";
                            }}
                          />
                        )}

                        {/* Condition Badge */}
                        <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-md text-white text-[9px] font-semibold px-1.5 py-0.5 rounded border border-white/10 shadow-sm">
                          {item.condition}
                        </span>

                        {/* Wishlist Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(item._id, e)}
                          className={`absolute top-2 right-2 w-6 h-6 rounded-full backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer z-10 ${isFav
                            ? "bg-[#FF6B00] text-white"
                            : "bg-black/60 text-white hover:bg-black/90"
                            }`}
                          title={isFav ? "Saved to wishlist" : "Add to wishlist"}
                        >
                          <Heart className={`w-3 h-3 ${isFav ? "fill-white" : ""}`} />
                        </button>
                      </div>

                      {/* Right Content Area */}
                      <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 flex flex-col flex-1 justify-between gap-1.5 min-w-0 sm:h-full min-h-0 overflow-hidden">
                        <div className="min-h-0">
                          {/* Header row: Title, Location, and Price */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className={`text-sm sm:text-base font-black ${
                                isDarkMode ? "text-[#F97316]" : "text-gray-900 group-hover:text-[#FF7A00]"
                              } tracking-tight transition-colors line-clamp-1`}>
                                {item.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5 sm:mt-1 min-w-0">
                                <span className={`inline-block px-1.5 py-0.5 rounded border ${
                                  isDarkMode
                                    ? "border-[#F97316]/40 bg-[#F97316]/10 text-[#F97316]"
                                    : "border-orange-200 bg-orange-50 text-orange-700"
                                } text-[9px] font-bold tracking-wide uppercase shrink-0`}>
                                  {item.category}
                                </span>
                                <div className="flex items-center gap-0.5 text-[#F97316] text-[10px] font-bold tracking-wider uppercase min-w-0 truncate">
                                  <MapPin className="w-3 h-3 text-[#F97316] shrink-0" />
                                  <span className="truncate">{item.location}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-left sm:text-right shrink-0">
                              <span className="text-base sm:text-lg font-black text-[#FF7A00] tracking-tight block leading-tight">
                                ₹{item.price.toLocaleString("en-IN")}
                              </span>
                              <div className={`flex items-center sm:justify-end gap-1 text-[10px] ${
                                isDarkMode ? "text-[#94A3B8]" : "text-gray-500"
                              } font-semibold tracking-wider mt-0.5`}>
                                <Eye className={`w-3 h-3 ${isDarkMode ? "text-[#64748B]" : "text-gray-400"} shrink-0`} />
                                <span>{item.viewsCount || 12} views</span>
                              </div>
                            </div>
                          </div>

                          {/* Company Line with Verified Badge */}
                          <div className={`flex items-center flex-nowrap gap-1.5 text-xs ${
                            isDarkMode ? "text-[#94A3B8]" : "text-gray-600"
                          } tracking-tight mt-1 sm:mt-1.5 min-w-0`}>
                            <span className={`${isDarkMode ? "text-[#64748B]" : "text-gray-500"} font-medium text-[11px] shrink-0`}>Company:</span>
                            <img
                              src={item.companyLogo || "/uploads/companies/default-company/logo-1779622107439-878996187.webp"}
                              alt={item.companyName || "KrishTech Computers"}
                              className={`w-4 h-4 rounded object-contain ${
                                isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"
                              } border shrink-0`}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.src.includes("logo-1779622107439-878996187.webp")) {
                                  target.src = "/uploads/companies/default-company/logo-1779622107439-878996187.webp";
                                }
                              }}
                            />
                            <span className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"} text-xs truncate min-w-0 leading-tight`}>
                              {item.companyName || "KrishTech Computers"}
                            </span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          </div>
                        </div>

                        {/* Bottom Action Footer Bar */}
                        <div className={`flex items-center justify-between pt-1 sm:pt-1.5 border-t ${
                          isDarkMode ? "border-white/[0.08]" : "border-gray-100"
                        } shrink-0 gap-1.5 sm:gap-2`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                            className="text-xs font-bold text-[#FF5722] hover:text-[#FF7A00] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          >
                            <span>View Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <div
                            className={`flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-lg ${
                              isDarkMode ? "bg-[#161822] border border-white/5" : "bg-gray-50 border border-gray-200"
                            } text-[11px] shrink-0`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* WhatsApp */}
                            <button
                              type="button"
                              onClick={() => {
                                const rawWa = (item.whatsapp || item.phone || "9092024444").replace(/\D/g, "");
                                const fullWa = rawWa.length === 10 ? `91${rawWa}` : rawWa;
                                const url = `https://wa.me/${fullWa}?text=Hi,%20I%20am%20interested%20in%20your%20listing:%20${encodeURIComponent(item.title)}`;
                                window.open(url, "_blank");
                              }}
                              className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-md text-[#94A3B8] hover:text-[#25D366] hover:bg-[#25D366]/10 transition-colors flex items-center gap-1 font-semibold text-xs cursor-pointer"
                              title="WhatsApp Chat"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>

                            {/* Phone Call */}
                            <button
                              type="button"
                              onClick={() => {
                                window.location.href = `tel:${item.phone || "9092024444"}`;
                              }}
                              className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-md text-[#94A3B8] hover:text-[#F97316] hover:bg-[#F97316]/10 transition-colors flex items-center gap-1 font-semibold text-xs cursor-pointer"
                              title="Call Seller"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Call</span>
                            </button>

                            {/* Share */}
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                safeToastSuccess("Listing link copied to clipboard! 📋");
                              }}
                              className="p-1 sm:p-1.5 rounded-md text-[#94A3B8] hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                              title="Share Listing"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </main>

      {/* ════════════════ ITEM DETAIL MODAL ════════════════ */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItem(null);
          }}
        >
          <div
            className={`${isDarkMode ? "bg-[#12141D] border-[#262B3A] text-white" : "bg-white border-gray-200 text-gray-900"
              } border rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative my-auto`}
          >
            {/* Accessible High-Contrast Close Button */}
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute top-3.5 right-3.5 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-all border border-white/20 shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Close modal"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Media Container with clean dark background, object-fit: contain, original aspect ratio */}
            <div className="w-full min-h-[260px] sm:min-h-[320px] max-h-[50vh] sm:max-h-[58vh] bg-[#0A0B10] dark:bg-black relative flex items-center justify-center p-3 sm:p-4 select-none rounded-t-3xl overflow-hidden group/media">
              {selectedItem.isVideo ? (
                <video
                  src={selectedItem.image}
                  controls
                  className="max-w-full max-h-[46vh] sm:max-h-[54vh] w-auto h-auto object-contain mx-auto rounded-md"
                  style={{ objectFit: "contain" }}
                  autoPlay
                />
              ) : (
                <div
                  className="relative flex items-center justify-center w-full h-full cursor-zoom-in"
                  onClick={() => setPreviewImage(selectedItem.image)}
                  title="Click to view full image"
                >
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    className="max-w-full max-h-[46vh] sm:max-h-[54vh] w-auto h-auto object-contain mx-auto rounded-md shadow-lg select-none transition-transform duration-200 group-hover/media:scale-[1.01]"
                    style={{ objectFit: "contain" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/sample.png";
                    }}
                  />
                  <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover/media:opacity-100 transition-opacity bg-black/75 text-white text-[11px] font-medium px-2.5 py-1 rounded-md backdrop-blur-sm pointer-events-none flex items-center gap-1.5 border border-white/10 shadow-md">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6 flex flex-col gap-3 overflow-y-auto">
              <span className="text-xs text-[#FF7A00] font-bold uppercase tracking-wider">
                {selectedItem.category} • {selectedItem.condition}
              </span>
              <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{selectedItem.title}</h2>
              <span className="text-2xl font-black text-[#FF7A00]">
                ₹{selectedItem.price.toLocaleString("en-IN")}
              </span>

              {selectedItem.description && (
                <div
                  className={`text-xs ${isDarkMode ? "text-gray-300 bg-[#181B26]" : "text-gray-700 bg-gray-50 border border-gray-100"
                    } line-clamp-3 p-3 rounded-xl`}
                  dangerouslySetInnerHTML={{ __html: selectedItem.description }}
                />
              )}

              <div className={`flex items-center gap-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>
                <MapPin className="w-3.5 h-3.5 text-[#FF7A00]" />
                <span>{selectedItem.location}</span>
                <span>•</span>
                <span>{selectedItem.timeAgo}</span>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => {
                    window.location.href = `tel:${selectedItem.phone || "9092024444"}`;
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF4500] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer hover:opacity-95 transition-opacity"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Seller</span>
                </button>

                <button
                  onClick={() => {
                    const rawWa = (selectedItem.whatsapp || selectedItem.phone || "9092024444").replace(/\D/g, "");
                    const fullWa = rawWa.length === 10 ? `91${rawWa}` : rawWa;
                    const url = `https://wa.me/${fullWa}?text=Hi,%20I%20am%20interested%20in%20your%20listing:%20${encodeURIComponent(selectedItem.title)}`;
                    window.open(url, "_blank");
                  }}
                  className={`flex-1 py-2.5 rounded-xl ${isDarkMode
                    ? "bg-[#1E2230] border-white/10 hover:border-white/20 text-white"
                    : "bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-800"
                    } border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors`}
                >
                  <MessageSquare className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ════════════════ DEDICATED FULLSCREEN IMAGE PREVIEW LIGHTBOX ════════════════ */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition-all border border-white/20 shadow-2xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close image preview"
            title="Close Preview (Esc)"
          >
            <X className="w-6 h-6 stroke-[2.2]" />
          </button>
          <div
            className="relative max-w-[96vw] max-h-[92vh] flex items-center justify-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Fullscreen Product Preview"
              className="max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain select-none rounded-lg drop-shadow-2xl"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      )}

      {/* ════════════════ FLOATING CREATE POSTER (+) BUTTON ════════════════ */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 group">
        {/* Tooltip */}
        <div
          role="tooltip"
          className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-xl bg-gray-900/95 dark:bg-[#141620]/95 text-white text-xs font-semibold shadow-xl border border-white/10 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap hidden sm:flex items-center gap-1.5 backdrop-blur-md"
        >
          <span>Create Poster</span>
          <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-gray-900/95 dark:border-l-[#141620]/95" />
        </div>

        {/* Floating Circular Action Button */}
        <button
          type="button"
          onClick={handleCreatePosterClick}
          aria-label="Create Poster"
          title="Create Poster"
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#FF5722] via-[#FF6B00] to-[#FFA040] hover:from-[#FF7043] hover:to-[#FF5722] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(255,87,34,0.45)] hover:shadow-[0_8px_25px_rgba(255,87,34,0.65)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-white/20 focus:outline-none focus:ring-4 focus:ring-[#FF5722]/30"
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
        </button>
      </div>

    </div>
  );
}
