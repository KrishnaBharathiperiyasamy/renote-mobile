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
// Premium Frame 22: Neon Split-Diagonal — PosterFrame8 structure with dark animated neon treatment
export const PosterFrame22: React.FC<PosterFrameProps> = (props) => {
    const {
        editMode, activeEditor, toolbarRef, frameRef, textContainerRef, editorRef,
        tempTitle, setTempTitle, tempProductName, handleProductNameChange,
        productSpecs, setProductSpecs, setActiveEditor, tempPrice, setTempPrice,
        logoImage, tempLogo, handleLogoChange, logoZoom, setLogoZoom,
        isUploading, uploadPercent, compressionDone, isRecording,
        productImage, tempProduct, handleProductChange, productZoom, setProductZoom,
        setLogoPosition, logoPosition, setProductPosition, productPosition,
        placeholderProduct, productFileType, AutoFitText,
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
                    data-frame-type="22"
                    className="frame text-[11.5px] md:text-[16px] w-[90vw] min-h-[90vw] md:w-[550px] md:min-h-[550px] border-3 flex flex-col relative overflow-hidden"
                    style={{
                        background: "linear-gradient(152deg, #05060d 0%, #11142e 42%, #1d1133 74%, #24110f 100%)",
                        borderColor: "#60a5fa",
                        boxShadow: "0 0 0 1px rgba(96,165,250,0.35), 0 0 22px rgba(251,146,60,0.24), 0 0 34px rgba(244,114,182,0.2)",
                    }}
                >
                    <div className="absolute inset-0 pointer-events-none neon22-surface" />

                    <div className="title relative z-10 text-center p-[10px] text-xl md:text-2xl tracking-wide uppercase"
                        style={{ fontFamily: "'Reggae One'", color: "#93c5fd", textShadow: "0 0 8px rgba(96,165,250,0.78), 0 0 18px rgba(251,146,60,0.36)" }}>
                        {editMode ? (
                            <input type="text" value={tempTitle} placeholder="Poster Title" onChange={(e) => setTempTitle(e.target.value)}
                                className="w-full text-center text-xl md:text-2xl tracking-wide uppercase border-b-2 border-blue-300 bg-transparent focus:outline-none px-1 py-0.5 placeholder-blue-200 placeholder-opacity-70"
                                style={{ color: "#93c5fd" }} />
                        ) : (
                            <span className="underline underline-offset-4" style={{ textDecorationColor: "#60a5fa" }}>{tempTitle}</span>
                        )}
                    </div>

                    <div className="flex flex-1 overflow-hidden relative z-10">
                        <div ref={textContainerRef} className="w-[45%] flex flex-col items-center justify-center p-3 gap-2">
                            {(editMode || tempLogo || logoImage) && (
                                <div
                                    className={`overflow-hidden rounded-lg ${editMode ? "border-2 border-orange-300 cursor-pointer" : ""} ${!isRecording ? "w-24 md:w-32 aspect-square" : ""}`}
                                    style={isRecording ? { width: "100px", height: "100px" } : { boxShadow: "0 0 12px rgba(251,146,60,0.35)" }}
                                    onClick={() => editMode && document.getElementById("logoInput22")?.click()}
                                    onTouchStart={editMode && tempLogo ? onLogoTouchStart : undefined}
                                    onTouchMove={editMode && tempLogo ? onLogoTouchMove : undefined}
                                    onTouchEnd={editMode && tempLogo ? onLogoTouchEnd : undefined}
                                    ref={logoRef}
                                >
                                    <img
                                        src={editMode ? (tempLogo || "/Upload Logo.png") : (logoImage || "/Upload Logo.png")}
                                        alt="logo"
                                        className="w-full h-full object-contain transition-transform duration-300"
                                        style={{ transform: tempLogo ? `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoZoom})` : "translate(0,0) scale(1)" }}
                                    />
                                </div>
                            )}

                            <div className={`font-bold text-center w-full text-pink-300`}>
                                {editMode ? (
                                    <input type="text" placeholder="Product Name" value={tempProductName} onChange={handleProductNameChange}
                                        className={`w-full border-2 border-pink-300 rounded px-1 py-1 text-[10px] md:text-sm text-center placeholder-pink-200 text-pink-300`} />
                                ) : (<AutoFitText text={tempProductName} />)}
                            </div>

                            <div ref={editorRef} className="w-full text-center">
                                {editMode ? (
                                    <Editor value={productSpecs} onChange={(e) => setProductSpecs(e.target.value)}
                                        style={{ minHeight: isRecording ? "80px" : "40px", textAlign: "center", wordBreak: "break-word", overflowWrap: "anywhere", fontSize: isRecording ? "18px" : undefined, color: "#e5e7eb" }}
                                        placeholder="Description..."
                                        className={`w-full border-2 border-blue-300 rounded px-2 py-1 min-h-[40px] ${!isRecording ? "text-[10px] md:text-sm" : ""}`}
                                        onFocus={() => setActiveEditor("productSpecs")}
                                        onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }} />
                                ) : (
                                    <div className="product-specs max-w-none text-center" style={{ fontSize: isRecording ? "18px" : undefined, color: "#e5e7eb" }}
                                        dangerouslySetInnerHTML={{ __html: productSpecs }} />
                                )}
                            </div>

                            {editMode ? (
                                <div className="flex items-center justify-center gap-1" style={{ color: "#fdba74" }}>
                                    <span className="text-xs font-bold">₹</span>
                                    <input type="text" value={tempPrice} placeholder="Price"
                                        onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (val.length <= 7) setTempPrice(val); }}
                                        maxLength={7} className="w-14 text-[10px] md:text-xs font-semibold border-b border-orange-300 bg-transparent focus:outline-none text-center"
                                        style={{ color: "#fdba74" }} />
                                    <span className="text-xs">/-</span>
                                </div>
                            ) : (tempPrice && tempPrice.trim() !== "" && (
                                <span className="font-bold" style={{ color: "#fdba74", fontSize: isRecording ? "18px" : undefined, textShadow: "0 0 8px rgba(251,146,60,0.52)" }}>
                                    ₹ {Number(tempPrice).toLocaleString("en-IN")}/-
                                </span>
                            ))}
                        </div>

                        <div
                            className={`w-[55%] relative overflow-hidden ${editMode ? "border-2 border-blue-300 cursor-pointer" : ""}`}
                            style={{ clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)" }}
                            ref={productRef}
                            onTouchStart={editMode && tempProduct !== placeholderProduct ? onProductTouchStart : undefined}
                            onTouchMove={editMode && tempProduct !== placeholderProduct ? onProductTouchMove : undefined}
                            onTouchEnd={editMode && tempProduct !== placeholderProduct ? onProductTouchEnd : undefined}
                            onClick={() => editMode && document.getElementById("productInput22")?.click()}
                        >
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
                            {editMode && <input type="file" accept="image/*,video/*" id="productInput22" className="hidden" multiple onChange={handleProductChange} />}
                        </div>
                    </div>

                    <div className="footer relative z-10 text-white text-center py-2 flex items-center justify-center gap-2 tracking-wide"
                        style={{
                            fontFamily: "'Reggae One'",
                            background: "linear-gradient(90deg, rgba(96,165,250,0.92), rgba(251,146,60,0.92), rgba(244,114,182,0.88))",
                            backgroundSize: "220% 220%",
                            animation: "neonShift22 7.4s ease infinite",
                            boxShadow: "0 -6px 20px rgba(96,165,250,0.3)",
                        }}>
                        <span className="text-sm md:text-base font-semibold">Design via <span className="decoration-white">reNote</span> with</span>
                        <Heart className="w-4 h-4 fill-current heart-beat text-white" />
                        <span className="text-sm md:text-base font-semibold">from Krishub</span>
                    </div>

                    {editMode && <input type="file" accept="image/*" id="logoInput22" className="hidden" onChange={handleLogoChange} />}

                    <style jsx>{`
                        .neon22-surface {
                            background:
                                radial-gradient(circle at 16% 24%, rgba(96, 165, 250, 0.22), transparent 43%),
                                radial-gradient(circle at 84% 30%, rgba(251, 146, 60, 0.2), transparent 41%),
                                radial-gradient(circle at 58% 86%, rgba(244, 114, 182, 0.16), transparent 46%);
                            mix-blend-mode: screen;
                            animation: neonPulse22 6.2s ease-in-out infinite;
                        }

                        @keyframes neonShift22 {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                        }

                        @keyframes neonPulse22 {
                            0%, 100% {
                                opacity: 0.74;
                                filter: saturate(1) hue-rotate(0deg);
                            }
                            50% {
                                opacity: 1;
                                filter: saturate(1.2) hue-rotate(-10deg);
                            }
                        }
                    `}</style>
                </div>
            </EditorProvider>
        </div>
    );
};
