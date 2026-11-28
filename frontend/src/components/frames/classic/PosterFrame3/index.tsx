"use client";

import {
    Heart,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
} from "lucide-react";
import {
    EditorProvider,
    Editor,
    BtnBold,
    BtnItalic,
    BtnUnderline,
    BtnBulletList,
} from "react-simple-wysiwyg";
import { usePinchZoom } from "@utilis/usePinchZoom";
import { ToolbarIconButton } from "@components/Button";
import UploadOverlay from "@utilis/UploadOverlay";
import { PosterFrameProps } from "@app-types/PosterFrameProps";
import { useVideoControls } from "@utilis/videoControls";
import React from "react";
import { createPortal } from "react-dom";
export const PosterFrame3: React.FC<PosterFrameProps> = (props) => {
    const {
        editMode,
        activeEditor,
        toolbarRef,
        frameRef,
        editorRef,
        tempTitle,
        setTempTitle,
        tempProductName,
        handleProductNameChange,
        productSpecs,
        setProductSpecs,
        setActiveEditor,
        isUploading,
        uploadPercent,
        compressionDone,
        tempPrice,
        setTempPrice,
        logoImage,
        tempLogo,
        handleLogoChange,
        logoZoom,
        setLogoZoom,
        productImage,
        tempProduct,
        handleProductChange,
        productZoom,
        isRecording,
        setProductZoom,
        setLogoPosition, logoPosition,
        setProductPosition,
        productPosition,
        AutoFitText,
        placeholderProduct,
        productFileType,
        theme,
    } = props;
    const isMuted = props.isMuted;
    const {
        ref: logoRef,
        onTouchStart: onLogoTouchStart,
        onTouchMove: onLogoTouchMove,
        onTouchEnd: onLogoTouchEnd,
    } = usePinchZoom(setLogoPosition, logoPosition, editMode, logoZoom, setLogoZoom);

    const {
        ref: productRef,
        onTouchStart: onProductTouchStart,
        onTouchMove: onProductTouchMove,
        onTouchEnd: onProductTouchEnd,
    } = usePinchZoom(setProductPosition, productPosition, editMode, productZoom, setProductZoom);
    const { videoRef, isPlaying, togglePlayPause, isVideoFile, showControls, handleVideoTap } =
        useVideoControls(tempProduct || productImage, productFileType);
    const productNameColorClass = theme.border?.includes("border-")
        ? theme.border.replace(/border-/g, "text-")
        : theme.text;


    return (
        <div className="poster-container p-4">
            <EditorProvider>
                {/* Toolbar */}
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

                {/* Frame */}
                <div
                    id="posterFrame"
                    ref={frameRef}
                    data-frame-type="3"
                    className={`frame text-[11.5px] md:text-[16px] w-[90vw] min-h-[90vw] 
              md:w-[550px] md:min-h-[550px] border-3 flex flex-col ${theme.border}`}
                    style={{ background: theme.gradient }}
                >
                    {/* Title */}
                    <div
                        className={`title text-center p-[10px] ${theme.accent} text-xl md:text-2xl tracking-wide uppercase`}
                        style={{
                            fontFamily: "'Reggae One'",
                            textShadow: "1px 0 currentColor, -1px 0 currentColor",
                        }}
                    >
                        {editMode ? (
                            <input
                                type="text"
                                value={tempTitle}
                                placeholder="Poster Title"
                                onChange={(e) => setTempTitle(e.target.value)}
                                className={`w-full text-center ${theme.accent} text-xl md:text-2xl tracking-wide uppercase border-b-2 border-pink bg-transparent focus:outline-none px-1 py-0.5 placeholder-pink-400 placeholder-opacity-60`}
                            />
                        ) : (
                            <span className={`underline ${theme.accent.replace('text-', 'decoration-')} underline-offset-4`}>
                                {tempTitle}
                            </span>
                        )}
                    </div>
                    {/* Product Image */}
                    <div
                        className={`
        image-container w-4/5 mx-auto relative overflow-hidden flex-1
        ${editMode ? "border-2 border-blue-500 p-1 cursor-pointer" : ""}
    `}
                        onTouchStart={
                            editMode && tempProduct !== placeholderProduct
                                ? onProductTouchStart
                                : undefined
                        }
                        onTouchMove={
                            editMode && tempProduct !== placeholderProduct
                                ? onProductTouchMove
                                : undefined
                        }
                        onTouchEnd={
                            editMode && tempProduct !== placeholderProduct
                                ? onProductTouchEnd
                                : undefined
                        }
                        ref={productRef}
                        onClick={() =>
                            editMode && document.getElementById("productInput4")?.click()
                        }
                    >
                        {/* 🔹 Blurred Background */}
                        <img
                            src={editMode ? tempProduct : productImage}
                            alt="Blurred Background"
                            className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-80 transition-all duration-500"
                        />
                        <UploadOverlay isUploading={isUploading} uploadPercent={uploadPercent} compressionDone={compressionDone} />

                        {/* 🔹 Foreground: Image or Video */}
                        {isVideoFile(editMode ? tempProduct : productImage, productFileType) ? (
                            <div className="relative w-full h-full group">
                                <video
                                    ref={videoRef}
                                    src={editMode ? tempProduct : productImage}
                                    loop
                                    muted={isMuted ?? true}
                                    playsInline
                                    // 👇 Only handle tap for view mode
                                    onClick={!editMode ? handleVideoTap : undefined}
                                    onTouchStart={!editMode ? handleVideoTap : undefined} // 👈 FIX FOR MOBILE
                                    className="relative z-10 w-full h-full object-contain transition-transform duration-300"
                                    style={{
                                        transform:
                                            tempProduct !== placeholderProduct
                                                ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})`
                                                : "translate(0,0) scale(1.3)",
                                    }}
                                />

                                {/* 🔹 Hover or Tap to Show Play/Pause Controls */}
                                {(!editMode && (showControls || window.innerWidth >= 768)) && (
                                    <div
                                        className={`absolute bottom-2 left-1/2 -translate-x-1/2 z-50 
          bg-black/60 px-3 py-2 rounded-md flex items-center gap-3 
          text-white text-sm 
          transition-opacity duration-300 
          ${showControls ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                    >
                                        <button
                                            onClick={togglePlayPause}
                                            className="px-2 py-1 bg-white/20 rounded hover:bg-white/40 transition"
                                        >
                                            {isPlaying ? "⏸ Pause" : "▶️ Play"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <img
                                src={editMode ? tempProduct : productImage}
                                alt="Poster Product"
                                className="relative z-10 w-full h-full object-contain transition-transform duration-300"
                                style={{
                                    transform:
                                        tempProduct !== placeholderProduct
                                            ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})`
                                            : "translate(0,0) scale(1.3)",
                                    filter: tempProduct === placeholderProduct && theme.text === "text-white" ? "invert(1) brightness(0.85)" : "none",
                                }}
                            />
                        )}

                        {/* 🔹 Upload Input */}
                        {editMode && (
                            <input
                                type="file"
                                accept="image/*,video/*"
                                id="productInput4"
                                className="hidden"
                                multiple
                                onChange={handleProductChange}
                            />
                        )}
                    </div>

                    {/* Bottom section divided into two equal halves */}
                    <div className="flex gap-4 mt-2 p-2 items-center">
                        {/* Left: content section */}
                        <div className="flex-1 flex flex-col gap-2 items-center text-center">
                            {/* Product Name */}
                            <div className={`text-center font-bold w-full text-[10px] md:text-base ${theme.accent}`}>
                                {editMode ? (
                                    <input
                                        type="text"
                                        placeholder="Product Name"
                                        value={tempProductName}
                                        onChange={handleProductNameChange}
                                        className={`w-full text-center border-2 border-blue-500 rounded px-2 py-1 text-[10px] md:text-sm placeholder-gray-400 ${theme.accent}`}
                                    />
                                ) : (
                                    <AutoFitText text={tempProductName} />
                                )}
                            </div>

                            {/* Specs */}
                            <div ref={editorRef} className="w-full text-center">
                                {editMode ? (
                                    <Editor
                                        value={productSpecs}
                                        onChange={(e) => setProductSpecs(e.target.value)}
                                        style={{
                                            minHeight: isRecording ? "100px" : "60px", // taller if recording
                                            textAlign: "center",
                                            wordBreak: "break-word",
                                            overflowWrap: "anywhere",
                                            fontSize: isRecording ? "18px" : undefined, // inline style will now work
                                        }}
                                        placeholder="Enter product description..."
                                        className={`w-full border-2 border-blue-500 rounded px-2 py-1 min-h-[50px] ${theme.text} ${!isRecording ? "text-[10px] md:text-sm" : ""}`}
                                        onFocus={() => setActiveEditor("productSpecs")}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            const text = e.clipboardData.getData("text/plain");
                                            document.execCommand("insertText", false, text);
                                        }}
                                    />
                                ) : (
                                    <div
                                        className={`product-specs max-w-none text-center ${theme.text}`}
                                        style={{
                                            fontSize: isRecording ? "18px" : undefined, // bigger font during recording
                                        }}
                                        dangerouslySetInnerHTML={{ __html: productSpecs }}
                                    />
                                )}
                            </div>

                            {/* Price */}
                            {editMode ? (
                                <div className="price mt-3 font-bold text-xs md:text-sm text-center">
                                    <div className={`flex items-center justify-center gap-1 ${theme.accent}`}>
                                        <span className="text-xs md:text-sm font-bold">Price:</span>
                                        <span className="text-xs md:text-sm font-bold">₹</span>
                                        <input
                                            type="text"
                                            value={tempPrice}
                                            placeholder="Price"
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                if (val.length <= 7) {
                                                    setTempPrice(val);
                                                }
                                            }}
                                            maxLength={7}
                                            className={`w-14 md:w-16 text-[10px] md:text-xs font-semibold border-b border-blue-500 bg-transparent focus:outline-none text-center leading-tight ${theme.accent}`}
                                        />
                                        <span className="text-xs md:text-sm">/-</span>
                                    </div>
                                </div>
                            ) : (
                                tempPrice && tempPrice.trim() !== "" && (
                                    <div className="price mt-3 font-bold text-xs md:text-sm text-center">
                                        <span
                                            className={`${!isRecording ? "text-[13px] md:text-base" : ""} ${theme.accent}`}
                                            style={{ fontSize: isRecording ? "18px" : undefined }}
                                        >
                                            Price: ₹ {Number(tempPrice).toLocaleString("en-IN")}/-
                                        </span>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Right: logo section */}
                        {(editMode || tempLogo || logoImage) && (
                            <div className="flex-shrink-0 flex justify-center items-center">
                                {editMode && (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="logoInput4"
                                        className="hidden"
                                        onChange={handleLogoChange}
                                    />
                                )}

                                    <div
                                        className={`
        logo-container relative overflow-hidden
        ${editMode ? "border-2 border-blue-500 cursor-pointer" : ""}
        ${!isRecording ? "w-32 md:w-48 aspect-square" : ""} 
    `}
                                    style={
                                        isRecording
                                            ? {
                                                width: "160px",
                                                height: "160px",
                                            }
                                            : {}
                                    }
                                    onClick={() => editMode && document.getElementById("logoInput4")?.click()}
                                    onTouchStart={editMode && tempLogo ? onLogoTouchStart : undefined}
                                    onTouchMove={editMode && tempLogo ? onLogoTouchMove : undefined}
                                    onTouchEnd={editMode && tempLogo ? onLogoTouchEnd : undefined}
                                    ref={logoRef}
                                >
                                    <img
                                        src={tempLogo || "/Upload Logo.png"}
                                        alt="logo"
                                        className="w-full h-full transition-transform duration-300 object-contain"
                                        style={{
                                            transform: tempLogo
                                                ? `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoZoom})`
                                                : "translate(0,0) scale(1)",
                                            filter: !tempLogo && theme.text === "text-white" ? "invert(1) brightness(0.85)" : "none",
                                        }}
                                    />
                                </div>

                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        className={`footer ${theme.primary} text-white text-center py-2 flex items-center justify-center gap-2 tracking-wide`}
                        style={{ fontFamily: "'Reggae One'" }}
                    >
                        <span className="text-sm md:text-base font-semibold">Design via <span className="decoration-white">reNote</span> with</span>
                        <Heart className={`w-4 h-4 fill-current heart-beat ${/red|rose|pink/.test(theme.primary) ? "text-white" : "text-red-500"}`} />
                        <span className="text-sm md:text-base font-semibold">from Krishub</span>
                    </div>

                    {/* Hidden Inputs */}
                    {editMode && (
                        <>
                            <input type="file" accept="image/*" id="logoInput4" className="hidden" onChange={handleLogoChange} />
                        </>
                    )}
                </div>
            </EditorProvider>
        </div>
    );
};

