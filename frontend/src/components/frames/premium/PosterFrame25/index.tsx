"use client";
import { Heart } from "lucide-react";
import { usePinchZoom } from "@utilis/usePinchZoom";
import UploadOverlay from "@utilis/UploadOverlay";
import { useVideoControls } from "@utilis/videoControls";
import { PosterFrameProps } from "@app-types/PosterFrameProps";
import React from "react";

// Premium Frame 25: Neon Header Logo — PosterFrame13 structure with unique dark animated neon styling
export const PosterFrame25: React.FC<PosterFrameProps> = (props) => {
    const {
        editMode, frameRef, tempTitle, setTempTitle, tempProductName, handleProductNameChange,
        logoImage, tempLogo, handleLogoChange, logoZoom, setLogoZoom,
        isUploading, uploadPercent, compressionDone, isRecording,
        productImage, tempProduct, handleProductChange, productZoom, setProductZoom,
        setLogoPosition, logoPosition, setProductPosition, productPosition,
        placeholderProduct, productFileType, AutoFitText, isMuted,
        tempPrice, setTempPrice,
    } = props;

    const { ref: logoRef, onTouchStart: onLogoTouchStart, onTouchMove: onLogoTouchMove, onTouchEnd: onLogoTouchEnd } =
        usePinchZoom(setLogoPosition, logoPosition, editMode, logoZoom, setLogoZoom);
    const { ref: productRef, onTouchStart: onProductTouchStart, onTouchMove: onProductTouchMove, onTouchEnd: onProductTouchEnd } =
        usePinchZoom(setProductPosition, productPosition, editMode, productZoom, setProductZoom);
    const { videoRef, isPlaying, togglePlayPause, isVideoFile, showControls, handleVideoTap } =
        useVideoControls(tempProduct || productImage, productFileType);

    return (
        <div className="poster-container p-4">
            <div
                ref={frameRef}
                id="posterFrame"
                data-frame-type="25"
                className="frame text-[11.5px] md:text-[16px] w-[90vw] min-h-[90vw] md:w-[550px] md:min-h-[550px] border-3 flex flex-col relative overflow-hidden"
                style={{
                    background: "linear-gradient(150deg, #06090a 0%, #11161f 42%, #1d1a10 72%, #1e1208 100%)",
                    borderColor: "#a3e635",
                    boxShadow: "0 0 0 1px rgba(163,230,53,0.34), 0 0 22px rgba(56,189,248,0.22), 0 0 34px rgba(250,204,21,0.2)",
                }}
            >
                <div className="absolute inset-0 pointer-events-none neon25-surface" />

                <div
                    className="flex items-center justify-between px-3 py-2 relative z-10"
                    style={{
                        background: "linear-gradient(90deg, rgba(163,230,53,0.92), rgba(56,189,248,0.88), rgba(250,204,21,0.86))",
                        backgroundSize: "220% 220%",
                        animation: "neonShift25 7.4s ease infinite",
                        boxShadow: "0 5px 16px rgba(0,0,0,0.24)",
                    }}
                >
                    <div className="flex-1 text-lg md:text-xl uppercase tracking-wide"
                        style={{ fontFamily: "'Reggae One'", color: "#0f172a", textShadow: "0 0 6px rgba(255,255,255,0.3)" }}>
                        {editMode ? (
                            <input type="text" value={tempTitle} placeholder="Title" onChange={(e) => setTempTitle(e.target.value)}
                                className="w-full text-lg md:text-xl uppercase tracking-wide bg-transparent focus:outline-none border-b border-slate-900/30 placeholder-slate-900/50"
                                style={{ color: "#0f172a" }} />
                        ) : (
                            <span>{tempTitle}</span>
                        )}
                    </div>

                    {(editMode || tempLogo || logoImage) && (
                        <div className={`overflow-hidden rounded-full shadow-md ${editMode ? "border-2 border-lime-400 cursor-pointer" : "border-2 border-slate-900/70"} ${!isRecording ? "w-20 md:w-28 aspect-square" : ""}`}
                            style={isRecording ? { width: "90px", height: "90px" } : { boxShadow: "0 0 14px rgba(56,189,248,0.35)" }}
                            onClick={() => editMode && document.getElementById("logoInput25")?.click()}
                            onTouchStart={editMode && tempLogo ? onLogoTouchStart : undefined}
                            onTouchMove={editMode && tempLogo ? onLogoTouchMove : undefined}
                            onTouchEnd={editMode && tempLogo ? onLogoTouchEnd : undefined}
                            ref={logoRef}>
                            <img src={editMode ? (tempLogo || "/Upload Logo.png") : (logoImage || "/Upload Logo.png")} alt="logo"
                                className="w-full h-full object-contain bg-white transition-transform duration-300"
                                style={{ transform: tempLogo ? `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoZoom})` : "translate(0,0) scale(1)" }} />
                        </div>
                    )}
                </div>

                <div className={`flex-1 relative overflow-hidden z-10 ${editMode ? "border-2 border-sky-300 cursor-pointer" : ""}`}
                    ref={productRef}
                    onTouchStart={editMode && tempProduct !== placeholderProduct ? onProductTouchStart : undefined}
                    onTouchMove={editMode && tempProduct !== placeholderProduct ? onProductTouchMove : undefined}
                    onTouchEnd={editMode && tempProduct !== placeholderProduct ? onProductTouchEnd : undefined}
                    onClick={() => editMode && document.getElementById("productInput25")?.click()}>
                    <img src={editMode ? tempProduct : productImage} alt="bg" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-80" />
                    <UploadOverlay isUploading={isUploading} uploadPercent={uploadPercent} compressionDone={compressionDone} />
                    {isVideoFile(editMode ? tempProduct : productImage, productFileType) ? (
                        <div className="relative w-full h-full group">
                            <video ref={videoRef} src={editMode ? tempProduct : productImage} loop muted={isMuted ?? true} playsInline
                                onClick={!editMode ? handleVideoTap : undefined} onTouchStart={!editMode ? handleVideoTap : undefined}
                                className="relative z-10 w-full h-full object-contain transition-transform duration-300"
                                style={{ transform: tempProduct !== placeholderProduct ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})` : "translate(0,0) scale(1.3)" }} />
                            {(!editMode && (showControls || window.innerWidth >= 768)) && (
                                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 z-50 bg-black/60 px-3 py-2 rounded-md flex items-center gap-3 text-white text-sm transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                    <button onClick={togglePlayPause} className="px-2 py-1 bg-white/20 rounded hover:bg-white/40 transition">{isPlaying ? "⏸ Pause" : "▶️ Play"}</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <img src={editMode ? tempProduct : productImage} alt="Product" className="relative z-10 w-full h-full object-contain transition-transform duration-300"
                            style={{ transform: tempProduct !== placeholderProduct ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})` : "translate(0,0) scale(1.3)" }} />
                    )}
                    {editMode && <input type="file" accept="image/*,video/*" id="productInput25" className="hidden" multiple onChange={handleProductChange} />}

                    {(editMode || (tempPrice && tempPrice.trim() !== "")) && (
                        <div className="absolute top-16 -left-2 z-20 pointer-events-auto"
                            style={{ transform: "rotate(-35deg)", transformOrigin: "left center", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.55))" }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="relative" style={{ width: "176px" }}>
                                <svg viewBox="0 0 200 48" xmlns="http://www.w3.org/2000/svg" width="176">
                                    <polygon points="0,12 14,4 14,44 0,36" fill="#365314" />
                                    <polygon points="200,12 186,4 186,44 200,36" fill="#365314" />
                                    <rect x="14" y="4" width="172" height="40" rx="2" fill="#65a30d" />
                                    <path d="M14,4 Q100,0 186,4 L186,14 Q100,10 14,14 Z" fill="#84cc16" />
                                    <path d="M14,9 Q100,5 186,9" stroke="#eab308" strokeWidth="1" fill="none" opacity="0.92" />
                                    <path d="M14,39 Q100,43 186,39" stroke="#38bdf8" strokeWidth="1" fill="none" opacity="0.92" />
                                    <path d="M14,44 Q100,48 186,44 L186,40 Q100,44 14,40 Z" fill="#3f6212" opacity="0.6" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center pb-0.5">
                                    {editMode ? (
                                        <div className="flex items-center gap-0.5 text-slate-900">
                                            <span className="text-[10px] font-black">₹</span>
                                            <input type="text" value={tempPrice} placeholder="0"
                                                onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (val.length <= 7) setTempPrice(val); }}
                                                maxLength={7}
                                                className="w-16 md:w-[4.25rem] text-[10px] font-black bg-transparent border-b border-slate-900/50 focus:outline-none text-center text-slate-900 placeholder-slate-900/50" />
                                            <span className="text-[10px] font-black">/-</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-900 text-[10px] md:text-[11px] font-black whitespace-nowrap"
                                            style={{ fontFamily: "'Reggae One'", textShadow: "0 1px 3px rgba(255,255,255,0.45)" }}>
                                            ₹{Number(tempPrice).toLocaleString("en-IN")}/-
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`px-4 py-2 text-center font-bold relative z-10 text-lime-300`}>
                    {editMode ? (
                        <input type="text" placeholder="Product Name" value={tempProductName} onChange={handleProductNameChange}
                            className={`w-full border-2 border-lime-300 rounded px-2 py-1 text-sm text-center placeholder-lime-200 text-lime-300`} />
                    ) : (<AutoFitText text={tempProductName} />)}
                </div>

                <div className="footer relative z-10 text-white text-center py-2 flex items-center justify-center gap-2 tracking-wide"
                    style={{
                        fontFamily: "'Reggae One'",
                        background: "linear-gradient(90deg, rgba(163,230,53,0.92), rgba(56,189,248,0.9), rgba(250,204,21,0.88))",
                        backgroundSize: "220% 220%",
                        animation: "neonShift25 7.4s ease infinite",
                        boxShadow: "0 -6px 20px rgba(163,230,53,0.28)",
                    }}>
                    <span className="text-sm md:text-base font-semibold">Design via <span className="decoration-white">reNote</span> with</span>
                    <Heart className="w-4 h-4 fill-current heart-beat text-white" />
                    <span className="text-sm md:text-base font-semibold">from Krishub</span>
                </div>

                {editMode && <input type="file" accept="image/*" id="logoInput25" className="hidden" onChange={handleLogoChange} />}

                <style jsx>{`
                    .neon25-surface {
                        background:
                            radial-gradient(circle at 16% 20%, rgba(163, 230, 53, 0.2), transparent 42%),
                            radial-gradient(circle at 84% 24%, rgba(56, 189, 248, 0.18), transparent 40%),
                            radial-gradient(circle at 52% 84%, rgba(250, 204, 21, 0.16), transparent 46%);
                        mix-blend-mode: screen;
                        animation: neonPulse25 6.9s ease-in-out infinite;
                    }

                    @keyframes neonShift25 {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }

                    @keyframes neonPulse25 {
                        0%, 100% {
                            opacity: 0.74;
                            filter: saturate(1) hue-rotate(0deg);
                        }
                        50% {
                            opacity: 1;
                            filter: saturate(1.22) hue-rotate(-6deg);
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};
