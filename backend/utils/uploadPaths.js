import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_LOCAL_UPLOAD_ROOT = path.resolve(__dirname, "..", "uploads");

const resolveUploadRoot = () => {
  if (process.env.UPLOAD_ROOT) {
    return path.resolve(process.env.UPLOAD_ROOT);
  }

  if (process.env.LOCAL_UPLOAD_ROOT && fs.existsSync(path.resolve(process.env.LOCAL_UPLOAD_ROOT))) {
    return path.resolve(process.env.LOCAL_UPLOAD_ROOT);
  }

  if (fs.existsSync("/k_live/data/renote/uploads")) {
    return "/k_live/data/renote/uploads";
  }

  return DEFAULT_LOCAL_UPLOAD_ROOT;
};

export const UPLOAD_ROOT = resolveUploadRoot();
export const UPLOAD_PUBLIC_PREFIX = "/uploads";

export const ensureDir = (dirPath = UPLOAD_ROOT) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  return dirPath;
};

export const resolveUploadPath = (...segments) => {
  const p = path.join(UPLOAD_ROOT, ...segments);
  if (fs.existsSync(p)) return p;
  const localP = path.join(DEFAULT_LOCAL_UPLOAD_ROOT, ...segments);
  if (fs.existsSync(localP)) return localP;
  return p;
};

export const resolveStoredUploadPath = (filePath) => {
  if (!filePath) return "";

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  const normalizedPath = String(filePath).replace(/^\/?uploads[\\/]/, "");
  return path.join(UPLOAD_ROOT, normalizedPath);
};

export const normalizeUploadPublicPath = (filePath) => {
  if (!filePath) return null;

  const normalized = String(filePath).replace(/\\/g, "/");

  if (normalized.startsWith(`${UPLOAD_PUBLIC_PREFIX}/`)) {
    return normalized;
  }

  const uploadsIndex = normalized.indexOf("/uploads/");
  if (uploadsIndex !== -1) {
    return normalized.slice(uploadsIndex);
  }

  if (normalized.startsWith("uploads/")) {
    return `/${normalized}`;
  }

  return normalized;
};

export const toPublicUploadPath = (fileName) =>
  `${UPLOAD_PUBLIC_PREFIX}/${String(fileName).replace(/^\/+/, "")}`;