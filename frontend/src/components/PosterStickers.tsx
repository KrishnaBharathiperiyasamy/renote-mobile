import React from "react";

export interface StickerDefinition {
  id: string;
  name: string;
  category: "Deals" | "Badges" | "Promos";
  description: string;
  defaultWidth: number;
}

export interface PosterSticker {
  id: string;
  stickerId: string;
  x: number; // percentage (0-100) from left
  y: number; // percentage (0-100) from top
  width: number; // width in pixels (e.g. 105)
  rotation?: number; // rotation in degrees (-180 to 180)
}

export const STICKER_LIST: StickerDefinition[] = [
  {
    id: "mega-deal",
    name: "Mega Deal",
    category: "Deals",
    description: "High impact electric purple lightning deal badge",
    defaultWidth: 105,
  },
  {
    id: "super-offer",
    name: "Super Offer",
    category: "Promos",
    description: "Royal blue circular seal with golden banner",
    defaultWidth: 105,
  },
  {
    id: "50-off",
    name: "50% OFF",
    category: "Deals",
    description: "Fiery red discount starburst explosion",
    defaultWidth: 105,
  },
  {
    id: "best-price",
    name: "Best Price",
    category: "Badges",
    description: "Certified emerald green price guarantee stamp",
    defaultWidth: 105,
  },
  {
    id: "limited-time",
    name: "Limited Time",
    category: "Promos",
    description: "Amber stopwatch urgent deal badge",
    defaultWidth: 105,
  },
  {
    id: "hot-sale",
    name: "Hot Sale",
    category: "Deals",
    description: "ReNote fiery flame hot sale banner",
    defaultWidth: 105,
  },
  {
    id: "top-seller",
    name: "Top Seller",
    category: "Badges",
    description: "Navy blue royal medallion with hanging ribbons",
    defaultWidth: 105,
  },
  {
    id: "special-offer",
    name: "Special Offer",
    category: "Promos",
    description: "Vibrant magenta diamond sparkle banner",
    defaultWidth: 105,
  },
  {
    id: "new-arrival",
    name: "New Arrival",
    category: "Badges",
    description: "Fresh neon lime contemporary retail badge",
    defaultWidth: 105,
  },
  {
    id: "premium",
    name: "Premium",
    category: "Badges",
    description: "Luxury midnight onyx and 24K gold crown crest",
    defaultWidth: 105,
  },
  {
    id: "trending",
    name: "Trending",
    category: "Promos",
    description: "Neon violet momentum trend arrow badge",
    defaultWidth: 105,
  },
  {
    id: "best-deal",
    name: "Best Deal",
    category: "Deals",
    description: "Energetic orange and yellow starburst deal stamp",
    defaultWidth: 105,
  },
];

interface StickerBadgeProps {
  id: string;
  className?: string;
  style?: React.CSSProperties;
}

