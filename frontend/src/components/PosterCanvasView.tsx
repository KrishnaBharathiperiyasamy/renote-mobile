"use client";

import React, { forwardRef, useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  Move,
  Sparkles,
  Zap,
  Flame,
  Award,
  Tag,
  X,
  Pencil,
  Type,
  RotateCcw,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { getPosterImageSrc } from "@constants/api";
import { PosterSticker, StickerBadge } from "./PosterStickers";
export type { PosterSticker } from "./PosterStickers";

// ── Comprehensive Color Themes ──
export interface ColorTheme {
  id: string;
  name: string;
  primary: string;           // Main vibrant accent
  primaryDark: string;       // Darker accent for depth
  primaryLight: string;      // Light tinted surface (e.g. #FFF5ED)
  canvasBg: string;          // Coordinated canvas background
  cardBg: string;            // Card surface background
  cardBorder: string;        // Card border color
  titleColor: string;        // Title text color
  textColor: string;         // Body & product name text color
  subtextColor: string;      // Subtitle / supporting text color
  priceBg: string;           // Price badge background
  priceText: string;         // Price badge text color
  badgeBg: string;           // Top badge background
  badgeText: string;         // Top badge text color
  footerBg: string;          // Footer banner background
  footerText: string;        // Footer text color
  isDark: boolean;           // Whether the palette is dark-themed
  swatch: string;            // Primary hex swatch
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "flame-orange",
    name: "Flame Orange (Default)",
    primary: "#FF5722",
    primaryDark: "#D84315",
    primaryLight: "#FFF5ED",
    canvasBg: "bg-white",
    cardBg: "bg-orange-50/85",
    cardBorder: "border-orange-200/90",
    titleColor: "#FF5722",
    textColor: "text-gray-900",
    subtextColor: "text-gray-600",
    priceBg: "#FF5722",
    priceText: "#FFFFFF",
    badgeBg: "#FF5722",
    badgeText: "#FFFFFF",
    footerBg: "#FF5722",
    footerText: "#FFFFFF",
    isDark: false,
    swatch: "#FF5722",
  },
  {
    id: "electric-blue",
    name: "Royal Sapphire",
    primary: "#2563EB",
    primaryDark: "#1D4ED8",
    primaryLight: "#EFF6FF",
    canvasBg: "bg-[#F8FAFC]",
    cardBg: "bg-blue-50/85",
    cardBorder: "border-blue-200/90",
    titleColor: "#2563EB",
    textColor: "text-gray-900",
    subtextColor: "text-gray-600",
    priceBg: "#2563EB",
    priceText: "#FFFFFF",
    badgeBg: "#2563EB",
    badgeText: "#FFFFFF",
    footerBg: "#2563EB",
    footerText: "#FFFFFF",
    isDark: false,
    swatch: "#2563EB",
  },
  {
    id: "emerald-green",
    name: "Emerald Green",
    primary: "#059669",
    primaryDark: "#047857",
    primaryLight: "#ECFDF5",
    canvasBg: "bg-[#F7FEE7]/40",
    cardBg: "bg-emerald-50/85",
    cardBorder: "border-emerald-200/90",
    titleColor: "#059669",
    textColor: "text-gray-900",
    subtextColor: "text-gray-600",
    priceBg: "#059669",
    priceText: "#FFFFFF",
    badgeBg: "#059669",
    badgeText: "#FFFFFF",
    footerBg: "#059669",
    footerText: "#FFFFFF",
    isDark: false,
    swatch: "#059669",
  },
  {
    id: "cyber-violet",
    name: "Cyber Violet",
    primary: "#7C3AED",
    primaryDark: "#6D28D9",
    primaryLight: "#F5F3FF",
    canvasBg: "bg-[#FAF5FF]",
    cardBg: "bg-purple-50/85",
    cardBorder: "border-purple-200/90",
    titleColor: "#7C3AED",
    textColor: "text-gray-900",
    subtextColor: "text-gray-600",
    priceBg: "#7C3AED",
    priceText: "#FFFFFF",
    badgeBg: "#7C3AED",
    badgeText: "#FFFFFF",
    footerBg: "#7C3AED",
    footerText: "#FFFFFF",
    isDark: false,
    swatch: "#7C3AED",
  },
  {
    id: "amber-gold",
    name: "Amber Gold",
    primary: "#D97706",
    primaryDark: "#B45309",
    primaryLight: "#FFFBEB",
    canvasBg: "bg-[#FFFDF7]",
    cardBg: "bg-amber-50/85",
    cardBorder: "border-amber-200/90",
    titleColor: "#D97706",
    textColor: "text-gray-900",
    subtextColor: "text-gray-600",
    priceBg: "#D97706",
    priceText: "#FFFFFF",
    badgeBg: "#D97706",
    badgeText: "#FFFFFF",
    footerBg: "#D97706",
    footerText: "#FFFFFF",
    isDark: false,
    swatch: "#D97706",
  },
  {
    id: "crimson-rose",
    name: "Ruby Crimson",
    primary: "#E11D48",
    primaryDark: "#BE123C",
    primaryLight: "#FFF1F2",
    canvasBg: "bg-[#FFF5F6]",
    cardBg: "bg-rose-50/85",
    cardBorder: "border-rose-200/90",
    titleColor: "#E11D48",
    textColor: "text-gray-900",
    subtextColor: "text-gray-600",
    priceBg: "#E11D48",
    priceText: "#FFFFFF",
    badgeBg: "#E11D48",
    badgeText: "#FFFFFF",
    footerBg: "#E11D48",
    footerText: "#FFFFFF",
    isDark: false,
    swatch: "#E11D48",
  },
  {
    id: "modern-cyan",
    name: "Modern Cyan",
    primary: "#0891B2",
    primaryDark: "#0E7490",
    primaryLight: "#ECFEFF",
    canvasBg: "bg-[#F0FDFA]",
    cardBg: "bg-cyan-50/85",
    cardBorder: "border-cyan-200/90",
    titleColor: "#0891B2",
    textColor: "text-gray-900",
    subtextColor: "text-gray-600",
    priceBg: "#0891B2",
    priceText: "#FFFFFF",
    badgeBg: "#0891B2",
    badgeText: "#FFFFFF",
    footerBg: "#0891B2",
    footerText: "#FFFFFF",
    isDark: false,
    swatch: "#0891B2",
  },
  {
    id: "midnight-dark",
    name: "Midnight Luxury (Dark)",
    primary: "#F59E0B",
    primaryDark: "#D97706",
    primaryLight: "#1F1D1A",
    canvasBg: "bg-[#0B0D13]",
    cardBg: "bg-[#141824]/90",
    cardBorder: "border-[#252C40]",
    titleColor: "#F59E0B",
    textColor: "text-white",
    subtextColor: "text-gray-400",
    priceBg: "#F59E0B",
    priceText: "#000000",
    badgeBg: "#F59E0B",
    badgeText: "#000000",
    footerBg: "#F59E0B",
    footerText: "#000000",
    isDark: true,
    swatch: "#0B0D13",
  },
  {
    id: "monochrome-minimal",
    name: "Monochrome Minimal",
    primary: "#18181B",
    primaryDark: "#09090B",
    primaryLight: "#F4F4F5",
    canvasBg: "bg-white",
    cardBg: "bg-gray-100/90",
    cardBorder: "border-gray-300",
    titleColor: "#18181B",
    textColor: "text-gray-900",
    subtextColor: "text-gray-600",
    priceBg: "#18181B",
    priceText: "#FFFFFF",
    badgeBg: "#18181B",
    badgeText: "#FFFFFF",
    footerBg: "#18181B",
    footerText: "#FFFFFF",
    isDark: false,
    swatch: "#18181B",
  },
  {
    id: "royal-sky",
    name: "Royal Sky",
    primary: "#2563EB",
    primaryDark: "#1D4ED8",
    primaryLight: "#EFF6FF",
    canvasBg: "bg-[#DBEAFE]",
    cardBg: "rgba(255, 255, 255, 0.92)",
    cardBorder: "rgba(37, 99, 235, 0.3)",
    titleColor: "#1D4ED8",
    textColor: "text-gray-900",
    subtextColor: "text-gray-600",
    priceBg: "#2563EB",
    priceText: "#FFFFFF",
    badgeBg: "#2563EB",
    badgeText: "#FFFFFF",
    footerBg: "#1D4ED8",
    footerText: "#FFFFFF",
    isDark: false,
    swatch: "#2563EB",
  },
  {
    id: "fresh-mint",
    name: "Fresh Mint",
    primary: "#059669",
    primaryDark: "#047857",
    primaryLight: "#ECFDF5",
    canvasBg: "bg-[#D1FAE5]",
    cardBg: "rgba(255, 255, 255, 0.92)",
    cardBorder: "rgba(5, 150, 105, 0.3)",
    titleColor: "#047857",
    textColor: "text-gray-900",
    subtextColor: "text-gray-600",
    priceBg: "#059669",
    priceText: "#FFFFFF",
    badgeBg: "#059669",
    badgeText: "#FFFFFF",
    footerBg: "#047857",
    footerText: "#FFFFFF",
    isDark: false,
    swatch: "#10B981",
  },
  {
    id: "cosmic-night",
    name: "Cosmic Night (Dark)",
    primary: "#A855F7",
    primaryDark: "#7E22CE",
    primaryLight: "#1E1035",
    canvasBg: "bg-[#100920]",
    cardBg: "rgba(255, 255, 255, 0.08)",
    cardBorder: "rgba(168, 85, 247, 0.35)",
    titleColor: "#C084FC",
    textColor: "text-purple-100",
    subtextColor: "text-purple-300",
    priceBg: "#A855F7",
    priceText: "#FFFFFF",
    badgeBg: "#A855F7",
    badgeText: "#FFFFFF",
    footerBg: "#7E22CE",
    footerText: "#FFFFFF",
    isDark: true,
    swatch: "#A855F7",
  },
];

export const isColorBright = (hex: string): boolean => {
  if (!hex || !hex.startsWith("#")) return false;
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65;
};

export const getActiveTheme = (poster: {
  colorThemeId?: string;
  customAccentColor?: string;
  customSecondaryColor?: string;
  customBgColor?: string;
  bgTypeId?: string;
  template?: string;
}): ColorTheme => {
  // Support aliases: gradient-royal -> royal-sky, gradient-emerald -> fresh-mint, gradient-cosmic -> cosmic-night
  const normalizedThemeId =
    poster.colorThemeId === "gradient-royal" ? "royal-sky"
      : poster.colorThemeId === "gradient-emerald" ? "fresh-mint"
        : poster.colorThemeId === "gradient-cosmic" ? "cosmic-night"
          : (poster.colorThemeId || "flame-orange");

  const matchedTheme = COLOR_THEMES.find((t) => t.id === normalizedThemeId);
  const hex = poster.customAccentColor || (matchedTheme ? matchedTheme.primary : "#FF5722");
  const secondaryHex = poster.customSecondaryColor || (matchedTheme ? matchedTheme.primaryDark : "#D84315");
  const isLight = isColorBright(hex);

  const isExplicitLightBg =
    poster.bgTypeId === "clean-white" ||
    poster.bgTypeId === "soft-cream" ||
    poster.bgTypeId === "fresh-mint" ||
    poster.bgTypeId === "gradient-emerald" ||
    poster.bgTypeId === "royal-sky" ||
    poster.bgTypeId === "gradient-royal" ||
    (poster.customBgColor ? isColorBright(poster.customBgColor) : false);

  // Check if dark theme context (from explicit dark background or dark template)
  const isDarkBg = !isExplicitLightBg && Boolean(
    poster.bgTypeId === "gradient-cosmic" ||
    poster.bgTypeId === "cosmic-night" ||
    (poster.customBgColor && !isColorBright(poster.customBgColor)) ||
    (poster.bgTypeId && ["obsidian-black", "slate-dark", "deep-navy", "charcoal"].includes(poster.bgTypeId)) ||
    (poster.template && /^frame12[0-5]$/.test(poster.template)) ||
    (poster.template && ["frame106", "frame108", "frame13", "frame109", "frame111"].includes(poster.template))
  );

  // Check if user has explicitly chosen a custom accent or secondary color that differs from the theme
  const isCustomAccent = Boolean(
    poster.customAccentColor && (!matchedTheme || poster.customAccentColor.toLowerCase() !== matchedTheme.primary.toLowerCase())
  );
  const isCustomSecondary = Boolean(
    poster.customSecondaryColor && (!matchedTheme || poster.customSecondaryColor.toLowerCase() !== matchedTheme.primaryDark.toLowerCase())
  );

  if (isCustomAccent || isCustomSecondary) {
    return {
      id: matchedTheme ? matchedTheme.id : "custom",
      name: matchedTheme ? matchedTheme.name : "Custom Hex Palette",
      primary: hex,
      primaryDark: secondaryHex,
      primaryLight: `${hex}15`,
      canvasBg: isDarkBg ? "bg-[#0B0D13]" : "bg-white",
      cardBg: isDarkBg ? "rgba(255, 255, 255, 0.07)" : `${hex}12`,
      cardBorder: isDarkBg ? "rgba(255, 255, 255, 0.15)" : `${hex}40`,
      titleColor: hex,
      textColor: isDarkBg ? "text-white" : "text-gray-900",
      subtextColor: isDarkBg ? "text-gray-400" : "text-gray-500",
      priceBg: hex,
      priceText: isLight ? "#111827" : "#FFFFFF",
      badgeBg: hex,
      badgeText: isLight ? "#111827" : "#FFFFFF",
      footerBg: hex,
      footerText: isLight ? "#111827" : "#FFFFFF",
      isDark: isDarkBg,
      swatch: hex,
    };
  }

  if (matchedTheme) {
    if (isDarkBg && !matchedTheme.isDark) {
      return {
        ...matchedTheme,
        isDark: true,
        textColor: "text-white",
        subtextColor: "text-gray-400",
        cardBg: "rgba(255, 255, 255, 0.07)",
        cardBorder: "rgba(255, 255, 255, 0.15)",
      };
    }
    return matchedTheme;
  }

  return COLOR_THEMES[0];
};

// ── Curated, High-Impact Background Styles ──
export interface BackgroundStyle {
  id: string;
  name: string;
  type: "solid" | "gradient";
  className: string;
  previewClass: string;
  isDark: boolean;
  imageBoxBg?: string;
  colorHex?: string;
}

export const BACKGROUND_STYLES: BackgroundStyle[] = [
  {
    id: "clean-white",
    name: "Pure White",
    type: "solid",
    className: "bg-[#FFFFFF]",
    previewClass: "bg-[#FFFFFF] border-2 border-gray-300 shadow-2xs",
    isDark: false,
    imageBoxBg: "bg-[#F8F9FA]",
    colorHex: "#FFFFFF",
  },
  {
    id: "soft-cream",
    name: "Soft Cream",
    type: "solid",
    className: "bg-[#FDF2DC]",
    previewClass: "bg-[#FDF2DC] border-2 border-amber-300/80 shadow-2xs",
    isDark: false,
    imageBoxBg: "bg-[#FAF0D7]",
    colorHex: "#FDF2DC",
  },
  {
    id: "obsidian-black",
    name: "Obsidian Black",
    type: "solid",
    className: "bg-[#0B0D14]",
    previewClass: "bg-[#0B0D14] border border-gray-700",
    isDark: true,
    colorHex: "#0B0D14",
  },
  {
    id: "slate-dark",
    name: "Deep Slate",
    type: "solid",
    className: "bg-[#0F172A]",
    previewClass: "bg-[#0F172A] border border-gray-700",
    isDark: true,
    colorHex: "#0F172A",
  },
  {
    id: "deep-teal",
    name: "Deep Teal",
    type: "solid",
    className: "bg-[#155E63]",
    previewClass: "bg-[#155E63]",
    isDark: true,
    colorHex: "#155E63",
  },
  {
    id: "dusty-rose",
    name: "Dusty Rose",
    type: "solid",
    className: "bg-[#D99AA5]",
    previewClass: "bg-[#D99AA5]",
    isDark: false,
    colorHex: "#D99AA5",
  },
  {
    id: "gradient-sunset",
    name: "Warm Sunset",
    type: "gradient",
    className: "bg-gradient-to-br from-[#FFF7ED] via-[#FFEDD5] to-[#FED7AA]",
    previewClass: "bg-gradient-to-br from-[#FFF7ED] to-[#FED7AA]",
    isDark: false,
  },
  {
    id: "gradient-royal",
    name: "Royal Sky",
    type: "gradient",
    className: "bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]",
    previewClass: "bg-gradient-to-br from-[#EFF6FF] to-[#BFDBFE] border border-blue-300 shadow-2xs",
    isDark: false,
    imageBoxBg: "bg-[#F0F7FF]",
    colorHex: "#DBEAFE",
  },
  {
    id: "gradient-emerald",
    name: "Fresh Mint",
    type: "solid",
    className: "bg-[#D1FAE5]",
    previewClass: "bg-[#D1FAE5] border border-emerald-300 shadow-2xs",
    isDark: false,
    imageBoxBg: "bg-[#E6FBF0]",
    colorHex: "#D1FAE5",
  },
  {
    id: "gradient-cosmic",
    name: "Cosmic Night",
    type: "gradient",
    className: "bg-gradient-to-br from-[#1C1030] via-[#100920] to-[#080410]",
    previewClass: "bg-gradient-to-br from-[#1C1030] to-[#080410] border border-purple-900 shadow-2xs",
    isDark: true,
    imageBoxBg: "bg-[#181128]",
    colorHex: "#100920",
  },
];

// Alias for backwards compatibility
export const BACKGROUND_TYPES = BACKGROUND_STYLES;

// ── Typography Fonts ──
export interface FontFamily {
  id: string;
  name: string;
  description: string;
  cssFamily: string;
}

export const FONT_FAMILIES: FontFamily[] = [
  { id: "sans", name: "Modern Sans", description: "Clean & contemporary", cssFamily: "Inter, system-ui, -apple-system, sans-serif" },
  { id: "impact", name: "Bold Impact", description: "Punchy display title", cssFamily: 'Impact, "Arial Black", sans-serif' },
  { id: "serif", name: "Stylized Serif", description: "Classic stylized headline", cssFamily: '"Playfair Display", Georgia, "Times New Roman", serif' },
  { id: "mono", name: "Tech Monospace", description: "Modern developer", cssFamily: '"JetBrains Mono", Menlo, Consolas, monospace' },
  { id: "round", name: "Friendly Rounded", description: "Approachable & clean", cssFamily: 'Outfit, "Segoe UI", sans-serif' },
  { id: "geometric", name: "Geometric Display", description: "Commercial boldness", cssFamily: 'Montserrat, -apple-system, sans-serif' },
];

// ── Complete Template Design Presets ──
export interface TemplatePreset {
  id: string;
  name: string;
  category: "Classic" | "Business" | "Premium" | "Blank";
  layout: string;
  colorThemeId: string;
  customAccentColor: string;
  customSecondaryColor?: string;
  bgTypeId: string;
  customBgColor: string;
  fontFamilyId: string;
  fontColor?: string;
  borderThickness: number;
  neonEffect: boolean;
  badgeText: string;
  isDark: boolean;
}

