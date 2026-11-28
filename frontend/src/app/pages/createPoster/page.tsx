"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Store,
  Upload,
  Palette,
  Type,
  Image as ImageIcon,
  RefreshCw,
  Check,
  CheckCircle2,
  Heart,
  Camera,
  Save,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  FileImage,
  Sparkles,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Shield,
  Zap,
  Star,
  Award,
  Flame,
  Trash2,
  Plus,
  ZoomIn,
  ZoomOut,
  Move,
  Search,
  FileText,
  Copy,
  Globe,
  Sticker,
  Video,
  Play,
  Pause,
  RotateCcw,
  Film,
} from "lucide-react";
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import { exportPoster, exportAnimatedPosterAsVideo, exportAnimatedPosterAsGif } from "@utilis/posterExport";
import { useUser } from "@context/UserContext";
import apiClient, { clearApiCache } from "@utilis/apiClient";
import { API_ENDPOINTS, getPosterImageSrc } from "@constants/api";
import { PosterSticker, STICKER_LIST, StickerBadge } from "@components/PosterStickers";
import {
  PosterCanvasView,
  normalizePosterData,
  COLOR_THEMES,
  BACKGROUND_STYLES,
  getActiveTheme,
  isColorBright,
  sanitizePriceInput,
  validateAndSanitizePrice,
  formatDisplayPrice,
  getTemplatePreset,
} from "@components/PosterCanvasView";
import type { ColorTheme, BackgroundStyle } from "@components/PosterCanvasView";
import Header from "@components/header/page";
import PublishMarketplaceModal from "@components/PublishMarketplaceModal";

/* ── Brand Flame Logo SVG ── */
function BrandFlameLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="studioFlameGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E63900" />
          <stop offset="50%" stopColor="#FF5722" />
          <stop offset="100%" stopColor="#FFA100" />
        </linearGradient>
        <linearGradient id="studioFlameInner" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF5722" />
          <stop offset="100%" stopColor="#FFD54F" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C10.2 4.8 8.5 7.2 8.5 10.2C8.5 13 10.2 14.8 12 15.8C13.8 14.8 15.5 13 15.5 10.2C15.5 7.2 13.8 4.8 12 2Z"
        fill="url(#studioFlameInner)"
        opacity="0.95"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 22C16.6395 22 20.4 18.2395 20.4 13.6C20.4 8.87 16.2 5.2 12 1C7.8 5.2 3.6 8.87 3.6 13.6C3.6 18.2395 7.3605 22 12 22ZM12 18C14.43 18 16.4 16.03 16.4 13.6C16.4 10.85 14.2 8.65 12 6.45C9.8 8.65 7.6 10.85 7.6 13.6C7.6 16.03 9.57 18 12 18Z"
        fill="url(#studioFlameGrad)"
      />
    </svg>
  );
}

// ── Unified Color Themes & Background Styles used locally ──

// ── Font Family Options ──
export interface FontOption {
  id: string;
  name: string;
  description: string;
  cssFamily: string;
}

const FONT_OPTIONS: FontOption[] = [
  {
    id: "sans",
    name: "Modern Sans",
    description: "Clean & contemporary",
    cssFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
  {
    id: "impact",
    name: "Bold Impact",
    description: "Punchy display title",
    cssFamily: 'Impact, "Arial Black", sans-serif',
  },
  {
    id: "serif",
    name: "Stylized Serif",
    description: "Classic stylized headline",
    cssFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
  },
  {
    id: "mono",
    name: "Tech Monospace",
    description: "Modern developer",
    cssFamily: '"JetBrains Mono", Menlo, Consolas, monospace',
  },
  {
    id: "round",
    name: "Friendly Rounded",
    description: "Approachable & clean",
    cssFamily: 'Outfit, "Segoe UI", sans-serif',
  },
  {
    id: "geometric",
    name: "Geometric Display",
    description: "Commercial boldness",
    cssFamily: 'Montserrat, -apple-system, sans-serif',
  },
];

// ── Template Definitions with Rich Categories ──
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

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
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

// ── Sample Product Presets for Gallery ──
const SAMPLE_PRODUCT_IMAGES = [
  {
    title: "Gaming Laptop",
    url: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Smart Watch",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Wireless Headphones",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Smartphone Pro",
    url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Digital Camera",
    url: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Sneakers",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
  },
];

// ── 12 Distinct Futuristic Neon Themes for Premium Templates ──
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
  orbs: { color: string; pos: string; delay: string; size: string; anim: string }[];
}

const PREMIUM_THEMES: Record<string, PremiumTheme> = {
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
    orbs: [
      { color: "rgba(0, 229, 255, 0.35)", pos: "-top-16 -left-16", delay: "0s", size: "w-64 h-64", anim: "anim-orb-1" },
      { color: "rgba(56, 189, 248, 0.3)", pos: "top-1/3 -right-20", delay: "1.5s", size: "w-72 h-72", anim: "anim-orb-2" },
      { color: "rgba(96, 165, 250, 0.35)", pos: "-bottom-16 left-1/4", delay: "3s", size: "w-64 h-64", anim: "anim-orb-3" },
    ],
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
    orbs: [
      { color: "rgba(245, 158, 11, 0.25)", pos: "-top-16 -left-16", delay: "0s", size: "w-64 h-64", anim: "anim-orb-1" },
      { color: "rgba(252, 211, 77, 0.2)", pos: "top-1/3 -right-20", delay: "1.5s", size: "w-72 h-72", anim: "anim-orb-2" },
      { color: "rgba(217, 119, 6, 0.25)", pos: "-bottom-16 left-1/4", delay: "3s", size: "w-64 h-64", anim: "anim-orb-3" },
    ],
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
    orbs: [
      { color: "rgba(132, 204, 22, 0.35)", pos: "-top-16 -left-16", delay: "0s", size: "w-64 h-64", anim: "anim-orb-1" },
      { color: "rgba(16, 185, 129, 0.3)", pos: "top-1/3 -right-20", delay: "1.5s", size: "w-72 h-72", anim: "anim-orb-2" },
      { color: "rgba(52, 211, 153, 0.35)", pos: "-bottom-16 left-1/4", delay: "3s", size: "w-64 h-64", anim: "anim-orb-3" },
    ],
  },
  frame18: {
    id: "frame18",
    name: "Synthwave Sunset & Hot Pink",
    primaryNeon: "#EC4899",
    primaryGlow: "rgba(236, 72, 153, 0.75)",
    secondaryNeon: "#FB923C",
    secondaryGlow: "rgba(251, 146, 60, 0.65)",
    accentNeon: "#C084FC",
    accentGlow: "rgba(192, 132, 252, 0.55)",
    bgGradient: "from-[#1A0713] via-[#2A0D22] to-[#0D040A]",
    bannerGrad: "from-[#9333EA] via-[#EC4899] to-[#FB923C]",
    bannerGlow: "rgba(236, 72, 153, 0.7)",
    heart: "💖",
    logoGrad: ["#EC4899", "#C084FC", "#FB923C"],
    orbs: [
      { color: "rgba(236, 72, 153, 0.35)", pos: "-top-16 -left-16", delay: "0s", size: "w-64 h-64", anim: "anim-orb-1" },
      { color: "rgba(251, 146, 60, 0.3)", pos: "top-1/3 -right-20", delay: "1.5s", size: "w-72 h-72", anim: "anim-orb-2" },
      { color: "rgba(192, 132, 252, 0.35)", pos: "-bottom-16 left-1/4", delay: "3s", size: "w-64 h-64", anim: "anim-orb-3" },
    ],
  },
  frame19: {
    id: "frame19",
    name: "Deep Cosmic Ultra-Violet",
    primaryNeon: "#A855F7",
    primaryGlow: "rgba(168, 85, 247, 0.75)",
    secondaryNeon: "#E879F9",
    secondaryGlow: "rgba(232, 121, 249, 0.65)",
    accentNeon: "#6366F1",
    accentGlow: "rgba(99, 102, 241, 0.55)",
    bgGradient: "from-[#110724] via-[#1E0E3E] to-[#090414]",
    bannerGrad: "from-[#4C1D95] via-[#8B5CF6] to-[#E879F9]",
    bannerGlow: "rgba(139, 92, 246, 0.7)",
    heart: "💜",
    logoGrad: ["#A855F7", "#E879F9", "#6366F1"],
    orbs: [
      { color: "rgba(168, 85, 247, 0.35)", pos: "-top-16 -left-16", delay: "0s", size: "w-64 h-64", anim: "anim-orb-1" },
      { color: "rgba(232, 121, 249, 0.3)", pos: "top-1/3 -right-20", delay: "1.5s", size: "w-72 h-72", anim: "anim-orb-2" },
      { color: "rgba(99, 102, 241, 0.35)", pos: "-bottom-16 left-1/4", delay: "3s", size: "w-64 h-64", anim: "anim-orb-3" },
    ],
  },
  frame20: {
    id: "frame20",
    name: "Tron Turquoise & Glitch Coral",
    primaryNeon: "#06B6D4",
    primaryGlow: "rgba(6, 182, 212, 0.75)",
    secondaryNeon: "#F43F5E",
    secondaryGlow: "rgba(244, 63, 94, 0.65)",
    accentNeon: "#0891B2",
    accentGlow: "rgba(8, 145, 178, 0.55)",
    bgGradient: "from-[#05131A] via-[#0A222E] to-[#030A0E]",
    bannerGrad: "from-[#0E7490] via-[#06B6D4] to-[#F43F5E]",
    bannerGlow: "rgba(6, 182, 212, 0.7)",
    heart: "🩵",
    logoGrad: ["#06B6D4", "#22D3EE", "#F43F5E"],
    orbs: [
      { color: "rgba(6, 182, 212, 0.35)", pos: "-top-16 -left-16", delay: "0s", size: "w-64 h-64", anim: "anim-orb-1" },
      { color: "rgba(244, 63, 94, 0.3)", pos: "top-1/3 -right-20", delay: "1.5s", size: "w-72 h-72", anim: "anim-orb-2" },
      { color: "rgba(8, 145, 178, 0.35)", pos: "-bottom-16 left-1/4", delay: "3s", size: "w-64 h-64", anim: "anim-orb-3" },
    ],
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
    orbs: [
      { color: "rgba(16, 185, 129, 0.35)", pos: "-top-16 -left-16", delay: "0s", size: "w-64 h-64", anim: "anim-orb-1" },
      { color: "rgba(192, 132, 252, 0.3)", pos: "top-1/3 -right-20", delay: "1.5s", size: "w-72 h-72", anim: "anim-orb-2" },
      { color: "rgba(56, 189, 248, 0.35)", pos: "-bottom-16 left-1/4", delay: "3s", size: "w-64 h-64", anim: "anim-orb-3" },
    ],
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
    orbs: [
      { color: "rgba(239, 68, 68, 0.35)", pos: "-top-16 -left-16", delay: "0s", size: "w-64 h-64", anim: "anim-orb-1" },
      { color: "rgba(249, 115, 22, 0.3)", pos: "top-1/3 -right-20", delay: "1.5s", size: "w-72 h-72", anim: "anim-orb-2" },
      { color: "rgba(251, 191, 36, 0.35)", pos: "-bottom-16 left-1/4", delay: "3s", size: "w-64 h-64", anim: "anim-orb-3" },
    ],
  },
  frame23: {
    id: "frame23",
    name: "Cyberpunk 2077 Night City Yellow",
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
    orbs: [
      { color: "rgba(250, 204, 21, 0.35)", pos: "-top-16 -left-16", delay: "0s", size: "w-64 h-64", anim: "anim-orb-1" },
      { color: "rgba(0, 240, 255, 0.3)", pos: "top-1/3 -right-20", delay: "1.5s", size: "w-72 h-72", anim: "anim-orb-2" },
      { color: "rgba(255, 0, 85, 0.35)", pos: "-bottom-16 left-1/4", delay: "3s", size: "w-64 h-64", anim: "anim-orb-3" },
    ],
  },
  frame24: {
    id: "frame24",
    name: "Vaporwave Pastel Rose & Lilac",
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
    orbs: [
      { color: "rgba(251, 113, 133, 0.35)", pos: "-top-16 -left-16", delay: "0s", size: "w-64 h-64", anim: "anim-orb-1" },
      { color: "rgba(192, 132, 252, 0.3)", pos: "top-1/3 -right-20", delay: "1.5s", size: "w-72 h-72", anim: "anim-orb-2" },
      { color: "rgba(56, 189, 248, 0.35)", pos: "-bottom-16 left-1/4", delay: "3s", size: "w-64 h-64", anim: "anim-orb-3" },
    ],
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
    orbs: [
      { color: "rgba(163, 230, 53, 0.35)", pos: "-top-16 -left-16", delay: "0s", size: "w-64 h-64", anim: "anim-orb-1" },
      { color: "rgba(6, 182, 212, 0.3)", pos: "top-1/3 -right-20", delay: "1.5s", size: "w-72 h-72", anim: "anim-orb-2" },
      { color: "rgba(59, 130, 246, 0.35)", pos: "-bottom-16 left-1/4", delay: "3s", size: "w-64 h-64", anim: "anim-orb-3" },
    ],
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
    orbs: [
      { color: "rgba(255, 255, 255, 0.35)", pos: "-top-16 -left-16", delay: "0s", size: "w-64 h-64", anim: "anim-orb-1" },
      { color: "rgba(103, 232, 249, 0.35)", pos: "top-1/3 -right-20", delay: "1.5s", size: "w-72 h-72", anim: "anim-orb-2" },
      { color: "rgba(232, 121, 249, 0.35)", pos: "-bottom-16 left-1/4", delay: "3s", size: "w-64 h-64", anim: "anim-orb-3" },
    ],
  },
};

const getPremiumTheme = (templateId: string): PremiumTheme => {
  return PREMIUM_THEMES[templateId] || PREMIUM_THEMES.frame15;
};

// ── Color Theme Mappings for Sticker Gallery Animations ──
const STICKER_ANIMATION_THEMES: Record<string, { glow: string; border: string; bgSoft: string }> = {
  "mega-deal": {
    glow: "rgba(168, 85, 247, 0.45)",
    border: "rgba(168, 85, 247, 0.6)",
    bgSoft: "rgba(168, 85, 247, 0.12)",
  },
  "super-offer": {
    glow: "rgba(56, 189, 248, 0.45)",
    border: "rgba(56, 189, 248, 0.6)",
    bgSoft: "rgba(56, 189, 248, 0.12)",
  },
  "50-off": {
    glow: "rgba(239, 68, 68, 0.45)",
    border: "rgba(239, 68, 68, 0.6)",
    bgSoft: "rgba(239, 68, 68, 0.12)",
  },
  "best-price": {
    glow: "rgba(16, 185, 129, 0.45)",
    border: "rgba(16, 185, 129, 0.6)",
    bgSoft: "rgba(16, 185, 129, 0.12)",
  },
  "limited-time": {
    glow: "rgba(245, 158, 11, 0.45)",
    border: "rgba(245, 158, 11, 0.6)",
    bgSoft: "rgba(245, 158, 11, 0.12)",
  },
  "hot-sale": {
    glow: "rgba(255, 87, 34, 0.5)",
    border: "rgba(255, 87, 34, 0.65)",
    bgSoft: "rgba(255, 87, 34, 0.12)",
  },
  "top-seller": {
    glow: "rgba(59, 130, 246, 0.45)",
    border: "rgba(59, 130, 246, 0.6)",
    bgSoft: "rgba(59, 130, 246, 0.12)",
  },
  "special-offer": {
    glow: "rgba(236, 72, 153, 0.45)",
    border: "rgba(236, 72, 153, 0.6)",
    bgSoft: "rgba(236, 72, 153, 0.12)",
  },
  "new-arrival": {
    glow: "rgba(132, 204, 22, 0.45)",
    border: "rgba(132, 204, 22, 0.6)",
    bgSoft: "rgba(132, 204, 22, 0.12)",
  },
  "premium": {
    glow: "rgba(234, 179, 8, 0.5)",
    border: "rgba(234, 179, 8, 0.65)",
    bgSoft: "rgba(234, 179, 8, 0.12)",
  },
  "trending": {
    glow: "rgba(139, 92, 246, 0.45)",
    border: "rgba(139, 92, 246, 0.6)",
    bgSoft: "rgba(139, 92, 246, 0.12)",
  },
  "best-deal": {
    glow: "rgba(249, 115, 22, 0.45)",
    border: "rgba(249, 115, 22, 0.6)",
    bgSoft: "rgba(249, 115, 22, 0.12)",
  },
};

interface PosterState {
  title: string;
  productName: string;
  description: string;
  price: string;
  productImage: string;
  badgeText: string;
  companyLogo: string;
  // Template & Theme Options
  template: string; // e.g. "frame1", "frame2", "frame0"
  templateCategory: string; // e.g. "Classic", "Minimal", "Blank"
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
}

const DEFAULT_POSTER: PosterState = {
  title: "POSTER TITLE",
  productName: "Product Name",
  description: "",
  price: "",
  productImage: "",
  badgeText: "VERIFIED AUTHENTIC",
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
  isPublishedToMarketplace: false,
  publishedAt: null,
  publishedVersion: 0,
  marketplaceCategory: "Amazon",
  marketplaceSubcategory: "Electronics & Accessories",
  stickers: [],
};

function PosterStudioInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const posterId = searchParams.get("posterId");
  const effectivePosterId = searchParams.get("posterId") || searchParams.get("id");
  const isEditUrl = searchParams.get("edit") === "true";
  const isDuplicateUrl = searchParams.get("duplicate") === "true";
  const { isLoggedIn } = useUser();

  // Core Poster State
  const [poster, setPoster] = useState<PosterState>(DEFAULT_POSTER);
  const [history, setHistory] = useState<PosterState[]>([DEFAULT_POSTER]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Studio View & Canvas Scaling
  const [canvasZoom, setCanvasZoom] = useState<number>(0.85);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTemplatesCard, setShowTemplatesCard] = useState(true);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Auto-fit Poster calculation
  const calculateFitZoom = useCallback(() => {
    if (!mainContainerRef.current) return 0.85;
    const containerW = mainContainerRef.current.clientWidth;
    const containerH = mainContainerRef.current.clientHeight;
    if (!containerW || !containerH) return 0.85;

    const posterW = 420;
    const posterH = 580;

    // 24px horizontal clearance, 12px top clearance, 62px bottom clearance for floating dock pill
    const availW = Math.max(160, containerW - 24);
    const availH = Math.max(160, containerH - 74);

    const scaleX = availW / posterW;
    const scaleY = availH / posterH;
    const fitZoom = Math.min(scaleX, scaleY, 1.05);

    return Math.min(1.15, Math.max(0.45, Math.round(fitZoom * 100) / 100));
  }, []);

  // Auto-fit poster on initial mount, window resize, and when inspector sidebar toggles
  useEffect(() => {
    const applyFit = () => {
      const fit = calculateFitZoom();
      setCanvasZoom(fit);
    };

    const timer = setTimeout(applyFit, 60);
    window.addEventListener("resize", applyFit);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", applyFit);
    };
  }, [calculateFitZoom, showTemplatesCard]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Inspector & Template Search
  const [inspectorTab, setInspectorTab] = useState<"templates" | "content" | "styling" | "stickers">("templates");
  const inspectorScrollRef = useRef<HTMLDivElement>(null);

  // Scroll inspector to top smoothly whenever switching tabs
  useEffect(() => {
    if (inspectorScrollRef.current) {
      inspectorScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [inspectorTab]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [bouncingStickerId, setBouncingStickerId] = useState<string | null>(null);
  const [isImageSelected, setIsImageSelected] = useState<boolean>(false);
  const [titleDraft, setTitleDraft] = useState<string>(poster.title || "");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleSelectElement = useCallback((elementId: string | null) => {
    setSelectedElement(elementId);
    if (elementId === "image") {
      setIsImageSelected(true);
      setSelectedStickerId(null);
      setInspectorTab("content");
      setShowTemplatesCard(true);
    } else if (elementId?.startsWith("sticker:")) {
      const sId = elementId.replace("sticker:", "");
      setSelectedStickerId(sId);
      setIsImageSelected(false);
      setInspectorTab("stickers");
      setShowTemplatesCard(true);
    } else if (elementId === "title" || elementId === "productName" || elementId === "price" || elementId === "badge" || elementId === "description") {
      setIsImageSelected(false);
      setSelectedStickerId(null);
      setInspectorTab("content");
      setShowTemplatesCard(true);
    } else {
      setIsImageSelected(false);
      setSelectedStickerId(null);
    }
  }, []);

  // Keyboard Escape listener to deselect any selected element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSelectElement(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSelectElement]);

  // Sync draft title when poster.title changes externally (loading, undo/redo, template change)
  useEffect(() => {
    setTitleDraft(poster.title || "");
  }, [poster.title]);
  const [templateSearch, setTemplateSearch] = useState<string>("");
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>("all");
  const [expandedCategory, setExpandedCategory] = useState<string>("all");
  const [galleryTab, setGalleryTab] = useState<"standard" | "active">("active");

  // Top-Right & Palette Modals
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [paletteTab, setPaletteTab] = useState<"colors" | "backgrounds" | "fonts" | "styling">("colors");
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Saving / Downloading / Publishing States
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentPosterRecord, setCurrentPosterRecord] = useState<any>(null);
  const [savedPosterRecord, setSavedPosterRecord] = useState<any>(null);
  const [lastPublishedSnapshot, setLastPublishedSnapshot] = useState<any>(null);
  const isEditMode = Boolean(isEditUrl || effectivePosterId || currentPosterRecord?._id || savedPosterRecord?._id);

  // Price Validation State & Handlers
  const [priceError, setPriceError] = useState<string | null>(null);
  const priceErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerPriceError = useCallback((msg: string | null) => {
    if (priceErrorTimeoutRef.current) {
      clearTimeout(priceErrorTimeoutRef.current);
    }
    setPriceError(msg);
    if (msg) {
      priceErrorTimeoutRef.current = setTimeout(() => {
        setPriceError(null);
      }, 1500);
    }
  }, []);

  const handlePriceChange = useCallback(
    (rawVal: string) => {
      const result = validateAndSanitizePrice(rawVal);
      setPoster((prev) => ({ ...prev, price: result.value }));
      if (result.error) {
        triggerPriceError(result.error);
      } else {
        setPriceError(null);
      }
    },
    [triggerPriceError]
  );

  const handlePriceKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        triggerPriceError("invalid");
        return;
      }
      // Prevent negative sign
      if (e.key === "-") {
        e.preventDefault();
        triggerPriceError("invalid");
        return;
      }
      // Prevent non-numeric characters
      if (!/^[0-9.]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        triggerPriceError("invalid");
        return;
      }
      // Prevent exceeding maximum limit (8 integer digits)
      const intDigits = currentVal.split(".")[0];
      if (
        intDigits.length >= 8 &&
        e.currentTarget.selectionStart === e.currentTarget.selectionEnd &&
        /^[0-9]$/.test(e.key)
      ) {
        e.preventDefault();
        triggerPriceError("invalid");
        return;
      }
    },
    [poster.price, triggerPriceError]
  );

  // Dual Theme Support for Editor UI
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("poster_theme") || localStorage.getItem("spa_theme") || localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const handleThemeSync = () => {
      const saved = localStorage.getItem("poster_theme") || localStorage.getItem("spa_theme") || localStorage.getItem("theme");
      if (saved) {
        setIsDarkMode(saved === "dark");
      } else {
        setIsDarkMode(document.documentElement.classList.contains("dark"));
      }
    };
    handleThemeSync();
    window.addEventListener("themechange", handleThemeSync);
    window.addEventListener("storage", handleThemeSync);
    return () => {
      window.removeEventListener("themechange", handleThemeSync);
      window.removeEventListener("storage", handleThemeSync);
    };
  }, []);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveDropdownRef = useRef<HTMLDivElement>(null);

  // Close Save & Export dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (saveDropdownRef.current && !saveDropdownRef.current.contains(e.target as Node)) {
        setShowSaveDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSaveDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Camera Capture Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Gallery Modal State & Recent Uploads Cache
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [recentGalleryImages, setRecentGalleryImages] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("renote_poster_gallery") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });

  // Helper to safely format / resolve logo URLs
  const getLogoSrc = (logo: string | undefined): string => {
    if (!logo) return "/uploads/companies/default-company/logo-1779622107439-878996187.webp";
    if (logo.startsWith("data:") || logo.startsWith("blob:") || logo.startsWith("http://") || logo.startsWith("https://")) {
      return logo;
    }
    return getPosterImageSrc(logo);
  };

  // Selected template information memo (always reflects actual template name)
  const selectedTemplateInfo = useMemo(() => {
    if (poster.template === "frame0") {
      return { id: "frame0", name: "Blank Canvas Design", categoryLabel: "Blank", isPremium: false };
    }
    for (const cat of TEMPLATE_CATEGORIES) {
      const found = cat.templates.find((t) => t.id === poster.template);
      if (found) {
        return {
          id: found.id,
          name: found.name,
          categoryLabel: cat.label,
          isPremium: Boolean(cat.isPremium),
        };
      }
    }
    return {
      id: poster.template,
      name: poster.template ? poster.template.replace(/^frame/, "Design ") : "Standard Design",
      categoryLabel: poster.templateCategory || "Classic",
      isPremium: poster.templateCategory === "Premium",
    };
  }, [poster.template, poster.templateCategory]);

  // Robust Client-Side Image Processor (supports JPG, PNG, WebP, GIF, SVG, AVIF, BMP up to 20MB with high-performance downscaling)
  const validateAndProcessImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const validMimes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "image/avif",
        "image/bmp",
      ];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const validExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp"];

      const isImage = file.type.startsWith("image/") || validMimes.includes(file.type.toLowerCase()) || validExts.includes(ext);

      if (!isImage) {
        safeToastError("Invalid format. Please select an image (JPG, PNG, WebP, GIF, SVG).");
        return reject(new Error("Invalid format"));
      }

      if (file.size > 20 * 1024 * 1024) {
        safeToastError("Image file exceeds 20MB limit. Please choose a smaller file.");
        return reject(new Error("File too large"));
      }

      const reader = new FileReader();
      reader.onerror = () => {
        safeToastError("Failed to read image file. Please try again.");
        reject(new Error("Read failed"));
      };

      reader.onload = () => {
        const rawDataUrl = reader.result as string;

        // Keep SVGs and GIFs in raw format to retain vector fidelity & animation frames
        if (file.type === "image/svg+xml" || file.type === "image/gif" || ext === "svg" || ext === "gif") {
          resolve(rawDataUrl);
          return;
        }

        // Downscale oversized images so canvas, storage, and exports stay blazing fast
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          if (img.naturalWidth <= maxDim && img.naturalHeight <= maxDim && file.size <= 2 * 1024 * 1024) {
            resolve(rawDataUrl);
            return;
          }

          let { naturalWidth: width, naturalHeight: height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          const outFormat = file.type === "image/png" || ext === "png" ? "image/png" : "image/jpeg";
          const optimized = canvas.toDataURL(outFormat, 0.9);
          resolve(optimized);
        };

        img.onerror = () => {
          // If browser image decode fails, fallback to raw data URL
          resolve(rawDataUrl);
        };

        img.src = rawDataUrl;
      };

      reader.readAsDataURL(file);
    });
  };

  // Apply new product image to state and gallery cache
  const processAndSetImage = (dataUrl: string) => {
    setPoster((prev) => {
      const next = { ...prev, productImage: dataUrl };
      setHistory((prevH) => {
        const updated = prevH.slice(0, historyIdx + 1);
        updated.push(next);
        setHistoryIdx(updated.length - 1);
        return updated;
      });
      return next;
    });

    setRecentGalleryImages((prev) => {
      const filtered = prev.filter((img) => img !== dataUrl);
      const updated = [dataUrl, ...filtered].slice(0, 16);
      try {
        localStorage.setItem("renote_poster_gallery", JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  // Image Upload Handler with robust validation & processing
  // Background Image Upload Handler
  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await validateAndProcessImage(file);
        pushState({
          ...poster,
          backgroundImage: dataUrl,
        });
        safeToastSuccess("Background image applied! 🖼️");
      } catch (err) {
        console.error("Background image upload failed:", err);
      } finally {
        e.target.value = "";
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await validateAndProcessImage(file);
        processAndSetImage(dataUrl);
        handleSelectElement("image");
        safeToastSuccess("Product image updated successfully! 📷");
      } catch (err) {
        console.error("Image upload failed:", err);
      } finally {
        e.target.value = "";
      }
    }
  };

  // Drag and Drop Upload Handler supporting both files and web image links
  const handleImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Dropped physical image file
    const file = e.dataTransfer.files?.[0];
    if (file) {
      try {
        const dataUrl = await validateAndProcessImage(file);
        processAndSetImage(dataUrl);
        safeToastSuccess("Image dropped & applied to poster! 📷");
      } catch (err) {
        console.error("Drop image file failed:", err);
      }
      return;
    }

    // 2. Dropped image URL from web/search
    const uriList = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (uriList && (uriList.startsWith("http://") || uriList.startsWith("https://") || uriList.startsWith("data:image/"))) {
      processAndSetImage(uriList.trim());
      safeToastSuccess("Web image applied to poster! 🌐");
      return;
    }

    const html = e.dataTransfer.getData("text/html");
    if (html) {
      const match = html.match(/src=["'](https?:\/\/[^"']+)["']/i);
      if (match && match[1]) {
        processAndSetImage(match[1]);
        safeToastSuccess("Web image applied to poster! 🌐");
      }
    }
  };

  // Company Logo Upload Handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await validateAndProcessImage(file);
        setLogoLoadError(false);
        setPoster((prev) => {
          const next = { ...prev, companyLogo: dataUrl };
          setHistory((prevH) => {
            const updated = prevH.slice(0, historyIdx + 1);
            updated.push(next);
            setHistoryIdx(updated.length - 1);
            return updated;
          });
          return next;
        });
        safeToastSuccess("Company logo updated! 🏷️");
      } catch (err) {
        console.error("Logo upload failed:", err);
      } finally {
        e.target.value = "";
      }
    }
  };

  // Camera Stream Controls
  const handleOpenCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      safeToastError("Camera not accessible in this browser. Opening file selector.");
      cameraFileInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (err: any) {
      console.warn("Camera access denied or unavailable:", err);
      safeToastError("Camera permission denied or camera not available. Opening file selector instead.");
      cameraFileInputRef.current?.click();
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      processAndSetImage(dataUrl);
      safeToastSuccess("Photo captured successfully! 📸");
    }
    handleCloseCamera();
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((e) => console.warn("Video play error:", e));
    }
  }, [isCameraOpen, cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Toggle editor theme
  const toggleTheme = (dark: boolean) => {
    setIsDarkMode(dark);
    const themeStr = dark ? "dark" : "light";
    localStorage.setItem("poster_theme", themeStr);
    localStorage.setItem("spa_theme", themeStr);
    localStorage.setItem("theme", themeStr);
    if (typeof document !== "undefined") {
      if (dark) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        document.documentElement.style.colorScheme = "dark";
        document.body.classList.add("dark");
        document.body.classList.remove("light");
        document.body.style.backgroundColor = "#0D0E12";
        document.body.style.color = "#E0E2EC";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        document.documentElement.style.colorScheme = "light";
        document.body.classList.remove("dark");
        document.body.classList.add("light");
        document.body.style.backgroundColor = "#F8F9FC";
        document.body.style.color = "#111827";
      }
      window.dispatchEvent(new Event("themechange"));
    }
  };

  // Push to history safely merging with current state to preserve typed content across tabs
  const pushState = (newStateOrUpdater: Partial<PosterState> | ((prev: PosterState) => PosterState)) => {
    setPoster((current) => {
      const next: PosterState =
        typeof newStateOrUpdater === "function"
          ? newStateOrUpdater(current)
          : { ...current, ...newStateOrUpdater };

      setHistory((prev) => {
        const updated = prev.slice(0, historyIdx + 1);
        updated.push(next);
        return updated;
      });
      setHistoryIdx((prev) => prev + 1);
      return next;
    });
  };

  // Commit edits safely without stale closures (supports stickers, text, layout)
  const commitPosterState = () => {
    setPoster((current) => {
      setHistory((prevHistory) => {
        const last = prevHistory[historyIdx];
        if (last && JSON.stringify(last) === JSON.stringify(current)) {
          return prevHistory;
        }
        const updated = prevHistory.slice(0, historyIdx + 1);
        updated.push(current);
        setHistoryIdx(updated.length - 1);
        return updated;
      });
      return current;
    });
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      const targetPoster = history[prevIdx];
      setHistoryIdx(prevIdx);
      setPoster(targetPoster);
      if (selectedStickerId && !(targetPoster.stickers || []).some((s) => s.id === selectedStickerId)) {
        setSelectedStickerId(null);
      }
      safeToastSuccess("Undo");
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      const targetPoster = history[nextIdx];
      setHistoryIdx(nextIdx);
      setPoster(targetPoster);
      if (selectedStickerId && !(targetPoster.stickers || []).some((s) => s.id === selectedStickerId)) {
        setSelectedStickerId(null);
      }
      safeToastSuccess("Redo");
    }
  };

  const handleApplyTitle = (customVal?: string) => {
    const raw = customVal !== undefined ? customVal : titleDraft;
    const nextTitle = poster.isUppercase ? raw.toUpperCase() : raw;
    setTitleDraft(nextTitle);
    setPoster((prev) => {
      const next = { ...prev, title: nextTitle };
      pushState(next);
      return next;
    });
    safeToastSuccess("Applied poster title ✨");
  };

  const handleReset = () => {
    pushState(DEFAULT_POSTER);
    setSelectedStickerId(null);
    setTitleDraft(DEFAULT_POSTER.title || "");
    safeToastSuccess("Reset poster design to template");
  };

  // ── Sticker Operations ──
  const handleAddSticker = (stickerId: string) => {
    setBouncingStickerId(stickerId);
    setTimeout(() => {
      setBouncingStickerId((prev) => (prev === stickerId ? null : prev));
    }, 600);

    const stickerDef = STICKER_LIST.find((s) => s.id === stickerId);
    const existing = poster.stickers || [];
    const count = existing.length;
    const step = count % 6;
    const offsetX = step === 0 ? 0 : step % 2 === 1 ? step * 5 : -step * 5;
    const offsetY = step === 0 ? 0 : step % 2 === 1 ? step * 4 : -step * 4;

    const newSticker: PosterSticker = {
      id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      stickerId,
      x: Math.max(15, Math.min(85, 50 + offsetX)),
      y: Math.max(15, Math.min(85, 45 + offsetY)),
      width: stickerDef?.defaultWidth || 105,
      rotation: 0,
    };

    const nextPoster: PosterState = {
      ...poster,
      stickers: [...existing, newSticker],
    };
    pushState(nextPoster);
    setSelectedStickerId(newSticker.id);
    safeToastSuccess(`Added "${stickerDef?.name || "Sticker"}" to poster! ✨`);
  };

  const handleRemoveSticker = (stickerInstanceId: string) => {
    const nextStickers = (poster.stickers || []).filter((s) => s.id !== stickerInstanceId);
    const nextPoster: PosterState = {
      ...poster,
      stickers: nextStickers,
    };
    pushState(nextPoster);
    if (selectedStickerId === stickerInstanceId) {
      setSelectedStickerId(null);
    }
  };

  const handleClearAllStickers = () => {
    const nextPoster: PosterState = {
      ...poster,
      stickers: [],
    };
    pushState(nextPoster);
    setSelectedStickerId(null);
    safeToastSuccess("Cleared all stickers from poster");
  };

  const handleUpdateSelectedSticker = (patch: Partial<PosterSticker>, commit: boolean = false) => {
    if (!selectedStickerId) return;
    const nextStickers = (poster.stickers || []).map((s) =>
      s.id === selectedStickerId ? { ...s, ...patch } : s
    );
    if (commit) {
      pushState({ ...poster, stickers: nextStickers });
    } else {
      setPoster((prev) => ({ ...prev, stickers: nextStickers }));
    }
  };

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S, Delete/Backspace for stickers)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSavePoster();
      } else if (e.key === "Escape") {
        setShowSaveDropdown(false);
        setSelectedStickerId(null);
        setIsImageSelected(false);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const activeEl = document.activeElement;
        const isInput =
          activeEl &&
          (activeEl.tagName === "INPUT" ||
            activeEl.tagName === "TEXTAREA" ||
            (activeEl as HTMLElement).isContentEditable);
        if (!isInput) {
          if (selectedStickerId) {
            e.preventDefault();
            handleRemoveSticker(selectedStickerId);
          } else if (isImageSelected && poster.productImage) {
            e.preventDefault();
            setPoster((prev) => {
              const next = { ...prev, productImage: "" };
              pushState(next);
              return next;
            });
            setIsImageSelected(false);
            safeToastSuccess("Product image removed");
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIdx, history, poster, selectedStickerId, isImageSelected]);

  // Load user default company logo if creating new poster
  useEffect(() => {
    if (!posterId) {
      try {
        const savedLogo = localStorage.getItem("company_logo");
        const vendorCompaniesRaw = localStorage.getItem("vendor_companies");
        const vendorCompanies = vendorCompaniesRaw ? JSON.parse(vendorCompaniesRaw) : [];
        const firstCompanyLogo = vendorCompanies?.[0]?.logo;
        if (savedLogo) {
          setPoster((prev) => ({ ...prev, companyLogo: prev.companyLogo || savedLogo }));
        } else if (firstCompanyLogo) {
          setPoster((prev) => ({ ...prev, companyLogo: prev.companyLogo || getLogoSrc(firstCompanyLogo) }));
        }
      } catch { }
    }
  }, [posterId]);

  // Load existing poster if posterId or id provided in URL
  useEffect(() => {
    if (!effectivePosterId) return;

    const loadExistingPoster = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await apiClient.get(API_ENDPOINTS.POSTERS.GET_BY_ID(effectivePosterId), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          _skipCache: true,
        } as any);

        const data = res.data?.poster || res.data;
        if (data) {
          // If URL requested duplicate copy, clone into a new record with unique ID
          if (isDuplicateUrl) {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("user_id") || localStorage.getItem("authId");
            if (token && userId) {
              try {
                const dupRes = await apiClient.post(
                  API_ENDPOINTS.POSTERS.DUPLICATE(effectivePosterId),
                  { userId },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                const dupData = dupRes.data?.poster || dupRes.data;
                if (dupData?._id) {
                  clearApiCache();
                  const loadedDup: PosterState = normalizePosterData(dupData);
                  setPoster(loadedDup);
                  setHistory([loadedDup]);
                  setHistoryIdx(0);
                  setCurrentPosterRecord(dupData);
                  if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", `/pages/createPoster?posterId=${dupData._id}&edit=true`);
                  }
                  safeToastSuccess("Duplicated copy ready in editor! 🎨");
                  return;
                }
              } catch (dupErr) {
                console.warn("API duplicate failed on mount:", dupErr);
              }
            } else {
              // Guest mode duplicate
              const guestPosters = JSON.parse(localStorage.getItem("guest_posters") || "[]");
              const newId = `guest-${Date.now()}`;
              const sourceTitle = data.poster_title || data.poster_name || data.product_name || "Poster";
              const newCopy = {
                ...data,
                _id: newId,
                posterId: `POS-${guestPosters.length + 1}`,
                poster_name: `${sourceTitle} (Copy)`,
                poster_title: `${sourceTitle} (Copy)`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isPublishedToMarketplace: false,
                shareableLinkToken: null,
                shareableLinkId: null,
              };
              guestPosters.unshift(newCopy);
              localStorage.setItem("guest_posters", JSON.stringify(guestPosters));
              const loadedDup: PosterState = normalizePosterData(newCopy);
              setPoster(loadedDup);
              setHistory([loadedDup]);
              setHistoryIdx(0);
              setCurrentPosterRecord(newCopy);
              if (typeof window !== "undefined") {
                window.history.replaceState(null, "", `/pages/createPoster?posterId=${newId}&edit=true`);
              }
              safeToastSuccess("Duplicated copy ready in editor! 🎨");
              return;
            }
          }

          const loaded: PosterState = normalizePosterData(data);
          loaded.marketplaceCategory = data.marketplaceCategory || loaded.marketplaceCategory || "";
          loaded.marketplaceSubcategory = data.marketplaceSubcategory || loaded.marketplaceSubcategory || "";

          setPoster(loaded);
          setHistory([loaded]);
          setHistoryIdx(0);
          setCurrentPosterRecord(data);
          if (data.isPublishedToMarketplace) {
            setLastPublishedSnapshot(data);
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote poster, checking local storage...");
        try {
          const guestPosters = JSON.parse(localStorage.getItem("guest_posters") || "[]");
          const found = guestPosters.find((p: any) => p._id === effectivePosterId);
          if (found) {
            if (isDuplicateUrl) {
              const newId = `guest-${Date.now()}`;
              const sourceTitle = found.poster_title || found.poster_name || found.product_name || "Poster";
              const newCopy = {
                ...found,
                _id: newId,
                posterId: `POS-${guestPosters.length + 1}`,
                poster_name: `${sourceTitle} (Copy)`,
                poster_title: `${sourceTitle} (Copy)`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isPublishedToMarketplace: false,
                shareableLinkToken: null,
                shareableLinkId: null,
              };
              guestPosters.unshift(newCopy);
              localStorage.setItem("guest_posters", JSON.stringify(guestPosters));
              const loadedDup: PosterState = normalizePosterData(newCopy);
              setPoster(loadedDup);
              setHistory([loadedDup]);
              setHistoryIdx(0);
              setCurrentPosterRecord(newCopy);
              if (typeof window !== "undefined") {
                window.history.replaceState(null, "", `/pages/createPoster?posterId=${newId}&edit=true`);
              }
              safeToastSuccess("Duplicated copy ready in editor! 🎨");
              return;
            }

            const loaded: PosterState = normalizePosterData(found);
            loaded.marketplaceCategory = found.marketplaceCategory || loaded.marketplaceCategory || "";
            loaded.marketplaceSubcategory = found.marketplaceSubcategory || loaded.marketplaceSubcategory || "";

            setPoster(loaded);
            setHistory([loaded]);
            setHistoryIdx(0);
            setCurrentPosterRecord(found);
            if (found.isPublishedToMarketplace) {
              setLastPublishedSnapshot(found);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    loadExistingPoster();
  }, [effectivePosterId]);

  // Download high-resolution poster export (PNG, JPEG, PDF)
  const handleDownloadImage = async (format: "png" | "jpeg" | "pdf" = "png") => {
    if (!poster.productImage || !poster.productImage.trim()) {
      safeToastError("Please upload a product image before creating your poster.");
      return;
    }
    if (!canvasRef.current) return;
    try {
      setIsDownloading(true);
      setShowSaveDropdown(false);
      setSelectedStickerId(null);
      setIsImageSelected(false);
      // Wait for React re-render cycle so selection border & handles are removed before capture
      await new Promise((resolve) => setTimeout(resolve, 60));

      const cleanFileName = poster.productName || poster.title || "renote-poster";

      await exportPoster({
        element: canvasRef.current,
        format,
        fileName: cleanFileName,
      });
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownload = () => handleDownloadImage("png");

  // Export animated poster as MP4 video
  const handleExportVideo = async () => {
    if (!poster.productImage || !poster.productImage.trim()) {
      safeToastError("Please upload a product image before creating your poster.");
      return;
    }
    if (!canvasRef.current) return;
    try {
      setIsDownloading(true);
      setShowSaveDropdown(false);
      setSelectedStickerId(null);
      setIsImageSelected(false);
      setIsPlayingAnimation(true);
      await new Promise((resolve) => setTimeout(resolve, 80));

      const cleanFileName = poster.productName || poster.title || "renote-animated-poster";
      await exportAnimatedPosterAsVideo({
        element: canvasRef.current,
        fileName: cleanFileName,
        duration: poster.animationDuration || 2,
        fps: 15,
      });
    } catch (err) {
      console.error("Video export error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Export animated poster as GIF
  const handleExportGif = async () => {
    if (!poster.productImage || !poster.productImage.trim()) {
      safeToastError("Please upload a product image before creating your poster.");
      return;
    }
    if (!canvasRef.current) return;
    try {
      setIsDownloading(true);
      setShowSaveDropdown(false);
      setSelectedStickerId(null);
      setIsImageSelected(false);
      setIsPlayingAnimation(true);
      await new Promise((resolve) => setTimeout(resolve, 80));

      const cleanFileName = poster.productName || poster.title || "renote-animated-poster";
      await exportAnimatedPosterAsGif({
        element: canvasRef.current,
        fileName: cleanFileName,
        duration: poster.animationDuration || 2,
        fps: 12,
      });
    } catch (err) {
      console.error("GIF export error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Save / Update Poster Handler
  const handleSavePoster = async (forceNew: boolean = false, silent: boolean = false): Promise<any> => {
    if (isSaving) return null;

    if (titleDraft && titleDraft !== poster.title) {
      poster.title = poster.isUppercase ? titleDraft.toUpperCase() : titleDraft;
    }

    if (!poster.productImage || !poster.productImage.trim()) {
      safeToastError("Please upload a product image before creating your poster.");
      return null;
    }

    if (!poster.title?.trim()) {
      safeToastError("Please enter a poster title before saving.");
      return null;
    }
    if (!poster.productName?.trim()) {
      safeToastError("Please enter a product name before saving.");
      return null;
    }

    let effectivePrice = poster.price ? Number(poster.price) : 0;
    if (poster.price) {
      const priceValidation = validateAndSanitizePrice(poster.price);
      effectivePrice = priceValidation.value ? Number(priceValidation.value) : 0;
      if (priceValidation.value !== poster.price) {
        setPoster((prev) => ({ ...prev, price: priceValidation.value }));
      }
    }

    setIsSaving(true);
    setShowSaveDropdown(false);
    const userId = localStorage.getItem("user_id") || localStorage.getItem("authId");
    const token = localStorage.getItem("token");

    try {
      const payload = {
        poster_title: poster.title,
        poster_name: poster.title,
        product_name: poster.productName,
        product_description: poster.description,
        product_price: effectivePrice,
        product_image: poster.productImage,
        company_logo: poster.companyLogo,
        tags: [poster.badgeText].filter(Boolean),
        template: poster.template,
        templateCategory: poster.templateCategory,
        custom_colors: poster.customAccentColor,
        customAccentColor: poster.customAccentColor,
        customSecondaryColor: poster.customSecondaryColor || null,
        colorThemeId: poster.colorThemeId,
        bgTypeId: poster.bgTypeId,
        customBgColor: poster.customBgColor || null,
        backgroundImage: poster.backgroundImage || null,
        fontFamilyId: poster.fontFamilyId,
        fontColor: poster.fontColor || null,
        titleSize: poster.titleSize,
        isUppercase: poster.isUppercase,
        textAlign: poster.textAlign,
        borderThickness: poster.borderThickness,
        showPriceTag: poster.showPriceTag,
        imageZoom: poster.imageZoom,
        imagePosition: poster.imagePosition,
        logoZoom: poster.logoZoom,
        logo_zoom: poster.logoZoom,
        logoPosition: poster.logoPosition,
        logo_position: poster.logoPosition,
        showLogo: poster.showLogo,
        showBadge: poster.showBadge,
        neonEffect: poster.neonEffect,
        shadowEffect: poster.shadowEffect,
        shadowIntensity: poster.shadowIntensity,
        textOutline: poster.textOutline,
        textOutlineColor: poster.textOutlineColor,
        gradientOverlay: poster.gradientOverlay,
        gradientOpacity: poster.gradientOpacity,
        glassmorphism: poster.glassmorphism,
        decorativeShapes: poster.decorativeShapes,
        brightness: poster.brightness,
        contrast: poster.contrast,
        saturation: poster.saturation,
        blurFilter: poster.blurFilter,
        animationType: poster.animationType,
        animationDuration: poster.animationDuration,
        animationSpeed: poster.animationSpeed,
        animationDelay: poster.animationDelay,
        animationDirection: poster.animationDirection,
        animationTarget: poster.animationTarget,
        marketplaceCategory: poster.marketplaceCategory || "",
        marketplaceSubcategory: poster.marketplaceSubcategory || "",
        stickers: poster.stickers || [],
        company_id:
          (typeof currentPosterRecord?.company_id === "object" && currentPosterRecord?.company_id?._id
            ? String(currentPosterRecord.company_id._id)
            : currentPosterRecord?.company_id
              ? String(currentPosterRecord.company_id)
              : (typeof window !== "undefined" ? sessionStorage.getItem("selectedPosterCompany") : null)) || null,
      };

      const targetUpdateId =
        (!forceNew && (effectivePosterId || currentPosterRecord?._id || currentPosterRecord?.posterId)) || null;
      const isUpdating = Boolean(targetUpdateId);

      if (isLoggedIn && userId && token) {
        if (isUpdating && targetUpdateId) {
          const res = await apiClient.put(API_ENDPOINTS.POSTERS.UPDATE_POSTER(targetUpdateId), payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const updated = res.data?.poster || res.data;
          const savedId = updated?.posterId || updated?._id || targetUpdateId;
          const nowIso = new Date().toISOString();
          const refreshedPosterRecord = {
            ...currentPosterRecord,
            ...updated,
            ...payload,
            _id: savedId,
            updatedAt: updated?.updatedAt || nowIso,
            createdAt: updated?.createdAt || currentPosterRecord?.createdAt,
          };
          setCurrentPosterRecord(refreshedPosterRecord);
          if (updated?.isPublishedToMarketplace) {
            setLastPublishedSnapshot(updated);
          }
          clearApiCache();
          if (!silent) {
            safeToastSuccess("Poster updated successfully! ✅");
            try {
              sessionStorage.setItem("poster_success_toast", "Poster updated successfully! ✅");
              sessionStorage.removeItem("selectedPosterCompany");
            } catch { }
            router.push("/pages/poster");
          }
          return updated;
        } else {
          const res = await apiClient.post(API_ENDPOINTS.POSTERS.CREATE_POSTER(userId), payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const created = res.data?.poster || res.data;
          const savedId = res.data?.posterId || created?.posterId || created?._id || "Saved";
          setCurrentPosterRecord(created || { ...payload, _id: savedId });
          clearApiCache();
          if (!silent) {
            safeToastSuccess(`New poster saved to your catalog! (ID: ${savedId}) 🎉`);
          }
          // Seamlessly update URL to edit mode with the real saved ID so reload persists
          if (typeof window !== "undefined") {
            const nextUrl = `/pages/createPoster?posterId=${savedId}&edit=true`;
            window.history.replaceState(null, "", nextUrl);
          }
          return created;
        }
      } else {
        const guestPosters = JSON.parse(localStorage.getItem("guest_posters") || "[]");
        const existingIdx = forceNew ? -1 : guestPosters.findIndex((p: any) => p._id === (targetUpdateId || effectivePosterId));
        const existingRecord = existingIdx >= 0 ? guestPosters[existingIdx] : null;
        const newRecord = {
          _id: forceNew ? `guest-${Date.now()}` : (targetUpdateId || `guest-${Date.now()}`),
          ...payload,
          createdAt: existingRecord?.createdAt || currentPosterRecord?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isHeart: existingRecord?.isHeart ?? currentPosterRecord?.isHeart ?? false,
        };

        if (existingIdx >= 0) {
          guestPosters[existingIdx] = { ...guestPosters[existingIdx], ...newRecord };
        } else {
          guestPosters.unshift(newRecord);
        }

        localStorage.setItem("guest_posters", JSON.stringify(guestPosters));
        setCurrentPosterRecord(newRecord);
        if (!silent) {
          if (isUpdating && !forceNew) {
            safeToastSuccess("Poster updated successfully! 💾");
            try {
              sessionStorage.setItem("poster_success_toast", "Poster updated successfully! 💾");
            } catch { }
            router.push("/pages/poster");
          } else {
            safeToastSuccess(forceNew ? "New copy saved to local storage! 💾" : "Poster saved successfully to local storage! 💾");
          }
        }
        return newRecord;
      }
    } catch (err: any) {
      console.error("Save error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to save poster";
      safeToastError(msg);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Whether poster is already published to marketplace
  const isAlreadyPublished = Boolean(poster.isPublishedToMarketplace || currentPosterRecord?.isPublishedToMarketplace);

  // Computes whether current editor state has unpublished modifications compared to last publish
  const hasUnpublishedChanges = useMemo(() => {
    if (!isAlreadyPublished) return true;
    const snapshot = lastPublishedSnapshot || currentPosterRecord;
    if (!snapshot) return false;

    const currentProps = {
      title: (poster.title || "").trim(),
      productName: (poster.productName || "").trim(),
      description: (poster.description || "").trim(),
      price: Number(poster.price || 0),
      productImage: poster.productImage || "",
      companyLogo: poster.companyLogo || "",
      template: poster.template || "classic",
      templateCategory: poster.templateCategory || "All",
      colorThemeId: poster.colorThemeId || "amber",
      customAccentColor: poster.customAccentColor || "",
      customSecondaryColor: poster.customSecondaryColor || "",
      bgTypeId: poster.bgTypeId || "clean-white",
      customBgColor: poster.customBgColor || "",
      backgroundImage: poster.backgroundImage || "",
      neonEffect: Boolean(poster.neonEffect),
      marketplaceCategory: poster.marketplaceCategory || "",
      marketplaceSubcategory: poster.marketplaceSubcategory || "",
      marketplaceCity: poster.marketplaceCity || "",
      contactPhone: poster.contactPhone || "",
      whatsappNumber: poster.whatsappNumber || "",
      marketplacePrice: Number(poster.marketplacePrice ?? poster.price ?? 0),
    };

    const snapshotProps = {
      title: (snapshot.poster_title || snapshot.poster_name || snapshot.title || "").trim(),
      productName: (snapshot.product_name || snapshot.productName || "").trim(),
      description: (snapshot.product_description || snapshot.description || "").trim(),
      price: Number(snapshot.product_price ?? snapshot.price ?? 0),
      productImage: snapshot.product_image || snapshot.productImage || "",
      companyLogo: snapshot.company_logo || snapshot.companyLogo || "",
      template: snapshot.template || "classic",
      templateCategory: snapshot.templateCategory || "All",
      colorThemeId: snapshot.colorThemeId || "amber",
      customAccentColor: snapshot.custom_colors || snapshot.customAccentColor || "",
      customSecondaryColor: snapshot.customSecondaryColor || "",
      bgTypeId: snapshot.bgTypeId || "clean-white",
      customBgColor: snapshot.customBgColor || snapshot.custom_bg_color || "",
      backgroundImage: snapshot.backgroundImage || snapshot.background_image || "",
      neonEffect: Boolean(snapshot.neonEffect),
      marketplaceCategory: snapshot.marketplaceCategory || "",
      marketplaceSubcategory: snapshot.marketplaceSubcategory || "",
      marketplaceCity: snapshot.marketplaceCity || "",
      contactPhone: snapshot.contactPhone || "",
      whatsappNumber: snapshot.whatsappNumber || "",
      marketplacePrice: Number(snapshot.marketplacePrice ?? snapshot.product_price ?? snapshot.price ?? 0),
    };

    return JSON.stringify(currentProps) !== JSON.stringify(snapshotProps);
  }, [poster, lastPublishedSnapshot, currentPosterRecord, isAlreadyPublished]);

  // Formatted data passed to PublishMarketplaceModal
  const modalPosterData = useMemo(() => {
    const base = savedPosterRecord || currentPosterRecord || {};
    const resolvedId =
      effectivePosterId ||
      base?._id ||
      base?.posterId ||
      currentPosterRecord?._id ||
      currentPosterRecord?.posterId;

    return {
      ...base,
      ...poster,
      _id: resolvedId,
      posterId: resolvedId,
      poster_title: poster.title,
      product_name: poster.productName,
      product_description: poster.description,
      product_price: poster.price ? Number(poster.price) : 0,
      product_image: poster.productImage,
      company_logo: poster.companyLogo,
      template: poster.template,
      templateCategory: poster.templateCategory,
      custom_colors: poster.customAccentColor,
      colorThemeId: poster.colorThemeId,
      bgTypeId: poster.bgTypeId,
      customBgColor: poster.customBgColor,
      backgroundImage: poster.backgroundImage,
      neonEffect: poster.neonEffect,
      shadowEffect: poster.shadowEffect,
      shadowIntensity: poster.shadowIntensity,
      textOutline: poster.textOutline,
      textOutlineColor: poster.textOutlineColor,
      gradientOverlay: poster.gradientOverlay,
      gradientOpacity: poster.gradientOpacity,
      glassmorphism: poster.glassmorphism,
      decorativeShapes: poster.decorativeShapes,
      brightness: poster.brightness,
      contrast: poster.contrast,
      saturation: poster.saturation,
      blurFilter: poster.blurFilter,
      animationType: poster.animationType,
      animationDuration: poster.animationDuration,
      animationSpeed: poster.animationSpeed,
      animationDelay: poster.animationDelay,
      animationDirection: poster.animationDirection,
      animationTarget: poster.animationTarget,
      isPublishedToMarketplace: isAlreadyPublished,
      _hasPendingContentChanges: hasUnpublishedChanges,
    };
  }, [currentPosterRecord, savedPosterRecord, poster, effectivePosterId, isAlreadyPublished, hasUnpublishedChanges]);

  // Handles post-publish state updates from modal
  const handlePublishSuccess = (updatedPoster: any) => {
    const isPub = Boolean(updatedPoster?.isPublishedToMarketplace);
    setPoster((p) => ({
      ...p,
      isPublishedToMarketplace: isPub,
      publishedAt: updatedPoster?.publishedAt,
      publishedVersion: updatedPoster?.publishedVersion,
      marketplaceCategory: updatedPoster?.marketplaceCategory || p.marketplaceCategory,
      marketplaceSubcategory: updatedPoster?.marketplaceSubcategory || p.marketplaceSubcategory,
      marketplaceCity: updatedPoster?.marketplaceCity || p.marketplaceCity,
      contactPhone: updatedPoster?.contactPhone || p.contactPhone,
      whatsappNumber: updatedPoster?.whatsappNumber || p.whatsappNumber,
      marketplacePrice: updatedPoster?.marketplacePrice !== undefined ? updatedPoster.marketplacePrice : p.marketplacePrice,
    }));
    setCurrentPosterRecord((prev: any) => ({
      ...prev,
      ...updatedPoster,
    }));
    setSavedPosterRecord((prev: any) => ({
      ...prev,
      ...updatedPoster,
    }));
    setLastPublishedSnapshot(updatedPoster);
    // If unpublished, close modal; if published, let PublishMarketplaceModal display its success dialog
    if (!isPub) {
      setShowPublishModal(false);
    }
  };

  // Opens publishing flow with validation and auto-save if needed
  const handleOpenPublishFlow = async () => {
    if (isPublishing || isSaving) return;

    if (!poster.productImage || !poster.productImage.trim()) {
      safeToastError("Please upload a product image before creating your poster.");
      return;
    }

    if (!poster.title?.trim()) {
      safeToastError("Please enter a poster title before publishing to Marketplace.");
      return;
    }
    if (!poster.productName?.trim()) {
      safeToastError("Please enter a product name before publishing to Marketplace.");
      return;
    }

    if (!isLoggedIn) {
      safeToastError("Please sign in or create an account to publish posters to the Marketplace.");
      return;
    }

    const currentId = effectivePosterId || currentPosterRecord?._id || savedPosterRecord?._id;
    // Save to catalog first if not yet created in the database
    if (!currentId) {
      try {
        safeToastSuccess("Saving poster to catalog first before publishing...");
        const saved = await handleSavePoster(false, true);
        if (saved) {
          setSavedPosterRecord(saved);
          setShowPublishModal(true);
        }
      } catch {
        safeToastError("Could not save poster before publishing. Please try again.");
      }
      return;
    }

    setShowPublishModal(true);
  };

  // Active theme, background, and font objects
  const activeTheme = getActiveTheme(poster);
  const currentTheme = activeTheme;
  const currentBg =
    BACKGROUND_STYLES.find(
      (b) =>
        b.id === poster.bgTypeId ||
        (b.id === "gradient-royal" && poster.bgTypeId === "royal-sky") ||
        (b.id === "gradient-emerald" && poster.bgTypeId === "fresh-mint") ||
        (b.id === "gradient-cosmic" && poster.bgTypeId === "cosmic-night") ||
        (b.id === "deep-teal" && poster.bgTypeId === "slate-dark") ||
        (b.id === "dusty-rose" && poster.bgTypeId === "obsidian-black")
    ) || BACKGROUND_STYLES[0];
  const currentFont =
    FONT_OPTIONS.find((f) => f.id === poster.fontFamilyId) || FONT_OPTIONS[0];

  const STANDARD_ACCENT = "#FF5722";

  const isCurrentPremium =
    poster.templateCategory === "Premium" &&
    poster.template.startsWith("frame") &&
    parseInt(poster.template.replace("frame", "")) >= 15 &&
    parseInt(poster.template.replace("frame", "")) <= 26;

  const activeAccent = isCurrentPremium
    ? getPremiumTheme(poster.template).primaryNeon
    : (poster.customAccentColor || activeTheme.primary || STANDARD_ACCENT);

  // Title font size class
  const getTitleSizeClass = () => {
    switch (poster.titleSize) {
      case "sm":
        return "text-lg sm:text-xl";
      case "md":
        return "text-xl sm:text-2xl";
      case "lg":
        return "text-2xl sm:text-3xl";
      case "xl":
        return "text-3xl sm:text-4xl";
      default:
        return "text-2xl sm:text-3xl";
    }
  };

  // Helper to determine the layout structure from template ID
  const getTemplateLayoutType = (templateId: string): string => {
    if (templateId === "frame0") return "blank";
    for (const cat of TEMPLATE_CATEGORIES) {
      const found = cat.templates.find((t) => t.id === templateId);
      if (found) return found.type;
    }
    const legacyLayouts: Record<string, string> = {
      frame107: "wireframe-10",
      frame16: "wireframe-premium-2",
      frame17: "wireframe-premium-3",
      frame19: "wireframe-premium-5",
      frame22: "wireframe-premium-8",
      frame110: "wireframe-formal-1",
    };
    if (legacyLayouts[templateId]) return legacyLayouts[templateId];
    return poster.templateCategory === "Premium" ? "wireframe-premium-1" : "wireframe-6";
  };

  // Renders the mini wireframe diagrams matching the reference screenshot cards
  const renderMiniWireframe = (type: string, isSelected: boolean) => {
    const wireColor = STANDARD_ACCENT;

    switch (type) {
      case "wireframe-1":
        // Card 1: Top bar, 3 lines on left, image box on right, bottom bar
        return (
          <div className="w-full h-full flex flex-col justify-between py-1 px-0.5">
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor, opacity: isSelected ? 1 : 0.8 }}
            />
            <div className="flex items-center justify-between gap-1.5 my-1.5">
              <div className="flex flex-col gap-1 flex-1">
                <div className="h-1 w-full rounded-full" style={{ backgroundColor: wireColor, opacity: 0.6 }} />
                <div className="h-1 w-4/5 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.5 }} />
                <div className="h-1 w-3/5 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.4 }} />
              </div>
              <div
                className="w-5 h-7 rounded-md shrink-0 transition-colors"
                style={{
                  backgroundColor: `${wireColor}25`,
                  border: `1px solid ${wireColor}50`,
                }}
              />
            </div>
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor, opacity: isSelected ? 1 : 0.8 }}
            />
          </div>
        );

      case "wireframe-2":
        // Card 2: Top bar, soft box on left, 3 lines on right, bottom bar
        return (
          <div className="w-full h-full flex flex-col justify-between py-1 px-0.5">
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor, opacity: isSelected ? 1 : 0.85 }}
            />
            <div className="flex items-center justify-between gap-1.5 my-1.5">
              <div
                className="w-5 h-7 rounded-md shrink-0 transition-colors"
                style={{
                  backgroundColor: `${wireColor}25`,
                  border: `1px solid ${wireColor}50`,
                }}
              />
              <div className="flex flex-col gap-1 flex-1">
                <div className="h-1 w-full rounded-full" style={{ backgroundColor: wireColor, opacity: 0.7 }} />
                <div className="h-1 w-4/5 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.6 }} />
                <div className="h-1 w-3/5 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.5 }} />
              </div>
            </div>
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor, opacity: isSelected ? 1 : 0.85 }}
            />
          </div>
        );

      case "wireframe-3":
        // Card 3: Top bar, middle wide image area, bottom split/lines, bottom bar
        return (
          <div className="w-full h-full flex flex-col justify-between py-1 px-0.5">
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor, opacity: isSelected ? 1 : 0.8 }}
            />
            <div
              className="w-full h-5 rounded-md my-0.5 flex items-center justify-center p-0.5 transition-colors"
              style={{
                backgroundColor: `${wireColor}20`,
                border: `1.5px solid ${wireColor}60`,
              }}
            >
              <div
                className="w-3.5 h-2 rounded-xs"
                style={{ backgroundColor: wireColor, opacity: 0.9 }}
              />
            </div>
            <div className="flex items-center gap-1 my-0.5">
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="h-1 w-full rounded-full" style={{ backgroundColor: wireColor, opacity: 0.65 }} />
                <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.5 }} />
              </div>
              <div
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: wireColor, opacity: 0.8 }}
              />
            </div>
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor, opacity: isSelected ? 1 : 0.8 }}
            />
          </div>
        );

      case "wireframe-4":
        // Card 4: Top bar, wide banner with inner inset strip, bottom bar
        return (
          <div className="w-full h-full flex flex-col justify-between py-1 px-0.5">
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor, opacity: isSelected ? 1 : 0.8 }}
            />
            <div
              className="w-full h-7 rounded-md my-1.5 flex items-center justify-center p-1 transition-colors"
              style={{
                backgroundColor: `${wireColor}20`,
                border: `1px solid ${wireColor}40`,
              }}
            >
              <div
                className="w-4/5 h-2 rounded-xs"
                style={{
                  backgroundColor: wireColor,
                  opacity: 0.9,
                }}
              />
            </div>
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor, opacity: isSelected ? 1 : 0.8 }}
            />
          </div>
        );

      case "wireframe-5":
        // Card 5: Top bar, centered card box inside background, bottom bar
        return (
          <div className="w-full h-full flex flex-col justify-between py-1 px-0.5">
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor, opacity: isSelected ? 1 : 0.8 }}
            />
            <div
              className="w-full h-7 rounded-md my-1.5 flex items-center justify-center transition-colors"
              style={{
                backgroundColor: `${wireColor}18`,
                border: `1px solid ${wireColor}40`,
              }}
            >
              <div
                className="w-5 h-3.5 rounded-xs"
                style={{
                  backgroundColor: wireColor,
                  opacity: 0.85,
                }}
              />
            </div>
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor, opacity: isSelected ? 1 : 0.8 }}
            />
          </div>
        );

      case "wireframe-6":
        // Card 6: Top bar, middle: [left tall dropzone | right: logo square + 2 lines], bottom: wide description block, bottom bar
        return (
          <div className="w-full h-full flex flex-col justify-between py-1 px-0.5">
            {/* Top Bar */}
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor, opacity: isSelected ? 1 : 0.8 }}
            />
            {/* Middle Section: Left tall block, Right square + lines */}
            <div className="flex-1 flex flex-col gap-0.5 my-0.5">
              <div className="flex-1 flex gap-1 items-stretch">
                {/* Left tall dropzone */}
                <div
                  className="flex-1 rounded-xs"
                  style={{
                    backgroundColor: `${wireColor}25`,
                    border: `1.5px solid ${wireColor}60`,
                  }}
                />
                {/* Right col: square + lines */}
                <div className="w-3.5 flex flex-col justify-between gap-0.5">
                  <div
                    className="w-3.5 h-3.5 rounded-xs"
                    style={{ backgroundColor: wireColor, opacity: 0.9 }}
                  />
                  <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: wireColor, opacity: 0.7 }} />
                  <div className="h-0.5 w-3/4 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.6 }} />
                </div>
              </div>
              {/* Wide description block */}
              <div
                className="h-2 w-full rounded-xs"
                style={{
                  backgroundColor: `${wireColor}20`,
                  border: `1px solid ${wireColor}40`,
                }}
              />
            </div>
            {/* Bottom Bar */}
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor, opacity: isSelected ? 1 : 0.8 }}
            />
          </div>
        );

      case "wireframe-7":
        // Spotlight Hero: Top badge, prominent hero showcase, bottom accent bar
        return (
          <div className="w-full h-full flex flex-col justify-between py-1 px-0.5">
            <div className="flex items-center justify-between">
              <div className="h-1.5 w-1/2 rounded-full" style={{ backgroundColor: wireColor }} />
              <div className="h-1.5 w-2 rounded-xs" style={{ backgroundColor: wireColor, opacity: 0.7 }} />
            </div>
            <div
              className="w-full h-7 rounded-md my-1 flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: `${wireColor}22`,
                border: `1.5px solid ${wireColor}55`,
              }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.8 }} />
            </div>
            <div
              className="h-1.5 w-full rounded-full transition-colors"
              style={{ backgroundColor: wireColor }}
            />
          </div>
        );

      case "wireframe-8":
        // Catalog Duet: Dual image squares with side-by-side specs
        return (
          <div className="w-full h-full flex flex-col justify-between py-1 px-0.5">
            <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: wireColor }} />
            <div className="grid grid-cols-2 gap-1 my-1">
              <div
                className="h-7 rounded-md"
                style={{
                  backgroundColor: `${wireColor}25`,
                  border: `1px solid ${wireColor}45`,
                }}
              />
              <div className="flex flex-col justify-around py-0.5">
                <div className="h-1 w-full rounded-full" style={{ backgroundColor: wireColor, opacity: 0.8 }} />
                <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.6 }} />
                <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.5 }} />
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: wireColor }} />
          </div>
        );

      case "wireframe-9":
        // Minimalist Luxury: Ultra-clean frame, asymmetric title line, large image
        return (
          <div
            className="w-full h-full flex flex-col justify-between p-1 rounded-sm"
            style={{ border: `1px solid ${wireColor}40` }}
          >
            <div className="h-1 w-2/5 rounded-full" style={{ backgroundColor: wireColor }} />
            <div
              className="w-full h-6 rounded-xs my-0.5"
              style={{
                backgroundColor: `${wireColor}18`,
                border: `1px dashed ${wireColor}50`,
              }}
            >
            </div>
            <div className="flex items-center justify-between">
              <div className="h-1 w-1/3 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.7 }} />
              <div className="h-1 w-1/4 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.5 }} />
            </div>
          </div>
        );

      case "wireframe-premium-1": {
        // Modern Minimal: Clean asymmetric top bar, prominent off-center hero card, bottom slim dock
        const theme = getPremiumTheme("frame15");
        return (
          <div className="w-full h-full flex flex-col justify-between p-1 bg-[#090C16] rounded-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="h-1 w-2/5 rounded-full" style={{ backgroundColor: theme.primaryNeon }} />
              <div className="h-1 w-1/4 rounded-full" style={{ backgroundColor: `${theme.secondaryNeon}80` }} />
            </div>
            <div
              className="w-full h-6 rounded-md my-1 flex items-center justify-center transition-all"
              style={{
                backgroundColor: `${theme.primaryNeon}15`,
                border: `1px solid ${theme.primaryNeon}60`,
                boxShadow: isSelected ? `0 0 8px ${theme.primaryNeon}40` : undefined,
              }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primaryNeon, opacity: 0.8 }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: theme.secondaryNeon }} />
              <div className="h-1.5 w-1/3 rounded-xs" style={{ backgroundColor: theme.primaryNeon }} />
            </div>
          </div>
        );
      }

      case "wireframe-premium-2": {
        // Luxury Obsidian Prestige: Gold double border, top crown dot, centered luxury pedestal, bottom gold ribbon
        const theme = getPremiumTheme("frame16");
        return (
          <div
            className="w-full h-full flex flex-col justify-between p-1 bg-[#0A0804] rounded-sm relative overflow-hidden"
            style={{ border: `1px solid ${theme.primaryNeon}70` }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryNeon }} />
              <div className="h-0.5 w-3/5 rounded-full" style={{ backgroundColor: theme.secondaryNeon }} />
            </div>
            <div
              className="w-full h-5 rounded-xs my-0.5 flex items-center justify-center p-0.5"
              style={{
                border: `1px solid ${theme.primaryNeon}`,
                backgroundColor: `${theme.primaryNeon}20`,
                boxShadow: isSelected ? `0 0 6px ${theme.primaryNeon}50` : undefined,
              }}
            >
              <div className="w-3 h-2 rounded-xs" style={{ backgroundColor: theme.primaryNeon, opacity: 0.9 }} />
            </div>
            <div
              className="h-1.5 w-full rounded-xs flex items-center justify-center"
              style={{ backgroundColor: theme.primaryNeon }}
            >
              <div className="h-0.5 w-1/3 bg-black/40 rounded-full" />
            </div>
          </div>
        );
      }

      case "wireframe-premium-3": {
        // Cyber Split-Screen Horizon: Left console stack, right tall dropzone with corner tick marks
        const theme = getPremiumTheme("frame17");
        return (
          <div className="w-full h-full flex justify-between gap-1 p-1 bg-[#061209] rounded-sm">
            <div className="w-2/5 flex flex-col justify-between py-0.5">
              <div className="h-1 w-full rounded-full" style={{ backgroundColor: theme.primaryNeon }} />
              <div className="h-1.5 w-full rounded-xs" style={{ backgroundColor: `${theme.secondaryNeon}40` }} />
              <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: theme.accentNeon }} />
              <div className="w-3 h-2 rounded-xs" style={{ backgroundColor: theme.primaryNeon }} />
            </div>
            <div
              className="flex-1 rounded-xs flex items-center justify-center relative p-0.5"
              style={{
                backgroundColor: `${theme.primaryNeon}15`,
                border: `1px solid ${theme.primaryNeon}70`,
              }}
            >
              <div className="absolute top-0.5 left-0.5 w-1 h-1 border-t border-l" style={{ borderColor: theme.primaryNeon }} />
              <div className="absolute top-0.5 right-0.5 w-1 h-1 border-t border-r" style={{ borderColor: theme.primaryNeon }} />
              <div className="absolute bottom-0.5 left-0.5 w-1 h-1 border-b border-l" style={{ borderColor: theme.primaryNeon }} />
              <div className="absolute bottom-0.5 right-0.5 w-1 h-1 border-b border-r" style={{ borderColor: theme.primaryNeon }} />
              <div className="w-2 h-3 rounded-xs" style={{ backgroundColor: theme.primaryNeon, opacity: 0.7 }} />
            </div>
          </div>
        );
      }

      case "wireframe-premium-4": {
        // Bold Typography Editorial: Massive thick headline bars, middle landscape box, 3 bottom spec pill blocks
        const theme = getPremiumTheme("frame18");
        return (
          <div className="w-full h-full flex flex-col justify-between p-1 bg-[#160611] rounded-sm">
            <div className="flex flex-col gap-0.5">
              <div className="h-2 w-full rounded-xs" style={{ backgroundColor: theme.primaryNeon }} />
              <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: theme.secondaryNeon }} />
            </div>
            <div
              className="w-full h-4 rounded-xs my-0.5 flex items-center justify-center"
              style={{
                backgroundColor: `${theme.primaryNeon}20`,
                border: `1px solid ${theme.primaryNeon}60`,
              }}
            >
              <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: theme.primaryNeon }} />
            </div>
            <div className="grid grid-cols-3 gap-0.5">
              <div className="h-1.5 rounded-xs" style={{ backgroundColor: `${theme.secondaryNeon}60` }} />
              <div className="h-1.5 rounded-xs" style={{ backgroundColor: `${theme.accentNeon}60` }} />
              <div className="h-1.5 rounded-xs" style={{ backgroundColor: theme.primaryNeon }} />
            </div>
          </div>
        );
      }

      case "wireframe-premium-5": {
        // Product Spotlight: Central circular pedestal ring with floating chips, bottom curved dock
        const theme = getPremiumTheme("frame19");
        return (
          <div className="w-full h-full flex flex-col justify-between items-center p-1 bg-[#100620] rounded-sm relative">
            <div className="h-1 w-3/5 rounded-full" style={{ backgroundColor: theme.primaryNeon }} />
            <div className="relative w-full flex items-center justify-center my-0.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: `${theme.primaryNeon}20`,
                  border: `1.5px solid ${theme.primaryNeon}`,
                  boxShadow: `0 0 6px ${theme.primaryNeon}50`,
                }}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.secondaryNeon, opacity: 0.9 }} />
              </div>
              <div className="absolute left-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accentNeon }} />
              <div className="absolute right-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryNeon }} />
            </div>
            <div
              className="w-full h-2 rounded-full flex items-center justify-between px-1"
              style={{ backgroundColor: `${theme.primaryNeon}35`, border: `1px solid ${theme.primaryNeon}70` }}
            >
              <div className="h-0.5 w-1/3 rounded-full" style={{ backgroundColor: theme.secondaryNeon }} />
              <div className="h-1 w-1/4 rounded-full" style={{ backgroundColor: theme.primaryNeon }} />
            </div>
          </div>
        );
      }

      case "wireframe-premium-6": {
        // Diagonal Dynamic Slash: Angled slash divider, skewed block, corner dynamic price badge
        const theme = getPremiumTheme("frame20");
        return (
          <div className="w-full h-full flex flex-col justify-between p-1 bg-[#05141C] rounded-sm relative overflow-hidden">
            <div
              className="h-1.5 w-4/5 rounded-xs -skew-x-12"
              style={{ backgroundColor: theme.primaryNeon }}
            />
            <div
              className="w-full h-5 rounded-xs -skew-x-6 my-0.5 flex items-center justify-center"
              style={{
                backgroundColor: `${theme.primaryNeon}25`,
                border: `1px solid ${theme.primaryNeon}`,
              }}
            >
              <div className="w-3 h-2 rounded-xs" style={{ backgroundColor: theme.secondaryNeon }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-1 w-1/2 -skew-x-12 rounded-xs" style={{ backgroundColor: theme.secondaryNeon }} />
              <div className="h-2 w-1/3 -skew-x-12 rounded-xs" style={{ backgroundColor: theme.primaryNeon }} />
            </div>
          </div>
        );
      }

      case "wireframe-premium-7": {
        // Magazine Catalog: Top magazine issue header, center photo with side bullets, bottom barcode plate
        const theme = getPremiumTheme("frame21");
        return (
          <div className="w-full h-full flex flex-col justify-between p-1 bg-[#051410] rounded-sm border border-emerald-500/30">
            <div className="flex items-center justify-between border-b pb-0.5" style={{ borderColor: `${theme.primaryNeon}40` }}>
              <div className="h-0.5 w-2/5 rounded-full" style={{ backgroundColor: theme.primaryNeon }} />
              <div className="h-0.5 w-1/4 rounded-full" style={{ backgroundColor: theme.secondaryNeon }} />
            </div>
            <div className="flex items-stretch gap-1 my-0.5">
              <div className="flex-1 h-5 rounded-xs flex items-center justify-center" style={{ backgroundColor: `${theme.primaryNeon}20`, border: `1px solid ${theme.primaryNeon}50` }}>
                <div className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: theme.primaryNeon }} />
              </div>
              <div className="w-2 flex flex-col justify-around py-0.5">
                <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: theme.secondaryNeon }} />
                <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: theme.accentNeon }} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-0.5 border-t" style={{ borderColor: `${theme.primaryNeon}40` }}>
              <div className="flex gap-0.5 items-end">
                <div className="w-0.5 h-1.5" style={{ backgroundColor: theme.primaryNeon }} />
                <div className="w-0.5 h-1.5" style={{ backgroundColor: theme.primaryNeon }} />
                <div className="w-0.5 h-1.5" style={{ backgroundColor: theme.primaryNeon }} />
              </div>
              <div className="h-1.5 w-1/2 rounded-xs" style={{ backgroundColor: theme.secondaryNeon }} />
            </div>
          </div>
        );
      }

      case "wireframe-premium-8": {
        // Gradient Glass: Frosted glass inner card with rounded rim inside glowing mesh gradient
        const theme = getPremiumTheme("frame22");
        return (
          <div className="w-full h-full flex flex-col justify-between p-1 bg-gradient-to-br from-[#1C0909] via-[#2A0E0E] to-[#120404] rounded-sm">
            <div className="h-1 w-1/2 mx-auto rounded-full" style={{ backgroundColor: theme.primaryNeon }} />
            <div
              className="w-full h-6 rounded-lg my-0.5 p-1 flex items-center justify-center backdrop-blur-xs"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.25)",
                boxShadow: `0 0 8px ${theme.primaryNeon}30`,
              }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.secondaryNeon, opacity: 0.9 }} />
            </div>
            <div className="h-1.5 w-3/4 mx-auto rounded-full" style={{ backgroundColor: theme.primaryNeon }} />
          </div>
        );
      }

      case "wireframe-premium-9": {
        // Tech Matrix Specs: Technical crosshair corner brackets [+] around center box, 4 mini chips
        const theme = getPremiumTheme("frame23");
        return (
          <div className="w-full h-full flex flex-col justify-between p-1 bg-[#121105] rounded-sm">
            <div className="flex items-center justify-between">
              <span className="text-[6px] font-mono leading-none" style={{ color: theme.primaryNeon }}>+ SYS</span>
              <div className="h-0.5 w-1/2 rounded-full" style={{ backgroundColor: theme.secondaryNeon }} />
            </div>
            <div
              className="w-full h-5 rounded-xs my-0.5 flex items-center justify-center relative p-0.5"
              style={{
                backgroundColor: `${theme.primaryNeon}15`,
                border: `1px solid ${theme.primaryNeon}60`,
              }}
            >
              <div className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: theme.primaryNeon, opacity: 0.8 }} />
            </div>
            <div className="grid grid-cols-4 gap-0.5">
              <div className="h-1 rounded-xs" style={{ backgroundColor: `${theme.primaryNeon}50` }} />
              <div className="h-1 rounded-xs" style={{ backgroundColor: `${theme.primaryNeon}50` }} />
              <div className="h-1 rounded-xs" style={{ backgroundColor: `${theme.secondaryNeon}50` }} />
              <div className="h-1 rounded-xs" style={{ backgroundColor: theme.primaryNeon }} />
            </div>
          </div>
        );
      }

      case "wireframe-premium-10": {
        // Promotional Sale: Top promo striped banner, center box with discount burst badge, bottom bold sale banner
        const theme = getPremiumTheme("frame24");
        return (
          <div className="w-full h-full flex flex-col justify-between p-1 bg-[#160814] rounded-sm">
            <div className="h-1.5 w-full rounded-xs flex items-center justify-center" style={{ backgroundColor: theme.primaryNeon }}>
              <div className="h-0.5 w-3/4 bg-white/70 rounded-full" />
            </div>
            <div
              className="w-full h-5 rounded-xs my-0.5 flex items-center justify-center relative"
              style={{
                backgroundColor: `${theme.primaryNeon}20`,
                border: `1px solid ${theme.primaryNeon}60`,
              }}
            >
              <div className="w-3 h-2 rounded-xs" style={{ backgroundColor: theme.secondaryNeon }} />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: theme.primaryNeon }} />
            </div>
            <div className="h-2 w-full rounded-xs" style={{ backgroundColor: theme.primaryNeon }} />
          </div>
        );
      }

      case "wireframe-premium-11": {
        // Asymmetric Duet: Large top panoramic box (60%), bottom split into 2 unequal cards
        const theme = getPremiumTheme("frame25");
        return (
          <div className="w-full h-full flex flex-col justify-between gap-1 p-1 bg-[#091406] rounded-sm">
            <div
              className="w-full h-6 rounded-xs flex items-center justify-center"
              style={{
                backgroundColor: `${theme.primaryNeon}20`,
                border: `1px solid ${theme.primaryNeon}60`,
              }}
            >
              <div className="w-4 h-2.5 rounded-xs" style={{ backgroundColor: theme.primaryNeon, opacity: 0.8 }} />
            </div>
            <div className="flex gap-1 items-stretch">
              <div className="w-3/5 h-3 rounded-xs" style={{ backgroundColor: `${theme.secondaryNeon}35`, border: `1px solid ${theme.secondaryNeon}50` }} />
              <div className="w-2/5 h-3 rounded-xs" style={{ backgroundColor: theme.primaryNeon }} />
            </div>
          </div>
        );
      }

      case "wireframe-premium-12": {
        // Holo Prism Diamond: Iridescent rainbow gradient rim, centered diamond/hexagon frame, bottom prism capsule
        const theme = getPremiumTheme("frame26");
        return (
          <div
            className="w-full h-full flex flex-col justify-between p-1 bg-[#090C1B] rounded-sm relative"
            style={{
              border: `1.5px solid transparent`,
              backgroundImage: `linear-gradient(#090C1B, #090C1B), linear-gradient(135deg, #FFFFFF, #67E8F9, #E879F9, #FACC15)`,
              backgroundOrigin: "border-box",
              backgroundClip: "content-box, border-box",
            }}
          >
            <div className="h-1 w-1/2 mx-auto rounded-full bg-gradient-to-r from-cyan-300 via-pink-400 to-amber-300" />
            <div
              className="w-full h-5 rounded-xs my-0.5 flex items-center justify-center"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            >
              <div className="w-2.5 h-2.5 rotate-45 rounded-xs bg-gradient-to-r from-cyan-300 to-pink-400" />
            </div>
            <div className="h-1.5 w-4/5 mx-auto rounded-full bg-gradient-to-r from-cyan-300 via-pink-400 to-white" />
          </div>
        );
      }

      case "wireframe-formal-1": {
        // Executive Crest: Elegant double gold border, crest badge, framed center, formal dividers
        const formalGold = "#F59E0B";
        return (
          <div
            className="w-full h-full flex flex-col justify-between p-1 bg-[#0D0F14] rounded-sm relative overflow-hidden"
            style={{ border: `1px solid ${formalGold}90` }}
          >
            <div className="flex items-center justify-between">
              <div className="w-2 h-2 rounded-full border border-amber-400/80 bg-amber-400/30 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-amber-400" />
              </div>
              <div className="h-1 flex-1 mx-1.5 rounded-full" style={{ backgroundColor: formalGold, opacity: 0.8 }} />
              <div className="w-1.5 h-1.5 rotate-45 bg-amber-400/70" />
            </div>
            <div
              className="w-full h-6 rounded-xs my-0.5 flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: `${formalGold}15`,
                border: `1px double ${formalGold}60`,
              }}
            >
              <div className="w-3 h-3 rounded-xs border border-amber-400/60 bg-amber-400/20" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-1 w-2/5 rounded-full" style={{ backgroundColor: formalGold, opacity: 0.7 }} />
              <div className="h-1.5 w-1/3 rounded-xs bg-amber-500/80" />
            </div>
          </div>
        );
      }

      case "wireframe-formal-2": {
        // Royal Prestige: Regal header, ornamental frame, certificate footer
        const royalGold = "#D97706";
        return (
          <div
            className="w-full h-full flex flex-col justify-between p-1 bg-[#080C16] rounded-sm relative overflow-hidden"
            style={{ border: `1.5px solid ${royalGold}90` }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: royalGold }} />
              <div className="h-0.5 w-1/2 rounded-full bg-amber-400/70" />
            </div>
            <div
              className="w-full h-6 rounded-md my-0.5 flex items-center justify-center"
              style={{
                backgroundColor: `${royalGold}20`,
                border: `1px solid ${royalGold}50`,
              }}
            >
              <div className="w-3 h-3 rounded-full border border-amber-400 bg-amber-400/30" />
            </div>
            <div className="h-1.5 w-full rounded-xs bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
          </div>
        );
      }

      case "wireframe-10":
      default:
        // Promo / Flash Sale: Top tag, central banner, bottom promo pill
        return (
          <div className="w-full h-full flex flex-col justify-between py-1 px-0.5">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-2 rounded-xs" style={{ backgroundColor: wireColor }} />
              <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.85 }} />
            </div>
            <div
              className="w-full h-6 rounded-md my-1 flex items-center justify-center"
              style={{
                backgroundColor: `${wireColor}25`,
                border: `1px solid ${wireColor}55`,
              }}
            >
              <div className="h-1.5 w-3/5 rounded-full" style={{ backgroundColor: wireColor, opacity: 0.9 }} />
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: wireColor }} />
              <div className="h-1.5 w-3 rounded-xs" style={{ backgroundColor: wireColor, opacity: 0.7 }} />
            </div>
          </div>
        );
    }
  };

  // ── Render Helpers for Direct Editable Poster Elements ──
  const renderTitleBox = (customBorder?: string, customTextColor?: string) => (
    <div
      onClick={() => {
        setInspectorTab("content");
        setShowTemplatesCard(true);
        setTimeout(() => titleInputRef.current?.focus(), 80);
      }}
      className={`${customBorder || "border-2 border-[#4285F4]"
        } bg-white dark:bg-[#181B26] p-2 flex items-center justify-center transition-all select-none cursor-pointer hover:ring-1 hover:ring-[#FF5722]/50`}
      title="Click to edit title in Content settings"
    >
      <h2
        className={`w-full text-center font-black ${getTitleSizeClass()} tracking-widest ${customTextColor || "text-[#718096] dark:text-gray-300"
          } uppercase`}
        style={{
          fontFamily: currentFont.cssFamily,
          textAlign: poster.textAlign,
        }}
      >
        {poster.isUppercase ? (poster.title || "").toUpperCase() : (poster.title || "POSTER TITLE")}
      </h2>
    </div>
  );

  const renderProductNameBox = (customBorder?: string) => (
    <div
      className={`${customBorder || "border-2 border-[#4285F4]"
        } bg-white dark:bg-[#181B26] py-1.5 px-3 flex items-center justify-center transition-all`}
    >
      <input
        type="text"
        value={poster.productName}
        onChange={(e) => {
          setPoster((prev) => ({ ...prev, productName: e.target.value }));
        }}
        onBlur={commitPosterState}
        placeholder="Product Name *"
        className="w-full bg-transparent outline-none text-center font-semibold text-xs sm:text-sm text-[#94A3B8] dark:text-gray-300 placeholder:text-[#94A3B8]"
        style={{
          fontFamily: currentFont.cssFamily,
          textAlign: poster.textAlign,
        }}
      />
    </div>
  );

  const renderPriceAndBadge = () => {
    if (!poster.showPriceTag) return null;
    return (
      <div className="flex items-center justify-between px-1 text-xs">
        <div
          className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-sm border bg-white/80 dark:bg-black/30"
          style={{ borderColor: `${activeAccent}40` }}
          title="Directly edit offer price"
        >
          <span className="text-[11px] text-gray-400">Price: ₹</span>
          <input
            type="text"
            inputMode="numeric"
            value={poster.price}
            onChange={(e) => handlePriceChange(e.target.value)}
            onKeyDown={handlePriceKeyDown}
            onBlur={commitPosterState}
            className="bg-transparent font-mono font-bold text-xs outline-none w-20"
            style={{ color: activeAccent }}
            placeholder="0"
          />
          <span className="text-[11px] text-gray-400">/-</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeAccent }} />
          <input
            type="text"
            value={poster.badgeText}
            onChange={(e) => setPoster((prev) => ({ ...prev, badgeText: e.target.value }))}
            onBlur={commitPosterState}
            className="bg-transparent outline-none font-bold uppercase text-[10px] text-gray-500 dark:text-gray-400 max-w-[120px] text-right"
            placeholder="TAG"
          />
        </div>
      </div>
    );
  };

  const renderDropzone = (variant: "full" | "half" | "sidebar" | "banner" = "full") => {
    const isCompact = variant === "half" || variant === "sidebar";

    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleImageDrop}
        className={`border-2 border-[#4285F4] ${currentBg.imageBoxBg || "bg-[#EFF2F6] dark:bg-[#161922]"} p-2 sm:p-4 flex-1 flex flex-col items-center justify-center relative w-full overflow-hidden transition-all`}
      >
        {poster.productImage ? (
          <div className="relative w-full h-full min-h-[160px] flex items-center justify-center overflow-hidden group/img">
            <img
              src={poster.productImage}
              alt={poster.productName || "Product"}
              style={{
                transform: `translate(${poster.imagePosition.x}px, ${poster.imagePosition.y}px) scale(${poster.imageZoom})`,
                transformOrigin: "center center",
                transition: "transform 0.12s ease-out",
              }}
              className="max-h-[360px] max-w-full object-contain rounded-md shadow-md select-none pointer-events-none"
            />
            {/* Quick floating controls on hover */}
            <div className="absolute top-2 right-2 flex items-center gap-1 z-20 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/85 backdrop-blur-md p-1 rounded-lg border border-white/20 shadow-xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pushState({ ...poster, imageZoom: Math.min(3, +(poster.imageZoom + 0.15).toFixed(2)) });
                }}
                className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                title="Zoom In Image"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pushState({ ...poster, imageZoom: Math.max(0.5, +(poster.imageZoom - 0.15).toFixed(2)) });
                }}
                className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                title="Zoom Out Image"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pushState({ ...poster, imageZoom: 1, imagePosition: { x: 0, y: 0 } });
                }}
                className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                title="Reset Image Transform"
              >
                <Move className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                title="Replace Image"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPoster((prev) => {
                    const next = { ...prev, productImage: "" };
                    pushState(next);
                    return next;
                  });
                }}
                className="p-1 rounded hover:bg-red-500/40 text-red-400 cursor-pointer"
                title="Remove Image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer group/drop"
          >
            {/* Dashed orange border box */}
            <div
              className={`border-2 border-dashed border-[#FF7A00] rounded-xl ${isCompact ? "p-3 sm:p-4 max-w-[200px]" : "p-6 sm:p-7 max-w-[340px] sm:max-w-[360px]"
                } w-full flex flex-col items-center justify-center text-center gap-2.5 bg-transparent group-hover/drop:bg-orange-50/20 dark:group-hover/drop:bg-orange-950/20 transition-colors`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className={`${isCompact ? "w-10 h-10" : "w-14 h-14"
                  } rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer text-white`}
                style={{ backgroundColor: activeAccent }}
                title="Upload Product Image"
              >
                <Camera className={`${isCompact ? "w-5 h-5" : "w-7 h-7"} text-white stroke-[2.2]`} />
              </button>

              <h3
                className={`font-extrabold ${isCompact ? "text-xs" : "text-sm sm:text-base"
                  } text-gray-800 dark:text-gray-100 leading-snug tracking-tight mt-0.5`}
              >
                {isCompact ? "Drop Image" : <>Drag &amp; Drop Your Product<br />Image Here</>}
              </h3>

              <span className="text-[10px] font-bold text-gray-400">OR</span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className={`${isCompact ? "px-3 py-1 text-xs" : "px-5 py-1.5 text-xs font-bold"
                  } rounded-md text-white shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer`}
                style={{ backgroundColor: activeAccent }}
              >
                Browse Files
              </button>
            </div>

            {!isCompact && (
              <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 text-center leading-relaxed mt-3 z-10 select-none">
                <p>Max file size: 2MB • JPG, PNG, GIF</p>
                <p className="mt-0.5 font-medium">Tip: Use high-resolution images for the best results.</p>
              </div>
            )}
          </div>
        )}

        <div className="absolute bottom-2.5 right-2.5 text-gray-300 dark:text-gray-600 pointer-events-none select-none opacity-80">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
      </div>
    );
  };

  const renderStoreBadge = (accent: string, label: string = "KrishTech Computers", sub: string = "OFFICIAL PARTNER") => (
    <div
      onClick={() => logoInputRef.current?.click()}
      className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
      title="Click to change store logo"
    >
      {poster.companyLogo && !logoLoadError ? (
        <img
          src={getLogoSrc(poster.companyLogo)}
          alt="Store Logo"
          className="w-5 h-5 rounded-xs object-contain"
          onError={() => setLogoLoadError(true)}
        />
      ) : (
        <img
          src="/uploads/companies/default-company/logo-1779622107439-878996187.webp"
          alt="Store Logo"
          className="w-5 h-5 rounded-xs object-contain"
        />
      )}
      <div className="flex flex-col text-left">
        <span className="text-[10px] font-extrabold tracking-tight leading-none text-white">{label}</span>
        <span className="text-[7px] font-semibold tracking-wider leading-none mt-0.5 uppercase" style={{ color: accent }}>
          {sub}
        </span>
      </div>
    </div>
  );

  const renderPremiumImageDropzone = (
    accentColor: string,
    placeholderText: string = "Drop Product Image",
    customBadge?: React.ReactNode,
    aspectClass: string = "w-full h-full"
  ) => {
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleImageDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`${aspectClass} relative flex flex-col items-center justify-center cursor-pointer overflow-hidden group/pdrop transition-all`}
      >
        {poster.productImage ? (
          <div className="relative w-full h-full flex items-center justify-center p-2 overflow-hidden">
            <img
              src={poster.productImage}
              alt={poster.productName || "Product"}
              style={{
                transform: `translate(${poster.imagePosition.x}px, ${poster.imagePosition.y}px) scale(${poster.imageZoom})`,
                transformOrigin: "center center",
                transition: "transform 0.12s ease-out",
              }}
              className="max-h-full max-w-full object-contain drop-shadow-2xl select-none pointer-events-none"
            />
            {customBadge}
            {/* Quick floating controls on hover */}
            <div className="absolute top-2 right-2 flex items-center gap-1 z-20 opacity-0 group-hover/pdrop:opacity-100 transition-opacity bg-black/85 backdrop-blur-md p-1 rounded-lg border border-white/20 shadow-xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pushState({ ...poster, imageZoom: Math.min(3, +(poster.imageZoom + 0.15).toFixed(2)) });
                }}
                className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pushState({ ...poster, imageZoom: Math.max(0.5, +(poster.imageZoom - 0.15).toFixed(2)) });
                }}
                className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pushState({ ...poster, imageZoom: 1, imagePosition: { x: 0, y: 0 } });
                }}
                className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                title="Reset Image"
              >
                <Move className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                title="Change Image"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPoster((prev) => {
                    const next = { ...prev, productImage: "" };
                    pushState(next);
                    return next;
                  });
                }}
                className="p-1 rounded hover:bg-red-500/40 text-red-400 cursor-pointer"
                title="Remove Image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-2">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover/pdrop:scale-110"
              style={{ backgroundColor: `${accentColor}25`, border: `1.5px solid ${accentColor}` }}
            >
              <Camera className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <span className="text-xs font-bold text-white tracking-wide">{placeholderText}</span>
            <span className="text-[10px] text-gray-300">Click or Drag &amp; Drop</span>
            {customBadge}
          </div>
        )}
      </div>
    );
  };

  const renderCanvasContent = () => {
    const layout = getTemplateLayoutType(poster.template);

    switch (layout) {
      case "wireframe-1":
        return (
          <div className="flex-1 flex flex-col gap-1.5 p-2 bg-white dark:bg-[#141722] overflow-hidden">
            {/* Top Pink Title Box */}
            {renderTitleBox("border-2 border-[#E91E63]", "text-[#E91E63] placeholder:text-[#E91E63]/70")}

            {/* Two-Column Split Area */}
            <div className="flex-1 grid grid-cols-12 gap-1.5 overflow-hidden">
              {/* Left Column (5 cols): Product Name, Description, Price, Logo */}
              <div className="col-span-5 flex flex-col justify-between gap-1.5 h-full">
                {/* 1. Product Name Box */}
                <div className="border-2 border-[#4285F4] bg-white dark:bg-[#181B26] py-1.5 px-2 flex items-center justify-center">
                  <input
                    type="text"
                    value={poster.productName}
                    onChange={(e) => setPoster((prev) => ({ ...prev, productName: e.target.value }))}
                    onBlur={commitPosterState}
                    placeholder="Product Name"
                    className="w-full bg-transparent outline-none text-center font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                  />
                </div>

                {/* 2. Product Description Box */}
                <div className="border-2 border-[#4285F4] bg-white dark:bg-[#181B26] p-2 flex-1 flex flex-col min-h-[90px] sm:min-h-[110px]">
                  <textarea
                    value={poster.description || ""}
                    onChange={(e) => setPoster((prev) => ({ ...prev, description: e.target.value }))}
                    onBlur={commitPosterState}
                    placeholder="Enter product description..."
                    className="w-full h-full bg-transparent outline-none text-[11px] sm:text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 resize-none leading-relaxed"
                  />
                </div>

                {/* 3. Price Tag */}
                <div className="flex items-center gap-1.5 text-xs font-bold px-0.5 select-none">
                  <span className="text-[#E91E63]">Price: ₹</span>
                  <div className="border-2 border-[#4285F4] bg-white dark:bg-[#181B26] px-1.5 py-0.5 rounded-none flex items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={poster.price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      onKeyDown={handlePriceKeyDown}
                      onBlur={commitPosterState}
                      placeholder="Price"
                      className="w-14 bg-transparent outline-none font-bold text-xs text-center text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                    />
                  </div>
                  <span className="text-[#E91E63]">/-</span>
                </div>

                {/* 4. Company Logo Card at bottom of left column */}
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="border-2 border-[#4285F4] bg-[#0B0E17] aspect-square w-full flex flex-col items-center justify-center p-2 relative group cursor-pointer shadow-inner transition-transform hover:scale-[1.01]"
                  title="Click to change store logo"
                >
                  {poster.companyLogo && !logoLoadError ? (
                    <img
                      src={getLogoSrc(poster.companyLogo)}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                      onError={() => setLogoLoadError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-1">
                      <img
                        src="/uploads/companies/default-company/logo-1779622107439-878996187.webp"
                        alt="KrishTech Computers"
                        className="w-full h-full object-contain select-none rounded-md"
                      />
                    </div>
                  )}

                  {/* Logo upload overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold">
                    Change Logo
                  </div>
                </div>
              </div>

              {/* Right Column (7 cols): Tall Dropzone */}
              <div className="col-span-7 flex flex-col h-full">
                {renderDropzone("full")}
              </div>
            </div>
          </div>
        );

      case "wireframe-3":
        return (
          <div className="flex-1 flex flex-col gap-1.5 p-2 bg-white dark:bg-[#141722] overflow-hidden">
            {/* Top Pink Title Box */}
            {renderTitleBox("border-2 border-[#E91E63]", "text-[#E91E63] placeholder:text-[#E91E63]/70")}

            {/* Middle: Full-Width Product Image Dropzone */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {renderDropzone("full")}
            </div>

            {/* Bottom: Two Columns (Left: Product Name, Description, Price; Right: Logo Card) */}
            <div className="grid grid-cols-12 gap-1.5 shrink-0 items-stretch">
              {/* Left Column (8 cols): Product Name, Description, Price */}
              <div className="col-span-8 flex flex-col justify-between gap-1.5">
                {/* 1. Product Name Box */}
                <div className="border-2 border-[#4285F4] bg-white dark:bg-[#181B26] py-1 px-2 flex items-center justify-center">
                  <input
                    type="text"
                    value={poster.productName}
                    onChange={(e) => setPoster((prev) => ({ ...prev, productName: e.target.value }))}
                    onBlur={commitPosterState}
                    placeholder="Product Name"
                    className="w-full bg-transparent outline-none text-center font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                  />
                </div>

                {/* 2. Product Description Box */}
                <div className="border-2 border-[#4285F4] bg-white dark:bg-[#181B26] p-1.5 flex-1 flex flex-col min-h-[60px] sm:min-h-[70px]">
                  <textarea
                    value={poster.description || ""}
                    onChange={(e) => setPoster((prev) => ({ ...prev, description: e.target.value }))}
                    onBlur={commitPosterState}
                    placeholder="Enter product description..."
                    className="w-full h-full bg-transparent outline-none text-[11px] sm:text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 resize-none leading-relaxed"
                  />
                </div>

                {/* 3. Price Tag */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold px-0.5 select-none py-0.5">
                  <span className="text-[#E91E63]">Price: ₹</span>
                  <div className="border-2 border-[#4285F4] bg-white dark:bg-[#181B26] px-1.5 py-0.5 rounded-none flex items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={poster.price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      onKeyDown={handlePriceKeyDown}
                      onBlur={commitPosterState}
                      placeholder="Price"
                      className="w-14 bg-transparent outline-none font-bold text-xs text-center text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                    />
                  </div>
                  <span className="text-[#E91E63]">/-</span>
                </div>
              </div>

              {/* Right Column (4 cols): Square Company Logo Box */}
              <div className="col-span-4 flex items-center">
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="border-2 border-[#4285F4] bg-[#0B0E17] aspect-square w-full h-full flex flex-col items-center justify-center p-2 relative group cursor-pointer shadow-inner transition-transform hover:scale-[1.01]"
                  title="Click to change store logo"
                >
                  {poster.companyLogo && !logoLoadError ? (
                    <img
                      src={getLogoSrc(poster.companyLogo)}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                      onError={() => setLogoLoadError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-1">
                      <img
                        src="/uploads/companies/default-company/logo-1779622107439-878996187.webp"
                        alt="KrishTech Computers"
                        className="w-full h-full object-contain select-none rounded-md"
                      />
                    </div>
                  )}

                  {/* Logo upload overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold">
                    Change Logo
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "wireframe-4":
        return (
          <div className="p-3 sm:p-3.5 flex flex-col gap-2.5">
            {renderTitleBox()}
            {renderDropzone("banner")}
            <div className="flex flex-col gap-2">
              {renderProductNameBox()}
              {renderPriceAndBadge()}
            </div>
          </div>
        );

      case "wireframe-5":
        return (
          <div className="p-3 sm:p-3.5 flex flex-col gap-2.5">
            {renderTitleBox()}
            <div className="p-2 rounded-xs border-[2px] border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 shadow-inner">
              {renderDropzone("full")}
            </div>
            <div className="flex flex-col gap-1.5">
              {renderProductNameBox()}
              {renderPriceAndBadge()}
            </div>
          </div>
        );

      case "wireframe-6":
        return (
          <div className="flex-1 flex flex-col gap-1.5 p-2 bg-white dark:bg-[#141722] overflow-hidden">
            {/* Top Pink Title Box */}
            {renderTitleBox("border-2 border-[#E91E63]", "text-[#E91E63] placeholder:text-[#E91E63]/70")}

            {/* Middle: 2-Column Split (Left: Tall Dropzone | Right: Logo + Product Name + Price) */}
            <div className="flex-1 grid grid-cols-12 gap-1.5 overflow-hidden min-h-0">
              {/* Left Column (7 cols): Tall Dropzone */}
              <div className="col-span-7 flex flex-col h-full">
                {renderDropzone("full")}
              </div>

              {/* Right Column (5 cols): Logo Card + Product Name + Price */}
              <div className="col-span-5 flex flex-col justify-between gap-1.5 h-full">
                {/* 1. Square Company Logo Card */}
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="border-2 border-[#4285F4] bg-[#0B0E17] aspect-square w-full flex flex-col items-center justify-center p-2 relative group cursor-pointer shadow-inner transition-transform hover:scale-[1.01]"
                  title="Click to change store logo"
                >
                  {poster.companyLogo && !logoLoadError ? (
                    <img
                      src={getLogoSrc(poster.companyLogo)}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                      onError={() => setLogoLoadError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-1">
                      <img
                        src="/uploads/companies/default-company/logo-1779622107439-878996187.webp"
                        alt="KrishTech Computers"
                        className="w-full h-full object-contain select-none rounded-md"
                      />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold">
                    Change Logo
                  </div>
                </div>

                {/* 2. Product Name Box */}
                <div className="border-2 border-[#4285F4] bg-white dark:bg-[#181B26] py-1 px-2 flex items-center justify-center">
                  <input
                    type="text"
                    value={poster.productName}
                    onChange={(e) => setPoster((prev) => ({ ...prev, productName: e.target.value }))}
                    onBlur={commitPosterState}
                    placeholder="Product Name"
                    className="w-full bg-transparent outline-none text-center font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                  />
                </div>

                {/* 3. Price Tag Row */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold px-0.5 select-none py-0.5">
                  <span className="text-[#E91E63]">₹</span>
                  <div className="border-2 border-[#4285F4] bg-white dark:bg-[#181B26] px-1.5 py-0.5 rounded-none flex items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={poster.price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      onKeyDown={handlePriceKeyDown}
                      onBlur={commitPosterState}
                      placeholder="Price"
                      className="w-14 bg-transparent outline-none font-bold text-xs text-center text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                    />
                  </div>
                  <span className="text-[#E91E63]">/-</span>
                </div>
              </div>
            </div>

            {/* Bottom: Full-Width Product Description Box */}
            <div className="border-2 border-[#4285F4] bg-white dark:bg-[#181B26] p-2 flex flex-col h-[75px] sm:h-[85px] shrink-0">
              <textarea
                value={poster.description || ""}
                onChange={(e) => setPoster((prev) => ({ ...prev, description: e.target.value }))}
                onBlur={commitPosterState}
                placeholder="Enter product description..."
                className="w-full h-full bg-transparent outline-none text-[11px] sm:text-xs text-center text-gray-700 dark:text-gray-200 placeholder:text-gray-400 placeholder:text-center resize-none leading-relaxed flex items-center justify-center"
              />
            </div>
          </div>
        );

      case "wireframe-7":
        return (
          <div className="p-3 sm:p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-xs"
                style={{ backgroundColor: activeAccent }}
              >
                FEATURED SPOTLIGHT
              </span>
              {renderPriceAndBadge()}
            </div>
            {renderTitleBox()}
            {renderDropzone("full")}
            {renderProductNameBox()}
          </div>
        );

      case "wireframe-8":
        return (
          <div className="p-3 sm:p-3.5 flex flex-col gap-2.5">
            {renderTitleBox()}
            {renderProductNameBox()}
            <div className="grid grid-cols-2 gap-2.5 items-stretch">
              {renderDropzone("half")}
              <div className="flex flex-col justify-between gap-2">
                <div
                  className="rounded-xs p-3 flex flex-col justify-center gap-1.5 border shadow-2xs"
                  style={{
                    borderColor: `${activeAccent}50`,
                    backgroundColor: `${activeAccent}10`,
                  }}
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: activeAccent }}>
                    Special Catalog Deal
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono" style={{ color: activeAccent }}>
                    ₹{poster.price}/-
                  </span>
                  <span className="text-[11px] text-gray-600 dark:text-gray-300 font-semibold">
                    ✓ Verified Quality Guarantee
                  </span>
                </div>
                {renderPriceAndBadge()}
              </div>
            </div>
          </div>
        );

      case "wireframe-9":
        return (
          <div className="p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: activeAccent }}>
                EXCLUSIVE COLLECTION
              </span>
              {renderTitleBox("border-b-2")}
            </div>
            {renderDropzone("full")}
            <div className="flex items-center justify-between pt-1">
              {renderProductNameBox("border-none")}
              {renderPriceAndBadge()}
            </div>
          </div>
        );

      case "wireframe-10":
        return (
          <div className="p-3 sm:p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span
                className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow-xs"
                style={{ backgroundColor: activeAccent }}
              >
                ⚡ MEGA PROMO SALE
              </span>
              <span className="text-[11px] font-bold" style={{ color: activeAccent }}>
                LIMITED TIME ONLY
              </span>
            </div>
            {renderTitleBox()}
            {renderDropzone("banner")}
            {renderProductNameBox()}
            <div
              className="p-2.5 rounded-xs flex items-center justify-between border shadow-inner"
              style={{
                borderColor: `${activeAccent}60`,
                backgroundColor: `${activeAccent}15`,
              }}
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">Special Offer</span>
                <span className="text-base font-black font-mono" style={{ color: activeAccent }}>₹{poster.price}/-</span>
              </div>
              <span
                className="px-3 py-1 rounded-sm text-xs font-bold text-white shadow"
                style={{ backgroundColor: activeAccent }}
              >
                BUY NOW
              </span>
            </div>
          </div>
        );

      case "wireframe-premium-1": {
        // 1. MODERN MINIMALIST TECH: Clean architectural layout, floating card, sleek dock
        const theme = getPremiumTheme("frame15");
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-[#090C16] relative overflow-hidden text-white font-sans">
            {/* Ambient subtle glow */}
            <div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-20"
              style={{ backgroundColor: theme.primaryNeon }}
            />

            {/* Top Bar: Brand + Tag */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 z-10">
              {renderStoreBadge(theme.primaryNeon, "KrishTech Minimal", "FLAGSHIP TECH")}
              <input
                type="text"
                value={poster.badgeText}
                onChange={(e) => setPoster((p) => ({ ...p, badgeText: e.target.value }))}
                onBlur={commitPosterState}
                className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 outline-none text-right"
                placeholder="MINIMAL EDITION"
              />
            </div>

            {/* Title Section */}
            <div className="pt-2 pb-1 z-10">
              <input
                type="text"
                value={poster.title}
                onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                onBlur={commitPosterState}
                placeholder="MODERN TECH TITLE"
                className="w-full bg-transparent font-black text-xl sm:text-2xl tracking-tight text-white uppercase outline-none text-left"
                style={{ fontFamily: currentFont.cssFamily }}
              />
              <p className="text-[10px] text-gray-400 font-medium tracking-wide mt-0.5">Engineered for precision performance</p>
            </div>

            {/* Hero Image Showcase */}
            <div className="flex-1 my-2 rounded-2xl bg-[#0D1222]/90 border border-cyan-400/25 p-3 flex items-center justify-center relative overflow-hidden shadow-2xl z-10">
              {renderPremiumImageDropzone(
                theme.primaryNeon,
                "Drop Appliance / Device Image",
                <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider bg-black/60 border border-cyan-400/40 text-cyan-300">
                  ORIGINAL TECH
                </div>
              )}
            </div>

            {/* Bottom Dock: Product Details + Sleek Price */}
            <div className="p-2.5 rounded-xl bg-[#0B0F1D] border border-white/10 flex items-center justify-between gap-3 shadow-xl z-10">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={poster.productName}
                  onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Product Name"
                  className="w-full bg-transparent font-bold text-xs sm:text-sm text-white outline-none truncate"
                />
                <input
                  type="text"
                  value={poster.description}
                  onChange={(e) => setPoster((p) => ({ ...p, description: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Ultra-responsive • Energy efficient • Pure performance"
                  className="w-full bg-transparent text-[10px] text-gray-400 outline-none truncate"
                />
              </div>

              <div
                className="px-3 py-1.5 rounded-lg border flex items-center gap-1 font-mono text-xs sm:text-sm font-black shrink-0"
                style={{
                  backgroundColor: `${theme.primaryNeon}15`,
                  borderColor: theme.primaryNeon,
                  color: theme.primaryNeon,
                  boxShadow: `0 0 10px ${theme.primaryNeon}30`,
                }}
              >
                <span>₹</span>
                <input
                  type="text"
                  value={poster.price}
                  inputMode="numeric"
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  onBlur={commitPosterState}
                  className="bg-transparent outline-none w-14 font-black text-center"
                  placeholder="Price"
                />
                <span>/-</span>
              </div>
            </div>
          </div>
        );
      }

      case "wireframe-premium-2": {
        // 2. LUXURY OBSIDIAN PRESTIGE: Gold double metallic borders, royal serif, luxury pedestal
        const theme = getPremiumTheme("frame16");
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-[#08080A] relative overflow-hidden text-amber-100 font-serif">
            {/* Dual Gold Metallic Border Inset */}
            <div className="absolute inset-2 border border-amber-500/40 pointer-events-none rounded-sm" />
            <div className="absolute inset-3 border border-amber-400/20 pointer-events-none rounded-sm" />

            {/* Corner Luxury Diamonds */}
            <span className="absolute top-3.5 left-3.5 text-amber-400 text-xs select-none">✦</span>
            <span className="absolute top-3.5 right-3.5 text-amber-400 text-xs select-none">✦</span>
            <span className="absolute bottom-3.5 left-3.5 text-amber-400 text-xs select-none">✦</span>
            <span className="absolute bottom-3.5 right-3.5 text-amber-400 text-xs select-none">✦</span>

            {/* Header: Crown + Eyebrow + Title */}
            <div className="text-center pt-2 z-10 flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-1">
                <span>✦</span>
                <span className="text-[9px] uppercase tracking-[0.25em] font-sans font-bold">KRISHTECH LUXURY COLLECTION</span>
                <span>✦</span>
              </div>
              <input
                type="text"
                value={poster.title}
                onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                onBlur={commitPosterState}
                placeholder="ROYAL APPLIANCE TITLE"
                className="w-full bg-transparent font-serif font-black text-lg sm:text-xl text-amber-300 tracking-wider text-center uppercase outline-none"
              />
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-1.5" />
            </div>

            {/* Center Pedestal Showcase */}
            <div className="flex-1 my-3 mx-2 rounded-xl bg-gradient-to-b from-[#141108]/90 via-[#0A0906] to-[#141108]/90 border border-amber-400/40 p-3 flex items-center justify-center relative shadow-2xl z-10">
              {renderPremiumImageDropzone(
                theme.primaryNeon,
                "Drop Flagship Appliance",
                <div className="absolute bottom-2 px-3 py-0.5 rounded-full text-[9px] font-sans font-bold bg-amber-950/90 text-amber-300 border border-amber-400/60 shadow">
                  ★ SIGNATURE EDITION ★
                </div>
              )}
            </div>

            {/* Luxury Plate Card: Product Name + VIP Price */}
            <div className="mx-2 p-3 rounded-xl bg-gradient-to-r from-[#171208] via-[#0D0B05] to-[#171208] border border-amber-400/60 flex items-center justify-between gap-3 z-10 shadow-lg">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={poster.productName}
                  onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Luxury Product Name"
                  className="w-full bg-transparent font-serif font-bold text-sm text-amber-200 outline-none truncate"
                />
                <span className="text-[10px] font-sans text-amber-400/70 block mt-0.5">Handcrafted Excellence • 5 Year Royal Warranty</span>
              </div>

              <div className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black font-sans font-black text-xs sm:text-sm flex items-center gap-1 shrink-0 shadow-md">
                <span className="text-[10px] uppercase font-bold tracking-tight">VIP</span>
                <span>₹</span>
                <input
                  type="text"
                  value={poster.price}
                  inputMode="numeric"
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  onBlur={commitPosterState}
                  className="bg-transparent outline-none w-14 font-black text-center text-black"
                  placeholder="Price"
                />
                <span>/-</span>
              </div>
            </div>
          </div>
        );
      }

      case "wireframe-premium-3": {
        // 3. CYBER SPLIT-SCREEN HORIZON: 12-column grid, left data console, right full-height canvas
        const theme = getPremiumTheme("frame17");
        return (
          <div className="flex-1 grid grid-cols-12 gap-2 p-3 bg-[#050C07] relative overflow-hidden font-mono text-white">
            {/* Left Console Column (5 cols) */}
            <div className="col-span-5 flex flex-col justify-between h-full z-10 gap-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-lime-400 text-[9px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                  <span>// SYS_CONSOLE_2026</span>
                </div>
                <div className="p-1.5 bg-[#09170E] border border-lime-400/60 rounded-xs">
                  <input
                    type="text"
                    value={poster.title}
                    onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                    onBlur={commitPosterState}
                    placeholder="CYBER TITLE"
                    className="w-full bg-transparent font-black text-xs sm:text-sm tracking-wider text-lime-400 uppercase outline-none"
                  />
                </div>
              </div>

              {/* Product Info Box */}
              <div className="p-2 bg-[#09170E]/80 border border-emerald-400/40 rounded-xs flex flex-col gap-1.5">
                <input
                  type="text"
                  value={poster.productName}
                  onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Product Code/Name"
                  className="w-full bg-transparent font-bold text-xs text-white outline-none"
                />
                <textarea
                  value={poster.description}
                  onChange={(e) => setPoster((p) => ({ ...p, description: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Enter technical specifications & features..."
                  className="w-full h-16 bg-transparent text-[10px] text-gray-300 resize-none outline-none leading-tight placeholder:text-gray-500"
                />
              </div>

              {/* Cyber Price Readout */}
              <div className="p-2 bg-gradient-to-r from-lime-950/70 to-emerald-950/70 border-2 border-lime-400 rounded-xs flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-lime-300 font-extrabold">DIGITAL VALUE</span>
                <div className="flex items-center text-sm font-black text-lime-400">
                  <span>₹</span>
                  <input
                    type="text"
                    value={poster.price}
                    inputMode="numeric"
                    onChange={(e) => handlePriceChange(e.target.value)}
                    onKeyDown={handlePriceKeyDown}
                    onBlur={commitPosterState}
                    className="bg-transparent outline-none w-16 font-mono font-black"
                    placeholder="000"
                  />
                  <span>/-</span>
                </div>
              </div>

              {/* Store Stamp */}
              {renderStoreBadge(theme.primaryNeon, "KrishTech Terminal", "VERIFIED SPEC")}
            </div>

            {/* Right Full-Height Product Column (7 cols) with Corner Brackets */}
            <div className="col-span-7 h-full bg-[#08150D]/90 border border-lime-400/40 rounded-sm relative p-2 flex items-center justify-center overflow-hidden z-10">
              <span className="absolute top-1 left-1 text-lime-400 text-xs leading-none">┌</span>
              <span className="absolute top-1 right-1 text-lime-400 text-xs leading-none">┐</span>
              <span className="absolute bottom-1 left-1 text-lime-400 text-xs leading-none">└</span>
              <span className="absolute bottom-1 right-1 text-lime-400 text-xs leading-none">┘</span>

              {renderPremiumImageDropzone(
                theme.primaryNeon,
                "Drop Cyber Hero Image",
                <div className="absolute top-2 left-2 text-[8px] font-mono bg-black/70 px-1.5 py-0.5 rounded-xs text-lime-400 border border-lime-400/30">
                  REF: KT-CYBER
                </div>
              )}
            </div>
          </div>
        );
      }

      case "wireframe-premium-4": {
        // 4. BOLD TYPOGRAPHY EDITORIAL: Giant punchy headline, landscape hero, 3-card spec row
        const theme = getPremiumTheme("frame18");
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-[#140610] relative overflow-hidden font-sans text-white">
            {/* Top Giant Headline Section */}
            <div className="z-10">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[9px] font-extrabold tracking-[0.2em] uppercase text-pink-400">KRISHTECH EDITORIAL ISSUE #18</span>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-pink-500/20 text-pink-300 border border-pink-500/40">TECH TRENDS</span>
              </div>
              <input
                type="text"
                value={poster.title}
                onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                onBlur={commitPosterState}
                placeholder="BOLD DISPLAY TITLE"
                className="w-full bg-transparent font-black text-2xl sm:text-3xl uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-orange-400 to-amber-300 outline-none leading-tight"
              />
              <input
                type="text"
                value={poster.productName}
                onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                onBlur={commitPosterState}
                placeholder="Product Sub-headline"
                className="w-full bg-transparent font-semibold text-xs text-gray-300 outline-none mt-0.5"
              />
            </div>

            {/* Middle Wide Landscape Showcase */}
            <div className="flex-1 my-2.5 rounded-xl bg-[#1C0A19]/90 border border-pink-500/40 p-2 flex items-center justify-center relative overflow-hidden shadow-xl z-10">
              {renderPremiumImageDropzone(
                theme.primaryNeon,
                "Drop Landscape Hero Product",
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider bg-pink-600 text-white shadow-md">
                  HOT PICK • APPLIANCE OF THE YEAR
                </div>
              )}
            </div>

            {/* Bottom 3-Card Spec Row */}
            <div className="grid grid-cols-3 gap-2 z-10">
              <div className="p-2 rounded-lg bg-[#200C1D] border border-pink-500/30 flex flex-col justify-center items-center text-center">
                <Zap className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                <span className="text-[9px] font-bold uppercase text-gray-200">MAX POWER</span>
                <span className="text-[8px] text-gray-400">High efficiency</span>
              </div>

              <div className="p-2 rounded-lg bg-[#200C1D] border border-pink-500/30 flex flex-col justify-center items-center text-center">
                <Shield className="w-3.5 h-3.5 text-pink-400 mb-0.5" />
                <span className="text-[9px] font-bold uppercase text-gray-200">WARRANTY</span>
                <span className="text-[8px] text-gray-400">100% Genuine</span>
              </div>

              <div className="p-2 rounded-lg bg-gradient-to-r from-pink-600 to-orange-500 text-white flex flex-col justify-center items-center text-center shadow-lg">
                <span className="text-[8px] font-bold uppercase tracking-widest text-white/80">PRICE DROP</span>
                <div className="flex items-center font-black text-xs sm:text-sm">
                  <span>₹</span>
                  <input
                    type="text"
                    value={poster.price}
                    inputMode="numeric"
                    onChange={(e) => handlePriceChange(e.target.value)}
                    onKeyDown={handlePriceKeyDown}
                    onBlur={commitPosterState}
                    className="bg-transparent outline-none w-12 font-black text-center text-white"
                    placeholder="000"
                  />
                  <span>/-</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "wireframe-premium-5": {
        // 5. PRODUCT SHOWCASE SPOTLIGHT: Center stage circular spotlight, floating chips, curved dock
        const theme = getPremiumTheme("frame19");
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-[#0E061A] relative overflow-hidden font-sans text-white">
            {/* Center Stage Radial Glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-30"
              style={{ backgroundColor: theme.primaryNeon }}
            />

            {/* Header: Centered Halo Title */}
            <div className="text-center z-10 pt-1">
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[9px] font-bold uppercase tracking-wider mb-1">
                <Star className="w-3 h-3 fill-purple-400 text-purple-400" />
                <span>SPOTLIGHT SHOWCASE</span>
              </div>
              <input
                type="text"
                value={poster.title}
                onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                onBlur={commitPosterState}
                placeholder="SPOTLIGHT HEADLINE"
                className="w-full bg-transparent font-black text-lg sm:text-xl text-center text-white tracking-wide uppercase outline-none"
              />
            </div>

            {/* Central Circular Spotlight Pedestal */}
            <div className="flex-1 my-3 rounded-2xl bg-gradient-to-b from-purple-900/25 to-black/80 border border-purple-500/35 p-3 flex items-center justify-center relative shadow-2xl z-10">
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[8px] font-bold bg-purple-900/80 border border-purple-400/40 text-purple-200">
                ⭐ 4.9 VERIFIED RATING
              </div>
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[8px] font-bold bg-purple-900/80 border border-purple-400/40 text-purple-200">
                🚀 FAST SHIPPING
              </div>

              {renderPremiumImageDropzone(theme.primaryNeon, "Drop Spotlight Product")}
            </div>

            {/* Curved Bottom Dock */}
            <div className="p-2.5 rounded-2xl bg-[#140A26]/90 border border-purple-500/40 flex items-center justify-between gap-3 shadow-xl z-10">
              <div className="flex-1 min-w-0 pl-1">
                <input
                  type="text"
                  value={poster.productName}
                  onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Featured Device"
                  className="w-full bg-transparent font-bold text-xs sm:text-sm text-white outline-none truncate"
                />
                <span className="text-[10px] text-purple-300/70 block">Official KrishTech Warranty Included</span>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-mono font-black text-xs sm:text-sm flex items-center gap-1 shadow-lg shrink-0">
                <span>₹</span>
                <input
                  type="text"
                  value={poster.price}
                  inputMode="numeric"
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  onBlur={commitPosterState}
                  className="bg-transparent outline-none w-14 font-black text-center text-white"
                  placeholder="Price"
                />
                <span>/-</span>
              </div>
            </div>
          </div>
        );
      }

      case "wireframe-premium-6": {
        // 6. DIAGONAL DYNAMIC SLASH: Angled slash cuts, skewed headers, dynamic high-octane tech
        const theme = getPremiumTheme("frame20");
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-[#041219] relative overflow-hidden font-sans text-white">
            {/* Top Angled Banner & Skewed Title */}
            <div className="z-10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="px-3 py-0.5 -skew-x-12 bg-cyan-500 text-black font-black text-[9px] uppercase tracking-wider">
                  HIGH PERFORMANCE APPLIANCE
                </div>
                {renderStoreBadge(theme.primaryNeon, "KrishTech Turbo", "SPEED SPEC")}
              </div>

              <div className="p-2 -skew-x-6 bg-[#08222E]/90 border-2 border-cyan-400 shadow-lg">
                <input
                  type="text"
                  value={poster.title}
                  onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="DYNAMIC TITLE"
                  className="w-full bg-transparent font-black text-lg sm:text-xl text-cyan-300 uppercase outline-none text-center skew-x-6"
                />
              </div>
            </div>

            {/* Center Dynamic Angled Product Container */}
            <div className="flex-1 my-2.5 rounded-sm -skew-x-3 bg-gradient-to-b from-[#072433]/90 to-[#031017] border-2 border-cyan-400/50 p-3 flex items-center justify-center relative shadow-2xl z-10 overflow-hidden">
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase -skew-x-12 shadow">
                BOOSTED TECH
              </div>
              <div className="w-full h-full skew-x-3 flex items-center justify-center">
                {renderPremiumImageDropzone(theme.primaryNeon, "Drop High-Octane Device")}
              </div>
            </div>

            {/* Bottom Dynamic Price & Product Bar */}
            <div className="flex items-center gap-2 z-10">
              <div className="flex-1 p-2 -skew-x-6 bg-[#08222E]/80 border border-cyan-400/40 rounded-xs min-w-0">
                <input
                  type="text"
                  value={poster.productName}
                  onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Turbo Product Name"
                  className="w-full bg-transparent font-bold text-xs text-white outline-none truncate skew-x-6"
                />
              </div>

              <div className="px-4 py-2 -skew-x-12 bg-gradient-to-r from-rose-500 to-cyan-500 text-white font-mono font-black text-xs sm:text-sm flex items-center gap-1 shadow-xl shrink-0">
                <span className="skew-x-12">₹</span>
                <input
                  type="text"
                  value={poster.price}
                  inputMode="numeric"
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  onBlur={commitPosterState}
                  className="bg-transparent outline-none w-14 font-black text-center text-white skew-x-12"
                  placeholder="000"
                />
                <span className="skew-x-12">/-</span>
              </div>
            </div>
          </div>
        );
      }

      case "wireframe-premium-7": {
        // 7. MAGAZINE & CATALOG REVIEW: Tech cover layout, issue stamp, barcode, editorial review
        const theme = getPremiumTheme("frame21");
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-[#051410] relative overflow-hidden font-sans text-white border border-emerald-500/30">
            {/* Top Magazine Header */}
            <div className="border-b border-emerald-400/30 pb-1.5 z-10 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                <span>KRISHTECH LABS • VOL. 26</span>
                <span>ISSUE: ELECTRONICS & APPLIANCES</span>
                <span>VERIFIED TEST</span>
              </div>
              <input
                type="text"
                value={poster.title}
                onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                onBlur={commitPosterState}
                placeholder="MAGAZINE COVER TITLE"
                className="w-full bg-transparent font-black text-xl sm:text-2xl text-white uppercase tracking-tight outline-none"
              />
            </div>

            {/* Editorial Showcase with Left Bullet Callouts */}
            <div className="flex-1 my-2 flex gap-2 items-stretch z-10">
              {/* Product Photo Canvas */}
              <div className="flex-1 rounded-lg bg-[#071F18]/90 border border-emerald-400/40 p-2 relative flex items-center justify-center shadow-2xl overflow-hidden">
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black flex flex-col items-center justify-center font-black text-[7px] leading-tight text-center shadow-lg border border-amber-200">
                  <Award className="w-3 h-3 text-black mb-0.5" />
                  CHOICE
                </div>
                {renderPremiumImageDropzone(theme.primaryNeon, "Drop Editorial Appliance Photo")}
              </div>

              {/* Side Callout Specs */}
              <div className="w-24 flex flex-col justify-between gap-1.5 py-1">
                <div className="p-1.5 rounded-sm bg-[#09261E] border border-emerald-400/30">
                  <span className="text-[7.5px] font-bold uppercase text-emerald-300 block">TOP PERFORMANCE</span>
                  <span className="text-[7px] text-gray-400">A++ Energy Rating</span>
                </div>
                <div className="p-1.5 rounded-sm bg-[#09261E] border border-emerald-400/30">
                  <span className="text-[7.5px] font-bold uppercase text-emerald-300 block">SMART CONNECT</span>
                  <span className="text-[7px] text-gray-400">IoT Enabled</span>
                </div>
                <div className="p-1.5 rounded-sm bg-[#09261E] border border-emerald-400/30">
                  <span className="text-[7.5px] font-bold uppercase text-emerald-300 block">WARRANTY</span>
                  <span className="text-[7px] text-gray-400">Doorstep service</span>
                </div>
              </div>
            </div>

            {/* Bottom Barcode Plate & Editorial Price */}
            <div className="pt-2 border-t border-emerald-400/30 flex items-center justify-between gap-3 z-10">
              <div className="flex items-center gap-2">
                {/* Barcode Graphic */}
                <div className="flex items-center gap-0.5 h-6 px-1.5 bg-black/50 border border-emerald-500/30 rounded-xs">
                  {[2, 4, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2].map((w, i) => (
                    <div key={i} className="h-4 bg-emerald-400" style={{ width: `${w}px` }} />
                  ))}
                </div>
                <div className="flex flex-col">
                  <input
                    type="text"
                    value={poster.productName}
                    onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                    onBlur={commitPosterState}
                    placeholder="Product Name"
                    className="bg-transparent font-bold text-xs text-white outline-none"
                  />
                  <span className="text-[8px] text-gray-400">KRISHTECH CERTIFIED LAB REPORT</span>
                </div>
              </div>

              <div className="px-3 py-1 rounded-sm bg-emerald-500 text-black font-mono font-black text-xs sm:text-sm flex items-center gap-1 shadow-md shrink-0">
                <span>₹</span>
                <input
                  type="text"
                  value={poster.price}
                  inputMode="numeric"
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  onBlur={commitPosterState}
                  className="bg-transparent outline-none w-14 font-black text-center text-black"
                  placeholder="Price"
                />
                <span>/-</span>
              </div>
            </div>
          </div>
        );
      }

      case "wireframe-premium-8": {
        // 8. GRADIENT MESH GLASSMORPHISM: Frosted glass containers, vibrant organic glow, sleek pills
        const theme = getPremiumTheme("frame22");
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-gradient-to-br from-[#1C0606] via-[#2A0E0E] to-[#120404] relative overflow-hidden font-sans text-white">
            {/* Ambient Gradient Mesh Spheres */}
            <div className="absolute -top-16 -left-16 w-60 h-60 rounded-full bg-rose-600/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-60 h-60 rounded-full bg-orange-600/30 blur-3xl pointer-events-none" />

            {/* Header: Frosted Floating Pill */}
            <div className="z-10 flex flex-col items-center text-center">
              <div className="px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-bold uppercase tracking-wider text-orange-300 mb-1">
                ✨ ULTRA-GLASS EDITION
              </div>
              <input
                type="text"
                value={poster.title}
                onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                onBlur={commitPosterState}
                placeholder="FROSTED GLASS TITLE"
                className="w-full bg-transparent font-black text-xl sm:text-2xl text-center text-white uppercase tracking-tight outline-none"
              />
            </div>

            {/* Frosted Glass Card Showcase */}
            <div className="flex-1 my-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 p-3 flex items-center justify-center relative shadow-2xl z-10">
              <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[9px] font-bold text-orange-200">
                100% AUTHENTIC
              </div>
              {renderPremiumImageDropzone(theme.primaryNeon, "Drop Glassmorphic Product")}
            </div>

            {/* Frosted Bottom Dock */}
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-between gap-3 shadow-2xl z-10">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={poster.productName}
                  onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Appliance Model Name"
                  className="w-full bg-transparent font-bold text-xs sm:text-sm text-white outline-none truncate"
                />
                <span className="text-[10px] text-orange-200/80 block mt-0.5">KrishTech Verified Store Warranty</span>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-mono font-black text-xs sm:text-sm flex items-center gap-1 shadow-lg shrink-0">
                <span>₹</span>
                <input
                  type="text"
                  value={poster.price}
                  inputMode="numeric"
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  onBlur={commitPosterState}
                  className="bg-transparent outline-none w-14 font-black text-center text-white"
                  placeholder="Price"
                />
                <span>/-</span>
              </div>
            </div>
          </div>
        );
      }

      case "wireframe-premium-9": {
        // 9. GEOMETRIC TECH MATRIX SPECS: Cyberpunk hardware blueprint, crosshairs, PCB spec grid
        const theme = getPremiumTheme("frame23");
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-[#0F0D03] relative overflow-hidden font-mono text-yellow-300">
            {/* Top Hardware Spec Header */}
            <div className="border-b border-yellow-400/40 pb-1.5 z-10 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider text-yellow-400/80">
                <span>[SYS_SPEC: MATRIX-V9]</span>
                <span>CHIPSET: GEN-4</span>
                <span>STATUS: CERTIFIED</span>
              </div>
              <input
                type="text"
                value={poster.title}
                onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                onBlur={commitPosterState}
                placeholder="TECHNICAL MATRIX TITLE"
                className="w-full bg-transparent font-black text-lg sm:text-xl text-yellow-400 uppercase tracking-wider outline-none"
              />
            </div>

            {/* Central Viewport with 4 Crosshairs */}
            <div className="flex-1 my-2 rounded-xs bg-[#171406]/90 border border-yellow-400/50 p-2.5 relative flex items-center justify-center overflow-hidden z-10">
              <span className="absolute top-1 left-1 text-yellow-400 font-bold text-xs leading-none">+</span>
              <span className="absolute top-1 right-1 text-yellow-400 font-bold text-xs leading-none">+</span>
              <span className="absolute bottom-1 left-1 text-yellow-400 font-bold text-xs leading-none">+</span>
              <span className="absolute bottom-1 right-1 text-yellow-400 font-bold text-xs leading-none">+</span>

              {renderPremiumImageDropzone(
                theme.primaryNeon,
                "Drop Hardware Product Image",
                <div className="absolute top-2 left-2 text-[8px] bg-black/80 text-yellow-400 px-2 py-0.5 border border-yellow-400/40">
                  DIAGNOSTIC VIEW // 100%
                </div>
              )}
            </div>

            {/* 4 Technical Parameter Chips */}
            <div className="grid grid-cols-4 gap-1 z-10 mb-2">
              <div className="p-1 bg-[#1A1605] border border-yellow-400/30 text-center">
                <span className="text-[7.5px] font-bold block text-yellow-300">[ORIGINAL]</span>
                <span className="text-[6.5px] text-gray-400">100% Genuine</span>
              </div>
              <div className="p-1 bg-[#1A1605] border border-yellow-400/30 text-center">
                <span className="text-[7.5px] font-bold block text-yellow-300">[WARRANTY]</span>
                <span className="text-[6.5px] text-gray-400">Full Support</span>
              </div>
              <div className="p-1 bg-[#1A1605] border border-yellow-400/30 text-center">
                <span className="text-[7.5px] font-bold block text-yellow-300">[DELIVERY]</span>
                <span className="text-[6.5px] text-gray-400">Instant Dispatch</span>
              </div>
              <div className="p-1 bg-[#1A1605] border border-yellow-400/30 text-center">
                <span className="text-[7.5px] font-bold block text-yellow-300">[CERTIFIED]</span>
                <span className="text-[6.5px] text-gray-400">ISO Standard</span>
              </div>
            </div>

            {/* Bottom Cyberpunk Yellow Price Box */}
            <div className="p-2 bg-yellow-400 text-black flex items-center justify-between gap-2 z-10">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={poster.productName}
                  onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Hardware Model Code"
                  className="w-full bg-transparent font-black text-xs text-black outline-none truncate"
                />
              </div>

              <div className="flex items-center font-black text-xs sm:text-sm text-black shrink-0">
                <span>PRICE: ₹</span>
                <input
                  type="text"
                  value={poster.price}
                  inputMode="numeric"
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  onBlur={commitPosterState}
                  className="bg-transparent outline-none w-14 font-black text-center text-black"
                  placeholder="000"
                />
                <span>/-</span>
              </div>
            </div>
          </div>
        );
      }

      case "wireframe-premium-10": {
        // 10. PROMOTIONAL FLASH SALE: High-urgency retail sale poster, hazard stripes, discount burst badge
        const theme = getPremiumTheme("frame24");
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-[#140612] relative overflow-hidden font-sans text-white">
            {/* Top Hazard Striped Promo Ribbon */}
            <div className="z-10 flex flex-col gap-1">
              <div className="py-1 px-3 bg-gradient-to-r from-rose-600 via-orange-500 to-rose-600 text-white flex items-center justify-between text-[9px] font-black uppercase tracking-wider shadow-md rounded-xs">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 fill-white" /> FLASH TECH SALE</span>
                <span>LIMITED TIME ONLY • SAVE BIG</span>
                <span className="flex items-center gap-1"><Flame className="w-3 h-3 fill-white" /> 48 HOURS</span>
              </div>

              <div className="p-2 bg-[#200A1C] border border-rose-500/50 rounded-xs">
                <input
                  type="text"
                  value={poster.title}
                  onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="MEGA DISCOUNT SALE TITLE"
                  className="w-full bg-transparent font-black text-lg sm:text-xl text-rose-300 uppercase tracking-tight outline-none text-center"
                />
              </div>
            </div>

            {/* Central Product Dropzone with Burst Star Badge */}
            <div className="flex-1 my-2 rounded-xl bg-[#1F091B]/90 border-2 border-rose-500/50 p-3 flex items-center justify-center relative overflow-hidden shadow-2xl z-10">
              <div className="absolute top-2 right-2 w-12 h-12 rounded-full bg-rose-600 text-white flex flex-col items-center justify-center font-black text-[8px] leading-tight rotate-12 shadow-xl border-2 border-white animate-pulse">
                <span>MEGA</span>
                <span className="text-[10px]">DEAL</span>
              </div>

              {renderPremiumImageDropzone(theme.primaryNeon, "Drop Promotional Product")}
            </div>

            {/* Bottom Mega Sale Banner */}
            <div className="p-3 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 text-white rounded-xl shadow-xl flex items-center justify-between gap-3 z-10">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={poster.productName}
                  onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Discounted Product Name"
                  className="w-full bg-transparent font-black text-xs sm:text-sm text-white outline-none truncate placeholder:text-white/70"
                />
                <span className="text-[9px] text-white/80 font-bold block">✓ Lowest Price Guarantee • Free Delivery</span>
              </div>

              <div className="px-3.5 py-1.5 rounded-lg bg-black text-rose-400 font-mono font-black text-xs sm:text-sm flex items-center gap-1 shadow-md shrink-0 border border-rose-400/40">
                <span>₹</span>
                <input
                  type="text"
                  value={poster.price}
                  inputMode="numeric"
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  onBlur={commitPosterState}
                  className="bg-transparent outline-none w-14 font-black text-center text-rose-400"
                  placeholder="Price"
                />
                <span>/-</span>
              </div>
            </div>
          </div>
        );
      }

      case "wireframe-premium-11": {
        // 11. ASYMMETRIC DUET SHOWCASE: Panoramic top hero (60%), bottom asymmetric dual split cards (40%)
        const theme = getPremiumTheme("frame25");
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-[#081206] relative overflow-hidden font-sans text-white">
            {/* Top Panoramic Hero Frame (60% height) */}
            <div className="h-[60%] rounded-xl bg-[#0F220B]/90 border border-lime-400/40 p-2.5 relative flex flex-col justify-between overflow-hidden shadow-2xl z-10">
              <div className="flex items-center justify-between pb-1 z-10">
                <div className="px-2.5 py-0.5 rounded-full bg-lime-500/20 text-lime-300 border border-lime-400/40 text-[9px] font-bold uppercase">
                  ⭐ PANORAMIC SHOWCASE
                </div>
                {renderStoreBadge(theme.primaryNeon, "KrishTech Catalog", "PREMIUM DUET")}
              </div>

              <div className="flex-1 my-1">
                {renderPremiumImageDropzone(theme.primaryNeon, "Drop Panoramic Hero Image")}
              </div>

              <div className="z-10 bg-black/60 backdrop-blur-xs p-1.5 rounded-lg border border-lime-400/30">
                <input
                  type="text"
                  value={poster.title}
                  onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="HERO APPLIANCE HEADLINE"
                  className="w-full bg-transparent font-black text-sm sm:text-base text-white uppercase tracking-tight outline-none"
                />
              </div>
            </div>

            {/* Bottom Asymmetric Row: Left 7 cols Details + Right 5 cols Price Card */}
            <div className="grid grid-cols-12 gap-2 mt-2 z-10 flex-1">
              {/* Left Details Card (7 cols) */}
              <div className="col-span-7 p-2.5 rounded-xl bg-[#0D1D09] border border-lime-400/30 flex flex-col justify-between">
                <div>
                  <input
                    type="text"
                    value={poster.productName}
                    onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                    onBlur={commitPosterState}
                    placeholder="Product Model Name"
                    className="w-full bg-transparent font-bold text-xs text-white outline-none truncate"
                  />
                  <textarea
                    value={poster.description}
                    onChange={(e) => setPoster((p) => ({ ...p, description: e.target.value }))}
                    onBlur={commitPosterState}
                    placeholder="Add key features or warranty terms..."
                    className="w-full h-10 bg-transparent text-[9.5px] text-gray-300 resize-none outline-none leading-snug mt-1"
                  />
                </div>
                <span className="text-[8px] text-lime-300/80 font-semibold">✓ Authorized KrishTech Product Guarantee</span>
              </div>

              {/* Right Electric Price Card (5 cols) */}
              <div className="col-span-5 p-2.5 rounded-xl bg-gradient-to-b from-lime-500 to-emerald-600 text-black flex flex-col justify-between items-center text-center shadow-lg">
                <span className="text-[8px] font-black uppercase tracking-wider text-black/70">EXCLUSIVE DEAL</span>
                <div className="flex items-center font-mono font-black text-sm sm:text-base text-black">
                  <span>₹</span>
                  <input
                    type="text"
                    value={poster.price}
                    inputMode="numeric"
                    onChange={(e) => handlePriceChange(e.target.value)}
                    onKeyDown={handlePriceKeyDown}
                    onBlur={commitPosterState}
                    className="bg-transparent outline-none w-14 font-black text-center text-black"
                    placeholder="000"
                  />
                  <span>/-</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-black text-lime-300 text-[8px] font-bold">ORDER TODAY</span>
              </div>
            </div>
          </div>
        );
      }

      case "wireframe-premium-12": {
        // 12. HOLOGRAPHIC PRISM DIAMOND: Rainbow iridescent borders, diamond crystal crest, prism pill dock
        const theme = getPremiumTheme("frame26");
        return (
          <div
            className="flex-1 flex flex-col justify-between p-4 bg-[#070A18] relative overflow-hidden font-sans text-white"
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
              <input
                type="text"
                value={poster.title}
                onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                onBlur={commitPosterState}
                placeholder="HOLOGRAPHIC PRISM TITLE"
                className="w-full bg-transparent font-black text-xl sm:text-2xl text-center text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-pink-400 uppercase tracking-tight outline-none"
              />
            </div>

            {/* Prismatic Center Glass Card */}
            <div
              className="flex-1 my-3 rounded-2xl p-3 flex items-center justify-center relative shadow-2xl z-10"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                boxShadow: "0 0 25px rgba(103, 232, 249, 0.25)",
              }}
            >
              <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-cyan-400/50 text-[8px] font-black tracking-widest text-white">
                💎 CERTIFIED LUXURY
              </div>

              {renderPremiumImageDropzone(theme.primaryNeon, "Drop Prismatic Device Image")}
            </div>

            {/* Holographic Bottom Dock */}
            <div
              className="p-3 rounded-2xl flex items-center justify-between gap-3 shadow-2xl z-10"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={poster.productName}
                  onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Flagship Product Edition"
                  className="w-full bg-transparent font-bold text-xs sm:text-sm text-white outline-none truncate"
                />
                <span className="text-[10px] text-cyan-200/80 block mt-0.5">KrishTech Official • Iridescent Diamond Warranty</span>
              </div>

              <div
                className="px-3.5 py-1.5 rounded-xl font-mono font-black text-xs sm:text-sm flex items-center gap-1 text-black shrink-0 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #FFFFFF, #67E8F9, #E879F9)",
                }}
              >
                <span>₹</span>
                <input
                  type="text"
                  value={poster.price}
                  inputMode="numeric"
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  onBlur={commitPosterState}
                  className="bg-transparent outline-none w-14 font-black text-center text-black"
                  placeholder="Price"
                />
                <span>/-</span>
              </div>
            </div>
          </div>
        );
      }

      case "wireframe-formal-1": {
        // Formal Executive Crest: Refined serif typography, double hairline gold border, certificate crest
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-[#0B0D14] relative overflow-hidden text-[#E2E8F0]">
            {/* Elegant double border inner container */}
            <div className="absolute inset-1.5 border border-amber-500/30 pointer-events-none rounded-xs" />

            {/* Top Formal Crest & Title */}
            <div className="z-10 flex flex-col items-center text-center gap-1">
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-amber-400/50" />
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-400/40 bg-amber-400/10 text-[9px] font-bold text-amber-300 uppercase tracking-widest">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>{poster.badgeText || "EXECUTIVE HERITAGE"}</span>
                </div>
                <div className="h-px w-8 bg-amber-400/50" />
              </div>

              <input
                type="text"
                value={poster.title}
                onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                onBlur={commitPosterState}
                placeholder="FORMAL POSTER HEADLINE"
                className="w-full bg-transparent font-serif font-black text-lg sm:text-xl text-amber-200 outline-none text-center tracking-wide mt-0.5"
              />
            </div>

            {/* Central Framed Product Dropzone with gold ornamental corners */}
            <div className="flex-1 my-2 rounded-lg bg-[#111420]/90 border border-amber-500/40 p-2 relative flex flex-col items-center justify-center shadow-xl z-10 overflow-hidden">
              <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l border-amber-400" />
              <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r border-amber-400" />
              <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b border-l border-amber-400" />
              <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b border-r border-amber-400" />
              {renderDropzone("full")}
            </div>

            {/* Bottom Plaque with Details & Price */}
            <div className="p-2.5 rounded-lg bg-[#141724] border border-amber-500/30 flex items-center justify-between gap-3 z-10">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={poster.productName}
                  onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Executive Product Name"
                  className="w-full bg-transparent font-serif font-bold text-xs sm:text-sm text-amber-100 outline-none truncate"
                />
                <input
                  type="text"
                  value={poster.description || ""}
                  onChange={(e) => setPoster((p) => ({ ...p, description: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Distinguished corporate specifications..."
                  className="w-full bg-transparent text-[10px] text-gray-400 outline-none truncate mt-0.5"
                />
              </div>

              {poster.showPriceTag && (
                <div className="px-3 py-1 rounded bg-amber-500/15 border border-amber-400/50 text-amber-300 font-mono font-bold text-xs sm:text-sm flex items-center gap-0.5 shrink-0 shadow-sm">
                  <span>₹</span>
                  <input
                    type="text"
                    value={poster.price}
                    inputMode="numeric"
                    onChange={(e) => handlePriceChange(e.target.value)}
                    onKeyDown={handlePriceKeyDown}
                    onBlur={commitPosterState}
                    className="bg-transparent outline-none w-14 font-bold text-center text-amber-300"
                    placeholder="0"
                  />
                  <span>/-</span>
                </div>
              )}
            </div>
          </div>
        );
      }

      case "wireframe-formal-2": {
        // Royal Prestige: Regal navy & gold presentation, top seal, clean bottom card
        return (
          <div className="flex-1 flex flex-col justify-between p-3.5 bg-[#070C18] relative overflow-hidden text-[#E2E8F0]">
            {/* Top Royal Seal Header */}
            <div className="z-10 flex items-center justify-between pb-1.5 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                {renderStoreBadge("#F59E0B", "KrishTech Official", "ROYAL PRESTIGE")}
              </div>
              <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-[9px] font-bold text-amber-300 uppercase">
                ★ CERTIFIED GENUINE
              </div>
            </div>

            {/* Poster Title */}
            <div className="z-10 text-center my-1">
              <input
                type="text"
                value={poster.title}
                onChange={(e) => setPoster((p) => ({ ...p, title: poster.isUppercase ? e.target.value.toUpperCase() : e.target.value }))}
                onBlur={commitPosterState}
                placeholder="ROYAL PRESTIGE TITLE"
                className="w-full bg-transparent font-serif font-black text-lg sm:text-xl text-white outline-none text-center tracking-wider"
              />
            </div>

            {/* Central Product Showcase Frame */}
            <div className="flex-1 my-1 rounded-xl bg-[#0B1324] border border-amber-400/30 p-2 relative flex items-center justify-center shadow-2xl z-10 overflow-hidden">
              {renderDropzone("full")}
            </div>

            {/* Bottom Royal Gold Card */}
            <div className="p-3 bg-gradient-to-r from-amber-950/70 via-[#181F33] to-amber-950/70 rounded-xl border border-amber-400/30 flex items-center justify-between gap-3 z-10">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={poster.productName}
                  onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                  onBlur={commitPosterState}
                  placeholder="Aristocrat Edition Product"
                  className="w-full bg-transparent font-serif font-bold text-xs sm:text-sm text-amber-200 outline-none truncate"
                />
                <span className="text-[9px] text-gray-400 block mt-0.5 font-medium">Authenticity Sealed • Full Warranty Coverage</span>
              </div>

              {poster.showPriceTag && (
                <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-amber-400 text-amber-300 font-mono font-bold text-xs sm:text-sm flex items-center gap-0.5 shrink-0 shadow-md">
                  <span>₹</span>
                  <input
                    type="text"
                    value={poster.price}
                    inputMode="numeric"
                    onChange={(e) => handlePriceChange(e.target.value)}
                    onKeyDown={handlePriceKeyDown}
                    onBlur={commitPosterState}
                    className="bg-transparent outline-none w-14 font-bold text-center text-amber-300"
                    placeholder="0"
                  />
                  <span>/-</span>
                </div>
              )}
            </div>
          </div>
        );
      }

      case "blank":
      case "wireframe-2":
      default:
        return (
          <div className="flex-1 flex flex-col gap-1.5 p-2 bg-white dark:bg-[#141722] overflow-hidden">
            {renderTitleBox()}
            {renderProductNameBox()}
            {poster.showPriceTag && renderPriceAndBadge()}
            {renderDropzone("full")}
          </div>
        );
    }
  };

  return (
    <div
      className={`w-full h-full max-h-screen overflow-hidden relative flex flex-col font-sans select-none transition-colors duration-200 ${isDarkMode ? "bg-[#0D0E12] text-[#E0E2EC]" : "bg-[#EFF2F6] text-gray-900"
        }`}
    >
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
        onChange={handleImageUpload}
      />

      {/* Hidden File Input for Background Image Upload */}
      <input
        ref={bgImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
        onChange={handleBgImageUpload}
      />

      {/* Hidden File Input for Logo Upload */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
        onChange={handleLogoUpload}
      />

      {/* Hidden File Input for Camera Photo Selection */}
      <input
        ref={cameraFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
        onChange={handleImageUpload}
      />

      {/* ══════════════════════════════════════════════════════════════
          0. MAIN RENOTE HEADER (Exact Match to Poster Listing Page)
         ══════════════════════════════════════════════════════════════ */}
      <Header />

      <div className={`w-full flex-1 min-h-0 flex flex-col overflow-hidden transition-colors duration-200 ${isDarkMode ? "bg-[#0A0A0B] text-[#E0E2EC]" : "bg-[#F3F4F8] text-gray-900"}`}>
        {/* ══════════════════════════════════════════════════════════════
            1. TOP STUDIO BAR (Non-overlapping, compact, responsive)
           ══════════════════════════════════════════════════════════════ */}
        <header className={`h-11 sm:h-12 border-b px-3 sm:px-4 flex items-center justify-between relative z-30 shrink-0 select-none transition-colors duration-200 ${isDarkMode ? "bg-[#0F1015] border-[#262626] text-white" : "bg-[#FFFFFF] border-[#E5E7EB] text-gray-900 shadow-xs"
          }`}>
          {/* Left section: Simple Back button */}
          <div className="flex items-center gap-2 z-10 shrink-0">
            <Link
              href="/pages/poster"
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${isDarkMode
                ? "bg-[#141414] hover:bg-[#1E1E1E] border-[#262626] text-gray-300 hover:text-white"
                : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 hover:text-black"
                }`}
              title="Back to Posters"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF5722]" />
              <span>Back</span>
            </Link>
          </div>

          {/* Center section: Perfectly centered Poster Title */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center max-w-[32%] sm:max-w-[40%] md:max-w-[45%] pointer-events-auto z-10">
            <span
              onClick={() => {
                setInspectorTab("content");
                setShowTemplatesCard(true);
                setTimeout(() => titleInputRef.current?.focus(), 80);
              }}
              className={`font-bold text-xs sm:text-sm truncate cursor-pointer hover:text-[#FF5722] transition-colors text-center ${isDarkMode ? "text-white" : "text-gray-900"
                }`}
              title="Poster Title (Click to edit in Content tab)"
            >
              {poster.title || "Untitled Poster"}
            </span>
          </div>

          {/* Right section: Selected Template Label & Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 z-10 shrink-0">
            {/* Selected Template Name Label */}
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold border select-none shrink-0 ${isDarkMode ? "bg-[#161618] border-[#2A2A2E] text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700 shadow-2xs"
                }`}
              title={`Active Template Layout: ${selectedTemplateInfo.name}`}
            >
              <LayoutGrid className="w-3 h-3 text-[#FF5722]" />
              <span className="font-bold truncate max-w-[80px] sm:max-w-[130px]">{selectedTemplateInfo.name}</span>
            </div>

            {/* Publish Button (Replaces old Save As position) */}
            <button
              type="button"
              onClick={handleOpenPublishFlow}
              disabled={isPublishing || isSaving}
              className={`h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95 ${isAlreadyPublished && !hasUnpublishedChanges
                ? isDarkMode
                  ? "bg-emerald-950/40 border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/40"
                  : "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                : isAlreadyPublished && hasUnpublishedChanges
                  ? isDarkMode
                    ? "bg-amber-950/40 border-amber-600/50 text-amber-400 hover:bg-amber-900/40"
                    : "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                  : isDarkMode
                    ? "bg-[#181818] hover:bg-[#222222] border-[#2E2E2E] text-gray-200 hover:border-gray-600"
                    : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700 shadow-xs"
                }`}
              title={
                isAlreadyPublished && !hasUnpublishedChanges
                  ? "Published on Marketplace (No changes pending)"
                  : isAlreadyPublished && hasUnpublishedChanges
                    ? "Published version exists, but new changes are ready to publish"
                    : "Publish this poster to Marketplace"
              }
            >
              {isAlreadyPublished && !hasUnpublishedChanges ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-semibold">Published</span>
                  {currentPosterRecord?.publishedVersion ? (
                    <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      v{currentPosterRecord.publishedVersion}
                    </span>
                  ) : null}
                </>
              ) : isAlreadyPublished && hasUnpublishedChanges ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span className="font-semibold">Publish</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Update
                  </span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-[#FF5722]" />
                  <span>Publish</span>
                </>
              )}
            </button>

            {/* Unified Orange Save Button with Dropdown (Split Button) */}
            <div className="relative inline-flex items-center rounded-lg shadow-md shadow-[#FF5722]/20" ref={saveDropdownRef}>
              {/* Primary Save / Update Button */}
              <button
                type="button"
                onClick={() => handleSavePoster(false)}
                disabled={isSaving}
                className="h-8 sm:h-9 px-3 sm:px-4 rounded-l-lg bg-[#FF5722] hover:bg-[#E64A19] text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 active:brightness-95"
                title={isEditMode ? "Update poster changes in your catalog" : "Save poster changes to your catalog"}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? (isEditMode ? "Updating..." : "Saving...") : isEditMode ? "Update" : "Save"}</span>
              </button>

              {/* Dropdown Toggle Chevron */}
              <button
                type="button"
                onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                disabled={isSaving || isDownloading}
                className="h-8 sm:h-9 px-1.5 sm:px-2 rounded-r-lg bg-[#FF5722] hover:bg-[#E64A19] text-white border-l border-white/25 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 active:brightness-95"
                title="Export formats (PNG, JPG, PDF) and Save As options"
                aria-expanded={showSaveDropdown}
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSaveDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {showSaveDropdown && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute right-0 top-full mt-1.5 w-56 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 border backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 ${isDarkMode ? "bg-[#141414]/95 border-[#2E2E2E] shadow-black/60" : "bg-white/95 border-gray-200 shadow-xl"
                    }`}
                >
                  {/* Section: Export / Download Formats */}
                  <div className="px-2 pt-1 pb-0.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Export Poster
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveDropdown(false);
                      handleDownloadImage("png");
                    }}
                    disabled={isDownloading}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${isDarkMode ? "hover:bg-[#202020] text-gray-200 hover:text-white" : "hover:bg-orange-50/80 text-gray-700 hover:text-gray-900"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileImage className="w-3.5 h-3.5 text-[#FF5722]" />
                      <span>Export as PNG</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1 rounded ${isDarkMode ? "bg-[#252525] text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                      High-Res
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveDropdown(false);
                      handleDownloadImage("jpeg");
                    }}
                    disabled={isDownloading}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${isDarkMode ? "hover:bg-[#202020] text-gray-200 hover:text-white" : "hover:bg-orange-50/80 text-gray-700 hover:text-gray-900"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileImage className="w-3.5 h-3.5 text-amber-500" />
                      <span>Export as JPG</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1 rounded ${isDarkMode ? "bg-[#252525] text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                      Web
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveDropdown(false);
                      handleDownloadImage("pdf");
                    }}
                    disabled={isDownloading}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${isDarkMode ? "hover:bg-[#202020] text-gray-200 hover:text-white" : "hover:bg-orange-50/80 text-gray-700 hover:text-gray-900"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-rose-500" />
                      <span>Export as PDF</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1 rounded ${isDarkMode ? "bg-[#252525] text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                      Print A4
                    </span>
                  </button>

                  {/* Animated Video & GIF Exports */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveDropdown(false);
                      handleExportVideo();
                    }}
                    disabled={isDownloading}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${isDarkMode ? "hover:bg-[#202020] text-gray-200 hover:text-white" : "hover:bg-orange-50/80 text-gray-700 hover:text-gray-900"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Video className="w-3.5 h-3.5 text-purple-500" />
                      <span>Export as MP4 Video</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1 rounded ${isDarkMode ? "bg-[#252525] text-purple-400" : "bg-purple-100 text-purple-600"}`}>
                      Video
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveDropdown(false);
                      handleExportGif();
                    }}
                    disabled={isDownloading}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${isDarkMode ? "hover:bg-[#202020] text-gray-200 hover:text-white" : "hover:bg-orange-50/80 text-gray-700 hover:text-gray-900"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Film className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Export as Animated GIF</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1 rounded ${isDarkMode ? "bg-[#252525] text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}>
                      Loop
                    </span>
                  </button>

                  <div className={`h-px my-1 ${isDarkMode ? "bg-[#262626]" : "bg-gray-200"}`} />

                  {/* Section: Save Options */}
                  <div className="px-2 pb-0.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Save Options
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveDropdown(false);
                      handleSavePoster(true);
                    }}
                    disabled={isSaving}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${isDarkMode ? "hover:bg-[#202020] text-gray-200 hover:text-white" : "hover:bg-orange-50/80 text-gray-700 hover:text-gray-900"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-blue-500" />
                      <span>Save as New Copy</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1 rounded ${isDarkMode ? "bg-[#252525] text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                      Duplicate
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Toggle Inspector Panel */}
            <button
              type="button"
              onClick={() => setShowTemplatesCard(!showTemplatesCard)}
              className={`h-8 sm:h-9 w-8 sm:w-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${showTemplatesCard
                ? "bg-[#FF5722]/15 border-[#FF5722] text-[#FF5722]"
                : isDarkMode
                  ? "bg-[#141414] border-[#262626] text-gray-400 hover:text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:text-gray-900 shadow-xs"
                }`}
              title={showTemplatesCard ? "Hide Inspector Panel" : "Show Inspector Panel"}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════════
            2. MAIN WORKSPACE: CANVAS (CENTER) + INSPECTOR (RIGHT)
           ══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex overflow-hidden relative min-h-0">
          {/* ── CENTER STAGE: POSTER CANVAS ── */}
          <main
            ref={mainContainerRef}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (
                !target.closest("#poster-canvas-render") &&
                !target.closest("[data-element-toolbar]") &&
                !target.closest("[data-image-toolbar]") &&
                !target.closest("[data-export-ignore]")
              ) {
                handleSelectElement(null);
              }
            }}
            className={`flex-1 h-full min-w-0 flex flex-col items-center justify-center p-2 sm:p-3 pb-12 overflow-auto relative select-none transition-colors duration-200 ${isDarkMode ? "bg-[#0A0A0B]" : "bg-[#EDF0F5]"
              }`}
          >
            {(() => {
              const isPremiumMode =
                poster.templateCategory === "Premium" &&
                poster.template.startsWith("frame") &&
                parseInt(poster.template.replace("frame", "")) >= 15 &&
                parseInt(poster.template.replace("frame", "")) <= 26;
              const theme = getPremiumTheme(poster.template);

              return (
                <div
                  style={{
                    width: `${Math.round(420 * canvasZoom)}px`,
                    height: `${Math.round(580 * canvasZoom)}px`,
                    transition: "width 0.15s ease-out, height 0.15s ease-out",
                  }}
                  className="relative shrink-0 flex items-center justify-center my-auto"
                >
                  <div
                    style={{
                      width: "420px",
                      height: "580px",
                      transform: `scale(${canvasZoom})`,
                      transformOrigin: "center center",
                      transition: "transform 0.15s ease-out",
                    }}
                    className="shrink-0 transition-all duration-300"
                  >
                    <PosterCanvasView
                      ref={canvasRef}
                      poster={poster}
                      readOnly={previewMode === "preview"}
                      priceError={priceError}
                      onPriceError={triggerPriceError}
                      selectedElement={selectedElement}
                      onSelectElement={handleSelectElement}
                      selectedStickerId={selectedStickerId}
                      onSelectSticker={(id) => {
                        handleSelectElement(id ? `sticker:${id}` : null);
                      }}
                      isImageSelected={isImageSelected}
                      onSelectImage={(sel) => {
                        handleSelectElement(sel ? "image" : null);
                      }}
                      onPosterChange={(updater) => {
                        setPoster((prev) => {
                          const next = updater(prev);
                          return next;
                        });
                      }}
                      onCommit={commitPosterState}
                      onFileBrowse={() => fileInputRef.current?.click()}
                      onLogoBrowse={() => logoInputRef.current?.click()}
                      onRemoveImage={() => {
                        setPoster((prev) => {
                          const next = { ...prev, productImage: "" };
                          pushState(next);
                          return next;
                        });
                        handleSelectElement(null);
                      }}
                      onFocusTitleInput={() => {
                        setInspectorTab("content");
                        setShowTemplatesCard(true);
                        setTimeout(() => titleInputRef.current?.focus(), 80);
                      }}
                      onDropImage={handleImageDrop}
                      isPlayingAnimation={isPlayingAnimation}
                      onTogglePlayAnimation={() => setIsPlayingAnimation((prev) => !prev)}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Bottom floating poster editing toolbar on canvas stage */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
              {/* Position helper controls (Zoom In / Out / Level / Reset) when Position is active */}
              {(selectedElement === "image" || isImageSelected) && poster.productImage && (
                <div
                  className={`mb-2 flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border shadow-xl text-[11px] animate-in fade-in slide-in-from-bottom-2 duration-150 select-none whitespace-nowrap z-30 ${
                    isDarkMode ? "bg-[#141414]/95 border-[#262626] text-white" : "bg-white/95 border-gray-200 text-gray-800 shadow-md"
                  }`}
                >
                  <span className={`text-[10px] hidden sm:inline ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Drag image to move
                  </span>
                  <span className={`hidden sm:inline ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}>•</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextZoom = Math.max(0.3, +((poster.imageZoom || 1) - 0.15).toFixed(2));
                      setPoster((prev) => {
                        const next = { ...prev, imageZoom: nextZoom };
                        pushState(next);
                        return next;
                      });
                    }}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      isDarkMode ? "hover:bg-white/10 text-gray-300 hover:text-white" : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="w-3.5 h-3.5 text-[#FF5722]" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-[#FF5722] px-1 min-w-[38px] text-center">
                    {Math.round((poster.imageZoom || 1) * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextZoom = Math.min(3.5, +((poster.imageZoom || 1) + 0.15).toFixed(2));
                      setPoster((prev) => {
                        const next = { ...prev, imageZoom: nextZoom };
                        pushState(next);
                        return next;
                      });
                    }}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      isDarkMode ? "hover:bg-white/10 text-gray-300 hover:text-white" : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-[#FF5722]" />
                  </button>
                  <div className={`w-px h-3 mx-0.5 ${isDarkMode ? "bg-white/20" : "bg-gray-300"}`} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPoster((prev) => {
                        const next = { ...prev, imageZoom: 1, imagePosition: { x: 0, y: 0 } };
                        pushState(next);
                        return next;
                      });
                    }}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                      isDarkMode ? "hover:bg-white/10 text-gray-300 hover:text-white" : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                    title="Reset position and zoom"
                  >
                    Reset
                  </button>
                </div>
              )}

              {/* Main 3-option Editing Toolbar */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border shadow-xl text-[11px] font-semibold select-none transition-colors ${
                  isDarkMode ? "bg-[#141414]/95 border-[#262626] text-gray-300" : "bg-white/95 border-gray-200 text-gray-700 shadow-md"
                }`}
              >
                {/* 1. Upload */}
                <button
                  type="button"
                  onClick={() => {
                    setPreviewMode("edit");
                    fileInputRef.current?.click();
                  }}
                  className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isDarkMode ? "text-gray-300 hover:text-white hover:bg-[#202020]" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  title="Upload or replace product image from device"
                >
                  <Upload className="w-3.5 h-3.5 text-[#FF5722]" />
                  <span>Upload</span>
                </button>

                <div className={`h-3 w-px ${isDarkMode ? "bg-[#262626]" : "bg-gray-200"}`} />

                {/* 2. Position */}
                <button
                  type="button"
                  onClick={() => {
                    if (!poster.productImage) {
                      fileInputRef.current?.click();
                      return;
                    }
                    setPreviewMode("edit");
                    if (selectedElement === "image" || isImageSelected) {
                      handleSelectElement(null);
                    } else {
                      handleSelectElement("image");
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
                    (selectedElement === "image" || isImageSelected) && poster.productImage
                      ? "bg-[#FF5722] text-white shadow-sm"
                      : isDarkMode
                        ? "text-gray-300 hover:text-white hover:bg-[#202020]"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  title="Freely drag image to reposition and zoom in or out"
                >
                  <Move className={`w-3.5 h-3.5 ${(selectedElement === "image" || isImageSelected) && poster.productImage ? "text-white" : "text-[#FF5722]"}`} />
                  <span>Position</span>
                </button>

                <div className={`h-3 w-px ${isDarkMode ? "bg-[#262626]" : "bg-gray-200"}`} />

                {/* 3. Delete */}
                <button
                  type="button"
                  disabled={!poster.productImage}
                  onClick={() => {
                    if (!poster.productImage) return;
                    setPoster((prev) => {
                      const next = {
                        ...prev,
                        productImage: "",
                        imagePosition: { x: 0, y: 0 },
                        imageZoom: 1,
                      };
                      pushState(next);
                      return next;
                    });
                    handleSelectElement(null);
                    safeToastSuccess("Product image removed");
                  }}
                  className={`px-2.5 py-1 rounded-full transition-colors flex items-center gap-1.5 ${
                    !poster.productImage
                      ? "opacity-35 cursor-not-allowed text-gray-500"
                      : isDarkMode
                        ? "text-gray-300 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                        : "text-gray-600 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                  }`}
                  title={poster.productImage ? "Remove product image" : "No image to delete"}
                >
                  <Trash2 className={`w-3.5 h-3.5 ${poster.productImage ? "text-red-400" : "text-gray-500"}`} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </main>

          {/* ── RIGHT INSPECTOR PANEL (Docked, responsive, non-overlapping) ── */}
          {showTemplatesCard && (
            <aside className={`w-80 lg:w-[340px] shrink-0 border-l h-full flex flex-col overflow-hidden transition-all duration-300 z-20 ${isDarkMode ? "bg-[#141414] border-[#262626] text-[#E0E2EC]" : "bg-white border-[#E5E7EB] text-gray-900 shadow-sm"
              }`}>
              {/* Inspector Header Tabs: Templates | Content | Style | Stickers */}
              <div className={`p-1.5 border-b shrink-0 select-none sticky top-0 z-10 ${isDarkMode ? "bg-[#0F0F10] border-[#262626]" : "bg-gray-50 border-gray-200"}`}>
                <div className={`grid grid-cols-4 p-0.5 rounded-lg text-xs font-bold gap-1 ${isDarkMode ? "bg-[#1A1A1A]" : "bg-gray-200"}`}>
                  <button
                    type="button"
                    onClick={() => setInspectorTab("templates")}
                    className={`py-1 rounded-md flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${inspectorTab === "templates"
                      ? "bg-[#FF5722] text-white shadow-xs"
                      : isDarkMode
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Templates</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectorTab("content")}
                    className={`py-1 rounded-md flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${inspectorTab === "content"
                      ? "bg-[#FF5722] text-white shadow-xs"
                      : isDarkMode
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    <Type className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Content</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectorTab("styling")}
                    className={`py-1 rounded-md flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${inspectorTab === "styling"
                      ? "bg-[#FF5722] text-white shadow-xs"
                      : isDarkMode
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    <Palette className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Style</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectorTab("stickers")}
                    className={`py-1 rounded-md flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${inspectorTab === "stickers"
                      ? "bg-[#FF5722] text-white shadow-xs"
                      : isDarkMode
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    <Sticker className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Stickers</span>
                  </button>
                </div>
              </div>

              {/* Inspector Body Content */}
              <div
                ref={inspectorScrollRef}
                className={`flex-1 min-h-0 h-full overflow-x-hidden overscroll-contain scroll-smooth ${
                  inspectorTab === "styling"
                    ? "overflow-y-auto style-panel-scroll-area"
                    : "overflow-y-auto custom-scrollbar"
                }`}
              >
                <div
                  className={`p-2.5 flex flex-col gap-2.5 text-xs ${
                    inspectorTab === "styling" ? "pb-20" : "pb-3"
                  }`}
                >
                {/* ──────────────── TAB 1: TEMPLATES ──────────────── */}
                {inspectorTab === "templates" && (
                  <div className="flex flex-col gap-3">
                    {/* Search Bar */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDarkMode ? "bg-[#1A1A1A] border-[#262626]" : "bg-gray-50 border-gray-200"
                      }`}>
                      <Search className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                      <input
                        type="text"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Search templates..."
                        className={`w-full bg-transparent text-xs outline-none ${isDarkMode ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                          }`}
                      />
                      {templateSearch && (
                        <button
                          type="button"
                          onClick={() => setTemplateSearch("")}
                          className={`cursor-pointer ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Buttons: Exactly 4 Compact Filters (All, Classic, Business, Premium) */}
                    <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full">
                      {(() => {
                        const totalTemplateCount = TEMPLATE_CATEGORIES.reduce((acc, c) => acc + c.templates.length, 0);
                        return (
                          <button
                            type="button"
                            onClick={() => setSelectedTemplateCategory("all")}
                            className={`h-7 sm:h-8 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center text-center ${selectedTemplateCategory === "all"
                              ? "bg-[#FF5722] text-white shadow-xs font-extrabold"
                              : isDarkMode
                                ? "bg-[#16171B] border border-[#26262A] text-gray-300 hover:text-white hover:bg-[#202127]"
                                : "bg-gray-100 border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-200/80"
                              }`}
                            title={`Show all ${totalTemplateCount} templates`}
                          >
                            <span>All</span>
                            <span className="text-[9px] font-mono ml-0.5 opacity-80">({totalTemplateCount})</span>
                          </button>
                        );
                      })()}
                      {TEMPLATE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedTemplateCategory(cat.id)}
                          className={`h-7 sm:h-8 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center text-center ${selectedTemplateCategory === cat.id
                            ? "bg-[#FF5722] text-white shadow-xs font-extrabold"
                            : isDarkMode
                              ? "bg-[#16171B] border border-[#26262A] text-gray-300 hover:text-white hover:bg-[#202127]"
                              : "bg-gray-100 border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-200/80"
                            }`}
                          title={`Filter by ${cat.label} (${cat.templates.length} templates)`}
                        >
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Blank Template Option */}
                    <button
                      type="button"
                      onClick={() => {
                        pushState((prev) => ({
                          ...prev,
                          template: "frame0",
                          templateCategory: "Blank",
                        }));
                      }}
                      className={`w-full py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer text-center ${poster.template === "frame0"
                        ? "border-[#FF5722] bg-[#FF5722]/15 text-[#FF5722] ring-1 ring-[#FF5722]"
                        : isDarkMode
                          ? "border-[#262626] bg-[#1A1A1A] text-gray-300 hover:border-gray-500"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-gray-100"
                        }`}
                    >
                      Blank Canvas Design
                    </button>

                    {/* Compact 4-column × 3-row Template Grid (12 visible templates) with smooth scrolling */}
                    {(() => {
                      const allFilteredTemplates = TEMPLATE_CATEGORIES
                        .filter((cat) => (selectedTemplateCategory === "all" ? true : cat.id === selectedTemplateCategory))
                        .flatMap((cat) =>
                          cat.templates.map((tpl) => ({
                            ...tpl,
                            categoryId: cat.id,
                            categoryLabel: cat.label,
                            isPremium: Boolean(cat.isPremium),
                          }))
                        )
                        .filter((tpl) =>
                          templateSearch.trim()
                            ? tpl.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                            tpl.categoryLabel.toLowerCase().includes(templateSearch.toLowerCase())
                            : true
                        );

                      if (allFilteredTemplates.length === 0) {
                        return (
                          <div className={`flex flex-col items-center justify-center p-6 text-center rounded-xl border ${isDarkMode ? "text-gray-500 bg-[#18181A] border-[#262626]" : "text-gray-500 bg-gray-50 border-gray-200"
                            }`}>
                            <Search className={`w-5 h-5 mb-1.5 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                            <span className="text-xs font-semibold">No templates found</span>
                            <span className={`text-[10px] mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Try searching with a different term</span>
                            {templateSearch && (
                              <button
                                type="button"
                                onClick={() => setTemplateSearch("")}
                                className={`mt-2.5 px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${isDarkMode
                                  ? "bg-[#262626] hover:bg-[#333] text-gray-300 hover:text-white"
                                  : "bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900"
                                  }`}
                              >
                                Clear Search
                              </button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-1.5">
                          <div className={`flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider px-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}>
                            <span className="flex items-center gap-1.5">
                              {selectedTemplateCategory === "premium" && <Sparkles className="w-3 h-3 text-amber-400" />}
                              <span>
                                {selectedTemplateCategory === "all"
                                  ? "All Designs"
                                  : TEMPLATE_CATEGORIES.find((c) => c.id === selectedTemplateCategory)?.label || "Templates"}
                              </span>
                            </span>
                            <span className={`font-mono font-normal ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                              {allFilteredTemplates.length} {allFilteredTemplates.length === 1 ? "design" : "designs"}
                            </span>
                          </div>

                          {/* 4-column x 3-row grid (12 visible cards) with smooth scroll */}
                          <div className="grid grid-cols-4 gap-1.5 max-h-[320px] overflow-y-auto pr-0.5 custom-scrollbar scroll-smooth">
                            {allFilteredTemplates.map((tpl) => {
                              const isSelected = poster.template === tpl.id;

                              return (
                                <button
                                  key={tpl.id}
                                  type="button"
                                  onClick={() => {
                                    const preset = getTemplatePreset(tpl.id);
                                    pushState((prev) => ({
                                      ...prev,
                                      template: tpl.id,
                                      templateCategory: tpl.isPremium ? "Premium" : tpl.categoryLabel,
                                      badgeText:
                                        !prev.badgeText ||
                                          prev.badgeText === "VERIFIED AUTHENTIC" ||
                                          prev.badgeText === "EXECUTIVE HERITAGE" ||
                                          prev.badgeText === "OFFICIAL LAUNCH" ||
                                          prev.badgeText === "OFFICIAL PRODUCT" ||
                                          prev.badgeText === "CATALOG DUET"
                                          ? preset.badgeText
                                          : prev.badgeText,
                                    }));
                                  }}
                                  className={`h-[86px] rounded-lg border p-1 flex flex-col justify-between transition-colors cursor-pointer relative text-left group overflow-hidden ${isSelected
                                    ? "border-[#FF5722] ring-1.5 ring-[#FF5722] bg-[#FF5722]/10"
                                    : isDarkMode
                                      ? "border-[#262626] hover:border-gray-500 hover:bg-[#202024] bg-[#18181A]"
                                      : "border-gray-200 hover:border-gray-400 hover:bg-gray-100 bg-gray-50"
                                    }`}
                                  title={tpl.name}
                                >
                                  {/* Top Badge: PRO if premium */}
                                  {tpl.isPremium && (
                                    <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-amber-500/25 text-amber-400 text-[7px] font-extrabold tracking-wider z-10 leading-tight">
                                      PRO
                                    </div>
                                  )}

                                  {/* Checkmark when selected */}
                                  {isSelected && (
                                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#FF5722] text-white flex items-center justify-center shrink-0 shadow-xs z-10">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </div>
                                  )}

                                  {/* Mini Wireframe preview */}
                                  <div className={`w-full h-[52px] rounded overflow-hidden pointer-events-none flex items-center justify-center p-0.5 ${isDarkMode ? "bg-[#101012]" : "bg-white border border-gray-100"
                                    }`}>
                                    {renderMiniWireframe(tpl.type, isSelected)}
                                  </div>

                                  {/* Template Name */}
                                  <span className={`text-[9px] font-semibold truncate text-center w-full px-0.5 leading-tight ${isDarkMode ? "text-gray-300 group-hover:text-white" : "text-gray-700 group-hover:text-black"
                                    }`}>
                                    {tpl.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ──────────────── TAB 2: CONTENT & MEDIA ──────────────── */}
                {inspectorTab === "content" && (
                  <div className="flex flex-col gap-3">
                    {/* Poster Title & Product Name */}
                    <div className={`flex flex-col gap-2 p-2.5 rounded-xl border ${isDarkMode ? "bg-[#1A1A1A] border-[#262626]" : "bg-gray-50 border-gray-200"
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                          Poster Headline &amp; Title
                        </span>
                        <label className={`flex items-center gap-1 text-[10px] cursor-pointer ${isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                          <input
                            type="checkbox"
                            checked={poster.isUppercase}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setPoster((p) => ({
                                ...p,
                                isUppercase: isChecked,
                                title: isChecked ? p.title.toUpperCase() : p.title,
                              }));
                              setTitleDraft((prev) => (isChecked ? prev.toUpperCase() : prev));
                            }}
                            className="w-3 h-3 accent-[#FF5722]"
                          />
                          <span>Caps</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          ref={titleInputRef}
                          type="text"
                          value={titleDraft}
                          onChange={(e) => {
                            const val = poster.isUppercase ? e.target.value.toUpperCase() : e.target.value;
                            setTitleDraft(val);
                            setPoster((p) => ({ ...p, title: val }));
                          }}
                          onBlur={commitPosterState}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleApplyTitle();
                            }
                          }}
                          placeholder="Poster Headline"
                          className={`flex-1 border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#FF5722] ${isDarkMode
                            ? "bg-[#141414] border-[#262626] text-white placeholder-gray-500"
                            : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyTitle()}
                          disabled={titleDraft === poster.title}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all select-none shrink-0 ${titleDraft !== poster.title
                            ? "bg-[#FF5722] hover:bg-[#F4511E] text-white shadow-xs active:scale-95 cursor-pointer"
                            : isDarkMode
                              ? "bg-[#222222] text-gray-500 cursor-default opacity-60"
                              : "bg-gray-100 text-gray-400 cursor-default opacity-60"
                            }`}
                          title={titleDraft !== poster.title ? "Apply title to poster (Enter)" : "Title already applied"}
                        >
                          Apply
                        </button>
                      </div>

                      <span className={`text-[10px] font-extrabold uppercase tracking-wider mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                        Product Name *
                      </span>
                      <input
                        type="text"
                        value={poster.productName}
                        onChange={(e) => setPoster((p) => ({ ...p, productName: e.target.value }))}
                        onBlur={commitPosterState}
                        placeholder="Product Name"
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#FF5722] ${isDarkMode
                          ? "bg-[#141414] border-[#262626] text-white placeholder-gray-500"
                          : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                          }`}
                      />

                      <span className={`text-[10px] font-extrabold uppercase tracking-wider mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                        Retail Price (₹)
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={poster.price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        onKeyDown={handlePriceKeyDown}
                        onBlur={commitPosterState}
                        placeholder="0"
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold outline-none transition-colors ${priceError
                          ? "border-red-400 dark:border-red-500/70 ring-1 ring-red-400/40"
                          : "focus:border-[#FF5722]"
                          } ${isDarkMode
                            ? "bg-[#141414] border-[#262626] text-white placeholder-gray-500"
                            : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                          }`}
                      />

                      <span className={`text-[10px] font-extrabold uppercase tracking-wider mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                        Description
                      </span>
                      <textarea
                        value={poster.description || ""}
                        onChange={(e) => setPoster((p) => ({ ...p, description: e.target.value }))}
                        onBlur={commitPosterState}
                        placeholder="Product description, features or warranty details..."
                        rows={2}
                        className={`w-full border rounded-lg p-2 text-xs outline-none focus:border-[#FF5722] resize-none max-h-24 overflow-y-auto custom-scrollbar ${isDarkMode
                          ? "bg-[#141414] border-[#262626] text-white placeholder-gray-500"
                          : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                          }`}
                      />
                    </div>

                    {/* Image Controls Card */}
                    <div className={`flex flex-col gap-2 p-2.5 rounded-xl border ${isDarkMode ? "bg-[#1A1A1A] border-[#262626]" : "bg-gray-50 border-gray-200"
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                          <ImageIcon className="w-3.5 h-3.5 text-[#FF5722]" />
                          Product Image &amp; Media
                        </span>
                        {poster.productImage && (
                          <button
                            type="button"
                            onClick={() => {
                              pushState({ ...poster, productImage: "" });
                              safeToastSuccess("Product image removed");
                            }}
                            className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {/* 3 Upload options */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`py-2 px-1.5 rounded-lg border text-[11px] font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors ${isDarkMode
                            ? "bg-[#141414] hover:bg-[#202020] border-[#262626] text-gray-300 hover:text-white"
                            : "bg-white hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900"
                            }`}
                        >
                          <Upload className="w-3.5 h-3.5 text-[#FF5722]" />
                          <span>Browse</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowGalleryModal(true)}
                          className={`py-2 px-1.5 rounded-lg border text-[11px] font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors ${isDarkMode
                            ? "bg-[#141414] hover:bg-[#202020] border-[#262626] text-gray-300 hover:text-white"
                            : "bg-white hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900"
                            }`}
                        >
                          <FileImage className="w-3.5 h-3.5 text-[#FF5722]" />
                          <span>Gallery</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenCamera}
                          className={`py-2 px-1.5 rounded-lg border text-[11px] font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors ${isDarkMode
                            ? "bg-[#141414] hover:bg-[#202020] border-[#262626] text-gray-300 hover:text-white"
                            : "bg-white hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900"
                            }`}
                        >
                          <Camera className="w-3.5 h-3.5 text-[#FF5722]" />
                          <span>Camera</span>
                        </button>
                      </div>

                      {/* Image Zoom & Reposition Controls */}
                      {poster.productImage && (
                        <div className={`flex flex-col gap-2 pt-2 border-t ${isDarkMode ? "border-[#262626]" : "border-gray-200"}`}>
                          <div className={`flex items-center justify-between text-[11px] font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}>
                            <span>Image Scale</span>
                            <span className={`font-mono ${isDarkMode ? "text-white" : "text-gray-900"}`}>{Math.round(poster.imageZoom * 100)}%</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => pushState({ ...poster, imageZoom: Math.max(0.5, +(poster.imageZoom - 0.1).toFixed(2)) })}
                              className={`p-1 rounded border cursor-pointer ${isDarkMode
                                ? "bg-[#141414] border-[#262626] text-gray-300 hover:text-white"
                                : "bg-white border-gray-200 text-gray-700 hover:text-gray-900"
                                }`}
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="range"
                              min="0.5"
                              max="2.5"
                              step="0.05"
                              value={poster.imageZoom}
                              onChange={(e) => setPoster((prev) => ({ ...prev, imageZoom: parseFloat(e.target.value) }))}
                              onMouseUp={commitPosterState}
                              className="flex-1 accent-[#FF5722] cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => pushState({ ...poster, imageZoom: Math.min(2.5, +(poster.imageZoom + 0.1).toFixed(2)) })}
                              className={`p-1 rounded border cursor-pointer ${isDarkMode
                                ? "bg-[#141414] border-[#262626] text-gray-300 hover:text-white"
                                : "bg-white border-gray-200 text-gray-700 hover:text-gray-900"
                                }`}
                              title="Zoom In"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => pushState({ ...poster, imageZoom: 1, imagePosition: { x: 0, y: 0 } })}
                              className={`px-2 py-1 rounded border text-[10px] cursor-pointer font-bold ${isDarkMode
                                ? "bg-[#141414] border-[#262626] text-gray-300 hover:text-white"
                                : "bg-white border-gray-200 text-gray-700 hover:text-gray-900"
                                }`}
                              title="Reset position and zoom"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Company Logo Card */}
                    <div className={`flex flex-col gap-2 p-2.5 rounded-xl border ${isDarkMode ? "bg-[#1A1A1A] border-[#262626]" : "bg-gray-50 border-gray-200"
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                          Company Logo &amp; Branding
                        </span>
                        {poster.companyLogo && (
                          <button
                            type="button"
                            onClick={() => pushState({ ...poster, companyLogo: "" })}
                            className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => logoInputRef.current?.click()}
                          className={`w-12 h-12 rounded-xl border hover:border-[#FF5722] flex items-center justify-center p-1 cursor-pointer transition-colors overflow-hidden shrink-0 ${isDarkMode ? "bg-[#141414] border-[#262626]" : "bg-white border-gray-200"
                            }`}
                          title="Click to change logo"
                        >
                          {poster.companyLogo && !logoLoadError ? (
                            <img
                              src={getLogoSrc(poster.companyLogo)}
                              alt="Logo"
                              className="w-full h-full object-contain"
                              onError={() => setLogoLoadError(true)}
                            />
                          ) : (
                            <Store className={`w-5 h-5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                          )}
                        </div>

                        <div className="flex flex-col gap-1 flex-1">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer text-left flex items-center justify-between transition-colors ${isDarkMode
                              ? "bg-[#141414] hover:bg-[#202020] border-[#262626] text-gray-200"
                              : "bg-white hover:bg-gray-100 border-gray-200 text-gray-700"
                              }`}
                          >
                            <span>{poster.companyLogo ? "Change Logo" : "Upload Logo"}</span>
                            <Upload className="w-3 h-3 text-[#FF5722]" />
                          </button>
                          <span className={`text-[10px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Supports PNG, JPG, or SVG under 2MB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ──────────────── TAB 3: STYLING & COLOR THEMES ──────────────── */}
                {inspectorTab === "styling" && (
                  <div className="flex flex-col gap-3">
                    {/* Color Themes & Palette */}
                    <div className={`flex flex-col gap-2.5 p-3 rounded-xl border ${isDarkMode ? "bg-[#1A1A1A] border-[#262626]" : "bg-gray-50 border-gray-200"
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                          Color Theme Palettes
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            pushState({
                              ...poster,
                              colorThemeId: "flame-orange",
                              customAccentColor: "#FF5722",
                              customSecondaryColor: "#D84315",
                            });
                          }}
                          className="text-[10px] font-bold text-[#FF5722] hover:underline cursor-pointer"
                        >
                          Reset Palette
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {COLOR_THEMES.map((theme) => {
                          const isSelected = poster.colorThemeId === theme.id ||
                            (theme.id === "royal-sky" && poster.colorThemeId === "gradient-royal") ||
                            (theme.id === "fresh-mint" && poster.colorThemeId === "gradient-emerald") ||
                            (theme.id === "cosmic-night" && poster.colorThemeId === "gradient-cosmic");
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => {
                                pushState({
                                  ...poster,
                                  colorThemeId: theme.id,
                                  customAccentColor: theme.primary,
                                  customSecondaryColor: theme.priceBg || theme.primaryDark || "",
                                });
                              }}
                              className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all ${isSelected
                                ? "border-[#FF5722] bg-[#FF5722]/15 text-[#FF5722] ring-1 ring-[#FF5722] font-bold shadow-sm"
                                : isDarkMode
                                  ? "border-[#262626] bg-[#141414] text-gray-300 hover:border-gray-500"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 shadow-xs"
                                }`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <span
                                  className="w-4 h-4 rounded-full shadow-sm ring-1 ring-white/20"
                                  style={{ backgroundColor: theme.primary }}
                                />
                                <span
                                  className="w-2.5 h-2.5 rounded-full shadow-xs opacity-75"
                                  style={{ backgroundColor: theme.priceBg || theme.primaryDark }}
                                />
                              </div>
                              <span className="text-[10px] font-bold leading-tight truncate w-full">{theme.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Canvas Background Controls */}
                    <div className={`flex flex-col gap-2.5 p-3 rounded-xl border ${isDarkMode ? "bg-[#1A1A1A] border-[#262626]" : "bg-gray-50 border-gray-200"
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                          Canvas Background
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            pushState({
                              ...poster,
                              bgTypeId: "clean-white",
                              customBgColor: "#FFFFFF",
                              backgroundImage: "",
                            });
                          }}
                          className="text-[10px] font-bold text-[#FF5722] hover:underline cursor-pointer"
                        >
                          Reset Background
                        </button>
                      </div>

                      {/* Curated Background Presets */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {BACKGROUND_STYLES.map((bg) => {
                          const isSelected =
                            !poster.backgroundImage &&
                            (poster.bgTypeId === bg.id ||
                              (bg.colorHex && poster.customBgColor && bg.colorHex.toLowerCase() === poster.customBgColor.toLowerCase()) ||
                              (bg.id === "clean-white" && (!poster.customBgColor || poster.customBgColor.toLowerCase() === "#ffffff")) ||
                              (bg.id === "soft-cream" && (poster.customBgColor?.toLowerCase() === "#fdf2dc" || poster.customBgColor?.toLowerCase() === "#faf7f2")) ||
                              ((bg.id === "gradient-royal" || bg.id === "royal-sky") && (poster.bgTypeId === "gradient-royal" || poster.bgTypeId === "royal-sky" || poster.customBgColor?.toLowerCase() === "#dbeafe")) ||
                              ((bg.id === "gradient-emerald" || bg.id === "fresh-mint") && (poster.bgTypeId === "gradient-emerald" || poster.bgTypeId === "fresh-mint" || poster.customBgColor?.toLowerCase() === "#d1fae5")) ||
                              ((bg.id === "gradient-cosmic" || bg.id === "cosmic-night") && (poster.bgTypeId === "gradient-cosmic" || poster.bgTypeId === "cosmic-night" || poster.customBgColor?.toLowerCase() === "#100920")) ||
                              (bg.id === "deep-teal" && poster.bgTypeId === "slate-dark") ||
                              (bg.id === "dusty-rose" && poster.bgTypeId === "obsidian-black"));
                          return (
                            <button
                              key={bg.id}
                              type="button"
                              onClick={() => {
                                pushState({
                                  ...poster,
                                  bgTypeId: bg.id,
                                  customBgColor: bg.colorHex || "",
                                  backgroundImage: "",
                                });
                              }}
                              className={`p-1.5 rounded-lg border flex flex-col gap-1 text-left cursor-pointer transition-all ${isSelected
                                ? "border-[#FF5722] bg-[#FF5722]/15 ring-1 ring-[#FF5722]"
                                : isDarkMode
                                  ? "border-[#262626] bg-[#141414] hover:border-gray-500"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                            >
                              <div className={`w-full h-8 rounded ${bg.previewClass} border border-white/10 shadow-xs`} />
                              <span className={`text-[10px] font-bold truncate ${isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}>{bg.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Canvas Background Color */}
                      <div className={`flex items-center justify-between gap-2 pt-2 border-t ${isDarkMode ? "border-[#262626]" : "border-gray-200"
                        }`}>
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`text-[11px] font-bold shrink-0 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Solid Color:</span>
                          <input
                            type="color"
                            value={poster.customBgColor || "#FFFFFF"}
                            onChange={(e) => pushState({ ...poster, customBgColor: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 shrink-0"
                          />
                          <input
                            type="text"
                            value={poster.customBgColor || ""}
                            placeholder="Preset active"
                            onChange={(e) => pushState({ ...poster, customBgColor: e.target.value })}
                            className={`w-24 px-2 py-1 rounded border text-xs font-mono font-bold outline-none ${isDarkMode
                              ? "bg-[#141414] border-[#262626] text-white"
                              : "bg-white border-gray-200 text-gray-900"
                              }`}
                          />
                        </div>
                        {poster.customBgColor && (
                          <button
                            type="button"
                            onClick={() => pushState({ ...poster, customBgColor: "" })}
                            className="text-[10px] text-red-500 hover:underline font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Custom Background Image */}
                      <div className={`flex flex-col gap-2 pt-2 border-t ${isDarkMode ? "border-[#262626]" : "border-gray-200"
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Background Image:</span>
                          <button
                            type="button"
                            onClick={() => bgImageInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#FF5722] text-white hover:bg-[#E64A19] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>{poster.backgroundImage ? "Change Image" : "Upload Image"}</span>
                          </button>
                        </div>
                        {poster.backgroundImage && (
                          <div className={`p-1.5 rounded-lg border flex items-center justify-between gap-2 ${isDarkMode ? "bg-[#141414] border-[#262626]" : "bg-white border-gray-200"
                            }`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                              <img
                                src={poster.backgroundImage}
                                alt="Background Preview"
                                className="w-8 h-8 rounded object-cover border border-white/20 shrink-0"
                              />
                              <span className={`text-[10px] font-medium truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                Custom Background Active
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => pushState({ ...poster, backgroundImage: "" })}
                              className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-500/10 cursor-pointer"
                              title="Remove background image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Font Typography */}
                    <div className={`flex flex-col gap-2 p-2.5 rounded-xl border ${isDarkMode ? "bg-[#1A1A1A] border-[#262626]" : "bg-gray-50 border-gray-200"
                      }`}>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                        Typography &amp; Fonts
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {FONT_OPTIONS.map((f) => {
                          const isSelected = poster.fontFamilyId === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => pushState({ ...poster, fontFamilyId: f.id })}
                              className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${isSelected
                                ? "border-[#FF5722] bg-[#FF5722]/15 text-[#FF5722] ring-1 ring-[#FF5722] font-bold"
                                : isDarkMode
                                  ? "border-[#262626] bg-[#141414] text-gray-300 hover:border-gray-500"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                }`}
                            >
                              <span className={`text-xs font-bold block truncate ${isSelected ? "text-[#FF5722]" : isDarkMode ? "text-gray-200" : "text-gray-800"
                                }`} style={{ fontFamily: f.cssFamily }}>
                                {f.name}
                              </span>
                              <span className={`text-[9px] truncate block ${isDarkMode ? "text-gray-500" : "text-gray-400"
                                }`}>{f.description}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Text & Font Color Picker */}
                    <div className={`flex flex-col gap-2.5 p-3 rounded-xl border ${isDarkMode ? "bg-[#1A1A1A] border-[#262626]" : "bg-gray-50 border-gray-200"
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                          Text &amp; Description Font Color
                        </span>
                        {poster.fontColor && (
                          <button
                            type="button"
                            onClick={() => pushState({ fontColor: "" })}
                            className="text-[10px] font-bold text-[#FF5722] hover:underline cursor-pointer"
                          >
                            Reset to Auto
                          </button>
                        )}
                      </div>

                      {/* Curated Swatches */}
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { name: "Auto", color: "" },
                          { name: "Black", color: "#000000" },
                          { name: "Charcoal", color: "#1F2937" },
                          { name: "Orange", color: "#FF5722" },
                          { name: "Red", color: "#DC2626" },
                          { name: "Green", color: "#059669" },
                          { name: "Blue", color: "#2563EB" },
                          { name: "Purple", color: "#7C3AED" },
                          { name: "Amber", color: "#D97706" },
                        ].map((swatch) => {
                          const isSelected = (!poster.fontColor && swatch.color === "") || (poster.fontColor?.toLowerCase() === swatch.color.toLowerCase() && swatch.color !== "");
                          return (
                            <button
                              key={swatch.name}
                              type="button"
                              onClick={() => pushState({ fontColor: swatch.color })}
                              className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 cursor-pointer transition-all ${isSelected
                                ? "border-[#FF5722] ring-1.5 ring-[#FF5722] bg-[#FF5722]/10"
                                : isDarkMode
                                  ? "border-[#262626] bg-[#141414] hover:border-gray-500"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                              title={swatch.name}
                            >
                              {swatch.color === "" ? (
                                <div className="w-4 h-4 rounded-full border border-dashed border-gray-400 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                  A
                                </div>
                              ) : (
                                <span
                                  className="w-4 h-4 rounded-full shadow-xs ring-1 ring-black/10"
                                  style={{ backgroundColor: swatch.color }}
                                />
                              )}
                              <span className="text-[9px] font-semibold truncate w-full text-center">
                                {swatch.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className={`flex flex-col gap-2 p-2.5 rounded-xl border ${isDarkMode ? "bg-[#1A1A1A] border-[#262626]" : "bg-gray-50 border-gray-200"
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                          Text Alignment
                        </span>
                        <div className={`flex items-center gap-1 border rounded-lg p-0.5 ${isDarkMode ? "bg-[#141414] border-[#262626]" : "bg-white border-gray-200"
                          }`}>
                          {(["left", "center", "right"] as const).map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => pushState({ ...poster, textAlign: align })}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${poster.textAlign === align
                                ? "bg-[#FF5722] text-white"
                                : isDarkMode
                                  ? "text-gray-400 hover:text-white"
                                  : "text-gray-500 hover:text-gray-900"
                                }`}
                              title={`Align ${align}`}
                            >
                              {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                              {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                              {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={`flex items-center justify-between pt-2 border-t ${isDarkMode ? "border-[#262626]" : "border-gray-200"
                        }`}>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                          Outer Border
                        </span>
                        <div className="flex items-center gap-1">
                          {[0, 2, 4, 6].map((px) => (
                            <button
                              key={px}
                              type="button"
                              onClick={() => pushState({ ...poster, borderThickness: px })}
                              className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${poster.borderThickness === px
                                ? "bg-[#FF5722] text-white"
                                : isDarkMode
                                  ? "bg-[#141414] border border-[#262626] text-gray-400 hover:text-white"
                                  : "bg-white border border-gray-200 text-gray-600 hover:text-gray-900"
                                }`}
                            >
                              {px}px
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={`flex items-center justify-between pt-2 border-t ${isDarkMode ? "border-[#262626]" : "border-gray-200"
                        }`}>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                          Show Offer Price
                        </span>
                        <input
                          type="checkbox"
                          checked={poster.showPriceTag}
                          onChange={(e) => pushState({ ...poster, showPriceTag: e.target.checked })}
                          className="w-4 h-4 accent-[#FF5722] cursor-pointer"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleReset}
                        className="mt-2 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset Poster Settings</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ──────────────── TAB 4: STICKERS ──────────────── */}
                {inspectorTab === "stickers" && (() => {
                  const selectedSticker = (poster.stickers || []).find((s) => s.id === selectedStickerId);

                  return (
                    <div className="flex flex-col gap-3">
                      {/* Selected Sticker Controls Card */}
                      {selectedSticker && (
                        <div
                          className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-all ${isDarkMode
                            ? "bg-[#1C1C1C] border-[#FF5722]/50 shadow-[0_0_15px_rgba(255,87,34,0.15)]"
                            : "bg-orange-50/70 border-[#FF5722]/60 shadow-xs"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#FF5722]/15 border border-[#FF5722]/40 flex items-center justify-center shrink-0 p-1">
                                <StickerBadge id={selectedSticker.stickerId} className="w-full h-full object-contain" />
                              </div>
                              <div className="min-w-0">
                                <span className={`text-xs font-bold block truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                  {STICKER_LIST.find((s) => s.id === selectedSticker.stickerId)?.name || "Active Sticker"}
                                </span>
                                <span className={`text-[10px] block ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                  Selected on Canvas
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedStickerId(null)}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${isDarkMode ? "hover:bg-[#2A2A2A] text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                                }`}
                              title="Deselect sticker"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Size Control Slider & Preset Buttons */}
                          <div className="flex flex-col gap-1.5 pt-1 border-t border-dashed border-gray-700/30 dark:border-gray-700/40">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                              <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Size</span>
                              <span className="font-mono text-[10px] text-[#FF5722]">{selectedSticker.width || 105}px</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="220"
                              value={selectedSticker.width || 105}
                              onChange={(e) => handleUpdateSelectedSticker({ width: Number(e.target.value) }, false)}
                              onMouseUp={() => commitPosterState()}
                              onTouchEnd={() => commitPosterState()}
                              className="w-full accent-[#FF5722] cursor-pointer h-1.5 bg-gray-700/30 rounded-lg appearance-none"
                            />
                            <div className="grid grid-cols-4 gap-1 mt-0.5">
                              {[
                                { label: "S", width: 75 },
                                { label: "M", width: 105 },
                                { label: "L", width: 145 },
                                { label: "XL", width: 185 },
                              ].map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => handleUpdateSelectedSticker({ width: preset.width }, true)}
                                  className={`py-0.5 text-[10px] font-bold rounded border transition-colors cursor-pointer ${selectedSticker.width === preset.width
                                    ? "bg-[#FF5722] text-white border-[#FF5722]"
                                    : isDarkMode
                                      ? "bg-[#252525] border-[#333] text-gray-300 hover:bg-[#303030]"
                                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Rotation Slider */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                              <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Rotation</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-[#FF5722]">{selectedSticker.rotation || 0}°</span>
                                {Boolean(selectedSticker.rotation) && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSelectedSticker({ rotation: 0 }, true)}
                                    className="text-[9px] text-gray-400 hover:text-white underline cursor-pointer"
                                  >
                                    reset
                                  </button>
                                )}
                              </div>
                            </div>
                            <input
                              type="range"
                              min="-45"
                              max="45"
                              value={selectedSticker.rotation || 0}
                              onChange={(e) => handleUpdateSelectedSticker({ rotation: Number(e.target.value) }, false)}
                              onMouseUp={() => commitPosterState()}
                              onTouchEnd={() => commitPosterState()}
                              className="w-full accent-[#FF5722] cursor-pointer h-1.5 bg-gray-700/30 rounded-lg appearance-none"
                            />
                          </div>

                          {/* Action buttons: Remove & Center */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleRemoveSticker(selectedSticker.id)}
                              className="flex-1 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove Sticker</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSelectedSticker({ x: 50, y: 45 }, true)}
                              className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${isDarkMode ? "border-[#333] hover:bg-[#252525] text-gray-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"
                                }`}
                              title="Center sticker on canvas"
                            >
                              Center
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Placed Stickers on Canvas Manager List */}
                      {poster.stickers && poster.stickers.length > 0 && (
                        <div
                          className={`p-2.5 rounded-xl border flex flex-col gap-2 ${isDarkMode ? "bg-[#1A1A1A] border-[#262626]" : "bg-gray-50 border-gray-200"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                            >
                              On Poster ({poster.stickers.length})
                            </span>
                            {poster.stickers.length > 1 && (
                              <button
                                type="button"
                                onClick={handleClearAllStickers}
                                className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                              >
                                Clear All
                              </button>
                            )}
                          </div>

                          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-0.5">
                            {poster.stickers.map((stk, idx) => {
                              const def = STICKER_LIST.find((s) => s.id === stk.stickerId);
                              const isSel = selectedStickerId === stk.id;
                              return (
                                <div
                                  key={stk.id}
                                  onClick={() => setSelectedStickerId(stk.id)}
                                  className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${isSel
                                    ? "bg-[#FF5722]/15 border-[#FF5722] text-[#FF5722]"
                                    : isDarkMode
                                      ? "bg-[#141414] border-[#252525] hover:bg-[#1E1E1E] text-gray-300"
                                      : "bg-white border-gray-200 hover:bg-gray-100 text-gray-700"
                                    }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-5 h-5 shrink-0">
                                      <StickerBadge id={stk.stickerId} className="w-full h-full" />
                                    </div>
                                    <span className="text-[11px] font-bold truncate">
                                      {def?.name || `Sticker #${idx + 1}`}
                                    </span>
                                    <span
                                      className={`text-[9px] font-mono px-1 rounded ${isDarkMode ? "bg-black/30 text-gray-400" : "bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                      {stk.width || 105}px
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveSticker(stk.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                    title="Remove sticker"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Sticker Gallery Header */}
                      <div className="flex items-center justify-between px-0.5 pt-0.5">
                        <div>
                          <span className={`text-xs font-bold block ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            Sticker Gallery
                          </span>
                          <span className={`text-[10px] block ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Click badge to add directly to poster
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDarkMode ? "bg-[#252525] text-[#FF5722]" : "bg-orange-100 text-[#FF5722]"
                            }`}
                        >
                          {STICKER_LIST.length} Badges
                        </span>
                      </div>

                      {/* 3-Column Stickers Grid with Smooth Floating, Pulse, Glow & Playful Click Bounce */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                        {STICKER_LIST.map((stickerDef, index) => {
                          const isCurrentActive = selectedSticker?.stickerId === stickerDef.id;
                          const isBouncing = bouncingStickerId === stickerDef.id;
                          const theme = STICKER_ANIMATION_THEMES[stickerDef.id] || {
                            glow: "rgba(255, 87, 34, 0.45)",
                            border: "rgba(255, 87, 34, 0.6)",
                            bgSoft: "rgba(255, 87, 34, 0.1)",
                          };
                          const floatDelay = `${(index % 6) * 0.35}s`;
                          const shineDelay = `${(index % 4) * 1.2}s`;

                          return (
                            <button
                              key={stickerDef.id}
                              type="button"
                              onClick={() => handleAddSticker(stickerDef.id)}
                              style={{
                                ["--badge-glow-color" as any]: theme.glow,
                                ["--badge-border-color" as any]: theme.border,
                              }}
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer group relative overflow-hidden select-none ${
                                isBouncing ? "sticker-gallery-bouncing" : ""
                              } ${
                                isCurrentActive
                                  ? "bg-[#FF5722]/15 border-[#FF5722] shadow-[0_0_14px_rgba(255,87,34,0.4)] ring-1 ring-[#FF5722]"
                                  : isDarkMode
                                    ? "bg-[#181818] border-[#2A2A2A] hover:border-[var(--badge-border-color)] hover:bg-[#202020]"
                                    : "bg-white border-gray-200 hover:border-[var(--badge-border-color)] hover:bg-orange-50/40"
                              } hover:scale-105 hover:-translate-y-1 hover:shadow-lg active:scale-95`}
                              title={`Click to add "${stickerDef.name}" to poster canvas`}
                            >
                              {/* Soft ambient colorful glow aura behind badge */}
                              <div
                                className="sticker-gallery-glow-bg absolute -top-3 -left-3 w-16 h-16 rounded-full blur-xl pointer-events-none transition-opacity duration-300 opacity-25 group-hover:opacity-70"
                                style={{
                                  backgroundColor: theme.glow,
                                  animationDelay: floatDelay,
                                }}
                              />

                              {/* Occasional luminous shine / sweep beam */}
                              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-20">
                                <div
                                  className="sticker-gallery-shine-beam absolute top-0 -left-[100%] w-[80%] h-full pointer-events-none"
                                  style={{
                                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
                                    animationDelay: shineDelay,
                                  }}
                                />
                              </div>

                              {/* Badge Container with Gentle Float & Pulse */}
                              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center p-0.5 relative z-10">
                                <div
                                  className="w-full h-full sticker-gallery-badge-wrapper flex items-center justify-center"
                                  style={{ animationDelay: floatDelay }}
                                >
                                  <div
                                    className="w-full h-full sticker-gallery-badge-pulse flex items-center justify-center"
                                    style={{ animationDelay: floatDelay }}
                                  >
                                    <StickerBadge
                                      id={stickerDef.id}
                                      className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 ease-out group-hover:scale-115"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Badge Name */}
                              <span
                                className={`text-[10px] font-bold text-center leading-tight truncate max-w-full px-0.5 relative z-10 transition-colors duration-200 ${
                                  isCurrentActive
                                    ? "text-[#FF5722]"
                                    : isDarkMode
                                      ? "text-gray-200 group-hover:text-white"
                                      : "text-gray-700 group-hover:text-gray-900"
                                }`}
                              >
                                {stickerDef.name}
                              </span>

                              {/* Small hover indicator badge with scale pop */}
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100 w-4 h-4 rounded-full bg-[#FF5722] text-white flex items-center justify-center text-[10px] font-bold shadow-xs z-20">
                                +
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* ── LIVE CAMERA CAPTURE MODAL ── */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1A1D27] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Take Product Photo</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseCamera}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex flex-col items-center gap-3">
              <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-white/20 pointer-events-none rounded-xl" />
              </div>

              <div className="flex items-center justify-center gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseCamera();
                    cameraFileInputRef.current?.click();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 text-xs font-semibold cursor-pointer"
                >
                  Upload File Instead
                </button>
                <button
                  type="button"
                  onClick={handleCloseCamera}
                  className="px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MEDIA & GALLERY MODAL ── */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1A1D27] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileImage className="w-5 h-5 text-orange-500" />
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Product Image Gallery</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Choose from recent images, sample presets, or upload from your device</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGalleryModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-4">
              {/* Upload Drop Zone inside modal */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  handleImageDrop(e);
                  setShowGalleryModal(false);
                }}
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowGalleryModal(false);
                }}
                className="border-2 border-dashed border-orange-400/80 hover:border-orange-500 bg-orange-50/30 dark:bg-orange-950/20 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Click to Browse Files or Drag &amp; Drop Image Here
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Supports all formats (JPG, PNG, WebP, GIF, SVG) up to 20MB
                </p>
              </div>

              {/* Uploaded / Recent Images */}
              {recentGalleryImages.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Recent Uploads ({recentGalleryImages.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentGalleryImages([]);
                        localStorage.removeItem("renote_poster_gallery");
                      }}
                      className="text-[11px] text-red-500 hover:underline cursor-pointer"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {recentGalleryImages.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          processAndSetImage(imgSrc);
                          setShowGalleryModal(false);
                          safeToastSuccess("Selected image applied to poster! 🎨");
                        }}
                        className={`aspect-square rounded-xl border p-1 bg-gray-50 dark:bg-[#12141C] hover:border-orange-500 cursor-pointer transition-all flex items-center justify-center overflow-hidden group relative ${poster.productImage === imgSrc ? "ring-2 ring-orange-500 border-orange-500" : "border-gray-200 dark:border-white/10"
                          }`}
                      >
                        <img
                          src={imgSrc}
                          alt={`Uploaded item ${idx + 1}`}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                        {poster.productImage === imgSrc && (
                          <div className="absolute top-1 right-1 bg-orange-500 text-white rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Product Presets */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Sample Product Images
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {SAMPLE_PRODUCT_IMAGES.map((sample, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        processAndSetImage(sample.url);
                        setShowGalleryModal(false);
                        safeToastSuccess(`Applied ${sample.title} to poster! 🎨`);
                      }}
                      className={`aspect-square rounded-xl border p-1.5 bg-gray-50 dark:bg-[#12141C] hover:border-orange-500 cursor-pointer transition-all flex flex-col items-center justify-between overflow-hidden group relative ${poster.productImage === sample.url ? "ring-2 ring-orange-500 border-orange-500" : "border-gray-200 dark:border-white/10"
                        }`}
                      title={sample.title}
                    >
                      <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                        <img
                          src={sample.url}
                          alt={sample.title}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 truncate w-full text-center mt-1">
                        {sample.title}
                      </span>
                      {poster.productImage === sample.url && (
                        <div className="absolute top-1 right-1 bg-orange-500 text-white rounded-full p-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 dark:bg-[#151720] border-t border-gray-100 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGalleryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marketplace Publishing Flow Modal */}
      <PublishMarketplaceModal
        isOpen={showPublishModal}
        poster={modalPosterData}
        onClose={() => setShowPublishModal(false)}
        onSuccess={handlePublishSuccess}
      />

      {/* ══════════════════════════════════════════════════════════════
          PREMIUM NEON AMBIENT & BACKGROUND ANIMATIONS CSS
         ══════════════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes orbDrift1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.3; }
          50% { transform: translate(32px, -24px) scale(1.22); opacity: 0.58; }
        }
        @keyframes orbDrift2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.26; }
          50% { transform: translate(-28px, 26px) scale(1.28); opacity: 0.54; }
        }
        @keyframes orbDrift3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.3; }
          50% { transform: translate(24px, 20px) scale(1.18); opacity: 0.52; }
        }
        @keyframes laserBeamSweep {
          0% { transform: translateY(-100%); opacity: 0; }
          15% { opacity: 0.55; }
          50% { opacity: 0.85; }
          85% { opacity: 0.55; }
          100% { transform: translateY(680px); opacity: 0; }
        }
        @keyframes cyberGridPulse {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.2; }
        }
        .anim-orb-1 { animation: orbDrift1 6.5s ease-in-out infinite; }
        .anim-orb-2 { animation: orbDrift2 8.5s ease-in-out infinite; }
        .anim-orb-3 { animation: orbDrift3 7.5s ease-in-out infinite; }
        .anim-laser { animation: laserBeamSweep 4.5s ease-in-out infinite; }
        .anim-grid { animation: cyberGridPulse 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .anim-orb-1, .anim-orb-2, .anim-orb-3, .anim-laser, .anim-grid {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function PosterStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D0E12] flex items-center justify-center text-white text-sm font-bold">
          Loading ReNote Poster Studio...
        </div>
      }
    >
      <PosterStudioInner />
    </Suspense>
  );
}
