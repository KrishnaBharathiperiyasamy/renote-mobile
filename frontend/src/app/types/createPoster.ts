import { PosterTheme } from "@constants/posterThemes";
import { AspectRatioKey } from "@constants/posterAspectRatios";

export type Poster = {
    _id: string;
    posterId: string;
    poster_name?: string;
    poster_title?: string;
    product_name?: string;
    product_image_id?: string | null;
    product_description?: string;
    product_price?: string | number;
    company_logo_id?: string | null;
    product_image?: string;
    product_gallery_images?: string[];
    product_gallery_zoom?: number[];
    product_gallery_positions?: { x: number; y: number }[];
    company_logo: string | null;
    logo_zoom?: number;
    product_zoom?: number;
    createdAt?: string;
    updatedAt?: string;
    favorites?: string[];
    tags?: string[]; 
    logo_position?: { x: number; y: number };
    product_position?: { x: number; y: number };
    aspect_ratio?: AspectRatioKey;
    template?: "frame0" | "frame1" | "frame2" | "frame3" | "frame4" | "frame5" | "frame6" | "frame7" | "frame8" | "frame9" | "frame10"
        | "frame11" | "frame12" | "frame13" | "frame14" | "frame15" | "frame16" | "frame17" | "frame18" | "frame19" | "frame20"
        | "frame21" | "frame22" | "frame23" | "frame24" | "frame25" | "frame26" | "frame27" | "frame28" | "frame29" | "frame30"
        | "frame31" | "frame32" | "frame33" | "frame34" | "frame35" | "frame36" | "frame37" | "frame38" | "frame39" | "frame40"
        | "frame41" | "frame42" | "frame43" | "frame44" | "frame45" | "frame46" | "frame47" | "frame48" | "frame49" | "frame50";
    theme?: PosterTheme;
    custom_colors?: string;
    company_id?: string;
    marketplaceCategory?: string;
};