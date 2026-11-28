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
// Frame 40: Arch — rounded/arch top product area, rectangular text below with desc + price
export const PosterFrame14: React.FC<PosterFrameProps> = (props) => {
    const {
        editMode, activeEditor, toolbarRef, frameRef, textContainerRef, editorRef,
        tempTitle, setTempTitle, tempProductName, handleProductNameChange,
        productSpecs, setProductSpecs, setActiveEditor, tempPrice, setTempPrice,
        isUploading, uploadPercent, compressionDone, isRecording,
        productImage, tempProduct, productZoom, setProductZoom,
        setProductPosition, productPosition, placeholderProduct, productFileType,
        AutoFitText, theme, isMuted,
        logoImage, tempLogo, handleLogoChange, logoZoom, setLogoZoom, logoPosition, setLogoPosition,
    } = props;

    const { ref: productRef, onTouchStart: onProductTouchStart, onTouchMove: onProductTouchMove, onTouchEnd: onProductTouchEnd } =
        usePinchZoom(setProductPosition, productPosition, editMode, productZoom, setProductZoom);
    const { ref: logoRef, onTouchStart: onLogoTouchStart, onTouchMove: onLogoTouchMove, onTouchEnd: onLogoTouchEnd } =
        usePinchZoom(setLogoPosition, logoPosition, editMode, logoZoom, setLogoZoom);
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

                <div ref={frameRef} id="posterFrame" data-frame-type="40"
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

                    {/* Arch-shaped product area */}
                    <div className="relative flex-1 overflow-hidden px-4 pt-2">
                        <div className={`relative overflow-hidden w-full h-full ${editMode ? "border-2 border-blue-500 cursor-pointer" : ""}`}
                            style={{ borderRadius: "20px" }}
                            ref={productRef}
                            onTouchStart={editMode && tempProduct !== placeholderProduct ? onProductTouchStart : undefined}
                            onTouchMove={editMode && tempProduct !== placeholderProduct ? onProductTouchMove : undefined}
                            onTouchEnd={editMode && tempProduct !== placeholderProduct ? onProductTouchEnd : undefined}
                            onClick={() => editMode && document.getElementById("productInput40")?.click()}>
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
                            
                            {/* Logo Overlay */}
                            {(editMode || tempLogo || logoImage) && (
                                <div
                                    className={`absolute top-4 right-4 w-28 h-28 md:w-32 md:h-32 overflow-hidden z-20 ${editMode ? "border-2 border-blue-500 cursor-pointer" : ""}`}
                                    ref={logoRef}
                                    onTouchStart={editMode && tempLogo ? onLogoTouchStart : undefined}
                                    onTouchMove={editMode && tempLogo ? onLogoTouchMove : undefined}
                                    onTouchEnd={editMode && tempLogo ? onLogoTouchEnd : undefined}
                                    onClick={() => editMode && document.getElementById("logoInput14")?.click()}
                                >
                                    <img
                                        src={tempLogo || logoImage || "/Upload Logo.png"}
                                        alt="logo"
                                        className="w-full h-full transition-transform duration-300 object-contain"
                                        style={{
                                            transform: tempLogo ? `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoZoom})` : "translate(0,0) scale(1)",
                                            filter: !tempLogo && theme.text === "text-white" ? "invert(1) brightness(0.85)" : "none",
                                        }}
                                    />
                                </div>
                            )}
                            {editMode && <input type="file" accept="image/*" id="logoInput14" className="hidden" onChange={handleLogoChange} />}
                        </div>
                    </div>

                    {/* Text section: name + desc + price */}
                    <div ref={textContainerRef} className="px-4 py-2 flex flex-col gap-1 items-center text-center shrink-0">
                        <div className={`font-bold w-full ${theme.accent}`}>
                            {editMode ? (
                                <input type="text" placeholder="Product Name" value={tempProductName} onChange={handleProductNameChange}
                                    className={`w-full border-2 border-blue-500 rounded px-2 py-1 text-sm text-center placeholder-gray-400 ${theme.accent}`} />
                            ) : (<AutoFitText text={tempProductName} />)}
                        </div>
                        <div ref={editorRef} className="w-full text-center">
                            {editMode ? (
                                <Editor value={productSpecs} onChange={(e) => setProductSpecs(e.target.value)}
                                    style={{ minHeight: isRecording ? "50px" : "25px", textAlign: "center", wordBreak: "break-word", overflowWrap: "anywhere", fontSize: isRecording ? "16px" : undefined }}
                                    placeholder="Description..."
                                    className={`w-full border-2 border-blue-500 rounded px-2 py-1 min-h-[25px] ${theme.text} ${!isRecording ? "text-[10px] md:text-sm" : ""}`}
                                    onFocus={() => setActiveEditor("productSpecs")}
                                    onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }} />
                            ) : (
                                <div className={`product-specs max-w-none text-center ${theme.text}`} style={{ fontSize: isRecording ? "16px" : undefined }}
                                    dangerouslySetInnerHTML={{ __html: productSpecs }} />
                            )}
                        </div>
                        {editMode ? (
                            <div className={`flex items-center justify-center gap-1 ${theme.accent}`}>
                                <span className="text-sm font-bold">₹</span>
                                <input type="text" value={tempPrice} placeholder="Price"
                                    onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (val.length <= 7) setTempPrice(val); }}
                                    maxLength={7} className={`w-16 text-sm font-bold border-b-2 border-blue-500 bg-transparent focus:outline-none text-center ${theme.accent}`} />
                                <span className="text-xs font-bold">/-</span>
                            </div>
                        ) : (tempPrice && tempPrice.trim() !== "" && (
                            <span className={`font-bold text-base md:text-lg ${theme.accent}`} style={{ fontSize: isRecording ? "20px" : undefined }}>
                                ₹ {Number(tempPrice).toLocaleString("en-IN")}/-
                            </span>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className={`footer ${theme.primary} text-white text-center py-2 flex items-center justify-center gap-2 tracking-wide`} style={{ fontFamily: "'Reggae One'" }}>
                        <span className="text-sm md:text-base font-semibold">Design via <span className="decoration-white">reNote</span> with</span>
                        <Heart className={`w-4 h-4 fill-current heart-beat ${/red|rose|pink/.test(theme.primary) ? "text-white" : "text-red-500"}`} />
                        <span className="text-sm md:text-base font-semibold">from Krishub</span>
                    </div>
                </div>
            </EditorProvider>
        </div>
    );
};