export const TEMPLATE_PRESETS: Record<string, TemplatePreset> = {
  // Blank Canvas
  frame0: {
    id: "frame0",
    name: "Blank Canvas Design",
    category: "Blank",
    layout: "wireframe-1",
    colorThemeId: "flame-orange",
    customAccentColor: "#FF5722",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 4,
    neonEffect: false,
    badgeText: "VERIFIED AUTHENTIC",
    isDark: false,
  },

  // ── Classic Templates ──
  frame1: {
    id: "frame1",
    name: "Split Standard",
    category: "Classic",
    layout: "wireframe-1",
    colorThemeId: "flame-orange",
    customAccentColor: "#FF5722",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 4,
    neonEffect: false,
    badgeText: "OFFICIAL LAUNCH",
    isDark: false,
  },
  frame2: {
    id: "frame2",
    name: "Featured Dropzone",
    category: "Classic",
    layout: "wireframe-2",
    colorThemeId: "flame-orange",
    customAccentColor: "#FF5722",
    bgTypeId: "soft-cream",
    customBgColor: "#FDF2DC",
    fontFamilyId: "sans",
    borderThickness: 4,
    neonEffect: false,
    badgeText: "FEATURED DEAL",
    isDark: false,
  },
  frame5: {
    id: "frame5",
    name: "Centered Showcase",
    category: "Classic",
    layout: "wireframe-5",
    colorThemeId: "flame-orange",
    customAccentColor: "#FF5722",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 4,
    neonEffect: false,
    badgeText: "VERIFIED AUTHENTIC",
    isDark: false,
  },
  frame6: {
    id: "frame6",
    name: "Multi-Box Grid",
    category: "Classic",
    layout: "wireframe-6",
    colorThemeId: "flame-orange",
    customAccentColor: "#FF5722",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 4,
    neonEffect: false,
    badgeText: "OFFICIAL PRODUCT",
    isDark: false,
  },
  frame101: {
    id: "frame101",
    name: "Spotlight Hero",
    category: "Classic",
    layout: "wireframe-7",
    colorThemeId: "electric-blue",
    customAccentColor: "#2563EB",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 4,
    neonEffect: false,
    badgeText: "SPOTLIGHT HERO",
    isDark: false,
  },
  frame102: {
    id: "frame102",
    name: "Catalog Duet",
    category: "Classic",
    layout: "wireframe-8",
    colorThemeId: "emerald-green",
    customAccentColor: "#0D9488",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 4,
    neonEffect: false,
    badgeText: "CATALOG DUET",
    isDark: false,
  },
  frame7: {
    id: "frame7",
    name: "Minimal Clean",
    category: "Classic",
    layout: "wireframe-1",
    colorThemeId: "monochrome-minimal",
    customAccentColor: "#1E293B",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 2,
    neonEffect: false,
    badgeText: "MINIMAL CLEAN",
    isDark: false,
  },
  frame10: {
    id: "frame10",
    name: "Minimal Card",
    category: "Classic",
    layout: "wireframe-5",
    colorThemeId: "monochrome-minimal",
    customAccentColor: "#334155",
    bgTypeId: "soft-cream",
    customBgColor: "#FDF2DC",
    fontFamilyId: "sans",
    borderThickness: 2,
    neonEffect: false,
    badgeText: "MINIMAL CARD",
    isDark: false,
  },
  frame103: {
    id: "frame103",
    name: "Minimalist Luxury",
    category: "Classic",
    layout: "wireframe-9",
    colorThemeId: "amber-gold",
    customAccentColor: "#B45309",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "serif",
    borderThickness: 1,
    neonEffect: false,
    badgeText: "LUXURY EDITION",
    isDark: false,
  },
  frame104: {
    id: "frame104",
    name: "Floating Frame",
    category: "Classic",
    layout: "wireframe-7",
    colorThemeId: "cyber-violet",
    customAccentColor: "#7C3AED",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 3,
    neonEffect: false,
    badgeText: "FLOATING FRAME",
    isDark: false,
  },
  frame11: {
    id: "frame11",
    name: "Creative Diagonal",
    category: "Classic",
    layout: "wireframe-2",
    colorThemeId: "crimson-rose",
    customAccentColor: "#E11D48",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 4,
    neonEffect: false,
    badgeText: "CREATIVE DROP",
    isDark: false,
  },
  frame12: {
    id: "frame12",
    name: "Creative Dynamic",
    category: "Classic",
    layout: "wireframe-6",
    colorThemeId: "electric-blue",
    customAccentColor: "#4F46E5",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 4,
    neonEffect: false,
    badgeText: "DYNAMIC EDIT",
    isDark: false,
  },
  frame105: {
    id: "frame105",
    name: "Asymmetric Pop",
    category: "Classic",
    layout: "wireframe-9",
    colorThemeId: "crimson-rose",
    customAccentColor: "#D946EF",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 3,
    neonEffect: false,
    badgeText: "ASYMMETRIC POP",
    isDark: false,
  },
  frame106: {
    id: "frame106",
    name: "Neon Fusion",
    category: "Classic",
    layout: "wireframe-8",
    colorThemeId: "modern-cyan",
    customAccentColor: "#06B6D4",
    bgTypeId: "obsidian-black",
    customBgColor: "#0B0F19",
    fontFamilyId: "mono",
    fontColor: "#E0F2FE",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "NEON FUSION",
    isDark: true,
  },
  frame107: {
    id: "frame107",
    name: "Gradient Edge",
    category: "Classic",
    layout: "wireframe-10",
    colorThemeId: "flame-orange",
    customAccentColor: "#EA580C",
    bgTypeId: "gradient-sunset",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 3,
    neonEffect: false,
    badgeText: "GRADIENT EDGE",
    isDark: false,
  },
  frame108: {
    id: "frame108",
    name: "Cyber Card",
    category: "Classic",
    layout: "wireframe-7",
    colorThemeId: "emerald-green",
    customAccentColor: "#10B981",
    bgTypeId: "obsidian-black",
    customBgColor: "#090E17",
    fontFamilyId: "mono",
    fontColor: "#D1FAE5",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "CYBER CARD",
    isDark: true,
  },

  // ── Business Templates ──
  frame13: {
    id: "frame13",
    name: "Corporate Showcase",
    category: "Business",
    layout: "wireframe-9",
    colorThemeId: "electric-blue",
    customAccentColor: "#2563EB",
    bgTypeId: "slate-dark",
    customBgColor: "#0F172A",
    fontFamilyId: "sans",
    fontColor: "#F1F5F9",
    borderThickness: 2,
    neonEffect: false,
    badgeText: "ENTERPRISE SHOWCASE",
    isDark: true,
  },
  frame14: {
    id: "frame14",
    name: "Enterprise Specs",
    category: "Business",
    layout: "wireframe-3",
    colorThemeId: "electric-blue",
    customAccentColor: "#1D4ED8",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 3,
    neonEffect: false,
    badgeText: "ENTERPRISE SPECS",
    isDark: false,
  },
  frame109: {
    id: "frame109",
    name: "Executive Suite",
    category: "Business",
    layout: "wireframe-6",
    colorThemeId: "modern-cyan",
    customAccentColor: "#38BDF8",
    bgTypeId: "slate-dark",
    customBgColor: "#111827",
    fontFamilyId: "sans",
    fontColor: "#F8FAFC",
    borderThickness: 2,
    neonEffect: false,
    badgeText: "EXECUTIVE SUITE",
    isDark: true,
  },
  frame110: {
    id: "frame110",
    name: "Commercial Portfolio",
    category: "Business",
    layout: "wireframe-4",
    colorThemeId: "electric-blue",
    customAccentColor: "#1E40AF",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 3,
    neonEffect: false,
    badgeText: "COMMERCIAL PORTFOLIO",
    isDark: false,
  },
  frame111: {
    id: "frame111",
    name: "Tech Horizon",
    category: "Business",
    layout: "wireframe-5",
    colorThemeId: "modern-cyan",
    customAccentColor: "#00E5FF",
    bgTypeId: "obsidian-black",
    customBgColor: "#0A0E1A",
    fontFamilyId: "mono",
    fontColor: "#ECFEFF",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "TECH HORIZON",
    isDark: true,
  },
  frame112: {
    id: "frame112",
    name: "Strategic Edge",
    category: "Business",
    layout: "wireframe-1",
    colorThemeId: "crimson-rose",
    customAccentColor: "#BE123C",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 3,
    neonEffect: false,
    badgeText: "STRATEGIC EDGE",
    isDark: false,
  },
  frame120: {
    id: "frame120",
    name: "Executive Crest",
    category: "Business",
    layout: "wireframe-formal-1",
    colorThemeId: "midnight-dark",
    customAccentColor: "#F59E0B",
    bgTypeId: "obsidian-black",
    customBgColor: "#0D0F14",
    fontFamilyId: "serif",
    fontColor: "#FEF3C7",
    borderThickness: 2,
    neonEffect: false,
    badgeText: "EXECUTIVE HERITAGE",
    isDark: true,
  },
  frame121: {
    id: "frame121",
    name: "Royal Prestige",
    category: "Business",
    layout: "wireframe-formal-2",
    colorThemeId: "midnight-dark",
    customAccentColor: "#D97706",
    bgTypeId: "obsidian-black",
    customBgColor: "#080C16",
    fontFamilyId: "serif",
    fontColor: "#FEF3C7",
    borderThickness: 2,
    neonEffect: false,
    badgeText: "ROYAL PRESTIGE",
    isDark: true,
  },
  frame122: {
    id: "frame122",
    name: "Heritage Classic",
    category: "Business",
    layout: "wireframe-formal-1",
    colorThemeId: "midnight-dark",
    customAccentColor: "#EAB308",
    bgTypeId: "obsidian-black",
    customBgColor: "#12100E",
    fontFamilyId: "serif",
    fontColor: "#FEF3C7",
    borderThickness: 2,
    neonEffect: false,
    badgeText: "HERITAGE CLASSIC",
    isDark: true,
  },
  frame123: {
    id: "frame123",
    name: "Diplomat Suite",
    category: "Business",
    layout: "wireframe-formal-2",
    colorThemeId: "midnight-dark",
    customAccentColor: "#FBBF24",
    bgTypeId: "obsidian-black",
    customBgColor: "#0A1124",
    fontFamilyId: "serif",
    fontColor: "#FEF3C7",
    borderThickness: 2,
    neonEffect: false,
    badgeText: "DIPLOMAT SUITE",
    isDark: true,
  },
  frame124: {
    id: "frame124",
    name: "Monarch Luxury",
    category: "Business",
    layout: "wireframe-formal-1",
    colorThemeId: "midnight-dark",
    customAccentColor: "#F59E0B",
    bgTypeId: "obsidian-black",
    customBgColor: "#0F081D",
    fontFamilyId: "serif",
    fontColor: "#FEF3C7",
    borderThickness: 2,
    neonEffect: false,
    badgeText: "MONARCH LUXURY",
    isDark: true,
  },
  frame125: {
    id: "frame125",
    name: "Grand Imperial",
    category: "Business",
    layout: "wireframe-formal-2",
    colorThemeId: "midnight-dark",
    customAccentColor: "#F59E0B",
    bgTypeId: "obsidian-black",
    customBgColor: "#05140D",
    fontFamilyId: "serif",
    fontColor: "#FEF3C7",
    borderThickness: 2,
    neonEffect: false,
    badgeText: "GRAND IMPERIAL",
    isDark: true,
  },
  frame113: {
    id: "frame113",
    name: "Mega Offer",
    category: "Business",
    layout: "wireframe-10",
    colorThemeId: "crimson-rose",
    customAccentColor: "#DC2626",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 4,
    neonEffect: false,
    badgeText: "MEGA PROMO SALE",
    isDark: false,
  },
  frame114: {
    id: "frame114",
    name: "Flash Deal",
    category: "Business",
    layout: "wireframe-7",
    colorThemeId: "flame-orange",
    customAccentColor: "#F97316",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 3,
    neonEffect: false,
    badgeText: "FLASH SALE",
    isDark: false,
  },
  frame115: {
    id: "frame115",
    name: "Super Saver",
    category: "Business",
    layout: "wireframe-2",
    colorThemeId: "emerald-green",
    customAccentColor: "#059669",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 3,
    neonEffect: false,
    badgeText: "SUPER SAVER",
    isDark: false,
  },
  frame116: {
    id: "frame116",
    name: "Festive Special",
    category: "Business",
    layout: "wireframe-10",
    colorThemeId: "crimson-rose",
    customAccentColor: "#B91C1C",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "serif",
    borderThickness: 3,
    neonEffect: false,
    badgeText: "FESTIVE SPECIAL",
    isDark: false,
  },
  frame117: {
    id: "frame117",
    name: "Discount Blast",
    category: "Business",
    layout: "wireframe-8",
    colorThemeId: "cyber-violet",
    customAccentColor: "#9333EA",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 3,
    neonEffect: false,
    badgeText: "SUPER DISCOUNT",
    isDark: false,
  },
  frame118: {
    id: "frame118",
    name: "Hot Pick",
    category: "Business",
    layout: "wireframe-6",
    colorThemeId: "flame-orange",
    customAccentColor: "#EA580C",
    bgTypeId: "clean-white",
    customBgColor: "",
    fontFamilyId: "sans",
    borderThickness: 4,
    neonEffect: false,
    badgeText: "HOT PICK DEAL",
    isDark: false,
  },

  // ── Premium Templates ──
  frame15: {
    id: "frame15",
    name: "Modern Minimal",
    category: "Premium",
    layout: "wireframe-premium-1",
    colorThemeId: "modern-cyan",
    customAccentColor: "#00E5FF",
    bgTypeId: "obsidian-black",
    customBgColor: "#090C16",
    fontFamilyId: "sans",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "MODERN MINIMAL",
    isDark: true,
  },
  frame16: {
    id: "frame16",
    name: "Luxury Obsidian",
    category: "Premium",
    layout: "wireframe-premium-2",
    colorThemeId: "midnight-dark",
    customAccentColor: "#FFD700",
    bgTypeId: "obsidian-black",
    customBgColor: "#0A0804",
    fontFamilyId: "serif",
    fontColor: "#FEF3C7",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "LUXURY OBSIDIAN",
    isDark: true,
  },
  frame17: {
    id: "frame17",
    name: "Cyber Split-Screen",
    category: "Premium",
    layout: "wireframe-premium-3",
    colorThemeId: "emerald-green",
    customAccentColor: "#00FF66",
    bgTypeId: "obsidian-black",
    customBgColor: "#061209",
    fontFamilyId: "mono",
    fontColor: "#D1FAE5",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "CYBER HORIZON",
    isDark: true,
  },
  frame18: {
    id: "frame18",
    name: "Bold Typography",
    category: "Premium",
    layout: "wireframe-premium-4",
    colorThemeId: "crimson-rose",
    customAccentColor: "#FF007F",
    bgTypeId: "obsidian-black",
    customBgColor: "#160611",
    fontFamilyId: "sans",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "BOLD EDITORIAL",
    isDark: true,
  },
  frame19: {
    id: "frame19",
    name: "Product Spotlight",
    category: "Premium",
    layout: "wireframe-premium-5",
    colorThemeId: "cyber-violet",
    customAccentColor: "#A855F7",
    bgTypeId: "obsidian-black",
    customBgColor: "#100620",
    fontFamilyId: "sans",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "SPOTLIGHT ELITE",
    isDark: true,
  },
  frame20: {
    id: "frame20",
    name: "Diagonal Dynamic",
    category: "Premium",
    layout: "wireframe-premium-6",
    colorThemeId: "crimson-rose",
    customAccentColor: "#FF3366",
    bgTypeId: "obsidian-black",
    customBgColor: "#05141C",
    fontFamilyId: "sans",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "DYNAMIC SLASH",
    isDark: true,
  },
  frame21: {
    id: "frame21",
    name: "Magazine Catalog",
    category: "Premium",
    layout: "wireframe-premium-7",
    colorThemeId: "emerald-green",
    customAccentColor: "#10B981",
    bgTypeId: "obsidian-black",
    customBgColor: "#051410",
    fontFamilyId: "serif",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "MAGAZINE ISSUE",
    isDark: true,
  },
  frame22: {
    id: "frame22",
    name: "Gradient Glass",
    category: "Premium",
    layout: "wireframe-premium-8",
    colorThemeId: "flame-orange",
    customAccentColor: "#FF4500",
    bgTypeId: "gradient-sunset",
    customBgColor: "#1C0909",
    fontFamilyId: "sans",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "GRADIENT GLASS",
    isDark: true,
  },
  frame23: {
    id: "frame23",
    name: "Tech Matrix Specs",
    category: "Premium",
    layout: "wireframe-premium-9",
    colorThemeId: "amber-gold",
    customAccentColor: "#EAB308",
    bgTypeId: "obsidian-black",
    customBgColor: "#121105",
    fontFamilyId: "mono",
    fontColor: "#FEF08A",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "TECH MATRIX",
    isDark: true,
  },
  frame24: {
    id: "frame24",
    name: "Promotional Sale",
    category: "Premium",
    layout: "wireframe-premium-10",
    colorThemeId: "crimson-rose",
    customAccentColor: "#EC4899",
    bgTypeId: "obsidian-black",
    customBgColor: "#160814",
    fontFamilyId: "sans",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "PROMO SALE",
    isDark: true,
  },
  frame25: {
    id: "frame25",
    name: "Asymmetric Duet",
    category: "Premium",
    layout: "wireframe-premium-11",
    colorThemeId: "emerald-green",
    customAccentColor: "#84CC16",
    bgTypeId: "obsidian-black",
    customBgColor: "#091406",
    fontFamilyId: "sans",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "ASYMMETRIC DUET",
    isDark: true,
  },
  frame26: {
    id: "frame26",
    name: "Holo Prism Diamond",
    category: "Premium",
    layout: "wireframe-premium-12",
    colorThemeId: "modern-cyan",
    customAccentColor: "#06B6D4",
    bgTypeId: "obsidian-black",
    customBgColor: "#090C1B",
    fontFamilyId: "sans",
    borderThickness: 2,
    neonEffect: true,
    badgeText: "HOLO PRISM",
    isDark: true,
  },
};

export const getTemplatePreset = (templateId: string): TemplatePreset => {
  return TEMPLATE_PRESETS[templateId] || TEMPLATE_PRESETS.frame1;
};

// ── Template Categories ──
export interface TemplateCategory {
  id: "classic" | "business" | "premium";
  label: string;
  isPremium?: boolean;
  templates: {
    id: string;
    name: string;
    type: string;
  }[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: "classic",
    label: "Classic",
    templates: [
      { id: "frame1", name: "Split Standard", type: "wireframe-1" },
      { id: "frame2", name: "Featured Dropzone", type: "wireframe-2" },
      { id: "frame5", name: "Centered Showcase", type: "wireframe-5" },
      { id: "frame6", name: "Multi-Box Grid", type: "wireframe-6" },
      { id: "frame101", name: "Spotlight Hero", type: "wireframe-7" },
      { id: "frame102", name: "Catalog Duet", type: "wireframe-8" },
      { id: "frame7", name: "Minimal Clean", type: "wireframe-1" },
      { id: "frame10", name: "Minimal Card", type: "wireframe-5" },
      { id: "frame103", name: "Minimalist Luxury", type: "wireframe-9" },
      { id: "frame104", name: "Floating Frame", type: "wireframe-7" },
      { id: "frame11", name: "Creative Diagonal", type: "wireframe-2" },
      { id: "frame12", name: "Creative Dynamic", type: "wireframe-6" },
      { id: "frame105", name: "Asymmetric Pop", type: "wireframe-9" },
      { id: "frame106", name: "Neon Fusion", type: "wireframe-8" },
      { id: "frame108", name: "Cyber Card", type: "wireframe-7" },
    ],
  },
  {
    id: "business",
    label: "Business",
    templates: [
      { id: "frame13", name: "Corporate Showcase", type: "wireframe-9" },
      { id: "frame14", name: "Enterprise Specs", type: "wireframe-3" },
      { id: "frame109", name: "Executive Suite", type: "wireframe-6" },
      { id: "frame111", name: "Tech Horizon", type: "wireframe-5" },
      { id: "frame112", name: "Strategic Edge", type: "wireframe-1" },
      { id: "frame121", name: "Royal Prestige", type: "wireframe-formal-2" },
      { id: "frame122", name: "Heritage Classic", type: "wireframe-formal-1" },
      { id: "frame123", name: "Diplomat Suite", type: "wireframe-formal-2" },
      { id: "frame125", name: "Grand Imperial", type: "wireframe-formal-2" },
      { id: "frame113", name: "Mega Offer", type: "wireframe-10" },
      { id: "frame114", name: "Flash Deal", type: "wireframe-7" },
      { id: "frame115", name: "Super Saver", type: "wireframe-2" },
      { id: "frame116", name: "Festive Special", type: "wireframe-10" },
      { id: "frame117", name: "Discount Blast", type: "wireframe-8" },
      { id: "frame118", name: "Hot Pick", type: "wireframe-6" },
    ],
  },
  {
    id: "premium",
    label: "Premium",
    isPremium: true,
    templates: [
      { id: "frame15", name: "Modern Minimal", type: "wireframe-premium-1" },
      { id: "frame18", name: "Bold Typography", type: "wireframe-premium-4" },
      { id: "frame20", name: "Diagonal Dynamic", type: "wireframe-premium-6" },
      { id: "frame21", name: "Magazine Catalog", type: "wireframe-premium-7" },
      { id: "frame23", name: "Tech Matrix Specs", type: "wireframe-premium-9" },
      { id: "frame24", name: "Promotional Sale", type: "wireframe-premium-10" },
      { id: "frame25", name: "Asymmetric Duet", type: "wireframe-premium-11" },
      { id: "frame26", name: "Holo Prism Diamond", type: "wireframe-premium-12" },
    ],
  },
];

// ── Premium Themes ──
export interface PremiumTheme {
  id: string;
  name: string;
  primaryNeon: string;
  primaryGlow: string;
  secondaryNeon: string;
  secondaryGlow: string;
  accentNeon: string;
  accentGlow: string;
  bgGradient: string;
  bannerGrad: string;
  bannerGlow: string;
  heart: string;
  logoGrad: [string, string, string];
}

