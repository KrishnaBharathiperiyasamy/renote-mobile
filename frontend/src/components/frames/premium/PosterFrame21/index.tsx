"use client";
import { Heart } from "lucide-react";
import { usePinchZoom } from "@utilis/usePinchZoom";
import UploadOverlay from "@utilis/UploadOverlay";
import { useVideoControls } from "@utilis/videoControls";
import { PosterFrameProps } from "@app-types/PosterFrameProps";
import React from "react";

// Premium Frame 21: Neon Minimal — PosterFrame7 structure with unique animated neon skin
export const PosterFrame21: React.FC<PosterFrameProps> = (props) => {
    const {
        editMode, frameRef, tempTitle, setTempTitle, tempProductName, handleProductNameChange,
        isUploading, uploadPercent, compressionDone, isRecording,
        productImage, tempProduct, handleProductChange, productZoom, setProductZoom,
        setProductPosition, productPosition, placeholderProduct, productFileType,
        tempPrice, setTempPrice, AutoFitText,
    } = props;
    const isMuted = props.isMuted;

    const { ref: productRef, onTouchStart: onProductTouchStart, onTouchMove: onProductTouchMove, onTouchEnd: onProductTouchEnd } =
        usePinchZoom(setProductPosition, productPosition, editMode, productZoom, setProductZoom);
    const { videoRef, isPlaying, togglePlayPause, isVideoFile, showControls, handleVideoTap } =
        useVideoControls(tempProduct || productImage, productFileType);

    return (
        <div className="poster-container p-4">
            <div
                ref={frameRef}
                id="posterFrame"
                data-frame-type="21"
                className="frame text-[11.5px] md:text-[16px] w-[90vw] min-h-[90vw] md:w-[550px] md:min-h-[550px] border-3 flex flex-col relative overflow-hidden"
                style={{
                    background: "linear-gradient(145deg, #06090f 0%, #120826 42%, #0b2430 78%, #0b1a14 100%)",
                    borderColor: "#22d3ee",
                    boxShadow: "0 0 0 1px rgba(34,211,238,0.38), 0 0 22px rgba(244,114,182,0.25), 0 0 34px rgba(163,230,53,0.22)",
                }}
            >
                <div className="absolute inset-0 pointer-events-none neon21-surface" />

                <div className="title relative z-10 text-center p-[10px] text-xl md:text-2xl tracking-wide uppercase"
                    style={{ fontFamily: "'Reggae One'", color: "#67e8f9", textShadow: "0 0 9px rgba(34,211,238,0.8), 0 0 18px rgba(244,114,182,0.45)" }}>
                    {editMode ? (
                        <input type="text" value={tempTitle} placeholder="Poster Title" onChange={(e) => setTempTitle(e.target.value)}
                            className="w-full text-center text-xl md:text-2xl tracking-wide uppercase border-b-2 border-cyan-300 bg-transparent focus:outline-none px-1 py-0.5 placeholder-cyan-200 placeholder-opacity-70"
                            style={{ color: "#67e8f9" }} />
                    ) : (
                        <span className="underline underline-offset-4" style={{ textDecorationColor: "#22d3ee" }}>{tempTitle}</span>
                    )}
                </div>

                <div className="relative flex-1 overflow-hidden z-10">
                    <div className={`image-container w-full h-full relative overflow-hidden ${editMode ? "border-2 border-cyan-300 p-1 cursor-pointer" : ""}`}
                        ref={productRef}
                        onTouchStart={editMode && tempProduct !== placeholderProduct ? onProductTouchStart : undefined}
                        onTouchMove={editMode && tempProduct !== placeholderProduct ? onProductTouchMove : undefined}
                        onTouchEnd={editMode && tempProduct !== placeholderProduct ? onProductTouchEnd : undefined}
                        onClick={() => editMode && document.getElementById("productInput21")?.click()}>
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
                        {editMode && <input type="file" accept="image/*,video/*" id="productInput21" className="hidden" multiple onChange={handleProductChange} />}
                    </div>

                    {editMode ? (
                        <div className="absolute bottom-3 right-3 z-20 rounded-full px-3 py-1.5"
                            style={{ background: "linear-gradient(90deg, rgba(34,211,238,0.35), rgba(244,114,182,0.35))", boxShadow: "0 0 12px rgba(34,211,238,0.45)" }}>
                            <div className="flex items-center gap-1" style={{ color: "#bef264" }}>
                                <span className="text-xs font-bold">₹</span>
                                <input type="text" value={tempPrice} placeholder="Price"
                                    onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (val.length <= 7) setTempPrice(val); }}
                                    maxLength={7} className="w-14 text-xs font-semibold bg-transparent border-b border-lime-300/60 focus:outline-none text-center"
                                    style={{ color: "#bef264" }} />
                                <span className="text-xs">/-</span>
                            </div>
                        </div>
                    ) : (tempPrice && tempPrice.trim() !== "" && (
                        <div className="absolute bottom-3 right-3 z-20 rounded-full px-4 py-2"
                            style={{ background: "linear-gradient(90deg, rgba(34,211,238,0.3), rgba(244,114,182,0.3))", boxShadow: "0 0 14px rgba(163,230,53,0.35)" }}>
                            <span className="font-bold text-sm md:text-base" style={{ color: "#bef264", fontSize: isRecording ? "18px" : undefined, textShadow: "0 0 8px rgba(190,242,100,0.55)" }}>
                                ₹ {Number(tempPrice).toLocaleString("en-IN")}/-
                            </span>
                        </div>
                    ))}
                </div>

                <div className="px-3 py-2 text-center z-10">
                    <div className={`font-bold text-fuchsia-300`}>
                        {editMode ? (
                            <input type="text" placeholder="Product Name" value={tempProductName} onChange={handleProductNameChange}
                                className={`w-full border-2 border-fuchsia-300 rounded px-2 py-1 text-sm text-center placeholder-fuchsia-200 text-fuchsia-300`} />
                        ) : (<AutoFitText text={tempProductName} />)}
                    </div>
                </div>

                <div className="footer relative z-10 text-white text-center py-2 flex items-center justify-center gap-2 tracking-wide"
                    style={{
                        fontFamily: "'Reggae One'",
                        background: "linear-gradient(90deg, rgba(34,211,238,0.9), rgba(244,114,182,0.9), rgba(163,230,53,0.9))",
                        backgroundSize: "220% 220%",
                        animation: "neonShift21 7.2s ease infinite",
                        boxShadow: "0 -6px 20px rgba(34,211,238,0.3)",
                    }}>
                    <span className="text-sm md:text-base font-semibold">Design via <span className="decoration-white">reNote</span> with</span>
                    <Heart className="w-4 h-4 fill-current heart-beat text-white" />
                    <span className="text-sm md:text-base font-semibold">from Krishub</span>
                </div>

                <style jsx>{`
                    .neon21-surface {
                        background:
                            radial-gradient(circle at 12% 20%, rgba(34, 211, 238, 0.22), transparent 40%),
                            radial-gradient(circle at 86% 26%, rgba(244, 114, 182, 0.2), transparent 42%),
                            radial-gradient(circle at 58% 84%, rgba(163, 230, 53, 0.18), transparent 44%);
                        mix-blend-mode: screen;
                        animation: neonPulse21 6s ease-in-out infinite;
                    }

                    @keyframes neonShift21 {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }

                    @keyframes neonPulse21 {
                        0%, 100% {
                            opacity: 0.74;
                            filter: saturate(1) hue-rotate(0deg);
                        }
                        50% {
                            opacity: 1;
                            filter: saturate(1.24) hue-rotate(12deg);
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};
