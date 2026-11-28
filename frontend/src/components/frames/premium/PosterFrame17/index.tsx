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
export const PosterFrame17: React.FC<PosterFrameProps> = (props) => {
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
                    id="posterFrame"
                    ref={frameRef}
                    data-frame-type="17"
                    className="frame text-[11.5px] md:text-[16px] w-[90vw] min-h-[90vw] md:w-[550px] md:min-h-[550px] border-3 flex flex-col relative overflow-hidden"
                    style={{
                        background: "linear-gradient(145deg, #070f00 0%, #152600 28%, #061a3f 62%, #140b2a 100%)",
                        borderColor: "#a3e635",
                        boxShadow: "0 0 0 1px rgba(163,230,53,0.35), 0 0 22px rgba(163,230,53,0.28), 0 0 40px rgba(37,99,235,0.28)",
                    }}
                >
                    <div className="absolute inset-0 pointer-events-none neon17-surface" />

                    <div
                        className="title relative z-10 text-center p-[10px] text-xl md:text-2xl tracking-wide uppercase"
                        style={{
                            fontFamily: "'Reggae One'",
                            color: "#bef264",
                            textShadow: "0 0 8px rgba(163,230,53,0.75), 0 0 18px rgba(250,204,21,0.45)",
                        }}
                    >
                        {editMode ? (
                            <input
                                type="text"
                                value={tempTitle}
                                placeholder="Poster Title"
                                onChange={(e) => setTempTitle(e.target.value)}
                                className="w-full text-center text-xl md:text-2xl tracking-wide uppercase border-b-2 border-lime-300 bg-transparent focus:outline-none px-1 py-0.5 placeholder-lime-200 placeholder-opacity-70"
                                style={{ color: "#bef264" }}
                            />
                        ) : (
                            <span className="underline underline-offset-4" style={{ textDecorationColor: "#a3e635" }}>
                                {tempTitle}
                            </span>
                        )}
                    </div>

                    <div
                        className={`image-container w-4/5 mx-auto relative overflow-hidden flex-1 ${editMode ? "border-2 border-lime-300 p-1 cursor-pointer" : ""}`}
                        onTouchStart={editMode && tempProduct !== placeholderProduct ? onProductTouchStart : undefined}
                        onTouchMove={editMode && tempProduct !== placeholderProduct ? onProductTouchMove : undefined}
                        onTouchEnd={editMode && tempProduct !== placeholderProduct ? onProductTouchEnd : undefined}
                        ref={productRef}
                        onClick={() => editMode && document.getElementById("productInput17")?.click()}
                        style={{ boxShadow: !editMode ? "inset 0 0 16px rgba(163,230,53,0.2)" : undefined }}
                    >
                        <img
                            src={editMode ? tempProduct : productImage}
                            alt="Blurred Background"
                            className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-80 transition-all duration-500"
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
                                    className="relative z-10 w-full h-full object-contain transition-transform duration-300"
                                    style={{
                                        transform:
                                            tempProduct !== placeholderProduct
                                                ? `translate(${productPosition.x}px, ${productPosition.y}px) scale(${productZoom})`
                                                : "translate(0,0) scale(1.3)",
                                    }}
                                />

                                {(!editMode && (showControls || window.innerWidth >= 768)) && (
                                    <div
                                        className={`absolute bottom-2 left-1/2 -translate-x-1/2 z-50 bg-black/60 px-3 py-2 rounded-md flex items-center gap-3 text-white text-sm transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
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

                        {editMode && (
                            <input
                                type="file"
                                accept="image/*,video/*"
                                id="productInput17"
                                className="hidden"
                                multiple
                                onChange={handleProductChange}
                            />
                        )}
                    </div>

                    <div className="flex gap-4 mt-2 p-2 items-center relative z-10">
                        <div className="flex-1 flex flex-col gap-2 items-center text-center">
                            <div className={`text-center font-bold w-full text-[10px] md:text-base ${theme.accent}`}>
                                {editMode ? (
                                    <input
                                        type="text"
                                        placeholder="Product Name"
                                        value={tempProductName}
                                        onChange={handleProductNameChange}
                                        className={`w-full text-center border-2 border-lime-300 rounded px-2 py-1 text-[10px] md:text-sm placeholder-lime-200 ${theme.accent}`}
                                    />
                                ) : (
                                    <AutoFitText text={tempProductName} />
                                )}
                            </div>

                            <div ref={editorRef} className="w-full text-center">
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
                                        className={`w-full border-2 border-blue-400 rounded px-2 py-1 min-h-[50px] ${!isRecording ? "text-[10px] md:text-sm" : ""}`}
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
                                    <div className="flex items-center justify-center gap-1" style={{ color: "#facc15" }}>
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
                                            className="w-14 md:w-16 text-[10px] md:text-xs font-semibold border-b border-yellow-300 bg-transparent focus:outline-none text-center leading-tight"
                                            style={{ color: "#facc15" }}
                                        />
                                        <span className="text-xs md:text-sm">/-</span>
                                    </div>
                                </div>
                            ) : (
                                tempPrice && tempPrice.trim() !== "" && (
                                    <div className="price mt-3 font-bold text-xs md:text-sm text-center">
                                        <span
                                            className={`${!isRecording ? "text-[13px] md:text-base" : ""}`}
                                            style={{ fontSize: isRecording ? "18px" : undefined, color: "#facc15", textShadow: "0 0 8px rgba(250,204,21,0.5)" }}
                                        >
                                            Price: ₹ {Number(tempPrice).toLocaleString("en-IN")}/-
                                        </span>
                                    </div>
                                )
                            )}
                        </div>

                        {(editMode || tempLogo || logoImage) && (
                            <div className="flex-shrink-0 flex justify-center items-center">
                                {editMode && (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="logoInput17"
                                        className="hidden"
                                        onChange={handleLogoChange}
                                    />
                                )}

                                <div
                                    className={`logo-container relative overflow-hidden ${editMode ? "border-2 border-lime-300 cursor-pointer" : ""} ${!isRecording ? "w-32 md:w-48 aspect-square" : ""}`}
                                    style={
                                        isRecording
                                            ? { width: "160px", height: "160px" }
                                            : { boxShadow: "0 0 12px rgba(163,230,53,0.28)" }
                                    }
                                    onClick={() => editMode && document.getElementById("logoInput17")?.click()}
                                    onTouchStart={editMode && tempLogo ? onLogoTouchStart : undefined}
                                    onTouchMove={editMode && tempLogo ? onLogoTouchMove : undefined}
                                    onTouchEnd={editMode && tempLogo ? onLogoTouchEnd : undefined}
                                    ref={logoRef}
                                >
                                    <img
                                        src={editMode ? (tempLogo || "/Upload Logo.png") : (logoImage || "/Upload Logo.png")}
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

                    <div
                        className="footer relative z-10 text-white text-center py-2 flex items-center justify-center gap-2 tracking-wide"
                        style={{
                            fontFamily: "'Reggae One'",
                            background: "linear-gradient(90deg, rgba(163,230,53,0.92), rgba(250,204,21,0.9), rgba(37,99,235,0.92))",
                            backgroundSize: "200% 200%",
                            animation: "neonShift17 6.6s ease infinite",
                            boxShadow: "0 -6px 20px rgba(163,230,53,0.32)",
                        }}
                    >
                        <span className="text-sm md:text-base font-semibold">Design via <span className="decoration-white">reNote</span> with</span>
                        <Heart className="w-4 h-4 fill-current heart-beat text-white" />
                        <span className="text-sm md:text-base font-semibold">from Krishub</span>
                    </div>

                    <style jsx>{`
                        .neon17-surface {
                            background:
                                radial-gradient(circle at 14% 20%, rgba(163, 230, 53, 0.2), transparent 42%),
                                radial-gradient(circle at 86% 18%, rgba(250, 204, 21, 0.16), transparent 38%),
                                radial-gradient(circle at 52% 82%, rgba(37, 99, 235, 0.2), transparent 46%);
                            mix-blend-mode: screen;
                            animation: neonPulse17 5.6s ease-in-out infinite;
                        }

                        @keyframes neonShift17 {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                        }

                        @keyframes neonPulse17 {
                            0%, 100% {
                                opacity: 0.74;
                                filter: saturate(1) hue-rotate(0deg);
                            }
                            50% {
                                opacity: 1;
                                filter: saturate(1.24) hue-rotate(16deg);
                            }
                        }
                    `}</style>
                </div>
            </EditorProvider>
        </div>
    );
};
