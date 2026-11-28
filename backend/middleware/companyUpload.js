import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { ensureDir, resolveUploadPath } from '../utils/uploadPaths.js';

const __dirname = path.resolve();

const createCompanyFolder = (companyId) => {
  const folderPath = ensureDir(resolveUploadPath("companies", companyId));
  return folderPath;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const companyId = req.body.companyId || "default-company";
    const folderPath = createCompanyFolder(companyId);
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const extension = path.extname(file.originalname || "").toLowerCase();

  const isAllowed = allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(extension);
  if (!isAllowed) {
    return cb(new Error("Only JPEG, PNG, and WEBP images are allowed!"), false);
  }
  cb(null, true);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).single("logo");

const uploadCompanyLogo = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Logo file size must be less than 5MB." });
      }
      return res.status(400).json({ message: err.message || "Failed to upload company logo." });
    }
    next();
  });
};

export default uploadCompanyLogo;
