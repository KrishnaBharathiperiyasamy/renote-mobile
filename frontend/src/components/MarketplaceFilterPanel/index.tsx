'use client';

import React, { useState, useEffect } from "react";
import {
  Filter,
  X,
  RotateCcw,
  Tag,
  MapPin,
  IndianRupee,
  ChevronDown,
  Check
} from "lucide-react";
import { MarketplaceFilters, MarketplaceFilterPanelProps } from "@app-types/FilterProps";
export type { MarketplaceFilters, MarketplaceFilterPanelProps };

export const DEFAULT_MARKETPLACE_FILTERS: MarketplaceFilters = {
  minPrice: "",
  maxPrice: "",
  category: "All",
  city: "All",
  sortOption: "Newest First",
  favoritesOnly: false,
  verifiedOnly: false,
};

export const DEFAULT_CATEGORIES = [
  "All",
  "Electronics",
  "Laptops & Computers",
  "Smartphones & Mobiles",
  "Cameras & Optics",
  "Audio & Headphones",
  "Home & Living",
  "Fashion",
  "Vehicles",
  "Books & Education",
  "Sports & Hobbies",
  "Services",
  "Others"
];

export const DEFAULT_CITIES = [
  "All",
  "Coimbatore",
  "RS Puram",
  "Gandhipuram",
  "Peelamedu",
  "Chennai",
  "Bangalore",
  "Mumbai",
  "Delhi"
];