export const PREMIUM_THEMES: Record<string, PremiumTheme> = {
  frame15: {
    id: "frame15",
    name: "Modern Minimalist Tech",
    primaryNeon: "#00E5FF",
    primaryGlow: "rgba(0, 229, 255, 0.75)",
    secondaryNeon: "#38BDF8",
    secondaryGlow: "rgba(56, 189, 248, 0.65)",
    accentNeon: "#60A5FA",
    accentGlow: "rgba(96, 165, 250, 0.55)",
    bgGradient: "from-[#080B18] via-[#0D1024] to-[#05060D]",
    bannerGrad: "from-[#1E293B] via-[#0F172A] to-[#00E5FF]",
    bannerGlow: "rgba(0, 229, 255, 0.7)",
    heart: "🤍",
    logoGrad: ["#00E5FF", "#38BDF8", "#60A5FA"],
  },
  frame16: {
    id: "frame16",
    name: "Luxury Obsidian Prestige",
    primaryNeon: "#F59E0B",
    primaryGlow: "rgba(245, 158, 11, 0.75)",
    secondaryNeon: "#FCD34D",
    secondaryGlow: "rgba(252, 211, 77, 0.65)",
    accentNeon: "#D97706",
    accentGlow: "rgba(217, 119, 6, 0.55)",
    bgGradient: "from-[#0A0804] via-[#141008] to-[#050402]",
    bannerGrad: "from-[#78350F] via-[#D97706] to-[#F59E0B]",
    bannerGlow: "rgba(245, 158, 11, 0.7)",
    heart: "👑",
    logoGrad: ["#F59E0B", "#FCD34D", "#D97706"],
  },
  frame17: {
    id: "frame17",
    name: "Toxic Lime & Cyber Emerald",
    primaryNeon: "#84CC16",
    primaryGlow: "rgba(132, 204, 22, 0.75)",
    secondaryNeon: "#10B981",
    secondaryGlow: "rgba(16, 185, 129, 0.65)",
    accentNeon: "#34D399",
    accentGlow: "rgba(52, 211, 153, 0.55)",
    bgGradient: "from-[#07130B] via-[#0D2416] to-[#040A06]",
    bannerGrad: "from-[#14532D] via-[#10B981] to-[#84CC16]",
    bannerGlow: "rgba(16, 185, 129, 0.7)",
    heart: "💚",
    logoGrad: ["#84CC16", "#10B981", "#34D399"],
  },
  frame18: {
    id: "frame18",
    name: "Electric Magenta & Deep Violet",
    primaryNeon: "#F43F5E",
    primaryGlow: "rgba(244, 63, 94, 0.75)",
    secondaryNeon: "#D946EF",
    secondaryGlow: "rgba(217, 70, 239, 0.65)",
    accentNeon: "#A855F7",
    accentGlow: "rgba(168, 85, 247, 0.55)",
    bgGradient: "from-[#140612] via-[#240A20] to-[#0A0309]",
    bannerGrad: "from-[#831843] via-[#D946EF] to-[#F43F5E]",
    bannerGlow: "rgba(244, 63, 94, 0.7)",
    heart: "💖",
    logoGrad: ["#F43F5E", "#D946EF", "#A855F7"],
  },
  frame19: {
    id: "frame19",
    name: "Deep Space Cyan & Royal Sapphire",
    primaryNeon: "#06B6D4",
    primaryGlow: "rgba(6, 182, 212, 0.75)",
    secondaryNeon: "#3B82F6",
    secondaryGlow: "rgba(59, 130, 246, 0.65)",
    accentNeon: "#6366F1",
    accentGlow: "rgba(99, 102, 241, 0.55)",
    bgGradient: "from-[#04101A] via-[#081C2E] to-[#02080D]",
    bannerGrad: "from-[#1E3A8A] via-[#3B82F6] to-[#06B6D4]",
    bannerGlow: "rgba(6, 182, 212, 0.7)",
    heart: "💎",
    logoGrad: ["#06B6D4", "#3B82F6", "#6366F1"],
  },
  frame20: {
    id: "frame20",
    name: "Solar Orange & Sunset Amber",
    primaryNeon: "#FF5722",
    primaryGlow: "rgba(255, 87, 34, 0.75)",
    secondaryNeon: "#F97316",
    secondaryGlow: "rgba(249, 115, 22, 0.65)",
    accentNeon: "#FBBF24",
    accentGlow: "rgba(251, 191, 36, 0.55)",
    bgGradient: "from-[#1A0A04] via-[#2E1208] to-[#0E0502]",
    bannerGrad: "from-[#9A3412] via-[#EA580C] to-[#FF5722]",
    bannerGlow: "rgba(255, 87, 34, 0.7)",
    heart: "🔥",
    logoGrad: ["#FF5722", "#F97316", "#FBBF24"],
  },
  frame21: {
    id: "frame21",
    name: "Nordic Aurora Borealis",
    primaryNeon: "#10B981",
    primaryGlow: "rgba(16, 185, 129, 0.75)",
    secondaryNeon: "#C084FC",
    secondaryGlow: "rgba(192, 132, 252, 0.65)",
    accentNeon: "#38BDF8",
    accentGlow: "rgba(56, 189, 248, 0.55)",
    bgGradient: "from-[#061411] via-[#0B2621] to-[#030A09]",
    bannerGrad: "from-[#065F46] via-[#10B981] to-[#C084FC]",
    bannerGlow: "rgba(16, 185, 129, 0.7)",
    heart: "💚",
    logoGrad: ["#10B981", "#C084FC", "#38BDF8"],
  },
  frame22: {
    id: "frame22",
    name: "Crimson Blaze & Solar Flame",
    primaryNeon: "#EF4444",
    primaryGlow: "rgba(239, 68, 68, 0.75)",
    secondaryNeon: "#F97316",
    secondaryGlow: "rgba(249, 115, 22, 0.65)",
    accentNeon: "#FBBF24",
    accentGlow: "rgba(251, 191, 36, 0.55)",
    bgGradient: "from-[#1A0707] via-[#2E0E0E] to-[#0E0303]",
    bannerGrad: "from-[#7F1D1D] via-[#EF4444] to-[#F97316]",
    bannerGlow: "rgba(239, 68, 68, 0.7)",
    heart: "❤️",
    logoGrad: ["#EF4444", "#F97316", "#FBBF24"],
  },
  frame23: {
    id: "frame23",
    name: "Cyberpunk Night City Yellow",
    primaryNeon: "#FACC15",
    primaryGlow: "rgba(250, 204, 21, 0.75)",
    secondaryNeon: "#00F0FF",
    secondaryGlow: "rgba(0, 240, 255, 0.65)",
    accentNeon: "#FF0055",
    accentGlow: "rgba(255, 0, 85, 0.55)",
    bgGradient: "from-[#141205] via-[#242009] to-[#0B0A03]",
    bannerGrad: "from-[#713F12] via-[#EAB308] to-[#00F0FF]",
    bannerGlow: "rgba(234, 179, 8, 0.7)",
    heart: "⚡",
    logoGrad: ["#FACC15", "#00F0FF", "#FF0055"],
  },
  frame24: {
    id: "frame24",
    name: "Vaporwave Pastel Rose",
    primaryNeon: "#FB7185",
    primaryGlow: "rgba(251, 113, 133, 0.75)",
    secondaryNeon: "#C084FC",
    secondaryGlow: "rgba(192, 132, 252, 0.65)",
    accentNeon: "#38BDF8",
    accentGlow: "rgba(56, 189, 248, 0.55)",
    bgGradient: "from-[#170814] via-[#260D22] to-[#0C040B]",
    bannerGrad: "from-[#7C3AED] via-[#C084FC] to-[#FB7185]",
    bannerGlow: "rgba(251, 113, 133, 0.7)",
    heart: "🌸",
    logoGrad: ["#FB7185", "#C084FC", "#38BDF8"],
  },
  frame25: {
    id: "frame25",
    name: "Quantum Acid & Laser Blue",
    primaryNeon: "#A3E635",
    primaryGlow: "rgba(163, 230, 53, 0.75)",
    secondaryNeon: "#06B6D4",
    secondaryGlow: "rgba(6, 182, 212, 0.65)",
    accentNeon: "#3B82F6",
    accentGlow: "rgba(59, 130, 246, 0.55)",
    bgGradient: "from-[#0A1406] via-[#12240B] to-[#050A03]",
    bannerGrad: "from-[#365314] via-[#65A30D] to-[#06B6D4]",
    bannerGlow: "rgba(163, 230, 53, 0.7)",
    heart: "❇️",
    logoGrad: ["#A3E635", "#06B6D4", "#3B82F6"],
  },
  frame26: {
    id: "frame26",
    name: "Holographic Diamond & Prism",
    primaryNeon: "#FFFFFF",
    primaryGlow: "rgba(255, 255, 255, 0.85)",
    secondaryNeon: "#67E8F9",
    secondaryGlow: "rgba(103, 232, 249, 0.7)",
    accentNeon: "#E879F9",
    accentGlow: "rgba(232, 121, 249, 0.6)",
    bgGradient: "from-[#080B1A] via-[#131633] to-[#04060E]",
    bannerGrad: "from-[#312E81] via-[#E879F9] to-[#67E8F9]",
    bannerGlow: "rgba(103, 232, 249, 0.7)",
    heart: "💎",
    logoGrad: ["#FFFFFF", "#67E8F9", "#E879F9"],
  },
};

export const getPremiumTheme = (templateId: string): PremiumTheme => {
  return PREMIUM_THEMES[templateId] || PREMIUM_THEMES.frame15;
};

export const getTemplateLayoutType = (templateId: string, category?: string): string => {
  if (templateId === "frame0") return "blank";
  for (const cat of TEMPLATE_CATEGORIES) {
    const found = cat.templates.find((t) => t.id === templateId);
    if (found) return found.type;
  }
  if (TEMPLATE_PRESETS[templateId]?.layout) {
    return TEMPLATE_PRESETS[templateId].layout;
  }
  return category === "Premium" ? "wireframe-premium-1" : "wireframe-6";
};

