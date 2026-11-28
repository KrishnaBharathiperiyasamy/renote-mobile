// UploadOverlay.tsx
"use client";
import React from "react";

interface UploadOverlayProps {
    isUploading: boolean;
    uploadPercent: number;
    compressionDone: boolean;
}

export default function UploadOverlay({
    isUploading,
    uploadPercent,
    compressionDone,
}: UploadOverlayProps) {
    if (!isUploading) return null;

    return (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-30">

            {/* 🔵 Uploading */}
            {!compressionDone && uploadPercent < 100 && (
                <>
                    <div className="loader w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

                    <p className="text-white mt-3 text-sm sm:text-lg font-semibold">
                        {uploadPercent}%
                    </p>

                    <p className="text-white text-xs sm:text-sm opacity-80">
                        Uploading…
                    </p>
                </>
            )}

            {/* 🟡 Processing */}
            {!compressionDone && uploadPercent === 100 && (
                <>
                    <div className="loader w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

                    <p className="text-blue-300 mt-3 text-sm sm:text-lg font-semibold">
                        Processing…
                    </p>

                    <p className="text-blue-200 text-xs sm:text-sm opacity-70 text-center px-4">
                        Compressing, please wait…
                    </p>
                </>
            )}

            {/* 🟢 Compression Completed */}
            {compressionDone && (
                <div className="flex flex-col items-center justify-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-2xl sm:text-3xl">✔</span>
                    </div>

                    <p className="text-green-300 mt-4 text-sm sm:text-lg font-semibold text-center">
                        Compression Completed
                    </p>
                </div>
            )}
        </div>
    );
}
