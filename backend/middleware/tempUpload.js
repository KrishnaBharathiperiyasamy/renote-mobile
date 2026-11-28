// tempUpload.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { ensureDir, resolveUploadPath } from "../utils/uploadPaths.js";

const tempDir = ensureDir(resolveUploadPath("temp"));

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const tempUpload = multer({
  storage: tempStorage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
}).single("file"); // <-- common field name

export default tempUpload;
