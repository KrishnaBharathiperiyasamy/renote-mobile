import React, { useState, useEffect, useRef } from "react";
import { PosterFilters, PosterFilterPanelProps } from "@app-types/FilterProps";
import { API_ENDPOINTS } from "@constants/api";
import { safeToastError } from "@utilis/toastHelper";
import { Heart, X, Plus, Check } from "lucide-react";

const PosterFilterPanel: React.FC<PosterFilterPanelProps> = ({
    filters,
    onApply,
    onReset,
    onClose,
    isDarkMode = true,
}) => {
    const [localFilters, setLocalFilters] = useState<PosterFilters>(filters);
    const [newTag, setNewTag] = useState<string>("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const tagDropdownRef = useRef<HTMLDivElement>(null);

    const newTagLimit = 5;

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const userId = localStorage.getItem("user_id");
                if (!userId) return;
                const response = await fetch(API_ENDPOINTS.POSTERS.TAGS(userId));
                const text = await response.text();
                const parsed = text
                    .replace(/[{}"]/g, "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                setSuggestions(parsed);
            } catch (err) {
                console.error("Error fetching tags", err);
            }
        };
        fetchTags();
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleChange = (key: keyof PosterFilters, value: any) => {
        setLocalFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleAddTag = (tagToAdd?: string) => {
        const trimmed = (tagToAdd || newTag).trim();
        if (!trimmed) return;

        const existingTags = localFilters.tags || [];
        if (existingTags.includes(trimmed)) {
            safeToastError("Tag already added!");
            return;
        }

        if (existingTags.length >= newTagLimit) {
            safeToastError(`Only ${newTagLimit} tags can be added.`);
            return;
        }

        handleChange("tags", [...existingTags, trimmed]);
        setNewTag("");
        setShowSuggestions(false);
    };

    const handleRemoveTag = (tag: string) => {
        const updatedTags = (localFilters.tags || []).filter((t) => t !== tag);
        handleChange("tags", updatedTags);
    };

    const filteredSuggestions = suggestions.filter((tag) =>
        tag.toLowerCase().includes(newTag.toLowerCase())
    );

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleReset = () => {
        const resetValues: PosterFilters = {
            favoritesOnly: false,
            minPrice: "",
            maxPrice: "",
            sortOption: "",
            tags: [],
        };
        setLocalFilters(resetValues);
        onReset();
    };

    // Calculate active filter count for badge
    const activeCount = [
        Boolean(localFilters.favoritesOnly),
        Boolean(localFilters.minPrice || localFilters.maxPrice),
        Boolean(localFilters.sortOption),
        Boolean(localFilters.tags && localFilters.tags.length > 0),
    ].filter(Boolean).length;

    const sortOptions: { label: string; value: PosterFilters["sortOption"] }[] = [
        { label: "Newest First", value: "newestFirst" },
        { label: "Price: High to Low", value: "priceHighToLow" },
        { label: "Price: Low to High", value: "priceLowToHigh" },
    ];

    return (
        <div
            className={`w-[330px] sm:w-[350px] max-w-[calc(100vw-24px)] rounded-2xl border shadow-2xl transition-all duration-150 select-none ${
                isDarkMode
                    ? "bg-[#141414] border-[#262626] text-white shadow-black/80"
                    : "bg-white border-gray-200 text-gray-900 shadow-xl"
            }`}
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between px-4 py-3 border-b ${
                    isDarkMode ? "border-[#262626]" : "border-gray-100"
                }`}
            >
                <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        Filter Posters
                    </h3>
                    {activeCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5722]/15 text-[#FF5722] border border-[#FF5722]/30">
                            {activeCount} active
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className={`p-1.5 rounded-lg transition text-gray-400 hover:text-white cursor-pointer ${
                        isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-100 hover:text-gray-700"
                    }`}
                    title="Close filters"
                >
                    <X className="w-[18px] h-[18px] stroke-[2]" />
                </button>
            </div>

            {/* Scrollable Filter Content */}
            <div className="p-4 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
                {/* 1. Show Favorites Only */}
                <div>
                    <label
                        htmlFor="filter-favorites-only"
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition select-none ${
                            localFilters.favoritesOnly
                                ? isDarkMode
                                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                    : "bg-rose-50 border-rose-200 text-rose-700"
                                : isDarkMode
                                    ? "bg-[#191919] border-[#262626] hover:bg-[#202020] text-gray-300"
                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Heart
                                className={`w-[18px] h-[18px] stroke-[2] ${
                                    localFilters.favoritesOnly
                                        ? "text-rose-500 fill-rose-500"
                                        : "text-gray-400"
                                }`}
                            />
                            <span className="text-xs font-semibold">Show Favorites Only</span>
                        </div>
                        <input
                            type="checkbox"
                            id="filter-favorites-only"
                            checked={localFilters.favoritesOnly}
                            onChange={(e) => handleChange("favoritesOnly", e.target.checked)}
                            className="w-4 h-4 accent-[#FF5722] cursor-pointer rounded"
                        />
                    </label>
                </div>

                {/* 2. Price Range */}
                <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Price Range
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-semibold pointer-events-none">
                                ₹
                            </span>
                            <input
                                type="number"
                                placeholder="Min"
                                value={localFilters.minPrice}
                                onChange={(e) => handleChange("minPrice", e.target.value)}
                                className={`w-full h-8 pl-6 pr-2.5 rounded-lg border text-xs outline-none transition ${
                                    isDarkMode
                                        ? "bg-[#191919] border-[#2A2A2A] text-white placeholder-gray-500 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                                }`}
                            />
                        </div>
                        <span className="text-xs text-gray-500 select-none">—</span>
                        <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-semibold pointer-events-none">
                                ₹
                            </span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={localFilters.maxPrice}
                                onChange={(e) => handleChange("maxPrice", e.target.value)}
                                className={`w-full h-8 pl-6 pr-2.5 rounded-lg border text-xs outline-none transition ${
                                    isDarkMode
                                        ? "bg-[#191919] border-[#2A2A2A] text-white placeholder-gray-500 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                                }`}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Sort By */}
                <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Sort By
                    </span>
                    <div className="space-y-1">
                        {sortOptions.map((opt) => {
                            const isSelected = localFilters.sortOption === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleChange("sortOption", isSelected ? "" : opt.value)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition select-none border ${
                                        isSelected
                                            ? isDarkMode
                                                ? "bg-[#FF5722]/10 border-[#FF5722]/30 text-[#FF5722] font-semibold"
                                                : "bg-orange-50 border-orange-200 text-[#FF5722] font-semibold"
                                            : isDarkMode
                                                ? "bg-transparent border-transparent text-gray-300 hover:bg-[#1A1A1A]"
                                                : "bg-transparent border-transparent text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                    <div
                                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                                            isSelected
                                                ? "border-[#FF5722] bg-[#FF5722]"
                                                : isDarkMode
                                                    ? "border-[#3A3A3A] bg-[#1A1A1A]"
                                                    : "border-gray-300 bg-white"
                                        }`}
                                    >
                                        {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Filter by Tags */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Filter by Tags
                        </span>
                        <span className="text-[10px] text-gray-500">
                            {(localFilters.tags || []).length}/{newTagLimit}
                        </span>
                    </div>

                    {/* Tag Chips above the input */}
                    {(localFilters.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {(localFilters.tags || []).map((tag) => (
                                <span
                                    key={tag}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                                        isDarkMode
                                            ? "bg-[#202020] border-[#333333] text-gray-200"
                                            : "bg-gray-100 border-gray-200 text-gray-700"
                                    }`}
                                >
                                    <span>{tag}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="text-gray-400 hover:text-red-400 transition ml-0.5"
                                        title={`Remove tag ${tag}`}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Tag Input & Add Button */}
                    <div className="relative" ref={tagDropdownRef}>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="text"
                                value={newTag}
                                placeholder="Add a tag..."
                                onFocus={() => setShowSuggestions(true)}
                                onChange={(e) => {
                                    setNewTag(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                                className={`flex-1 h-8 px-3 rounded-lg border text-xs outline-none transition ${
                                    isDarkMode
                                        ? "bg-[#191919] border-[#2A2A2A] text-white placeholder-gray-500 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => handleAddTag()}
                                className="h-8 px-3 rounded-lg bg-[#FF5722] hover:bg-[#FF7043] text-white text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                            >
                                <Plus className="w-[18px] h-[18px] stroke-[2]" />
                                <span>Add</span>
                            </button>
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && filteredSuggestions.length > 0 && (
                            <div
                                className={`absolute left-0 right-0 mt-1.5 rounded-xl border shadow-xl max-h-36 overflow-y-auto z-50 py-1 text-xs ${
                                    isDarkMode
                                        ? "bg-[#1C1C1C] border-[#2E2E2E] text-gray-200"
                                        : "bg-white border-gray-200 text-gray-800"
                                }`}
                            >
                                {filteredSuggestions.map((s, idx) => {
                                    const isSelected = (localFilters.tags || []).includes(s);
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    handleRemoveTag(s);
                                                } else {
                                                    handleAddTag(s);
                                                }
                                            }}
                                            className={`w-full text-left px-3 py-1.5 flex items-center justify-between cursor-pointer transition ${
                                                isSelected
                                                    ? "text-[#FF5722] font-semibold bg-[#FF5722]/10"
                                                    : isDarkMode
                                                        ? "hover:bg-[#252525] text-gray-300"
                                                        : "hover:bg-gray-50 text-gray-700"
                                            }`}
                                        >
                                            <span>{s}</span>
                                            {isSelected && <Check className="w-[18px] h-[18px] stroke-[2] text-[#FF5722]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer / Actions */}
            <div
                className={`flex items-center justify-between px-4 py-3 border-t ${
                    isDarkMode ? "border-[#262626] bg-[#161616]" : "border-gray-100 bg-gray-50/70"
                } rounded-b-2xl`}
            >
                <button
                    type="button"
                    onClick={handleReset}
                    className={`h-8 px-3.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        isDarkMode
                            ? "bg-[#1F1F1F] hover:bg-[#262626] text-gray-300 hover:text-white border-[#2E2E2E]"
                            : "bg-white hover:bg-gray-100 text-gray-700 border-gray-200 shadow-xs"
                    }`}
                >
                    Reset
                </button>
                <button
                    type="button"
                    onClick={handleApply}
                    className="h-8 px-5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#FF5722] to-[#E63900] hover:from-[#FF7043] hover:to-[#FF5722] shadow-[0_2px_10px_rgba(255,87,34,0.35)] transition cursor-pointer active:scale-95"
                >
                    Apply
                </button>
            </div>
        </div>
    );
};

export default PosterFilterPanel;
