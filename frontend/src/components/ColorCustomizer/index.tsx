"use client";
import React from "react";
import { Palette, RotateCcw } from "lucide-react";
import { posterThemes, getStandardThemes, getPremiumThemes } from "@constants/posterThemes";

export interface CustomColors {
    bg: string;
    text: string;
    accent: string;
    border: string;
    primary: string;
}

export const DEFAULT_CUSTOM_COLORS: CustomColors = {
    bg: "",
    text: "",
    accent: "",
    border: "",
    primary: "",
};

interface ColorRowProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    isDarkMode: boolean;
}

const ColorRow: React.FC<ColorRowProps> = ({ label, value, onChange, isDarkMode }) => (
    <div className="flex items-center gap-2">
        <label
            className="relative w-7 h-7 rounded-lg overflow-hidden border cursor-pointer flex-shrink-0 shadow-sm"
            style={{ borderColor: isDarkMode ? "#4b5563" : "#d1d5db" }}
        >
            <input
                type="color"
                value={value || "#ffffff"}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
                className="w-full h-full"
                style={{ backgroundColor: value || (isDarkMode ? "#374151" : "#f3f4f6") }}
            />
        </label>
        <span className={`text-[10px] font-medium flex-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            {label}
        </span>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#hex"
            className={`w-16 text-[9px] font-mono px-1.5 py-0.5 rounded border focus:outline-none focus:ring-1 focus:ring-orange-400 ${
                isDarkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-200 text-gray-700"
            }`}
        />
    </div>
);

interface ColorCustomizerProps {
    colors: CustomColors;
    onChange: (colors: CustomColors) => void;
    isDarkMode: boolean;
    selectedTheme: string;
    onThemeChange: (theme: string) => void;
    selectedTemplate?: string;
}

export const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
    colors,
    onChange,
    isDarkMode,
    selectedTheme,
    onThemeChange,
    selectedTemplate,
}) => {
    // Check if current template is premium
    const premiumTemplates = new Set(["frame15", "frame16", "frame17", "frame18", "frame19", "frame20", "frame21", "frame22", "frame23", "frame24", "frame25", "frame26"]);
    const isPremiumTemplate = selectedTemplate ? premiumTemplates.has(selectedTemplate) : false;

    // Derive the swatch list directly from posterThemes — single source of truth.
    const activePresets = isPremiumTemplate ? getPremiumThemes() : getStandardThemes();

    const hasCustomColors = Object.values(colors).some(Boolean);

    const handleReset = () => {
        onChange(DEFAULT_CUSTOM_COLORS);
    };

    const handlePreset = (themeKey: string) => {
        const preset = activePresets[themeKey];
        if (preset) {
            onChange({
                ...DEFAULT_CUSTOM_COLORS,
                bg: preset.bg,
                border: preset.borderHex,
            });
            // Also switch the underlying theme so frame text colors (theme.text)
            // align with the preset (e.g. dark presets -> text-white).
            if (posterThemes[themeKey as keyof typeof posterThemes]) {
                onThemeChange(themeKey);
            }
        }
    };

    const updateColor = (key: keyof CustomColors, value: string) => {
        onChange({ ...colors, [key]: value });
    };

    return (
        <div className={`flex flex-col rounded-2xl border shadow-lg backdrop-blur-sm p-3 ${
            isDarkMode ? "bg-gray-900/90 border-gray-700/60" : "bg-white/95 border-gray-200/80"
        }`} style={{ width: 200 }}>
            {/* Header */}
            <div className="flex items-center gap-1.5 px-1.5 pb-1.5 mb-0.5 border-b border-gray-200/30 w-full">
                <Palette size={13} className="text-orange-500" />
                <span className={`text-[10px] font-semibold uppercase tracking-widest flex-1 text-left ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                    Colors
                </span>
            </div>

            <div className="flex flex-col gap-2 mt-1.5">
                {/* Premium template indicator */}
                {isPremiumTemplate && (
                    <div className="text-[9px] font-semibold text-center px-2 py-1 rounded bg-orange-500/20 text-orange-600 mb-1">
                        PREMIUM NEON ONLY
                    </div>
                )}

                {/* Preset theme swatches */}
                <div className="grid grid-cols-6 gap-1.5 mb-2">
                    {Object.keys(activePresets).map((key) => {
                        const preset = activePresets[key];
                        if (!preset) return null;
                        const matchesPresetColors =
                            (colors.bg || "").toLowerCase() === preset.bg.toLowerCase() &&
                            (colors.border || "").toLowerCase() === preset.borderHex.toLowerCase();
                        const isActive = selectedTheme === key && (!hasCustomColors || matchesPresetColors);
                        return (
                            <button
                                key={key}
                                onClick={() => handlePreset(key)}
                                className={`w-7 h-7 rounded-md border-2 transition-all flex-shrink-0 cursor-pointer hover:scale-110 hover:shadow-md ${
                                    isActive ? "ring-2 ring-orange-400 ring-offset-1 scale-105 border-white shadow-md" : isDarkMode ? "border-gray-700 hover:border-gray-500" : "border-gray-200 hover:border-gray-400"
                                }`}
                                style={{ backgroundColor: preset.swatch }}
                                title={key}
                            />
                        );
                    })}
                </div>

                {/* Color pickers - hidden for premium templates */}
                {!isPremiumTemplate && (
                    <>
                        <ColorRow label="Border" value={colors.border} onChange={(v) => updateColor("border", v)} isDarkMode={isDarkMode} />
                    </>
                )}

                {/* Reset */}
                {hasCustomColors && (
                    <button
                        onClick={handleReset}
                        className={`flex items-center justify-center gap-1 text-[9px] font-medium py-1 rounded-lg transition-colors ${
                            isDarkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        <RotateCcw size={10} />
                        Reset to theme
                    </button>
                )}
                </div>
        </div>
    );
};
