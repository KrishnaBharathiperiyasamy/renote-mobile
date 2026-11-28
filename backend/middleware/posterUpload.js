import multer from "multer";
import path from "path";
import { ensureDir, resolveUploadPath } from "../utils/uploadPaths.js";

// Sanitize an id segment so it can't escape the uploads root.
const sanitizeSegment = (value) => {
  if (value === undefined || value === null) return "";
  const str = String(value).trim();
  if (!str) return "";
  // Allow only alphanumerics, underscore, dash, dot. Strip anything else.
  const cleaned = str.replace(/[^a-zA-Z0-9_.-]/g, "");
  // Disallow traversal artifacts.
  if (!cleaned || cleaned === "." || cleaned === "..") return "";
  return cleaned;
};

// Resolve the per-user/per-company sub-directory for a poster upload.
// Falls back gracefully (to user folder, or upload root) when ids are absent
// so that legacy/unauthenticated callers still work.
const resolvePosterUploadDir = (req) => {
  // `req.posterUploadContext` is stamped by attachPosterUpdateContext for
  // updates. We prefer it because multer overwrites `req.body` when it
  // starts parsing multipart data, which can wipe out ids set by earlier
  // middleware before the destination callback ever sees them.
  const ctx = req.posterUploadContext || {};

  const userId = sanitizeSegment(
    ctx.userId ||
      req.params?.userId ||
      req.body?.userId ||
      req.body?.user_id
  );
  const companyId = sanitizeSegment(
    ctx.companyId || req.body?.company_id || req.body?.companyId
  );

  const segments = [];
  if (userId) segments.push(userId);
  if (userId && companyId) segments.push(companyId);

  return ensureDir(resolveUploadPath(...segments));
};

const allowedImageExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".svg",
  ".avif",
  ".heic",
  ".heif",
  ".tif",
  ".tiff",
]);

const allowedVideoExtensions = new Set([
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".avi",
  ".mkv",
]);

const isAllowedFile = (file, type) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const mimeType = (file.mimetype || "").toLowerCase();

  const isImage = mimeType.startsWith("image/") || allowedImageExtensions.has(extension);
  const isVideo = mimeType.startsWith("video/") || allowedVideoExtensions.has(extension);

  if (type === "image") return isImage;
  if (type === "media") return isImage || isVideo;
  return false;
};

// ✅ Storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      cb(null, resolvePosterUploadDir(req));
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// ✅ Dynamic file filter
const fileFilter = (req, file, cb) => {
  const { fieldname } = file;
  if (fieldname === "company_logo") {
    if (isAllowedFile(file, "image")) return cb(null, true);
    return cb(new Error("Company logo must be an image file"), false);
  }

  if (fieldname === "product_image") {
    if (isAllowedFile(file, "media")) return cb(null, true);
    return cb(new Error("Product image must be an image or video file"), false);
  }

  if (fieldname === "product_gallery_images") {
    if (isAllowedFile(file, "image")) return cb(null, true);
    return cb(new Error("Product gallery images must be image files"), false);
  }
  cb(new Error("Unexpected file field"), false);
};

const posterUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
}).fields([
  { name: "product_image", maxCount: 1 },
  { name: "product_gallery_images", maxCount: 4 },
  { name: "company_logo", maxCount: 1 },
]);

export default posterUpload;
