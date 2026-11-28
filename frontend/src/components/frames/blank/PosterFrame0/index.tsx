"use client";
import { Heart } from "lucide-react";
import UploadOverlay from "@utilis/UploadOverlay";
import { usePinchZoom } from "@utilis/usePinchZoom";
import { useVideoControls } from "@utilis/videoControls";
import { PosterFrameProps } from "@app-types/PosterFrameProps";
import React from "react";

export const PosterFrame0: React.FC<PosterFrameProps> = ({
    editMode,
    frameRef,
    tempTitle,
    setTempTitle,
    tempProductName,
    handleProductNameChange,
    isUploading,
    isRecording,
    uploadPercent,
    compressionDone,
    productImage,
    tempProduct,
    handleProductChange,
    productZoom,
    setProductZoom,
    setProductPosition,
    productPosition,
    placeholderProduct,
    productFileType,
    theme,
    isMuted,
}) => {
    const {
        ref: productRef,
        onTouchStart: onProductTouchStart,
        onTouchMove: onProductTouchMove,
        onTouchEnd: onProductTouchEnd,
    } = usePinchZoom(setProductPosition, productPosition, editMode, productZoom, setProductZoom);

    const { videoRef, isPlaying, togglePlayPause, isVideoFile, showControls, handleVideoTap } =
        useVideoControls(tempProduct || productImage, productFileType);

    return (
        <div id="posterFrame" className="poster-container p-[15px]">
            {/* Frame */}
            <div
                ref={frameRef}
                className={`frame text-[11.5px] md:text-[16px] w-[90vw] min-h-[90vw]
                    md:w-[550px] md:min-h-[550px] border-3 flex flex-col ${theme.border}`}
                style={{ background: theme.gradient }}
            >
                {/* Title & Product Name — always visible */}
                <div className="p-[10px] pb-1">
                    {editMode ? (
                        <input
                            type="text"
                            value={tempTitle}
                            placeholder="Poster Title *"
                            onChange={(e) => setTempTitle(e.target.value)}
                            className="w-full text-center text-xl md:text-2xl tracking-wide uppercase border-2 border-blue-500 bg-white rounded px-2 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                            style={{ fontFamily: "'Reggae One'" }}
                        />
                    ) : (
                        <div
                            className={`text-center ${theme.accent} text-xl md:text-2xl tracking-wide uppercase`}
                            style={{ fontFamily: "'Reggae One'", textShadow: "1px 0 currentColor, -1px 0 currentColor" }}
                        >
                            <span className={`underline ${theme.accent.replace('text-', 'decoration-')} underline-offset-4`}>
                                {tempTitle || "\u00A0"}
                            </span>
                        </div>
                    )}
                </div>

                <div className="px-[10px] pb-2">
                    {editMode ? (
                        <input
                            type="text"
                            value={tempProductName}
                            placeholder="Product Name *"
                            onChange={(e) => {
                                if (e.target.value.length <= 22) handleProductNameChange(e);
                            }}
                            maxLength={22}
                            className={`w-full text-center text-sm md:text-base font-bold border-2 border-blue-500 bg-white rounded px-2 py-1.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 ${theme.accent}`}
                        />
                    ) : (
                        <div className={`font-bold text-center ${theme.accent}`}>
                            <span className="text-sm md:text-base">{tempProductName || "\u00A0"}</span>
                        </div>
                    )}
                </div>

                {/* Full-frame media area */}
                <div
                    className={`relative flex-1 overflow-hidden ${editMode ? "border-2 border-blue-500 cursor-pointer" : ""}`}
                    onClick={() => editMode && document.getElementById("productInput0")?.click()}
                    onTouchStart={editMode && tempProduct !== placeholderProduct ? onProductTouchStart : undefined}
                    onTouchMove={editMode && tempProduct !== placeholderProduct ? onProductTouchMove : undefined}
                    onTouchEnd={editMode && tempProduct !== placeholderProduct ? onProductTouchEnd : undefined}
                    ref={productRef}
                >

                {/* Blurred Background */}
                    <img
                        src={editMode ? tempProduct : productImage}
                        alt="Blurred Background"
                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-80"
                    />

                    <UploadOverlay isUploading={isUploading} uploadPercent={uploadPercent} compressionDone={compressionDone} />

                    {isVideoFile(editMode ? tempProduct : productImage, productFileType) ? (
                        <div className="relative w-full h-full group">
                            <video
                                ref={videoRef}
                                src={editMode ? tempProduct : productImage}
                                loop
                                muted={isMuted ?? true}
                                playsInline
                                onClick={!editMode ? handleVideoTap : undefined}
                                onTouchStart={!editMode ? handleVideoTap : undefined}
                                className={`relative z-10 w-full h-full object-contain transition-all duration-300 ${!isPlaying ? "pausedVideo" : ""}`}
                                style={{
                                    transform:
                                        tempProduct !== placeholderProduct
                                            ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})`
                                            : "scale(1)",
                                }}
                            />
                            {(!editMode && (showControls || window.innerWidth >= 768)) && (
                                <div
                                    className={`absolute inset-0 flex items-center justify-center z-20
                                        bg-black/50 rounded-md text-white text-sm
                                        opacity-0 group-hover:opacity-100
                                        transition-opacity duration-300
                                        ${showControls ? "opacity-100" : ""}`}
                                >
                                    <button
                                        onClick={togglePlayPause}
                                        className="px-4 py-2 bg-white/20 rounded-full hover:bg-white/40 transition"
                                    >
                                        {isPlaying ? "⏸ Pause" : "▶️ Play"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <img
                            src={editMode ? tempProduct : productImage}
                            alt="Poster Media"
                            className="relative z-10 w-full h-full object-contain transition-transform duration-300"
                            style={{
                                transform:
                                    tempProduct !== placeholderProduct
                                        ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})`
                                        : "scale(1)",
                                filter: tempProduct === placeholderProduct && theme.text === "text-white" ? "invert(1) brightness(0.85)" : "none",
                            }}
                        />
                    )}

                    {editMode && (
                        <input
                            type="file"
                            accept="image/*,video/*"
                            id="productInput0"
                            className="hidden"
                            multiple
                            onChange={handleProductChange}
                        />
                    )}
                </div>

                {/* Footer */}
                <div
                    className={`footer ${theme.primary} text-white text-center py-2 flex items-center justify-center gap-2 tracking-wide`}
                    style={{ fontFamily: "'Reggae One'" }}
                >
                    <span className="text-sm md:text-base font-semibold">
                        Design via <span className="decoration-white">reNote</span> with
                    </span>
                    <Heart className={`w-4 h-4 fill-current heart-beat ${/red|rose|pink/.test(theme.primary) ? "text-white" : "text-red-500"}`} />
                    <span className="text-sm md:text-base font-semibold">from Krishub</span>
                </div>
            </div>
        </div>
    );
};