// ── Poster State Interface ──
export interface PosterState {
  title: string;
  productName: string;
  description: string;
  price: string;
  productImage: string;
  badgeText: string;
  companyLogo: string;
  template: string;
  templateCategory: string;
  colorThemeId: string;
  customAccentColor: string;
  customSecondaryColor?: string;
  bgTypeId: string;
  customBgColor?: string;
  backgroundImage?: string;
  fontFamilyId: string;
  fontColor?: string;
  titleSize: "sm" | "md" | "lg" | "xl";
  isUppercase: boolean;
  textAlign: "left" | "center" | "right";
  borderThickness: number;
  showPriceTag: boolean;
  imageZoom: number;
  imagePosition: { x: number; y: number };
  logoZoom: number;
  logoPosition: { x: number; y: number };
  showLogo: boolean;
  showBadge: boolean;
  neonEffect: boolean;
  // Poster Effects Studio
  shadowEffect?: "none" | "soft" | "deep" | "glow" | "isometric";
  shadowIntensity?: number;
  textOutline?: "none" | "subtle" | "medium" | "bold";
  textOutlineColor?: string;
  gradientOverlay?: "none" | "sunset" | "aurora" | "duotone" | "dark-vignette" | "radial-shine";
  gradientOpacity?: number;
  glassmorphism?: "none" | "subtle" | "frosted" | "heavy";
  decorativeShapes?: "none" | "corner-brackets" | "crosshairs" | "floating-orbs" | "dot-matrix" | "geometric-accents";
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blurFilter?: number;
  // Animation Studio
  animationType?: "none" | "fade-in" | "slide-in" | "zoom-in" | "shimmer" | "pulse";
  animationDuration?: number;
  animationSpeed?: "smooth" | "ease-in-out" | "linear" | "spring";
  animationDelay?: number;
  animationDirection?: "up" | "down" | "left" | "right";
  animationTarget?: "all" | "staggered" | "image-only" | "text-only";
  isPublishedToMarketplace?: boolean;
  publishedAt?: string | null;
  publishedVersion?: number;
  marketplaceCategory?: string;
  marketplaceSubcategory?: string;
  marketplaceCity?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  marketplacePrice?: number | null;
  stickers?: PosterSticker[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Helper: Price Sanitizer & Formatter ──
export const MAX_RETAIL_PRICE = 99999999; // 99,999,999 (₹9.99 Crores)
export const MAX_PRICE_DIGITS = 8;

export interface PriceValidationResult {
  value: string;
  error: string | null;
  isValid: boolean;
}

export const validateAndSanitizePrice = (
  rawInput: string | number | undefined | null
): PriceValidationResult => {
  if (rawInput === undefined || rawInput === null) {
    return { value: "", error: null, isValid: true };
  }

  const str = String(rawInput).trim();
  if (str === "") {
    return { value: "", error: null, isValid: true };
  }

  let error: string | null = null;

  // 1. Check for negative sign
  if (str.includes("-")) {
    error = "Negative values are not allowed";
  }

  // 2. Check for invalid non-numeric characters (allow digits and at most one dot)
  if (/[^0-9.]/.test(str)) {
    if (!error) {
      error = "Only valid numeric digits are allowed";
    }
  }

  // Remove non-numeric / non-dot characters
  let cleaned = str.replace(/[^0-9.]/g, "");

  // Prevent starting with a decimal point
  if (cleaned.startsWith(".")) {
    error = "Price cannot start with a decimal point";
    cleaned = cleaned.replace(/^\.+/, "");
  }

  // Allow at most one decimal point
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
    if (!error) {
      error = "Only one decimal point is allowed";
    }
  }

  let intPart = parts[0] || "";
  let decPart = parts.length > 1 ? parts[1] : null;

  // 3. Price cannot start with 0 or have unnecessary leading zeros
  if (intPart.startsWith("0")) {
    if (intPart === "0" && decPart === null) {
      error = "Price cannot start with 0";
      cleaned = "";
      intPart = "";
    } else if (/^0+$/.test(intPart) && decPart === null) {
      error = "Price cannot start with 0";
      cleaned = "";
      intPart = "";
    } else {
      const stripped = intPart.replace(/^0+/, "");
      if (stripped === "") {
        error = "Price cannot start with 0";
        cleaned = "";
        intPart = "";
      } else {
        error = "Leading zeros are not allowed";
        intPart = stripped;
        cleaned = decPart !== null ? `${intPart}.${decPart}` : intPart;
      }
    }
  }

  // 4. Maximum price limit (max 8 digits / 99,999,999)
  if (intPart.length > MAX_PRICE_DIGITS) {
    intPart = intPart.slice(0, MAX_PRICE_DIGITS);
    cleaned = decPart !== null ? `${intPart}.${decPart}` : intPart;
    error = `Maximum price limit is ₹${MAX_RETAIL_PRICE.toLocaleString("en-IN")}`;
  } else if (Number(intPart) > MAX_RETAIL_PRICE) {
    intPart = String(MAX_RETAIL_PRICE);
    cleaned = intPart;
    error = `Maximum price limit is ₹${MAX_RETAIL_PRICE.toLocaleString("en-IN")}`;
  }

  // 5. Limit decimal places to 2
  if (decPart !== null && decPart.length > 2) {
    decPart = decPart.slice(0, 2);
    cleaned = `${intPart}.${decPart}`;
    if (!error) {
      error = "Maximum 2 decimal places allowed";
    }
  }

  return {
    value: cleaned,
    error,
    isValid: error === null,
  };
};

export const sanitizePriceInput = (value: string | number | undefined | null): string => {
  return validateAndSanitizePrice(value).value;
};

export const formatDisplayPrice = (price: string | number | undefined | null): string => {
  if (price === undefined || price === null || price === "") {
    return "000";
  }
  const str = String(price).trim();
  if (!str) return "000";

  const num = Number(str);
  if (isNaN(num)) return str;

  if (str.includes(".")) {
    const [intPart, decPart] = str.split(".");
    const formattedInt = Number(intPart || 0).toLocaleString("en-IN");
    return `${formattedInt}.${decPart}`;
  }

  return num.toLocaleString("en-IN");
};

export const DEFAULT_POSTER: PosterState = {
  title: "POSTER TITLE",
  productName: "Product Name",
  description: "High performance product with genuine warranty.",
  price: "",
  productImage: "",
  badgeText: "SPECIAL OFFER",
  companyLogo: "/uploads/companies/default-company/logo-1779622107439-878996187.webp",
  template: "frame6",
  templateCategory: "Classic",
  colorThemeId: "flame-orange",
  customAccentColor: "#FF5722",
  customSecondaryColor: "#D84315",
  bgTypeId: "clean-white",
  customBgColor: "#FFFFFF",
  backgroundImage: "",
  fontFamilyId: "serif",
  fontColor: "",
  titleSize: "lg",
  isUppercase: true,
  textAlign: "center",
  borderThickness: 4,
  showPriceTag: true,
  imageZoom: 1,
  imagePosition: { x: 0, y: 0 },
  logoZoom: 1,
  logoPosition: { x: 0, y: 0 },
  showLogo: true,
  showBadge: true,
  neonEffect: false,
  shadowEffect: "none",
  shadowIntensity: 60,
  textOutline: "none",
  textOutlineColor: "#000000",
  gradientOverlay: "none",
  gradientOpacity: 40,
  glassmorphism: "none",
  decorativeShapes: "none",
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blurFilter: 0,
  animationType: "none",
  animationDuration: 2.0,
  animationSpeed: "smooth",
  animationDelay: 0,
  animationDirection: "up",
  animationTarget: "all",
  marketplaceCategory: "Amazon",
  marketplaceSubcategory: "Electronics & Accessories",
  stickers: [],
};

export const normalizePosterData = (data: any): PosterState => {
  if (!data) return DEFAULT_POSTER;

  const resolvedTemplate = data.template || DEFAULT_POSTER.template;
  const preset = getTemplatePreset(resolvedTemplate);

  let resolvedCategory = data.templateCategory || preset.category || DEFAULT_POSTER.templateCategory;
  if (!data.templateCategory) {
    for (const cat of TEMPLATE_CATEGORIES) {
      if (cat.templates.some((t) => t.id === resolvedTemplate)) {
        resolvedCategory = cat.label;
        break;
      }
    }
  }

  const rawImage = data.product_image || data.productImage || "";
  const resolvedImage =
    rawImage.startsWith("data:") || rawImage.startsWith("blob:") || rawImage.startsWith("http")
      ? rawImage
      : rawImage
        ? getPosterImageSrc(rawImage)
        : "";

  const resolvedBgTypeId = data.bgTypeId || preset.bgTypeId || DEFAULT_POSTER.bgTypeId;
  const resolvedCustomBgColor =
    data.customBgColor !== undefined && data.customBgColor !== null
      ? data.customBgColor
      : resolvedBgTypeId === "clean-white"
        ? "#FFFFFF"
        : resolvedBgTypeId === "soft-cream"
          ? "#FDF2DC"
          : preset.customBgColor || "";

  return {
    title: data.poster_title || data.poster_name || data.title || DEFAULT_POSTER.title,
    productName: data.product_name || data.productName || DEFAULT_POSTER.productName,
    description: data.product_description ?? data.description ?? DEFAULT_POSTER.description,
    price: data.product_price !== undefined && data.product_price !== null
      ? String(data.product_price)
      : data.price !== undefined && data.price !== null
        ? String(data.price)
        : "",
    productImage: resolvedImage,
    badgeText: Array.isArray(data.tags) && data.tags.length ? data.tags[0] : (data.badgeText !== undefined ? data.badgeText : (preset.badgeText || DEFAULT_POSTER.badgeText)),
    companyLogo: data.company_logo || data.companyLogo || "/uploads/companies/default-company/logo-1779622107439-878996187.webp",
    template: resolvedTemplate,
    templateCategory: resolvedCategory,
    colorThemeId: data.colorThemeId || preset.colorThemeId || DEFAULT_POSTER.colorThemeId,
    customAccentColor: data.custom_colors || data.customAccentColor || preset.customAccentColor || DEFAULT_POSTER.customAccentColor,
    customSecondaryColor: data.customSecondaryColor || data.secondary_color || (COLOR_THEMES.find((t) => t.id === (data.colorThemeId || preset.colorThemeId))?.primaryDark) || "#D84315",
    bgTypeId: resolvedBgTypeId,
    customBgColor: resolvedCustomBgColor,
    backgroundImage: data.backgroundImage || "",
    fontFamilyId: data.fontFamilyId || preset.fontFamilyId || DEFAULT_POSTER.fontFamilyId,
    fontColor: data.fontColor || data.font_color || preset.fontColor || DEFAULT_POSTER.fontColor || "",
    titleSize: data.titleSize || DEFAULT_POSTER.titleSize,
    isUppercase: data.isUppercase !== undefined ? data.isUppercase : DEFAULT_POSTER.isUppercase,
    textAlign: data.textAlign || DEFAULT_POSTER.textAlign,
    borderThickness: data.borderThickness !== undefined ? data.borderThickness : (preset.borderThickness || DEFAULT_POSTER.borderThickness),
    showPriceTag: data.showPriceTag !== undefined ? data.showPriceTag : DEFAULT_POSTER.showPriceTag,
    imageZoom: data.imageZoom !== undefined ? data.imageZoom : DEFAULT_POSTER.imageZoom,
    imagePosition: data.imagePosition || DEFAULT_POSTER.imagePosition,
    logoZoom: data.logoZoom !== undefined ? data.logoZoom : DEFAULT_POSTER.logoZoom,
    logoPosition: data.logoPosition || DEFAULT_POSTER.logoPosition,
    showLogo: data.showLogo !== undefined ? data.showLogo : DEFAULT_POSTER.showLogo,
    showBadge: data.showBadge !== undefined ? data.showBadge : DEFAULT_POSTER.showBadge,
    neonEffect: data.neonEffect !== undefined ? data.neonEffect : (preset.neonEffect || DEFAULT_POSTER.neonEffect),
    shadowEffect: data.shadowEffect || (data.neonEffect ? "glow" : DEFAULT_POSTER.shadowEffect),
    shadowIntensity: data.shadowIntensity !== undefined ? Number(data.shadowIntensity) : DEFAULT_POSTER.shadowIntensity,
    textOutline: data.textOutline || DEFAULT_POSTER.textOutline,
    textOutlineColor: data.textOutlineColor || DEFAULT_POSTER.textOutlineColor,
    gradientOverlay: data.gradientOverlay || DEFAULT_POSTER.gradientOverlay,
    gradientOpacity: data.gradientOpacity !== undefined ? Number(data.gradientOpacity) : DEFAULT_POSTER.gradientOpacity,
    glassmorphism: data.glassmorphism || DEFAULT_POSTER.glassmorphism,
    decorativeShapes: data.decorativeShapes || DEFAULT_POSTER.decorativeShapes,
    brightness: data.brightness !== undefined ? Number(data.brightness) : DEFAULT_POSTER.brightness,
    contrast: data.contrast !== undefined ? Number(data.contrast) : DEFAULT_POSTER.contrast,
    saturation: data.saturation !== undefined ? Number(data.saturation) : DEFAULT_POSTER.saturation,
    blurFilter: data.blurFilter !== undefined ? Number(data.blurFilter) : DEFAULT_POSTER.blurFilter,
    animationType: data.animationType || DEFAULT_POSTER.animationType,
    animationDuration: data.animationDuration !== undefined ? Number(data.animationDuration) : DEFAULT_POSTER.animationDuration,
    animationSpeed: data.animationSpeed || DEFAULT_POSTER.animationSpeed,
    animationDelay: data.animationDelay !== undefined ? Number(data.animationDelay) : DEFAULT_POSTER.animationDelay,
    animationDirection: data.animationDirection || DEFAULT_POSTER.animationDirection,
    animationTarget: data.animationTarget || DEFAULT_POSTER.animationTarget,
    isPublishedToMarketplace: Boolean(data.isPublishedToMarketplace),
    publishedAt: data.publishedAt || null,
    publishedVersion: data.publishedVersion || 0,
    marketplaceCategory: data.marketplaceCategory || DEFAULT_POSTER.marketplaceCategory || "Amazon",
    marketplaceSubcategory: data.marketplaceSubcategory || DEFAULT_POSTER.marketplaceSubcategory || "Electronics & Accessories",
    marketplaceCity: data.marketplaceCity || "",
    contactPhone: data.contactPhone || "",
    whatsappNumber: data.whatsappNumber || "",
    marketplacePrice: data.marketplacePrice !== undefined ? data.marketplacePrice : null,
    stickers: Array.isArray(data.stickers) ? data.stickers : [],
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? String(data.updatedAt) : (data.createdAt ? String(data.createdAt) : undefined),
  };
};

export interface PosterCanvasViewProps {
  poster: PosterState;
  readOnly?: boolean;
  priceError?: string | null;
  onPriceError?: (error: string | null) => void;
  selectedStickerId?: string | null;
  onSelectSticker?: (id: string | null) => void;
  isImageSelected?: boolean;
  onSelectImage?: (selected: boolean) => void;
  selectedElement?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  onPosterChange?: (updater: (prev: PosterState) => PosterState) => void;
  onCommit?: () => void;
  onFileBrowse?: () => void;
  onLogoBrowse?: () => void;
  onRemoveImage?: () => void;
  onDropImage?: (e: React.DragEvent<HTMLDivElement>) => void;
  onFocusTitleInput?: () => void;
  className?: string;
  style?: React.CSSProperties;
  isCompact?: boolean;
  isPlayingAnimation?: boolean;
  onTogglePlayAnimation?: () => void;
}

export const PosterCanvasView = forwardRef<HTMLDivElement, PosterCanvasViewProps>(function PosterCanvasView(
  {
    poster,
    readOnly = false,
    priceError,
    onPriceError,
    selectedStickerId,
    onSelectSticker,
    isImageSelected,
    onSelectImage,
    selectedElement,
    onSelectElement,
    onPosterChange,
    onCommit,
    onFileBrowse,
    onLogoBrowse,
    onRemoveImage,
    onDropImage,
    onFocusTitleInput,
    className = "",
    style = {},
    isCompact = false,
    isPlayingAnimation = false,
    onTogglePlayAnimation,
  },
  ref
) {
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [internalSelectedElement, setInternalSelectedElement] = useState<string | null>(null);

  // Derive resolved active selected element taking into account selectedElement, isImageSelected, and selectedStickerId props
  const resolvedSelectedElement: string | null = (() => {
    if (selectedElement !== undefined) return selectedElement;
    if (internalSelectedElement !== null) return internalSelectedElement;
    if (isImageSelected) return "image";
    if (selectedStickerId) return `sticker:${selectedStickerId}`;
    return null;
  })();

  const activeImageSelected = !readOnly && resolvedSelectedElement === "image";
  const activeSelectedStickerId = !readOnly && resolvedSelectedElement?.startsWith("sticker:")
    ? resolvedSelectedElement.replace("sticker:", "")
    : null;

  const selectElement = (elementId: string | null) => {
    setInternalSelectedElement(elementId);
    onSelectElement?.(elementId);
    if (elementId === "image") {
      onSelectImage?.(true);
      onSelectSticker?.(null);
    } else if (elementId?.startsWith("sticker:")) {
      onSelectImage?.(false);
      onSelectSticker?.(elementId.replace("sticker:", ""));
    } else {
      onSelectImage?.(false);
      onSelectSticker?.(null);
    }
  };

  const setImageSelected = (selected: boolean) => {
    selectElement(selected ? "image" : null);
  };
  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);

  // ── Inline Title Editing Support ──
  const inlineTitleInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (resolvedSelectedElement === "title" && !readOnly && inlineTitleInputRef.current) {
      inlineTitleInputRef.current.focus();
      inlineTitleInputRef.current.style.height = "auto";
      inlineTitleInputRef.current.style.height = `${inlineTitleInputRef.current.scrollHeight}px`;
    }
  }, [resolvedSelectedElement, readOnly]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawVal = e.target.value;
    const nextVal = poster.isUppercase ? rawVal.toUpperCase() : rawVal;
    onPosterChange?.((prev) => ({ ...prev, title: nextVal }));
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleDoneEditingTitle = () => {
    selectElement(null);
    onCommit?.();
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleDoneEditingTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleDoneEditingTitle();
    }
  };

  const [internalPriceError, setInternalPriceError] = useState<string | null>(null);
  const activePriceError = priceError !== undefined ? priceError : internalPriceError;
  const priceErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reportPriceError = (msg: string | null) => {
    if (priceErrorTimeoutRef.current) {
      clearTimeout(priceErrorTimeoutRef.current);
    }
    setInternalPriceError(msg);
    onPriceError?.(msg);
    if (msg) {
      priceErrorTimeoutRef.current = setTimeout(() => {
        setInternalPriceError(null);
        onPriceError?.(null);
      }, 1500);
    }
  };

  const handlePriceInputChange = (rawVal: string) => {
    const res = validateAndSanitizePrice(rawVal);
    onPosterChange?.((prev) => ({ ...prev, price: res.value }));
    if (res.error) {
      reportPriceError(res.error);
    } else {
      reportPriceError(null);
    }
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Tab" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Enter"
    ) {
      return;
    }
    const currentVal = poster.price || "";
    const isSelectionFull =
      e.currentTarget.selectionStart === 0 &&
      e.currentTarget.selectionEnd === currentVal.length;

    // Prevent starting with 0
    if (
      e.key === "0" &&
      (!currentVal ||
        currentVal === "" ||
        isSelectionFull ||
        (e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0))
    ) {
      e.preventDefault();
      reportPriceError("Price cannot start with 0");
      return;
    }
    // Prevent negative sign
    if (e.key === "-") {
      e.preventDefault();
      reportPriceError("Negative values are not allowed");
      return;
    }
    // Prevent non-numeric characters
    if (!/^[0-9.]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      reportPriceError("Only valid numeric digits are allowed");
      return;
    }
    // Prevent exceeding maximum limit (8 integer digits)
    const intDigits = currentVal.split(".")[0];
    if (
      intDigits.length >= MAX_PRICE_DIGITS &&
      e.currentTarget.selectionStart === e.currentTarget.selectionEnd &&
      /^[0-9]$/.test(e.key)
    ) {
      e.preventDefault();
      reportPriceError("Maximum price limit reached");
      return;
    }
  };

  const handleSelectSticker = (id: string | null) => {
    selectElement(id ? `sticker:${id}` : null);
  };

  const handleRemoveSticker = (stickerId: string) => {
    if (onPosterChange) {
      onPosterChange((prev) => ({
        ...prev,
        stickers: (prev.stickers || []).filter((s) => s.id !== stickerId),
      }));
      onCommit?.();
    }
    selectElement(null);
  };

  // ── Product Image Direct Drag & Reposition ──
  const handleImagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly || !poster.productImage) return;
    if ((e.target as HTMLElement).closest("[data-image-toolbar], [data-image-resize-handle], [data-export-ignore]")) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    selectElement("image");

    const canvasEl = document.getElementById("poster-canvas-render");
    const rect = canvasEl?.getBoundingClientRect();
    const scale = rect && rect.width > 0 ? rect.width / 420 : 1;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startPosX = poster.imagePosition?.x || 0;
    const startPosY = poster.imagePosition?.y || 0;

    setIsDraggingImage(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startClientX) / scale;
      const deltaY = (moveEvent.clientY - startClientY) / scale;

      const nextX = Math.round(startPosX + deltaX);
      const nextY = Math.round(startPosY + deltaY);

      onPosterChange?.((prev) => ({
        ...prev,
        imagePosition: { x: nextX, y: nextY },
      }));
    };

    const handlePointerUp = () => {
      setIsDraggingImage(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      onCommit?.();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // ── Product Image Direct Corner Resize ──
  const handleImageResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly || !poster.productImage) return;
    e.stopPropagation();
    e.preventDefault();

    const canvasEl = document.getElementById("poster-canvas-render");
    const rect = canvasEl?.getBoundingClientRect();
    const scale = rect && rect.width > 0 ? rect.width / 420 : 1;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startZoom = poster.imageZoom || 1;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startClientX) / scale;
      const deltaY = (moveEvent.clientY - startClientY) / scale;
      const deltaCorner = (deltaX + deltaY) / 140;
      const nextZoom = Math.max(0.3, Math.min(3.5, +(startZoom + deltaCorner).toFixed(2)));

      onPosterChange?.((prev) => ({
        ...prev,
        imageZoom: nextZoom,
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      onCommit?.();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // ── Product Image Wheel Zoom ──
  const handleImageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (readOnly || !activeImageSelected || !poster.productImage) return;
    e.stopPropagation();
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const nextZoom = Math.max(0.3, Math.min(3.5, +((poster.imageZoom || 1) + delta).toFixed(2)));
    onPosterChange?.((prev) => ({ ...prev, imageZoom: nextZoom }));
    onCommit?.();
  };

  // ── Compact Floating Toolbar (Now consolidated in the bottom poster editing toolbar) ──
  const renderImageFloatingToolbar = () => {
    return null;
  };

  const handleStickerPointerDown = (e: React.PointerEvent<HTMLDivElement>, sticker: PosterSticker) => {
    if (readOnly) return;
    if ((e.target as HTMLElement).closest("button, [data-sticker-handle]")) {
      return;
    }
    e.stopPropagation();
    handleSelectSticker(sticker.id);

    const container = (e.currentTarget.closest("#poster-canvas-render") || e.currentTarget.parentElement) as HTMLElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = sticker.x;
    const startY = sticker.y;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startClientX;
      const deltaY = moveEvent.clientY - startClientY;
      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;

      const nextX = Math.max(2, Math.min(98, +(startX + deltaXPercent).toFixed(1)));
      const nextY = Math.max(2, Math.min(98, +(startY + deltaYPercent).toFixed(1)));

      onPosterChange?.((prev) => ({
        ...prev,
        stickers: (prev.stickers || []).map((s) =>
          s.id === sticker.id ? { ...s, x: nextX, y: nextY } : s
        ),
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      onCommit?.();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>, sticker: PosterSticker) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();

    const container = (e.currentTarget.closest("#poster-canvas-render") || e.currentTarget.parentElement) as HTMLElement;
    const rect = container?.getBoundingClientRect();
    const scale = rect && rect.width > 0 ? rect.width / 420 : 1;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startWidth = sticker.width || 105;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startClientX) / scale;
      const deltaY = (moveEvent.clientY - startClientY) / scale;
      const deltaCorner = (deltaX + deltaY) / 2;
      const nextWidth = Math.round(Math.max(45, Math.min(260, startWidth + deltaCorner * 2)));

      onPosterChange?.((prev) => ({
        ...prev,
        stickers: (prev.stickers || []).map((s) =>
          s.id === sticker.id ? { ...s, width: nextWidth } : s
        ),
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      onCommit?.();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const STANDARD_ACCENT = "#FF5722";
  const preset = getTemplatePreset(poster.template);
  const isCurrentPremium =
    poster.templateCategory === "Premium" &&
    poster.template.startsWith("frame") &&
    parseInt(poster.template.replace("frame", ""), 10) >= 15 &&
    parseInt(poster.template.replace("frame", ""), 10) <= 26;

  const isFormalTemplate =
    poster.template.startsWith("frame12") &&
    parseInt(poster.template.replace("frame", ""), 10) >= 120 &&
    parseInt(poster.template.replace("frame", ""), 10) <= 125;

  const activeTheme = getActiveTheme(poster);
  const activeAccent = poster.customAccentColor || activeTheme.primary || STANDARD_ACCENT;
  const isNeonActive = poster.neonEffect === true || (poster.neonEffect !== false && (Boolean(preset.neonEffect) || isCurrentPremium));
  const rawTheme = getPremiumTheme(poster.template);
  const theme = {
    ...rawTheme,
    primaryNeon: activeAccent,
    primaryGlow: `${activeAccent}99`,
    bannerGlow: `${activeAccent}66`,
  };
  const layout = getTemplateLayoutType(poster.template, poster.templateCategory);
  const currentFont = FONT_FAMILIES.find((f) => f.id === (poster.fontFamilyId || preset.fontFamilyId)) || FONT_FAMILIES[2]; // serif default
  const currentBg =
    BACKGROUND_STYLES.find(
      (b) =>
        b.id === poster.bgTypeId ||
        b.id === preset.bgTypeId ||
        (b.id === "gradient-royal" && (poster.bgTypeId === "royal-sky" || preset.bgTypeId === "royal-sky")) ||
        (b.id === "gradient-emerald" && (poster.bgTypeId === "fresh-mint" || preset.bgTypeId === "fresh-mint")) ||
        (b.id === "gradient-cosmic" && (poster.bgTypeId === "cosmic-night" || preset.bgTypeId === "cosmic-night")) ||
        (b.id === "deep-teal" && poster.bgTypeId === "slate-dark") ||
        (b.id === "dusty-rose" && poster.bgTypeId === "obsidian-black")
    ) || BACKGROUND_STYLES[0];

  const getTitleSizeClass = () => {
    switch (poster.titleSize) {
      case "sm": return "text-base sm:text-lg";
      case "md": return "text-lg sm:text-xl";
      case "lg": return "text-xl sm:text-2xl";
      case "xl": return "text-2xl sm:text-3xl";
      default: return "text-xl sm:text-2xl";
    }
  };

  const formattedTitle = poster.isUppercase ? (poster.title || "").toUpperCase() : (poster.title || "");

  // ── Poster Effects Studio & Animation Studio Helpers ──
  const effectiveShadow = poster.shadowEffect || (isNeonActive ? "glow" : "none");
  const shadowIntensityRatio = ((poster.shadowIntensity ?? 60) / 60);

  const getBoxShadowStyle = (extraGlow?: boolean): string | undefined => {
    switch (effectiveShadow) {
      case "soft":
        return `0 ${Math.max(1, Math.round(4 * shadowIntensityRatio))}px ${Math.max(2, Math.round(14 * shadowIntensityRatio))}px rgba(0, 0, 0, ${Math.min(0.5, 0.16 * shadowIntensityRatio)})`;
      case "deep":
        return `0 ${Math.max(2, Math.round(10 * shadowIntensityRatio))}px ${Math.max(4, Math.round(26 * shadowIntensityRatio))}px rgba(0, 0, 0, ${Math.min(0.7, 0.38 * shadowIntensityRatio)}), 0 2px 6px rgba(0,0,0,0.2)`;
      case "glow":
        return `0 0 ${Math.max(2, Math.round(14 * shadowIntensityRatio))}px ${activeAccent}${Math.min(255, Math.round(180 * shadowIntensityRatio)).toString(16).padStart(2, "0")}, inset 0 0 ${Math.max(1, Math.round(8 * shadowIntensityRatio))}px ${activeAccent}35`;
      case "isometric":
        return `${Math.max(1, Math.round(5 * shadowIntensityRatio))}px ${Math.max(1, Math.round(5 * shadowIntensityRatio))}px 0px rgba(0, 0, 0, ${Math.min(0.65, 0.35 * shadowIntensityRatio)})`;
      default:
        return extraGlow ? `0 0 12px ${activeAccent}70` : undefined;
    }
  };

  const getTextShadowStyle = (baseColor?: string): string | undefined => {
    const shadows: string[] = [];
    const outline = poster.textOutline && poster.textOutline !== "none" ? poster.textOutline : null;
    const outlineColor = poster.textOutlineColor || (activeTheme.isDark ? "#000000" : "#FFFFFF");

    if (outline === "subtle") {
      shadows.push(`-1px -1px 0 ${outlineColor}`, `1px -1px 0 ${outlineColor}`, `-1px 1px 0 ${outlineColor}`, `1px 1px 0 ${outlineColor}`);
    } else if (outline === "medium") {
      shadows.push(`-2px -2px 0 ${outlineColor}`, `2px -2px 0 ${outlineColor}`, `-2px 2px 0 ${outlineColor}`, `2px 2px 0 ${outlineColor}`);
    } else if (outline === "bold") {
      shadows.push(
        `-2px -2px 0 ${outlineColor}`, `2px -2px 0 ${outlineColor}`, `-2px 2px 0 ${outlineColor}`, `2px 2px 0 ${outlineColor}`,
        `0 3px 0 ${outlineColor}`, `3px 0 0 ${outlineColor}`, `-3px 0 0 ${outlineColor}`, `0 -3px 0 ${outlineColor}`
      );
    }

    if (effectiveShadow === "soft") {
      shadows.push(`0 2px 6px rgba(0, 0, 0, ${Math.min(0.6, 0.35 * shadowIntensityRatio)})`);
    } else if (effectiveShadow === "deep") {
      shadows.push(`0 4px 10px rgba(0, 0, 0, ${Math.min(0.8, 0.65 * shadowIntensityRatio)})`);
    } else if (effectiveShadow === "glow") {
      shadows.push(`0 0 8px ${activeAccent}90`, `0 0 16px ${activeAccent}50`);
    } else if (effectiveShadow === "isometric") {
      shadows.push(`2px 2px 0px rgba(0, 0, 0, 0.5)`);
    }

    return shadows.length ? shadows.join(", ") : undefined;
  };

  const getGlassStyle = (isDarkCard: boolean = false): React.CSSProperties => {
    switch (poster.glassmorphism) {
      case "subtle":
        return {
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          backgroundColor: isDarkCard ? "rgba(0, 0, 0, 0.35)" : "rgba(255, 255, 255, 0.45)",
          borderColor: isDarkCard ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 255, 255, 0.6)",
        };
      case "frosted":
        return {
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          backgroundColor: isDarkCard ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.6)",
          borderColor: isDarkCard ? "rgba(255, 255, 255, 0.28)" : "rgba(255, 255, 255, 0.8)",
        };
      case "heavy":
        return {
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          backgroundColor: isDarkCard ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.75)",
          borderColor: isDarkCard ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.95)",
        };
      default:
        return {};
    }
  };

  const hasAnimation = poster.animationType && poster.animationType !== "none";
  const animDuration = `${poster.animationDuration ?? 2}s`;
  const animTiming =
    poster.animationSpeed === "ease-in-out"
      ? "ease-in-out"
      : poster.animationSpeed === "linear"
        ? "linear"
        : poster.animationSpeed === "spring"
          ? "cubic-bezier(0.34, 1.56, 0.64, 1)"
          : "cubic-bezier(0.25, 0.1, 0.25, 1)";

  const getAnimationClass = (targetType: "all" | "image" | "text" | "staggered-1" | "staggered-2" | "staggered-3"): React.CSSProperties => {
    if (!hasAnimation) return {};

    const targetMode = poster.animationTarget || "all";
    if (targetMode === "image-only" && targetType !== "image" && targetType !== "staggered-2") return {};
    if (targetMode === "text-only" && (targetType === "image" || targetType === "staggered-2")) return {};

    let extraDelay = 0;
    if (targetMode === "staggered") {
      if (targetType === "staggered-2") extraDelay = 0.15;
      else if (targetType === "staggered-3") extraDelay = 0.3;
    }

    const totalDelay = (poster.animationDelay ?? 0) + extraDelay;
    const animName =
      poster.animationType === "fade-in"
        ? "renoteAnimFadeIn"
        : poster.animationType === "slide-in"
          ? `renoteAnimSlideIn_${poster.animationDirection || "up"}`
          : poster.animationType === "zoom-in"
            ? "renoteAnimZoomIn"
            : poster.animationType === "shimmer"
              ? "renoteAnimShimmer"
              : poster.animationType === "pulse"
                ? "renoteAnimPulse"
                : "none";

    const isRunning = isPlayingAnimation;
    return {
      animationName: animName,
      animationDuration: animDuration,
      animationTimingFunction: animTiming,
      animationDelay: `${totalDelay}s`,
      animationIterationCount: "infinite",
      animationFillMode: "both",
      animationPlayState: isRunning ? "running" : "paused",
    };
  };

  // ── Helper: Title Box (Direct on-canvas editing + live sync with Content panel) ──
  const renderTitleBox = (borderClass?: string, textClass?: string) => {
    const isCustom = Boolean(borderClass || textClass);
    const resolvedBorder = borderClass || "border-2 rounded-xl py-2 px-3 text-center transition-all shadow-xs";
    const resolvedText = textClass || "";
    const isSelected = !readOnly && resolvedSelectedElement === "title";

    const titleStyle: React.CSSProperties = {
      ...(!isCustom
        ? {
          borderColor: isSelected
            ? "#FF5722"
            : isNeonActive || effectiveShadow === "glow"
              ? activeAccent
              : `${activeTheme.primary}90`,
          backgroundColor: activeTheme.cardBg,
        }
        : {}),
      boxShadow: !isSelected ? getBoxShadowStyle(isNeonActive) : undefined,
      ...getGlassStyle(activeTheme.isDark),
      ...getAnimationClass("staggered-1"),
    };

    return (
      <div
        data-title-container="true"
        onClick={(e) => {
          if (!readOnly) {
            e.stopPropagation();
            if (!isSelected) {
              selectElement("title");
            }
          }
        }}
        className={`${resolvedBorder} py-2 px-3 text-center transition-all relative ${isSelected
          ? "ring-2 ring-[#FF5722] shadow-md z-30 select-text"
          : !readOnly
            ? "cursor-pointer hover:ring-1 hover:ring-[#FF5722]/50 select-none"
            : "select-none"
          }`}
        style={titleStyle}
        title={!readOnly && !isSelected ? "Click to edit title directly" : undefined}
      >
        {/* Floating Toolbar for Title with Done confirmation */}
        {isSelected && (
          <>
            <div
              data-element-toolbar="true"
              data-export-ignore="true"
              data-html2canvas-ignore="true"
              className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-[#181B26]/95 dark:bg-[#12141D]/95 text-white backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Done / Okay Confirmation Button */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDoneEditingTitle();
                }}
                className="px-2.5 py-1 rounded-lg bg-[#FF5722] hover:bg-[#F4511E] active:scale-95 text-white transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold shadow-md"
                title="Done (Apply title to poster)"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Done</span>
              </button>

              <div className="w-px h-3.5 bg-white/20 mx-0.5" />

              {/* Caps Toggle Button */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  const nextCaps = !poster.isUppercase;
                  onPosterChange?.((prev) => ({
                    ...prev,
                    isUppercase: nextCaps,
                    title: nextCaps ? (prev.title || "").toUpperCase() : prev.title,
                  }));
                  onCommit?.();
                }}
                className={`p-1 px-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium ${poster.isUppercase ? "bg-orange-500/30 text-orange-300 font-bold" : "hover:bg-white/20 text-gray-200 hover:text-white"
                  }`}
                title="Toggle UPPERCASE (Caps)"
              >
                <Type className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono">{poster.isUppercase ? "CAPS ON" : "Caps"}</span>
              </button>

              <div className="w-px h-3.5 bg-white/20 mx-0.5" />

              {/* Text Alignment */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  const nextAlign = poster.textAlign === "left" ? "center" : poster.textAlign === "center" ? "right" : "left";
                  onPosterChange?.((prev) => ({ ...prev, textAlign: nextAlign }));
                  onCommit?.();
                }}
                className="p-1 rounded-lg hover:bg-white/20 text-gray-200 hover:text-white transition-colors cursor-pointer"
                title={`Align text (${poster.textAlign || "center"})`}
              >
                {poster.textAlign === "left" ? (
                  <AlignLeft className="w-3.5 h-3.5" />
                ) : poster.textAlign === "right" ? (
                  <AlignRight className="w-3.5 h-3.5" />
                ) : (
                  <AlignCenter className="w-3.5 h-3.5" />
                )}
              </button>

              <div className="w-px h-3.5 bg-white/20 mx-0.5" />

              {/* Clear Title */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  onPosterChange?.((prev) => ({ ...prev, title: "" }));
                  onCommit?.();
                }}
                className="p-1 rounded-lg hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                title="Clear Title"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Corner Done confirmation pill on the title container */}
            <button
              type="button"
              data-element-toolbar="true"
              data-export-ignore="true"
              data-html2canvas-ignore="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                handleDoneEditingTitle();
              }}
              className="absolute -top-3 right-2 z-50 px-2 py-0.5 rounded-full bg-[#FF5722] hover:bg-[#F4511E] active:scale-95 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md cursor-pointer transition-transform hover:scale-105 animate-in fade-in select-none"
              title="Click Done when finished editing"
            >
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Done</span>
            </button>
          </>
        )}

        {isSelected ? (
          <textarea
            ref={(el) => {
              inlineTitleInputRef.current = el;
              if (el) {
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }
            }}
            rows={1}
            value={poster.isUppercase ? (poster.title || "").toUpperCase() : (poster.title || "")}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            onBlur={() => onCommit?.()}
            placeholder={poster.isUppercase ? "POSTER TITLE" : "Poster Title"}
            className={`w-full bg-transparent border-none outline-none resize-none p-0 m-0 overflow-hidden font-black ${getTitleSizeClass()} tracking-wide break-words ${resolvedText} cursor-text select-text`}
            style={{
              textAlign: poster.textAlign,
              color: !textClass ? activeTheme.titleColor : undefined,
              textShadow: getTextShadowStyle(!textClass ? activeTheme.titleColor : undefined),
              textTransform: poster.isUppercase ? "uppercase" : "none",
              caretColor: "#FF5722",
              lineHeight: "1.25",
              fontFamily: "inherit",
            }}
            autoComplete="off"
            spellCheck={false}
          />
        ) : (
          <h2
            className={`font-black ${getTitleSizeClass()} tracking-wide break-words ${resolvedText}`}
            style={{
              textAlign: poster.textAlign,
              color: !textClass ? activeTheme.titleColor : undefined,
              textShadow: getTextShadowStyle(!textClass ? activeTheme.titleColor : undefined),
            }}
          >
            {formattedTitle || "POSTER TITLE"}
          </h2>
        )}
      </div>
    );
  };

  // ── Helper: Product Name Box ──
  const renderProductNameBox = (borderClass?: string, textClass?: string) => {
    const isSelected = !readOnly && resolvedSelectedElement === "productName";
    const resolvedBorder = borderClass || "rounded-xl border shadow-xs transition-colors";
    const isCardBgHex = activeTheme.cardBg?.startsWith("#") || activeTheme.cardBg?.startsWith("rgb");
    const isCardBorderHex = activeTheme.cardBorder?.startsWith("#") || activeTheme.cardBorder?.startsWith("rgb");
    const boxStyle: React.CSSProperties = {
      backgroundColor: isCardBgHex ? activeTheme.cardBg : undefined,
      borderColor: isSelected ? "#FF5722" : (isNeonActive || effectiveShadow === "glow" ? activeAccent : (isCardBorderHex ? activeTheme.cardBorder : undefined)),
      boxShadow: !isSelected ? getBoxShadowStyle(isNeonActive) : undefined,
      ...getGlassStyle(activeTheme.isDark),
      ...getAnimationClass("staggered-3"),
    };
    const cardBgClass = !isCardBgHex ? (activeTheme.cardBg || "bg-white/80") : "";
    const cardBorderClass = !isCardBorderHex ? (activeTheme.cardBorder || "border-gray-200") : "";
    const resolvedText = poster.fontColor ? "" : (textClass || (activeTheme.isDark ? "text-gray-100" : "text-gray-900"));

    const headingStyle: React.CSSProperties = {
      textAlign: poster.textAlign,
      color: poster.fontColor || (activeTheme.isDark ? "#F3F4F6" : "#111827"),
      textShadow: getTextShadowStyle(poster.fontColor || undefined),
    };

    if (readOnly) {
      return (
        <div className={`${resolvedBorder} ${cardBgClass} ${cardBorderClass} py-1.5 px-3 text-center`} style={boxStyle}>
          <h3
            className={`font-black text-xs sm:text-sm tracking-tight ${resolvedText}`}
            style={headingStyle}
          >
            {poster.productName || "Product Name"}
          </h3>
        </div>
      );
    }
    return (
      <div
        data-product-name-container="true"
        onClick={(e) => {
          e.stopPropagation();
          selectElement("productName");
        }}
        className={`${resolvedBorder} ${cardBgClass} ${cardBorderClass} py-1.5 px-2.5 flex items-center justify-center relative ${isSelected ? "ring-2 ring-[#FF5722] shadow-md z-30" : "hover:border-[#FF5722]/50"
          }`}
        style={boxStyle}
      >
        {/* Floating Toolbar for Product Name */}
        {isSelected && (
          <div
            data-element-toolbar="true"
            data-export-ignore="true"
            data-html2canvas-ignore="true"
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-[#181B26]/95 dark:bg-[#12141D]/95 text-white backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-bold text-orange-400 px-1 cursor-default select-none">
              Product Name
            </span>

            <div className="w-px h-3.5 bg-white/20 mx-0.5" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const nextAlign = poster.textAlign === "left" ? "center" : poster.textAlign === "center" ? "right" : "left";
                onPosterChange?.((prev) => ({ ...prev, textAlign: nextAlign }));
                onCommit?.();
              }}
              className="p-1 rounded-lg hover:bg-white/20 text-gray-200 hover:text-white transition-colors cursor-pointer"
              title={`Align text (${poster.textAlign || "center"})`}
            >
              {poster.textAlign === "left" ? (
                <AlignLeft className="w-3.5 h-3.5" />
              ) : poster.textAlign === "right" ? (
                <AlignRight className="w-3.5 h-3.5" />
              ) : (
                <AlignCenter className="w-3.5 h-3.5" />
              )}
            </button>

            <div className="w-px h-3.5 bg-white/20 mx-0.5" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPosterChange?.((prev) => ({ ...prev, productName: "" }));
                onCommit?.();
              }}
              className="p-1 rounded-lg hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              title="Clear Product Name"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <input
          type="text"
          value={poster.productName || ""}
          onChange={(e) => onPosterChange?.((prev) => ({ ...prev, productName: e.target.value }))}
          onFocus={() => selectElement("productName")}
          onBlur={onCommit}
          placeholder="Product Name"
          className={`w-full bg-transparent outline-none font-bold text-xs sm:text-sm text-center cursor-text select-text placeholder:opacity-50 ${resolvedText}`}
          style={headingStyle}
        />
      </div>
    );
  };

  // ── Helper: Inline Product Name (for rows / composite cards) ──
  const renderInlineProductName = (options?: {
    className?: string;
    style?: React.CSSProperties;
    placeholder?: string;
    subtext?: string;
    subtextClass?: string;
  }) => {
    const isSelected = !readOnly && resolvedSelectedElement === "productName";
    const defaultColor = activeTheme.isDark ? "#F8FAFC" : "#0F172A";
    const resolvedColor = poster.fontColor || defaultColor;
    const baseClass = options?.className || "font-extrabold text-xs sm:text-sm";
    const placeholder = options?.placeholder || "Product Name";
    const inlineTextStyle: React.CSSProperties = {
      color: resolvedColor,
      textShadow: getTextShadowStyle(resolvedColor),
      ...getAnimationClass("staggered-3"),
      ...options?.style,
    };

    return (
      <div
        data-product-name-container="true"
        onClick={(e) => {
          if (!readOnly) {
            e.stopPropagation();
            selectElement("productName");
          }
        }}
        className={`flex-1 min-w-0 pr-1 relative ${isSelected ? "ring-2 ring-[#FF5722] rounded-lg p-0.5 shadow-md z-30" : ""
          }`}
      >
        {/* Floating Toolbar for Inline Product Name */}
        {isSelected && (
          <div
            data-element-toolbar="true"
            data-export-ignore="true"
            data-html2canvas-ignore="true"
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-[#181B26]/95 dark:bg-[#12141D]/95 text-white backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-bold text-orange-400 px-1 cursor-default select-none">
              Product Name
            </span>

            <div className="w-px h-3.5 bg-white/20 mx-0.5" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPosterChange?.((prev) => ({ ...prev, productName: "" }));
                onCommit?.();
              }}
              className="p-1 rounded-lg hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              title="Clear Product Name"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {readOnly ? (
          <h3
            className={`${baseClass} truncate`}
            style={inlineTextStyle}
          >
            {poster.productName || placeholder}
          </h3>
        ) : (
          <input
            type="text"
            value={poster.productName || ""}
            onChange={(e) =>
              onPosterChange?.((prev) => ({ ...prev, productName: e.target.value }))
            }
            onFocus={() => selectElement("productName")}
            onBlur={onCommit}
            placeholder={placeholder}
            className={`w-full bg-transparent outline-none ${baseClass} truncate cursor-text select-text placeholder:opacity-50`}
            style={inlineTextStyle}
          />
        )}
        {options?.subtext && (
          <span
            className={
              options.subtextClass ||
              "text-[9px] text-gray-400 block mt-0.5 truncate"
            }
          >
            {options.subtext}
          </span>
        )}
      </div>
    );
  };

  // ── Helper: Description Box ──
  const renderDescriptionBox = (borderClass?: string) => {
    const isSelected = !readOnly && resolvedSelectedElement === "description";
    const resolvedBorder = borderClass || "rounded-xl border shadow-xs transition-colors";
    const isCardBgHex = activeTheme.cardBg?.startsWith("#") || activeTheme.cardBg?.startsWith("rgb");
    const isCardBorderHex = activeTheme.cardBorder?.startsWith("#") || activeTheme.cardBorder?.startsWith("rgb");
    const boxStyle: React.CSSProperties = {
      backgroundColor: isCardBgHex ? activeTheme.cardBg : undefined,
      borderColor: isSelected ? "#FF5722" : (isNeonActive || effectiveShadow === "glow" ? `${activeAccent}60` : (isCardBorderHex ? activeTheme.cardBorder : undefined)),
      boxShadow: !isSelected ? getBoxShadowStyle(isNeonActive) : undefined,
      ...getGlassStyle(activeTheme.isDark),
      ...getAnimationClass("staggered-3"),
    };
    const cardBgClass = !isCardBgHex ? (activeTheme.cardBg || "bg-white/80") : "";
    const cardBorderClass = !isCardBorderHex ? (activeTheme.cardBorder || "border-gray-200") : "";
    const descriptionTextColor = poster.fontColor || (activeTheme.isDark ? "#F3F4F6" : "#1F2937");

    if (readOnly) {
      if (!poster.description?.trim()) return null;
      return (
        <div className={`${resolvedBorder} ${cardBgClass} ${cardBorderClass} p-2 max-h-[160px] overflow-y-auto custom-scrollbar`} style={boxStyle}>
          <p
            className="text-[11px] sm:text-xs leading-relaxed whitespace-pre-wrap font-medium"
            style={{ color: descriptionTextColor }}
          >
            {poster.description}
          </p>
        </div>
      );
    }
    return (
      <div
        data-description-container="true"
        onClick={(e) => {
          e.stopPropagation();
          selectElement("description");
        }}
        className={`${resolvedBorder} ${cardBgClass} ${cardBorderClass} p-2 flex-1 flex flex-col min-h-[75px] max-h-[160px] relative ${isSelected ? "ring-2 ring-[#FF5722] shadow-md z-30" : "hover:border-[#FF5722]/50"
          }`}
        style={boxStyle}
      >
        {/* Floating Toolbar for Description */}
        {isSelected && (
          <div
            data-element-toolbar="true"
            data-export-ignore="true"
            data-html2canvas-ignore="true"
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-[#181B26]/95 dark:bg-[#12141D]/95 text-white backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-bold text-orange-400 px-1 cursor-default select-none">
              Description
            </span>

            <div className="w-px h-3.5 bg-white/20 mx-0.5" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPosterChange?.((prev) => ({ ...prev, description: "" }));
                onCommit?.();
              }}
              className="p-1 rounded-lg hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              title="Clear Description"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <textarea
          value={poster.description || ""}
          onChange={(e) => onPosterChange?.((prev) => ({ ...prev, description: e.target.value }))}
          onFocus={() => selectElement("description")}
          onBlur={onCommit}
          placeholder="Enter product description..."
          className="w-full h-full bg-transparent outline-none text-[11px] sm:text-xs resize-none leading-relaxed font-medium placeholder:text-gray-400 custom-scrollbar"
          style={{ color: descriptionTextColor }}
        />
      </div>
    );
  };

  // ── Helper: Price Section (Price: ₹ [input] /-) ──
  const renderPriceSection = (accentColor: string = activeTheme.primary) => {
    if (!poster.showPriceTag) return null;
    const isSelected = !readOnly && resolvedSelectedElement === "price";
    const formatted = formatDisplayPrice(poster.price);

    const priceTagStyle: React.CSSProperties = {
      backgroundColor: activeTheme.priceBg,
      color: activeTheme.priceText,
      boxShadow: !isSelected ? getBoxShadowStyle(isNeonActive) : undefined,
      ...getGlassStyle(activeTheme.isDark),
      ...getAnimationClass("staggered-3"),
    };

    if (readOnly) {
      return (
        <div className="inline-flex items-center flex-nowrap whitespace-nowrap gap-1 text-xs font-bold px-0.5 select-none shrink-0 leading-none">
          <span className="shrink-0" style={{ color: accentColor, ...(isNeonActive ? { textShadow: `0 0 6px ${accentColor}80` } : {}) }}>Price: ₹</span>
          <span
            className="font-mono font-black text-xs sm:text-sm px-2 py-0.5 rounded-md shadow-xs shrink-0"
            style={priceTagStyle}
          >
            {formatted}
          </span>
          <span className="shrink-0" style={{ color: accentColor, ...(isNeonActive ? { textShadow: `0 0 6px ${accentColor}80` } : {}) }}>/-</span>
        </div>
      );
    }
    return (
      <div
        data-price-container="true"
        className={`inline-flex items-center flex-nowrap whitespace-nowrap gap-1 text-xs font-bold px-0.5 shrink-0 leading-none relative ${isSelected ? "ring-2 ring-[#FF5722] rounded-lg p-1 shadow-md z-30" : ""
          }`}
        onClick={(e) => {
          e.stopPropagation();
          selectElement("price");
        }}
      >
        {/* Floating Toolbar for Price */}
        {isSelected && (
          <div
            data-element-toolbar="true"
            data-export-ignore="true"
            data-html2canvas-ignore="true"
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-[#181B26]/95 dark:bg-[#12141D]/95 text-white backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-bold text-orange-400 px-1 cursor-default select-none">
              Price
            </span>

            <div className="w-px h-3.5 bg-white/20 mx-0.5" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPosterChange?.((prev) => ({ ...prev, showPriceTag: false }));
                onCommit?.();
                selectElement(null);
              }}
              className="p-1 px-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium hover:bg-white/20 text-gray-200"
              title="Hide Price Tag"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="text-[10px]">Hide Tag</span>
            </button>

            <div className="w-px h-3.5 bg-white/20 mx-0.5" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPosterChange?.((prev) => ({ ...prev, price: "0" }));
                onCommit?.();
              }}
              className="p-1 rounded-lg hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              title="Reset Price to 0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <span className="shrink-0 select-none" style={{ color: accentColor, ...(isNeonActive ? { textShadow: `0 0 6px ${accentColor}80` } : {}) }}>Price: ₹</span>
        <div
          className={`border border-solid px-1.5 py-0.5 rounded-md inline-flex items-center justify-center shadow-xs transition-colors shrink-0 ${activePriceError ? "border-red-400 ring-1 ring-red-400/50" : ""
            }`}
          style={{
            borderColor: activePriceError ? "#F87171" : (isSelected ? "#FF5722" : "transparent"),
            backgroundColor: activeTheme.priceBg,
            boxShadow: !isSelected ? getBoxShadowStyle(isNeonActive) : undefined,
            ...(isNeonActive && !isSelected
              ? {
                boxShadow: `0 0 10px ${activeAccent}70, inset 0 0 6px ${activeAccent}25`,
              }
              : {}),
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            value={poster.price || ""}
            onChange={(e) => handlePriceInputChange(e.target.value)}
            onKeyDown={handlePriceKeyDown}
            onFocus={() => selectElement("price")}
            onBlur={onCommit}
            placeholder="0"
            className="bg-transparent outline-none font-mono font-black text-xs text-center p-0 m-0 cursor-text select-text placeholder:opacity-50"
            style={{
              color: activeTheme.priceText,
              width: `${Math.max(3, (poster.price || "").length) * 8 + 10}px`,
              minWidth: "36px",
              maxWidth: "80px",
              ...(isNeonActive
                ? {
                  textShadow: `0 0 6px ${activeAccent}80`,
                }
                : {}),
            }}
          />
        </div>
        <span className="shrink-0 select-none" style={{ color: accentColor, ...(isNeonActive ? { textShadow: `0 0 6px ${accentColor}80` } : {}) }}>/-</span>
      </div>
    );
  };

  // ── Helper: Price Badge Tag ──
  const renderPriceBadge = (customClass: string = "", customStyle: React.CSSProperties = {}) => {
    if (!poster.showPriceTag) return null;
    const isSelected = !readOnly && resolvedSelectedElement === "price";
    const formatted = formatDisplayPrice(poster.price);

    const baseBg = customStyle.backgroundColor || (customStyle.background ? undefined : activeTheme.priceBg);
    const baseColor = customStyle.color || activeTheme.priceText;
    const badgeStyle: React.CSSProperties = {
      backgroundColor: baseBg,
      color: baseColor,
      ...(isNeonActive && !isSelected
        ? {
          boxShadow: `0 0 14px ${activeAccent}90, inset 0 0 8px rgba(255,255,255,0.4)`,
          textShadow: `0 0 6px rgba(255,255,255,0.8)`,
        }
        : {}),
      ...customStyle,
    };

    if (readOnly) {
      return (
        <div
          className={`px-3 py-1 rounded-lg font-mono font-black text-xs sm:text-sm shrink-0 shadow-xs inline-flex items-center flex-nowrap whitespace-nowrap gap-0.5 select-none ${customClass}`}
          style={badgeStyle}
        >
          <span>₹{formatted}/-</span>
        </div>
      );
    }

    return (
      <div
        data-price-container="true"
        className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs sm:text-sm shrink-0 shadow-xs inline-flex items-center flex-nowrap whitespace-nowrap gap-0.5 transition-transform relative ${isSelected ? "ring-2 ring-[#FF5722] shadow-md z-30" : ""
          } ${activePriceError ? "ring-1 ring-red-400/80" : ""} ${customClass}`}
        style={badgeStyle}
        onClick={(e) => {
          e.stopPropagation();
          selectElement("price");
        }}
      >
        {/* Floating Toolbar for Price Badge */}
        {isSelected && (
          <div
            data-element-toolbar="true"
            data-export-ignore="true"
            data-html2canvas-ignore="true"
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-[#181B26]/95 dark:bg-[#12141D]/95 text-white backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-bold text-orange-400 px-1 cursor-default select-none">
              Price
            </span>

            <div className="w-px h-3.5 bg-white/20 mx-0.5" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPosterChange?.((prev) => ({ ...prev, showPriceTag: false }));
                onCommit?.();
                selectElement(null);
              }}
              className="p-1 px-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium hover:bg-white/20 text-gray-200"
              title="Hide Price Tag"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="text-[10px]">Hide Tag</span>
            </button>

            <div className="w-px h-3.5 bg-white/20 mx-0.5" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPosterChange?.((prev) => ({ ...prev, price: "0" }));
                onCommit?.();
              }}
              className="p-1 rounded-lg hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              title="Reset Price to 0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <span className="shrink-0 opacity-90 select-none">₹</span>
        <input
          type="text"
          inputMode="numeric"
          value={poster.price || ""}
          onChange={(e) => handlePriceInputChange(e.target.value)}
          onKeyDown={handlePriceKeyDown}
          onFocus={() => selectElement("price")}
          onBlur={onCommit}
          placeholder="000"
          className="bg-transparent outline-none font-mono font-black text-xs sm:text-sm text-center p-0 m-0 cursor-text select-text placeholder:opacity-40"
          style={{
            width: `${Math.max(3, (poster.price || "").length) * 8 + 12}px`,
            minWidth: "36px",
            maxWidth: "90px",
            color: baseColor,
            ...(isNeonActive
              ? {
                textShadow: `0 0 6px rgba(255,255,255,0.8)`,
              }
              : {}),
          }}
        />
        <span className="shrink-0 opacity-90 select-none">/-</span>
      </div>
    );
  };

  // ── Helper: Standard Product Dropzone ──
  const renderDropzone = (variant: "split" | "full" | "banner" = "full") => {
    const hasImage = Boolean(poster.productImage);
    const heightClass =
      variant === "split"
        ? "h-full min-h-[160px]"
        : variant === "banner"
          ? "h-44 sm:h-52 w-full"
          : "flex-1 min-h-[180px] w-full";

    if (hasImage) {
      return (
        <div
          data-image-container="true"
          onClick={(e) => {
            if (!readOnly) {
              e.stopPropagation();
              selectElement("image");
            }
          }}
          className={`${heightClass} relative flex items-center justify-center`}
        >
          {/* Clean compact floating toolbar (Appears ONLY when image is selected) */}
          {renderImageFloatingToolbar()}

          {/* Inner image container with clipping frame */}
          <div
            onPointerDown={handleImagePointerDown}
            onWheel={handleImageWheel}
            className={`w-full h-full relative flex items-center justify-center overflow-hidden rounded-xl border touch-none select-none transition-all ${!readOnly
              ? activeImageSelected
                ? "ring-2 ring-[#FF5722] shadow-md cursor-grab active:cursor-grabbing"
                : "cursor-pointer hover:border-[#FF5722]/50"
              : ""
              }`}
            style={{
              backgroundColor: activeTheme.cardBg,
              borderColor: activeImageSelected ? "#FF5722" : (isNeonActive || effectiveShadow === "glow" ? activeAccent : activeTheme.cardBorder),
              boxShadow: !activeImageSelected ? getBoxShadowStyle(isNeonActive) : undefined,
              ...getGlassStyle(activeTheme.isDark),
              ...getAnimationClass("image"),
            }}
          >
            <img
              src={poster.productImage}
              alt={poster.productName || "Product"}
              crossOrigin="anonymous"
              style={{
                transform: `translate(${poster.imagePosition?.x || 0}px, ${poster.imagePosition?.y || 0}px) scale(${poster.imageZoom || 1})`,
                transformOrigin: "center center",
                transition: isDraggingImage ? "none" : "transform 0.12s ease-out",
                ...(isNeonActive
                  ? {
                    filter: `drop-shadow(0 0 8px ${activeAccent}55)`,
                  }
                  : {}),
              }}
              className="max-h-[360px] max-w-full object-contain select-none pointer-events-none"
              draggable={false}
            />

            {/* Direct resize handle & corner anchor dots (only when selected and not readOnly) */}
            {activeImageSelected && !readOnly && (
              <>
                <div data-export-ignore="true" data-html2canvas-ignore="true" className="absolute top-1.5 left-1.5 w-2.5 h-2.5 bg-white border-2 border-[#FF5722] rounded-full pointer-events-none z-30 shadow-xs" />
                <div data-export-ignore="true" data-html2canvas-ignore="true" className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-white border-2 border-[#FF5722] rounded-full pointer-events-none z-30 shadow-xs" />
                <div data-export-ignore="true" data-html2canvas-ignore="true" className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 bg-white border-2 border-[#FF5722] rounded-full pointer-events-none z-30 shadow-xs" />
                <div
                  data-image-resize-handle
                  data-export-ignore="true"
                  data-html2canvas-ignore="true"
                  onPointerDown={handleImageResizePointerDown}
                  className="absolute bottom-1 right-1 w-5 h-5 bg-white border-2 border-[#FF5722] rounded-full shadow-md flex items-center justify-center cursor-nwse-resize z-30 hover:scale-125 transition-transform"
                  title="Drag to resize photo"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722]" />
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    if (readOnly) {
      return (
        <div
          className={`${heightClass} flex flex-col items-center justify-center p-6 text-center text-gray-400 rounded-xl border border-dashed`}
          style={{
            borderColor: activeTheme.cardBorder,
            backgroundColor: activeTheme.cardBg,
          }}
        >
          <Camera className="w-8 h-8 opacity-30 mb-1" />
          <span className="text-xs font-semibold">Product Image</span>
        </div>
      );
    }

    return (
      <div
        data-image-container="true"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropImage}
        onClick={onFileBrowse}
        className={`${heightClass} border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center gap-2 cursor-pointer transition-colors`}
        style={{
          borderColor: activeTheme.primary,
          backgroundColor: activeTheme.primaryLight,
        }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-md text-white"
          style={{ backgroundColor: activeTheme.primary }}
        >
          <Camera className="w-5 h-5 text-white" />
        </div>
        <span
          className="text-xs font-bold"
          style={{ color: activeTheme.isDark ? "#F3F4F6" : "#1F2937" }}
        >
          Drag &amp; Drop Product Image
        </span>
        <span className="text-[10px] font-bold text-gray-400">OR</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFileBrowse?.();
          }}
          className="px-3.5 py-1 rounded text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
          style={{ backgroundColor: activeTheme.primary, color: activeTheme.badgeText }}
        >
          Browse Files
        </button>
      </div>
    );
  };

  // ── Helper: Premium Glowing Image Dropzone ──
  const renderPremiumImageDropzone = (accentColor: string, placeholderText: string = "Drop Product Image") => {
    const hasImage = Boolean(poster.productImage);
    if (hasImage) {
      return (
        <div
          data-image-container="true"
          onClick={(e) => {
            if (!readOnly) {
              e.stopPropagation();
              selectElement("image");
            }
          }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Clean compact floating toolbar (Appears ONLY when image is selected) */}
          {renderImageFloatingToolbar()}

          {/* Inner image container with clipping frame */}
          <div
            onPointerDown={handleImagePointerDown}
            onWheel={handleImageWheel}
            className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl border touch-none select-none transition-all ${!readOnly
              ? activeImageSelected
                ? "ring-2 ring-[#FF5722] shadow-md cursor-grab active:cursor-grabbing"
                : "cursor-pointer hover:border-[#FF5722]/50"
              : ""
              }`}
            style={{
              borderColor: activeImageSelected ? "#FF5722" : (isNeonActive ? `${accentColor}70` : "transparent"),
              ...(isNeonActive
                ? {
                  boxShadow: `0 0 14px ${accentColor}65, inset 0 0 10px ${accentColor}20`,
                }
                : {}),
            }}
          >
            <img
              src={poster.productImage}
              alt={poster.productName || "Product"}
              crossOrigin="anonymous"
              style={{
                transform: `translate(${poster.imagePosition?.x || 0}px, ${poster.imagePosition?.y || 0}px) scale(${poster.imageZoom || 1})`,
                transformOrigin: "center center",
                transition: isDraggingImage ? "none" : "transform 0.12s ease-out",
                ...(isNeonActive
                  ? {
                    filter: `drop-shadow(0 0 10px ${accentColor}60)`,
                  }
                  : {}),
              }}
              className="max-h-[300px] max-w-full object-contain select-none pointer-events-none"
              draggable={false}
            />

            {/* Direct resize handle & corner anchor dots */}
            {activeImageSelected && !readOnly && (
              <>
                <div data-export-ignore="true" data-html2canvas-ignore="true" className="absolute top-1.5 left-1.5 w-2.5 h-2.5 bg-white border-2 border-[#FF5722] rounded-full pointer-events-none z-30 shadow-xs" />
                <div data-export-ignore="true" data-html2canvas-ignore="true" className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-white border-2 border-[#FF5722] rounded-full pointer-events-none z-30 shadow-xs" />
                <div data-export-ignore="true" data-html2canvas-ignore="true" className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 bg-white border-2 border-[#FF5722] rounded-full pointer-events-none z-30 shadow-xs" />
                <div
                  data-image-resize-handle
                  data-export-ignore="true"
                  data-html2canvas-ignore="true"
                  onPointerDown={handleImageResizePointerDown}
                  className="absolute bottom-1 right-1 w-5 h-5 bg-white border-2 border-[#FF5722] rounded-full shadow-md flex items-center justify-center cursor-nwse-resize z-30 hover:scale-125 transition-transform"
                  title="Drag to resize photo"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF5722]" />
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    if (readOnly) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
          <Camera className="w-8 h-8 opacity-40 mb-1" style={{ color: accentColor }} />
          <span className="text-[11px] font-bold text-gray-300">{placeholderText}</span>
        </div>
      );
    }

    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropImage}
        onClick={onFileBrowse}
        className="w-full h-full border border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center gap-2 cursor-pointer transition-colors"
        style={{
          borderColor: `${accentColor}70`,
          backgroundColor: `${accentColor}0C`,
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-md text-white"
          style={{ backgroundColor: accentColor }}
        >
          <Camera className="w-5 h-5 text-white" />
        </div>
        <span className="text-[11px] font-bold text-white tracking-wide">
          {placeholderText}
        </span>
        <span className="text-[10px] text-gray-300">Click or Drag &amp; Drop</span>
      </div>
    );
  };

  // ── Helper: Company Logo ──
  const renderCompanyLogo = () => {
    const isSelected = !readOnly && resolvedSelectedElement === "logo";

    return (
      <div
        data-logo-container="true"
        onClick={(e) => {
          if (!readOnly) {
            e.stopPropagation();
            selectElement("logo");
          }
        }}
        className={`rounded-xl border p-2 flex items-center justify-center text-center transition-colors shadow-2xs relative ${isSelected ? "ring-2 ring-[#FF5722] shadow-md z-30" : !readOnly ? "cursor-pointer hover:border-[#FF5722]/50" : ""
          }`}
        style={{
          backgroundColor: activeTheme.cardBg,
          borderColor: isSelected ? "#FF5722" : activeTheme.cardBorder,
        }}
        title={!readOnly ? "Click to select logo options" : undefined}
      >
        {/* Floating Toolbar for Company Logo */}
        {isSelected && (
          <div
            data-element-toolbar="true"
            data-export-ignore="true"
            data-html2canvas-ignore="true"
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-[#181B26]/95 dark:bg-[#12141D]/95 text-white backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLogoBrowse?.();
              }}
              className="p-1 px-1.5 rounded-lg hover:bg-white/20 text-gray-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
              title="Upload or Replace Logo"
            >
              <Upload className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px]">Replace Logo</span>
            </button>

            {poster.companyLogo && (
              <>
                <div className="w-px h-3.5 bg-white/20 mx-0.5" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPosterChange?.((prev) => ({ ...prev, companyLogo: "" }));
                    onCommit?.();
                  }}
                  className="p-1 rounded-lg hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  title="Remove Custom Logo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}

        <img
          src={poster.companyLogo || "/uploads/companies/default-company/logo-1779622107439-878996187.webp"}
          alt="KrishTech Computers"
          crossOrigin="anonymous"
          className="h-10 sm:h-12 w-auto max-w-[150px] object-contain select-none rounded-md"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes("logo-1779622107439-878996187.webp")) {
              target.src = "/uploads/companies/default-company/logo-1779622107439-878996187.webp";
            }
          }}
        />
      </div>
    );
  };

  const renderStoreBadge = (accent: string, label: string = "KrishTech Catalog", sub: string = "PREMIUM DUET") => (
    <div
      onClick={(e) => {
        if (!readOnly) {
          e.stopPropagation();
          selectElement("logo");
          onLogoBrowse?.();
        }
      }}
      className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
      title="Store badge"
    >
      <img
        src={poster.companyLogo || "/uploads/companies/default-company/logo-1779622107439-878996187.webp"}
        alt="KrishTech Computers"
        crossOrigin="anonymous"
        className="h-5 w-5 object-contain select-none rounded-xs shrink-0"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.includes("logo-1779622107439-878996187.webp")) {
            target.src = "/uploads/companies/default-company/logo-1779622107439-878996187.webp";
          }
        }}
      />
      <div className="flex flex-col text-right">
        <span className="text-[9px] font-black tracking-tight text-white leading-none">
          {label}
        </span>
        <span className="text-[7px] font-bold tracking-widest uppercase" style={{ color: accent }}>
          {sub}
        </span>
      </div>
    </div>
  );

  // ── Render Template Layouts ──
  const renderTemplateContent = () => {
    switch (layout) {
      // ══════ WIREFRAME 1: Split Standard ══════
      case "wireframe-1":
        return (
          <div className="flex-1 flex flex-col gap-2 p-3 bg-transparent overflow-hidden">
            {renderTitleBox()}
            <div className="flex-1 grid grid-cols-12 gap-2.5 overflow-visible">
              <div className="col-span-5 flex flex-col justify-between gap-2 h-full">
                {renderProductNameBox()}
                {renderDescriptionBox()}
                {renderPriceSection()}
                {renderCompanyLogo()}
              </div>
              <div className="col-span-7 h-full flex flex-col">
                {renderDropzone("split")}
              </div>
            </div>
          </div>
        );

      // ══════ WIREFRAME 2: Featured Dropzone on Left, Info on Right ══════
      case "wireframe-2":
        return (
          <div className="flex-1 flex flex-col gap-2 p-3 bg-transparent overflow-hidden">
            {renderTitleBox()}
            <div className="flex-1 grid grid-cols-12 gap-2.5 overflow-visible">
              <div className="col-span-7 h-full flex flex-col">
                {renderDropzone("split")}
              </div>
              <div className="col-span-5 flex flex-col justify-between gap-2 h-full">
                {renderProductNameBox()}
                {renderDescriptionBox()}
                {renderPriceSection()}
                {renderCompanyLogo()}
              </div>
            </div>
          </div>
        );

      // ══════ WIREFRAME 3: Enterprise Specs / Wide Banner ══════
      case "wireframe-3":
        return (
          <div className="flex-1 flex flex-col justify-between p-3 bg-transparent overflow-hidden gap-2">
            {/* Top Title Box */}
            {renderTitleBox()}

            {/* Middle Wide Banner Dropzone */}
            <div className="flex-1 min-h-0 flex flex-col justify-center">
              {renderDropzone("banner")}
            </div>

            {/* Bottom Split Row: Left (Product Name, Description, Price Tag), Right (Company Logo Box) */}
            <div className="grid grid-cols-12 gap-2 shrink-0 items-stretch">
              <div className="col-span-8 flex flex-col justify-between gap-1.5">
                {renderProductNameBox()}
                {renderDescriptionBox()}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Retail Price:</span>
                  {renderPriceBadge()}
                </div>
              </div>
              <div className="col-span-4 flex items-center justify-center">
                {renderCompanyLogo()}
              </div>
            </div>

            {/* Bottom Enterprise Bar */}
            <div
              className="px-3 py-1 rounded-lg flex items-center justify-between text-[10px] font-bold border shadow-xs transition-colors"
              style={{
                backgroundColor: activeTheme.cardBg,
                borderColor: activeTheme.cardBorder,
                color: activeTheme.primary,
              }}
            >
              <span>ENTERPRISE SPECIFICATION</span>
              <span className="font-mono text-[9px] text-gray-400">CERTIFIED HARDWARE</span>
            </div>
          </div>
        );

      // ══════ WIREFRAME 4: Hero Banner on Top ══════
      case "wireframe-4":
        return (
          <div className="flex-1 flex flex-col gap-2.5 p-3.5 bg-transparent overflow-hidden">
            {renderTitleBox()}
            {renderDropzone("banner")}
            <div className="flex items-center justify-between gap-2 mt-auto">
              <div className="flex-1">
                {renderProductNameBox()}
              </div>
              {renderPriceBadge("rounded-xl shadow-md")}
            </div>
          </div>
        );

      // ══════ WIREFRAME 5: Centered Showcase ══════
      case "wireframe-5":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-transparent overflow-hidden gap-2">
            {renderTitleBox()}
            {renderDropzone("full")}
            <div className="flex flex-col gap-2 mt-auto">
              {renderProductNameBox()}
              {poster.description && renderDescriptionBox()}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-500">Official Warranty</span>
                {renderPriceSection()}
              </div>
            </div>
          </div>
        );

      // ══════ WIREFRAME 6: Multi-Box Grid ══════
      case "wireframe-6":
        return (
          <div className="flex-1 flex flex-col justify-between p-3 bg-transparent overflow-hidden gap-2">
            {/* Top Header & Title */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-1">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-xs"
                  style={{ backgroundColor: activeTheme.badgeBg, color: activeTheme.badgeText }}
                >
                  {poster.badgeText || "OFFICIAL PRODUCT"}
                </span>
                <span className="text-[10px] font-bold text-gray-500">GENUINE LISTING</span>
              </div>
              {renderTitleBox()}
            </div>

            {/* Middle Multi-Box Grid: Left Tall Dropzone, Right Logo + Price Card */}
            <div className="flex-1 grid grid-cols-12 gap-2 overflow-visible min-h-0">
              <div className="col-span-7 h-full flex flex-col">
                {renderDropzone("split")}
              </div>
              <div className="col-span-5 flex flex-col justify-between gap-1.5 h-full">
                {renderCompanyLogo()}
                {renderInlineProductName({
                  subtext: "Certified Listing",
                  subtextClass: "text-[9px] text-gray-400 block mt-0.5",
                })}
                <div
                  className="p-2 rounded-lg border shadow-xs transition-colors"
                  style={{
                    backgroundColor: activeTheme.cardBg,
                    borderColor: activeTheme.cardBorder,
                  }}
                >
                  <span className="text-[9px] font-bold uppercase block mb-1" style={{ color: activeTheme.primary }}>
                    Special Price
                  </span>
                  {renderPriceBadge()}
                </div>
              </div>
            </div>

            {/* Wide Description Block */}
            <div className="shrink-0">
              {renderDescriptionBox()}
            </div>

            {/* Bottom Quality Guarantee Bar */}
            <div
              className="px-3 py-1.5 rounded-lg flex items-center justify-between text-[10px] font-bold shadow-xs transition-colors"
              style={{
                backgroundColor: activeTheme.cardBg,
                borderColor: activeTheme.cardBorder,
                color: activeTheme.primary,
              }}
            >
              <span>✓ Certified Quality Guaranteed</span>
              <span className="text-gray-400 font-mono text-[9px]">OFFICIAL WARRANTY</span>
            </div>
          </div>
        );

      // ══════ WIREFRAME 7: Flash Deal Card ══════
      case "wireframe-7":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-transparent text-white overflow-hidden gap-2">
            <div
              className="flex items-center justify-between py-1 px-2.5 rounded border text-[10px] font-black uppercase tracking-wider"
              style={{
                backgroundColor: activeTheme.primaryLight,
                borderColor: activeTheme.cardBorder,
                color: activeTheme.primary,
              }}
            >
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> FLASH SALE</span>
              <span>SPECIAL PROMOTIONAL PRICE</span>
            </div>
            {renderTitleBox()}
            <div className="flex-1 my-1 rounded-xl p-2 flex items-center justify-center overflow-hidden">
              {renderDropzone("full")}
            </div>
            <div
              className="p-2.5 rounded-xl text-white flex items-center justify-between gap-2 shadow-lg"
              style={{ backgroundColor: activeTheme.primary }}
            >
              {renderInlineProductName({
                className: "font-black text-xs sm:text-sm text-white",
                style: { color: "#FFFFFF" },
                subtext: "Limited stock available",
                subtextClass: "text-[9px] text-white/90 block mt-0.5",
              })}
              {renderPriceBadge("shadow-md font-mono font-bold", {
                backgroundColor: "rgba(0, 0, 0, 0.35)",
                color: "#FFFFFF",
              })}
            </div>
          </div>
        );

      // ══════ WIREFRAME 8: Catalog Duet ══════
      case "wireframe-8":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-transparent overflow-hidden gap-2">
            {/* Top Ribbon & Title */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-1">
                <div
                  data-badge-container="true"
                  onClick={(e) => {
                    if (!readOnly) {
                      e.stopPropagation();
                      selectElement("badge");
                    }
                  }}
                  className={`relative inline-flex items-center rounded-full transition-all ${!readOnly && resolvedSelectedElement === "badge"
                      ? "ring-2 ring-[#FF5722] shadow-md z-30"
                      : !readOnly
                        ? "cursor-pointer hover:ring-1 hover:ring-[#FF5722]/50"
                        : ""
                    }`}
                  title={!readOnly ? "Click to select & edit badge" : undefined}
                >
                  {/* Floating Toolbar for Badge */}
                  {!readOnly && resolvedSelectedElement === "badge" && (
                    <div
                      data-element-toolbar="true"
                      data-export-ignore="true"
                      data-html2canvas-ignore="true"
                      className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-[#181B26]/95 dark:bg-[#12141D]/95 text-white backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] font-bold text-orange-400 px-1 cursor-default select-none">
                        Badge / Tag
                      </span>
                      <div className="w-px h-3.5 bg-white/20 mx-0.5" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPosterChange?.((prev) => ({ ...prev, badgeText: "" }));
                          onCommit?.();
                        }}
                        className="p-1 rounded-lg hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Clear Badge Text"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span
                    className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md"
                    style={{ backgroundColor: activeTheme.badgeBg, color: activeTheme.badgeText }}
                  >
                    {poster.badgeText || "⭐ CATALOG DUET"}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold tracking-wide" style={{ color: activeTheme.primary }}>
                  LIMITED TIME ONLY
                </span>
              </div>
              {renderTitleBox()}
            </div>

            {/* Middle 2-Column Side-by-Side Duet Grid */}
            <div className="flex-1 grid grid-cols-2 gap-2.5 items-stretch min-h-0 my-1 overflow-visible">
              {/* Left Column: Product Image Dropzone */}
              <div className="h-full flex flex-col">
                {renderDropzone("split")}
              </div>

              {/* Right Column: Product Name, Catalog Deal Box, Description, Logo */}
              <div className="flex flex-col justify-between gap-1.5 h-full">
                {renderInlineProductName({
                  subtext: "Verified Catalog Listing",
                  subtextClass: "text-[9px] text-gray-400 font-semibold block mt-0.5",
                })}
                <div
                  className="p-2.5 rounded-lg border flex flex-col justify-center gap-1 shadow-xs transition-colors"
                  style={{
                    backgroundColor: activeTheme.cardBg,
                    borderColor: activeTheme.cardBorder,
                  }}
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: activeTheme.primary }}>
                    Special Catalog Deal
                  </span>
                  {renderPriceBadge()}
                </div>
                <div className="flex-1 min-h-0 flex flex-col justify-center">
                  {readOnly && !poster.description ? (
                    <div
                      className="p-2 rounded-lg border text-[10px] text-gray-400 font-medium"
                      style={{ backgroundColor: activeTheme.cardBg, borderColor: activeTheme.cardBorder }}
                    >
                      ✓ 100% Genuine Quality Guaranteed
                    </div>
                  ) : (
                    renderDescriptionBox()
                  )}
                </div>
                {renderCompanyLogo()}
              </div>
            </div>

            {/* Bottom Catalog Guarantee Bar */}
            <div
              className="px-3 py-1.5 rounded-lg flex items-center justify-between text-[10px] font-bold shadow-xs transition-colors"
              style={{
                backgroundColor: activeTheme.cardBg,
                borderColor: activeTheme.cardBorder,
                color: activeTheme.primary,
              }}
            >
              <span>CATALOG VERIFIED • OFFICIAL STORE</span>
              <span className="font-mono text-[9px] text-gray-400">FAST DELIVERY</span>
            </div>
          </div>
        );

      // ══════ WIREFRAME 9: Minimalist Luxury Frame ══════
      case "wireframe-9":
        return (
          <div
            className="flex-1 flex flex-col justify-between p-3.5 bg-transparent overflow-hidden gap-2 m-1 rounded-xl border transition-colors"
            style={{ borderColor: activeTheme.cardBorder }}
          >
            <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: activeTheme.cardBorder }}>
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: activeTheme.primary }}>
                {poster.badgeText || "MINIMALIST LUXURY"}
              </span>
              <span className="text-[9px] text-gray-400 font-mono">EDITION 2026</span>
            </div>
            <div className="text-left">
              {renderTitleBox("border-none px-0 py-0.5", "text-left font-serif")}
            </div>
            <div
              className="flex-1 my-1 rounded-lg border border-dashed p-1 flex items-center justify-center overflow-hidden"
              style={{ borderColor: activeTheme.cardBorder }}
            >
              {renderDropzone("full")}
            </div>
            <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: activeTheme.cardBorder }}>
              <div className="flex-1 pr-2">
                {renderInlineProductName({
                  className: "font-serif font-bold text-xs sm:text-sm",
                  subtext: "Handcrafted & Authenticated",
                  subtextClass: "text-[9px] text-gray-400 block mt-0.5",
                })}
              </div>
              {renderPriceBadge("font-serif shadow-xs")}
            </div>
          </div>
        );

      // ══════ WIREFRAME 10: PROMOTIONAL MEGA SALE (SALES TEMPLATE) ══════
      case "wireframe-10":
        return (
          <div className="p-3 sm:p-3.5 flex flex-col justify-between h-full gap-2.5 bg-transparent">
            {/* Top Promotional Ribbon */}
            <div className="flex items-center justify-between px-1">
              <span
                className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1"
                style={{ backgroundColor: activeTheme.badgeBg, color: activeTheme.badgeText }}
              >
                <Zap className="w-3 h-3 fill-white" /> MEGA PROMO SALE
              </span>
              <span className="text-[11px] font-bold" style={{ color: activeTheme.primary }}>
                LIMITED TIME ONLY
              </span>
            </div>

            {/* Title Box */}
            {renderTitleBox()}

            {/* Product Banner Dropzone */}
            {renderDropzone("banner")}

            {/* Product Name Box */}
            {renderProductNameBox()}

            {/* Styled Offer / Buy Now Card */}
            <div
              className="p-2.5 rounded-xl flex items-center justify-between border shadow-xs mt-auto transition-colors"
              style={{
                borderColor: activeTheme.cardBorder,
                backgroundColor: activeTheme.cardBg,
              }}
            >
              <div className="flex flex-col">
                <span
                  className="text-[10px] font-bold uppercase"
                  style={{ color: activeTheme.isDark ? "#9CA3AF" : "#6B7280" }}
                >
                  Special Offer
                </span>
                {renderPriceBadge()}
              </div>
              <span
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold shadow cursor-pointer transition-transform active:scale-95"
                style={{ backgroundColor: activeTheme.priceBg, color: activeTheme.priceText }}
              >
                BUY NOW
              </span>
            </div>
          </div>
        );

      // ══════ FORMAL 1: Executive Crest ══════
      case "wireframe-formal-1":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-transparent relative overflow-hidden text-[#E2E8F0]">
            <div className="absolute inset-1.5 border border-amber-500/35 pointer-events-none rounded-xs" />
            <div className="z-10 flex flex-col items-center text-center gap-1">
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-amber-400/50" />
                <div
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-400/40 bg-amber-400/10 text-[9px] font-bold text-amber-300 uppercase tracking-widest"
                >
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>{poster.badgeText || "EXECUTIVE HERITAGE"}</span>
                </div>
                <div className="h-px w-8 bg-amber-400/50" />
              </div>
              {renderTitleBox("border border-amber-500/40 rounded-lg py-1.5 px-3 text-center transition-all bg-[#141724]/90", "font-serif text-amber-200")}
            </div>

            <div
              className="flex-1 my-2 rounded-lg bg-[#111420]/90 border border-amber-500/40 p-2 relative flex flex-col items-center justify-center shadow-xl z-10 overflow-hidden"
            >
              <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l border-amber-400" />
              <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r border-amber-400" />
              <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b border-l border-amber-400" />
              <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b border-r border-amber-400" />
              {renderDropzone("full")}
            </div>

            <div
              className="p-2.5 rounded-lg bg-[#141724] border border-amber-500/30 flex items-center justify-between gap-2 shadow-lg z-10"
            >
              {renderInlineProductName({
                className: "font-serif font-bold text-xs sm:text-sm text-amber-100",
                style: { color: poster.fontColor || "#FEF3C7" },
                subtext: "Royal Assurance Warranty",
                subtextClass: "text-[9px] block text-amber-400/90 font-medium mt-0.5",
              })}
              {renderPriceBadge(
                "rounded-md border border-amber-400/60 shadow-md font-mono font-bold",
                { backgroundColor: "rgba(245, 158, 11, 0.25)", color: "#FCD34D" }
              )}
            </div>
          </div>
        );

      // ══════ FORMAL 2: Royal Prestige ══════
      case "wireframe-formal-2":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-transparent relative overflow-hidden text-[#E2E8F0]">
            <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/30">
              <span className="text-[10px] font-serif font-bold tracking-widest uppercase text-amber-400">
                ROYAL PRESTIGE EDITION
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-[9px] font-bold text-amber-300 uppercase">
                ★ CERTIFIED LUXURY
              </span>
            </div>
            <div className="z-10 text-center my-1">
              {renderTitleBox("border border-amber-500/40 rounded-lg py-1.5 px-3 text-center transition-all bg-[#0D1322]/90", "font-serif text-amber-200")}
            </div>
            <div
              className="flex-1 my-1.5 rounded-lg bg-[#0C1222]/90 border border-amber-500/40 p-2 relative flex flex-col items-center justify-center shadow-xl z-10 overflow-hidden"
            >
              {renderDropzone("full")}
            </div>
            <div
              className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0D1526] border border-amber-500/30 shadow-xs z-10"
            >
              {renderInlineProductName({
                className: "font-serif font-bold text-xs sm:text-sm text-amber-100",
                style: { color: poster.fontColor || "#FEF3C7" },
                subtext: "Exclusive Masterpiece Collection",
                subtextClass: "text-[9px] block text-amber-400/90 font-medium mt-0.5",
              })}
              {renderPriceBadge(
                "rounded-md border border-amber-400/60 shadow-md font-mono font-bold",
                { backgroundColor: "rgba(245, 158, 11, 0.25)", color: "#FCD34D" }
              )}
            </div>
          </div>
        );

      // ══════ PREMIUM 10: PROMOTIONAL FLASH SALE (NEON) ══════
      case "wireframe-premium-10":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-[#140612] relative overflow-hidden font-sans text-white">
            <div className="z-10 flex flex-col gap-1">
              <div className="py-1 px-3 bg-gradient-to-r from-rose-600 via-orange-500 to-rose-600 text-white flex items-center justify-between text-[9px] font-black uppercase tracking-wider shadow-md rounded-xs">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 fill-white" /> FLASH TECH SALE</span>
                <span>LIMITED TIME ONLY • SAVE BIG</span>
                <span className="flex items-center gap-1"><Flame className="w-3 h-3 fill-white" /> 48 HOURS</span>
              </div>
              {renderTitleBox("p-2 bg-[#200A1C] border border-rose-500/50 rounded-xs", "text-rose-300")}
            </div>

            <div className="flex-1 my-2 rounded-xl bg-[#1F091B]/90 border-2 border-rose-500/50 p-3 flex items-center justify-center relative overflow-hidden shadow-2xl z-10">
              <div className="absolute top-2 right-2 w-12 h-12 rounded-full bg-rose-600 text-white flex flex-col items-center justify-center font-black text-[8px] leading-tight rotate-12 shadow-xl border-2 border-white animate-pulse z-20">
                <span>MEGA</span>
                <span className="text-[10px]">DEAL</span>
              </div>
              {renderPremiumImageDropzone(theme.primaryNeon, "Drop Promotional Product")}
            </div>

            <div className="p-3 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 text-white rounded-xl shadow-xl flex items-center justify-between gap-3 z-10">
              {renderInlineProductName({
                className: "font-black text-xs sm:text-sm text-white",
                style: { color: "#FFFFFF" },
                subtext: "✓ Lowest Price Guarantee • Free Delivery",
                subtextClass: "text-[9px] text-white/80 font-bold block mt-0.5",
              })}
              <div className="px-3.5 py-1.5 rounded-lg bg-black text-rose-400 font-mono font-black text-xs sm:text-sm flex items-center gap-1 shadow-md shrink-0 border border-rose-400/40">
                {renderPriceBadge("", { backgroundColor: theme.primaryNeon, color: "#000000" })}
              </div>
            </div>
          </div>
        );

      // ══════ PREMIUM 1: Modern Minimal ══════
      case "wireframe-premium-1":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 relative overflow-hidden font-sans">
            <div className="z-10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-wider text-white">
                  <Sparkles className="w-3 h-3" style={{ color: theme.primaryNeon }} />
                  <span>{poster.badgeText || "FLAGSHIP SPEC"}</span>
                </div>
                <span className="text-[8px] font-mono text-gray-400">PRO SERIES 2026</span>
              </div>
              {renderTitleBox("p-2 bg-black/40 border border-white/10 rounded-lg", "text-white")}
            </div>
            <div className="flex-1 my-2 rounded-xl bg-black/35 border border-white/10 p-2 relative flex flex-col items-center justify-center shadow-2xl z-10 overflow-hidden">
              {renderPremiumImageDropzone(theme.primaryNeon, "Drop Flagship Product")}
            </div>
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-2 shadow-2xl backdrop-blur-md z-10">
              {renderInlineProductName({
                className: "font-black text-xs sm:text-sm text-white",
                style: { color: "#FFFFFF" },
                subtext: "Premium Warranty Included",
                subtextClass: "text-[9px] text-gray-400 block mt-0.5",
              })}
              {renderPriceBadge("", { backgroundColor: theme.primaryNeon, color: "#000000" })}
            </div>
          </div>
        );

      // ══════ PREMIUM 2: Luxury Obsidian ══════
      case "wireframe-premium-2":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 relative overflow-hidden font-sans">
            <div className="z-10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold tracking-widest uppercase text-white/70">
                  OBSIDIAN BLACK EDITION
                </span>
                <span className="text-[9px] font-mono" style={{ color: theme.primaryNeon }}>
                  LIMITED PRODUCTION
                </span>
              </div>
              {renderTitleBox("p-2 bg-black/60 border border-white/15 rounded-lg", "text-white")}
            </div>
            <div className="flex-1 my-2 rounded-xl bg-black/50 border border-white/10 p-2 flex items-center justify-center relative shadow-2xl z-10 overflow-hidden">
              {renderPremiumImageDropzone(theme.primaryNeon, "Drop Luxury Product")}
            </div>
            <div className="p-3 rounded-xl bg-black/70 border border-white/15 flex items-center justify-between gap-2 shadow-2xl z-10">
              {renderInlineProductName({
                className: "font-black text-xs sm:text-sm text-white",
                style: { color: "#FFFFFF" },
              })}
              {renderPriceBadge("", { backgroundColor: theme.primaryNeon, color: "#000000" })}
            </div>
          </div>
        );

      // ══════ PREMIUM 3: Cyber Split-Screen ══════
      case "wireframe-premium-3":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 relative overflow-hidden font-sans">
            <div className="z-10 flex flex-col gap-1">
              {renderTitleBox("p-2 bg-black/40 border border-white/10 rounded-lg", "text-white")}
            </div>
            <div className="flex-1 grid grid-cols-12 gap-2 my-2 z-10 overflow-visible">
              <div className="col-span-7 h-full flex flex-col rounded-xl overflow-hidden bg-black/40 border border-white/10">
                {renderPremiumImageDropzone(theme.primaryNeon, "Drop Hardware Image")}
              </div>
              <div className="col-span-5 flex flex-col justify-between gap-1.5 h-full">
                {renderProductNameBox()}
                {renderDescriptionBox()}
                <div
                  className="p-2 rounded-xl flex flex-col border shadow-xs"
                  style={{
                    backgroundColor: `${theme.primaryNeon}15`,
                    borderColor: `${theme.primaryNeon}40`,
                  }}
                >
                  <span className="text-[9px] font-bold uppercase" style={{ color: theme.primaryNeon }}>Flash Price</span>
                  {renderPriceBadge("", { backgroundColor: theme.primaryNeon, color: "#000000" })}
                </div>
              </div>
            </div>
          </div>
        );

      // ══════ PREMIUM 4: Bold Typography Editorial ══════
      case "wireframe-premium-4":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 relative overflow-hidden font-sans">
            <div className="z-10 flex flex-col gap-1">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[9px] font-extrabold tracking-[0.2em] uppercase text-pink-400">EDITORIAL ISSUE #18</span>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-pink-500/20 text-pink-300 border border-pink-500/40">TECH TRENDS</span>
              </div>
              {renderTitleBox("p-2 bg-black/50 border border-white/15 rounded-xl", "text-white uppercase font-black text-xl sm:text-2xl")}
            </div>
            <div className="flex-1 my-2 rounded-2xl bg-black/40 border border-white/10 p-2 flex items-center justify-center relative shadow-2xl z-10 overflow-hidden">
              {renderPremiumImageDropzone(theme.primaryNeon, "Drop Hero Showcase")}
            </div>
            <div className="z-10 mb-1">
              {renderInlineProductName({
                className: "font-black text-xs sm:text-sm text-white",
                style: { color: "#FFFFFF" },
              })}
            </div>
            {/* 3 Bottom Spec Pill Blocks matching the 3-column thumbnail */}
            <div className="grid grid-cols-3 gap-2 z-10">
              <div className="p-2 rounded-xl bg-pink-950/40 border border-pink-500/40 text-center flex flex-col justify-center items-center">
                <span className="text-[8px] uppercase tracking-wider text-pink-400 font-bold">EST. RETAIL</span>
                {renderPriceBadge("", { backgroundColor: theme.primaryNeon, color: "#000000" })}
              </div>
              <div className="p-2 rounded-xl bg-orange-950/40 border border-orange-500/40 text-center flex flex-col justify-center items-center">
                <span className="text-[8px] uppercase tracking-wider text-orange-400 font-bold">GRADE A+</span>
                <span className="text-[10px] font-black text-orange-300 uppercase">VERIFIED</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/40 text-center flex flex-col justify-center items-center">
                <span className="text-[8px] uppercase tracking-wider text-amber-400 font-bold">WARRANTY</span>
                <span className="text-[10px] font-black text-amber-300 uppercase">INCLUDED</span>
              </div>
            </div>
          </div>
        );

      // ══════ PREMIUM 5: Product Spotlight ══════
      case "wireframe-premium-5":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 relative overflow-hidden font-sans">
            <div className="z-10 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase text-black" style={{ backgroundColor: theme.primaryNeon }}>
                  SPOTLIGHT DEAL
                </span>
                <span className="text-[9px] font-mono text-gray-400">BEST VALUE</span>
              </div>
              {renderTitleBox("p-2 bg-black/40 border border-white/10 rounded-lg", "text-white")}
            </div>
            {/* Center circular pedestal ring with floating chips */}
            <div className="flex-1 my-2 rounded-xl bg-black/30 border border-white/10 p-2 flex items-center justify-center relative shadow-2xl z-10 overflow-hidden">
              <div className="absolute left-2 top-3 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-[8px] font-bold text-purple-300 uppercase z-20">
                100% ORIGINAL
              </div>
              <div className="absolute right-2 top-3 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[8px] font-bold text-cyan-300 uppercase z-20">
                EXPRESS SHIP
              </div>
              <div
                className="w-full h-full max-w-[280px] max-h-[280px] rounded-full border-2 border-dashed p-2 flex items-center justify-center relative transition-all"
                style={{ borderColor: `${theme.primaryNeon}50` }}
              >
                {renderPremiumImageDropzone(theme.primaryNeon, "Drop Spotlight Product")}
              </div>
            </div>
            {/* Curved bottom dock */}
            <div className="p-3 rounded-full bg-black/60 border border-white/10 flex items-center justify-between gap-2 shadow-2xl z-10 px-4">
              {renderInlineProductName({
                className: "font-black text-xs sm:text-sm text-white",
                style: { color: "#FFFFFF" },
              })}
              {renderPriceBadge("", { backgroundColor: theme.primaryNeon, color: "#000000" })}
            </div>
          </div>
        );

      // ══════ PREMIUM 6: Diagonal Dynamic Slash ══════
      case "wireframe-premium-6":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 relative overflow-hidden font-sans">
            <div className="z-10 flex flex-col gap-1 -skew-x-6 transform">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[8px] font-black uppercase text-black" style={{ backgroundColor: theme.primaryNeon }}>
                  DYNAMIC PERFORMANCE
                </span>
                <span className="text-[9px] font-mono text-cyan-300">TURBO EDITION</span>
              </div>
              {renderTitleBox("p-2 bg-black/50 border border-cyan-400/30 rounded-lg", "text-white")}
            </div>
            <div className="flex-1 my-2 rounded-xl bg-black/40 border border-white/10 p-2 flex items-center justify-center relative shadow-2xl z-10 overflow-hidden -skew-x-3 transform">
              {renderPremiumImageDropzone(theme.primaryNeon, "Drop Performance Image")}
            </div>
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-2 shadow-2xl z-10 -skew-x-6 transform">
              {renderInlineProductName({
                className: "font-black text-xs sm:text-sm text-white",
                style: { color: "#FFFFFF" },
              })}
              <div className="transform -skew-x-6">
                {renderPriceBadge("", { backgroundColor: theme.primaryNeon, color: "#000000" })}
              </div>
            </div>
          </div>
        );

      // ══════ PREMIUM 7: Magazine Catalog ══════
      case "wireframe-premium-7":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 relative overflow-hidden font-sans border border-emerald-500/30">
            {/* Top Magazine Header */}
            <div className="border-b border-emerald-400/30 pb-1.5 z-10 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                <span>KRISHTECH LABS • VOL. 26</span>
                <span>ISSUE: ELECTRONICS</span>
                <span>VERIFIED TEST</span>
              </div>
              {renderTitleBox("p-1.5 bg-black/40 border border-white/10 rounded-lg", "text-white")}
            </div>

            {/* Editorial Showcase with Photo Canvas and Right Side Callout Cards */}
            <div className="flex-1 my-2 flex gap-2 items-stretch z-10 min-h-0 overflow-hidden">
              <div className="flex-1 rounded-lg bg-[#071F18]/90 border border-emerald-400/40 p-2 relative flex items-center justify-center shadow-2xl overflow-hidden">
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black flex flex-col items-center justify-center font-black text-[7px] leading-tight text-center shadow-lg border border-amber-200 z-20">
                  <Award className="w-3 h-3 text-black mb-0.5" />
                  CHOICE
                </div>
                {renderPremiumImageDropzone(theme.primaryNeon, "Drop Editorial Shot")}
              </div>

              {/* Side Callout Specs */}
              <div className="w-24 flex flex-col justify-between gap-1.5 py-1 shrink-0">
                <div className="p-1.5 rounded-sm bg-[#09261E] border border-emerald-400/30">
                  <span className="text-[7.5px] font-bold uppercase text-emerald-300 block">TOP PERFORMANCE</span>
                  <span className="text-[7px] text-gray-400">A++ Rating</span>
                </div>
                <div className="p-1.5 rounded-sm bg-[#09261E] border border-emerald-400/30">
                  <span className="text-[7.5px] font-bold uppercase text-emerald-300 block">SMART CONNECT</span>
                  <span className="text-[7px] text-gray-400">IoT Enabled</span>
                </div>
                <div className="p-1.5 rounded-sm bg-[#09261E] border border-emerald-400/30">
                  <span className="text-[7.5px] font-bold uppercase text-emerald-300 block">WARRANTY</span>
                  <span className="text-[7px] text-gray-400">Full Service</span>
                </div>
              </div>
            </div>

            {/* Bottom Barcode Plate & Editorial Price */}
            <div className="pt-2 border-t border-emerald-400/30 flex items-center justify-between gap-3 z-10">
              <div className="flex items-center gap-2 min-w-0">
                {/* Barcode Graphic */}
                <div className="flex items-center gap-0.5 h-6 px-1.5 bg-black/50 border border-emerald-500/30 rounded-xs shrink-0">
                  {[2, 4, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2].map((w, i) => (
                    <div key={i} className="h-4 bg-emerald-400" style={{ width: `${w}px` }} />
                  ))}
                </div>
                <div className="flex flex-col min-w-0">
                  {renderInlineProductName({
                    className: "font-black text-xs text-white",
                    style: { color: "#FFFFFF" },
                  })}
                  <span className="text-[8px] text-gray-400 truncate">KRISHTECH CERTIFIED LAB REPORT</span>
                </div>
              </div>

              {renderPriceBadge("", { backgroundColor: theme.primaryNeon, color: "#000000" })}
            </div>
          </div>
        );

      // ══════ PREMIUM 8: Gradient Glass ══════
      case "wireframe-premium-8":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 relative overflow-hidden font-sans">
            <div className="z-10 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase bg-white/10 backdrop-blur-md border border-white/20 text-white">
                  FROSTED GLASS ARCHITECTURE
                </span>
                <span className="text-[9px] font-mono text-pink-300">AESTHETIC</span>
              </div>
              {renderTitleBox("p-2 bg-black/40 border border-white/10 rounded-lg", "text-white")}
            </div>
            <div
              className="flex-1 my-2 rounded-2xl p-2 flex items-center justify-center relative shadow-2xl z-10 overflow-hidden backdrop-blur-md"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.25)",
                boxShadow: `0 0 20px ${theme.primaryNeon}30`,
              }}
            >
              {renderPremiumImageDropzone(theme.primaryNeon, "Drop Glass Showcase")}
            </div>
            <div
              className="p-3 rounded-xl border flex items-center justify-between gap-2 shadow-2xl z-10 backdrop-blur-md"
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "rgba(255,255,255,0.2)",
              }}
            >
              {renderInlineProductName({
                className: "font-black text-xs sm:text-sm text-white",
                style: { color: "#FFFFFF" },
              })}
              {renderPriceBadge("", { backgroundColor: theme.primaryNeon, color: "#000000" })}
            </div>
          </div>
        );

      // ══════ PREMIUM 9: Tech Matrix Specs ══════
      case "wireframe-premium-9":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 relative overflow-hidden font-mono text-yellow-300">
            {/* Top Hardware Spec Header */}
            <div className="border-b border-yellow-400/40 pb-1.5 z-10 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider text-yellow-400/80">
                <span>[SYS_SPEC: MATRIX-V9]</span>
                <span>CHIPSET: GEN-4</span>
                <span>STATUS: CERTIFIED</span>
              </div>
              {renderTitleBox("p-2 bg-[#171406] border border-yellow-400/40 rounded-xs", "text-yellow-400 uppercase font-black")}
            </div>

            {/* Central Viewport with 4 Crosshairs */}
            <div className="flex-1 my-2 rounded-xs bg-[#171406]/90 border border-yellow-400/50 p-2.5 relative flex items-center justify-center overflow-hidden z-10">
              <span className="absolute top-1 left-1 text-yellow-400 text-xs font-mono select-none">[+]</span>
              <span className="absolute top-1 right-1 text-yellow-400 text-xs font-mono select-none">[+]</span>
              <span className="absolute bottom-1 left-1 text-yellow-400 text-xs font-mono select-none">[+]</span>
              <span className="absolute bottom-1 right-1 text-yellow-400 text-xs font-mono select-none">[+]</span>
              {renderPremiumImageDropzone(theme.primaryNeon, "Drop Spec Component")}
            </div>

            {/* 4 Mini Spec Chips */}
            <div className="grid grid-cols-4 gap-1.5 z-10 mb-1">
              <div className="p-1 rounded-xs bg-[#1E1A08] border border-yellow-400/30 text-center">
                <span className="text-[7px] text-yellow-400/70 block uppercase font-bold">CORE</span>
                <span className="text-[8px] font-black text-yellow-300">GEN-4</span>
              </div>
              <div className="p-1 rounded-xs bg-[#1E1A08] border border-yellow-400/30 text-center">
                <span className="text-[7px] text-yellow-400/70 block uppercase font-bold">CLOCK</span>
                <span className="text-[8px] font-black text-yellow-300">4.8 GHZ</span>
              </div>
              <div className="p-1 rounded-xs bg-[#1E1A08] border border-yellow-400/30 text-center">
                <span className="text-[7px] text-yellow-400/70 block uppercase font-bold">SECURITY</span>
                <span className="text-[8px] font-black text-yellow-300">TPM 2.0</span>
              </div>
              <div className="p-1 rounded-xs bg-[#1E1A08] border border-yellow-400/30 text-center">
                <span className="text-[7px] text-yellow-400/70 block uppercase font-bold">RETAIL</span>
                <span className="text-[8px] font-black text-yellow-300 font-mono">₹{poster.price}/-</span>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="p-2 rounded-xs bg-[#141205] border border-yellow-400/30 flex items-center justify-between gap-2 z-10">
              {renderInlineProductName({
                className: "font-mono font-bold text-xs text-yellow-300",
                style: { color: poster.fontColor || "#FDE047" },
                subtext: "KRISHTECH MATRIX-V9 CERTIFIED",
                subtextClass: "text-[8px] text-yellow-400/70 block mt-0.5",
              })}
              {renderPriceBadge("", { backgroundColor: theme.primaryNeon, color: "#000000" })}
            </div>
          </div>
        );

      // ══════ PREMIUM 11: Asymmetric Duet ══════
      case "wireframe-premium-11":
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-[#081206] relative overflow-hidden font-sans text-white">
            {/* Top Panoramic Hero Frame (60% height) */}
            <div className="h-[58%] rounded-xl bg-[#0F220B]/90 border border-lime-400/40 p-2.5 relative flex flex-col justify-between overflow-hidden shadow-2xl z-10">
              <div className="flex items-center justify-between pb-1 z-10">
                <div className="px-2.5 py-0.5 rounded-full bg-lime-500/20 text-lime-300 border border-lime-400/40 text-[9px] font-bold uppercase">
                  ⭐ PANORAMIC SHOWCASE
                </div>
                {renderStoreBadge(theme.primaryNeon, "KrishTech Catalog", "PREMIUM DUET")}
              </div>

              <div className="flex-1 my-1 min-h-0">
                {renderPremiumImageDropzone(theme.primaryNeon, "Drop Panoramic Hero Image")}
              </div>

              <div className="z-10">
                {renderTitleBox("p-1.5 bg-black/60 backdrop-blur-xs rounded-lg border border-lime-400/30", "text-white uppercase font-black text-sm sm:text-base")}
              </div>
            </div>

            {/* Bottom Asymmetric Row: Left 7 cols Details + Right 5 cols Price Card */}
            <div className="grid grid-cols-12 gap-2 mt-2 z-10 flex-1 min-h-0">
              {/* Left Details Card (7 cols) */}
              <div className="col-span-7 p-2.5 rounded-xl bg-[#0D1D09] border border-lime-400/30 flex flex-col justify-between overflow-hidden">
                <div className="flex flex-col gap-1">
                  {renderInlineProductName({
                    className: "font-bold text-xs text-white",
                    style: { color: "#FFFFFF" },
                  })}
                  {poster.description ? (
                    renderDescriptionBox("p-1.5 rounded-lg border border-lime-400/20 text-[9.5px]")
                  ) : (
                    <span className="text-[9px] text-gray-300 leading-snug">
                      High-performance hardware with authorized warranty and support.
                    </span>
                  )}
                </div>
                <span className="text-[8px] text-lime-300/80 font-semibold truncate block mt-1">
                  ✓ Authorized KrishTech Product Guarantee
                </span>
              </div>

              {/* Right Electric Price Card (5 cols) */}
              <div className="col-span-5 p-2.5 rounded-xl bg-gradient-to-b from-lime-500 to-emerald-600 text-black flex flex-col justify-between items-center text-center shadow-lg">
                <span className="text-[8px] font-black uppercase tracking-wider text-black/70">EXCLUSIVE DEAL</span>
                {renderPriceBadge("font-mono font-black shadow-md", {
                  backgroundColor: "#000000",
                  color: "#BEF264",
                })}
                <span className="px-2 py-0.5 rounded-full bg-black text-lime-300 text-[8px] font-bold">ORDER TODAY</span>
              </div>
            </div>
          </div>
        );

      // ══════ PREMIUM 12: Holo Prism Diamond ══════
      case "wireframe-premium-12":
        return (
          <div
            className="flex-1 flex flex-col justify-between p-3.5 bg-[#070A18] relative overflow-hidden font-sans text-white"
            style={{
              border: "2px solid transparent",
              backgroundImage: "linear-gradient(#070A18, #070A18), linear-gradient(135deg, #FFFFFF, #67E8F9, #E879F9, #FACC15)",
              backgroundOrigin: "border-box",
              backgroundClip: "content-box, border-box",
            }}
          >
            {/* Header: Diamond Badge + Prism Headline */}
            <div className="z-10 text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/30 text-[9px] font-black uppercase tracking-widest text-cyan-300 mb-1">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>PRISM DIAMOND FLAGSHIP</span>
              </div>
              {renderTitleBox("p-1 bg-transparent border-none", "text-xl sm:text-2xl text-center text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-pink-400 font-black")}
            </div>

            {/* Prismatic Center Glass Card */}
            <div
              className="flex-1 my-2 rounded-2xl p-2.5 flex items-center justify-center relative shadow-2xl z-10"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                boxShadow: "0 0 25px rgba(103, 232, 249, 0.25)",
              }}
            >
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 border border-cyan-400/50 text-[8px] font-black tracking-widest text-white z-20">
                💎 CERTIFIED LUXURY
              </div>
              {renderPremiumImageDropzone(theme.primaryNeon, "Drop Prismatic Device Image")}
            </div>

            {/* Holographic Bottom Dock */}
            <div
              className="p-2.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xl z-10"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <div className="flex-1 min-w-0">
                {renderInlineProductName({
                  className: "font-bold text-xs sm:text-sm text-white",
                  style: { color: "#FFFFFF" },
                  subtext: "KrishTech Official • Iridescent Diamond Warranty",
                  subtextClass: "text-[9px] text-cyan-200/80 block mt-0.5 truncate",
                })}
              </div>
              {renderPriceBadge("", {
                background: "linear-gradient(135deg, #FFFFFF, #67E8F9, #E879F9)",
                color: "#000000",
              })}
            </div>
          </div>
        );

      // ══════ BLANK CANVAS DESIGN ══════
      case "blank":
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-transparent overflow-hidden gap-3">
            {renderTitleBox()}
            {renderDropzone("full")}
            <div className="flex flex-col gap-2">
              {renderProductNameBox()}
              {poster.description && renderDescriptionBox()}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-500">Price:</span>
                {renderPriceSection()}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex flex-col justify-between p-3 bg-transparent overflow-hidden gap-2">
            {renderTitleBox()}
            {renderDropzone("full")}
            <div
              className="flex items-center justify-between gap-2 p-2 rounded-lg border shadow-xs transition-colors"
              style={{
                backgroundColor: activeTheme.cardBg,
                borderColor: activeTheme.cardBorder,
              }}
            >
              {renderInlineProductName()}
              {renderPriceBadge()}
            </div>
          </div>
        );
    }
  };

  // ── Resolve Background Gradient / Color ──
  const resolvedBgStyle: React.CSSProperties | undefined = (() => {
    // 1. Explicit background image chosen by user
    if (poster.backgroundImage) {
      return {
        backgroundImage: `url(${poster.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }
    // 2. Explicit custom background color chosen by user via color picker
    if (poster.customBgColor && poster.customBgColor.trim() !== "") {
      const bgLower = poster.customBgColor.toLowerCase();
      if (bgLower === "#dbeafe" || poster.bgTypeId === "gradient-royal" || poster.bgTypeId === "royal-sky") {
        return {
          background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #BFDBFE 100%)",
          backgroundColor: "#DBEAFE",
        };
      }
      if (bgLower === "#d1fae5" || poster.bgTypeId === "gradient-emerald" || poster.bgTypeId === "fresh-mint") {
        return {
          background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)",
          backgroundColor: "#D1FAE5",
        };
      }
      if (bgLower === "#100920" || poster.bgTypeId === "gradient-cosmic" || poster.bgTypeId === "cosmic-night") {
        return {
          background: "linear-gradient(135deg, #1C1030 0%, #100920 50%, #080410 100%)",
          backgroundColor: "#100920",
        };
      }
      return { backgroundColor: poster.customBgColor };
    }
    // 3. Known background / theme presets:
    if (poster.bgTypeId === "gradient-royal" || poster.bgTypeId === "royal-sky") {
      return {
        background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #BFDBFE 100%)",
        backgroundColor: "#DBEAFE",
      };
    }
    if (poster.bgTypeId === "gradient-emerald" || poster.bgTypeId === "fresh-mint") {
      return {
        background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)",
        backgroundColor: "#D1FAE5",
      };
    }
    if (poster.bgTypeId === "gradient-cosmic" || poster.bgTypeId === "cosmic-night") {
      return {
        background: "linear-gradient(135deg, #1C1030 0%, #100920 50%, #080410 100%)",
        backgroundColor: "#100920",
      };
    }
    if (poster.bgTypeId === "clean-white") {
      return { backgroundColor: "#FFFFFF" };
    }
    if (poster.bgTypeId === "soft-cream") {
      return { backgroundColor: "#FDF2DC" };
    }
    const matchedBg = BACKGROUND_STYLES.find((b) => b.id === poster.bgTypeId);
    if (matchedBg?.colorHex) {
      return { backgroundColor: matchedBg.colorHex };
    }
    if (preset.customBgColor && poster.bgTypeId === preset.bgTypeId) {
      return { backgroundColor: preset.customBgColor };
    }
    return undefined;
  })();

  const isCustomBg = Boolean(resolvedBgStyle || poster.backgroundImage);

  const canvasInlineStyle: React.CSSProperties = {
    border: isCurrentPremium
      ? `2px solid ${activeAccent}`
      : isFormalTemplate
        ? `2px solid ${activeAccent}`
        : `${poster.borderThickness ?? preset.borderThickness ?? 4}px solid ${activeAccent}`,
    boxShadow: isNeonActive || effectiveShadow === "glow"
      ? `inset 0 0 18px ${activeAccent}80, inset 0 0 36px ${activeAccent}30`
      : undefined,
    filter: [
      poster.brightness !== undefined && poster.brightness !== 100 ? `brightness(${poster.brightness}%)` : null,
      poster.contrast !== undefined && poster.contrast !== 100 ? `contrast(${poster.contrast}%)` : null,
      poster.saturation !== undefined && poster.saturation !== 100 ? `saturate(${poster.saturation}%)` : null,
      poster.blurFilter !== undefined && poster.blurFilter > 0 ? `blur(${poster.blurFilter}px)` : null,
    ].filter(Boolean).join(" ") || undefined,
    fontFamily: currentFont.cssFamily,
    ...(resolvedBgStyle || {}),
    ...style,
  };

  const canvasBgClass = isCustomBg
    ? ""
    : isCurrentPremium
      ? `bg-gradient-to-b ${theme.bgGradient}`
      : currentBg.className;

  return (
    <div
      ref={ref}
      id="poster-canvas-render"
      onClick={(e) => {
        if (!readOnly) {
          const target = e.target as HTMLElement;

          // If click was inside a floating toolbar, ignore
          if (
            target.closest("[data-element-toolbar]") ||
            target.closest("[data-image-toolbar]") ||
            target.closest("[data-export-ignore]")
          ) {
            return;
          }

          // Check if an editable element was clicked
          const imageEl = target.closest("[data-image-container]");
          const stickerEl = target.closest("[data-sticker-id]");
          const titleEl = target.closest("[data-title-container]");
          const prodNameEl = target.closest("[data-product-name-container]");
          const priceEl = target.closest("[data-price-container]");
          const descEl = target.closest("[data-description-container]");
          const badgeEl = target.closest("[data-badge-container]");
          const logoEl = target.closest("[data-logo-container]");

          if (imageEl) {
            selectElement("image");
          } else if (stickerEl) {
            const sId = stickerEl.getAttribute("data-sticker-id");
            selectElement(sId ? `sticker:${sId}` : null);
          } else if (titleEl) {
            selectElement("title");
          } else if (prodNameEl) {
            selectElement("productName");
          } else if (priceEl) {
            selectElement("price");
          } else if (descEl) {
            selectElement("description");
          } else if (badgeEl) {
            selectElement("badge");
          } else if (logoEl) {
            selectElement("logo");
          } else {
            // Clicked anywhere on blank canvas background, padding, footer, etc.
            selectElement(null);
          }
        }
      }}
      className={`w-[420px] max-w-full aspect-[1/1.38] shadow-2xl flex flex-col justify-between transition-all duration-300 select-none overflow-hidden relative shrink-0 ${canvasBgClass} ${className}`}
      style={canvasInlineStyle}
    >
      {/* Dynamic Keyframes for Animation Studio */}
      <style>{`
        @keyframes renoteAnimFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes renoteAnimSlideIn_up {
          0% { transform: translateY(28px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes renoteAnimSlideIn_down {
          0% { transform: translateY(-28px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes renoteAnimSlideIn_left {
          0% { transform: translateX(28px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes renoteAnimSlideIn_right {
          0% { transform: translateX(-28px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes renoteAnimZoomIn {
          0% { transform: scale(0.82); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes renoteAnimShimmer {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.22) drop-shadow(0 0 8px ${activeAccent}); }
          100% { filter: brightness(1); }
        }
        @keyframes renoteAnimPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.025); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Strictly Clipped Internal Neon Aura (Inside Canvas Only) */}
      {(isNeonActive || effectiveShadow === "glow") && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at 50% 28%, ${activeAccent}18 0%, transparent 72%)`,
          }}
        />
      )}

      {/* Strictly Clipped Gradient Overlay */}
      {poster.gradientOverlay && poster.gradientOverlay !== "none" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[5] overflow-hidden transition-opacity duration-300"
          style={{
            opacity: (poster.gradientOpacity ?? 40) / 100,
            background:
              poster.gradientOverlay === "sunset"
                ? "linear-gradient(135deg, rgba(255, 107, 107, 0.45) 0%, rgba(255, 165, 0, 0.35) 50%, rgba(106, 17, 203, 0.45) 100%)"
                : poster.gradientOverlay === "aurora"
                  ? "linear-gradient(160deg, rgba(0, 242, 254, 0.35) 0%, rgba(79, 172, 254, 0.3) 50%, rgba(243, 85, 233, 0.4) 100%)"
                  : poster.gradientOverlay === "duotone"
                    ? `linear-gradient(45deg, ${activeAccent}50 0%, #111827 100%)`
                    : poster.gradientOverlay === "dark-vignette"
                      ? "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.75) 100%)"
                      : poster.gradientOverlay === "radial-shine"
                        ? "radial-gradient(ellipse at 50% 25%, rgba(255, 255, 255, 0.45) 0%, transparent 68%)"
                        : "none",
            mixBlendMode: poster.gradientOverlay === "radial-shine" ? "screen" : poster.gradientOverlay === "dark-vignette" ? "multiply" : "normal",
          }}
        />
      )}

      {/* Strictly Clipped Decorative Shapes & Design Accents */}
      {poster.decorativeShapes && poster.decorativeShapes !== "none" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[6] overflow-hidden select-none"
        >
          {poster.decorativeShapes === "corner-brackets" && (
            <>
              <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2 rounded-tl-sm pointer-events-none" style={{ borderColor: activeAccent }} />
              <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2 rounded-tr-sm pointer-events-none" style={{ borderColor: activeAccent }} />
              <div className="absolute bottom-11 left-2.5 w-5 h-5 border-b-2 border-l-2 rounded-bl-sm pointer-events-none" style={{ borderColor: activeAccent }} />
              <div className="absolute bottom-11 right-2.5 w-5 h-5 border-b-2 border-r-2 rounded-br-sm pointer-events-none" style={{ borderColor: activeAccent }} />
            </>
          )}
          {poster.decorativeShapes === "crosshairs" && (
            <>
              <div className="absolute top-3 left-3 text-xs font-mono font-bold leading-none select-none opacity-75 pointer-events-none" style={{ color: activeAccent }}>+</div>
              <div className="absolute top-3 right-3 text-xs font-mono font-bold leading-none select-none opacity-75 pointer-events-none" style={{ color: activeAccent }}>+</div>
              <div className="absolute bottom-12 left-3 text-xs font-mono font-bold leading-none select-none opacity-75 pointer-events-none" style={{ color: activeAccent }}>+</div>
              <div className="absolute bottom-12 right-3 text-xs font-mono font-bold leading-none select-none opacity-75 pointer-events-none" style={{ color: activeAccent }}>+</div>
            </>
          )}
          {poster.decorativeShapes === "floating-orbs" && (
            <>
              <div
                className="absolute -top-10 -left-10 w-36 h-36 rounded-full blur-2xl opacity-40 pointer-events-none"
                style={{ backgroundColor: activeAccent }}
              />
              <div
                className="absolute bottom-14 -right-10 w-40 h-40 rounded-full blur-2xl opacity-35 pointer-events-none"
                style={{ backgroundColor: `${activeAccent}99` }}
              />
            </>
          )}
          {poster.decorativeShapes === "dot-matrix" && (
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(${activeAccent} 1.5px, transparent 1.5px)`,
                backgroundSize: "16px 16px",
              }}
            />
          )}
          {poster.decorativeShapes === "geometric-accents" && (
            <>
              <div
                className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-25"
                style={{
                  background: `linear-gradient(135deg, transparent 50%, ${activeAccent} 50%)`,
                }}
              />
              <div
                className="absolute bottom-10 left-0 w-16 h-16 pointer-events-none opacity-20"
                style={{
                  background: `linear-gradient(315deg, transparent 50%, ${activeAccent} 50%)`,
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Dynamic Template Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {renderTemplateContent()}
      </div>

      {/* Placed Stickers Layer */}
      {poster.stickers && poster.stickers.length > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-30 overflow-hidden"
        >
          {poster.stickers.map((stk) => {
            const isSelected = !readOnly && activeSelectedStickerId === stk.id;
            const stickerWidth = stk.width || 105;

            return (
              <div
                key={stk.id}
                id={`poster-sticker-${stk.id}`}
                data-sticker-id={stk.id}
                onPointerDown={(e) => handleStickerPointerDown(e, stk)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!readOnly) selectElement(`sticker:${stk.id}`);
                }}
                className={`absolute select-none pointer-events-auto transition-[box-shadow] duration-150 ${readOnly ? "" : "cursor-grab active:cursor-grabbing group/sticker"
                  }`}
                style={{
                  left: `${stk.x}%`,
                  top: `${stk.y}%`,
                  width: `${stickerWidth}px`,
                  transform: `translate(-50%, -50%) rotate(${stk.rotation || 0}deg)`,
                  zIndex: isSelected ? 30 : 10,
                  touchAction: "none",
                }}
              >
                {/* Active selection outline & controls */}
                {isSelected && (
                  <div
                    data-html2canvas-ignore="true"
                    data-export-ignore="true"
                    className="absolute -inset-1.5 border-2 border-dashed border-[#FF5722] rounded-xl pointer-events-none z-40 shadow-[0_0_12px_rgba(255,87,34,0.35)]"
                  >
                    {/* Floating Toolbar for Selected Sticker */}
                    <div
                      data-element-toolbar="true"
                      data-export-ignore="true"
                      data-html2canvas-ignore="true"
                      className="pointer-events-auto absolute -top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-[#181B26]/95 dark:bg-[#12141D]/95 text-white backdrop-blur-md px-2 py-0.5 rounded-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPosterChange?.((prev) => ({
                            ...prev,
                            stickers: (prev.stickers || []).map((s) =>
                              s.id === stk.id ? { ...s, rotation: ((s.rotation || 0) - 15 + 360) % 360 } : s
                            ),
                          }));
                          onCommit?.();
                        }}
                        className="p-1 rounded-lg hover:bg-white/20 text-gray-200 hover:text-white transition-colors cursor-pointer"
                        title="Rotate Left (-15°)"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPosterChange?.((prev) => ({
                            ...prev,
                            stickers: (prev.stickers || []).map((s) =>
                              s.id === stk.id ? { ...s, rotation: ((s.rotation || 0) + 15) % 360 } : s
                            ),
                          }));
                          onCommit?.();
                        }}
                        className="p-1 rounded-lg hover:bg-white/20 text-gray-200 hover:text-white transition-colors cursor-pointer"
                        title="Rotate Right (+15°)"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <div className="w-px h-3 bg-white/20 mx-0.5" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSticker(stk.id);
                        }}
                        className="p-1 rounded-lg hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Delete Sticker"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Delete button (top-right) */}
                    <button
                      type="button"
                      data-sticker-handle="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSticker(stk.id);
                      }}
                      className="pointer-events-auto absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer z-50 border-2 border-white"
                      title="Remove sticker"
                    >
                      <Trash2 className="w-3 h-3 stroke-[2.5]" />
                    </button>

                    {/* Resize handle (bottom-right) */}
                    <div
                      data-sticker-handle="resize"
                      onPointerDown={(e) => handleResizePointerDown(e, stk)}
                      className="pointer-events-auto absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-[#FF5722] hover:bg-[#E64A19] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-nwse-resize z-50 border-2 border-white"
                      title="Drag to resize sticker"
                    >
                      <Move className="w-3 h-3 stroke-[2.5] rotate-45" />
                    </div>
                  </div>
                )}

                {/* Sticker SVG Badge */}
                <StickerBadge
                  id={stk.stickerId}
                  className="w-full h-auto drop-shadow-md select-none pointer-events-none"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Banner */}
      {isCurrentPremium ? (
        <div
          className={`py-2.5 px-4 text-center font-black text-white text-xs sm:text-sm flex items-center justify-center gap-1.5 tracking-wide select-none bg-gradient-to-r ${theme.bannerGrad} relative z-20 transition-all duration-300`}
          style={{ boxShadow: `0 0 20px ${theme.bannerGlow}` }}
        >
          <span>Design via reNote with</span>
          <span className="text-white inline-block drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]">
            {theme.heart}
          </span>
          <span>from Krishub</span>
        </div>
      ) : isFormalTemplate ? (
        <div
          className="py-2.5 px-4 text-center font-serif font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 tracking-wide select-none transition-colors relative z-20"
          style={{
            background: "linear-gradient(90deg, #100D09 0%, #22170A 50%, #100D09 100%)",
            color: "#FDE68A",
            borderTop: `1px solid ${activeAccent}60`,
          }}
        >
          <span>Design via reNote with</span>
          <span className="inline-block drop-shadow-xs text-amber-400">👑</span>
          <span>from Krishub</span>
        </div>
      ) : (
        <div
          className="py-2.5 px-4 text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 tracking-wide select-none transition-colors"
          style={{ backgroundColor: activeTheme.footerBg, color: activeTheme.footerText }}
        >
          <span>Design via reNote with</span>
          <span className="inline-block drop-shadow-xs">❤️</span>
          <span>from Krishub</span>
        </div>
      )}
    </div>
  );
});

export default PosterCanvasView;