const MarketplaceFilterPanel: React.FC<MarketplaceFilterPanelProps> = ({
  filters,
  onApply,
  onReset,
  onClose,
  isDarkMode = true,
  categories = DEFAULT_CATEGORIES,
  cities = DEFAULT_CITIES,
}) => {
  const [localFilters, setLocalFilters] = useState<MarketplaceFilters>(() => ({
    ...DEFAULT_MARKETPLACE_FILTERS,
    ...filters,
  }));

  useEffect(() => {
    setLocalFilters({
      ...DEFAULT_MARKETPLACE_FILTERS,
      ...filters,
    });
  }, [filters]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleChange = <K extends keyof MarketplaceFilters>(
    key: K,
    value: MarketplaceFilters[K]
  ) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePriceChange = (key: "minPrice" | "maxPrice", value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") {
      handleChange(key, "");
      return;
    }
    const num = Number(trimmed);
    if (!isNaN(num) && num >= 0) {
      handleChange(key, trimmed);
    }
  };

  // Price validation logic
  const minVal = localFilters.minPrice ? String(localFilters.minPrice).trim() : "";
  const maxVal = localFilters.maxPrice ? String(localFilters.maxPrice).trim() : "";
  const minNum = minVal !== "" ? Number(minVal) : null;
  const maxNum = maxVal !== "" ? Number(maxVal) : null;

  const isPriceRangeInvalid = Boolean(
    minNum !== null &&
    maxNum !== null &&
    !isNaN(minNum) &&
    !isNaN(maxNum) &&
    minNum > maxNum
  );

  const handleApply = () => {
    if (isPriceRangeInvalid) return;
    onApply(localFilters);
  };

  const handleReset = () => {
    setLocalFilters(DEFAULT_MARKETPLACE_FILTERS);
    onReset();
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter" && !isPriceRangeInvalid) {
      e.preventDefault();
      handleApply();
    }
  };

  // Build robust, deduplicated category options with "All" guaranteed at index 0
  const baseCategories = [
    "All",
    ...categories.filter(
      (cat, idx, arr) =>
        cat &&
        cat.trim().toLowerCase() !== "all" &&
        arr.findIndex((c) => c.toLowerCase() === cat.toLowerCase()) === idx
    ),
  ];

  const activeCategory = (localFilters.category || "All").trim();
  const matchedCategory =
    baseCategories.find((c) => c.toLowerCase() === activeCategory.toLowerCase()) || activeCategory;

  const categoryOptions =
    matchedCategory && !baseCategories.includes(matchedCategory)
      ? [...baseCategories, matchedCategory]
      : baseCategories;

  // Build robust, deduplicated city options with "All" guaranteed at index 0
  const baseCities = [
    "All",
    ...cities.filter(
      (ct, idx, arr) =>
        ct &&
        ct.trim().toLowerCase() !== "all" &&
        arr.findIndex((c) => c.toLowerCase() === ct.toLowerCase()) === idx
    ),
  ];

  const activeCity = (localFilters.city || "All").trim();
  const matchedCity =
    baseCities.find((c) => c.toLowerCase() === activeCity.toLowerCase()) || activeCity;

  const cityOptions =
    matchedCity && !baseCities.includes(matchedCity)
      ? [...baseCities, matchedCity]
      : baseCities;

  // Active count strictly for the 3 panel filters: Category, Location, Price Range
  const hasActiveCategory = Boolean(matchedCategory && matchedCategory.toLowerCase() !== "all");
  const hasActiveCity = Boolean(matchedCity && matchedCity.toLowerCase() !== "all");
  const hasActivePrice = Boolean(
    (minVal !== "" && !isNaN(Number(minVal))) ||
    (maxVal !== "" && !isNaN(Number(maxVal)))
  );

  const activeCount = [hasActiveCategory, hasActiveCity, hasActivePrice].filter(Boolean).length;

  return (
    <div
      role="region"
      aria-label="Marketplace Filters"
      className={`w-[290px] sm:w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl flex flex-col overflow-hidden text-xs transition-all ${
        isDarkMode
          ? "bg-[#13151F] border-[#262B3A] text-[#E0E2EC] shadow-[0_12px_45px_rgba(0,0,0,0.7)]"
          : "bg-white border-gray-200 text-gray-800 shadow-2xl"
      }`}
    >
      {/* ── Header ── */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? "border-[#222736] bg-[#161824]" : "border-gray-100 bg-gray-50/80"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FF5722]/15 border border-[#FF5722]/30 flex items-center justify-center text-[#FF5722]">
            <Filter className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-gray-900"} tracking-tight`}>
                Filters
              </h3>
              {activeCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#FF5722] text-white text-[10px] font-black leading-tight">
                  {activeCount}
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 block -mt-0.5">Refine marketplace search</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDarkMode
              ? "text-gray-400 hover:text-white hover:bg-white/10"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          }`}
          aria-label="Close filters"
          title="Close filters"
        >
          <X className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      {/* ── Scrollable Body: Exactly 3 Essential Filters ── */}
      <div className="p-4 space-y-4 max-h-[calc(75vh-100px)] overflow-y-auto custom-scrollbar">

        {/* 1. Category */}
        <div>
          <label
            htmlFor="marketplace-category-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-[#FF5722]" />
            Category
          </label>
          <div className="relative">
            <select
              id="marketplace-category-select"
              value={matchedCategory}
              onChange={(e) => handleChange("category", e.target.value)}
              className={`w-full h-9 pl-3 pr-8 rounded-xl border text-xs appearance-none outline-none cursor-pointer transition-colors ${
                isDarkMode
                  ? "bg-[#1A1C28] border-[#262B3A] text-white focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                  : "bg-gray-50 border-gray-200 text-gray-900 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
              }`}
            >
              {categoryOptions.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  className={isDarkMode ? "bg-[#161824] text-white" : "bg-white text-gray-900"}
                >
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* 2. Location */}
        <div>
          <label
            htmlFor="marketplace-location-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-[#FF5722]" />
            Location
          </label>
          <div className="relative">
            <select
              id="marketplace-location-select"
              value={matchedCity}
              onChange={(e) => handleChange("city", e.target.value)}
              className={`w-full h-9 pl-3 pr-8 rounded-xl border text-xs appearance-none outline-none cursor-pointer transition-colors ${
                isDarkMode
                  ? "bg-[#1A1C28] border-[#262B3A] text-white focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                  : "bg-gray-50 border-gray-200 text-gray-900 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
              }`}
            >
              {cityOptions.map((ct) => (
                <option
                  key={ct}
                  value={ct}
                  className={isDarkMode ? "bg-[#161824] text-white" : "bg-white text-gray-900"}
                >
                  {ct === "All" ? "All Locations" : ct}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* 3. Price Range (₹) */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-[#FF5722]" />
            Price Range (₹)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                ₹
              </span>
              <input
                id="marketplace-min-price"
                type="number"
                step="any"
                min="0"
                placeholder="Min"
                aria-label="Minimum price"
                value={localFilters.minPrice ?? ""}
                onChange={(e) => handlePriceChange("minPrice", e.target.value)}
                onKeyDown={handlePriceKeyDown}
                className={`w-full h-9 pl-7 pr-2 rounded-xl border text-xs outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  isPriceRangeInvalid
                    ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : isDarkMode
                    ? "bg-[#1A1C28] border-[#262B3A] text-white placeholder-gray-500 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                }`}
              />
            </div>
            <span className="text-gray-400 font-medium select-none text-xs">to</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                ₹
              </span>
              <input
                id="marketplace-max-price"
                type="number"
                step="any"
                min="0"
                placeholder="Max"
                aria-label="Maximum price"
                value={localFilters.maxPrice ?? ""}
                onChange={(e) => handlePriceChange("maxPrice", e.target.value)}
                onKeyDown={handlePriceKeyDown}
                className={`w-full h-9 pl-7 pr-2 rounded-xl border text-xs outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  isPriceRangeInvalid
                    ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : isDarkMode
                    ? "bg-[#1A1C28] border-[#262B3A] text-white placeholder-gray-500 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                }`}
              />
            </div>
          </div>
          {isPriceRangeInvalid && (
            <p className="text-[10px] text-red-500 font-medium mt-1.5 flex items-center gap-1">
              <span>•</span> Min price cannot exceed max price
            </p>
          )}
        </div>

      </div>

      {/* ── Footer Actions ── */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-t ${
          isDarkMode ? "border-[#222736] bg-[#161824]" : "border-gray-100 bg-gray-50/80"
        }`}
      >
        <button
          type="button"
          onClick={handleReset}
          className={`h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDarkMode
              ? "bg-[#1A1C28] border-[#262B3A] text-gray-400 hover:text-white hover:border-[#383E54] active:scale-95"
              : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 shadow-sm active:scale-95"
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>

        <button
          type="button"
          disabled={isPriceRangeInvalid}
          onClick={handleApply}
          className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            isPriceRangeInvalid
              ? isDarkMode
                ? "bg-[#222636] text-gray-500 border border-[#2E344A] cursor-not-allowed opacity-60"
                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
              : "bg-gradient-to-r from-[#FF5722] to-[#E63900] hover:from-[#FF7043] hover:to-[#FF5722] text-white shadow-[0_2px_10px_rgba(255,87,34,0.35)] cursor-pointer active:scale-95"
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Apply Filters</span>
        </button>
      </div>
    </div>
  );
};

export default MarketplaceFilterPanel;
