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
import { useVideoControls } from "@utilis/videoControls";
import UploadOverlay from "@utilis/UploadOverlay";
import { ToolbarIconButton } from "@components/Button";
import { useDynamicHeight } from "@utilis/useDynamicHeight";
import { PosterFrameProps } from "@app-types/PosterFrameProps";
import React from "react";
import { createPortal } from "react-dom";

export const PosterFrame16: React.FC<PosterFrameProps> = (props) => {
    const {
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
        isUploading,
        isRecording,
        uploadPercent,
        compressionDone,
        logoImage,
        tempLogo,
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
        productFileType,
        placeholderProduct,
        theme,
    } = props;
    const isMuted = props.isMuted;

    useDynamicHeight({ ref: textContainerRef, editMode });

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

    return (
        <div id="posterFrame" className="poster-container p-[15px]">
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
                    </div>,
                    document.body
                )}

                <div
                    ref={frameRef}
                    className="frame text-[11.5px] md:text-[16px] w-[90vw] min-h-[90vw] md:w-[550px] md:min-h-[550px] border-3 flex flex-col relative overflow-hidden"
                    style={{
                        background: "linear-gradient(140deg, #04131f 0%, #071d3d 28%, #0f082e 60%, #20052f 100%)",
                        borderColor: "#2dd4bf",
                        boxShadow: "0 0 0 1px rgba(45,212,191,0.35), 0 0 24px rgba(14,165,233,0.35), 0 0 44px rgba(249,115,22,0.25)",
                    }}
                >
                    <div className="absolute inset-0 pointer-events-none neon16-surface" />

                    <div
                        className="title relative z-10 text-center p-[10px] text-xl md:text-2xl tracking-wide uppercase"
                        style={{
                            fontFamily: "'Reggae One'",
                            color: "#5eead4",
                            textShadow: "0 0 8px rgba(45,212,191,0.8), 0 0 20px rgba(56,189,248,0.55)",
                        }}
                    >
                        {editMode ? (
                            <input
                                type="text"
                                value={tempTitle}
                                placeholder="Poster Title"
                                onChange={(e) => setTempTitle(e.target.value)}
                                className="w-full text-center text-xl md:text-2xl tracking-wide uppercase border-b-2 border-teal-300 bg-transparent focus:outline-none px-1 py-0.5 placeholder-teal-200 placeholder-opacity-70"
                                style={{ color: "#5eead4" }}
                            />
                        ) : (
                            <span className="underline underline-offset-4" style={{ textDecorationColor: "#2dd4bf" }}>
                                {tempTitle}
                            </span>
                        )}
                    </div>

                    <div className="content-container relative z-10 flex flex-1">
                        <div
                            className={`image-container w-[60%] relative overflow-hidden ${editMode ? "border-2 border-teal-300 p-1 mr-2 cursor-pointer" : ""}`}
                            onClick={() => editMode && document.getElementById("productInput16")?.click()}
                            onTouchStart={editMode && tempProduct !== placeholderProduct ? onProductTouchStart : undefined}
                            onTouchMove={editMode && tempProduct !== placeholderProduct ? onProductTouchMove : undefined}
                            onTouchEnd={editMode && tempProduct !== placeholderProduct ? onProductTouchEnd : undefined}
                            ref={productRef}
                            style={{ boxShadow: !editMode ? "inset 0 0 18px rgba(45,212,191,0.22)" : undefined }}
                        >
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
                                        className={`absolute inset-0 z-10 w-full h-full object-contain transition-all duration-300 ${!isPlaying ? "pausedVideo" : ""}`}
                                        style={{
                                            transform:
                                                tempProduct !== placeholderProduct
                                                    ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})`
                                                    : "scale(1.3)",
                                        }}
                                    />

                                    {(!editMode && (showControls || window.innerWidth >= 768)) && (
                                        <div
                                            className={`absolute inset-0 flex items-center justify-center z-20 bg-black/50 rounded-md text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${showControls ? "opacity-100" : ""}`}
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
                                    id="productInput16"
                                    className="hidden"
                                    multiple
                                    onChange={handleProductChange}
                                />
                            )}
                        </div>

                        <div ref={textContainerRef} className="text-container w-[40%] flex flex-col">
                            <div className={`product-container flex-1 p-2 ${!editMode ? "flex flex-col items-center justify-center" : ""}`}>
                                <div className={`product-name font-bold text-center max-w-full overflow-hidden ${theme.accent}`}>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            placeholder="Product Name"
                                            value={tempProductName}
                                            onChange={(e) => {
                                                if (e.target.value.length <= 22) handleProductNameChange(e);
                                            }}
                                            maxLength={22}
                                            className={`w-full text-center font-bold bg-transparent border-2 border-amber-300 focus:outline-none rounded px-2 py-1 placeholder-amber-200 ${theme.accent}`}
                                        />
                                    ) : (
                                        <AutoFitText text={tempProductName} />
                                    )}
                                </div>

                                <div ref={editorRef} className="w-full text-center mt-3">
                                    {editMode ? (
                                        <Editor
                                            value={productSpecs}
                                            onChange={(e) => setProductSpecs(e.target.value)}
                                            style={{
                                                minHeight: isRecording ? "100px" : "60px",
                                                textAlign: "center",
                                                wordBreak: "break-word",
                                                overflowWrap: "anywhere",
                                                fontSize: isRecording ? "18px" : undefined,
                                                color: "#dbeafe",
                                            }}
                                            placeholder="Enter product description..."
                                            className={`w-full border-2 border-sky-300 rounded px-2 py-1 min-h-[50px] ${!isRecording ? "text-[10px] md:text-sm" : ""}`}
                                            onFocus={() => setActiveEditor("productSpecs")}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const text = e.clipboardData.getData("text/plain");
                                                document.execCommand("insertText", false, text);
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="product-specs max-w-none text-center"
                                            style={{
                                                fontSize: isRecording ? "18px" : undefined,
                                                color: "#dbeafe",
                                            }}
                                            dangerouslySetInnerHTML={{ __html: productSpecs }}
                                        />
                                    )}
                                </div>

                                {editMode ? (
                                    <div className="price mt-3 font-bold text-xs md:text-sm text-center">
                                        <div className="flex items-center justify-center gap-1" style={{ color: "#fbbf24" }}>
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
                                                className="w-14 md:w-16 text-[10px] md:text-xs font-semibold border-b border-amber-300 bg-transparent focus:outline-none text-center leading-tight"
                                                style={{ color: "#fbbf24" }}
                                            />
                                            <span className="text-xs md:text-sm">/-</span>
                                        </div>
                                    </div>
                                ) : (
                                    tempPrice && tempPrice.trim() !== "" && (
                                        <div className="price mt-3 font-bold text-xs md:text-sm text-center">
                                            <span
                                                className={`${!isRecording ? "text-[13px] md:text-base" : ""}`}
                                                style={{
                                                    fontSize: isRecording ? "18px" : undefined,
                                                    color: "#fbbf24",
                                                    textShadow: "0 0 10px rgba(251,191,36,0.55)",
                                                }}
                                            >
                                                Price: ₹ {Number(tempPrice).toLocaleString("en-IN")}/-
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>

                            <div
                                className={`logo-container relative w-[74%] md:w-40 items-center aspect-square mt-1.5 mx-auto overflow-hidden ${editMode ? "border-2 border-teal-300 cursor-pointer" : "border-teal-200/40"}`}
                                onClick={() => editMode && document.getElementById("logoInput16")?.click()}
                                onTouchStart={editMode && tempLogo ? onLogoTouchStart : undefined}
                                onTouchMove={editMode && tempLogo ? onLogoTouchMove : undefined}
                                onTouchEnd={editMode && tempLogo ? onLogoTouchEnd : undefined}
                                ref={logoRef}
                                style={{ boxShadow: "0 0 12px rgba(45,212,191,0.35)" }}
                            >
                                {editMode ? (
                                    <img
                                        src={tempLogo || "/Upload Logo.png"}
                                        alt="logo"
                                        className="w-full h-full transition-transform duration-300 object-contain"
                                        style={{
                                            transform: tempLogo ? `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoZoom})` : "none",
                                            filter: !tempLogo && theme.text === "text-white" ? "invert(1) brightness(0.85)" : "none",
                                        }}
                                    />
                                ) : (
                                    logoImage && (
                                        <img
                                            src={logoImage}
                                            alt="logo"
                                            className="w-full h-full transition-transform duration-300 object-contain"
                                            style={{ transform: `translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoZoom})` }}
                                        />
                                    )
                                )}

                                {editMode && (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="logoInput16"
                                        className="hidden"
                                        onChange={handleLogoChange}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div
                        className="footer relative z-10 text-white text-center py-2 flex items-center justify-center gap-2 tracking-wide"
                        style={{
                            fontFamily: "'Reggae One'",
                            background: "linear-gradient(90deg, rgba(45,212,191,0.9), rgba(14,165,233,0.9), rgba(251,146,60,0.9))",
                            backgroundSize: "200% 200%",
                            animation: "neonShift16 7s ease infinite",
                            boxShadow: "0 -6px 20px rgba(45,212,191,0.35)",
                        }}
                    >
                        <span className="text-sm md:text-base font-semibold">
                            Design via <span className="decoration-white">reNote</span> with
                        </span>
                        <Heart className="w-4 h-4 fill-current heart-beat text-white" />
                        <span className="text-sm md:text-base font-semibold">from Krishub</span>
                    </div>

                    <style jsx>{`
                        .neon16-surface {
                            background:
                                radial-gradient(circle at 12% 18%, rgba(45, 212, 191, 0.2), transparent 42%),
                                radial-gradient(circle at 88% 22%, rgba(56, 189, 248, 0.18), transparent 40%),
                                radial-gradient(circle at 55% 82%, rgba(251, 146, 60, 0.16), transparent 45%);
                            mix-blend-mode: screen;
                            animation: neonPulse16 5.8s ease-in-out infinite;
                        }

                        @keyframes neonShift16 {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                        }

                        @keyframes neonPulse16 {
                            0%, 100% {
                                opacity: 0.76;
                                filter: saturate(1) hue-rotate(0deg);
                            }
                            50% {
                                opacity: 1;
                                filter: saturate(1.25) hue-rotate(-14deg);
                            }
                        }
                    `}</style>
                </div>
            </EditorProvider>
        </div>
    );
};
