export type Poster = {
    _id: string;
    posterId?: string;
    poster_name: string;
    product_name: string;
    product_description: string;
    product_image_id?: string | null;
    company_logo_id?: string | null;
    product_price: number;
    company_logo: string;
    product_image: string;
    createdAt: string;
    updatedAt?: string;
    isHeart?: boolean; // ✅ add this
    tags?: string[];   // ✅ add tags
    company_id?: string;
    marketplaceCategory?: string;
    marketplaceSubcategory?: string;
    shareableLinkToken?: string;
    shareableLinkId?: string;
    isPublishedToMarketplace?: boolean;
    poster_title?: string;
};

export interface PosterFilters {
    favoritesOnly: boolean;
    minPrice: string;
    maxPrice: string;
    sortOption: "newestFirst" | "priceHighToLow" | "priceLowToHigh" | "";
    tags?: string[];   // ✅ add tags for filtering
}
