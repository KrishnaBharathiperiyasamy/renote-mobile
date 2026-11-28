import * as htmlToImage from "html-to-image";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { safeToastSuccess, safeToastError } from "@utilis/toastHelper";
import { encodeGif, GifFrameInput } from "./gifEncoder";

/**
 * Inlines all <img> elements inside a container as Base64 Data URLs.
 * This completely prevents canvas taint and CORS issues during html-to-image or html2canvas capture.
 * Returns a restore function to revert original image src attributes.
 */
export async function inlineAllImages(element: HTMLElement): Promise<() => void> {
  const images = Array.from(element.querySelectorAll("img"));
  const originalSrcs: { img: HTMLImageElement; src: string; crossOrigin: string | null }[] = [];

  await Promise.all(
    images.map(async (img) => {
      const originalSrc = img.src || img.getAttribute("src");
      if (!originalSrc || originalSrc.startsWith("data:")) return;

      originalSrcs.push({
        img,
        src: originalSrc,
        crossOrigin: img.crossOrigin,
      });

      img.crossOrigin = "anonymous";

      // 1. Try direct fetch to blob -> Data URL
      try {
        const res = await fetch(originalSrc, { mode: "cors" });
        if (res.ok) {
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          img.src = dataUrl;
          return;
        }
      } catch {
        // Direct fetch failed, fallback to drawing on an off-screen canvas
      }

      // 2. Offscreen Image canvas fallback
      try {
        const tempImg = new Image();
        tempImg.crossOrigin = "anonymous";
        tempImg.src = originalSrc;
        await new Promise<void>((resolve, reject) => {
          tempImg.onload = () => resolve();
          tempImg.onerror = () => reject();
        });
        const c = document.createElement("canvas");
        c.width = tempImg.naturalWidth || 500;
        c.height = tempImg.naturalHeight || 500;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.drawImage(tempImg, 0, 0);
          img.src = c.toDataURL("image/png");
        }
      } catch {
        // Keep original if both attempts fail
      }
    })
  );

  return () => {
    for (const { img, src, crossOrigin } of originalSrcs) {
      img.src = src;
      if (crossOrigin !== null) {
        img.crossOrigin = crossOrigin;
      } else {
        img.removeAttribute("crossorigin");
      }
    }
  };
}

/**
 * Captures an HTML element as a high-resolution PNG Data URL.
 * Combines html-to-image and html2canvas with image inlining and transform resetting.
 */
export async function capturePosterElement(element: HTMLElement): Promise<string> {
  const restoreImages = await inlineAllImages(element);

  // Temporarily reset any CSS transforms on parent (e.g. editor zoom)
  const parent = element.parentElement;
  let originalTransform = "";
  if (parent && parent.style.transform && parent.style.transform !== "none") {
    originalTransform = parent.style.transform;
    parent.style.transform = "none";
  }

  try {
    // Attempt 1: html-to-image for highest vector/font fidelity & modern CSS
    try {
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#ffffff",
        filter: (domNode) => {
          if (domNode instanceof HTMLElement) {
            if (
              domNode.getAttribute("data-html2canvas-ignore") === "true" ||
              domNode.getAttribute("data-export-ignore") === "true" ||
              domNode.getAttribute("data-element-toolbar") === "true" ||
              domNode.getAttribute("data-image-toolbar") === "true" ||
              domNode.getAttribute("data-image-resize-handle") !== null ||
              domNode.getAttribute("data-sticker-handle") !== null
            ) {
              return false;
            }
          }
          return true;
        },
      });
      if (dataUrl && dataUrl.length > 500) {
        return dataUrl;
      }
    } catch (err1) {
      console.warn("html-to-image capture fallback to html2canvas:", err1);
    }

    // Attempt 2: html2canvas
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });
    const dataUrl = canvas.toDataURL("image/png");
    if (dataUrl && dataUrl.length > 500) {
      return dataUrl;
    }

    throw new Error("Unable to capture poster element");
  } finally {
    if (originalTransform && parent) {
      parent.style.transform = originalTransform;
    }
    restoreImages();
  }
}

