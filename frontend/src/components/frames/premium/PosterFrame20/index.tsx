"use client";
import { Heart, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { EditorProvider, Editor, BtnBold, BtnItalic, BtnUnderline, BtnBulletList } from "react-simple-wysiwyg";
import { ToolbarIconButton } from "@components/Button";
import { usePinchZoom } from "@utilis/usePinchZoom";
import UploadOverlay from "@utilis/UploadOverlay";
import { useVideoControls } from "@utilis/videoControls";
import { PosterFrameProps } from "@app-types/PosterFrameProps";
import React from "react";
import { createPortal } from "react-dom";
export const PosterFrame20: React.FC<PosterFrameProps> = (props) => {
    const {
        editMode, activeEditor, toolbarRef, frameRef, textContainerRef, editorRef,
        tempTitle, setTempTitle, tempProductName, handleProductNameChange,
        productSpecs, setProductSpecs, setActiveEditor, tempPrice, setTempPrice,
        logoImage, tempLogo, handleLogoChange, logoZoom, setLogoZoom,
        isUploading, uploadPercent, compressionDone, isRecording,
        productImage, tempProduct, handleProductChange, productZoom, setProductZoom,
        setLogoPosition, logoPosition, setProductPosition, productPosition,
        placeholderProduct, productFileType, AutoFitText, theme,
    } = props;
    const isMuted = props.isMuted;

    const { ref: logoRef, onTouchStart: onLogoTouchStart, onTouchMove: onLogoTouchMove, onTouchEnd: onLogoTouchEnd } =
        usePinchZoom(setLogoPosition, logoPosition, editMode, logoZoom, setLogoZoom);
    const { ref: productRef, onTouchStart: onProductTouchStart, onTouchMove: onProductTouchMove, onTouchEnd: onProductTouchEnd } =
        usePinchZoom(setProductPosition, productPosition, editMode, productZoom, setProductZoom);
    const { videoRef, isPlaying, togglePlayPause, isVideoFile, showControls, handleVideoTap } =
        useVideoControls(tempProduct || productImage, productFileType);

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
                    data-frame-type="20"
                    className="frame text-[11.5px] md:text-[16px] w-[90vw] min-h-[90vw] md:w-[550px] md:min-h-[550px] border-3 flex flex-col relative overflow-hidden"
                    style={{
                        background: "linear-gradient(148deg, #04050a 0%, #0a0f1f 35%, #12102c 67%, #101b11 100%)",
                        borderColor: "#34d399",
                        boxShadow: "0 0 0 1px rgba(52,211,153,0.35), 0 0 24px rgba(167,139,250,0.25), 0 0 40px rgba(245,158,11,0.22)",
                    }}
                >
                    <div className="absolute inset-0 pointer-events-none neon20-surface" />

                    <div className="title relative z-10 text-center p-[10px] text-xl md:text-2xl tracking-wide uppercase"
                        style={{ fontFamily: "'Reggae One'", color: "#6ee7b7", textShadow: "0 0 8px rgba(52,211,153,0.75), 0 0 20px rgba(167,139,250,0.5)" }}>
                        {editMode ? (
                            <input type="text" value={tempTitle} placeholder="Poster Title" onChange={(e) => setTempTitle(e.target.value)}
                                className="w-full text-center text-xl md:text-2xl tracking-wide uppercase border-b-2 border-emerald-300 bg-transparent focus:outline-none px-1 py-0.5 placeholder-emerald-200 placeholder-opacity-70"
                                style={{ color: "#6ee7b7" }} />
                        ) : (
                            <span className="underline underline-offset-4" style={{ textDecorationColor: "#34d399" }}>{tempTitle}</span>
                        )}
                    </div>

                    <div className="flex flex-1 min-h-0 gap-2 px-2 relative z-10">
                        <div className={`image-container w-2/3 h-full min-h-0 relative overflow-hidden rounded-lg ${editMode ? "border-2 border-emerald-300 p-1 cursor-pointer" : ""}`}
                            onTouchStart={editMode && tempProduct !== placeholderProduct ? onProductTouchStart : undefined}
                            onTouchMove={editMode && tempProduct !== placeholderProduct ? onProductTouchMove : undefined}
                            onTouchEnd={editMode && tempProduct !== placeholderProduct ? onProductTouchEnd : undefined}
                            ref={productRef}
                            onClick={() => editMode && document.getElementById("productInput20")?.click()}>
                            <img src={editMode ? tempProduct : productImage} alt="Blurred Background"
                                className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-80 transition-all duration-500" />
                            <UploadOverlay isUploading={isUploading} uploadPercent={uploadPercent} compressionDone={compressionDone} />
                            {isVideoFile(editMode ? tempProduct : productImage, productFileType) ? (
                                <div className="relative w-full h-full group">
                                    <video ref={videoRef} src={editMode ? tempProduct : productImage} loop muted={isMuted ?? true} playsInline
                                        onClick={!editMode ? handleVideoTap : undefined}
                                        onTouchStart={!editMode ? handleVideoTap : undefined}
                                        className="absolute inset-0 z-10 w-full h-full object-contain transition-transform duration-300"
                                        style={{ transform: tempProduct !== placeholderProduct ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})` : "translate(0,0) scale(1.3)" }} />
                                    {(!editMode && (showControls || window.innerWidth >= 768)) && (
                                        <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 z-50 bg-black/60 px-3 py-2 rounded-md flex items-center gap-3 text-white text-sm transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                            <button onClick={togglePlayPause} className="px-2 py-1 bg-white/20 rounded hover:bg-white/40 transition">{isPlaying ? "⏸ Pause" : "▶️ Play"}</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <img src={editMode ? tempProduct : productImage} alt="Poster Product"
                                    className="absolute inset-0 z-10 w-full h-full object-contain transition-transform duration-300"
                                    style={{ transform: tempProduct !== placeholderProduct ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})` : "translate(0,0) scale(1.3)", filter: tempProduct === placeholderProduct && theme.text === "text-white" ? "invert(1) brightness(0.85)" : "none" }} />
                            )}
                            {editMode && <input type="file" accept="image/*,video/*" id="productInput20" className="hidden" multiple onChange={handleProductChange} />}
                        </div>

                        <div className="w-1/3 flex flex-col items-center justify-center gap-2">
                            {(editMode || tempLogo || logoImage) && (
                                <div className={`logo-container relative overflow-hidden rounded-lg ${editMode ? "border-2 border-violet-300 cursor-pointer" : ""} ${!isRecording ? "w-full aspect-square" : ""}`}
                                    style={isRecording ? { width: "120px", height: "120px" } : { boxShadow: "0 0 14px rgba(167,139,250,0.35)" }}
                                    onClick={() => editMode && document.getElementById("logoInput20")?.click()}
                                    onTouchStart={editMode && tempLogo ? onLogoTouchStart : undefined}
                                    onTouchMove={editMode && tempLogo ? onLogoTouchMove : undefined}
                                    onTouchEnd={editMode && tempLogo ? onLogoTouchEnd : undefined}
                                    ref={logoRef}>
                                    <img src={editMode ? (tempLogo || "/Upload Logo.png") : (logoImage || "/Upload Logo.png")} alt="logo"
                                        className="w-full h-full transition-transform duration-300 object-contain"
                                        style={{ transform: tempLogo ? `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoZoom})` : "translate(0,0) scale(1)", filter: !tempLogo && theme.text === "text-white" ? "invert(1) brightness(0.85)" : "none" }} />
                                </div>
                            )}
                            <div className={`font-bold w-full text-[12px] md:text-base text-center ${theme.accent}`}>
                                {editMode ? (
                                    <input type="text" placeholder="Product Name" value={tempProductName} onChange={handleProductNameChange}
                                        className={`w-full border-2 border-violet-300 rounded px-1 py-1 text-[10px] md:text-sm text-center placeholder-violet-200 ${theme.accent}`} />
                                ) : (<AutoFitText text={tempProductName} />)}
                            </div>
                            {editMode ? (
                                <div className="price font-bold text-xs md:text-sm text-center">
                                    <div className="flex items-center justify-center gap-1" style={{ color: "#fbbf24" }}>
                                        <span className="text-xs font-bold">₹</span>
                                        <input type="text" value={tempPrice} placeholder="Price"
                                            onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (val.length <= 7) setTempPrice(val); }}
                                            maxLength={7} className="w-12 md:w-14 text-[10px] md:text-xs font-semibold border-b border-amber-300 bg-transparent focus:outline-none text-center leading-tight"
                                            style={{ color: "#fbbf24" }} />
                                        <span className="text-xs">/-</span>
                                    </div>
                                </div>
                            ) : (tempPrice && tempPrice.trim() !== "" && (
                                <div className="price font-bold text-xs md:text-sm text-center">
                                    <span className={`${!isRecording ? "text-[12px] md:text-base" : ""}`} style={{ fontSize: isRecording ? "18px" : undefined, color: "#fbbf24", textShadow: "0 0 8px rgba(251,191,36,0.55)" }}>
                                        ₹ {Number(tempPrice).toLocaleString("en-IN")}/-
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div ref={textContainerRef} className="w-full px-3 py-2 text-center relative z-10">
                        <div ref={editorRef} className="w-full text-center">
                            {editMode ? (
                                <Editor value={productSpecs} onChange={(e) => setProductSpecs(e.target.value)}
                                    style={{ minHeight: isRecording ? "80px" : "40px", textAlign: "center", wordBreak: "break-word", overflowWrap: "anywhere", fontSize: isRecording ? "18px" : undefined, color: "#e5e7eb" }}
                                    placeholder="Enter product description..."
                                    className={`w-full border-2 border-emerald-300 rounded px-2 py-1 min-h-[40px] ${!isRecording ? "text-[10px] md:text-sm" : ""}`}
                                    onFocus={() => setActiveEditor("productSpecs")}
                                    onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }} />
                            ) : (
                                <div className="product-specs max-w-none text-center" style={{ fontSize: isRecording ? "18px" : undefined, color: "#e5e7eb" }}
                                    dangerouslySetInnerHTML={{ __html: productSpecs }} />
                            )}
                        </div>
                    </div>

                    <div className="footer relative z-10 text-white text-center py-2 flex items-center justify-center gap-2 tracking-wide" style={{ fontFamily: "'Reggae One'", background: "linear-gradient(90deg, rgba(52,211,153,0.92), rgba(167,139,250,0.9), rgba(245,158,11,0.9))", backgroundSize: "200% 200%", animation: "neonShift20 6.8s ease infinite", boxShadow: "0 -6px 20px rgba(52,211,153,0.32)" }}>
                        <span className="text-sm md:text-base font-semibold">Design via <span className="decoration-white">reNote</span> with</span>
                        <Heart className="w-4 h-4 fill-current heart-beat text-white" />
                        <span className="text-sm md:text-base font-semibold">from Krishub</span>
                    </div>

                    {editMode && <input type="file" accept="image/*" id="logoInput20" className="hidden" onChange={handleLogoChange} />}

                    <style jsx>{`
                        .neon20-surface {
                            background:
                                radial-gradient(circle at 14% 22%, rgba(52, 211, 153, 0.2), transparent 42%),
                                radial-gradient(circle at 86% 18%, rgba(167, 139, 250, 0.2), transparent 40%),
                                radial-gradient(circle at 52% 82%, rgba(245, 158, 11, 0.16), transparent 45%);
                            mix-blend-mode: screen;
                            animation: neonPulse20 5.8s ease-in-out infinite;
                        }

                        @keyframes neonShift20 {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                        }

                        @keyframes neonPulse20 {
                            0%, 100% {
                                opacity: 0.74;
                                filter: saturate(1) hue-rotate(0deg);
                            }
                            50% {
                                opacity: 1;
                                filter: saturate(1.24) hue-rotate(-10deg);
                            }
                        }
                    `}</style>
                </div>
            </EditorProvider>
        </div>
    );
};
