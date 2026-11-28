"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Filter,
  Pencil,
  Trash2,
  Heart,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Upload,
  Download,
  Plus,
  Package,
  Boxes,
  IndianRupee,
} from "lucide-react";
import { toast } from "react-toastify";

import Header from "@components/header/page";
import { IconBtn, OrangeSpinner } from "@components/Button";
import Modal from "@components/Modal";
import AddProductModal from "@components/AddProductModal";
import { ConfirmationPopUp } from "@components/ConfirmationPopUp";
import FilterPanel from "@components/FilterPanel/page";
import { Filters } from "@app-types/FilterProps";
import { API_ENDPOINTS } from "@constants/api";
import apiClient from "@utilis/apiClient";
import { useUser } from "@context/UserContext";
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import { handleAuthErrorAndToast } from "@utilis/catchhandle";

/* ── Types ── */
interface Product {
  _id: string;
  name: string;
  price: number | string;
  qty?: number | string;
  unit?: string;
  gst?: number | string;
  hsn?: string;
  description?: string;
  dealers?: string;
  company_id?: any;
  companyId?: any;
  isHeart?: boolean;
  createdAt?: string;
}

interface Company {
  _id: string;
  name: string;
}
const PAGE_SIZE = 15;

export default function ProductWarehousePage() {
  const router = useRouter();
  const { isLoggedIn } = useUser();

  const [internalDark, setInternalDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("spa_theme") || localStorage.getItem("poster_theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  useEffect(() => {
    const handleThemeSync = () => {
      const saved = localStorage.getItem("spa_theme") || localStorage.getItem("poster_theme");
      if (saved) {
        setInternalDark(saved === "dark");
      } else {
        setInternalDark(document.documentElement.classList.contains("dark"));
      }
    };
    window.addEventListener("themechange", handleThemeSync);
    window.addEventListener("storage", handleThemeSync);
    return () => {
      window.removeEventListener("themechange", handleThemeSync);
      window.removeEventListener("storage", handleThemeSync);
    };
  }, []);

  const isDarkMode = internalDark;
  const themeBg = isDarkMode ? "bg-[#0D0E12] text-[#E0E2EC]" : "bg-[#F8F9FC] text-[#111827]";
  const themeCard = isDarkMode ? "bg-[#16181E] border-white/[0.08]" : "bg-[#FFFFFF] border-[#E5E7EB] shadow-sm";
  const themeInput = isDarkMode ? "bg-[#1B1E26] border-white/[0.08] text-white" : "bg-[#F3F4F6] border-[#E5E7EB] text-gray-900";
  const themeText = isDarkMode ? "text-white" : "text-gray-900";
  const themeSubtext = isDarkMode ? "text-[#7E8698]" : "text-gray-600";

  // Core data states
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({
    minPrice: "",
    maxPrice: "",
    startDate: "",
    endDate: "",
    sortOption: "",
    favoritesOnly: false,
  });

  const isAnyFilterActive = Boolean(
    filters.minPrice ||
    filters.maxPrice ||
    filters.startDate ||
    filters.endDate ||
    filters.sortOption ||
    filters.favoritesOnly
  );

  // Selection & bulk delete
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Inline editing & modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<(Product & { _id: string }) | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper: Get active user ID
  const getUserId = useCallback((): string => {
    if (typeof window === "undefined") return "";
    const stored = localStorage.getItem("user_id") || localStorage.getItem("authId");
    if (stored && stored !== "guest-session" && stored !== "guest") return stored;
    return "";
  }, []);

  // Company ID to Name mapping
  const companyMap = useMemo(() => {
    const map: Record<string, string> = {};
    companies.forEach((c) => {
      map[c._id] = c.name;
    });
    return map;
  }, [companies]);

  // Fetch Companies
  const getCompanies = useCallback(async () => {
    const userId = getUserId();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token && typeof window !== "undefined") {
      const localData = localStorage.getItem("vendor_companies");
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            setCompanies(parsed);
            return;
          }
        } catch {
          // ignore error
        }
      }
    }

    try {
      const res = await apiClient.get(
        API_ENDPOINTS.COMPANIES.GET_COMPANY_BY_USER_ID(userId),
        {
          params: { flag: "vendor" },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.data?.company) {
        setCompanies(res.data.company);
      }
    } catch {
      // Keep existing list
    }
  }, [getUserId]);

  // Fetch Products dynamically from Backend API
  const fetchProducts = useCallback(
    async (
      companyId?: string,
      search?: string,
      activeFilters?: Filters,
      page: number = 1
    ) => {
      setLoading(true);
      const userId = getUserId();
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      try {
        const params: Record<string, any> = {
          page,
          limit: PAGE_SIZE,
        };

        if (companyId) params.companyId = companyId;
        if (search && search.trim()) params.name = search.trim();
        if (activeFilters?.startDate) params.startDate = activeFilters.startDate;
        if (activeFilters?.endDate) params.endDate = activeFilters.endDate;
        if (activeFilters?.minPrice) params.minPrice = activeFilters.minPrice;
        if (activeFilters?.maxPrice) params.maxPrice = activeFilters.maxPrice;
        if (activeFilters?.sortOption) params.sort = activeFilters.sortOption;
        if (activeFilters?.favoritesOnly) params.isHeart = true;

        const res = await apiClient.get(API_ENDPOINTS.PRODUCTS.GET_BY_USER(userId), {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const list = res.data.products || res.data.data || [];
        setProducts(list);

        const total = res.data.totalProducts ?? res.data.total ?? list.length;
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
      } catch (err: any) {
        console.error("Error loading warehouse products from server:", err);
      } finally {
        setLoading(false);
      }
    },
    [getUserId]
  );

  // Initial load
  useEffect(() => {
    getCompanies();
    const savedCompany = typeof window !== "undefined" ? sessionStorage.getItem("selectedWarehouseCompany") : null;
    if (savedCompany) {
      setSelectedCompany(savedCompany);
    }
  }, [getCompanies]);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(selectedCompany, searchQuery, filters, currentPage);
    }, 350);
    return () => clearTimeout(timer);
  }, [selectedCompany, searchQuery, filters, currentPage, fetchProducts]);

  // Calculated Inventory Summary metrics
  const inventorySummary = useMemo(() => {
    const totalProducts = totalCount || products.length;
    const totalQty = products.reduce((acc, p) => acc + (Number(p.qty) || 0), 0);
    const totalValue = products.reduce(
      (acc, p) => acc + (Number(p.price) || 0) * (Number(p.qty) || 1),
      0
    );

    return {
      totalProducts,
      totalQty,
      totalValueFormatted: totalValue.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      }),
    };
  }, [totalCount, products]);

  // Handle Company Dropdown selection
  const handleCompanyChange = (value: string) => {
    if (value === "add") {
      router.push("/pages/Settings?tab=company&openModal=true");
      return;
    }
    setSelectedCompany(value);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedWarehouseCompany", value);
    }
    setCurrentPage(1);
  };

  // Toggle Favorite
  const toggleFavorite = async (productId: string) => {
    try {
      const res = await apiClient.patch(API_ENDPOINTS.PRODUCTS.TOGGLE_FAVORITE(productId));
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, isHeart: res.data.isHeart } : p))
      );
      safeToastSuccess(res.data.isHeart ? "Added to favorites ❤️" : "Removed from favorites");
    } catch (err: any) {
      if (handleAuthErrorAndToast(err, "Please login to update favorites")) return;
    }
  };

  // Row selection
  const toggleSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p._id));
    }
  };

  // Delete Action
  const triggerDelete = (product: Product) => {
    setDeleteTarget(product);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    const idsToDelete =
      selectedProductIds.length > 0
        ? selectedProductIds
        : deleteTarget
          ? [deleteTarget._id]
          : [];

    if (idsToDelete.length === 0) return;

    const userId = getUserId();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.PRODUCTS.DELETE_MULTIPLE,
        { userId, productIds: idsToDelete },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      safeToastSuccess(response.data.message || `${idsToDelete.length} product(s) deleted successfully`);
      setSelectedProductIds([]);
      setDeleteTarget(null);
      setSelectionMode(false);
      setShowConfirm(false);
      fetchProducts(selectedCompany, searchQuery, filters, currentPage);
    } catch (err: any) {
      safeToastError(err.response?.data?.message || "Failed to delete product(s)");
    }
  };

  // XML Export
  const handleExportXML = async () => {
    const idsToExport = selectedProductIds.length > 0 ? selectedProductIds : products.map((p) => p._id);
    if (!idsToExport.length) {
      toast.warn("No products available to export.");
      return;
    }

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.PRODUCTS.DOWNLOAD_XML,
        { ids: idsToExport },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `renote_products_${Date.now()}.xml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      safeToastSuccess(`Exported ${idsToExport.length} products to XML!`);
      setSelectedProductIds([]);
      setSelectionMode(false);
    } catch {
      safeToastError("Failed to export products to XML.");
    }
  };

  // XML Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const userId = getUserId();
      const response = await apiClient.post(
        API_ENDPOINTS.PRODUCTS.UPLOAD_XML(userId),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      safeToastSuccess(response.data.message || "Products uploaded successfully!");
      fetchProducts(selectedCompany, searchQuery, filters, 1);
    } catch {
      safeToastError("Failed to upload XML file.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Page navigation
  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  return (
    <div className={`min-h-screen ${themeBg} flex flex-col font-sans transition-colors duration-200 pb-16 md:pb-6`}>
      {/* ════════════════ 1. STANDARD RENOTE HEADER ════════════════ */}
      <Header />

      {/* ════════════════ 2. DESKTOP TOOLBAR ════════════════ */}
      <div className="hidden md:block w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 pb-2">
        <div className="flex flex-row gap-3 items-center justify-between w-full">
          {/* Left: Combined Search Input & Company Selector */}
          <div className={`flex w-[520px] border ${isDarkMode ? "border-white/[0.08] bg-[#1B1E26] focus-within:border-[#FF5722]/60 focus-within:ring-2 focus-within:ring-[#FF5722]/20" : "border-gray-300 bg-white focus-within:border-[#FF5722]/60 focus-within:ring-2 focus-within:ring-[#FF5722]/20"} rounded-xl overflow-hidden shadow-sm transition-all group`}>
            {/* 1. Search Input (FIRST) */}
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                disabled={selectedProductIds.length > 0}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className={`w-full px-4 py-2 pr-9 text-sm outline-none border-none rounded-l-xl
                disabled:opacity-50 transition-all ${isDarkMode ? "bg-[#1B1E26] text-white placeholder-gray-500" : "bg-white text-gray-800 placeholder-gray-400"}`}
              />
              <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none group-focus-within:text-[#FF5722] text-gray-400 transition-colors">
                <Search className="w-[18px] h-[18px] stroke-[2]" />
              </span>
            </div>

            {/* 2. Dropdown with All Companies & + Add Company (NEXT) */}
            <select
              disabled={selectedProductIds.length > 0}
              value={selectedCompany}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className={`px-3 py-2 text-sm ${isDarkMode ? "bg-[#181B26] text-gray-200 border-[#2B3044]" : "bg-gray-50 text-gray-800 border-gray-300"} border-l outline-none hover:bg-gray-100 dark:hover:bg-[#1E2232] 
              disabled:opacity-50 rounded-r-xl md:min-w-[210px]
              transition-all font-semibold cursor-pointer`}
            >
              <option value="" className="font-semibold text-[#FF5722]">
                All Companies
              </option>
              {companies.map((c) => (
                <option key={c._id} value={c._id} className={isDarkMode ? "bg-[#16181E] text-white" : "bg-white text-gray-800 font-normal"}>
                  {c.name}
                </option>
              ))}
              <option value="add" className="font-semibold text-[#FF5722]">
                ➕ Add Company
              </option>
            </select>
          </div>

          {/* Filter Panel Toggle */}
          <button
            onClick={() => setIsFilterVisible(true)}
            disabled={selectedProductIds.length > 0}
            className={`p-2 border rounded-xl transition-all disabled:opacity-50 cursor-pointer ${isAnyFilterActive
                ? "border-[#FF5722] bg-[#FF5722]/10 text-[#FF5722] shadow-[0_0_12px_rgba(255,87,34,0.25)]"
                : isDarkMode
                  ? "border-white/[0.08] bg-[#1B1E26] text-gray-300 hover:bg-white/[0.08] hover:border-[#FF5722]/50 hover:text-[#FF5722]"
                  : "border-gray-300 bg-white hover:bg-gray-50 hover:border-[#FF5722]/50 hover:text-[#FF5722] text-gray-600"
              }`}
            title="Filter Products"
          >
            <Filter className="w-[18px] h-[18px] stroke-[2]" />
          </button>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {selectedProductIds.length > 0 && (
              <>
                <button
                  onClick={() => {
                    setDeleteTarget(null);
                    setShowConfirm(true);
                  }}
                  className="p-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-colors cursor-pointer"
                  title="Delete Selected Products"
                >
                  <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                </button>
                <button
                  onClick={handleExportXML}
                  className={`p-2 border rounded-xl transition-colors cursor-pointer ${isDarkMode ? "border-white/[0.08] bg-[#1B1E26] text-gray-300 hover:bg-white/[0.08] hover:border-[#FF5722]/40 hover:text-[#FF5722]" : "border-gray-300 bg-white hover:bg-gray-50 hover:border-[#FF5722]/40 hover:text-[#FF5722] text-gray-700"}`}
                  title="Export Selected to XML"
                >
                  <Download className="w-[18px] h-[18px] stroke-[2]" />
                </button>
              </>
            )}

            {/* XML Export Button */}
            <button
              disabled={selectedProductIds.length > 0}
              onClick={handleExportXML}
              className={`p-2 border rounded-xl transition-all cursor-pointer disabled:opacity-50 ${isDarkMode ? "border-white/[0.08] bg-[#1B1E26] text-[#FF5722] hover:bg-[#FF5722]/10 hover:border-[#FF5722]/50 shadow-sm" : "border-gray-300 bg-white hover:bg-[#FF5722]/10 hover:border-[#FF5722]/50 text-[#FF5722] shadow-sm"}`}
              title="Download XML"
            >
              <Download className="w-[18px] h-[18px] stroke-[2]" />
            </button>

            {/* XML Import Hidden File Input & Button */}
            <input
              type="file"
              accept=".xml"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              disabled={selectedProductIds.length > 0}
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 border rounded-xl transition-all cursor-pointer disabled:opacity-50 ${isDarkMode ? "border-white/[0.08] bg-[#1B1E26] hover:bg-white/[0.08] hover:border-[#FF5722]/50 hover:text-[#FF5722] text-gray-300" : "border-gray-300 bg-white hover:bg-gray-50 hover:border-[#FF5722]/50 hover:text-[#FF5722] text-gray-600"}`}
              title="Upload Products XML"
            >
              <Upload className="w-[18px] h-[18px] stroke-[2]" />
            </button>

            {/* + Add Product Primary Action Button */}
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              disabled={selectedProductIds.length > 0}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold bg-gradient-to-r from-[#FF5722] to-[#FF6B00] hover:from-[#FF7043] hover:to-[#FF5722] text-white rounded-xl shadow-[0_4px_14px_rgba(255,87,34,0.35)] hover:shadow-[0_6px_20px_rgba(255,87,34,0.45)] active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 disabled:pointer-events-none transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════ 3. MOBILE SEARCH BAR ════════════════ */}
      <div className="md:hidden p-3 mt-2 flex flex-col gap-3">
        <div className={`flex w-full border ${isDarkMode ? "border-white/[0.08] bg-[#1B1E26] focus-within:border-[#FF5722]/60 focus-within:ring-2 focus-within:ring-[#FF5722]/20" : "border-gray-300 bg-white focus-within:border-[#FF5722]/60 focus-within:ring-2 focus-within:ring-[#FF5722]/20"} rounded-xl overflow-hidden shadow-sm transition-all group`}>
          {/* 1. Mobile Search Input (FIRST) */}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className={`w-full px-3 py-2 pr-9 text-xs outline-none ${isDarkMode ? "bg-[#1B1E26] text-white placeholder-gray-500" : "bg-white text-gray-800 placeholder-gray-400"} transition-all`}
            />
            <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none group-focus-within:text-[#FF5722] text-gray-400 transition-colors">
              <Search className="w-[18px] h-[18px] stroke-[2]" />
            </span>
          </div>

          {/* 2. Mobile Company Dropdown (NEXT) */}
          <select
            value={selectedCompany}
            onChange={(e) => handleCompanyChange(e.target.value)}
            className={`w-1/2 shrink-0 px-2 py-2 text-xs ${isDarkMode ? "bg-[#181B26] text-gray-200 border-[#2B3044]" : "bg-gray-50 text-gray-800 border-gray-300"} border-l outline-none hover:bg-gray-100 dark:hover:bg-[#1E2232] transition-colors font-semibold`}
          >
            <option value="" className="text-[#FF5722] font-semibold">
              All Companies
            </option>
            {companies.map((c) => (
              <option key={c._id} value={c._id} className={isDarkMode ? "bg-[#16181E] text-white" : "bg-white text-gray-800"}>
                {c.name}
              </option>
            ))}
            <option value="add" className="text-[#FF5722] font-semibold">
              ➕ Add Company
            </option>
          </select>
        </div>
      </div>

      {/* ════════════════ 4. SUMMARY METRICS CARDS (MATCHING THEME) ════════════════ */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mb-3 hidden sm:grid grid-cols-3 gap-3.5 w-full">
        <div className={`${themeCard} p-3.5 rounded-2xl border flex items-center justify-between hover:border-[#FF5722]/30 hover:shadow-[0_4px_16px_rgba(255,87,34,0.08)] transition-all`}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${themeSubtext} block`}>
              Total Products
            </span>
            <span className={`text-xl font-bold ${themeText} mt-0.5 block`}>
              {loading ? "..." : inventorySummary.totalProducts}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FF5722]/10 border border-[#FF5722]/20 flex items-center justify-center text-[#FF5722] shadow-[0_2px_8px_rgba(255,87,34,0.12)]">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className={`${themeCard} p-3.5 rounded-2xl border flex items-center justify-between hover:border-[#FF5722]/30 hover:shadow-[0_4px_16px_rgba(255,87,34,0.08)] transition-all`}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${themeSubtext} block`}>
              Stock Quantity
            </span>
            <span className={`text-xl font-bold ${themeText} mt-0.5 block`}>
              {loading ? "..." : inventorySummary.totalQty.toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FF5722]/10 border border-[#FF5722]/20 flex items-center justify-center text-[#FF5722] shadow-[0_2px_8px_rgba(255,87,34,0.12)]">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className={`${themeCard} p-3.5 rounded-2xl border flex items-center justify-between hover:border-[#FF5722]/30 hover:shadow-[0_4px_16px_rgba(255,87,34,0.08)] transition-all`}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${themeSubtext} block`}>
              Stock Value
            </span>
            <span className={`text-xl font-bold ${themeText} mt-0.5 block`}>
              {loading ? "..." : `₹ ${inventorySummary.totalValueFormatted}`}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FF5722]/10 border border-[#FF5722]/20 flex items-center justify-center text-[#FF5722] shadow-[0_2px_8px_rgba(255,87,34,0.12)]">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ════════════════ 5. MOBILE CONTENT & ACTIONS ════════════════ */}
      <div className="md:hidden px-3 flex flex-col gap-3">

        {/* Mobile Fixed Bottom Action Bar */}
        <div className={`fixed bottom-0 left-0 right-0 z-30 ${isDarkMode ? "bg-[#16181E]/95 border-white/[0.08]" : "bg-white/95 border-gray-200"} backdrop-blur-md border-t shadow-lg px-3 py-2.5 flex items-center gap-2`}>
          {selectionMode ? (
            <>
              <button
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedProductIds([]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/[0.12] bg-white dark:bg-[#1B1E26] text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:border-[#FF5722]/40 transition-all cursor-pointer"
              >
                Cancel
              </button>
              {selectedProductIds.length > 0 && (
                <>
                  <IconBtn
                    label={<Trash2 className="w-5 h-5 stroke-[2] text-red-500" />}
                    onClick={() => {
                      setDeleteTarget(null);
                      setShowConfirm(true);
                    }}
                  />
                  <IconBtn
                    label={<Download className="w-5 h-5 stroke-[2] text-gray-700 dark:text-gray-200" />}
                    onClick={handleExportXML}
                    className="hover:border-[#FF5722]/40 hover:text-[#FF5722]"
                  />
                </>
              )}
              <label className="ml-auto flex items-center gap-1.5 text-xs text-[#FF5722] font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={products.length > 0 && selectedProductIds.length === products.length}
                  onChange={selectAll}
                  className="accent-[#FF5722] cursor-pointer"
                />
                <span>Select All</span>
              </label>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectionMode(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/[0.08] bg-white dark:bg-[#1B1E26] text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/[0.08] hover:border-[#FF5722]/40 transition-colors cursor-pointer"
              >
                <CheckSquare className="w-[18px] h-[18px] stroke-[2]" />
                Select
              </button>
              <IconBtn
                onClick={() => setIsFilterVisible(true)}
                label={<Filter className={`w-5 h-5 stroke-[2] ${isAnyFilterActive ? "text-[#FF5722]" : "text-gray-600 dark:text-gray-300"}`} />}
                className={
                  isAnyFilterActive
                    ? "border-[#FF5722] bg-[#FF5722]/10 text-[#FF5722] shadow-[0_0_12px_rgba(255,87,34,0.25)]"
                    : "hover:border-[#FF5722]/40 hover:text-[#FF5722]"
                }
              />
              <input
                type="file"
                accept=".xml"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <IconBtn
                label={<Upload className="w-5 h-5 stroke-[2] text-gray-600 dark:text-gray-300" />}
                onClick={() => fileInputRef.current?.click()}
                className="hover:border-[#FF5722]/40 hover:text-[#FF5722]"
              />
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold bg-gradient-to-r from-[#FF5722] to-[#FF6B00] hover:from-[#FF7043] hover:to-[#FF5722] text-white rounded-xl shadow-[0_4px_14px_rgba(255,87,34,0.35)] hover:shadow-[0_6px_20px_rgba(255,87,34,0.45)] active:scale-95 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Product</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Product Cards List */}
        <div className="flex flex-col gap-3 pb-24">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <OrangeSpinner size={36} />
            </div>
          ) : products.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border ${themeCard} flex flex-col items-center justify-center`}>
              <Package className="w-12 h-12 text-[#FF5722] mx-auto mb-2 opacity-80" />
              <p className={`text-sm font-semibold ${themeText}`}>No warehouse products found</p>
              <p className={`text-xs ${themeSubtext} mt-1 max-w-xs text-center`}>
                {searchQuery || selectedCompany
                  ? "Try clearing your filters or search keywords."
                  : "Add your first product to begin tracking warehouse inventory."}
              </p>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsModalOpen(true);
                }}
                className="mt-3.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#FF6B00] hover:from-[#FF7043] hover:to-[#FF5722] text-white font-bold text-xs shadow-[0_4px_14px_rgba(255,87,34,0.35)] hover:shadow-[0_6px_20px_rgba(255,87,34,0.45)] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Product</span>
              </button>
            </div>
          ) : (
            products.map((p) => {
              const companyName =
                typeof p.company_id === "object" && p.company_id?.name
                  ? p.company_id.name
                  : (companyMap[p.company_id || p.companyId] || "");
              return (
                <div
                  key={p._id}
                  className={`${isDarkMode ? "bg-[#16181E] border-white/[0.08]" : "bg-white border-gray-200"} p-3.5 rounded-xl border shadow-sm flex flex-col gap-2`}
                  onClick={() => {
                    if (selectionMode) toggleSelect(p._id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectionMode && (
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p._id)}
                          onChange={() => toggleSelect(p._id)}
                          className="accent-[#FF5722] cursor-pointer"
                        />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(p._id);
                        }}
                      >
                        <Heart
                          className={`w-[18px] h-[18px] stroke-[2] ${p.isHeart ? "text-red-500 fill-red-500" : "text-gray-400"
                            }`}
                        />
                      </button>
                      <span className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>{p.name}</span>
                    </div>
                    <span className="font-bold text-sm text-[#FF5722]">
                      ₹{Number(p.price).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                    {companyName && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        {companyName}
                      </span>
                    )}
                    <span>Qty: {p.qty ?? "-"} {p.unit || ""}</span>
                    <span>• GST: {p.gst || 0}%</span>
                    <span>• HSN: {p.hsn || "-"}</span>
                    {p.dealers && <span>• Dealer: {p.dealers}</span>}
                  </div>

                  {!selectionMode && (
                    <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isDarkMode ? "border-white/[0.06]" : "border-gray-100"}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(p as any);
                          setIsModalOpen(true);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#FF5722] hover:bg-[#FF5722]/10 transition-colors cursor-pointer"
                        title="Edit Product"
                      >
                        <Pencil className="w-[18px] h-[18px] stroke-[2]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerDelete(p);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ════════════════ 6. DESKTOP PRODUCT DATA TABLE ════════════════ */}
      <div className="hidden md:block max-w-[1600px] mx-auto px-4 sm:px-6 mt-4 text-sm w-full">
        {loading ? (
          <div className={`flex items-center justify-center h-[55vh] w-full ${themeCard} rounded-2xl border`}>
            <OrangeSpinner size={40} />
          </div>
        ) : products.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-[55vh] text-center ${themeCard} rounded-2xl border p-8`}>
            <Package className="w-16 h-16 text-[#FF5722] mb-3 opacity-80" />
            <p className={`${themeText} text-lg font-semibold`}>
              No products found in the warehouse
            </p>
            <p className={`${themeSubtext} text-sm mt-1 max-w-md`}>
              {searchQuery || selectedCompany
                ? "Try clearing your filters or search keywords."
                : "Add your first product to begin tracking warehouse inventory."}
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#FF6B00] hover:from-[#FF7043] hover:to-[#FF5722] text-white font-bold text-sm shadow-[0_4px_14px_rgba(255,87,34,0.35)] hover:shadow-[0_6px_20px_rgba(255,87,34,0.45)] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Product</span>
            </button>
          </div>
        ) : (
          <div className={`rounded-2xl border ${isDarkMode ? "border-white/[0.08] bg-[#16181E]" : "border-gray-200 bg-white"} overflow-x-auto overflow-y-auto max-h-[72vh] hide-scrollbar shadow-2xl transition-colors`}>
            <table className="w-full min-w-[1020px] table-fixed border-collapse">
              <thead className={`${isDarkMode ? "bg-[#14161E] border-white/[0.08] text-[#94A3B8]" : "bg-gray-50 border-gray-200 text-gray-600"} border-b sticky top-0 z-10 text-[11px] font-semibold uppercase tracking-wider`}>
                <tr>
                  <th className="px-2 py-2.5 w-9 text-center">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedProductIds.length === products.length}
                      onChange={selectAll}
                      className="accent-[#FF5722] cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2.5 w-52 text-left">Product Name</th>
                  <th className="px-3 py-2.5 w-36 text-left">Description</th>
                  <th className="px-3 py-2.5 w-24 text-right">Price (₹)</th>
                  <th className="px-2 py-2.5 w-16 text-center">Qty</th>
                  <th className="px-2 py-2.5 w-16 text-center">Unit</th>
                  <th className="px-2 py-2.5 w-16 text-center">GST%</th>
                  <th className="px-2 py-2.5 w-20 text-center">HSN</th>
                  <th className="px-3 py-2.5 w-32 text-left">Company</th>
                  <th className="px-3 py-2.5 w-28 text-left">Dealers</th>
                  <th className="px-2 py-2.5 w-20 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {products.map((p, i) => {
                  const companyName =
                    typeof p.company_id === "object" && p.company_id?.name
                      ? p.company_id.name
                      : (companyMap[p.company_id || p.companyId] || "");
                  const isSelected = selectedProductIds.includes(p._id);

                  return (
                    <tr
                      key={p._id || `product-${i}`}
                      onClick={() => {
                        if (selectedProductIds.length > 0) toggleSelect(p._id);
                      }}
                      className={`border-b ${isDarkMode ? "border-white/[0.05]" : "border-gray-100"} transition-colors ${isSelected
                          ? isDarkMode ? "bg-[#FF5722]/15 border-l-2 border-l-[#FF5722]" : "bg-[#FF5722]/10 border-l-2 border-l-[#FF5722]"
                          : i % 2 === 0
                            ? isDarkMode ? "bg-[#16181E]" : "bg-white"
                            : isDarkMode ? "bg-[#13151B]" : "bg-gray-50/70"
                        } ${isDarkMode ? "hover:bg-white/[0.04]" : "hover:bg-gray-100/80"} cursor-pointer`}
                      style={{ height: "46px" }}
                    >
                      {/* Checkbox */}
                      <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p._id)}
                          className="accent-[#FF5722] cursor-pointer"
                        />
                      </td>

                      {/* Product Name & Favorite Heart */}
                      <td className={`px-3 py-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"} font-medium truncate`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <button
                            className="focus:outline-none shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(p._id);
                            }}
                            title="Toggle Favorite"
                          >
                            <Heart
                              className={`w-[18px] h-[18px] stroke-[2] transition-colors ${p.isHeart
                                  ? "text-red-500 fill-red-500"
                                  : isDarkMode ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-400"
                                }`}
                            />
                          </button>
                          <span className={`truncate font-semibold text-xs sm:text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`} title={p.name}>
                            {p.name}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className={`px-3 py-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"} text-xs truncate`} title={p.description || "—"}>
                        {p.description || "—"}
                      </td>

                      {/* Price */}
                      <td className="px-3 py-2 font-bold text-[#FF5722] text-right whitespace-nowrap text-xs sm:text-sm">
                        ₹ {Number(p.price).toLocaleString("en-IN")}
                      </td>

                      {/* Quantity */}
                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block font-semibold px-2 py-0.5 rounded text-xs ${(Number(p.qty) || 0) > 0
                              ? isDarkMode ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40" : "text-emerald-700 bg-emerald-50 border border-emerald-200"
                              : isDarkMode ? "text-red-400 bg-red-950/40 border border-red-800/40" : "text-red-600 bg-red-50 border border-red-200"
                            }`}
                        >
                          {p.qty ?? "-"}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className={`px-2 py-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"} text-center text-xs whitespace-nowrap`}>
                        {p.unit || "-"}
                      </td>

                      {/* GST */}
                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${isDarkMode ? "bg-[#FF5722]/15 text-[#FFA040] border border-[#FF5722]/30" : "bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/30"}`}>
                          {p.gst || 0}%
                        </span>
                      </td>

                      {/* HSN */}
                      <td className={`px-2 py-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"} text-center text-xs whitespace-nowrap`}>
                        {p.hsn || "—"}
                      </td>

                      {/* Company Name */}
                      <td className="px-3 py-2 truncate">
                        {companyName ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap inline-block truncate max-w-full ${isDarkMode ? "bg-blue-900/30 text-blue-400 border border-blue-800/40" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                            {companyName}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Dealers */}
                      <td className={`px-3 py-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"} text-xs truncate`} title={p.dealers || "—"}>
                        {p.dealers || "—"}
                      </td>

                      {/* Action Buttons (Pencil / Trash) */}
                      <td className="px-2 py-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingProduct(p as any);
                              setIsModalOpen(true);
                            }}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${isDarkMode ? "text-gray-300 hover:text-[#FF5722] hover:bg-[#FF5722]/10" : "text-gray-600 hover:text-[#FF5722] hover:bg-[#FF5722]/10"
                              }`}
                            title="Edit Product"
                          >
                            <Pencil className="w-[18px] h-[18px] stroke-[2]" />
                          </button>
                          <button
                            onClick={() => triggerDelete(p)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${isDarkMode ? "text-gray-300 hover:text-red-400 hover:bg-red-500/10" : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                              }`}
                            title="Delete Product"
                          >
                            <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════ 6. CIRCULAR PAGINATION (EXACT MATCH TO INVOICE SCREENSHOT) ════════════════ */}
      {totalPages > 1 && (
        <div className={`mt-auto py-3.5 mb-14 md:mb-0 flex justify-center items-center gap-2 text-sm ${isDarkMode ? "bg-[#16181E] border-white/[0.08] text-white" : "bg-white border-gray-200 text-gray-800"} border-t z-20 overflow-x-auto shadow-md transition-colors`}>
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full ${isDarkMode ? "bg-[#1B1E26] text-gray-300 hover:text-[#FF5722] hover:border-[#FF5722]/50 border border-white/[0.06]" : "bg-gray-100 text-gray-700 hover:text-[#FF5722] hover:border-[#FF5722]/50 border border-gray-200"} hover:bg-[#FF5722]/10 hover:shadow-[0_2px_8px_rgba(255,87,34,0.2)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit disabled:hover:border-transparent shadow cursor-pointer`}
            title="Previous page"
          >
            <ChevronLeft className="w-[18px] h-[18px] stroke-[2]" />
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all cursor-pointer ${pageNum === currentPage
                  ? "bg-gradient-to-r from-[#FF5722] to-[#FF6B00] text-white shadow-[0_4px_14px_rgba(255,87,34,0.4)] scale-105 font-bold"
                  : isDarkMode
                    ? "bg-[#1B1E26] text-gray-300 hover:bg-[#FF5722]/10 hover:text-[#FF5722] hover:border-[#FF5722]/40 border border-white/[0.06] shadow font-semibold hover:scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-[#FF5722]/10 hover:text-[#FF5722] hover:border-[#FF5722]/40 border border-gray-200 shadow font-semibold hover:scale-105"
                }`}
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full ${isDarkMode ? "bg-[#1B1E26] text-gray-300 hover:text-[#FF5722] hover:border-[#FF5722]/50 border border-white/[0.06]" : "bg-gray-100 text-gray-700 hover:text-[#FF5722] hover:border-[#FF5722]/50 border border-gray-200"} hover:bg-[#FF5722]/10 hover:shadow-[0_2px_8px_rgba(255,87,34,0.2)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit disabled:hover:border-transparent shadow cursor-pointer`}
            title="Next page"
          >
            <ChevronRight className="w-[18px] h-[18px] stroke-[2]" />
          </button>
        </div>
      )}

      {/* ════════════════ MODALS ════════════════ */}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        className="p-0 border-0 bg-transparent w-full max-w-lg mx-auto shadow-2xl relative z-50"
        overlayClassName={isDarkMode ? "bg-black/70 backdrop-blur-sm" : "bg-black/35 backdrop-blur-sm"}
      >
        <AddProductModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onProductAdded={(savedProduct) => {
            setCurrentPage(1);
            if (savedProduct?.company_id) {
              const compId =
                typeof savedProduct.company_id === "object"
                  ? savedProduct.company_id._id
                  : savedProduct.company_id;
              if (selectedCompany && compId && selectedCompany !== compId) {
                setSelectedCompany("");
                fetchProducts("", "", filters, 1);
                getCompanies();
                return;
              }
            }
            fetchProducts(selectedCompany, searchQuery, filters, 1);
            getCompanies();
          }}
          product={
            editingProduct
              ? {
                ...editingProduct,
                price: Number(editingProduct.price) || 0,
                qty: Number(editingProduct.qty) || 0,
                gst: Number(editingProduct.gst) || 0,
                companyId:
                  typeof editingProduct.company_id === "object" && editingProduct.company_id?._id
                    ? editingProduct.company_id._id
                    : editingProduct.company_id || editingProduct.companyId,
              }
              : undefined
          }
          defaultCompanyId={selectedCompany}
          companies={companies}
          isDark={isDarkMode}
        />
      </Modal>

      {/* Delete Confirmation Popup */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
        <ConfirmationPopUp
          message={
            <div>
              <p className="text-gray-800 text-sm">
                Are you sure you want to delete{" "}
                <span className="font-bold text-gray-900">
                  {selectedProductIds.length > 0
                    ? `${selectedProductIds.length} selected products`
                    : deleteTarget?.name || "this product"}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
          }
          onYes={confirmDelete}
          onNo={() => setShowConfirm(false)}
        />
      </Modal>

      {/* Filter Panel Modal */}
      <Modal isOpen={isFilterVisible} onClose={() => setIsFilterVisible(false)}>
        <FilterPanel
          filters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters);
            setIsFilterVisible(false);
            fetchProducts(selectedCompany, searchQuery, newFilters, 1);
          }}
          onReset={() => {
            const resetFilters: Filters = {
              minPrice: "",
              maxPrice: "",
              startDate: "",
              endDate: "",
              sortOption: "",
              favoritesOnly: false,
            };
            setFilters(resetFilters);
            setIsFilterVisible(false);
            fetchProducts(selectedCompany, searchQuery, resetFilters, 1);
          }}
          onClose={() => setIsFilterVisible(false)}
        />
      </Modal>
    </div>
  );
}