export interface ExportPosterOptions {
  element: HTMLElement;
  format: "pdf" | "png" | "jpeg";
  fileName?: string;
  onSuccess?: (msg: string) => void;
  onError?: (err: any) => void;
}

/**
 * Complete export pipeline for posters:
 * Captures the ENTIRE rendered poster (background, borders, title, product image, discount badge,
 * product name, price, promotional text, and footer) and downloads it in high-resolution PDF or PNG.
 */
export async function exportPoster({
  element,
  format,
  fileName = "renote-poster",
  onSuccess,
  onError,
}: ExportPosterOptions): Promise<string> {
  const cleanFileName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40) || "renote-poster";

  try {
    const dataUrl = await capturePosterElement(element);

    if (format === "png" || format === "jpeg") {
      let exportUrl = dataUrl;
      if (format === "jpeg") {
        try {
          const img = new Image();
          img.src = dataUrl;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
          });
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            exportUrl = canvas.toDataURL("image/jpeg", 0.95);
          }
        } catch {
          // Fall back to original dataUrl if JPEG conversion fails
        }
      }

      const link = document.createElement("a");
      link.download = `${cleanFileName}.${format === "jpeg" ? "jpg" : "png"}`;
      link.href = exportUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const msg = `Poster exported successfully as ${format.toUpperCase()}! 🖼️`;
      safeToastSuccess(msg);
      onSuccess?.(msg);
      return exportUrl;
    }

    if (format === "pdf") {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
      const margin = 10; // 10 mm margin
      const availWidth = pageWidth - margin * 2;
      const availHeight = pageHeight - margin * 2;

      const imgProps = pdf.getImageProperties(dataUrl);
      const ratio = imgProps.width / imgProps.height;

      let renderWidth = availWidth;
      let renderHeight = renderWidth / ratio;

      if (renderHeight > availHeight) {
        renderHeight = availHeight;
        renderWidth = renderHeight * ratio;
      }

      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      pdf.addImage(dataUrl, "PNG", x, y, renderWidth, renderHeight, undefined, "FAST");
      pdf.save(`${cleanFileName}.pdf`);

      const msg = "Complete poster downloaded as high-quality A4 PDF! 📄";
      safeToastSuccess(msg);
      onSuccess?.(msg);
      return dataUrl;
    }

    return dataUrl;
  } catch (err) {
    console.error("Poster export error:", err);
    const errMsg = "Failed to export poster. Please try again.";
    safeToastError(errMsg);
    onError?.(err);
    throw err;
  }
}

export interface ExportAnimatedPosterOptions {
  element: HTMLElement;
  fileName?: string;
  duration?: number; // seconds (default 2)
  fps?: number; // frames per second (default 15)
  onProgress?: (percent: number) => void;
  onSuccess?: (msg: string) => void;
  onError?: (err: any) => void;
}

/**
 * Exports an animated poster as high-definition MP4 Video.
 * Uses canvas captureStream and native browser MediaRecorder.
 */