export const StickerBadge: React.FC<StickerBadgeProps> = ({ id, className = "", style = {} }) => {
  const rawId = React.useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "_");
  switch (id) {
    case "mega-deal":
      return (
        <svg
          viewBox="0 0 120 120"
          className={className}
          style={{ background: "transparent", overflow: "visible", ...style }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_mega_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333EA" />
              <stop offset="50%" stopColor="#7E22CE" />
              <stop offset="100%" stopColor="#4C1D95" />
            </linearGradient>
            <linearGradient id={`${uid}_mega_lightning`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
            <filter id={`${uid}_mega_shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#3B0764" floodOpacity="0.45" />
            </filter>
          </defs>
          <g filter={`url(#${uid}_mega_shadow)`}>
            {/* Outer faceted polygon */}
            <polygon
              points="60,6 80,12 98,22 108,40 114,60 108,80 98,98 80,108 60,114 40,108 22,98 12,80 6,60 12,40 22,22 40,12"
              fill={`url(#${uid}_mega_bg)`}
              stroke="#D8B4FE"
              strokeWidth="2.5"
            />
            {/* Inner dashed accent ring */}
            <circle cx="60" cy="60" r="47" fill="none" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
            {/* Lightning bolt */}
            <polygon points="60,18 48,46 62,46 54,76 75,42 61,42" fill={`url(#${uid}_mega_lightning)`} />
            {/* Sparkles */}
            <circle cx="34" cy="36" r="2.5" fill="#FEF08A" />
            <circle cx="86" cy="36" r="2" fill="#FEF08A" />
            <circle cx="88" cy="80" r="2" fill="#FEF08A" />
            {/* Text: MEGA */}
            <text
              x="60"
              y="69"
              textAnchor="middle"
              fill="#FDE047"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="14"
              letterSpacing="2"
            >
              MEGA
            </text>
            {/* Text: DEAL */}
            <text
              x="60"
              y="91"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="19"
              letterSpacing="1.5"
              style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.5))" }}
            >
              DEAL
            </text>
          </g>
        </svg>
      );

    case "super-offer":
      return (
        <svg
          viewBox="0 0 120 120"
          className={className}
          style={{ background: "transparent", overflow: "visible", ...style }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_super_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="60%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#0C4A6E" />
            </linearGradient>
            <linearGradient id={`${uid}_super_gold`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <filter id={`${uid}_super_shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#082F49" floodOpacity="0.45" />
            </filter>
          </defs>
          <g filter={`url(#${uid}_super_shadow)`}>
            {/* Outer Scalloped Circular Badge */}
            <circle cx="60" cy="56" r="48" fill={`url(#${uid}_super_bg)`} stroke="#38BDF8" strokeWidth="2.5" />
            {/* Inner Gold Ring */}
            <circle cx="60" cy="56" r="41" fill="none" stroke="#FDE68A" strokeWidth="1.5" opacity="0.85" />
            {/* Sparkle Icon */}
            <path d="M60,18 L62,26 L70,28 L62,30 L60,38 L58,30 L50,28 L58,26 Z" fill="#FDE047" />
            <circle cx="34" cy="38" r="2" fill="#BAE6FD" />
            <circle cx="86" cy="38" r="2" fill="#BAE6FD" />
            {/* Text: SUPER */}
            <text
              x="60"
              y="53"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="15"
              letterSpacing="2.5"
            >
              SUPER
            </text>
            {/* Golden Ribbon Banner for OFFER */}
            <path d="M14,70 L24,62 L96,62 L106,70 L96,78 L24,78 Z" fill="#92400E" opacity="0.5" />
            <rect x="18" y="62" width="84" height="23" rx="5" fill={`url(#${uid}_super_gold)`} stroke="#FFFBEB" strokeWidth="1" />
            <text
              x="60"
              y="79"
              textAnchor="middle"
              fill="#0F172A"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="16"
              letterSpacing="2"
            >
              OFFER
            </text>
            <text x="60" y="97" textAnchor="middle" fill="#E0F2FE" fontSize="8" fontWeight="700" letterSpacing="1">
              ★ SPECIAL DEAL ★
            </text>
          </g>
        </svg>
      );

    case "50-off":
      return (
        <svg
          viewBox="0 0 120 120"
          className={className}
          style={{ background: "transparent", overflow: "visible", ...style }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_off_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
            <filter id={`${uid}_off_shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#450A0A" floodOpacity="0.5" />
            </filter>
          </defs>
          <g filter={`url(#${uid}_off_shadow)`}>
            {/* 16-point Explosion Starburst */}
            <polygon
              points="60,6 72,18 88,14 94,29 110,32 108,48 120,60 108,72 110,88 94,91 88,106 72,102 60,114 48,102 32,106 26,91 10,88 12,72 0,60 12,48 10,32 26,29 32,14 48,18"
              fill={`url(#${uid}_off_bg)`}
              stroke="#FEF08A"
              strokeWidth="2.5"
            />
            {/* Inner dashed ring */}
            <circle cx="60" cy="60" r="41" fill="none" stroke="#FEE2E2" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
            {/* Huge 50% Text */}
            <text
              x="60"
              y="57"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="28"
              letterSpacing="-1"
              style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }}
            >
              50%
            </text>
            {/* OFF Banner Pill */}
            <rect x="28" y="66" width="64" height="24" rx="6" fill="#FACC15" stroke="#FFFFFF" strokeWidth="1.5" />
            <text
              x="60"
              y="84"
              textAnchor="middle"
              fill="#991B1B"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="16"
              letterSpacing="2"
            >
              OFF
            </text>
          </g>
        </svg>
      );

    case "best-price":
      return (
        <svg
          viewBox="0 0 120 120"
          className={className}
          style={{ background: "transparent", overflow: "visible", ...style }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_price_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="60%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id={`${uid}_price_gold`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <filter id={`${uid}_price_shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#064E3B" floodOpacity="0.45" />
            </filter>
          </defs>
          <g filter={`url(#${uid}_price_shadow)`}>
            {/* Scalloped Certified Medallion */}
            <circle cx="60" cy="60" r="50" fill={`url(#${uid}_price_bg)`} stroke={`url(#${uid}_price_gold)`} strokeWidth="3" />
            <circle cx="60" cy="60" r="43" fill="none" stroke="#A7F3D0" strokeWidth="1.5" strokeDasharray="4 2" />
            {/* Verified Badge Icon */}
            <g transform="translate(48, 16)">
              <circle cx="12" cy="12" r="10" fill="#FEF08A" />
              <path d="M7 12 L10 15 L17 8" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
            {/* Text: BEST */}
            <text
              x="60"
              y="56"
              textAnchor="middle"
              fill="#FEF08A"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="13"
              letterSpacing="2.5"
            >
              BEST
            </text>
            {/* Text: PRICE */}
            <text
              x="60"
              y="77"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="19"
              letterSpacing="1.5"
              style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.35))" }}
            >
              PRICE
            </text>
            {/* Sub: Guaranteed */}
            <text
              x="60"
              y="93"
              textAnchor="middle"
              fill="#D1FAE5"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="700"
              fontSize="8"
              letterSpacing="1.5"
            >
              ★ GUARANTEED ★
            </text>
          </g>
        </svg>
      );

    case "limited-time":
      return (
        <svg
          viewBox="0 0 120 120"
          className={className}
          style={{ background: "transparent", overflow: "visible", ...style }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_time_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="60%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#9A3412" />
            </linearGradient>
            <filter id={`${uid}_time_shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#7C2D12" floodOpacity="0.45" />
            </filter>
          </defs>
          <g filter={`url(#${uid}_time_shadow)`}>
            {/* Rounded Octagon / Shield */}
            <polygon
              points="60,8 88,14 110,36 114,60 110,84 88,106 60,112 32,106 10,84 6,60 10,36 32,14"
              fill={`url(#${uid}_time_bg)`}
              stroke="#FDE047"
              strokeWidth="2.5"
            />
            {/* Clock Icon */}
            <circle cx="60" cy="30" r="11" fill="#7C2D12" stroke="#FEF08A" strokeWidth="2" />
            <path d="M60 23 L60 30 L65 33" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" />
            <rect x="58.5" y="16" width="3" height="3" fill="#FEF08A" rx="1" />
            {/* Text: LIMITED */}
            <text
              x="60"
              y="58"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="13"
              letterSpacing="2"
            >
              LIMITED
            </text>
            {/* Text: TIME Banner */}
            <rect x="22" y="66" width="76" height="24" rx="6" fill="#FDE047" stroke="#FFFFFF" strokeWidth="1" />
            <text
              x="60"
              y="84"
              textAnchor="middle"
              fill="#9A3412"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="16"
              letterSpacing="2"
            >
              TIME
            </text>
            {/* Sub: ACT FAST */}
            <text
              x="60"
              y="102"
              textAnchor="middle"
              fill="#FED7AA"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="7.5"
              letterSpacing="1.5"
            >
              ⚡ HURRY UP ⚡
            </text>
          </g>
        </svg>
      );

    case "hot-sale":
      return (
        <svg
          viewBox="0 0 120 120"
          className={className}
          style={{ background: "transparent", overflow: "visible", ...style }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_hot_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF5722" />
              <stop offset="50%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#9F1239" />
            </linearGradient>
            <linearGradient id={`${uid}_flame_color`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>
            <filter id={`${uid}_hot_shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#881337" floodOpacity="0.5" />
            </filter>
          </defs>
          <g filter={`url(#${uid}_hot_shadow)`}>
            {/* Flared Badge Shield */}
            <circle cx="60" cy="62" r="48" fill={`url(#${uid}_hot_bg)`} stroke="#FED7AA" strokeWidth="2.5" />
            <circle cx="60" cy="62" r="42" fill="none" stroke="#FDE047" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
            {/* Burning Flame Graphic */}
            <path
              d="M60,12 C64,24 74,30 74,42 C74,50 68,54 60,54 C52,54 46,50 46,42 C46,33 53,26 60,12 Z"
              fill={`url(#${uid}_flame_color)`}
            />
            <path
              d="M60,28 C62,34 66,38 66,44 C66,48 63,51 60,51 C57,51 54,48 54,44 C54,39 57,35 60,28 Z"
              fill="#FEF08A"
            />
            {/* Text: HOT */}
            <text
              x="60"
              y="68"
              textAnchor="middle"
              fill="#FDE047"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="17"
              letterSpacing="2"
            >
              HOT
            </text>
            {/* Text: SALE */}
            <text
              x="60"
              y="91"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="21"
              letterSpacing="1.5"
              style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.5))" }}
            >
              SALE
            </text>
          </g>
        </svg>
      );

    case "top-seller":
      return (
        <svg
          viewBox="0 0 120 120"
          className={className}
          style={{ background: "transparent", overflow: "visible", ...style }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_seller_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="60%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>
            <linearGradient id={`${uid}_seller_gold`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="50%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <filter id={`${uid}_seller_shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.45" />
            </filter>
          </defs>
          <g filter={`url(#${uid}_seller_shadow)`}>
            {/* Hanging Ribbon Tails */}
            <polygon points="42,80 34,112 48,104 60,112 56,80" fill="#B45309" />
            <polygon points="78,80 86,112 72,104 60,112 64,80" fill="#D97706" />
            {/* Round Medallion */}
            <circle cx="60" cy="52" r="44" fill={`url(#${uid}_seller_bg)`} stroke={`url(#${uid}_seller_gold)`} strokeWidth="3" />
            <circle cx="60" cy="52" r="38" fill="none" stroke="#93C5FD" strokeWidth="1" strokeDasharray="3 2" />
            {/* Crown Icon */}
            <path
              d="M48,27 L53,35 L60,25 L67,35 L72,27 L70,39 L50,39 Z"
              fill={`url(#${uid}_seller_gold)`}
              stroke="#FFFBEB"
              strokeWidth="0.8"
            />
            {/* Text: TOP */}
            <text
              x="60"
              y="54"
              textAnchor="middle"
              fill="#FDE68A"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="12"
              letterSpacing="2.5"
            >
              TOP
            </text>
            {/* Text: SELLER */}
            <text
              x="60"
              y="72"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="15"
              letterSpacing="1"
            >
              SELLER
            </text>
            {/* 5 Stars */}
            <text x="60" y="85" textAnchor="middle" fill="#FACC15" fontSize="8" letterSpacing="1">
              ★★★★★
            </text>
          </g>
        </svg>
      );

    case "special-offer":
      return (
        <svg
          viewBox="0 0 120 120"
          className={className}
          style={{ background: "transparent", overflow: "visible", ...style }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_special_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="60%" stopColor="#D946EF" />
              <stop offset="100%" stopColor="#86198F" />
            </linearGradient>
            <filter id={`${uid}_special_shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#701A75" floodOpacity="0.45" />
            </filter>
          </defs>
          <g filter={`url(#${uid}_special_shadow)`}>
            {/* Scalloped / Rounded Shield */}
            <rect
              x="12"
              y="14"
              width="96"
              height="92"
              rx="24"
              fill={`url(#${uid}_special_bg)`}
              stroke="#FBCFE8"
              strokeWidth="2.5"
              transform="rotate(0 60 60)"
            />
            {/* Subtle inner border */}
            <rect x="18" y="20" width="84" height="80" rx="18" fill="none" stroke="#F472B6" strokeWidth="1" strokeDasharray="4 2" />
            {/* Diamond Sparkle Header */}
            <path d="M60,22 L62,28 L68,30 L62,32 L60,38 L58,32 L52,30 L58,28 Z" fill="#FFFFFF" />
            <circle cx="34" cy="32" r="2" fill="#FDF2F8" />
            <circle cx="86" cy="32" r="2" fill="#FDF2F8" />
            {/* Text: SPECIAL */}
            <text
              x="60"
              y="53"
              textAnchor="middle"
              fill="#FDF2F8"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="13"
              letterSpacing="2"
            >
              SPECIAL
            </text>
            {/* White pill for OFFER */}
            <rect x="22" y="60" width="76" height="25" rx="6" fill="#FFFFFF" stroke="#FBCFE8" strokeWidth="1" />
            <text
              x="60"
              y="78"
              textAnchor="middle"
              fill="#86198F"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="16"
              letterSpacing="2"
            >
              OFFER
            </text>
            {/* Tagline */}
            <text x="60" y="97" textAnchor="middle" fill="#FCE7F3" fontSize="7.5" fontWeight="700" letterSpacing="1.5">
              EXCLUSIVE TODAY
            </text>
          </g>
        </svg>
      );

    case "new-arrival":
      return (
        <svg
          viewBox="0 0 120 120"
          className={className}
          style={{ background: "transparent", overflow: "visible", ...style }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_new_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="60%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>
            <filter id={`${uid}_new_shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#022C22" floodOpacity="0.45" />
            </filter>
          </defs>
          <g filter={`url(#${uid}_new_shadow)`}>
            {/* Contemporary Hexagonal Pill */}
            <polygon
              points="60,10 95,20 110,50 95,95 60,110 25,95 10,50 25,20"
              fill={`url(#${uid}_new_bg)`}
              stroke="#A7F3D0"
              strokeWidth="2.5"
            />
            {/* Sparkle badge */}
            <g transform="translate(48, 18)">
              <circle cx="12" cy="10" r="8" fill="#BEF264" />
              <path d="M12 4 L14 8 L18 10 L14 12 L12 16 L10 12 L6 10 L10 8 Z" fill="#065F46" />
            </g>
            {/* Text: NEW */}
            <text
              x="60"
              y="53"
              textAnchor="middle"
              fill="#BEF264"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="16"
              letterSpacing="3"
            >
              NEW
            </text>
            {/* ARRIVAL Banner */}
            <rect x="20" y="60" width="80" height="24" rx="5" fill="#BEF264" stroke="#FFFFFF" strokeWidth="1" />
            <text
              x="60"
              y="77"
              textAnchor="middle"
              fill="#064E3B"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="14"
              letterSpacing="1.5"
            >
              ARRIVAL
            </text>
            <text x="60" y="97" textAnchor="middle" fill="#D1FAE5" fontSize="7.5" fontWeight="700" letterSpacing="1">
              JUST IN STOCK
            </text>
          </g>
        </svg>
      );

    case "premium":
      return (
        <svg
          viewBox="0 0 120 120"
          className={className}
          style={{ background: "transparent", overflow: "visible", ...style }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_prem_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id={`${uid}_prem_gold`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <filter id={`${uid}_prem_shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#020617" floodOpacity="0.6" />
            </filter>
          </defs>
          <g filter={`url(#${uid}_prem_shadow)`}>
            {/* Diamond Crest / Circle */}
            <circle cx="60" cy="60" r="49" fill={`url(#${uid}_prem_bg)`} stroke={`url(#${uid}_prem_gold)`} strokeWidth="3" />
            <circle cx="60" cy="60" r="43" fill="none" stroke={`url(#${uid}_prem_gold)`} strokeWidth="1" opacity="0.6" />
            {/* Royal Crown */}
            <g transform="translate(45, 18)">
              <polygon points="15,4 20,12 28,6 25,18 5,18 2,6 10,12" fill={`url(#${uid}_prem_gold)`} />
              <circle cx="15" cy="4" r="1.5" fill="#FEF08A" />
              <circle cx="28" cy="6" r="1.5" fill="#FEF08A" />
              <circle cx="2" cy="6" r="1.5" fill="#FEF08A" />
            </g>
            {/* Text: PREMIUM */}
            <text
              x="60"
              y="59"
              textAnchor="middle"
              fill={`url(#${uid}_prem_gold)`}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="14"
              letterSpacing="2.5"
            >
              PREMIUM
            </text>
            {/* Golden Divider Line */}
            <line x1="32" y1="66" x2="88" y2="66" stroke={`url(#${uid}_prem_gold)`} strokeWidth="1" />
            <polygon points="60,64 62,66 60,68 58,66" fill="#FDE047" />
            {/* Sub: QUALITY */}
            <text
              x="60"
              y="79"
              textAnchor="middle"
              fill="#E2E8F0"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="700"
              fontSize="9"
              letterSpacing="2.5"
            >
              QUALITY
            </text>
            <text x="60" y="93" textAnchor="middle" fill="#FDE047" fontSize="8" letterSpacing="2">
              ★★★
            </text>
          </g>
        </svg>
      );

    case "trending":
      return (
        <svg
          viewBox="0 0 120 120"
          className={className}
          style={{ background: "transparent", overflow: "visible", ...style }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_trend_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="60%" stopColor="#6D28D9" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>
            <linearGradient id={`${uid}_trend_arrow`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <filter id={`${uid}_trend_shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#312E81" floodOpacity="0.45" />
            </filter>
          </defs>
          <g filter={`url(#${uid}_trend_shadow)`}>
            {/* Rounded Square / Octagon */}
            <rect x="12" y="12" width="96" height="96" rx="28" fill={`url(#${uid}_trend_bg)`} stroke="#A78BFA" strokeWidth="2.5" />
            {/* Upward Trend Graph Arrow */}
            <g transform="translate(20, 16)">
              <polyline
                points="12,32 30,18 48,26 68,8"
                fill="none"
                stroke={`url(#${uid}_trend_arrow)`}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polygon points="56,8 68,8 68,20" fill="#06B6D4" />
            </g>
            {/* Text: TRENDING */}
            <text
              x="60"
              y="69"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="14"
              letterSpacing="1.5"
            >
              TRENDING
            </text>
            {/* NOW Pill */}
            <rect x="34" y="76" width="52" height="20" rx="4" fill="#22D3EE" />
            <text
              x="60"
              y="90"
              textAnchor="middle"
              fill="#0F172A"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="11"
              letterSpacing="1.5"
            >
              NOW
            </text>
          </g>
        </svg>
      );

    case "best-deal":
    default:
      return (
        <svg
          viewBox="0 0 120 120"
          className={className}
          style={{ background: "transparent", overflow: "visible", ...style }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_deal_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="50%" stopColor="#FF5722" />
              <stop offset="100%" stopColor="#C2410C" />
            </linearGradient>
            <filter id={`${uid}_deal_shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#7C2D12" floodOpacity="0.45" />
            </filter>
            {/* Concentric circular arc along bottom curve for 100% VERIFIED text */}
            <path
              id={`${uid}_deal_arc`}
              d="M 32.4 83.1 A 36 36 0 0 0 87.6 83.1"
              fill="none"
            />
          </defs>
          <g filter={`url(#${uid}_deal_shadow)`}>
            {/* Circular Sunburst Seal */}
            <circle cx="60" cy="60" r="49" fill={`url(#${uid}_deal_bg)`} stroke="#FED7AA" strokeWidth="2.5" />
            <circle cx="60" cy="60" r="42" fill="none" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Top Stars */}
            <text x="60" y="38" textAnchor="middle" fill="#FEF08A" fontSize="9" fontWeight="800" letterSpacing="1.5">
              ★ TOP VALUE ★
            </text>
            {/* Text: BEST */}
            <text
              x="60"
              y="60"
              textAnchor="middle"
              fill="#FEF08A"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="18"
              letterSpacing="2"
            >
              BEST
            </text>
            {/* Text: DEAL */}
            <text
              x="60"
              y="84"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="22"
              letterSpacing="1.5"
              style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.4))" }}
            >
              DEAL
            </text>
            {/* Text: 100% VERIFIED along bottom curve with safe inner padding */}
            <text
              x="60"
              y="96"
              textAnchor="middle"
              fill="#FED7AA"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="6.2"
              fontWeight="700"
              letterSpacing="0.8"
            >
              <textPath
                href={`#${uid}_deal_arc`}
                xlinkHref={`#${uid}_deal_arc`}
                startOffset="50%"
                textAnchor="middle"
              >
                100% VERIFIED
              </textPath>
            </text>
          </g>
        </svg>
      );
  }
};
