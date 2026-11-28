"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  Building,
  CheckSquare,
  Square,
  Calendar,
  ChevronDown,
  Store,
  Bell,
  Sparkles,
  RefreshCw,
  X,
  FileSpreadsheet,
  FileCode,
  ArrowRight,
  TrendingUp,
  Check,
  Calculator,
  User,
  Crown,
  Share2,
  Printer
} from "lucide-react";
import apiClient from "@utilis/apiClient";
import { API_ENDPOINTS } from "@constants/api";
import { useUser } from "@context/UserContext";
import Header from "@components/header/page";
import { useFinancialYear } from "@context/FinancialYearContext";
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import { Quotation } from "@app-types/estimationHomepage";
import { getLogoUrl } from "@utilis/getLogoUrl";
import "./estimation.css";

/* ── Brand Flame Logo SVG ── */
function BrandFlameLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="estFlameGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E63900" />
          <stop offset="50%" stopColor="#FF5722" />
          <stop offset="100%" stopColor="#FFA100" />
        </linearGradient>
        <linearGradient id="estFlameInner" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF5722" />
          <stop offset="100%" stopColor="#FFD54F" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C10.2 4.8 8.5 7.2 8.5 10.2C8.5 13 10.2 14.8 12 15.8C13.8 14.8 15.5 13 15.5 10.2C15.5 7.2 13.8 4.8 12 2Z"
        fill="url(#estFlameInner)"
        opacity="0.95"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 22C16.6395 22 20.4 18.2395 20.4 13.6C20.4 8.87 16.2 5.2 12 1C7.8 5.2 3.6 8.87 3.6 13.6C3.6 18.2395 7.3605 22 12 22ZM12 18C14.43 18 16.4 16.03 16.4 13.6C16.4 10.85 14.2 8.65 12 6.45C9.8 8.65 7.6 10.85 7.6 13.6C7.6 16.03 9.57 18 12 18Z"
        fill="url(#estFlameGrad)"
      />
    </svg>
  );
}

