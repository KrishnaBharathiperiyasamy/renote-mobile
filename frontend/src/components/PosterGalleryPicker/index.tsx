"use client";

import React, { useRef } from "react";
import { ImagePlus, X, Check, Play } from "lucide-react";

type LocalGalleryImage = {
  id: string;
  preview: string;
};

type PosterGalleryPickerProps = {
  isDarkMode: boolean;
  editMode: boolean;
  hideTitle?: boolean;
  productImage: string;
  productMediaType?: string;
  existingImages: string[];
  localImages: LocalGalleryImage[];
  selectedGalleryImage: string | null;
  normalizeImageUrl: (path: string) => string;
  onSelectFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveExisting: (path: string) => void;
  onRemoveLocal: (id: string) => void;
  onSelectGalleryImage: (imageSource: string) => void;
};

// Helper to detect if a URL is a video
const isVideoUrl = (url: string, mediaType?: string): boolean => {
  if (!url) return false;
  if (mediaType === "video" || mediaType?.startsWith("video/")) return true;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv', '.flv', '.wmv'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.endsWith(ext));
};

// Helper to render either image or video placeholder
const MediaThumbnail: React.FC<{ 
  src: string; 
  alt: string; 
  isDarkMode: boolean;
  mediaType?: string;
}> = ({ src, alt, isDarkMode, mediaType }) => {
  if (isVideoUrl(src, mediaType)) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
        <Play size={16} className={isDarkMode ? "text-gray-300" : "text-gray-500"} fill="currentColor" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" className="w-full h-full object-cover" />;
};

const PosterGalleryPicker: React.FC<PosterGalleryPickerProps> = ({
  isDarkMode,
  editMode,
  hideTitle = false,
  productImage,
  productMediaType,
  existingImages,
  localImages,
  selectedGalleryImage,
  normalizeImageUrl,
  onSelectFiles,
  onRemoveExisting,
  onRemoveLocal,
  onSelectGalleryImage,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAnyImage = existingImages.length > 0 || localImages.length > 0;

  return (
    <div className="w-full">
      {!hideTitle && (
        <p className={`text-[10px] font-semibold mb-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Gallery
        </p>
      )}

      {/* Fixed-width container with horizontal scroll */}
      <div className="w-full" style={{ maxWidth: "280px" }}>
        <div className="min-w-0 overflow-hidden">
          <div
            className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-0.5"
            style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
          >
            {editMode && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={`flex-shrink-0 w-14 h-14 md:w-11 md:h-11 rounded-lg md:rounded-md border flex items-center justify-center transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
                title="Add gallery images"
              >
                <ImagePlus size={18} className="md:w-[14px] md:h-[14px]" />
              </button>
            )}

            {!hasAnyImage && !productImage && (
              <div
                className={`flex-shrink-0 text-[9px] px-2 py-1.5 rounded-md border whitespace-nowrap ${
                  isDarkMode
                    ? "text-gray-400 border-gray-700 bg-gray-900"
                    : "text-gray-500 border-gray-200 bg-gray-50"
                }`}
              >
                No images yet
              </div>
            )}

            {/* Product Image - Priority Selected */}
            {productImage && (
              <button
                type="button"
                onClick={() => onSelectGalleryImage("product")}
                className="relative flex-shrink-0 w-11 h-11 rounded-md overflow-hidden border-2 transition-all"
                style={{
                  borderColor: selectedGalleryImage === "product" ? "#ff6b35" : isDarkMode ? "#4b5563" : "#e5e7eb",
                  boxShadow: selectedGalleryImage === "product" ? "0 0 8px rgba(255, 107, 53, 0.4)" : "none",
                }}
                title={isVideoUrl(productImage, productMediaType) ? "Product video (priority)" : "Product image (priority)"}
              >
                <MediaThumbnail src={productImage} alt="Product" isDarkMode={isDarkMode} mediaType={productMediaType} />
                {selectedGalleryImage === "product" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            )}

            {existingImages.map((imgPath) => (
              <button
                key={`existing-${imgPath}`}
                type="button"
                onClick={() => onSelectGalleryImage(`existing-${imgPath}`)}
                className="relative flex-shrink-0 w-11 h-11 rounded-md overflow-hidden border-2 transition-all"
                style={{
                  borderColor: selectedGalleryImage === `existing-${imgPath}` ? "#ff6b35" : isDarkMode ? "#4b5563" : "#d1d5db",
                  boxShadow: selectedGalleryImage === `existing-${imgPath}` ? "0 0 8px rgba(255, 107, 53, 0.4)" : "none",
                }}
                title="Existing gallery image"
              >
                <MediaThumbnail src={normalizeImageUrl(imgPath)} alt="Gallery" isDarkMode={isDarkMode} />
                {selectedGalleryImage === `existing-${imgPath}` && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}
                {editMode && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveExisting(imgPath);
                    }}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/65 text-white hover:bg-black/80 cursor-pointer flex items-center justify-center"
                    title="Remove image"
                    role="button"
                    tabIndex={0}
                  >
                    <X size={9} />
                  </div>
                )}
              </button>
            ))}

            {localImages.map((item) => (
              <button
                key={`local-${item.id}`}
                type="button"
                onClick={() => onSelectGalleryImage(`local-${item.id}`)}
                className="relative flex-shrink-0 w-11 h-11 rounded-md overflow-hidden border-2 transition-all"
                style={{
                  borderColor: selectedGalleryImage === `local-${item.id}` ? "#ff6b35" : "#fb923c",
                  boxShadow: selectedGalleryImage === `local-${item.id}` ? "0 0 8px rgba(255, 107, 53, 0.4)" : "none",
                }}
                title="New gallery image"
              >
                <MediaThumbnail src={item.preview} alt="Gallery" isDarkMode={isDarkMode} />
                {selectedGalleryImage === `local-${item.id}` && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}
                {editMode && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLocal(item.id);
                    }}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/65 text-white hover:bg-black/80 cursor-pointer flex items-center justify-center"
                    title="Remove image"
                    role="button"
                    tabIndex={0}
                  >
                    <X size={9} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onSelectFiles}
      />
    </div>
  );
};

export default PosterGalleryPicker;
