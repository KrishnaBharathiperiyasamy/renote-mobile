import { TemplatePreviewProps } from "@app-types/templatePreviewProps";

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  templateKey,
  selectedTemplate,
  onSelect,
  layout = "desc-left",
}) => {
  const isSelected = selectedTemplate === templateKey;
  const isNeonPremium15 = templateKey === "frame15";
  const isNeonPremium16 = templateKey === "frame16";
  const isNeonPremium17 = templateKey === "frame17";
  const isNeonPremium18 = templateKey === "frame18";
  const isNeonPremium19 = templateKey === "frame19";
  const isNeonPremium20 = templateKey === "frame20";
  const isNeonPremium21 = templateKey === "frame21";
  const isNeonPremium22 = templateKey === "frame22";
  const isNeonPremium23 = templateKey === "frame23";
  const isNeonPremium24 = templateKey === "frame24";
  const isNeonPremium25 = templateKey === "frame25";
  const isNeonPremium26 = templateKey === "frame26";
  const isNeonPremium = isNeonPremium15 || isNeonPremium16 || isNeonPremium17 || isNeonPremium18 || isNeonPremium19 || isNeonPremium20 || isNeonPremium21 || isNeonPremium22 || isNeonPremium23 || isNeonPremium24 || isNeonPremium25 || isNeonPremium26;
  return (
    <div
      onClick={() => onSelect(templateKey)}
      className={`w-10 h-10 md:w-16 md:h-16 rounded-lg cursor-pointer p-1 md:p-2 flex flex-col transition-all duration-300 flex-shrink-0 ${
        isNeonPremium
          ? isNeonPremium15
            ? "bg-gradient-to-br from-[#090019] via-[#160030] to-[#001a33]"
            : isNeonPremium16
              ? "bg-gradient-to-br from-[#04131f] via-[#071d3d] to-[#20052f]"
              : isNeonPremium17
                ? "bg-gradient-to-br from-[#070f00] via-[#152600] to-[#061a3f]"
                : isNeonPremium18
                  ? "bg-gradient-to-br from-[#0b060d] via-[#1a0b1f] to-[#0c1329]"
                  : isNeonPremium19
                    ? "bg-gradient-to-br from-[#05070f] via-[#090f24] to-[#160b16]"
                    : isNeonPremium20
                      ? "bg-gradient-to-br from-[#04050a] via-[#0a0f1f] to-[#12102c]"
                      : isNeonPremium21
                        ? "bg-gradient-to-br from-[#06090f] via-[#120826] to-[#0b2430]"
                        : isNeonPremium22
                          ? "bg-gradient-to-br from-[#05060d] via-[#11142e] to-[#24110f]"
                          : isNeonPremium23
                            ? "bg-gradient-to-br from-[#030509] via-[#0b1520] to-[#172025]"
                            : isNeonPremium24
                              ? "bg-gradient-to-br from-[#04070f] via-[#101635] to-[#032225]"
                              : "bg-gradient-to-br from-[#06090a] via-[#11161f] to-[#1e1208]"
          : "bg-white"
      } ${
        isSelected
          ? isNeonPremium
            ? isNeonPremium15
              ? "ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.65)] scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1"
              : isNeonPremium16
                ? "ring-2 ring-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.65)] scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1"
                : isNeonPremium17
                  ? "ring-2 ring-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.65)] scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1"
                  : isNeonPremium18
                    ? "ring-2 ring-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.65)] scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1"
                    : isNeonPremium19
                      ? "ring-2 ring-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.65)] scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1"
                      : isNeonPremium20
                        ? "ring-2 ring-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.65)] scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1"
                        : isNeonPremium21
                          ? "ring-2 ring-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.68)] scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1"
                          : isNeonPremium22
                            ? "ring-2 ring-blue-300 shadow-[0_0_12px_rgba(96,165,250,0.68)] scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1"
                            : isNeonPremium23
                              ? "ring-2 ring-slate-300 shadow-[0_0_12px_rgba(148,163,184,0.68)] scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1"
                              : isNeonPremium24
                                ? "ring-2 ring-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.68)] scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1"
                                : "ring-2 ring-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.68)] scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1"
            : "ring-2 ring-orange-500 shadow-lg scale-105 md:scale-110 -translate-y-0.5 md:-translate-y-1"
          : isNeonPremium
            ? isNeonPremium15
              ? "border border-cyan-400/40 shadow-sm hover:shadow-[0_0_12px_rgba(56,189,248,0.45)] hover:scale-105 hover:-translate-y-0.5"
              : isNeonPremium16
                ? "border border-teal-300/40 shadow-sm hover:shadow-[0_0_12px_rgba(45,212,191,0.45)] hover:scale-105 hover:-translate-y-0.5"
                : isNeonPremium17
                  ? "border border-lime-300/40 shadow-sm hover:shadow-[0_0_12px_rgba(163,230,53,0.45)] hover:scale-105 hover:-translate-y-0.5"
                  : isNeonPremium18
                    ? "border border-rose-300/40 shadow-sm hover:shadow-[0_0_12px_rgba(251,113,133,0.45)] hover:scale-105 hover:-translate-y-0.5"
                    : isNeonPremium19
                      ? "border border-cyan-300/40 shadow-sm hover:shadow-[0_0_12px_rgba(34,211,238,0.45)] hover:scale-105 hover:-translate-y-0.5"
                      : isNeonPremium20
                        ? "border border-emerald-300/40 shadow-sm hover:shadow-[0_0_12px_rgba(52,211,153,0.45)] hover:scale-105 hover:-translate-y-0.5"
                        : isNeonPremium21
                          ? "border border-cyan-300/40 shadow-sm hover:shadow-[0_0_12px_rgba(34,211,238,0.45)] hover:scale-105 hover:-translate-y-0.5"
                          : isNeonPremium22
                            ? "border border-blue-300/40 shadow-sm hover:shadow-[0_0_12px_rgba(96,165,250,0.45)] hover:scale-105 hover:-translate-y-0.5"
                            : isNeonPremium23
                              ? "border border-slate-300/40 shadow-sm hover:shadow-[0_0_12px_rgba(148,163,184,0.45)] hover:scale-105 hover:-translate-y-0.5"
                              : isNeonPremium24
                                ? "border border-violet-300/40 shadow-sm hover:shadow-[0_0_12px_rgba(167,139,250,0.45)] hover:scale-105 hover:-translate-y-0.5"
                                : "border border-lime-300/40 shadow-sm hover:shadow-[0_0_12px_rgba(163,230,53,0.45)] hover:scale-105 hover:-translate-y-0.5"
            : "border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 hover:-translate-y-0.5"
      }`}
    >
      <div
        className={`h-0.5 sm:h-1 rounded mb-0.5 sm:mb-1 transition-colors duration-300 ${
          isNeonPremium
            ? isNeonPremium15
              ? isSelected
                ? "bg-cyan-300"
                : "bg-fuchsia-400/80"
              : isNeonPremium16
                ? isSelected
                  ? "bg-teal-200"
                  : "bg-amber-300/80"
                : isNeonPremium17
                  ? isSelected
                    ? "bg-lime-200"
                    : "bg-yellow-300/80"
                  : isNeonPremium18
                    ? isSelected
                      ? "bg-rose-200"
                      : "bg-orange-300/80"
                    : isNeonPremium19
                      ? isSelected
                        ? "bg-cyan-200"
                        : "bg-red-300/80"
                      : isNeonPremium20
                        ? isSelected
                          ? "bg-emerald-200"
                          : "bg-amber-300/80"
                        : isNeonPremium21
                          ? isSelected
                            ? "bg-cyan-200"
                            : "bg-lime-300/80"
                          : isNeonPremium22
                            ? isSelected
                              ? "bg-blue-200"
                              : "bg-orange-300/80"
                            : isNeonPremium23
                              ? isSelected
                                ? "bg-slate-200"
                                : "bg-teal-300/80"
                              : isNeonPremium24
                                ? isSelected
                                  ? "bg-violet-200"
                                  : "bg-rose-300/80"
                                : isSelected
                                  ? "bg-lime-200"
                                  : "bg-sky-300/80"
            : isSelected
              ? "bg-orange-400"
              : "bg-gray-400"
        }`}
      />

      {layout === "media-only" && (
        <div className={`flex-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
      )}

      {layout === "desc-left" && (
        <div className="flex flex-1 gap-0.5">
          <div className="flex flex-col gap-0.25 w-1/2">
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium ? (isSelected ? "bg-cyan-200" : "bg-cyan-300/70") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium ? (isSelected ? "bg-fuchsia-200" : "bg-fuchsia-300/70") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium ? (isSelected ? "bg-sky-200" : "bg-sky-300/70") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
          </div>
          <div className={`w-1/2 rounded transition-colors duration-300 ${isNeonPremium ? (isSelected ? "bg-cyan-500/25" : "bg-fuchsia-500/20") : (isSelected ? "bg-orange-100" : "bg-gray-200")}`} />
        </div>
      )}

      {layout === "desc-right" && (
        <div className="flex flex-1 gap-0.5">
          <div className={`w-1/2 rounded transition-colors duration-300 ${isNeonPremium16 ? (isSelected ? "bg-teal-500/25" : "bg-sky-500/20") : (isSelected ? "bg-orange-100" : "bg-gray-200")}`} />
          <div className="flex flex-col gap-0.25 w-1/2">
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium16 ? (isSelected ? "bg-amber-200" : "bg-amber-300/70") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium16 ? (isSelected ? "bg-teal-200" : "bg-teal-300/70") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium16 ? (isSelected ? "bg-sky-200" : "bg-sky-300/70") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
          </div>
        </div>
      )}

      {layout === "product" && (
        <div className="flex flex-1 gap-0.5 items-center p-1">
          <div className={`w-1/3 h-full rounded flex items-center justify-center transition-colors duration-300 ${isNeonPremium17 ? (isSelected ? "bg-lime-400/80" : "bg-lime-500/55") : (isSelected ? "bg-orange-300" : "bg-gray-400")}`}>
            <div className={`w-3/4 h-3/4 rounded transition-colors duration-300 ${isNeonPremium17 ? (isSelected ? "bg-yellow-200" : "bg-yellow-300/80") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
          </div>
          <div className="flex flex-col gap-0.25 w-2/3">
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium17 ? (isSelected ? "bg-blue-200" : "bg-blue-300/70") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium17 ? (isSelected ? "bg-lime-200" : "bg-lime-300/70") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium17 ? (isSelected ? "bg-yellow-200" : "bg-yellow-300/70") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
          </div>
        </div>
      )}

      {layout === "product-alt" && (
        <div className={`flex-1 relative rounded overflow-hidden mb-0.5 sm:mb-1 p-1 transition-colors duration-300 ${isNeonPremium18 ? (isSelected ? "bg-violet-500/20" : "bg-violet-500/15") : (isSelected ? "bg-orange-100" : "bg-gray-200")}`}>
          <div className={`absolute inset-2 rounded transition-colors duration-300 ${isNeonPremium18 ? (isSelected ? "bg-rose-400/40" : "bg-rose-500/30") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
          <div className="absolute bottom-1 left-1 right-1 flex flex-col gap-0.25">
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium18 ? (isSelected ? "bg-orange-200" : "bg-orange-300/80") : (isSelected ? "bg-orange-300" : "bg-gray-400")}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium18 ? (isSelected ? "bg-purple-200" : "bg-purple-300/80") : (isSelected ? "bg-orange-300" : "bg-gray-400")}`} />
          </div>
        </div>
      )}

      {layout === "frame5" && (
        <div className={`flex-1 relative rounded overflow-hidden mb-0.5 sm:mb-1 transition-colors duration-300 ${isNeonPremium19 ? (isSelected ? "bg-blue-500/20" : "bg-blue-500/15") : (isSelected ? "bg-orange-100" : "bg-gray-200")}`}>
          <div className={`absolute inset-1/4 rounded transition-colors duration-300 ${isNeonPremium19 ? (isSelected ? "bg-cyan-300/60" : "bg-red-400/45") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
        </div>
      )}

      {/* Frame 6: Hero banner — large image with small logo overlay top-left, text below */}
      {layout === "hero-banner" && (
        <div className="flex flex-col flex-1 gap-0.5">
          <div className={`relative flex-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`}>
            <div className={`absolute top-0.5 left-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-sm transition-colors duration-300 ${isSelected ? "bg-orange-400" : "bg-gray-500"}`} />
          </div>
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
        </div>
      )}

      {/* Frame 7: Magazine — wide image top, text+logo split below */}
      {layout === "magazine" && (
        <div className="flex flex-col flex-1 gap-0.5">
          <div className={`h-2/3 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className="flex gap-0.5 flex-1">
            <div className="flex flex-col gap-0.25 w-2/3">
              <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
              <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            </div>
            <div className={`w-1/3 rounded transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
          </div>
        </div>
      )}

      {/* Frame 8: Catalog — left image 50%, right text+logo stacked */}
      {layout === "catalog" && (
        <div className="flex flex-1 gap-0.5">
          <div className={`w-1/2 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className="flex flex-col gap-0.5 w-1/2 justify-between">
            <div className="flex flex-col gap-0.25">
              <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
              <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
              <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            </div>
            <div className={`w-3/4 self-center aspect-square rounded transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
          </div>
        </div>
      )}

      {/* Frame 9: Showcase — image with small logo overlay bottom-right, text below */}
      {layout === "showcase" && (
        <div className="flex flex-col flex-1 gap-0.5">
          <div className={`relative flex-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`}>
            <div className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-sm transition-colors duration-300 ${isSelected ? "bg-orange-400" : "bg-gray-500"}`} />
          </div>
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          <div className={`h-0.5 sm:h-1 rounded w-2/3 self-center transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
        </div>
      )}

      {/* Frame 10: Grid — large image left, logo+name right, specs full width bottom */}
      {layout === "grid" && (
        <div className="flex flex-col flex-1 gap-0.5">
          <div className="flex gap-0.5 flex-1">
            <div className={`w-2/3 rounded transition-colors duration-300 ${isNeonPremium20 ? (isSelected ? "bg-emerald-500/20" : "bg-emerald-500/15") : (isSelected ? "bg-orange-100" : "bg-gray-200")}`} />
            <div className="w-1/3 flex flex-col gap-0.5 items-center justify-center">
              <div className={`w-full aspect-square rounded transition-colors duration-300 ${isNeonPremium20 ? (isSelected ? "bg-violet-300/70" : "bg-violet-400/50") : (isSelected ? "bg-orange-300" : "bg-gray-400")}`} />
              <div className={`h-0.5 sm:h-1 w-full rounded transition-colors duration-300 ${isNeonPremium20 ? (isSelected ? "bg-amber-200" : "bg-amber-300/75") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
            </div>
          </div>
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium20 ? (isSelected ? "bg-emerald-200" : "bg-emerald-300/70") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium20 ? (isSelected ? "bg-violet-200" : "bg-violet-300/70") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
        </div>
      )}

      {/* Frame 11: Minimal Clean — full bleed image, floating price badge */}
      {layout === "minimal-clean" && (
        <div className="flex flex-col flex-1 gap-0.5 relative">
          <div className={`flex-1 rounded transition-colors duration-300 ${isNeonPremium21 ? (isSelected ? "bg-cyan-500/25" : "bg-cyan-500/18") : (isSelected ? "bg-orange-100" : "bg-gray-200")}`} />
          <div className={`absolute bottom-2 right-0.5 w-2 h-1.5 sm:w-3 sm:h-2 rounded-sm transition-colors duration-300 ${isNeonPremium21 ? (isSelected ? "bg-lime-300" : "bg-lime-400/80") : (isSelected ? "bg-orange-400" : "bg-gray-500")}`} />
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium21 ? (isSelected ? "bg-fuchsia-200" : "bg-fuchsia-300/75") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
        </div>
      )}

      {/* Frame 12: Split Diagonal — diagonal split image+text */}
      {layout === "split-diagonal" && (
        <div className="flex flex-1 gap-0.5">
          <div className="w-2/5 flex flex-col gap-0.5 justify-center">
            <div className={`w-3/4 aspect-square rounded-full self-center transition-colors duration-300 ${isNeonPremium22 ? (isSelected ? "bg-orange-300/90" : "bg-pink-400/70") : (isSelected ? "bg-orange-300" : "bg-gray-400")}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium22 ? (isSelected ? "bg-blue-200" : "bg-blue-300/75") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium22 ? (isSelected ? "bg-orange-200" : "bg-orange-300/75") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
          </div>
          <div className={`w-3/5 rounded transition-colors duration-300 ${isNeonPremium22 ? (isSelected ? "bg-blue-500/25" : "bg-blue-500/16") : (isSelected ? "bg-orange-100" : "bg-gray-200")}`} style={{ clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)" }} />
        </div>
      )}

      {/* Frame 13: Split Diagonal Alt — image left, text right (mirrored) */}
      {layout === "split-diagonal-alt" && (
        <div className="flex flex-1 gap-0.5">
          <div className={`w-3/5 rounded transition-colors duration-300 ${isNeonPremium24 ? (isSelected ? "bg-violet-500/24" : "bg-violet-500/16") : (isSelected ? "bg-orange-100" : "bg-gray-200")}`} style={{ clipPath: "polygon(0 0, 85% 0, 100% 100%, 0% 100%)" }} />
          <div className="w-2/5 flex flex-col gap-0.5 justify-center">
            <div className={`w-3/4 aspect-square rounded-full self-center transition-colors duration-300 ${isNeonPremium24 ? (isSelected ? "bg-teal-300/85" : "bg-teal-400/65") : (isSelected ? "bg-orange-300" : "bg-gray-400")}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium24 ? (isSelected ? "bg-rose-200" : "bg-rose-300/75") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium24 ? (isSelected ? "bg-teal-200" : "bg-teal-300/75") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
          </div>
        </div>
      )}
      {layout === "polaroid" && (
        <div className="flex flex-1 items-center justify-center">
          <div className={`w-4/5 h-4/5 rounded-sm p-0.5 transition-colors duration-300 ${isSelected ? "bg-orange-50 shadow-md" : "bg-white shadow-sm border border-gray-200"}`} style={{ transform: "rotate(-2deg)" }}>
            <div className={`w-full h-3/4 rounded-sm transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
            <div className={`h-0.5 sm:h-1 rounded mt-0.5 transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          </div>
        </div>
      )}

      {/* Frame 14: Billboard — wide image top, logo overlay, text bottom */}
      {layout === "billboard" && (
        <div className="flex flex-col flex-1 gap-0.5">
          <div className={`relative h-3/5 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`}>
            <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors duration-300 ${isSelected ? "bg-orange-400" : "bg-gray-500"}`} />
          </div>
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          <div className={`h-0.5 sm:h-1 rounded w-1/2 transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
        </div>
      )}

      {/* Frame 15: Centered Circle — circular product */}
      {layout === "centered-circle" && (
        <div className="flex flex-col flex-1 items-center justify-center gap-0.5">
          <div className={`w-3/5 aspect-square rounded-full transition-colors duration-300 ${isSelected ? "bg-orange-100 ring-1 ring-orange-300" : "bg-gray-200 ring-1 ring-gray-300"}`} />
          <div className={`h-0.5 sm:h-1 w-full rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          <div className={`h-0.5 sm:h-1 w-3/4 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
        </div>
      )}

      {/* Frame 16: Price Tag — image with large price tag overlay */}
      {layout === "price-tag" && (
        <div className="flex flex-col flex-1 gap-0.5 relative">
          <div className={`flex-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className={`absolute top-1 left-0.5 w-3 h-2 sm:w-4 sm:h-3 rounded-sm transition-colors duration-300 ${isSelected ? "bg-red-400" : "bg-red-300"}`} style={{ transform: "rotate(-5deg)" }} />
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
        </div>
      )}

      {/* Frame 17: Side Logo — thin logo strip left, product right */}
      {layout === "side-logo" && (
        <div className="flex flex-1 gap-0.5">
          <div className={`w-1/5 rounded flex items-center justify-center transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`}>
            <div className={`w-2/3 aspect-square rounded-sm transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          </div>
          <div className={`flex-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
        </div>
      )}

      {/* Frame 18: Overlay Text — full bleed with text overlays */}
      {layout === "overlay-text" && (
        <div className={`flex flex-col flex-1 relative rounded overflow-hidden transition-colors duration-300 ${isNeonPremium23 ? (isSelected ? "bg-slate-500/20" : "bg-slate-500/14") : (isSelected ? "bg-orange-100" : "bg-gray-200")}`}>
          <div className={`h-1 sm:h-1.5 transition-colors duration-300 ${isNeonPremium23 ? (isSelected ? "bg-slate-200/80" : "bg-slate-300/60") : (isSelected ? "bg-orange-400/60" : "bg-gray-500/40")}`} />
          <div className="flex-1" />
          <div className={`h-2 sm:h-3 transition-colors duration-300 ${isNeonPremium23 ? (isSelected ? "bg-teal-300/70" : "bg-blue-300/55") : (isSelected ? "bg-orange-400/60" : "bg-gray-500/40")}`} />
        </div>
      )}

      {/* Frame 19: Duo Panel — equal halves, logo+text left, product right */}
      {layout === "duo-panel" && (
        <div className="flex flex-1 gap-0.5">
          <div className="w-1/2 flex flex-col gap-0.5 items-center justify-center">
            <div className={`w-2/3 aspect-square rounded-full transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
            <div className={`h-0.5 sm:h-1 w-full rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 w-3/4 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          </div>
          <div className={`w-1/2 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
        </div>
      )}

      {/* Frame 20: Stamp — double bordered product */}
      {layout === "stamp" && (
        <div className={`flex flex-1 items-center justify-center p-0.5 rounded transition-colors duration-300 ${isSelected ? "border border-orange-400" : "border border-gray-400"}`}>
          <div className={`w-full h-full rounded flex items-center justify-center transition-colors duration-300 ${isSelected ? "border border-orange-300" : "border border-gray-300"}`}>
            <div className={`w-3/4 h-3/4 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          </div>
        </div>
      )}

      {/* Frame 21: Card Stack — layered cards with shadow */}
      {layout === "card-stack" && (
        <div className="flex flex-1 items-center justify-center relative">
          <div className={`absolute w-4/5 h-4/5 rounded-sm transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} style={{ transform: "rotate(6deg)" }} />
          <div className={`absolute w-4/5 h-4/5 rounded-sm transition-colors duration-300 ${isSelected ? "bg-orange-150" : "bg-gray-250"}`} style={{ transform: "rotate(-3deg)" }} />
          <div className={`relative w-4/5 h-4/5 rounded-sm transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`}>
            <div className={`absolute bottom-0.5 left-0.5 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isSelected ? "bg-orange-400" : "bg-gray-500"}`} />
          </div>
        </div>
      )}

      {/* Frame 22: Ribbon — diagonal ribbon across image */}
      {layout === "ribbon" && (
        <div className="flex flex-col flex-1 gap-0.5 relative">
          <div className={`flex-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className={`absolute top-1 left-0 right-0 h-1 transition-colors duration-300 ${isSelected ? "bg-orange-400/70" : "bg-gray-500/50"}`} style={{ transform: "rotate(35deg)" }} />
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          <div className={`h-0.5 sm:h-1 rounded w-2/3 transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
        </div>
      )}

      {/* Frame 23: Window — 2x2 grid of product, logo center */}
      {layout === "window-grid" && (
        <div className="flex flex-1 relative">
          <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full">
            <div className={`rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
            <div className={`rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
            <div className={`rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
            <div className={`rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          </div>
          <div className={`absolute inset-0 flex items-center justify-center`}>
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors duration-300 ${isSelected ? "bg-orange-400" : "bg-gray-500"}`} />
          </div>
        </div>
      )}

      {/* Frame 11: Spotlight Burst — sunburst rays, square hero, logo badge top-right, name pill, desc */}
      {layout === "spotlight-burst" && (
        <div className="flex flex-col flex-1 relative overflow-hidden">
          {/* Sunburst rays backdrop */}
          <div
            aria-hidden
            className={`absolute inset-0 transition-colors duration-300 ${isSelected ? "text-orange-300" : "text-gray-400"} opacity-40`}
            style={{
              background: "repeating-conic-gradient(from 0deg at 50% 40%, currentColor 0deg 5deg, transparent 5deg 18deg)",
              maskImage: "radial-gradient(circle at 50% 40%, black 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(circle at 50% 40%, black 30%, transparent 75%)",
            }}
          />
          {/* Title bar */}
          <div className={`relative h-1 sm:h-1.5 rounded mx-1 mt-0.5 transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
          {/* Hero square + logo badge */}
          <div className="relative flex-1 flex items-center justify-center">
            <div className={`relative w-1/2 aspect-square transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`}>
              <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 transition-colors duration-300 ${isSelected ? "bg-white border border-orange-400" : "bg-white border border-gray-500"}`} />
            </div>
          </div>
          {/* Name pill */}
          <div className="relative flex justify-center mb-0.5">
            <div className={`h-1 sm:h-1.5 w-1/2 rounded-full transition-colors duration-300 ${isSelected ? "bg-orange-400" : "bg-gray-500"}`} />
          </div>
          {/* Description lines */}
          <div className="relative flex flex-col items-center gap-0.5 mb-0.5 px-1">
            <div className={`h-0.5 w-3/4 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 w-2/3 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          </div>
          {/* Footer band */}
          <div className={`relative h-1 sm:h-1.5 transition-colors duration-300 ${isSelected ? "bg-orange-400" : "bg-gray-500"}`} />
        </div>
      )}

      {/* Frame 24: Spotlight — dark bg, glowing product center */}
      {layout === "spotlight" && (
        <div className={`flex flex-col flex-1 items-center justify-center gap-0.5 rounded transition-colors duration-300 ${isSelected ? "bg-gray-700" : "bg-gray-600"}`}>
          <div className={`w-3/5 aspect-square rounded transition-colors duration-300 ${isSelected ? "bg-orange-200 shadow-sm shadow-orange-300" : "bg-gray-400"}`} />
          <div className={`h-0.5 sm:h-1 w-3/4 rounded transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
          <div className={`h-0.5 sm:h-1 w-1/2 rounded transition-colors duration-300 ${isSelected ? "bg-yellow-300" : "bg-gray-500"}`} />
        </div>
      )}

      {/* Frame 25: Corner Logo — product fills, logo bottom-right, price top-right */}
      {layout === "corner-logo" && (
        <div className="flex flex-col flex-1 gap-0.5 relative">
          <div className={`flex-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className={`absolute bottom-2 right-0.5 w-2 h-2 rounded-full transition-colors duration-300 ${isSelected ? "bg-orange-400" : "bg-gray-500"}`} />
          <div className={`absolute top-0.5 right-0.5 w-2 h-1 sm:w-3 sm:h-1.5 rounded-sm transition-colors duration-300 ${isSelected ? "bg-green-400" : "bg-green-300"}`} />
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
        </div>
      )}

      {/* Frame 26: Text Heavy — large text area left, small product right */}
      {layout === "text-heavy" && (
        <div className="flex flex-1 gap-0.5">
          <div className="w-3/5 flex flex-col gap-0.5 justify-center">
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 rounded w-2/3 transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          </div>
          <div className={`w-2/5 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
        </div>
      )}

      {/* Frame 27: Badge — rounded product with logo overlay, price circle */}
      {layout === "badge" && (
        <div className="flex flex-col flex-1 items-center justify-center gap-0.5 relative">
          <div className={`w-3/5 aspect-square rounded-xl transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`}>
            <div className={`absolute top-1 left-1 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isSelected ? "bg-orange-400" : "bg-gray-500"}`} />
          </div>
          <div className={`absolute bottom-1 right-0.5 w-2 h-2 rounded-full transition-colors duration-300 ${isSelected ? "bg-red-400" : "bg-red-300"}`} />
          <div className={`h-0.5 sm:h-1 w-full rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
        </div>
      )}

      {/* Frame 28: Flip Card — product top, reflection bottom */}
      {layout === "flip-card" && (
        <div className="flex flex-col flex-1 gap-0.5">
          <div className={`flex-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          <div className={`h-1/4 rounded transition-colors duration-300 opacity-30 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
        </div>
      )}

      {/* Frame 29: Mosaic — tall product left, logo+text right */}
      {layout === "mosaic" && (
        <div className="flex flex-1 gap-0.5">
          <div className={`w-3/5 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className="w-2/5 flex flex-col gap-0.5">
            <div className={`flex-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
            <div className="flex-1 flex flex-col gap-0.25 justify-center">
              <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
              <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            </div>
          </div>
        </div>
      )}

      {/* Frame 30: Floating — centered product with shadow */}
      {layout === "floating" && (
        <div className="flex flex-col flex-1 items-center justify-center gap-0.5">
          <div className={`w-3/5 aspect-square rounded-lg shadow-md transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className={`h-0.5 sm:h-1 w-full rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          <div className={`h-0.5 sm:h-1 w-1/2 rounded transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
        </div>
      )}

      {/* Frame 31: Full Spread — full bleed with translucent center bar */}
      {layout === "full-spread" && (
        <div className={`flex flex-col flex-1 relative rounded overflow-hidden transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`}>
          <div className="flex-1" />
          <div className={`h-2 sm:h-3 flex items-center justify-center transition-colors duration-300 ${isSelected ? "bg-orange-400/50" : "bg-gray-500/40"}`}>
            <div className={`w-1.5 h-1 rounded-full transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          </div>
          <div className="flex-1" />
        </div>
      )}

      {/* Frame 32: Column — narrow product left, wide text right */}
      {layout === "column" && (
        <div className="flex flex-1 gap-0.5">
          <div className={`w-1/3 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className={`w-2/3 flex flex-col gap-0.5 justify-center border-l-2 pl-0.5 transition-colors duration-300 ${isSelected ? "border-orange-300" : "border-gray-300"}`}>
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 rounded w-1/2 transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
          </div>
        </div>
      )}

      {/* Frame 33: Header Logo — logo in thick header, product below */}
      {layout === "header-logo" && (
        <div className="flex flex-col flex-1 gap-0.5">
          <div className={`h-1/4 rounded flex items-center justify-between px-0.5 transition-colors duration-300 ${isNeonPremium25 ? (isSelected ? "bg-lime-400/85" : "bg-lime-500/60") : (isSelected ? "bg-orange-400" : "bg-gray-500")}`}>
            <div className={`h-0.5 sm:h-1 w-1/2 rounded transition-colors duration-300 ${isNeonPremium25 ? (isSelected ? "bg-slate-900/80" : "bg-slate-900/60") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${isNeonPremium25 ? (isSelected ? "bg-sky-300" : "bg-sky-400/80") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
          </div>
          <div className={`flex-1 rounded transition-colors duration-300 ${isNeonPremium25 ? (isSelected ? "bg-lime-500/22" : "bg-lime-500/14") : (isSelected ? "bg-orange-100" : "bg-gray-200")}`} />
          <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isNeonPremium25 ? (isSelected ? "bg-sky-200" : "bg-sky-300/75") : (isSelected ? "bg-orange-200" : "bg-gray-300")}`} />
        </div>
      )}

      {/* Frame 34: Quotation — quote marks around description */}
      {layout === "quotation" && (
        <div className="flex flex-col flex-1 gap-0.5">
          <div className={`h-2/5 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className="flex-1 flex flex-col items-center justify-center px-1 relative">
            <span className={`absolute top-0 left-0 text-[8px] opacity-30 ${isSelected ? "text-orange-500" : "text-gray-500"}`}>&ldquo;</span>
            <div className={`h-0.5 sm:h-1 w-full rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 w-3/4 rounded mt-0.5 transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <span className={`absolute bottom-0 right-0 text-[8px] opacity-30 ${isSelected ? "text-orange-500" : "text-gray-500"}`}>&rdquo;</span>
          </div>
        </div>
      )}

      {/* Frame 35: Three Column — logo, product, specs+price */}
      {layout === "three-column" && (
        <div className="flex flex-1 gap-0.5">
          <div className={`w-1/4 rounded flex items-center justify-center transition-colors duration-300 ${isSelected ? "bg-orange-200/50" : "bg-gray-200/50"}`}>
            <div className={`w-2/3 aspect-square rounded transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
          </div>
          <div className={`w-2/4 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className="w-1/4 flex flex-col gap-0.25 justify-center">
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 w-2/3 rounded transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
          </div>
        </div>
      )}

      {/* Frame 36: Bottom Bar — full image, thick bar at bottom */}
      {layout === "bottom-bar" && (
        <div className="flex flex-col flex-1 gap-0">
          <div className={`flex-1 rounded-t transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className={`h-1/4 rounded-b flex items-center justify-between px-0.5 transition-colors duration-300 ${isSelected ? "bg-orange-400" : "bg-gray-500"}`}>
            <div className={`h-0.5 sm:h-1 w-1/2 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 w-1/4 rounded transition-colors duration-300 ${isSelected ? "bg-yellow-300" : "bg-yellow-200"}`} />
          </div>
        </div>
      )}

      {/* Frame 37: Framed — ornate double border */}
      {layout === "framed" && (
        <div className={`flex flex-1 items-center justify-center p-0.5 rounded transition-colors duration-300 ${isSelected ? "border-2 border-orange-400" : "border-2 border-gray-400"}`}>
          <div className={`w-full h-full rounded flex flex-col gap-0.5 p-0.5 transition-colors duration-300 ${isSelected ? "border border-double border-orange-300" : "border border-double border-gray-300"}`}>
            <div className={`flex-1 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
            <div className="flex gap-0.5 items-center">
              <div className={`w-1.5 h-1.5 rounded transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
              <div className="flex-1 flex flex-col gap-0.25">
                <div className={`h-0.5 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
                <div className={`h-0.5 rounded w-2/3 transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Frame 38: Top Strip — product strip top, text below */}
      {layout === "top-strip" && (
        <div className="flex flex-col flex-1 gap-0.5">
          <div className={`h-2/5 rounded transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className="flex-1 flex flex-col gap-0.5 items-center justify-center px-0.5">
            <div className={`h-0.5 sm:h-1 w-full rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 w-full rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 w-3/4 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          </div>
        </div>
      )}

      {/* Frame 39: Logo Wall — faded logo bg, product centered */}
      {layout === "logo-wall" && (
        <div className="flex flex-col flex-1 items-center justify-center gap-0.5 relative">
          <div className={`absolute inset-0 flex items-center justify-center opacity-15`}>
            <div className={`w-4/5 h-4/5 rounded transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
          </div>
          <div className={`relative w-3/5 aspect-square rounded-lg transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className={`relative h-0.5 sm:h-1 w-3/4 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
          <div className={`relative h-0.5 sm:h-1 w-1/2 rounded transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
        </div>
      )}

      {/* Frame 40: Arch — rounded arch top product, text below */}
      {layout === "arch" && (
        <div className="flex flex-col flex-1 gap-0.5">
          <div className={`h-3/5 rounded-t-full transition-colors duration-300 ${isSelected ? "bg-orange-100" : "bg-gray-200"}`} />
          <div className="flex-1 flex flex-col gap-0.5 items-center justify-center px-0.5">
            <div className={`h-0.5 sm:h-1 w-full rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 w-3/4 rounded transition-colors duration-300 ${isSelected ? "bg-orange-200" : "bg-gray-300"}`} />
            <div className={`h-0.5 sm:h-1 w-1/2 rounded transition-colors duration-300 ${isSelected ? "bg-orange-300" : "bg-gray-400"}`} />
          </div>
        </div>
      )}

      {/* Frame 41: Cyber Punk — dark bg, cyan neon grid, scanline */}
      {layout === "specs-grid" && (
        <div className="flex flex-col flex-1 rounded overflow-hidden relative" style={{ background: '#0a0e1a' }}>
          {/* Scanline overlay */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,240,0.1) 2px, rgba(0,255,240,0.1) 3px)' }} />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(0,255,240,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,240,0.3) 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
          <div className="flex-1 flex items-center justify-center z-10">
            <div className="w-3/5 aspect-square rounded" style={{ background: 'rgba(0,255,240,0.15)', border: '1px solid rgba(0,255,240,0.5)', boxShadow: isSelected ? '0 0 8px rgba(0,255,240,0.5)' : '0 0 4px rgba(0,255,240,0.2)' }} />
          </div>
          <div className="flex gap-0.5 items-center px-0.5 pb-0.5 z-10">
            <div className="h-0.5 sm:h-1 flex-1 rounded" style={{ background: 'rgba(0,255,240,0.4)' }} />
            <div className="w-2 h-1 rounded" style={{ background: isSelected ? '#00fff0' : 'rgba(0,255,240,0.5)', boxShadow: isSelected ? '0 0 4px #00fff0' : 'none' }} />
          </div>
        </div>
      )}

      {/* Frame 42: Neon Split — dark bg, pink-purple diagonal, neon border */}
      {layout === "hero-split" && (
        <div className="flex flex-1 rounded overflow-hidden relative" style={{ background: '#0d0d1a' }}>
          {/* Diagonal split */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,45,149,0.25) 0%, transparent 50%, rgba(139,92,246,0.25) 100%)' }} />
          {/* Neon border glow */}
          <div className="absolute inset-0 rounded" style={{ border: '1px solid rgba(255,45,149,0.6)', boxShadow: isSelected ? '0 0 8px rgba(255,45,149,0.4), inset 0 0 8px rgba(139,92,246,0.2)' : '0 0 4px rgba(255,45,149,0.2)' }} />
          <div className="flex flex-1 items-center justify-center z-10">
            <div className="w-1/2 aspect-square rounded-lg" style={{ background: 'rgba(255,45,149,0.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,45,149,0.4)' }} />
          </div>
          <div className="absolute bottom-0.5 left-0.5 right-0.5 flex gap-0.5 z-10">
            <div className="h-0.5 sm:h-1 flex-1 rounded" style={{ background: 'rgba(139,92,246,0.5)' }} />
            <div className="h-0.5 sm:h-1 w-1/3 rounded" style={{ background: isSelected ? '#ff2d95' : 'rgba(255,45,149,0.5)' }} />
          </div>
        </div>
      )}

      {/* Frame 43: Glassmorphism — gradient bg, frosted glass card */}
      {layout === "dark-showcase" && (
        <div className="flex flex-col flex-1 rounded relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
          {/* Animated blobs */}
          <div className="absolute w-4 h-4 rounded-full opacity-40" style={{ background: '#a78bfa', top: '-4px', left: '-4px', filter: 'blur(4px)' }} />
          <div className="absolute w-3 h-3 rounded-full opacity-40" style={{ background: '#f472b6', bottom: '-2px', right: '-2px', filter: 'blur(4px)' }} />
          {/* Glass card */}
          <div className="flex-1 flex items-center justify-center z-10 p-1">
            <div className="w-4/5 h-4/5 rounded-lg flex flex-col items-center justify-center gap-0.5" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div className="w-2/3 aspect-square rounded" style={{ background: 'rgba(255,255,255,0.25)' }} />
              <div className="h-0.5 w-3/4 rounded" style={{ background: 'rgba(255,255,255,0.4)' }} />
            </div>
          </div>
        </div>
      )}

      {/* Frame 44: Holographic — rainbow shimmer border, prismatic effect */}
      {layout === "config-cards" && (
        <div className="flex flex-col flex-1 rounded overflow-hidden relative" style={{ background: '#1a1a2e', border: '1px solid transparent', backgroundImage: isSelected ? 'linear-gradient(#1a1a2e, #1a1a2e), linear-gradient(45deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0088)' : 'linear-gradient(#1a1a2e, #1a1a2e), linear-gradient(45deg, rgba(255,0,0,0.4), rgba(0,255,0,0.4), rgba(0,0,255,0.4))', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }}>
          {/* Shimmer overlay */}
          <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.3) 50%, transparent 80%)' }} />
          {/* Prismatic corner */}
          <div className="absolute top-0 right-0 w-3 h-3 opacity-30" style={{ background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }} />
          <div className="flex-1 flex items-center justify-center z-10">
            <div className="w-3/5 aspect-square rounded" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: isSelected ? '0 0 12px rgba(255,255,255,0.15)' : 'none' }} />
          </div>
          <div className="flex gap-0.5 px-0.5 pb-0.5 z-10">
            <div className="h-0.5 sm:h-1 flex-1 rounded" style={{ background: 'linear-gradient(90deg, rgba(255,0,128,0.4), rgba(0,200,255,0.4))' }} />
          </div>
        </div>
      )}

      {/* Frame 45: Aurora — dark bg, green-cyan aurora gradient, star dots */}
      {layout === "banner-pro" && (
        <div className="flex flex-col flex-1 rounded overflow-hidden relative" style={{ background: '#0a0f1a' }}>
          {/* Aurora gradient */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,255,136,0.15) 30%, rgba(0,255,255,0.1) 60%, transparent 100%)' }} />
          {/* Star dots */}
          <div className="absolute w-0.5 h-0.5 rounded-full" style={{ background: '#fff', top: '2px', left: '4px', opacity: 0.6 }} />
          <div className="absolute w-0.5 h-0.5 rounded-full" style={{ background: '#fff', top: '6px', right: '3px', opacity: 0.4 }} />
          <div className="absolute w-0.5 h-0.5 rounded-full" style={{ background: '#fff', bottom: '8px', left: '8px', opacity: 0.5 }} />
          {/* Content */}
          <div className="flex-1 flex items-center justify-center z-10">
            <div className="w-3/5 aspect-square rounded-lg" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', boxShadow: isSelected ? '0 0 10px rgba(0,255,136,0.3)' : '0 0 4px rgba(0,255,136,0.1)' }} />
          </div>
          <div className="flex gap-0.5 px-0.5 pb-0.5 z-10">
            <div className="h-0.5 sm:h-1 flex-1 rounded" style={{ background: 'rgba(0,255,136,0.35)' }} />
            <div className="h-0.5 sm:h-1 w-1/3 rounded" style={{ background: isSelected ? 'rgba(0,255,255,0.6)' : 'rgba(0,255,255,0.3)' }} />
          </div>
        </div>
      )}

      {/* Frame 46: Circuit Tech — dark bg, orange circuit traces, LED nodes */}
      {layout === "tech-spec" && (
        <div className="flex flex-1 rounded overflow-hidden relative" style={{ background: '#0d1117' }}>
          {/* Circuit trace lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
            <line x1="0" y1="30%" x2="40%" y2="30%" stroke="#f97316" strokeWidth="0.5" />
            <line x1="40%" y1="30%" x2="40%" y2="70%" stroke="#f97316" strokeWidth="0.5" />
            <line x1="40%" y1="70%" x2="100%" y2="70%" stroke="#f97316" strokeWidth="0.5" />
            <line x1="60%" y1="0" x2="60%" y2="40%" stroke="#f97316" strokeWidth="0.5" />
            <line x1="60%" y1="40%" x2="100%" y2="40%" stroke="#f97316" strokeWidth="0.5" />
          </svg>
          {/* LED nodes */}
          <div className="absolute w-1 h-1 rounded-full" style={{ background: isSelected ? '#f97316' : 'rgba(249,115,22,0.5)', top: '28%', left: '38%', boxShadow: isSelected ? '0 0 4px #f97316' : 'none' }} />
          <div className="absolute w-1 h-1 rounded-full" style={{ background: isSelected ? '#f97316' : 'rgba(249,115,22,0.5)', bottom: '28%', right: '1px', boxShadow: isSelected ? '0 0 4px #f97316' : 'none' }} />
          {/* Content */}
          <div className="flex-1 flex items-center justify-center z-10">
            <div className="w-1/2 aspect-square rounded" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.4)' }} />
          </div>
          <div className="absolute bottom-0.5 left-0.5 right-0.5 h-0.5 sm:h-1 rounded z-10" style={{ background: 'rgba(249,115,22,0.4)' }} />
        </div>
      )}

      {/* Frame 47: Spotlight Stage — dark bg, amber radial spotlight */}
      {layout === "diamond-grid" && (
        <div className="flex flex-col flex-1 rounded overflow-hidden relative" style={{ background: '#0f0f0f' }}>
          {/* Radial spotlight */}
          <div className="absolute inset-0" style={{ background: isSelected ? 'radial-gradient(ellipse at 50% 40%, rgba(245,158,11,0.35) 0%, rgba(245,158,11,0.1) 40%, transparent 70%)' : 'radial-gradient(ellipse at 50% 40%, rgba(245,158,11,0.2) 0%, transparent 60%)' }} />
          {/* Content */}
          <div className="flex-1 flex items-center justify-center z-10">
            <div className="w-3/5 aspect-square rounded-lg" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', boxShadow: isSelected ? '0 4px 16px rgba(245,158,11,0.3)' : '0 2px 8px rgba(245,158,11,0.1)' }} />
          </div>
          <div className="flex gap-0.5 px-0.5 pb-0.5 z-10">
            <div className="h-0.5 sm:h-1 flex-1 rounded" style={{ background: 'rgba(245,158,11,0.4)' }} />
          </div>
          {/* Stage floor reflection */}
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(180deg, transparent, rgba(245,158,11,0.1))' }} />
        </div>
      )}

      {/* Frame 48: True Neon — dark bg, fuchsia+cyan dual neon tubes */}
      {layout === "neon-frame" && (
        <div className="flex flex-col flex-1 rounded overflow-hidden relative" style={{ background: '#1a0a1a' }}>
          {/* Brick texture hint */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px), repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 6px)' }} />
          {/* Fuchsia neon line */}
          <div className="absolute top-1 left-0.5 right-0.5 h-[2px]" style={{ background: '#ff00ff', boxShadow: isSelected ? '0 0 6px #ff00ff, 0 0 12px rgba(255,0,255,0.3)' : '0 0 3px rgba(255,0,255,0.4)' }} />
          {/* Cyan neon line */}
          <div className="absolute bottom-3 left-0.5 right-0.5 h-[2px]" style={{ background: '#00ffff', boxShadow: isSelected ? '0 0 6px #00ffff, 0 0 12px rgba(0,255,255,0.3)' : '0 0 3px rgba(0,255,255,0.4)' }} />
          {/* Content */}
          <div className="flex-1 flex items-center justify-center z-10">
            <div className="w-1/2 aspect-square rounded" style={{ background: 'rgba(255,0,255,0.08)', border: '1px solid rgba(255,0,255,0.3)' }} />
          </div>
          <div className="flex gap-0.5 px-0.5 pb-0.5 z-10">
            <div className="h-0.5 sm:h-1 flex-1 rounded" style={{ background: 'rgba(0,255,255,0.4)' }} />
            <div className="h-0.5 sm:h-1 w-1/4 rounded" style={{ background: isSelected ? '#ff00ff' : 'rgba(255,0,255,0.4)' }} />
          </div>
        </div>
      )}

      {/* Frame 49: Magazine Luxe — light cream bg, serif-style editorial */}
      {layout === "magazine-spread" && (
        <div className="flex flex-col flex-1 rounded overflow-hidden" style={{ background: isSelected ? '#faf5ef' : '#f5f0ea' }}>
          {/* Top rule line */}
          <div style={{ height: '1px', background: isSelected ? '#2d2d2d' : '#999', margin: '2px 3px 0' }} />
          {/* Header area */}
          <div className="flex items-center gap-0.5 px-0.5 pt-0.5">
            <div className="w-1.5 h-1.5 rounded-sm" style={{ background: isSelected ? '#1a1a1a' : '#666' }} />
            <div className="h-0.5 sm:h-1 flex-1 rounded" style={{ background: isSelected ? '#2d2d2d' : '#999' }} />
          </div>
          {/* Content split */}
          <div className="flex flex-1 gap-0.5 p-0.5">
            <div className="w-2/5 flex flex-col gap-0.25 justify-center">
              <div className="h-0.5 rounded" style={{ background: isSelected ? '#555' : '#aaa' }} />
              <div className="h-0.5 rounded" style={{ background: isSelected ? '#555' : '#aaa' }} />
              <div className="h-0.5 rounded w-2/3" style={{ background: isSelected ? '#555' : '#aaa' }} />
              <div className="h-0.5 sm:h-1 w-1/2 rounded" style={{ background: isSelected ? '#c8a97e' : '#bbb' }} />
            </div>
            <div className="w-3/5 rounded" style={{ background: isSelected ? '#e8ddd0' : '#ddd' }} />
          </div>
          {/* Bottom rule */}
          <div style={{ height: '1px', background: isSelected ? '#2d2d2d' : '#999', margin: '0 3px 2px' }} />
        </div>
      )}

      {/* Frame 50: Royal Gold — dark bg, gold borders, ornate accents */}
      {layout === "premium-card" && (
        <div className="flex flex-col flex-1 rounded overflow-hidden relative" style={{ background: '#0d0a05' }}>
          {/* Gold top line */}
          <div style={{ height: '2px', background: isSelected ? 'linear-gradient(90deg, transparent, #d4af37, #ffd700, #d4af37, transparent)' : 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)' }} />
          {/* Ornate corner accents */}
          <div className="absolute top-0.5 left-0.5 w-2 h-2" style={{ borderTop: '1px solid rgba(212,175,55,0.5)', borderLeft: '1px solid rgba(212,175,55,0.5)' }} />
          <div className="absolute bottom-0.5 right-0.5 w-2 h-2" style={{ borderBottom: '1px solid rgba(212,175,55,0.5)', borderRight: '1px solid rgba(212,175,55,0.5)' }} />
          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center gap-0.5 z-10 p-0.5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)' }} />
            <div className="w-3/5 aspect-square rounded" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', boxShadow: isSelected ? '0 0 8px rgba(212,175,55,0.2)' : 'none' }} />
            <div className="h-0.5 sm:h-1 w-3/4 rounded" style={{ background: 'rgba(212,175,55,0.35)' }} />
          </div>
          {/* Gold bottom line */}
          <div style={{ height: '2px', background: isSelected ? 'linear-gradient(90deg, transparent, #d4af37, #ffd700, #d4af37, transparent)' : 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)' }} />
        </div>
      )}

      <div className={`h-0.5 sm:h-1 rounded mt-0.5 sm:mt-1 transition-colors duration-300 ${isSelected ? "bg-orange-400" : "bg-gray-400"}`} />
    </div>
  );
};
