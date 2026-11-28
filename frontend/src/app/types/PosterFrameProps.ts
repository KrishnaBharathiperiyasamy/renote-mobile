import type React from "react";
import { PosterTheme, PosterThemeDef } from "@constants/posterThemes";
import { AspectRatioKey } from "@constants/posterAspectRatios";

export type Position = { x: number; y: number };

export interface PosterFrameProps {
    editMode: boolean;
    activeEditor: string | null;
    toolbarRef: React.RefObject<HTMLDivElement | null>;
    frameRef: React.RefObject<HTMLDivElement | null>;
    textContainerRef: React.RefObject<HTMLDivElement | null>;
    editorRef: React.RefObject<HTMLDivElement | null>;

    tempTitle: string;
    setTempTitle: (value: string) => void;
    tempProductName: string;
    handleProductNameChange: React.ChangeEventHandler<HTMLInputElement>;
    productSpecs: string;
    setProductSpecs: (value: string) => void;
    setActiveEditor: (value: string | null) => void;
    tempPrice: string;
    setTempPrice: (value: string) => void;

    logoImage: string | null;
    tempLogo: string | null;
    handleLogoChange: React.ChangeEventHandler<HTMLInputElement>;
    logoZoom: number;
    setLogoZoom: (zoom: number) => void;
    logoPosition: Position;
    setLogoPosition: (pos: Position) => void;

    productImage: string;
    tempProduct: string;
    handleProductChange: React.ChangeEventHandler<HTMLInputElement>;
    productZoom: number;
    setProductZoom: (zoom: number) => void;
    productPosition: Position;
    setProductPosition: (pos: Position) => void;
    productFileType?: string;
    placeholderProduct: string;

    isUploading: boolean;
    uploadPercent: number;
    compressionDone: boolean;
    isLogoUploading?: boolean;
    logoUploadPercent?: number;
    logoCompressionDone?: boolean;
    isRecording: boolean;
    isMuted?: boolean;

    AutoFitText: React.FC<{ text: string }>;
    theme: PosterThemeDef;

    onEmojiOpen?: () => void;
}

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
    company_logo: string | null;
    logo_zoom?: number;
    product_zoom?: number;
    createdAt?: string;
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
};