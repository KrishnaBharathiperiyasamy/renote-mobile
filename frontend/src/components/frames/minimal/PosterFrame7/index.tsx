"use client";
import { Heart } from "lucide-react";
import { usePinchZoom } from "@utilis/usePinchZoom";
import UploadOverlay from "@utilis/UploadOverlay";
import { useVideoControls } from "@utilis/videoControls";
import { PosterFrameProps } from "@app-types/PosterFrameProps";
import React from "react";

// Frame 11: Minimal Clean — full-bleed product, floating price badge, no logo, no description
export const PosterFrame7: React.FC<PosterFrameProps> = (props) => {
    const {
        editMode, frameRef, tempTitle, setTempTitle, tempProductName, handleProductNameChange,
        isUploading, uploadPercent, compressionDone, isRecording,
        productImage, tempProduct, handleProductChange, productZoom, setProductZoom,
        setProductPosition, productPosition, placeholderProduct, productFileType,
        tempPrice, setTempPrice, AutoFitText, theme, isMuted,
    } = props;

    const { ref: productRef, onTouchStart: onProductTouchStart, onTouchMove: onProductTouchMove, onTouchEnd: onProductTouchEnd } =
        usePinchZoom(setProductPosition, productPosition, editMode, productZoom, setProductZoom);
    const { videoRef, isPlaying, togglePlayPause, isVideoFile, showControls, handleVideoTap } =
        useVideoControls(tempProduct || productImage, productFileType);

    return (
        <div className="poster-container p-4">
            <div ref={frameRef} id="posterFrame" data-frame-type="11"
                className={`frame text-[11.5px] md:text-[16px] w-[90vw] min-h-[90vw] md:w-[550px] md:min-h-[550px] border-3 flex flex-col ${theme.border}`}
                style={{ background: theme.gradient }}>

                {/* Title */}
                <div className={`title text-center p-[10px] ${theme.accent} text-xl md:text-2xl tracking-wide uppercase`}
                    style={{ fontFamily: "'Reggae One'", textShadow: "1px 0 currentColor, -1px 0 currentColor" }}>
                    {editMode ? (
                        <input type="text" value={tempTitle} placeholder="Poster Title" onChange={(e) => setTempTitle(e.target.value)}
                            className={`w-full text-center ${theme.accent} text-xl md:text-2xl tracking-wide uppercase border-b-2 border-pink bg-transparent focus:outline-none px-1 py-0.5 placeholder-pink-400 placeholder-opacity-60`} />
                    ) : (
                        <span className={`underline ${theme.accent.replace('text-', 'decoration-')} underline-offset-4`}>{tempTitle}</span>
                    )}
                </div>

                {/* Full-bleed product with floating price badge */}
                <div className="relative flex-1 overflow-hidden">
                    <div className={`image-container w-full h-full relative overflow-hidden ${editMode ? "border-2 border-blue-500 p-1 cursor-pointer" : ""}`}
                        ref={productRef}
                        onTouchStart={editMode && tempProduct !== placeholderProduct ? onProductTouchStart : undefined}
                        onTouchMove={editMode && tempProduct !== placeholderProduct ? onProductTouchMove : undefined}
                        onTouchEnd={editMode && tempProduct !== placeholderProduct ? onProductTouchEnd : undefined}
                        onClick={() => editMode && document.getElementById("productInput11")?.click()}>
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
                        {editMode && <input type="file" accept="image/*,video/*" id="productInput11" className="hidden" multiple onChange={handleProductChange} />}
                    </div>

                    {/* Floating price badge */}
                    {editMode ? (
                        <div className="absolute bottom-3 right-3 z-20 bg-black/70 rounded-full px-3 py-1.5">
                            <div className={`flex items-center gap-1 text-white`}>
                                <span className="text-xs font-bold">₹</span>
                                <input type="text" value={tempPrice} placeholder="Price"
                                    onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (val.length <= 7) setTempPrice(val); }}
                                    maxLength={7} className="w-14 text-xs font-semibold bg-transparent border-b border-white/50 focus:outline-none text-center text-white" />
                                <span className="text-xs">/-</span>
                            </div>
                        </div>
                    ) : (tempPrice && tempPrice.trim() !== "" && (
                        <div className="absolute bottom-3 right-3 z-20 bg-black/70 rounded-full px-4 py-2">
                            <span className="text-white font-bold text-sm md:text-base" style={{ fontSize: isRecording ? "18px" : undefined }}>
                                ₹ {Number(tempPrice).toLocaleString("en-IN")}/-
                            </span>
                        </div>
                    ))}
                </div>

                {/* Product name */}
                <div className="px-3 py-2 text-center">
                    <div className={`font-bold ${theme.accent}`}>
                        {editMode ? (
                            <input type="text" placeholder="Product Name" value={tempProductName} onChange={handleProductNameChange}
                                className={`w-full border-2 border-blue-500 rounded px-2 py-1 text-sm text-center placeholder-gray-400 ${theme.accent}`} />
                        ) : (<AutoFitText text={tempProductName} />)}
                    </div>
                </div>

                {/* Footer */}
                <div className={`footer ${theme.primary} text-white text-center py-2 flex items-center justify-center gap-2 tracking-wide`} style={{ fontFamily: "'Reggae One'" }}>
                    <span className="text-sm md:text-base font-semibold">Design via <span className="decoration-white">reNote</span> with</span>
                    <Heart className={`w-4 h-4 fill-current heart-beat ${/red|rose|pink/.test(theme.primary) ? "text-white" : "text-red-500"}`} />
                    <span className="text-sm md:text-base font-semibold">from Krishub</span>
                </div>
            </div>
        </div>
    );
};
