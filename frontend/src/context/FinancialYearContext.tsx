"use client";
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

export interface FinancialYearOption {
  label: string; // e.g. "FY 2026-27"
  value: string; // e.g. "2026-2027"
  startYear: number;
  endYear: number;
  startDate: Date;
  endDate: Date;
}

interface FinancialYearContextType {
  selectedFY: string;
  setSelectedFY: (fy: string) => void;
  fyOptions: FinancialYearOption[];
  currentFYLabel: string;
  currentOption: FinancialYearOption | null;
  isDateInSelectedFY: (date: Date | string | number | null | undefined) => boolean;
  filterByFY: <T>(items: T[], dateField?: keyof T | string) => T[];
}

const FinancialYearContext = createContext<FinancialYearContextType | undefined>(undefined);

export function getFinancialYearOptions(yearsCount = 3): FinancialYearOption[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 = Jan, 3 = April

  // Indian FY starts in April (Month 3)
  const baseStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  const options: FinancialYearOption[] = [];

  for (let i = 0; i < yearsCount; i++) {
    const startYear = baseStartYear - i;
    const endYear = startYear + 1;
    const endYearShort = String(endYear).slice(-2);
    const label = `FY ${startYear}-${endYearShort}`;
    const value = `${startYear}-${endYear}`;

    // April 1, startYear 00:00:00.000
    const startDate = new Date(startYear, 3, 1, 0, 0, 0, 0);
    // March 31, endYear 23:59:59.999
    const endDate = new Date(endYear, 2, 31, 23, 59, 59, 999);

    options.push({
      label,
      value,
      startYear,
      endYear,
      startDate,
      endDate,
    });
  }

  return options;
}

const STORAGE_KEY = "selected_financial_year";

export const FinancialYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const fyOptions = useMemo(() => getFinancialYearOptions(3), []);
  const defaultFY = fyOptions[0]?.value || "2026-2027";

  const [selectedFY, setSelectedFYState] = useState<string>(defaultFY);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSelectedFYState(saved);
    }
  }, []);

  const setSelectedFY = useCallback((fy: string) => {
    setSelectedFYState(fy);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, fy);
    }
  }, []);

  const currentOption = useMemo(() => {
    return fyOptions.find((opt) => opt.value === selectedFY) || null;
  }, [fyOptions, selectedFY]);

  const currentFYLabel = useMemo(() => {
    if (selectedFY === "ALL") return "All FY";
    return currentOption ? currentOption.label : `FY ${selectedFY}`;
  }, [currentOption, selectedFY]);

  const isDateInSelectedFY = useCallback((dateVal: Date | string | number | null | undefined): boolean => {
    if (selectedFY === "ALL") return true;
    if (!dateVal) return true;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return true;
    if (!currentOption) return true;

    return d >= currentOption.startDate && d <= currentOption.endDate;
  }, [selectedFY, currentOption]);

  const filterByFY = useCallback(<T,>(items: T[], dateField: keyof T | string = "createdAt"): T[] => {
    if (selectedFY === "ALL" || !items || !Array.isArray(items)) return items || [];
    return items.filter((item) => {
      const record = item as Record<string, unknown>;
      const val = (record?.[dateField as string] || record?.createdAt || record?.date || record?.created_at || record?.updatedAt) as Date | string | number | null | undefined;
      return isDateInSelectedFY(val);
    });
  }, [selectedFY, isDateInSelectedFY]);

  const contextValue = useMemo<FinancialYearContextType>(
    () => ({
      selectedFY,
      setSelectedFY,
      fyOptions,
      currentFYLabel,
      currentOption,
      isDateInSelectedFY,
      filterByFY,
    }),
    [
      selectedFY,
      setSelectedFY,
      fyOptions,
      currentFYLabel,
      currentOption,
      isDateInSelectedFY,
      filterByFY,
    ]
  );

  return (
    <FinancialYearContext.Provider value={contextValue}>
      {children}
    </FinancialYearContext.Provider>
  );
};

export const useFinancialYear = () => {
  const context = useContext(FinancialYearContext);
  if (!context) {
    const fyOptions = getFinancialYearOptions(3);
    const defaultFY = fyOptions[0]?.value || "2026-2027";
    const currentOption = fyOptions[0] || null;
    return {
      selectedFY: defaultFY,
      setSelectedFY: () => {},
      fyOptions,
      currentFYLabel: currentOption?.label || "FY 2026-27",
      currentOption,
      isDateInSelectedFY: () => true,
      filterByFY: <T,>(items: T[]) => items || [],
    };
  }
  return context;
};
