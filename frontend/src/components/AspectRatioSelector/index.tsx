"use client";
import React, { useState } from "react";
import { POSTER_ASPECT_RATIOS, AspectRatioKey } from "@constants/posterAspectRatios";
import { Maximize2, X, Sparkles } from "lucide-react";

interface AspectRatioSelectorProps {
    selected: AspectRatioKey;
    onChange: (key: AspectRatioKey) => void;
    isDarkMode: boolean;
}

const ratioKeys = Object.keys(POSTER_ASPECT_RATIOS) as AspectRatioKey[];

/** Renders a mini visual preview of the aspect ratio shape */
const RatioPreview: React.FC<{ w: number; h: number; isActive: boolean; isDark: boolean }> = ({
    w,
    h,
    isActive,
    isDark,
}) => {
    // Normalize to max 32px dimension
    const max = 32;
    const scale = max / Math.max(w, h);
    const pw = Math.round(w * scale);
    const ph = Math.round(h * scale);
    return (
        <div
            className="flex items-center justify-center"
            style={{ width: 40, height: 40 }}
        >
            <div
                className={`rounded-[3px] transition-all duration-200 ${
                    isActive
                        ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                        : isDark
                        ? "bg-gray-600 group-hover:bg-gray-500"
                        : "bg-gray-300 group-hover:bg-gray-400"
                }`}
                style={{ width: pw, height: ph }}
            />
        </div>
    );
};

/** Desktop: Vertical side panel */
const DesktopPanel: React.FC<AspectRatioSelectorProps> = ({ selected, onChange, isDarkMode }) => {
    return (
        <div
            className={`hidden md:flex flex-col gap-1.5 p-2.5 rounded-2xl border shadow-lg backdrop-blur-sm ${
                isDarkMode
                    ? "bg-gray-900/90 border-gray-700/60"
                    : "bg-white/95 border-gray-200/80"
            }`}
            style={{ width: 160 }}
        >
            {/* Header */}
            <div className="flex items-center gap-1.5 px-1.5 pb-1.5 mb-0.5 border-b border-gray-200/30">
                <Maximize2 size={13} className="text-orange-500" />
                <span
                    className={`text-[10px] font-semibold uppercase tracking-widest ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                    Aspect Ratio
                </span>
            </div>

            {/* Ratio Options */}
            {ratioKeys.map((key) => {
                const config = POSTER_ASPECT_RATIOS[key];
                const isActive = selected === key;
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        className={`group relative flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all duration-200 text-left ${
                            isActive
                                ? isDarkMode
                                    ? "bg-orange-500/15 ring-1 ring-orange-500/40"
                                    : "bg-orange-50 ring-1 ring-orange-200"
                                : isDarkMode
                                ? "hover:bg-gray-800/60"
                                : "hover:bg-gray-50"
                        }`}
                    >
                        <RatioPreview
                            w={key === "A4" ? 3 : config.w}
                            h={key === "A4" ? 4.24 : config.h}
                            isActive={isActive}
                            isDark={isDarkMode}
                        />
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1">
                                <span
                                    className={`text-xs font-bold leading-none ${
                                        isActive
                                            ? "text-orange-500"
                                            : isDarkMode
                                            ? "text-gray-200"
                                            : "text-gray-800"
                                    }`}
                                >
                                    {config.label}
                                </span>
                                {config.recommended && (
                                    <Sparkles size={9} className="text-orange-400 flex-shrink-0" />
                                )}
                            </div>
                            <span
                                className={`text-[9px] leading-tight mt-0.5 ${
                                    isActive
                                        ? isDarkMode
                                            ? "text-orange-300/70"
                                            : "text-orange-600/70"
                                        : isDarkMode
                                        ? "text-gray-500"
                                        : "text-gray-400"
                                }`}
                            >
                                {config.use}
                            </span>
                        </div>
                        {/* Size badge */}
                        <span
                            className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] tabular-nums ${
                                isActive
                                    ? "text-orange-400/60"
                                    : isDarkMode
                                    ? "text-gray-600"
                                    : "text-gray-300"
                            }`}
                        >
                            {config.desktopW}×{config.desktopH}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

/** Mobile: Floating action button with popup */
const MobilePanel: React.FC<AspectRatioSelectorProps> = ({ selected, onChange, isDarkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const currentConfig = POSTER_ASPECT_RATIOS[selected];

    return (
        <div className="md:hidden fixed right-3 top-1/2 -translate-y-1/2 z-40">
            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                    isOpen
                        ? "bg-orange-500 text-white scale-110 shadow-orange-500/30"
                        : isDarkMode
                        ? "bg-gray-800 text-gray-300 border border-gray-600 shadow-black/40"
                        : "bg-white text-gray-700 border border-gray-200 shadow-gray-300/50"
                }`}
            >
                {isOpen ? (
                    <X size={18} />
                ) : (
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-[8px] font-bold">{currentConfig.label}</span>
                        <Maximize2 size={14} className="mt-0.5" />
                    </div>
                )}
            </button>

            {/* Popup Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[-1]"
                        onClick={() => setIsOpen(false)}
                    />
                    {/* Panel */}
                    <div
                        className={`absolute right-0 top-14 rounded-2xl border shadow-2xl p-2 min-w-[170px] backdrop-blur-md ${
                            isDarkMode
                                ? "bg-gray-900/95 border-gray-700/60"
                                : "bg-white/98 border-gray-200/80"
                        }`}
                        style={{
                            animation: "fadeSlideIn 0.2s ease-out",
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-1.5 px-2 pb-1.5 mb-1 border-b border-gray-200/20">
                            <Maximize2 size={11} className="text-orange-500" />
                            <span
                                className={`text-[9px] font-semibold uppercase tracking-widest ${
                                    isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                            >
                                Aspect Ratio
                            </span>
                        </div>

                        {/* Grid of options */}
                        <div className="grid grid-cols-2 gap-1">
                            {ratioKeys.map((key) => {
                                const config = POSTER_ASPECT_RATIOS[key];
                                const isActive = selected === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            onChange(key);
                                            setIsOpen(false);
                                        }}
                                        className={`group flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 ${
                                            isActive
                                                ? isDarkMode
                                                    ? "bg-orange-500/15 ring-1 ring-orange-500/40"
                                                    : "bg-orange-50 ring-1 ring-orange-200"
                                                : isDarkMode
                                                ? "hover:bg-gray-800/60"
                                                : "hover:bg-gray-50"
                                        }`}
                                    >
                                        <RatioPreview
                                            w={key === "A4" ? 3 : config.w}
                                            h={key === "A4" ? 4.24 : config.h}
                                            isActive={isActive}
                                            isDark={isDarkMode}
                                        />
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-0.5">
                                                <span
                                                    className={`text-[10px] font-bold ${
                                                        isActive
                                                            ? "text-orange-500"
                                                            : isDarkMode
                                                            ? "text-gray-200"
                                                            : "text-gray-700"
                                                    }`}
                                                >
                                                    {config.label}
                                                </span>
                                                {config.recommended && (
                                                    <Sparkles
                                                        size={8}
                                                        className="text-orange-400"
                                                    />
                                                )}
                                            </div>
                                            <span
                                                className={`text-[8px] ${
                                                    isDarkMode
                                                        ? "text-gray-500"
                                                        : "text-gray-400"
                                                }`}
                                            >
                                                {config.use}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}


        </div>
    );
};

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = (props) => {
    return (
        <>
            <DesktopPanel {...props} />
            <MobilePanel {...props} />
        </>
    );
};
