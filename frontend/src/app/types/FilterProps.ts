export interface Filters {
  minPrice: string;
  maxPrice: string;
  startDate: string;
  endDate: string;
  sortOption: string;
  favoritesOnly: boolean;
  companyId?: string;
  allCompanies?: boolean;
}

export interface FilterPanelProps {
  filters: Filters;
  onApply: (filters: Filters) => void;
  onReset: () => void;
  onClose: () => void;
  isDarkMode?: boolean;
}

export interface PosterFilters {
  favoritesOnly: boolean;
  minPrice: string;
  maxPrice: string;
  sortOption: "newestFirst" | "priceHighToLow" | "priceLowToHigh" | "";
  tags?: string[]; // ✅ Add tags for filtering
}

export interface PosterFilterPanelProps {
  filters: PosterFilters;
  onApply: (filters: PosterFilters) => void;
  onReset: () => void;
  onClose: () => void;
  isDarkMode?: boolean;
}

export interface MarketplaceFilters {
  minPrice: string;
  maxPrice: string;
  category: string;
  city: string;
  sortOption: string;
  favoritesOnly: boolean;
  verifiedOnly: boolean;
}

export interface MarketplaceFilterPanelProps {
  filters: MarketplaceFilters;
  onApply: (filters: MarketplaceFilters) => void;
  onReset: () => void;
  onClose: () => void;
  isDarkMode?: boolean;
  categories?: string[];
  cities?: string[];
}
