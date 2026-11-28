"use client";
import { Heart } from "lucide-react";
import { usePinchZoom } from "@utilis/usePinchZoom";
import UploadOverlay from "@utilis/UploadOverlay";
import { useVideoControls } from "@utilis/videoControls";
import { PosterFrameProps } from "@app-types/PosterFrameProps";
import React from "react";

// Frame 33: Header Logo — logo centered in thick header bar, product below, name at bottom, no desc no price
export const PosterFrame13: React.FC<PosterFrameProps> = (props) => {
    const {
        editMode, frameRef, tempTitle, setTempTitle, tempProductName, handleProductNameChange,
        logoImage, tempLogo, handleLogoChange, logoZoom, setLogoZoom,
        isUploading, uploadPercent, compressionDone, isRecording,
        productImage, tempProduct, handleProductChange, productZoom, setProductZoom,
        setLogoPosition, logoPosition, setProductPosition, productPosition,
        placeholderProduct, productFileType, AutoFitText, theme, isMuted,
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
            <div ref={frameRef} id="posterFrame" data-frame-type="33"
                className={`frame text-[11.5px] md:text-[16px] w-[90vw] min-h-[90vw] md:w-[550px] md:min-h-[550px] border-3 flex flex-col ${theme.border}`}
                style={{ background: theme.gradient }}>

                {/* Thick header bar with logo */}
                <div className={`${theme.primary} flex items-center justify-between px-3 py-2`}>
                    {/* Title left */}
                    <div className="flex-1 text-white text-lg md:text-xl uppercase tracking-wide"
                        style={{ fontFamily: "'Reggae One'", textShadow: "1px 0 currentColor, -1px 0 currentColor" }}>
                        {editMode ? (
                            <input type="text" value={tempTitle} placeholder="Title" onChange={(e) => setTempTitle(e.target.value)}
                                className="w-full text-white text-lg md:text-xl uppercase tracking-wide bg-transparent focus:outline-none border-b border-white/40 placeholder-white/50" />
                        ) : (
                            <span>{tempTitle}</span>
                        )}
                    </div>

                    {/* Logo center-right */}
                    {(editMode || tempLogo || logoImage) && (
                        <div className={`overflow-hidden rounded-full shadow-md ${editMode ? "border-2 border-blue-500 cursor-pointer" : "border-2 border-white"} ${!isRecording ? "w-20 md:w-28 aspect-square" : ""}`}
                            style={isRecording ? { width: "90px", height: "90px" } : {}}
                            onClick={() => editMode && document.getElementById("logoInput33")?.click()}
                            onTouchStart={editMode && tempLogo ? onLogoTouchStart : undefined}
                            onTouchMove={editMode && tempLogo ? onLogoTouchMove : undefined}
                            onTouchEnd={editMode && tempLogo ? onLogoTouchEnd : undefined}
                            ref={logoRef}>
                            <img src={editMode ? (tempLogo || "/Upload Logo.png") : logoImage!} alt="logo"
                                className="w-full h-full object-contain bg-white transition-transform duration-300"
                                style={{ transform: tempLogo ? `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoZoom})` : "translate(0,0) scale(1)" }} />
                        </div>
                    )}
                </div>

                {/* Product image */}
                <div className={`flex-1 relative overflow-hidden ${editMode ? "border-2 border-blue-500 cursor-pointer" : ""}`}
                    ref={productRef}
                    onTouchStart={editMode && tempProduct !== placeholderProduct ? onProductTouchStart : undefined}
                    onTouchMove={editMode && tempProduct !== placeholderProduct ? onProductTouchMove : undefined}
                    onTouchEnd={editMode && tempProduct !== placeholderProduct ? onProductTouchEnd : undefined}
                    onClick={() => editMode && document.getElementById("productInput33")?.click()}>
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
                            style={{ transform: tempProduct !== placeholderProduct ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})` : "translate(0,0) scale(1.3)", filter: tempProduct === placeholderProduct && theme.text === "text-white" ? "invert(1) brightness(0.85)" : "none" }} />
                    )}
                    {editMode && <input type="file" accept="image/*,video/*" id="productInput33" className="hidden" multiple onChange={handleProductChange} />}
                    {/* Price ribbon — top-left diagonal */}
                    {(editMode || (tempPrice && tempPrice.trim() !== "")) && (
                        <div className="absolute top-16 -left-2 z-20 pointer-events-auto"
                            style={{ transform: "rotate(-35deg)", transformOrigin: "left center", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.5))" }}
                            onClick={(e) => e.stopPropagation()}>
                            <div className="relative" style={{ width: "176px" }}>
                                <svg viewBox="0 0 200 48" xmlns="http://www.w3.org/2000/svg" width="176">
                                    {/* Left tail */}
                                    <polygon points="0,12 14,4 14,44 0,36" fill="#8b0000" />
                                    {/* Right tail */}
                                    <polygon points="200,12 186,4 186,44 200,36" fill="#8b0000" />
                                    {/* Main body */}
                                    <rect x="14" y="4" width="172" height="40" rx="2" fill="#cc0000" />
                                    {/* Top highlight */}
                                    <path d="M14,4 Q100,0 186,4 L186,14 Q100,10 14,14 Z" fill="#e83030" />
                                    {/* Gold top trim */}
                                    <path d="M14,9 Q100,5 186,9" stroke="#fbbf24" strokeWidth="1" fill="none" opacity="0.9" />
                                    {/* Gold bottom trim */}
                                    <path d="M14,39 Q100,43 186,39" stroke="#fbbf24" strokeWidth="1" fill="none" opacity="0.9" />
                                    {/* Bottom shadow */}
                                    <path d="M14,44 Q100,48 186,44 L186,40 Q100,44 14,40 Z" fill="#7a0000" opacity="0.6" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center pb-0.5">
                                    {editMode ? (
                                        <div className="flex items-center gap-0.5 text-white">
                                            <span className="text-[10px] font-black">₹</span>
                                            <input type="text" value={tempPrice} placeholder="0"
                                                onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (val.length <= 7) setTempPrice(val); }}
                                                maxLength={7}
                                                className="w-16 md:w-[4.25rem] text-[10px] font-black bg-transparent border-b border-white/60 focus:outline-none text-center text-white placeholder-white/50" />
                                            <span className="text-[10px] font-black">/-</span>
                                        </div>
                                    ) : (
                                        <span className="text-white text-[10px] md:text-[11px] font-black whitespace-nowrap"
                                            style={{ fontFamily: "'Reggae One'", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                                            ₹{Number(tempPrice).toLocaleString("en-IN")}/-
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Product name */}
                <div className={`px-4 py-2 text-center font-bold ${theme.accent}`}>
                    {editMode ? (
                        <input type="text" placeholder="Product Name" value={tempProductName} onChange={handleProductNameChange}
                            className={`w-full border-2 border-blue-500 rounded px-2 py-1 text-sm text-center placeholder-gray-400 ${theme.accent}`} />
                    ) : (<AutoFitText text={tempProductName} />)}
                </div>

                {/* Footer */}
                <div className={`footer ${theme.primary} text-white text-center py-2 flex items-center justify-center gap-2 tracking-wide`} style={{ fontFamily: "'Reggae One'" }}>
                    <span className="text-sm md:text-base font-semibold">Design via <span className="decoration-white">reNote</span> with</span>
                    <Heart className={`w-4 h-4 fill-current heart-beat ${/red|rose|pink/.test(theme.primary) ? "text-white" : "text-red-500"}`} />
                    <span className="text-sm md:text-base font-semibold">from Krishub</span>
                </div>

                {editMode && <input type="file" accept="image/*" id="logoInput33" className="hidden" onChange={handleLogoChange} />}
            </div>
        </div>
    );
};
