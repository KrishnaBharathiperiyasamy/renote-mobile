"use client";
import { Heart, Sparkles, Star, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { EditorProvider, Editor, BtnBold, BtnItalic, BtnUnderline, BtnBulletList } from "react-simple-wysiwyg";
import { ToolbarIconButton } from "@components/Button";
import { usePinchZoom } from "@utilis/usePinchZoom";
import UploadOverlay from "@utilis/UploadOverlay";
import { useVideoControls } from "@utilis/videoControls";
import { PosterFrameProps } from "@app-types/PosterFrameProps";
import React from "react";
import { createPortal } from "react-dom";
// Premium Neon Spotlight — based on template 11 with unique premium neon treatment
export const PosterFrame26: React.FC<PosterFrameProps> = (props) => {
    const {
        editMode, activeEditor, toolbarRef, frameRef, textContainerRef, editorRef,
        tempTitle, setTempTitle, tempProductName, handleProductNameChange,
        productSpecs, setProductSpecs, setActiveEditor, tempPrice, setTempPrice,
        isUploading, uploadPercent, compressionDone, isRecording,
        logoImage, tempLogo, handleLogoChange, logoZoom, setLogoZoom,
        setLogoPosition, logoPosition,
        productImage, tempProduct, handleProductChange, productZoom, setProductZoom,
        setProductPosition, productPosition, placeholderProduct, productFileType,
        AutoFitText, theme, isMuted,
    } = props;

    const { ref: logoRef, onTouchStart: onLogoTouchStart, onTouchMove: onLogoTouchMove, onTouchEnd: onLogoTouchEnd } =
        usePinchZoom(setLogoPosition, logoPosition, editMode, logoZoom, setLogoZoom);
    const { ref: productRef, onTouchStart: onProductTouchStart, onTouchMove: onProductTouchMove, onTouchEnd: onProductTouchEnd } =
        usePinchZoom(setProductPosition, productPosition, editMode, productZoom, setProductZoom);
    const { videoRef, isPlaying, togglePlayPause, isVideoFile, showControls, handleVideoTap } =
        useVideoControls(tempProduct || productImage, productFileType);

    const imgSrc = editMode ? tempProduct : productImage;
    const bannerBgClass = theme.border?.includes("border-")
        ? theme.border.replace(/border-/g, "bg-")
        : "bg-cyan-500";

    return (
        <div className="poster-container p-4">
            <EditorProvider>
                {activeEditor === "productSpecs" && editMode && typeof document !== "undefined" && createPortal(
                    <div ref={toolbarRef} className="fixed left-0 right-0 bottom-0 flex items-center bg-white border-t border-gray-200 px-3 h-12 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] z-[999]">
                        <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); props.onEmojiOpen?.(); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-xl leading-none select-none">😊</button>
                        <div className="w-px h-6 bg-gray-200 mx-2" />
                        <div className="flex items-center gap-0.5">
                            <div className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><BtnBold className="w-4 h-4" /></div>
                            <div className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><BtnItalic className="w-4 h-4" /></div>
                            <div className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><BtnUnderline className="w-4 h-4" /></div>
                            <div className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><BtnBulletList className="w-4 h-4" /></div>
                        </div>
                        <div className="w-px h-6 bg-gray-200 mx-2" />
                        <div className="flex items-center gap-0.5">
                            <ToolbarIconButton Cmd="justifyLeft" Icon={AlignLeft} />
                            <ToolbarIconButton Cmd="justifyCenter" Icon={AlignCenter} />
                            <ToolbarIconButton Cmd="justifyRight" Icon={AlignRight} />
                            <ToolbarIconButton Cmd="justifyFull" Icon={AlignJustify} />
                        </div>
                    </div>
                , document.body)}

                <div
                    ref={frameRef}
                    id="posterFrame"
                    data-frame-type="26"
                    className="frame relative overflow-hidden text-[11.5px] md:text-[16px] w-[90vw] min-h-[90vw] md:w-[550px] md:min-h-[550px] border-3 flex flex-col"
                    style={{
                        background:
                            "radial-gradient(circle at 18% 18%, rgba(34,211,238,0.22), transparent 38%), radial-gradient(circle at 82% 24%, rgba(236,72,153,0.20), transparent 42%), radial-gradient(circle at 50% 84%, rgba(168,85,247,0.24), transparent 46%), linear-gradient(145deg, #060914 0%, #0f1329 45%, #1d0f2d 100%)",
                        borderColor: "#2dd4bf",
                        boxShadow: "0 0 0 1px rgba(45,212,191,0.35), 0 0 24px rgba(14,165,233,0.35), 0 0 44px rgba(249,115,22,0.25)",
                    }}
                >
                    {/* Neon rays */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 text-cyan-300 opacity-[0.22]"
                        style={{
                            background:
                                "repeating-conic-gradient(from 0deg at 50% 42%, currentColor 0deg 5deg, transparent 5deg 20deg)",
                            maskImage: "radial-gradient(circle at 50% 42%, black 34%, transparent 72%)",
                            WebkitMaskImage: "radial-gradient(circle at 50% 42%, black 34%, transparent 72%)",
                        }}
                    />

                    <Sparkles className="absolute top-3 left-3 w-5 h-5 text-cyan-300 opacity-80" />
                    <Star className="absolute top-4 right-4 w-4 h-4 text-fuchsia-300 opacity-75 fill-current" />
                    <Star className="absolute bottom-28 left-5 w-3 h-3 text-violet-300 opacity-70 fill-current" />
                    <Sparkles className="absolute bottom-32 right-6 w-4 h-4 text-emerald-300 opacity-70" />

                    {/* Title */}
                    <div
                        className="title relative z-10 text-center px-4 pt-3 pb-2 text-cyan-200 text-xl md:text-2xl tracking-wide uppercase"
                        style={{ fontFamily: "'Reggae One'", textShadow: "0 0 10px rgba(34,211,238,0.45), 1px 0 currentColor, -1px 0 currentColor" }}
                    >
                        {editMode ? (
                            <input
                                type="text"
                                value={tempTitle}
                                placeholder="Poster Title"
                                onChange={(e) => setTempTitle(e.target.value)}
                                className="w-full text-center text-cyan-200 text-xl md:text-2xl tracking-wide uppercase border-b-2 border-cyan-300/70 bg-transparent focus:outline-none px-1 py-0.5 placeholder-cyan-200/40"
                            />
                        ) : (
                            <span className="underline decoration-cyan-300 underline-offset-4">{tempTitle}</span>
                        )}
                    </div>

                    {/* Product spotlight */}
                    <div className="relative z-10 flex-1 flex items-center justify-center px-3 py-1 min-h-0">
                        <div className="relative h-full w-full max-w-md mr-4 md:mr-6">
                            <div aria-hidden className="absolute -inset-3 bg-cyan-500/20 blur-2xl" />

                            <div
                                ref={productRef}
                                onTouchStart={editMode && tempProduct !== placeholderProduct ? onProductTouchStart : undefined}
                                onTouchMove={editMode && tempProduct !== placeholderProduct ? onProductTouchMove : undefined}
                                onTouchEnd={editMode && tempProduct !== placeholderProduct ? onProductTouchEnd : undefined}
                                onClick={() => editMode && document.getElementById("productInput26")?.click()}
                                className={`relative w-full h-full overflow-hidden rounded-xl ${editMode ? "border-2 border-blue-500 cursor-pointer" : "border border-cyan-300/40 shadow-[0_0_20px_rgba(34,211,238,0.25)]"}`}
                            >
                                <img src={imgSrc} alt="bg" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-80" />
                                <UploadOverlay isUploading={isUploading} uploadPercent={uploadPercent} compressionDone={compressionDone} />
                                {isVideoFile(imgSrc, productFileType) ? (
                                    <div className="relative w-full h-full group">
                                        <video
                                            ref={videoRef}
                                            src={imgSrc}
                                            loop
                                            muted={isMuted ?? true}
                                            playsInline
                                            onClick={!editMode ? handleVideoTap : undefined}
                                            onTouchStart={!editMode ? handleVideoTap : undefined}
                                            className={`absolute inset-0 z-10 w-full h-full object-contain transition-transform duration-300 ${!isPlaying ? "pausedVideo" : ""}`}
                                            style={{
                                                transform:
                                                    tempProduct !== placeholderProduct
                                                        ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})`
                                                        : "scale(1.2)",
                                            }}
                                        />
                                        {!editMode && (showControls || (typeof window !== "undefined" && window.innerWidth >= 768)) && (
                                            <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 z-50 bg-black/60 px-3 py-2 rounded-md flex items-center gap-3 text-white text-sm transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                                <button onClick={togglePlayPause} className="px-2 py-1 bg-white/20 rounded hover:bg-white/40 transition">
                                                    {isPlaying ? "⏸ Pause" : "▶️ Play"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <img
                                        src={imgSrc}
                                        alt="Product"
                                        className="relative z-10 w-full h-full object-contain transition-transform duration-300"
                                        style={{
                                            transform:
                                                tempProduct !== placeholderProduct
                                                    ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom * 1.1})`
                                                    : "scale(1.25)",
                                            filter: tempProduct === placeholderProduct && theme.text === "text-white" ? "invert(1) brightness(0.85)" : "none",
                                        }}
                                    />
                                )}
                                {editMode && (
                                    <input type="file" accept="image/*,video/*" id="productInput26" className="hidden" multiple onChange={handleProductChange} />
                                )}

                                {/* Price banner */}
                                {(editMode || (tempPrice && tempPrice.trim() !== "")) && (
                                    <div
                                        className="absolute top-16 -left-2 z-20 pointer-events-auto"
                                        style={{ transform: "rotate(-35deg)", transformOrigin: "left center", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.45))" }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className={`relative ${bannerBgClass} ${theme.border} border px-4 py-1 min-w-[132px] text-center`}>
                                            <span className="absolute -left-2 top-0 w-0 h-0 border-t-[14px] border-b-[14px] border-r-[8px] border-t-transparent border-b-transparent border-r-black/25" />
                                            <span className="absolute -right-2 top-0 w-0 h-0 border-t-[14px] border-b-[14px] border-l-[8px] border-t-transparent border-b-transparent border-l-black/25" />
                                            {editMode ? (
                                                <div className="flex items-center justify-center gap-0.5 text-white">
                                                    <span className="text-[10px] font-black">₹</span>
                                                    <input
                                                        type="text"
                                                        value={tempPrice}
                                                        placeholder="0"
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, "");
                                                            if (val.length <= 7) {
                                                                setTempPrice(val);
                                                            }
                                                        }}
                                                        maxLength={7}
                                                        className="w-12 text-[10px] font-black bg-transparent border-b border-white/70 focus:outline-none text-center text-white placeholder-white/60"
                                                    />
                                                    <span className="text-[10px] font-black">/-</span>
                                                </div>
                                            ) : (
                                                <span className="text-white text-[11px] font-black tracking-wide" style={{ fontFamily: "'Reggae One'", textShadow: "0 1px 3px rgba(0,0,0,0.55)" }}>
                                                    ₹{Number(tempPrice).toLocaleString("en-IN")}/-
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Logo badge */}
                            {(editMode || tempLogo || logoImage) && (
                                <div
                                    ref={logoRef}
                                    onClick={() => editMode && document.getElementById("logoInput26")?.click()}
                                    onTouchStart={editMode && tempLogo ? onLogoTouchStart : undefined}
                                    onTouchMove={editMode && tempLogo ? onLogoTouchMove : undefined}
                                    onTouchEnd={editMode && tempLogo ? onLogoTouchEnd : undefined}
                                    className={`absolute top-4 -right-12 z-20 overflow-hidden bg-white shadow-md ${editMode ? "border-2 border-blue-500 cursor-pointer" : "border border-cyan-300/50 shadow-[0_0_16px_rgba(34,211,238,0.35)]"} ${!isRecording ? "w-28 md:w-32 aspect-square" : ""}`}
                                    style={isRecording ? { width: "128px", height: "128px" } : {}}
                                >
                                    <img
                                        src={editMode ? tempLogo || "/Upload Logo.png" : logoImage!}
                                        alt="logo"
                                        className="w-full h-full object-contain transition-transform duration-300"
                                        style={{
                                            transform: tempLogo
                                                ? `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoZoom})`
                                                : "translate(0,0) scale(1)",
                                            filter: !tempLogo && theme.text === "text-white" ? "invert(1) brightness(0.85)" : "none",
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name + Description */}
                    <div ref={textContainerRef} className="relative z-10 px-4 pb-2 flex flex-col gap-1 items-center text-center shrink-0">
                        <div className={`max-w-[90%] px-4 py-1 rounded-full shadow-md bg-cyan-500/25 border border-cyan-300/50 ${theme.accent} text-center font-bold tracking-wide whitespace-nowrap overflow-hidden`}
                            style={{ fontFamily: "'Reggae One'", boxShadow: "0 0 12px rgba(34,211,238,0.35)" }}>
                            {editMode ? (
                                <input
                                    type="text"
                                    placeholder="Product Name"
                                    value={tempProductName}
                                    onChange={handleProductNameChange}
                                    className={`w-full bg-transparent border-b border-cyan-200/60 focus:outline-none text-center ${theme.accent} placeholder-cyan-200/70 text-sm md:text-base`}
                                />
                            ) : (
                                <AutoFitText text={tempProductName} />
                            )}
                        </div>

                        <div ref={editorRef} className="w-full text-center mt-1">
                            {editMode ? (
                                <Editor
                                    value={productSpecs}
                                    onChange={(e) => setProductSpecs(e.target.value)}
                                    style={{ minHeight: isRecording ? "50px" : "25px", textAlign: "center", wordBreak: "break-word", overflowWrap: "anywhere", fontSize: isRecording ? "16px" : undefined }}
                                    placeholder="Description..."
                                    className={`w-full border-2 border-blue-500 rounded px-2 py-1 min-h-[25px] text-cyan-100 ${!isRecording ? "text-[10px] md:text-sm" : ""}`}
                                    onFocus={() => setActiveEditor("productSpecs")}
                                    onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }}
                                />
                            ) : (
                                <div
                                    className="product-specs max-w-none text-center text-cyan-100"
                                    style={{ fontSize: isRecording ? "16px" : undefined }}
                                    dangerouslySetInnerHTML={{ __html: productSpecs }}
                                />
                            )}
                        </div>
                    </div>

                    <div
                        className="footer relative z-10 text-white text-center py-2 flex items-center justify-center gap-2 tracking-wide"
                        style={{
                            fontFamily: "'Reggae One'",
                            background: "linear-gradient(90deg, rgba(45,212,191,0.9), rgba(14,165,233,0.9), rgba(251,146,60,0.9))",
                            boxShadow: "0 -6px 20px rgba(45,212,191,0.35)",
                        }}
                    >
                        <span className="text-sm md:text-base font-semibold">Design via <span className="decoration-white">reNote</span> with</span>
                        <Heart className="w-4 h-4 fill-current heart-beat text-pink-400" />
                        <span className="text-sm md:text-base font-semibold">from Krishub</span>
                    </div>

                    {editMode && (
                        <input type="file" accept="image/*" id="logoInput26" className="hidden" onChange={handleLogoChange} />
                    )}
                </div>
            </EditorProvider>
        </div>
    );
};