export async function exportAnimatedPosterAsVideo({
  element,
  fileName = "renote-animated-poster",
  duration = 2,
  fps = 15,
  onProgress,
  onSuccess,
  onError,
}: ExportAnimatedPosterOptions): Promise<Blob> {
  const cleanFileName =
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40) || "renote-animated-poster";

  const restoreImages = await inlineAllImages(element);
  const totalFrames = Math.max(10, Math.round(duration * fps));
  const frameDelay = Math.round(1000 / fps);

  // Capture canvas target size (840x1160 for high quality video)
  const width = 840;
  const height = 1160;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  let mimeType = "video/webm";
  if (typeof MediaRecorder !== "undefined") {
    if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
      mimeType = "video/mp4;codecs=avc1";
    } else if (MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      mimeType = "video/webm;codecs=vp9";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      mimeType = "video/webm";
    }
  }

  const stream = canvas.captureStream(fps);
  const recordedChunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
    videoBitsPerSecond: 3500000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      resolve(blob);
    };
    recorder.onerror = reject;
  });

  recorder.start();

  try {
    for (let i = 0; i < totalFrames; i++) {
      onProgress?.(Math.round(((i + 1) / totalFrames) * 90));

      let frameCanvas: HTMLCanvasElement;
      try {
        frameCanvas = await htmlToImage.toCanvas(element, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          filter: (node) => {
            if (node instanceof HTMLElement) {
              if (
                node.getAttribute("data-html2canvas-ignore") === "true" ||
                node.getAttribute("data-export-ignore") === "true" ||
                node.getAttribute("data-element-toolbar") === "true" ||
                node.getAttribute("data-image-toolbar") === "true"
              ) {
                return false;
              }
            }
            return true;
          },
        });
      } catch {
        frameCanvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
      }

      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(frameCanvas, 0, 0, width, height);
      }

      await new Promise((r) => setTimeout(r, frameDelay));
    }

    recorder.stop();
    const finalBlob = await recordingPromise;

    // Download video
    const url = URL.createObjectURL(finalBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${cleanFileName}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    const msg = "Animated poster exported successfully as MP4 Video! 🎬";
    safeToastSuccess(msg);
    onSuccess?.(msg);
    return finalBlob;
  } catch (err) {
    console.error("Video export error:", err);
    const errMsg = "Failed to export video. Please try again.";
    safeToastError(errMsg);
    onError?.(err);
    throw err;
  } finally {
    restoreImages();
  }
}

/**
 * Exports an animated poster as Animated GIF.
 * Uses frame-by-frame snapshot capture and client-side GIF89a compression.
 */
export async function exportAnimatedPosterAsGif({
  element,
  fileName = "renote-animated-poster",
  duration = 2,
  fps = 12,
  onProgress,
  onSuccess,
  onError,
}: ExportAnimatedPosterOptions): Promise<Blob> {
  const cleanFileName =
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40) || "renote-animated-poster";

  const restoreImages = await inlineAllImages(element);
  const totalFrames = Math.max(8, Math.round(duration * fps));
  const frameDelay = Math.round(1000 / fps);

  const targetWidth = 420;
  const targetHeight = 580;
  const helperCanvas = document.createElement("canvas");
  helperCanvas.width = targetWidth;
  helperCanvas.height = targetHeight;
  const helperCtx = helperCanvas.getContext("2d", { willReadFrequently: true });

  const capturedFrames: GifFrameInput[] = [];

  try {
    for (let i = 0; i < totalFrames; i++) {
      onProgress?.(Math.round(((i + 1) / totalFrames) * 70));

      let frameCanvas: HTMLCanvasElement;
      try {
        frameCanvas = await htmlToImage.toCanvas(element, {
          pixelRatio: 1,
          backgroundColor: "#ffffff",
          filter: (node) => {
            if (node instanceof HTMLElement) {
              if (
                node.getAttribute("data-html2canvas-ignore") === "true" ||
                node.getAttribute("data-export-ignore") === "true" ||
                node.getAttribute("data-element-toolbar") === "true" ||
                node.getAttribute("data-image-toolbar") === "true"
              ) {
                return false;
              }
            }
            return true;
          },
        });
      } catch {
        frameCanvas = await html2canvas(element, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
      }

      if (helperCtx) {
        helperCtx.clearRect(0, 0, targetWidth, targetHeight);
        helperCtx.drawImage(frameCanvas, 0, 0, targetWidth, targetHeight);
        const imgData = helperCtx.getImageData(0, 0, targetWidth, targetHeight);
        capturedFrames.push({
          data: imgData.data,
          delay: frameDelay,
        });
      }

      await new Promise((r) => setTimeout(r, frameDelay));
    }

    onProgress?.(85);
    const gifBlob = encodeGif(capturedFrames, targetWidth, targetHeight);
    onProgress?.(100);

    const url = URL.createObjectURL(gifBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${cleanFileName}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    const msg = "Animated poster exported successfully as GIF! 🖼️✨";
    safeToastSuccess(msg);
    onSuccess?.(msg);
    return gifBlob;
  } catch (err) {
    console.error("GIF export error:", err);
    const errMsg = "Failed to export animated GIF. Please try again.";
    safeToastError(errMsg);
    onError?.(err);
    throw err;
  } finally {
    restoreImages();
  }
}
