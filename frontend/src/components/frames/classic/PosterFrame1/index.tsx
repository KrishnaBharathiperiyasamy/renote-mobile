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
import { useDynamicHeight } from "@utilis/useDynamicHeight";
import UploadOverlay from "@utilis/UploadOverlay";
import { usePinchZoom } from "@utilis/usePinchZoom";
import { ToolbarIconButton } from "@components/Button";
import { useVideoControls } from "@utilis/videoControls";
import { PosterFrameProps } from "@app-types/PosterFrameProps";
import React from "react";
import { createPortal } from "react-dom";

export const PosterFrame1: React.FC<PosterFrameProps> = ({
    editMode,
    activeEditor,
    toolbarRef,
    frameRef,
    textContainerRef,
    editorRef,
    tempTitle,
    setTempTitle,
    tempProductName,
    handleProductNameChange,
    productSpecs,
    setProductSpecs,
    setActiveEditor,
    tempPrice,
    setTempPrice,
    logoImage,
    tempLogo,
    isUploading,
    isRecording,
    uploadPercent,
    compressionDone,
    handleLogoChange,
    logoZoom,
    setLogoZoom,
    productImage,
    tempProduct,
    handleProductChange,
    productZoom,
    setProductZoom,
    setLogoPosition,
    logoPosition,
    setProductPosition,
    productPosition,
    AutoFitText,
    placeholderProduct,
    productFileType,
    theme,
    isMuted,
    onEmojiOpen,
}) => {
    const height = useDynamicHeight({ ref: textContainerRef, editMode });
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
        <div id="posterFrame" className="poster-container p-[15px]">
            <EditorProvider>
                {/* Toolbar */}
                {activeEditor === "productSpecs" && editMode && typeof document !== "undefined" && createPortal(
                    <div ref={toolbarRef} className="fixed left-0 right-0 bottom-0 flex items-center bg-white border-t border-gray-200 px-3 h-12 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] z-[999]">
                        <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onEmojiOpen?.(); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-xl leading-none select-none">😊</button>
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
                    </div>,
                    document.body
                )}

                {/* Frame */}
                <div ref={frameRef}
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

                    {/* Content */}
                    <div className="content-container flex flex-1">
                        {/* Left Content */}
                        <div
                            ref={textContainerRef}
                            className="text-container w-[40%] flex flex-col"
                        >
                            {/* Product Name */}
                            <div
                                className={`product-container flex-1 p-2 ${!editMode ? "flex flex-col items-center justify-center" : ""
                                    }`}
                            >
                                <div className={`product-name font-bold text-center max-w-full overflow-hidden ${theme.accent}`}>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            placeholder="Product Name"
                                            value={tempProductName}
                                            onChange={(e) => {
                                                if (e.target.value.length <= 22)
                                                    handleProductNameChange(e);
                                            }}
                                            maxLength={22}
                                            className={`w-full text-center font-bold bg-transparent border-2 border-blue-500 focus:outline-none rounded px-2 py-1 placeholder-gray-400 ${theme.accent}`}
                                        />
                                    ) : (
                                        <AutoFitText text={tempProductName} />
                                    )}
                                </div>

                                {/* Specs */}
                                <div ref={editorRef} className="w-full text-center mt-3">
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

                            {/* Logo */}
                            <div
                                className={`logo-container relative w-[74%] md:w-40 items-center aspect-square mt-1.5 mx-auto overflow-hidden ${editMode ? "border-2 border-blue-500 cursor-pointer" : "border-gray-200"
                                    }`}
                                onClick={() => editMode && document.getElementById("logoInput")?.click()}
                                onTouchStart={editMode && tempLogo ? onLogoTouchStart : undefined}
                                onTouchMove={editMode && tempLogo ? onLogoTouchMove : undefined}
                                onTouchEnd={editMode && tempLogo ? onLogoTouchEnd : undefined}
                                ref={logoRef}
                            >
                                {/* 🔹 Blurred Background Logo */}
                                {(editMode && tempLogo) || (!editMode && logoImage) ? (
                                    <img
                                        src={editMode ? tempLogo! : logoImage!}
                                        alt="Blurred Background"
                                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-80"
                                    />
                                ) : null}


                                {/* 🔹 Foreground Logo */}
                                {editMode ? (
                                    <img
                                        src={tempLogo || "/Upload Logo.png"}
                                        alt="logo"
                                        className="relative z-10 w-full h-full transition-transform duration-300 object-contain"
                                        style={{
                                            transform: tempLogo
                                                ? `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoZoom})`
                                                : "none",
                                            filter: !tempLogo && theme.text === "text-white" ? "invert(1) brightness(0.85)" : "none",
                                        }}
                                    />
                                ) : (
                                    logoImage && (
                                        <img
                                            src={logoImage}
                                            alt="logo"
                                            className={`relative z-10 w-full h-full transition-transform duration-300 object-contain`}
                                            style={{
                                                transform: `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoZoom})`,
                                            }}
                                        />
                                    )
                                )}

                                {/* 🔹 File Input */}
                                {editMode && (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="logoInput"
                                        className="hidden"
                                        onChange={handleLogoChange}
                                    />
                                )}
                            </div>
                        </div>
                        <div
                            className={`image-container w-[60%] relative overflow-hidden ${editMode ? "border-2 border-blue-500 p-1 mr-2 cursor-pointer" : ""
                                }`}
                            onClick={() => editMode && document.getElementById("productInput")?.click()}
                            onTouchStart={editMode && tempProduct !== placeholderProduct ? onProductTouchStart : undefined}
                            onTouchMove={editMode && tempProduct !== placeholderProduct ? onProductTouchMove : undefined}
                            onTouchEnd={editMode && tempProduct !== placeholderProduct ? onProductTouchEnd : undefined}
                            ref={productRef}
                        >
                            {/* 🔹 Blurred Background Image */}
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
                                        onTouchStart={!editMode ? handleVideoTap : undefined} // 👈 FIX FOR MOBILE
                                        className={`absolute inset-0 z-10 w-full h-full object-contain transition-all duration-300
     ${!isPlaying ? "pausedVideo" : ""}
  `}
                                        style={{
                                            transform:
                                                tempProduct !== placeholderProduct
                                                    ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})`
                                                    : "scale(1.3)",
                                        }}
                                    />
                                    {/* 🔹 Dimmed overlay only on video */}
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
                                    alt="Poster Product"
                                    className="absolute inset-0 z-10 w-full h-full object-contain transition-transform duration-300"
                                    style={{
                                        transform:
                                            tempProduct !== placeholderProduct
                                                ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})`
                                                : "scale(1.3)",
                                        filter: tempProduct === placeholderProduct && theme.text === "text-white" ? "invert(1) brightness(0.85)" : "none",
                                    }}
                                />
                            )}
                            {editMode && (
                                <input
                                    type="file"
                                    id="productInput"
                                    className="hidden"
                                    multiple
                                    onChange={handleProductChange}
                                />
                            )}
                        </div>
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
            </EditorProvider>
        </div>
    );
};