export default function EstimationDashboardPage(props?: { isDarkMode?: boolean } | any) {
  const propDarkMode = props?.isDarkMode;
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const mode = searchParams.get("mode");

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

  const isDarkMode = propDarkMode !== undefined ? propDarkMode : internalDark;
  const themeBg = isDarkMode ? "bg-[#0D0E12] text-[#E0E2EC]" : "bg-[#F8F9FC] text-[#111827]";
  const themeCard = isDarkMode ? "bg-[#16181E] border-white/[0.08]" : "bg-[#FFFFFF] border-[#E5E7EB] shadow-sm";
  const themeHeader = isDarkMode ? "bg-[#16181E] border-white/[0.08]" : "bg-[#FFFFFF] border-[#E5E7EB] shadow-sm";
  const themeInput = isDarkMode ? "bg-[#1B1E26] border-white/[0.08] text-white" : "bg-[#F3F4F6] border-[#E5E7EB] text-gray-900";
  const themeText = isDarkMode ? "text-white" : "text-gray-900";
  const themeSubtext = isDarkMode ? "text-[#7E8698]" : "text-gray-500";

  const { isLoggedIn, fullName, profileImageUrl } = useUser();
  const { selectedFY, setSelectedFY, fyOptions, currentFYLabel } = useFinancialYear();

  // State
  const [estimations, setEstimations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFyDropdownOpen, setIsFyDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewEstimate, setPreviewEstimate] = useState<Quotation | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Quotation | null>(null);

  // Filter Drawer Values
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);


  const fyDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const displayUserName = fullName || (typeof window !== "undefined" ? localStorage.getItem("firstName") : "") || "User";

  // Fetch Estimations from Real Backend API
  const fetchEstimations = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const userId = typeof window !== "undefined" ? (localStorage.getItem("user_id") || localStorage.getItem("authId") || "") : "";
      if (!userId) {
        setLoading(false);
        return;
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiClient.get(API_ENDPOINTS.QUOTATIONS.GET_BY_USER_ID(userId), {
        headers,
        params: { limit: 100 }
      });

      const list = res.data?.quotations || res.data?.data || [];
      if (Array.isArray(list)) {
        setEstimations(list);
      } else {
        setEstimations([]);
      }
    } catch (err) {
      console.error("Error loading real estimations from backend:", err);
      setEstimations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimations();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (fyDropdownRef.current && !fyDropdownRef.current.contains(e.target as Node)) {
        setIsFyDropdownOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  // Get unique companies list
  const companyOptions = useMemo(() => {
    const set = new Set<string>();
    estimations.forEach((est) => {
      const cName = est.company_id?.[0]?.name || est.companyName;
      if (cName) set.add(cName);
    });
    return ["All", ...Array.from(set)];
  }, [estimations]);

  // Filtered estimations
  const filteredEstimations = useMemo(() => {
    return estimations.filter((est) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const estId = (est.estimateID || est._id || "").toLowerCase();
        const custName = (est.customers?.[0]?.name || "").toLowerCase();
        const compName = (est.company_id?.[0]?.name || est.companyName || "").toLowerCase();
        const prodMatch = est.products?.some((p) => p.name.toLowerCase().includes(q));

        if (!estId.includes(q) && !custName.includes(q) && !compName.includes(q) && !prodMatch) {
          return false;
        }
      }

      // 2. Company filter
      if (selectedCompany !== "All") {
        const cName = est.company_id?.[0]?.name || est.companyName;
        if (cName !== selectedCompany) return false;
      }

      // 3. Favorites filter
      if (favoritesOnly && !est.isHeart) {
        return false;
      }

      // 4. Price range
      if (minPriceFilter && est.total < Number(minPriceFilter)) return false;
      if (maxPriceFilter && est.total > Number(maxPriceFilter)) return false;

      // 5. Date range
      if (startDateFilter && new Date(est.createdAt) < new Date(startDateFilter)) return false;
      if (endDateFilter && new Date(est.createdAt) > new Date(endDateFilter)) return false;

      return true;
    });
  }, [estimations, searchQuery, selectedCompany, favoritesOnly, minPriceFilter, maxPriceFilter, startDateFilter, endDateFilter]);

  // Summary Metrics calculations
  const totalEstimateValue = useMemo(() => {
    return filteredEstimations.reduce((sum, est) => sum + (Number(est.total) || 0), 0);
  }, [filteredEstimations]);

  const averageEstimateValue = useMemo(() => {
    if (filteredEstimations.length === 0) return 0;
    return totalEstimateValue / filteredEstimations.length;
  }, [filteredEstimations, totalEstimateValue]);

  // Checkbox handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredEstimations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEstimations.map((est) => est._id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    const targetId = deleteCandidate._id;
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await apiClient.post(API_ENDPOINTS.QUOTATIONS.DELETE_MULTIPLE, {
          ids: [targetId]
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setEstimations((prev) => prev.filter((item) => item._id !== targetId));
      setSelectedIds((prev) => prev.filter((id) => id !== targetId));
      safeToastSuccess(`Estimate ${deleteCandidate.estimateID || ""} deleted successfully`);
    } catch (err) {
      console.error("Delete error:", err);
      safeToastError("Failed to delete estimate from server");
    } finally {
      setDeleteCandidate(null);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await apiClient.post(API_ENDPOINTS.QUOTATIONS.DELETE_MULTIPLE, {
          ids: selectedIds
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setEstimations((prev) => prev.filter((item) => !selectedIds.includes(item._id)));
      safeToastSuccess(`${selectedIds.length} estimates deleted successfully`);
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk delete error:", err);
      safeToastError("Failed to delete selected estimates from server");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport = selectedIds.length > 0
      ? filteredEstimations.filter((est) => selectedIds.includes(est._id))
      : filteredEstimations;

    if (listToExport.length === 0) {
      safeToastError("No estimates to export");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Estimate ID,Customer Name,Customer Phone,Company Name,Total Amount (INR),Created At,Items Count\n";

    listToExport.forEach((est) => {
      const id = est.estimateID || est._id;
      const cust = est.customers?.[0]?.name || "N/A";
      const phone = est.customers?.[0]?.phoneNumber || "N/A";
      const comp = est.company_id?.[0]?.name || est.companyName || "N/A";
      const total = est.total || 0;
      const date = est.createdAt ? new Date(est.createdAt).toISOString() : "";
      const count = est.products?.length || 0;
      csvContent += `"${id}","${cust}","${phone}","${comp}",${total},"${date}",${count}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ReNote_Estimations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
    safeToastSuccess(`Exported ${listToExport.length} estimates to CSV! 📊`);
  };

  // Export XML
  const handleExportXML = () => {
    const listToExport = selectedIds.length > 0
      ? filteredEstimations.filter((est) => selectedIds.includes(est._id))
      : filteredEstimations;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Quotations>\n`;
    listToExport.forEach((est) => {
      xml += `  <Quotation id="${est._id}">\n`;
      xml += `    <EstimateID>${est.estimateID || est._id}</EstimateID>\n`;
      xml += `    <CustomerName>${est.customers?.[0]?.name || ""}</CustomerName>\n`;
      xml += `    <CustomerPhone>${est.customers?.[0]?.phoneNumber || ""}</CustomerPhone>\n`;
      xml += `    <CompanyName>${est.company_id?.[0]?.name || est.companyName || ""}</CompanyName>\n`;
      xml += `    <Total>${est.total || 0}</Total>\n`;
      xml += `    <CreatedAt>${est.createdAt}</CreatedAt>\n`;
      xml += `  </Quotation>\n`;
    });
    xml += `</Quotations>`;

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ReNote_Estimations_${Date.now()}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportDropdownOpen(false);
    safeToastSuccess("Exported XML file successfully! 📄");
  };


  return (
    <div className={`min-h-screen ${themeBg} flex flex-col font-sans selection:bg-[#FF5722] selection:text-white pb-8`}>
      
      {/* ════════════════ 1. TOP HEADER & PERSONALIZATION ════════════════ */}
      <Header />

      {/* ════════════════ 2. ESTIMATION TOOLBAR ════════════════ */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 pb-2">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full">
          
          {/* Left Controls: Search Bar & Company Filter */}
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full sm:w-auto">
              <div className={`h-9 sm:h-10 ${isDarkMode ? "bg-[#1B1E26] border-white/[0.08]" : "bg-gray-50 border-gray-200"} border rounded-xl flex items-center px-3.5 gap-2.5 focus-within:border-[#FF5722] transition-colors`}>
                <Search className="w-[18px] h-[18px] stroke-[2] text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Customer, Estimate ID, or item..."
                  className={`w-full bg-transparent text-xs sm:text-sm outline-none ${isDarkMode ? "placeholder-gray-500 text-white" : "placeholder-gray-400 text-gray-900"} font-normal`}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                    <X className="w-[18px] h-[18px] stroke-[2]" />
                  </button>
                )}
              </div>
            </div>

            {/* All Companies Dropdown */}
            <div className="w-full sm:w-56 shrink-0 relative">
              <div className={`h-9 sm:h-10 ${isDarkMode ? "bg-[#181B26] border-[#2B3044] hover:bg-[#1E2232]" : "bg-gray-50 border-gray-300 hover:bg-gray-100"} border rounded-xl flex items-center px-3 gap-2 focus-within:border-[#FF5722] transition-colors`}>
                <Building className="w-[18px] h-[18px] stroke-[2] text-[#FF5722] shrink-0" />
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className={`w-full bg-transparent text-xs sm:text-sm ${isDarkMode ? "text-gray-200" : "text-gray-800"} outline-none cursor-pointer pr-2 font-semibold`}
                >
                  <option value="All" className={isDarkMode ? "bg-[#16181E] text-white" : "bg-white text-gray-900"}>All Companies</option>
                  {companyOptions.filter((c) => c !== "All").map((comp) => (
                    <option key={comp} value={comp} className={isDarkMode ? "bg-[#16181E] text-white" : "bg-white text-gray-900"}>
                      {comp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Right Controls: Filter Toggle, Export, and + Create New Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap justify-end">
            
            {/* Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                isFilterOpen || favoritesOnly || minPriceFilter || startDateFilter
                  ? isDarkMode
                    ? "bg-[#252A36] text-white border-white/20"
                    : "bg-gray-100 text-gray-900 border-gray-300 shadow-sm"
                  : isDarkMode
                    ? "bg-[#1B1E26] text-gray-300 border-white/[0.08] hover:border-white/20 hover:text-white"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:text-gray-900 shadow-sm"
              }`}
            >
              <Filter className="w-[18px] h-[18px] stroke-[2]" />
              <span>Filter</span>
              {(favoritesOnly || minPriceFilter || startDateFilter) && (
                <span className={`w-2 h-2 rounded-full ${isDarkMode ? "bg-white/80" : "bg-gray-900"}`} />
              )}
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className={`h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border ${
                  isDarkMode
                    ? "bg-[#1B1E26] hover:bg-[#252A36] border-white/[0.08] hover:border-white/20 text-white"
                    : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 shadow-sm"
                } text-xs font-bold flex items-center gap-2 transition-all cursor-pointer`}
              >
                <Download className="w-[18px] h-[18px] stroke-[2] text-[#FF5722]" />
                <span>Export</span>
                <ChevronDown className="w-[18px] h-[18px] stroke-[2] text-gray-400" />
              </button>

              {isExportDropdownOpen && (
                <div className={`absolute right-0 z-30 mt-2 w-48 ${
                  isDarkMode
                    ? "bg-[#16181E] border-white/[0.1] text-gray-200 shadow-2xl"
                    : "bg-white border-gray-200 text-gray-700 shadow-xl"
                } border rounded-2xl p-1.5 backdrop-blur-xl`}>
                  <button
                    onClick={handleExportCSV}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                      isDarkMode
                        ? "text-gray-200 hover:bg-[#1B1E26] hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    } flex items-center gap-2 transition-colors cursor-pointer`}
                  >
                    <FileSpreadsheet className="w-[18px] h-[18px] stroke-[2] text-green-500" />
                    <span>Export to CSV Excel</span>
                  </button>
                  <button
                    onClick={handleExportXML}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                      isDarkMode
                        ? "text-gray-200 hover:bg-[#1B1E26] hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    } flex items-center gap-2 transition-colors cursor-pointer`}
                  >
                    <FileCode className="w-[18px] h-[18px] stroke-[2] text-orange-500" />
                    <span>Export to XML Format</span>
                  </button>
                </div>
              )}
            </div>

            {/* Orange + Create New Action Button */}
            <button
              onClick={() => router.push("/pages/createEstimation")}
              className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#E63900] hover:from-[#FF7043] hover:to-[#FF5722] text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-[0_4px_20px_rgba(255,87,34,0.4)] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-[18px] h-[18px] stroke-[2]" />
              <span>Create New</span>
            </button>

          </div>

        </div>
      </div>

      {/* ════════════════ 3. MAIN DASHBOARD CONTENT & TABLE ════════════════ */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 mt-4 pb-8 flex flex-col gap-6">

        {/* ── Optional Filter Drawer ── */}
        {isFilterOpen && (
          <div className={`p-5 rounded-2xl ${isDarkMode ? "bg-[#16181E] border-white/[0.08]" : "bg-white border-gray-200"} border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl`}>
            <div>
              <label className={`text-[11px] font-bold ${isDarkMode ? "text-gray-400" : "text-gray-600"} uppercase tracking-wider block mb-1.5`}>
                Min Price (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={minPriceFilter}
                onChange={(e) => setMinPriceFilter(e.target.value)}
                className={`w-full h-9 ${isDarkMode ? "bg-[#1B1E26] border-white/[0.08] text-white" : "bg-gray-50 border-gray-200 text-gray-900"} border rounded-xl px-3 text-xs outline-none focus:border-[#FF5722]`}
              />
            </div>

            <div>
              <label className={`text-[11px] font-bold ${isDarkMode ? "text-gray-400" : "text-gray-600"} uppercase tracking-wider block mb-1.5`}>
                Max Price (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 150000"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(e.target.value)}
                className={`w-full h-9 ${isDarkMode ? "bg-[#1B1E26] border-white/[0.08] text-white" : "bg-gray-50 border-gray-200 text-gray-900"} border rounded-xl px-3 text-xs outline-none focus:border-[#FF5722]`}
              />
            </div>

            <div>
              <label className={`text-[11px] font-bold ${isDarkMode ? "text-gray-400" : "text-gray-600"} uppercase tracking-wider block mb-1.5`}>
                Created From Date
              </label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className={`w-full h-9 ${isDarkMode ? "bg-[#1B1E26] border-white/[0.08] text-white" : "bg-gray-50 border-gray-200 text-gray-900"} border rounded-xl px-3 text-xs outline-none focus:border-[#FF5722]`}
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={`flex-1 h-9 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  favoritesOnly
                    ? "bg-[#281611] text-[#FF5722] border-[#FF5722]"
                    : isDarkMode
                      ? "bg-[#1B1E26] text-gray-300 border-white/[0.08]"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                }`}
              >
                <span>⭐ Favorites Only</span>
              </button>

              <button
                onClick={() => {
                  setMinPriceFilter("");
                  setMaxPriceFilter("");
                  setStartDateFilter("");
                  setEndDateFilter("");
                  setFavoritesOnly(false);
                }}
                className={`h-9 px-3 rounded-xl ${
                  isDarkMode
                    ? "bg-[#1B1E26] text-gray-400 hover:text-white border-white/[0.08]"
                    : "bg-gray-100 text-gray-600 hover:text-gray-900 border-gray-200"
                } border text-xs font-semibold cursor-pointer`}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* ════════════════ 3. DATA TABLE & ROW STYLING ════════════════ */}
        <div className={`rounded-2xl ${isDarkMode ? "bg-[#16181E] border-white/[0.08]" : "bg-white border-gray-200"} border overflow-hidden shadow-2xl transition-colors`}>
          
          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              
              {/* Header */}
              <thead>
                <tr className={`border-b ${isDarkMode ? "border-white/[0.08] bg-[#14161E] text-[#94A3B8]" : "border-gray-200 bg-gray-50 text-gray-600"} text-[11px] font-semibold uppercase tracking-wider`}>
                  <th className="py-3.5 px-4 w-12 text-center">
                    <button onClick={handleSelectAll} className={`cursor-pointer ${isDarkMode ? "text-[#94A3B8] hover:text-white" : "text-gray-500 hover:text-gray-900"}`}>
                      {selectedIds.length > 0 && selectedIds.length === filteredEstimations.length ? (
                        <CheckSquare className="w-[18px] h-[18px] text-[#F97316] stroke-[2]" />
                      ) : (
                        <Square className="w-[18px] h-[18px] stroke-[2]" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Estimate ID</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Total Amount (₹)</th>
                  <th className="py-3.5 px-4">Created At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              {/* Body Rows */}
              <tbody className={`divide-y ${isDarkMode ? "divide-white/[0.06]" : "divide-gray-100"} text-xs font-medium`}>
                {loading ? (
                  <tr>
                    <td colSpan={7} className={`py-12 text-center ${isDarkMode ? "text-[#94A3B8]" : "text-gray-500"}`}>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#F97316]" />
                        <span>Loading estimations...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredEstimations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`py-14 text-center ${isDarkMode ? "text-[#94A3B8]" : "text-gray-500"}`}>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Calculator className={`w-8 h-8 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                        <span className={`text-sm font-semibold ${isDarkMode ? "text-[#CBD5E1]" : "text-gray-800"}`}>No estimations found</span>
                        <p className={`text-xs ${isDarkMode ? "text-[#64748B]" : "text-gray-500"}`}>Try adjusting your search filters or click "+ Create New"</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEstimations.map((item) => {
                    const isSelected = selectedIds.includes(item._id);
                    const customerName = item.customers?.[0]?.name || "N/A";
                    const customerPhone = item.customers?.[0]?.phoneNumber || "";
                    const companyName = item.company_id?.[0]?.name || item.companyName || "N/A";
                    const estId = item.estimateID || item._id;
                    const formattedDate = item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "—";

                    return (
                      <tr
                        key={item._id}
                        onClick={() => setPreviewEstimate(item)}
                        className={`group transition-all duration-200 cursor-pointer border-l-2 ${
                          isSelected
                            ? isDarkMode ? "bg-[#251814] border-l-[#F97316]" : "bg-orange-50 border-l-[#F97316]"
                            : isDarkMode
                              ? "hover:bg-[#F97316]/[0.04] hover:shadow-[0_0_15px_rgba(249,115,22,0.08)] border-l-transparent hover:border-l-[#F97316]"
                              : "hover:bg-gray-50/80 border-l-transparent hover:border-l-[#F97316]"
                        }`}
                      >
                        
                        {/* Checkbox */}
                        <td className="py-3.5 px-4 text-center" onClick={(e) => handleToggleSelect(item._id, e)}>
                          <button className={`cursor-pointer ${isDarkMode ? "text-[#94A3B8] group-hover:text-white" : "text-gray-400 group-hover:text-gray-700"}`}>
                            {isSelected ? (
                              <CheckSquare className="w-[18px] h-[18px] text-[#F97316] stroke-[2]" />
                            ) : (
                              <Square className="w-[18px] h-[18px] stroke-[2]" />
                            )}
                          </button>
                        </td>

                        {/* Estimate ID Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-lg ${
                            isDarkMode
                              ? "bg-[#1B1E26] border-white/[0.08] text-[#E2E8F0]"
                              : "bg-gray-100 border-gray-200 text-gray-800"
                          } border font-mono font-medium text-xs tracking-wide group-hover:border-[#F97316]/40 transition-colors`}>
                            #{estId}
                          </span>
                        </td>

                        {/* Customer Name with Status Indicator Dot */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {/* Status Indicator Dot with warm glow */}
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>

                            <div className="flex flex-col min-w-0">
                              <span className={`${isDarkMode ? "text-[#E2E8F0]" : "text-gray-900"} font-semibold text-xs sm:text-[13px] tracking-[0.01em] group-hover:text-[#F97316] transition-colors truncate`}>
                                {customerName}
                              </span>
                              {customerPhone && (
                                <span className={`text-[10px] ${isDarkMode ? "text-[#94A3B8]" : "text-gray-500"} tracking-[0.01em] truncate mt-0.5`}>
                                  {customerPhone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Company Name */}
                        <td className="py-3.5 px-4">
                          <div className={`flex items-center gap-1.5 ${isDarkMode ? "text-[#94A3B8]" : "text-gray-600"} text-xs font-medium tracking-[0.01em] truncate`}>
                            <Building className={`w-[18px] h-[18px] stroke-[2] ${isDarkMode ? "text-[#64748B]" : "text-gray-400"} shrink-0`} />
                            <span className="truncate">{companyName}</span>
                          </div>
                        </td>

                        {/* Total Amount in ₹ */}
                        <td className="py-3.5 px-4">
                          <span className={`text-sm font-semibold ${isDarkMode ? "text-[#E2E8F0]" : "text-gray-900"} font-mono tracking-tight group-hover:text-[#F97316] transition-colors`}>
                            ₹ {Number(item.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Created At Date */}
                        <td className={`py-3.5 px-4 text-xs ${isDarkMode ? "text-[#94A3B8]" : "text-gray-500"} tracking-[0.01em] whitespace-nowrap`}>
                          {formattedDate}
                        </td>

                        {/* Row Action Icons: View, Edit, Delete */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* View Action */}
                            <button
                              onClick={() => {
                                router.push(`/pages/createEstimation?mode=preview&id=${item._id}`);
                              }}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                                isDarkMode
                                  ? "bg-[#1B1E26] hover:bg-[#262C3A] text-gray-300 hover:text-white border-white/[0.06] hover:border-white/20"
                                  : "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300"
                              } border transition-all cursor-pointer`}
                              title="View / Preview Estimate"
                            >
                              <Eye className="w-[18px] h-[18px] stroke-[2]" />
                            </button>

                            {/* Edit Action */}
                            <button
                              onClick={() => {
                                router.push(`/pages/createEstimation?mode=edit&id=${item._id}`);
                              }}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                                isDarkMode
                                  ? "bg-[#1B1E26] hover:bg-[#281611] text-gray-300 hover:text-[#FF5722] border-white/[0.06] hover:border-[#FF5722]/30"
                                  : "bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-[#FF5722] border-gray-200 hover:border-[#FF5722]/30"
                              } border transition-all cursor-pointer`}
                              title="Edit Estimate"
                            >
                              <Pencil className="w-[18px] h-[18px] stroke-[2]" />
                            </button>

                            {/* Delete Action */}
                            <button
                              onClick={() => setDeleteCandidate(item)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                                isDarkMode
                                  ? "bg-[#1B1E26] hover:bg-red-500/10 text-gray-300 hover:text-red-400 border-white/[0.06] hover:border-red-500/30"
                                  : "bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border-gray-200 hover:border-red-300"
                              } border transition-all cursor-pointer`}
                              title="Delete Estimate"
                            >
                              <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                            </button>

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

      </main>

      {/* ════════════════ MODAL 1: PREVIEW ESTIMATION ════════════════ */}
      {previewEstimate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`${isDarkMode ? "bg-[#16181E] border-white/[0.1] text-white" : "bg-white border-gray-200 text-gray-900"} border rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto`}>
            
            {/* Modal Header */}
            <div className={`flex items-start justify-between border-b ${isDarkMode ? "border-white/[0.08]" : "border-gray-200"} pb-4`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-gray-200 overflow-hidden shrink-0 shadow-xs">
                  <img
                    src={getLogoUrl((previewEstimate.company_id?.[0] as any)?.logo || (previewEstimate as any)?.company?.logo)}
                    alt={previewEstimate.company_id?.[0]?.name || previewEstimate.companyName || "KrishTech Computers"}
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes("logo-1779622107439-878996187.webp")) {
                        target.src = "/uploads/companies/default-company/logo-1779622107439-878996187.webp";
                      }
                    }}
                  />
                </div>
                <div>
                  <h2 className={`text-xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Estimate #{previewEstimate.estimateID || previewEstimate._id}
                  </h2>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {previewEstimate.company_id?.[0]?.name || previewEstimate.companyName || "N/A"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewEstimate(null)}
                className={`w-8 h-8 rounded-full ${isDarkMode ? "bg-[#1B1E26] text-gray-400 hover:text-white" : "bg-gray-100 text-gray-500 hover:text-gray-900"} flex items-center justify-center cursor-pointer`}
              >
                <X className="w-[18px] h-[18px] stroke-[2]" />
              </button>
            </div>

            {/* Customer & Valuation Overview */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl ${isDarkMode ? "bg-[#1B1E26] border-white/[0.08]" : "bg-gray-50 border-gray-200"} border`}>
              <div>
                <span className={`text-[10px] font-bold ${isDarkMode ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider block`}>Customer Details</span>
                <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"} block mt-1`}>
                  {previewEstimate.customers?.[0]?.name || "N/A"}
                </span>
                <span className={`text-xs ${isDarkMode ? "text-[#7E8698]" : "text-gray-500"}`}>
                  {previewEstimate.customers?.[0]?.phoneNumber || "—"}
                </span>
              </div>

              <div className="sm:text-right">
                <span className={`text-[10px] font-bold ${isDarkMode ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider block`}>Total Estimated Amount</span>
                <span className="text-2xl font-black text-[#FF5722] font-mono block mt-0.5">
                  ₹ {Number(previewEstimate.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-green-500 font-semibold">18% GST Included</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <span className={`text-xs font-bold ${isDarkMode ? "text-gray-300" : "text-gray-700"} uppercase tracking-wider block mb-2`}>Itemized Estimate Summary</span>
              <div className={`rounded-xl border ${isDarkMode ? "border-white/[0.08] bg-[#1B1E26]" : "border-gray-200 bg-white"} overflow-hidden shadow-2xl`}>
                <table className="w-full text-xs">
                  <thead className={`${isDarkMode ? "bg-[#14161E] text-gray-400 border-white/[0.08]" : "bg-gray-50 text-gray-600 border-gray-200"} border-b`}>
                    <tr>
                      <th className="py-2.5 px-3 text-left">Product / Service</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-white/[0.06]" : "divide-gray-100"}`}>
                    {(previewEstimate.products || []).map((p, idx) => (
                      <tr key={idx}>
                        <td className={`py-2.5 px-3 ${isDarkMode ? "text-white" : "text-gray-900"} font-medium`}>{p.name}</td>
                        <td className={`py-2.5 px-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{p.quantity}</td>
                        <td className={`py-2.5 px-3 text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"} font-mono`}>₹ {Number(p.price).toLocaleString("en-IN")}</td>
                        <td className={`py-2.5 px-3 text-right ${isDarkMode ? "text-white" : "text-gray-900"} font-bold font-mono`}>₹ {(p.quantity * p.price).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  router.push(`/pages/createEstimation?mode=preview&id=${previewEstimate._id}`);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#FF5722] hover:bg-[#F4511E] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                title="Download / Full Preview"
              >
                <Download className="w-[18px] h-[18px] stroke-[2]" />
                <span>Download</span>
              </button>

              <button
                onClick={() => {
                  window.print();
                }}
                className={`flex-1 py-2.5 rounded-xl ${isDarkMode ? "bg-[#1B1E26] hover:bg-[#252A36] text-white border-white/10" : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200"} text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer`}
              >
                <Printer className="w-[18px] h-[18px] stroke-[2] text-[#FF5722]" />
                <span>Print</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  safeToastSuccess("Estimate share link copied to clipboard!");
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#E63900] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Share2 className="w-[18px] h-[18px] stroke-[2]" />
                <span>Share</span>
              </button>
            </div>

          </div>
        </div>
      )}



      {/* ════════════════ MODAL 3: DELETE CONFIRMATION ════════════════ */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${isDarkMode ? "bg-[#16181E] border-red-500/30 text-white" : "bg-white border-red-200 text-gray-900"} border rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center`}>
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-1`}>Delete Estimate?</h3>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-5`}>
              Are you sure you want to delete <span className="font-bold text-[#FF5722]">#{deleteCandidate.estimateID || deleteCandidate._id}</span>? This action cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteCandidate(null)}
                className={`flex-1 py-2.5 rounded-xl ${isDarkMode ? "bg-[#1B1E26] text-gray-300 hover:bg-[#252A36]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} font-bold text-xs cursor-pointer`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}