import React, { useState, useEffect } from "react";
import { Filters,FilterPanelProps } from "@app-types/FilterProps";

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onApply,
  onReset,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  // Sync when parent filters change (e.g. reopening modal)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key: keyof Filters, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetValues: Filters = {
      minPrice: "",
      maxPrice: "",
      startDate: "",
      endDate: "",
      sortOption: "",
      favoritesOnly: false,
    };
    setLocalFilters(resetValues);
    onReset();
  };

  const generateFinancialYears = () => {
    const years: { label: string; startDate: string; endDate: string }[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // Jan=1

    const startFY = 2025; // first FY

    for (let y = startFY; y <= currentYear; y++) {
      // FY starts in April
      const fyStartYear = y;
      const fyEndYear = y + 1;
      // include FY only if FY start year <= current year
      if (fyStartYear <= currentYear) {
        years.push({
          label: `Apr ${fyStartYear} - Mar ${fyEndYear}`,
          startDate: `${fyStartYear}-04-01`,
          endDate: `${fyEndYear}-03-31`,
        });
      }
    }

    return years.reverse(); // latest FY on top
  };

  const financialYears = generateFinancialYears();


  return (
    <div>
      <button
        onClick={onClose}
        className="absolute top-0 right-0 mt-2 mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition text-lg font-bold cursor-pointer"
        title="Close"
      >
        ✕
      </button>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Filter</h3>
      <div className="mt-4">
        {/* Favorites filter */}
        <div className="mb-6">
          <input
            type="checkbox"
            id="favorites-only"
            checked={localFilters.favoritesOnly}
            onChange={(e) => handleChange("favoritesOnly", e.target.checked)}
            className="mr-2 accent-[#FF5722] cursor-pointer"
          />
          <label htmlFor="favorites-only" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            Show Favorites Only
          </label>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">Price Range</label>
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Min"
              value={localFilters.minPrice}
              onChange={(e) => handleChange("minPrice", e.target.value)}
              className="border border-gray-300 dark:border-white/[0.12] rounded-lg px-4 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] hover:border-[#FF5722]/50 bg-white dark:bg-[#1B1E26] text-gray-800 dark:text-gray-100 transition-all"
            />
            <input
              type="number"
              placeholder="Max"
              value={localFilters.maxPrice}
              onChange={(e) => handleChange("maxPrice", e.target.value)}
              className="border border-gray-300 dark:border-white/[0.12] rounded-lg px-4 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] hover:border-[#FF5722]/50 bg-white dark:bg-[#1B1E26] text-gray-800 dark:text-gray-100 transition-all"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="mb-6 flex gap-4">
          <div className="w-1/2">
            <label className="block text-sm text-gray-500 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={localFilters.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="border border-gray-300 dark:border-white/[0.12] rounded-lg px-4 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] hover:border-[#FF5722]/50 bg-white dark:bg-[#1B1E26] text-gray-800 dark:text-gray-100 transition-all"
            />
          </div>
          <div className="w-1/2">
            <label className="block text-sm text-gray-500 mb-2">End Date</label>
            <input
              type="date"
              value={localFilters.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              className="border border-gray-300 dark:border-white/[0.12] rounded-lg px-4 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] hover:border-[#FF5722]/50 bg-white dark:bg-[#1B1E26] text-gray-800 dark:text-gray-100 transition-all"
            />
          </div>
        </div>

        {/* Financial Year Dropdown */}
        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">
            Financial Year
          </label>
          <select
            value={`${localFilters.startDate}_${localFilters.endDate}`}
            onChange={(e) => {
              const selected = financialYears.find(
                (fy) => `${fy.startDate}_${fy.endDate}` === e.target.value
              );
              if (selected) {
                handleChange("startDate", selected.startDate);
                handleChange("endDate", selected.endDate);
              }
            }}
            className="border border-gray-300 dark:border-white/[0.12] rounded-lg px-4 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] hover:border-[#FF5722]/50 bg-white dark:bg-[#1B1E26] text-gray-800 dark:text-gray-100 transition-all cursor-pointer"
          >
            <option value="">Select Financial Year</option>
            {financialYears.map((fy) => (
              <option
                key={fy.label}
                value={`${fy.startDate}_${fy.endDate}`}
              >
                {fy.label}
              </option>
            ))}
          </select>

        </div>

        {/* Sort Options */}
        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">Sort by</label>

          <div className="flex items-center mb-1.5">
            <input
              type="radio"
              id="low-to-high"
              name="sort"
              value="priceLowToHigh"
              checked={localFilters.sortOption === "priceLowToHigh"}
              onChange={(e) => handleChange("sortOption", e.target.value)}
              className="mr-2 accent-[#FF5722] cursor-pointer"
            />
            <label htmlFor="low-to-high" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              Price: Low to High
            </label>
          </div>

          <div className="flex items-center mb-1.5">
            <input
              type="radio"
              id="high-to-low"
              name="sort"
              value="priceHighToLow"
              checked={localFilters.sortOption === "priceHighToLow"}
              onChange={(e) => handleChange("sortOption", e.target.value)}
              className="mr-2 accent-[#FF5722] cursor-pointer"
            />
            <label htmlFor="high-to-low" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              Price: High to Low
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="radio"
              id="newest-first"
              name="sort"
              value="newestFirst"
              checked={localFilters.sortOption === "newestFirst"}
              onChange={(e) => handleChange("sortOption", e.target.value)}
              className="mr-2 accent-[#FF5722] cursor-pointer"
            />
            <label htmlFor="newest-first" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              Newest First
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            className="px-4 py-2 border border-gray-300 dark:border-white/[0.12] rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            onClick={handleReset}
          >
            Reset All
          </button>
          <button
            className="px-5 py-2 bg-gradient-to-r from-[#FF5722] to-[#FF6B00] hover:from-[#FF7043] hover:to-[#FF5722] text-white rounded-xl text-sm font-semibold shadow-[0_4px_14px_rgba(255,87,34,0.35)] hover:shadow-[0_6px_20px_rgba(255,87,34,0.45)] active:scale-95 transition-all cursor-pointer"
            onClick={handleApply}
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
