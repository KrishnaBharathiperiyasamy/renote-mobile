import crypto from "crypto";
import Poster from "../models/Poster.js";
import PosterFeedback from "../models/PosterFeedback.js";
import ShareableLink from "../models/shareableLinkSchema.js";
import { getUserPlan } from "../utilis/getUserPlan.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import mongoose from "mongoose";
import axios from "axios";
import { validatePosterInput } from "../utilis/validators.js";
import { getFolderSize,formatBytes } from "../utilis/folderSize.js";
import { compressImageTemp } from "../utilis/imageCompress.js";
import { compressVideoTemp, compressVideoTempCore } from "../utilis/videoCompress.js";
import fetch from "node-fetch";
import JSZip from "jszip";
import fs from "fs-extra";
import path from "path";
import { ensureDir, resolveStoredUploadPath, resolveUploadPath, UPLOAD_ROOT, UPLOAD_PUBLIC_PREFIX } from "../utils/uploadPaths.js";
import { resolveUserMongoId } from "../utils/resolveUser.js";

const saveImageFromBase64 = (base64Data, folder = resolveUploadPath()) => {
  if (!base64Data || typeof base64Data !== "string") return "";
  const matches = base64Data.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return base64Data;

  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const filePath = path.join(folder, fileName);
  ensureDir(folder);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${fileName}`;
};

const parsePosition = (val) => {
  if (!val) return { x: 0, y: 0 };
  if (typeof val === "object") return { x: Number(val.x) || 0, y: Number(val.y) || 0 };
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "object" && parsed !== null) {
        return { x: Number(parsed.x) || 0, y: Number(parsed.y) || 0 };
      }
    } catch {}
  }
  return { x: 0, y: 0 };
};

// Same id sanitizer used by posterUpload middleware. Keep in sync.
const sanitizeIdSegment = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "object" && value?._id) value = value._id;
  const str = String(value).trim();
  if (!str || str === "[object Object]") return "";
  const cleaned = str.replace(/[^a-zA-Z0-9_.-]/g, "");
  if (!cleaned || cleaned === "." || cleaned === "..") return "";
  return cleaned;
};

// Move a single stored asset (a `/uploads/...` path) from the old
// `{userId}/{oldCompanyId}/` sub-folder to `{userId}/{newCompanyId}/`.
// Returns the (possibly rewritten) public path. Files that don't live under
// the old company folder are left as-is so legacy/external assets are safe.
const movePosterAssetToCompany = async (
  storedPath,
  userId,
  oldCompanyId,
  newCompanyId
) => {
  if (!storedPath || typeof storedPath !== "string") return storedPath;
  const safeUser = sanitizeIdSegment(userId);
  const safeOld = sanitizeIdSegment(oldCompanyId);
  const safeNew = sanitizeIdSegment(newCompanyId);
  if (!safeUser || !safeNew || safeOld === safeNew) return storedPath;

  // Normalize "/uploads/..." -> relative path under UPLOAD_ROOT.
  const normalized = storedPath.replace(/\\/g, "/");
  const stripped = normalized.replace(/^\/?uploads\//, "");
  const parts = stripped.split("/").filter(Boolean);

  // Expect at least: {userId}/{companyId}/{filename}
  if (parts.length < 3) return storedPath;
  if (parts[0] !== safeUser) return storedPath;
  if (safeOld && parts[1] !== safeOld) return storedPath;

  const fileName = parts.slice(2).join("/");
  const oldAbs = resolveUploadPath(...parts);
  const newRelative = path.posix.join(safeUser, safeNew, fileName);
  const newAbs = resolveUploadPath(safeUser, safeNew, fileName);

  try {
    if (await fs.pathExists(oldAbs)) {
      await ensureDir(path.dirname(newAbs));
      await fs.move(oldAbs, newAbs, { overwrite: true });
    }
  } catch (err) {
    console.error("Failed to move poster asset:", oldAbs, "->", newAbs, err);
    return storedPath; // keep old reference on failure
  }

  return `${UPLOAD_PUBLIC_PREFIX}/${newRelative}`;
};

const normalizePathArrayInput = (value) => {
  if (value === undefined || value === null) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fall back to comma-separated input.
    }

    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const normalizeZoomValue = (value, fallback = 1) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return numeric;
};

const normalizeNumberArrayInput = (value) => {
  if (value === undefined || value === null) return [];

  if (Array.isArray(value)) {
    return value.map((item) => Number(item));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => Number(item));
      }
    } catch {
      // Fall back to comma-separated input.
    }

    return trimmed.split(",").map((item) => Number(item.trim()));
  }

  return [];
};

const buildGalleryZoomArray = (
  galleryImages,
  zoomInput,
  previousGalleryImages = [],
  previousGalleryZoom = []
) => {
  if (!Array.isArray(galleryImages) || galleryImages.length === 0) return [];

  const providedZoom = normalizeNumberArrayInput(zoomInput);
  if (providedZoom.length > 0) {
    return galleryImages.map((_, index) => normalizeZoomValue(providedZoom[index], 1));
  }

  const zoomByImage = new Map();
  if (Array.isArray(previousGalleryImages) && Array.isArray(previousGalleryZoom)) {
    previousGalleryImages.forEach((imagePath, index) => {
      zoomByImage.set(imagePath, normalizeZoomValue(previousGalleryZoom[index], 1));
    });
  }

  return galleryImages.map((imagePath) => zoomByImage.get(imagePath) ?? 1);
};

const normalizePositionValue = (value) => {
  if (!value || typeof value !== "object") {
    return { x: 0, y: 0 };
  }

  const x = Number(value.x);
  const y = Number(value.y);

  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
  };
};

const normalizePositionArrayInput = (value) => {
  if (value === undefined || value === null) return [];

  if (Array.isArray(value)) {
    return value.map((item) => normalizePositionValue(item));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => normalizePositionValue(item));
      }
    } catch {
      // Ignore invalid JSON and fall back to defaults.
    }
  }

  return [];
};

const buildGalleryPositionArray = (
  galleryImages,
  positionInput,
  previousGalleryImages = [],
  previousGalleryPositions = []
) => {
  if (!Array.isArray(galleryImages) || galleryImages.length === 0) return [];

  const providedPositions = normalizePositionArrayInput(positionInput);
  if (providedPositions.length > 0) {
    return galleryImages.map((_, index) =>
      normalizePositionValue(providedPositions[index])
    );
  }

  const positionByImage = new Map();
  if (
    Array.isArray(previousGalleryImages) &&
    Array.isArray(previousGalleryPositions)
  ) {
    previousGalleryImages.forEach((imagePath, index) => {
      positionByImage.set(
        imagePath,
        normalizePositionValue(previousGalleryPositions[index])
      );
    });
  }

  return galleryImages.map(
    (imagePath) => positionByImage.get(imagePath) ?? { x: 0, y: 0 }
  );
};

// ---------------------------------------------------------------------------
// Export / Import helpers (used by downloadPostersAsZip + uploadPostersFromZip)
// ---------------------------------------------------------------------------

/**
 * Read a poster asset into a Buffer.
 *  - Remote URLs (http/https)         -> fetched
 *  - Stored upload paths (/uploads/.) -> read from the local UPLOAD_ROOT
 * Returns `null` when the asset is missing or unreadable so the caller can
 * skip it without aborting the whole export.
 */
const readPosterAssetBuffer = async (assetPath) => {
  if (!assetPath) return null;
  try {
    if (assetPath.startsWith("http")) {
      const buf = await fetch(assetPath).then((r) => r.arrayBuffer());
      return Buffer.from(buf);
    }
    const localPath = resolveStoredUploadPath(assetPath);
    if (fs.existsSync(localPath)) return fs.readFileSync(localPath);
    console.warn("Local file not found:", localPath);
  } catch (err) {
    console.warn("Failed to read poster asset:", assetPath, err.message);
  }
  return null;
};

/**
 * Get the first folder segment of a zip entry path. Each exported poster
 * lives in its own top-level folder (e.g. "MyPoster_POS-3/..."), so the
 * first segment uniquely identifies the poster within the archive.
 */
const getZipPosterKey = (entryPath) => {
  const parts = String(entryPath || "").split("/").filter(Boolean);
  return parts[0] || null;
};

/**
 * Pull the numeric suffix from gallery filenames so we can restore the
 * original ordering on import (e.g. "product_gallery_images_2.png" -> 2).
 */
const getGalleryOrder = (fileName) => {
  const match = String(fileName || "").match(/product_gallery_images_(\d+)/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

/**
 * Build a unique on-disk filename inside `uploadDirectory` for an imported
 * asset. Combines a timestamp + random token with a sanitised version of
 * the poster key and original name so collisions across users/posters are
 * effectively impossible.
 */
const makeUniqueUploadFilePath = (uploadDirectory, posterKey, originalName) => {
  const ext = path.extname(originalName || "") || ".bin";
  const baseName = path
    .basename(originalName || "file", ext)
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueToken = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safeKey = String(posterKey || "poster").replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(uploadDirectory, `${uniqueToken}_${safeKey}_${baseName}${ext}`);
};

// ---------------------------------------------------------------------------
// POST /posters/download-zip
// Bundle the selected posters (metadata + binary assets) into a single zip
// and stream it back to the client.
// ---------------------------------------------------------------------------
const downloadPostersAsZip = async (req, res) => {
  try {
    // 1. Validate the input ids — only accept 24-char Mongo ObjectIds.
    const { ids } = req.body;
    const validIds = (ids || []).filter(
      (id) => typeof id === "string" && id.trim().length === 24
    );
    if (!validIds.length) {
      return res.status(400).json({ message: "No valid MongoDB IDs provided." });
    }

    // 2. Load matching posters from DB.
    const posters = await Poster.find({ _id: { $in: validIds } });
    if (!posters.length) {
      return res.status(404).json({ message: "No posters found for given IDs." });
    }

    // 3. Build the zip in memory. Each poster gets its own folder containing
    //    a metadata.json plus any binary assets that still exist on disk.
    const zip = new JSZip();
    for (const poster of posters) {
      const folder = zip.folder(`${poster.poster_name}_${poster.posterId}`);

      // Always include the full document so import can reconstruct fields
      // even when binaries are missing.
      folder.file("metadata.json", JSON.stringify(poster.toObject(), null, 2));

      // -- product_image (single) --
      const productBuffer = await readPosterAssetBuffer(poster.product_image);
      if (productBuffer) {
        const ext = path.extname(poster.product_image) || ".bin";
        folder.file(`product_image${ext}`, productBuffer);
      }

      // -- product_gallery_images (ordered) --
      const galleryImages = Array.isArray(poster.product_gallery_images)
        ? poster.product_gallery_images
        : [];
      for (let i = 0; i < galleryImages.length; i++) {
        const imagePath = galleryImages[i];
        const galleryBuffer = await readPosterAssetBuffer(imagePath);
        if (!galleryBuffer) continue;
        const ext = path.extname(imagePath) || ".bin";
        // The numeric suffix preserves order on re-import.
        folder.file(`product_gallery_images_${i + 1}${ext}`, galleryBuffer);
      }

      // -- company_logo (single) --
      const logoBuffer = await readPosterAssetBuffer(poster.company_logo);
      if (logoBuffer) {
        const ext = path.extname(poster.company_logo) || ".bin";
        folder.file(`company_logo${ext}`, logoBuffer);
      }
    }

    // 4. Materialise the zip on disk under ./tmp so we can use res.download
    //    (which sets headers + handles streaming cleanly).
    const zipContent = await zip.generateAsync({ type: "nodebuffer" });
    const tempDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const fileName = `posters_${Date.now()}.zip`;
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, zipContent);

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=${fileName}`,
    });

    // 5. Stream to client and clean up the temp file when finished.
    res.download(filePath, fileName, (err) => {
      if (err) console.error("Download error:", err);
      try { fs.unlinkSync(filePath); } catch {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to export posters", error });
  }
};

// ---------------------------------------------------------------------------
// POST /posters/upload-zip
// Inverse of downloadPostersAsZip. Reads each poster folder out of the
// uploaded archive, writes its binary assets back under the importing user's
// /uploads/{userId}/ directory, and creates a fresh Poster document.
// ---------------------------------------------------------------------------
const uploadPostersFromZip = async (req, res) => {
  try {
    // 0. Basic input validation.
    if (!req.file)
      return res.status(400).json({ message: "No zip file uploaded." });
    const zipPath = req.file.path;
    const userId = req.body.userId;

    // 1. Load the archive into memory.
    const zipBuffer = await fs.readFile(zipPath);
    const zip = await JSZip.loadAsync(zipBuffer);

    // 2. First pass — walk every entry once and bucket it by poster folder:
    //      postersData[posterKey] = parsed metadata.json
    //      imageMap[posterKey]    = [{ name, zipEntry }, ...]
    const postersData = {};
    const imageMap = {};

    for (const [entryPath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      const posterKey = getZipPosterKey(entryPath);
      if (!posterKey) continue;

      // Metadata file for this poster.
      if (entryPath.endsWith("metadata.json")) {
        try {
          postersData[posterKey] = JSON.parse(await zipEntry.async("string"));
        } catch (e) {
          console.log("Invalid metadata.json", entryPath);
        }
        continue;
      }

      // Any of the known asset name prefixes.
      const baseName = path.basename(entryPath);
      const isAsset =
        baseName.includes("product_image") ||
        baseName.includes("product_gallery_images") ||
        baseName.includes("company_logo");
      if (isAsset) {
        if (!imageMap[posterKey]) imageMap[posterKey] = [];
        imageMap[posterKey].push({ name: baseName, zipEntry });
      }
    }

    if (Object.keys(postersData).length === 0) {
      return res.status(400).json({ message: "No metadata.json found in zip." });
    }

    // 3. Resolve the importing user's per-user upload directory. All
    //    extracted assets land here, mirroring the createPoster layout
    //    (/uploads/{userId}/<file>) so the same Express static handler
    //    serves them on every environment.
    const safeUserSegment = sanitizeIdSegment(userId);
    const uploadSubSegments = safeUserSegment ? [safeUserSegment] : [];
    const uploadDir = resolveUploadPath(...uploadSubSegments);
    await fs.ensureDir(uploadDir);

    // 4. Cache the next POS-N counter per user so we issue one DB lookup
    //    even when many posters are imported in a single zip.
    const userPosterCounts = {};
    const importedPosters = [];

    // 5. Second pass — create one Poster per metadata entry.
    for (const posterKey of Object.keys(postersData)) {
      const metadata = postersData[posterKey];

      // Seed the counter from the user's most recent posterId once.
      if (userPosterCounts[userId] === undefined) {
        const last = await Poster.findOne({ user_id: userId }).sort({ createdAt: -1 });
        let lastNum = 0;
        if (last?.posterId?.startsWith("POS-")) {
          lastNum = parseInt(last.posterId.replace("POS-", ""), 10) || 0;
        }
        userPosterCounts[userId] = lastNum;
      }
      userPosterCounts[userId]++;
      const newPosterId = `POS-${userPosterCounts[userId]}`;

      // Construct the document from metadata. Asset URLs are filled in
      // below once the binaries have been written to disk.
      const newPoster = new Poster({
        posterId: newPosterId,
        poster_name: metadata.poster_name,
        poster_title: metadata.poster_title,
        product_name: metadata.product_name,
        product_description: metadata.product_description,
        product_price: metadata.product_price,
        user_id: userId,
        template: metadata.template,
        theme: metadata.theme,
        aspect_ratio: metadata.aspect_ratio || "1:1",
        custom_colors: metadata.custom_colors || null,
        isHeart: false,
        logo_zoom: metadata.logo_zoom || 1,
        product_zoom: metadata.product_zoom || 1,
        product_gallery_zoom: [],
        product_gallery_positions: [],
        logo_position: metadata.logo_position || { x: 0, y: 0 },
        product_position: metadata.product_position || { x: 0, y: 0 },
        product_gallery_images: [],
      });

      // 5a. Write each asset to the user's upload directory, preserving
      //     gallery ordering via the numeric suffix from export.
      if (imageMap[posterKey]) {
        const orderedImages = [...imageMap[posterKey]].sort((a, b) => {
          const aIsGallery = a.name.includes("product_gallery_images");
          const bIsGallery = b.name.includes("product_gallery_images");
          if (aIsGallery && bIsGallery) {
            return getGalleryOrder(a.name) - getGalleryOrder(b.name);
          }
          if (aIsGallery) return 1;   // galleries go after singles
          if (bIsGallery) return -1;
          return a.name.localeCompare(b.name);
        });

        for (const img of orderedImages) {
          const outputFile = makeUniqueUploadFilePath(uploadDir, posterKey, img.name);
          const buffer = await img.zipEntry.async("nodebuffer");
          await fs.writeFile(outputFile, buffer);

          // The DB must store a public URL (`/uploads/{userId}/<file>`),
          // not the absolute filesystem path — otherwise the frontend
          // can't render the image. UPLOAD_PUBLIC_PREFIX comes from
          // utils/uploadPaths.js so this works on every environment.
          const publicRelative = [
            ...uploadSubSegments,
            path.basename(outputFile),
          ].join("/");
          const publicPath = `${UPLOAD_PUBLIC_PREFIX}/${publicRelative}`;

          // Check company_logo and gallery before product_image so the
          // shorter "product_image" substring doesn't accidentally match
          // anything else.
          if (img.name.includes("company_logo")) {
            newPoster.company_logo = publicPath;
          } else if (img.name.includes("product_gallery_images")) {
            newPoster.product_gallery_images.push(publicPath);
          } else if (img.name.includes("product_image")) {
            newPoster.product_image = publicPath;
          }
        }
      }

      // 5b. Fallback — if the zip was created on a server where the
      //     original binaries no longer existed, downloadPostersAsZip
      //     silently skipped them. In that case we still want a
      //     non-empty URL on the document, so reuse whatever metadata
      //     pointed at originally (it may be remote / external).
      if (!newPoster.product_image && metadata.product_image) {
        newPoster.product_image = metadata.product_image;
      }
      if (!newPoster.company_logo && metadata.company_logo) {
        newPoster.company_logo = metadata.company_logo;
      }
      if (
        newPoster.product_gallery_images.length === 0 &&
        Array.isArray(metadata.product_gallery_images)
      ) {
        newPoster.product_gallery_images = metadata.product_gallery_images.filter(
          (p) => typeof p === "string" && p.trim().length > 0
        );
      }

      if (!newPoster.product_image) {
        console.warn(
          `Imported poster "${posterKey}" has no product_image — zip contained no image and metadata.product_image was empty.`
        );
      }

      // 5c. Rebuild the per-image zoom + position arrays so their length
      //     always matches the final gallery list.
      newPoster.product_gallery_zoom = buildGalleryZoomArray(
        newPoster.product_gallery_images,
        metadata.product_gallery_zoom
      );
      newPoster.product_gallery_positions = buildGalleryPositionArray(
        newPoster.product_gallery_images,
        metadata.product_gallery_positions
      );

      await newPoster.save();
      importedPosters.push(newPoster);
    }

    // 6. Clean up the uploaded zip from disk.
    await fs.remove(zipPath);

    return res.json({
      message: `${importedPosters.length} posters imported successfully.`,
      posters: importedPosters,
    });
  } catch (error) {
    console.error("❌ Import error:", error);
    return res.status(500).json({ message: "Failed to import posters", error });
  }
};

const getNextPosterId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "UserId is required" });
    }

    const targetUserId = await resolveUserMongoId(userId, req.user);

    // Find the last poster for this user
    const lastPoster = await Poster.find(targetUserId ? { user_id: targetUserId } : {})
      .sort({ createdAt: -1 })
      .limit(1);

    let maxNum = 0;
    if (lastPoster.length) {
      const lastId = lastPoster[0].posterId; // e.g., "POS-2"
      if (lastId?.startsWith("POS-")) {
        maxNum = parseInt(lastId.replace("POS-", ""), 10);
      }
    }

    const newPosterId = "POS-" + (maxNum + 1);

    res.status(200).json({ posterId: newPosterId });
  } catch (error) {
    console.error("Error generating posterId:", error);
    res.status(500).json({ message: "Failed to generate posterId" });
  }
};

const createPoster = async (req, res) => {
  try {
    const { userId } = req.params;

    const targetUserId = await resolveUserMongoId(userId, req.user);
    if (!targetUserId) {
      return res.status(404).json({ error: "User not found" });
    }

    // --- Plan-based poster creation and storage limit ---
    let plan, maxPostersPerMonth, maxVideoStorageMB;
    try {
      plan = await getUserPlan(targetUserId);
      maxPostersPerMonth = plan?.features?.maxPostersPerMonth ?? 5;
      maxVideoStorageMB = plan?.features?.maxVideoStorageMB ?? 75;
    } catch (e) {
      return res.status(500).json({ error: "Could not determine user plan. Please try again later." });
    }
    // 1. Poster count limit
    if (maxPostersPerMonth !== -1) { // -1 means unlimited
      try {
        // Count posters created by user in the current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        const postersThisMonth = await Poster.countDocuments({
          user_id: targetUserId,
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        });
        if (postersThisMonth >= maxPostersPerMonth) {
          return res.status(403).json({
            error: "Plan limit reached",
            message: `Your plan allows only ${maxPostersPerMonth} poster(s) per month. Please upgrade your plan to add more.`
          });
        }
      } catch (e) {
        console.error("Error counting user posters:", e);
        return res.status(500).json({ error: "Could not check poster limit. Please try again later." });
      }
    }
    // 2. Storage limit (sum all company folders for this user)
    if (maxVideoStorageMB !== -1) { // -1 means unlimited
      // Find all companies for this user
      const companies = await Company.find({ userId: targetUserId, isDeleted: false });
      let totalBytes = 0;
      const companyStorageDetails = [];
      for (const company of companies) {
        const companyFolder = resolveUploadPath(company.userId.toString(), company._id.toString());
        const folderExists = fs.existsSync(companyFolder);
        let sizeBytes = 0;
        if (folderExists) {
          sizeBytes = getFolderSize(companyFolder);
        }
        totalBytes += sizeBytes;
        companyStorageDetails.push({
          companyId: company._id,
          companyName: company.name,
          companyFolder,
          folderExists,
          sizeBytes,
          totalConsumedSpace: formatBytes(sizeBytes)
        });
      }
      const maxBytes = maxVideoStorageMB * 1024 * 1024;
      if (totalBytes >= maxBytes) {
        return res.status(403).json({
          error: "Storage limit reached",
          message: `Your plan allows only ${maxVideoStorageMB} MB total uploads. Storage exceeded. Please upgrade your plan to add more storage or delete files to free up space.`
        });
      }
    }

    // ...existing code...
    const {
      poster_title,
      product_name,
      product_description,
      product_price,
      logo_zoom,
      product_zoom,
      logo_position,
      product_position,
      template,
      theme,
      aspect_ratio,
      custom_colors,
      product_gallery_zoom: bodyProductGalleryZoom,
      product_gallery_positions: bodyProductGalleryPositions,
      tempFileName,
      product_image: bodyProductImage,
      product_gallery_images: bodyProductGalleryImages,
      company_logo: bodyCompanyLogo,
      company_id,
      tags, // 🆕 Extract tags
      marketplaceCategory,
      marketplaceSubcategory,
    } = req.body;

    let {
      errors,
      product_image,
      product_gallery_images,
      company_logo,
    } = validatePosterInput(req.body, req.files);

    // fallback if no file uploaded
    product_image ||= bodyProductImage;
    if (!product_gallery_images.length) {
      product_gallery_images = normalizePathArrayInput(bodyProductGalleryImages);
    }
    const finalGalleryZoom = buildGalleryZoomArray(
      product_gallery_images,
      bodyProductGalleryZoom
    );
    const finalGalleryPositions = buildGalleryPositionArray(
      product_gallery_images,
      bodyProductGalleryPositions
    );
    company_logo ||= bodyCompanyLogo || "uploads/companies/default-company/logo-1779622107439-878996187.webp";

    // Convert Base64 data URLs if present
    if (product_image && typeof product_image === "string" && product_image.startsWith("data:image/")) {
      product_image = saveImageFromBase64(product_image);
    }
    if (company_logo && typeof company_logo === "string" && company_logo.startsWith("data:image/")) {
      company_logo = saveImageFromBase64(company_logo);
    }

    // --- Move temp file if exists ---
    let fileSizeBytes = 0;
    let isVideo = false;
    if (tempFileName) {
      const tempPath = resolveUploadPath("temp", tempFileName);
      // Place finalised temp file under the same user/company folder
      // structure that multer uses for direct uploads so all assets
      // for a poster stay co-located (e.g. /uploads/{userId}/{companyId}/<file>).
      const effectiveUserId = sanitizeIdSegment(targetUserId.toString());
      const effectiveCompanyId = sanitizeIdSegment(company_id);
      const subDirSegments = [];
      if (effectiveUserId) subDirSegments.push(effectiveUserId);
      if (effectiveUserId && effectiveCompanyId) subDirSegments.push(effectiveCompanyId);
      const destDir = resolveUploadPath(...subDirSegments);
      await ensureDir(destDir);
      const finalPath = path.join(destDir, tempFileName);
      if (fs.existsSync(tempPath)) {
        await fs.rename(tempPath, finalPath);
      }
      const publicRelative = [...subDirSegments, tempFileName].join("/");
      product_image = `/uploads/${publicRelative}`;
      // Track file size and type
      try {
        const stat = await fs.stat(finalPath);
        fileSizeBytes = stat.size;
      } catch {}
      const ext = path.extname(tempFileName).toLowerCase();
      isVideo = ['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext);
    }

    if (errors.length > 0 && !product_image)
      return res.status(400).json({ error: "Validation failed", details: errors });

    const existingPosters = await Poster.find({ user_id: targetUserId });

    // --- Sequential posterId ---
    const maxNum = existingPosters.length
      ? Math.max(...existingPosters.map((p) => parseInt(p.posterId?.replace("POS-", ""), 10) || 0))
      : 0;

    const newPosterId = "POS-" + (maxNum + 1);

    // 🧠 Normalize tags input (accepts both array or CSV string)
    let formattedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        formattedTags = tags.map(tag => tag.trim());
      } else if (typeof tags === "string") {
        formattedTags = tags.split(",").map(tag => tag.trim()).filter(Boolean);
      }
    }

    // --- Save new poster ---
    const newPoster = new Poster({
      posterId: newPosterId,
      poster_name: poster_title,
      poster_title,
      product_name,
      product_description,
      product_price: product_price ? Math.min(99999999, Math.max(0, Number(product_price))) : 0,
      user_id: targetUserId,
      product_image,
      product_gallery_images,
      product_gallery_zoom: finalGalleryZoom,
      product_gallery_positions: finalGalleryPositions,
      company_logo,
      logo_zoom: logo_zoom ? Number(logo_zoom) : 1,
      product_zoom: product_zoom ? Number(product_zoom) : 1,
      logo_position: parsePosition(logo_position),
      template: template || "frame1",
      templateCategory: req.body.templateCategory || "Classic",
      colorThemeId: req.body.colorThemeId || "flame-orange",
      bgTypeId: req.body.bgTypeId || "clean-white",
      customBgColor: req.body.customBgColor || null,
      backgroundImage: req.body.backgroundImage || null,
      fontFamilyId: req.body.fontFamilyId || "serif",
      fontColor: req.body.fontColor || null,
      titleSize: req.body.titleSize || "lg",
      isUppercase: req.body.isUppercase !== undefined ? req.body.isUppercase : true,
      textAlign: req.body.textAlign || "center",
      borderThickness: req.body.borderThickness !== undefined ? Number(req.body.borderThickness) : 4,
      showPriceTag: req.body.showPriceTag !== undefined ? req.body.showPriceTag : true,
      imageZoom: req.body.imageZoom ? Number(req.body.imageZoom) : (product_zoom ? Number(product_zoom) : 1),
      imagePosition: req.body.imagePosition ? parsePosition(req.body.imagePosition) : parsePosition(product_position),
      neonEffect: req.body.neonEffect !== undefined ? req.body.neonEffect : false,
      theme: theme || "orangePink",
      aspect_ratio: aspect_ratio || "3:4",
      custom_colors: custom_colors || null,
      company_id: company_id || null,
      tags: formattedTags,
      marketplaceCategory: marketplaceCategory || "Amazon",
      marketplaceSubcategory: marketplaceSubcategory || "Electronics & Accessories",
      stickers: Array.isArray(req.body.stickers) ? req.body.stickers : [],
      fileSizeBytes,
      isVideo,
    });

    // Auto-assign company_id from first vendor company if not provided
    if (!newPoster.company_id) {
      const firstVendor = await Company.findOne({ userId: targetUserId, flag: "vendor", isDeleted: false }).sort({ createdAt: 1 });
      if (firstVendor) newPoster.company_id = firstVendor._id;
    }

    await newPoster.save();

    return res.json({
      success: true,
      tempFileName: newPoster.product_image || tempFileName,
      poster: newPoster.toObject(),
    });

  } catch (error) {
    console.error("Error creating poster:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

const updatePoster = async (req, res) => {
  try {
    const { id } = req.params;
    let poster = req.posterDoc;
    if (!poster) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        poster = await Poster.findById(id);
      }
      if (!poster) {
        poster = await Poster.findOne({ posterId: id });
      }
    }
    if (!poster) return res.status(404).json({ error: "Poster not found" });

    // Validate inputs
    let {
      errors,
      product_image,
      product_gallery_images,
      company_logo,
    } = validatePosterInput(
      req.body,
      req.files,
      poster
    );

    // Ignore missing image/logo if already exists
    const filteredErrors = errors.filter((err) => {
      if (err === "Product image or video is required" && (poster.product_image || req.body.product_image)) return false;
      if (err === "Product image is required" && (poster.product_image || req.body.product_image)) return false;
      if (err === "Company logo is required" && (poster.company_logo || req.body.company_logo)) return false;
      return true;
    });

    if (filteredErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: filteredErrors,
      });
    }

    const {
      tempFileName,
      poster_title,
      product_name,
      product_description,
      product_price,
      logo_zoom,
      product_zoom,
      logo_position,
      product_position,
      template,
      theme,
      aspect_ratio,
      custom_colors,
      company_id,
      product_gallery_images: bodyProductGalleryImages,
      product_gallery_zoom: bodyProductGalleryZoom,
      product_gallery_positions: bodyProductGalleryPositions,
      remove_gallery_images,
      gallery_update_mode,
      tags, // 🆕 tags input
    } = req.body;

    // --- Resolve effective company change (used for both new temp file
    //     placement and migrating existing assets). ---
    const effectiveUserId = sanitizeIdSegment(poster.user_id);
    const oldCompanyId = sanitizeIdSegment(poster.company_id);
    const requestedCompanyId = sanitizeIdSegment(company_id);
    const newCompanyId = requestedCompanyId || oldCompanyId;
    const companyChanged =
      requestedCompanyId &&
      oldCompanyId &&
      requestedCompanyId !== oldCompanyId;

    // --- File handling ---
    let finalPath;
    let fileSizeBytes = poster.fileSizeBytes || 0;
    let isVideo = poster.isVideo || false;
    if (tempFileName && fs.existsSync(resolveUploadPath("temp", tempFileName))) {
      const tempPath = resolveUploadPath("temp", tempFileName);
      const finalFileName = Date.now() + "-final-" + tempFileName;
      // Place the finalised temp file under the same user/company folder
      // structure used by multer so all assets stay co-located.
      const subDirSegments = [];
      if (effectiveUserId) subDirSegments.push(effectiveUserId);
      if (effectiveUserId && newCompanyId) subDirSegments.push(newCompanyId);
      const destDir = resolveUploadPath(...subDirSegments);
      await ensureDir(destDir);
      finalPath = path.join(destDir, finalFileName);
      await fs.rename(tempPath, finalPath);
      const publicRelative = [...subDirSegments, finalFileName].join("/");
      product_image = `/uploads/${publicRelative}`;
      try {
        const stat = await fs.stat(finalPath);
        fileSizeBytes = stat.size;
      } catch {}
      const ext = path.extname(tempFileName).toLowerCase();
      isVideo = ['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext);
    } else if (req.files?.product_image?.length > 0) {
      // Validator already produced the correctly nested public path
      // (e.g. /uploads/{userId}/{companyId}/<file>) — keep it.
      product_image = product_image || poster.product_image;
    } else {
      product_image = product_image || req.body.product_image || poster.product_image;
    }

    // For company_logo, prefer the validator's nested path; fall back to
    // req.body.company_logo then any pre-existing logo on the poster.
    company_logo = company_logo || req.body.company_logo || poster.company_logo;

    let finalGalleryImages = Array.isArray(poster.product_gallery_images)
      ? [...poster.product_gallery_images]
      : [];

    if (product_gallery_images.length > 0) {
      const mode = String(gallery_update_mode || "append").toLowerCase();
      if (mode === "replace") {
        finalGalleryImages = [...product_gallery_images];
      } else {
        finalGalleryImages = [
          ...new Set([...finalGalleryImages, ...product_gallery_images]),
        ];
      }
    } else if (bodyProductGalleryImages !== undefined) {
      finalGalleryImages = normalizePathArrayInput(bodyProductGalleryImages);
    }

    if (remove_gallery_images !== undefined) {
      const removeList = normalizePathArrayInput(remove_gallery_images);
      if (removeList.length > 0) {
        finalGalleryImages = finalGalleryImages.filter(
          (imagePath) => !removeList.includes(imagePath)
        );
      }
    }

    if (finalGalleryImages.length > 4) {
      return res.status(400).json({
        error: "Gallery limit exceeded. You can have at most 4 extra images (5 total including the primary image).",
      });
    }

    const finalGalleryZoom = buildGalleryZoomArray(
      finalGalleryImages,
      bodyProductGalleryZoom,
      poster.product_gallery_images,
      poster.product_gallery_zoom
    );
    const finalGalleryPositions = buildGalleryPositionArray(
      finalGalleryImages,
      bodyProductGalleryPositions,
      poster.product_gallery_images,
      poster.product_gallery_positions
    );

    // --- If the company changed, migrate any pre-existing assets that
    //     still live under the old `{userId}/{oldCompanyId}/` folder to
    //     `{userId}/{newCompanyId}/`. Newly uploaded files in this request
    //     were already saved into the new folder by multer, so they are
    //     no-ops here. Zoom/position arrays were already built above
    //     against the original paths and don't need to change. ---
    if (companyChanged && effectiveUserId) {
      product_image = await movePosterAssetToCompany(
        product_image,
        effectiveUserId,
        oldCompanyId,
        newCompanyId
      );
      company_logo = await movePosterAssetToCompany(
        company_logo,
        effectiveUserId,
        oldCompanyId,
        newCompanyId
      );
      finalGalleryImages = await Promise.all(
        finalGalleryImages.map((p) =>
          movePosterAssetToCompany(
            p,
            effectiveUserId,
            oldCompanyId,
            newCompanyId
          )
        )
      );
    }

    // 🧠 Normalize tags input
    let formattedTags = poster.tags; // keep existing if not provided

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        formattedTags = tags.map((t) => t.trim());
      } else if (typeof tags === "string") {
        formattedTags = tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      } else if (tags === "") {
        formattedTags = []; // if user clears tags
      }
    }

    // --- Build update object ---
    const resolvedPosterTitle = poster_title || req.body.poster_name || req.body.title || poster.poster_title || poster.poster_name;

    // Convert Base64 data URLs if present
    if (product_image && typeof product_image === "string" && product_image.startsWith("data:image/")) {
      product_image = saveImageFromBase64(product_image);
    }
    if (company_logo && typeof company_logo === "string" && company_logo.startsWith("data:image/")) {
      company_logo = saveImageFromBase64(company_logo);
    }

    let parsedStickers = poster.stickers || [];
    if (req.body.stickers !== undefined) {
      if (Array.isArray(req.body.stickers)) {
        parsedStickers = req.body.stickers;
      } else if (typeof req.body.stickers === "string") {
        try {
          parsedStickers = JSON.parse(req.body.stickers);
        } catch {
          parsedStickers = [];
        }
      }
    }

    const updateData = {
      poster_name: resolvedPosterTitle,
      poster_title: resolvedPosterTitle,
      product_name: product_name || req.body.productName || poster.product_name,
      product_description: product_description !== undefined ? product_description : (req.body.description !== undefined ? req.body.description : poster.product_description),
      product_price:
        product_price !== undefined && product_price !== ""
          ? Math.min(99999999, Math.max(0, Number(product_price)))
          : (req.body.price !== undefined && req.body.price !== "" ? Math.min(99999999, Math.max(0, Number(req.body.price))) : poster.product_price),
      product_image,
      product_gallery_images: finalGalleryImages,
      product_gallery_zoom: finalGalleryZoom,
      product_gallery_positions: finalGalleryPositions,
      company_logo,
      logo_zoom: req.body.logo_zoom !== undefined ? Number(req.body.logo_zoom) : (req.body.logoZoom !== undefined ? Number(req.body.logoZoom) : (logo_zoom ? Number(logo_zoom) : poster.logo_zoom)),
      product_zoom: req.body.imageZoom !== undefined ? Number(req.body.imageZoom) : (product_zoom ? Number(product_zoom) : poster.product_zoom),
      logo_position: req.body.logo_position !== undefined ? parsePosition(req.body.logo_position) : (req.body.logoPosition !== undefined ? parsePosition(req.body.logoPosition) : (logo_position !== undefined ? parsePosition(logo_position) : poster.logo_position)),
      template: template || req.body.template || poster.template,
      templateCategory: req.body.templateCategory !== undefined ? req.body.templateCategory : (poster.templateCategory || "Classic"),
      colorThemeId: req.body.colorThemeId !== undefined ? req.body.colorThemeId : (poster.colorThemeId || "flame-orange"),
      bgTypeId: req.body.bgTypeId !== undefined ? req.body.bgTypeId : (poster.bgTypeId || "clean-white"),
      customBgColor: req.body.customBgColor !== undefined ? req.body.customBgColor : poster.customBgColor,
      backgroundImage: req.body.backgroundImage !== undefined ? req.body.backgroundImage : poster.backgroundImage,
      fontFamilyId: req.body.fontFamilyId !== undefined ? req.body.fontFamilyId : (poster.fontFamilyId || "serif"),
      fontColor: req.body.fontColor !== undefined ? req.body.fontColor : poster.fontColor,
      titleSize: req.body.titleSize !== undefined ? req.body.titleSize : (poster.titleSize || "lg"),
      isUppercase: req.body.isUppercase !== undefined ? req.body.isUppercase : (poster.isUppercase !== undefined ? poster.isUppercase : true),
      textAlign: req.body.textAlign !== undefined ? req.body.textAlign : (poster.textAlign || "center"),
      borderThickness: req.body.borderThickness !== undefined ? Number(req.body.borderThickness) : (poster.borderThickness || 4),
      showPriceTag: req.body.showPriceTag !== undefined ? req.body.showPriceTag : (poster.showPriceTag !== undefined ? poster.showPriceTag : true),
      imageZoom: req.body.imageZoom !== undefined ? Number(req.body.imageZoom) : (product_zoom ? Number(product_zoom) : (poster.imageZoom || poster.product_zoom || 1)),
      imagePosition: req.body.imagePosition !== undefined ? parsePosition(req.body.imagePosition) : (product_position !== undefined ? parsePosition(product_position) : (poster.imagePosition || poster.product_position)),
      neonEffect: req.body.neonEffect !== undefined ? req.body.neonEffect : (poster.neonEffect || false),
      theme: theme || poster.theme,
      aspect_ratio: aspect_ratio || poster.aspect_ratio || "3:4",
      custom_colors: custom_colors !== undefined ? custom_colors : (req.body.customAccentColor !== undefined ? req.body.customAccentColor : poster.custom_colors),
      customSecondaryColor: req.body.customSecondaryColor !== undefined ? req.body.customSecondaryColor : poster.customSecondaryColor,
      company_id: (typeof company_id === "object" && company_id?._id ? company_id._id : company_id) || poster.company_id || null,
      tags: formattedTags,
      marketplaceCategory: req.body.marketplaceCategory || poster.marketplaceCategory || "Amazon",
      marketplaceSubcategory: req.body.marketplaceSubcategory || poster.marketplaceSubcategory || "Electronics & Accessories",
      stickers: parsedStickers,
      fileSizeBytes,
      isVideo,
      updatedAt: new Date(),
    };

    const updatedPoster = await Poster.findByIdAndUpdate(poster._id, updateData, { new: true });

    res.json({ message: "Poster updated successfully", poster: updatedPoster });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const duplicatePoster = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing poster ID" });

    // 1. Locate source poster
    let originalPoster = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      originalPoster = await Poster.findById(id);
    }
    if (!originalPoster) {
      originalPoster = await Poster.findOne({ posterId: id });
    }
    if (!originalPoster) {
      return res.status(404).json({ error: "Original poster not found" });
    }

    // 2. Resolve target user ID
    let targetUserId = req.user?._id || req.user?.authId || req.body?.userId || originalPoster.user_id;
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      const u = await User.findOne({ authId: targetUserId });
      if (u) targetUserId = u._id;
      else targetUserId = originalPoster.user_id;
    }

    // 3. Generate sequential posterId for this user
    const existingPosters = await Poster.find({ user_id: targetUserId });
    const maxNum = existingPosters.length
      ? Math.max(...existingPosters.map((p) => parseInt(p.posterId?.replace("POS-", ""), 10) || 0))
      : 0;
    const newPosterId = "POS-" + (maxNum + 1);

    // 4. Resolve company_id: preserve original company if owned by user, or assign user's vendor company
    let targetCompanyId = req.body?.company_id;
    try {
      if (!targetCompanyId && originalPoster.company_id) {
        const companyBelongsToUser = await Company.findOne({ _id: originalPoster.company_id, userId: targetUserId, isDeleted: false });
        if (companyBelongsToUser) {
          targetCompanyId = originalPoster.company_id;
        }
      }
      if (!targetCompanyId) {
        const firstVendor = await Company.findOne({ userId: targetUserId, flag: "vendor", isDeleted: false }).sort({ createdAt: 1 });
        if (firstVendor) targetCompanyId = firstVendor._id;
        else targetCompanyId = originalPoster.company_id || null;
      }
    } catch {
      targetCompanyId = targetCompanyId || originalPoster.company_id || null;
    }

    // 5. Clone poster data cleanly
    const origObj = typeof originalPoster.toObject === "function" ? originalPoster.toObject() : { ...originalPoster };
    delete origObj._id;
    delete origObj.__v;
    delete origObj.createdAt;
    delete origObj.updatedAt;

    const sourceTitle = origObj.poster_title || origObj.poster_name || origObj.product_name || "Poster";
    const duplicatedTitle = `${sourceTitle} (Copy)`;

    const duplicatedData = {
      ...origObj,
      posterId: newPosterId,
      poster_name: duplicatedTitle,
      poster_title: duplicatedTitle,
      user_id: targetUserId,
      company_id: targetCompanyId,
      isHeart: false,
      // Fresh marketplace & link state for isolated duplicate
      shareableLinkToken: null,
      shareableLinkId: null,
      isPublishedToMarketplace: false,
      publishedAt: null,
      publishedContentHash: null,
      publishedVersion: 0,
      viewsCount: 0,
      likesCount: 0,
      dislikesCount: 0,
      ratingSum: 0,
      ratingCount: 0,
      averageRating: 0,
      isSold: false,
      soldAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newPoster = new Poster(duplicatedData);
    await newPoster.save();

    return res.status(201).json({
      success: true,
      message: "Poster duplicated successfully",
      poster: typeof newPoster.toObject === "function" ? newPoster.toObject() : newPoster,
    });
  } catch (error) {
    console.error("Error duplicating poster:", error);
    return res.status(500).json({ error: error.message || "Failed to duplicate poster" });
  }
};

const DEFAULT_POSTER_USER_ID = "69d362ca7421b5bc1882903d";

const getPostersByUser = async (req, res) => {
  try {
    let targetUserId = req.params.userId || DEFAULT_POSTER_USER_ID;
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      const u = await User.findOne({ authId: targetUserId });
      if (u) targetUserId = u._id.toString();
      else targetUserId = DEFAULT_POSTER_USER_ID;
    }
    const { page = 1, limit = 12, search = "", favoritesOnly, minPrice, maxPrice, sortOption, tags, companyId } = req.query;
    let query = { 
      user_id: targetUserId,
    };
    // Filter by company
    if (companyId) {
      query.company_id = companyId;
    }
    // Search by poster name, product name, or tags
    if (search) {
      query.$or = [
        { poster_name: { $regex: search, $options: "i" } },
        { product_name: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } }
      ];
    }
    // Filter by tags if provided
    if (tags) {
      const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0)
        query.tags = { $all: tagList }; // match ALL tags
    }
    // Price filters
    if (minPrice) query.product_price = { ...query.product_price, $gte: Number(minPrice) };
    if (maxPrice) query.product_price = { ...query.product_price, $lte: Number(maxPrice) };
    // ⭐ Move favorites filter here — BEFORE database fetch
    if (favoritesOnly === "true") query.isHeart = true;
    // Sorting
    let sort = { updatedAt: -1, createdAt: -1 };
    if (sortOption === "priceLowToHigh") sort = { product_price: 1 };
    else if (sortOption === "priceHighToLow") sort = { product_price: -1 };
    else if (sortOption === "newestFirst") sort = { updatedAt: -1, createdAt: -1 };
    // Total count also based on filtered query
    let total = await Poster.countDocuments(query);
    const allowFallback = req.query.fallback !== "false" && req.query.onlyUser !== "true";
    if (allowFallback && total === 0 && targetUserId.toString() !== DEFAULT_POSTER_USER_ID) {
      const userTotalPosters = await Poster.countDocuments({ user_id: targetUserId });
      if (userTotalPosters === 0) {
        query.user_id = DEFAULT_POSTER_USER_ID;
        delete query.company_id;
        total = await Poster.countDocuments(query);
      }
    }

    // Fetch posters with pagination
    const posters = await Poster.find(query)
      .select(
        "_id user_id posterId poster_name poster_title product_name product_description product_price product_image product_gallery_images product_gallery_zoom product_gallery_positions company_logo logo_zoom product_zoom logo_position product_position template theme aspect_ratio custom_colors colorThemeId bgTypeId customBgColor backgroundImage createdAt updatedAt isHeart tags company_id isPublishedToMarketplace shareableLinkToken shareableLinkId fontColor stickers marketplaceCategory marketplaceSubcategory"
      )
      .sort(sort)
      .skip((page - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    res.status(200).json({
      message: "Posters retrieved successfully",
      posters,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });

  } catch (error) {
    console.error("Error fetching posters:", error);
    res.status(500).json({ error: error.message });
  }
};

const getPosterById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Missing poster ID" });
    }
    let poster = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      poster = await Poster.findById(id).populate("company_id").lean();
    }
    if (!poster) {
      poster = await Poster.findOne({ posterId: id }).populate("company_id").lean();
    }
    if (!poster) {
      return res.status(404).json({ error: "Poster not found" });
    }
    res.status(200).json({ success: true, poster });
  } catch (error) {
    console.error("Error fetching poster by id:", error);
    res.status(500).json({ error: error.message });
  }
};

const deletePoster = async (req, res) => {
  try {
    let ids = req.body.ids;
    if (!ids && req.params.id) ids = [req.params.id];
    if (!ids && req.body.id) ids = [req.body.id];
    if (typeof ids === "string") ids = [ids];
    if (!ids || !Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ error: "No poster IDs provided" });

    const validMongoIds = ids.filter((id) => id && mongoose.Types.ObjectId.isValid(String(id)));
    const stringIds = ids.filter((id) => id && !mongoose.Types.ObjectId.isValid(String(id))).map(String);
    const orClauses = [];
    if (validMongoIds.length > 0) orClauses.push({ _id: { $in: validMongoIds } });
    if (stringIds.length > 0) orClauses.push({ posterId: { $in: stringIds } });

    if (orClauses.length === 0)
      return res.status(400).json({ error: "No valid poster IDs provided" });

    const result = await Poster.deleteMany({ $or: orClauses });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "No posters found to delete" });
    res.status(200).json({ message: "Posters deleted successfully", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid poster ID" });
    const poster = await Poster.findById(id);
    if (!poster)
      return res.status(404).json({ message: "Poster not found" });
    poster.isHeart = !poster.isHeart;
    await poster.save();
    return res.status(200).json({ message: "Favorite status updated", isHeart: poster.isHeart, });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserTags = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = await resolveUserMongoId(userId, req.user);
    if (!targetUserId) {
      return res.status(200).send("{}");
    }

    const tagsResult = await Poster.aggregate([
      { $match: { user_id: targetUserId } },
      { $unwind: "$tags" },
      { $group: { _id: null, uniqueTags: { $addToSet: "$tags" } } },
      { $project: { _id: 0, tags: "$uniqueTags" } }
    ]);

    let tags = tagsResult[0]?.tags || [];

    tags = tags.flatMap(tag => {
      try {
        const parsed = JSON.parse(tag);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [tag.replace(/[\[\]"]+/g, "").trim()];
      }
    });

    tags = [...new Set(tags)];

    // Return custom format (NOT JSON)
    return res.status(200).send(`{${tags.map(tag => `"${tag}"`).join(",")}}`);

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



export const compressMediaTemp = async (req, res) => {
  try {
    const file = req.file;

    if (!file)
      return res.status(400).json({ error: "No file uploaded" });

    if (file.mimetype.startsWith("image")) {
      console.log("🖼 Image detected → Compressing...");
      return compressImageTemp(req, res);
    }

    if (file.mimetype.startsWith("video")) {
      console.log("🎞 Video detected → Checking plan limits...");

      // --- Plan-based video upload limit enforcement ---
      const userId = req.user?._id;
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Valid MongoDB user _id required for video upload limit check" });
      }
      console.log(userId, typeof userId);
      let plan, maxVideoUploadsPerMonth;
      try {
        plan = await getUserPlan(userId);
        maxVideoUploadsPerMonth = plan?.features?.maxVideoUploadsPerMonth ?? 1;
      } catch (e) {
        console.error("[Plan Enforcement] Error fetching plan for userId:", userId, e);
        return res.status(500).json({ error: "Could not determine user plan. Please try again later." });
      }
      if (maxVideoUploadsPerMonth !== -1) { // -1 means unlimited
        // Count videos uploaded by user in the current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        // Only count posters with isVideo true and createdAt in this month
        const videoUploadsThisMonth = await Poster.countDocuments({
          user_id: userId,
          isVideo: true,
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        });
        if (videoUploadsThisMonth >= maxVideoUploadsPerMonth) {
          return res.status(403).json({
            error: "Plan limit reached",
            message: `Your plan allows only ${maxVideoUploadsPerMonth} video upload(s) per month. Please upgrade your plan to upload more videos.`
          });
        }
      }

      // Compress video as usual
      const result = await compressVideoTempCore(req);
      if (result.error) {
        return res.status(result.status || 400).json({ error: result.error });
      }
      return res.json(result);
    }

    return res.status(400).json({ error: "Unsupported file format" });
  } catch (err) {
    console.error("❌ Media compression error:", err);
    return res.status(500).json({ error: "Media processing failed" });
  }
};

// ===========================================================================
// RE-NOTE MARKETPLACE CONTROLLERS
// ===========================================================================

// Deterministic content hash for duplicate-publish prevention
export const getPosterContentFingerprint = (poster, overrides = {}) => {
  const norm = {
    title: String(overrides.poster_title ?? overrides.poster_name ?? overrides.title ?? poster.poster_title ?? poster.poster_name ?? "").trim(),
    product_name: String(overrides.product_name ?? overrides.productName ?? poster.product_name ?? "").trim(),
    product_description: String(overrides.product_description ?? overrides.description ?? poster.product_description ?? "").trim(),
    product_price: Number(overrides.product_price ?? overrides.price ?? poster.product_price ?? 0),
    product_image: String(overrides.product_image ?? overrides.productImage ?? poster.product_image ?? "").trim(),
    company_logo: String(overrides.company_logo ?? overrides.companyLogo ?? poster.company_logo ?? "").trim(),
    template: String(overrides.template ?? poster.template ?? "frame1").trim(),
    templateCategory: String(overrides.templateCategory ?? poster.templateCategory ?? "Classic").trim(),
    colorThemeId: String(overrides.colorThemeId ?? poster.colorThemeId ?? "flame-orange").trim(),
    custom_colors: overrides.custom_colors ?? overrides.customAccentColor ?? poster.custom_colors ?? null,
    customSecondaryColor: overrides.customSecondaryColor ?? poster.customSecondaryColor ?? null,
    bgTypeId: String(overrides.bgTypeId ?? poster.bgTypeId ?? "clean-white").trim(),
    customBgColor: overrides.customBgColor ?? poster.customBgColor ?? null,
    backgroundImage: overrides.backgroundImage ?? poster.backgroundImage ?? null,
    fontFamilyId: String(overrides.fontFamilyId ?? poster.fontFamilyId ?? "serif").trim(),
    neonEffect: Boolean(overrides.neonEffect ?? poster.neonEffect),
    marketplaceCategory: String(overrides.marketplaceCategory ?? poster.marketplaceCategory ?? "").trim(),
    marketplaceSubcategory: String(overrides.marketplaceSubcategory ?? poster.marketplaceSubcategory ?? "").trim(),
    marketplaceCity: String(overrides.marketplaceCity ?? poster.marketplaceCity ?? "").trim(),
    contactPhone: String(overrides.contactPhone ?? poster.contactPhone ?? "").trim(),
    whatsappNumber: String(overrides.whatsappNumber ?? poster.whatsappNumber ?? "").trim(),
    marketplacePrice: overrides.marketplacePrice !== undefined && overrides.marketplacePrice !== null
      ? Number(overrides.marketplacePrice)
      : (poster.marketplacePrice !== undefined && poster.marketplacePrice !== null ? Number(poster.marketplacePrice) : null),
    stickers: overrides.stickers ?? poster.stickers ?? [],
  };
  return crypto.createHash("sha256").update(JSON.stringify(norm)).digest("hex");
};

export const publishPosterToMarketplace = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    let poster = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      poster = await Poster.findById(id);
    }
    if (!poster) {
      poster = await Poster.findOne({ posterId: id });
    }
    if (!poster) {
      return res.status(404).json({ success: false, message: "Poster not found" });
    }

    const candidateIds = [
      req.user?._id?.toString(),
      req.user?.authId?.toString(),
      req.user?.id?.toString(),
      req.user?.userId?.toString(),
    ].filter(Boolean);

    let isOwner =
      candidateIds.includes(poster.user_id?.toString()) ||
      (req.user?._id && typeof poster.user_id?.equals === "function" ? poster.user_id.equals(req.user._id) : false) ||
      req.user?.role === "SUPER_ADMIN" ||
      req.user?.role === "ADMIN";

    if (!isOwner && poster.user_id) {
      // Also verify if the poster's user matches via authId or email in DB
      try {
        const posterUser = await User.findById(poster.user_id).select("authId email");
        if (posterUser) {
          if (
            (posterUser.authId && candidateIds.includes(posterUser.authId.toString())) ||
            (posterUser.email && req.user?.email && posterUser.email.toLowerCase() === req.user.email.toLowerCase())
          ) {
            isOwner = true;
          }
        }
      } catch (uErr) {
        // continue
      }
    }

    if (!isOwner) {
      if (!poster.user_id && req.user?._id) {
        poster.user_id = req.user._id;
        isOwner = true;
      } else {
        return res.status(403).json({ success: false, message: "Unauthorized action: You can only publish your own posters." });
      }
    }

    // 1. Unpublish flow (When Public Marketplace Listing toggle is disabled)
    if (body.isPublishedToMarketplace === false) {
      poster.isPublishedToMarketplace = false;

      // Preserve any updated details in the database even when unpublished
      if (body.marketplaceCategory !== undefined) poster.marketplaceCategory = body.marketplaceCategory;
      if (body.marketplaceSubcategory !== undefined) poster.marketplaceSubcategory = body.marketplaceSubcategory;
      if (body.marketplaceCity !== undefined) poster.marketplaceCity = body.marketplaceCity.toString().trim();
      if (body.contactPhone !== undefined) {
        let p = body.contactPhone.toString().replace(/\D/g, "");
        if (p.length === 12 && p.startsWith("91")) p = p.slice(2);
        else if (p.length === 11 && p.startsWith("0")) p = p.slice(1);
        poster.contactPhone = p.slice(0, 10);
      }
      if (body.whatsappNumber !== undefined) poster.whatsappNumber = body.whatsappNumber.toString().trim();
      if (body.marketplacePrice !== undefined) {
        poster.marketplacePrice = body.marketplacePrice ? Number(body.marketplacePrice) : null;
      }

      await poster.save();
      return res.status(200).json({
        success: true,
        message: "Listing removed from public marketplace",
        data: poster,
      });
    }

    // 2. Validation when publishing
    const title = (body.poster_title || body.title || poster.poster_title || poster.poster_name || poster.product_name || "").trim();
    const productName = (body.product_name || body.productName || poster.product_name || poster.poster_name || poster.poster_title || "").trim();

    if (!title) {
      return res.status(400).json({ success: false, message: "Poster title is required before publishing." });
    }
    if (!productName) {
      return res.status(400).json({ success: false, message: "Product name is required before publishing." });
    }

    const category = (body.marketplaceCategory || body.marketplaceSubcategory || poster.marketplaceCategory || poster.marketplaceSubcategory || "Laptops & Computers").toString().trim();
    if (!category) {
      return res.status(400).json({ success: false, message: "Category is required for marketplace listings." });
    }

    const city = (body.marketplaceCity !== undefined ? body.marketplaceCity : poster.marketplaceCity || poster.company_id?.city || "").toString().trim();
    if (!city) {
      return res.status(400).json({ success: false, message: "Location / City is required for marketplace listings." });
    }

    const rawPrice = body.marketplacePrice !== undefined ? body.marketplacePrice : (poster.marketplacePrice ?? poster.product_price);
    if (rawPrice === undefined || rawPrice === null || rawPrice === "" || isNaN(Number(rawPrice)) || Number(rawPrice) <= 0) {
      return res.status(400).json({ success: false, message: "Valid display price is required for marketplace listings." });
    }

    let cleanPhone = (body.contactPhone !== undefined ? body.contactPhone : poster.contactPhone || poster.company_id?.phone || "").toString().replace(/\D/g, "");
    if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
      cleanPhone = cleanPhone.slice(1);
    }
    cleanPhone = cleanPhone.slice(0, 10);

    if (!cleanPhone) {
      return res.status(400).json({ success: false, message: "Contact phone is required for marketplace listings." });
    }

    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: "Contact phone must be exactly a 10-digit number." });
    }
    const whatsappRegex = /^(\+?\d{1,4})?[0-9]{10,14}$/;
    if (rawWhatsapp && !whatsappRegex.test(rawWhatsapp)) {
      return res.status(400).json({ success: false, message: "Please enter a valid WhatsApp number." });
    }

    // 3. Duplicate check - return 200 with data rather than 409 error
    const currentHash = getPosterContentFingerprint(poster, body);
    if (poster.isPublishedToMarketplace && poster.publishedContentHash && poster.publishedContentHash === currentHash) {
      return res.status(200).json({
        success: true,
        message: "Marketplace listing updated successfully!",
        data: poster,
      });
    }

    // 4. Update core content & styling if provided
    if (body.poster_title || body.title) {
      poster.poster_title = body.poster_title || body.title;
      poster.poster_name = body.poster_title || body.title;
    }
    if (body.product_name || body.productName) poster.product_name = body.product_name || body.productName;
    if (body.product_description !== undefined || body.description !== undefined) {
      poster.product_description = body.product_description ?? body.description;
    }
    if (body.product_price !== undefined || body.price !== undefined) {
      const p = body.product_price ?? body.price;
      poster.product_price = p ? Number(p) : 0;
    }
    if (body.product_image !== undefined || body.productImage !== undefined) {
      poster.product_image = body.product_image ?? body.productImage;
    }
    if (body.company_logo !== undefined || body.companyLogo !== undefined) {
      poster.company_logo = body.company_logo ?? body.companyLogo;
    }
    if (body.template) poster.template = body.template;
    if (body.templateCategory) poster.templateCategory = body.templateCategory;
    if (body.colorThemeId) poster.colorThemeId = body.colorThemeId;
    if (body.custom_colors !== undefined || body.customAccentColor !== undefined) {
      poster.custom_colors = body.custom_colors ?? body.customAccentColor;
    }
    if (body.customSecondaryColor !== undefined) {
      poster.customSecondaryColor = body.customSecondaryColor;
    }
    if (body.bgTypeId) poster.bgTypeId = body.bgTypeId;
    if (body.customBgColor !== undefined) poster.customBgColor = body.customBgColor;
    if (body.backgroundImage !== undefined) poster.backgroundImage = body.backgroundImage;
    if (body.fontFamilyId) poster.fontFamilyId = body.fontFamilyId;
    if (body.titleSize) poster.titleSize = body.titleSize;
    if (body.isUppercase !== undefined) poster.isUppercase = Boolean(body.isUppercase);
    if (body.textAlign) poster.textAlign = body.textAlign;
    if (body.borderThickness !== undefined) poster.borderThickness = Number(body.borderThickness);
    if (body.showPriceTag !== undefined) poster.showPriceTag = Boolean(body.showPriceTag);
    if (body.neonEffect !== undefined) poster.neonEffect = Boolean(body.neonEffect);

    // Marketplace metadata
    poster.isPublishedToMarketplace = true;
    poster.publishedAt = new Date();
    poster.publishedContentHash = currentHash;
    poster.publishedVersion = (poster.publishedVersion || 0) + 1;

    if (body.marketplaceCategory !== undefined) poster.marketplaceCategory = category;
    if (body.marketplaceSubcategory !== undefined) poster.marketplaceSubcategory = category;
    if (body.marketplaceCity !== undefined) poster.marketplaceCity = city;
    if (body.contactPhone !== undefined) poster.contactPhone = cleanPhone;
    if (body.whatsappNumber !== undefined) poster.whatsappNumber = rawWhatsapp || cleanPhone;
    if (body.marketplacePrice !== undefined) {
      poster.marketplacePrice = body.marketplacePrice ? Number(body.marketplacePrice) : null;
    }

    await poster.save();

    return res.status(200).json({
      success: true,
      message: poster.publishedVersion > 1
        ? `Version ${poster.publishedVersion} published to reNote Marketplace! 🚀`
        : "Poster published to reNote Marketplace! 🎉",
      data: poster,
    });
  } catch (error) {
    console.error("Error publishing poster to marketplace:", error);
    return res.status(500).json({ success: false, message: "Failed to publish poster to marketplace." });
  }
};

export const getMarketplaceFeed = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 24,
      search = "",
      category = "",
      subcategory = "",
      city = "",
      sort = "recent",
    } = req.query;

    const query = { isPublishedToMarketplace: true, isSold: { $ne: true } };

    const andConditions = [];

    if (search) {
      const searchRegex = new RegExp(search, "i");
      andConditions.push({
        $or: [
          { poster_name: searchRegex },
          { poster_title: searchRegex },
          { product_name: searchRegex },
          { product_description: searchRegex },
          { tags: searchRegex },
        ],
      });
    }

    const escapeRegex = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "");

    if (category && category !== "All") {
      const trimmedCat = category.trim();
      let catPatterns = [trimmedCat];
      if (/electronics/i.test(trimmedCat)) {
        catPatterns.push("Electronics & Appliances", "Laptops & Computers", "Computers & Laptops", "Laptops", "Computers", "Electronics & Tech");
      } else if (/laptop|computer/i.test(trimmedCat)) {
        catPatterns.push("Laptops & Computers", "Computers & Laptops", "Electronics & Appliances", "Laptops", "Computers", "Electronics & Tech");
      } else if (/phone|mobile/i.test(trimmedCat)) {
        catPatterns.push("Smartphones & Mobiles", "Mobiles", "Mobile");
      }
      const catRegex = new RegExp(catPatterns.map(escapeRegex).join("|"), "i");
      andConditions.push({
        $or: [
          { marketplaceCategory: catRegex },
          { marketplaceSubcategory: catRegex },
          { product_name: catRegex },
          { poster_name: catRegex },
          { poster_title: catRegex },
          { tags: catRegex },
        ],
      });
    }

    if (subcategory && subcategory !== "All") {
      const trimmedSub = subcategory.trim();
      let subPatterns = [trimmedSub];
      if (/laptop|computer/i.test(trimmedSub)) {
        subPatterns.push("Computers & Laptops", "Laptops & Computers", "Laptops", "Computers");
      }
      const subRegex = new RegExp(subPatterns.map(escapeRegex).join("|"), "i");
      andConditions.push({
        $or: [
          { marketplaceSubcategory: subRegex },
          { tags: subRegex },
        ],
      });
    }

    if (city && city !== "All") {
      const rawCity = city.trim();
      const cityPatterns = [rawCity];
      if (/coimbatore/i.test(rawCity)) {
        cityPatterns.push("RS Puram", "R S PURAM", "Peelamedu", "Gandhipuram");
      } else if (/r\s*s\s*puram/i.test(rawCity)) {
        cityPatterns.push("Coimbatore");
      } else if (/bangalore|bengaluru/i.test(rawCity)) {
        cityPatterns.push("Bangalore", "Bengaluru");
      }
      const cityRegex = new RegExp(cityPatterns.map(escapeRegex).join("|"), "i");

      let matchingCompanyIds = [];
      try {
        const matchingCompanies = await Company.find({
          $or: [
            { city: cityRegex },
            { address: cityRegex },
          ],
        }).select("_id");
        matchingCompanyIds = matchingCompanies.map((c) => c._id);
      } catch (cErr) {
        // continue
      }

      andConditions.push({
        $or: [
          { marketplaceCity: cityRegex },
          { company_id: { $in: matchingCompanyIds } },
        ],
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    let sortOptions = { publishedAt: -1, createdAt: -1 };
    if (sort === "price_low_high") {
      sortOptions = { product_price: 1 };
    } else if (sort === "price_high_low") {
      sortOptions = { product_price: -1 };
    } else if (sort === "popular") {
      sortOptions = { viewsCount: -1, likesCount: -1 };
    }

    // 1. Fetch local published posters from MongoDB
    let localPosters = [];
    if (mongoose.connection.readyState === 1) {
      try {
        localPosters = await Poster.find(query)
          .populate("company_id", "name logo phone email address city gstNo panVerificationStatus")
          .populate("user_id", "firstName lastName email phoneNumber profilePic")
          .sort(sortOptions)
          .lean();
      } catch (dbErr) {
        console.error("Local Poster query error:", dbErr.message);
      }
    }

    // 2. Fetch upstream live marketplace feed
    let upstreamPosters = [];
    try {
      const upstreamRes = await axios.get("https://renote.co.in/api/marketplace/feed", {
        params: req.query,
        timeout: 4000,
      });
      if (upstreamRes.data?.posters && Array.isArray(upstreamRes.data.posters)) {
        upstreamPosters = upstreamRes.data.posters;
      }
    } catch (upstreamErr) {
      // Upstream unavailable or offline - continue with local posters
    }

    // 3. Deduplicate: remove any upstream posters that collide with local ones
    const localIdSet = new Set(localPosters.map((p) => p._id?.toString() || p.posterId));
    const filteredUpstream = upstreamPosters.filter((p) => !localIdSet.has(p._id?.toString() || p.posterId));

    // 4. Combine: local newly published posters first, followed by upstream listings
    const combined = [...localPosters, ...filteredUpstream];

    // 5. Paginate
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 24);
    const skip = (pageNum - 1) * limitNum;
    const paginated = combined.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      total: combined.length,
      page: pageNum,
      totalPages: Math.ceil(combined.length / limitNum) || 1,
      posters: paginated,
    });
  } catch (error) {
    console.error("Error fetching marketplace feed:", error);
    res.status(200).json({ success: true, total: 0, page: 1, totalPages: 0, posters: [] });
  }
};

export const getMarketplaceItemDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      try {
        let poster = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          poster = await Poster.findOneAndUpdate(
            { _id: id, isPublishedToMarketplace: true },
            { $inc: { viewsCount: 1 } },
            { new: true }
          )
            .populate("company_id", "name logo phone email address city gstNo panVerificationStatus")
            .populate("user_id", "firstName lastName email phoneNumber profilePic")
            .lean();
        }
        if (!poster) {
          poster = await Poster.findOneAndUpdate(
            { posterId: id, isPublishedToMarketplace: true },
            { $inc: { viewsCount: 1 } },
            { new: true }
          )
            .populate("company_id", "name logo phone email address city gstNo panVerificationStatus")
            .populate("user_id", "firstName lastName email phoneNumber profilePic")
            .lean();
        }

        if (poster) {
          return res.status(200).json({
            success: true,
            poster,
          });
        }
      } catch (dbErr) {
        console.error("Local item query error:", dbErr.message);
      }
    }

    // Fallback to upstream live backend for item details
    try {
      const upstreamRes = await axios.get(`https://renote.co.in/api/marketplace/item/${id}`, {
        timeout: 6000,
      });
      return res.status(200).json(upstreamRes.data);
    } catch (upstreamErr) {
      return res.status(404).json({ success: false, message: "Marketplace listing not found" });
    }
  } catch (error) {
    console.error("Error fetching marketplace item details:", error);
    res.status(404).json({ success: false, message: "Failed to fetch item details" });
  }
};

export const likeMarketplaceItem = async (req, res) => {
  return reactToMarketplaceItem(req, res);
};

export const reactToMarketplaceItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction, userKey: reqUserKey } = req.body;

    const validReaction = reaction || "like";
    if (!["like", "dislike", "none"].includes(validReaction)) {
      return res.status(400).json({ success: false, message: "Invalid reaction" });
    }

    const userKey = req.user?.id
      ? `user:${req.user.id}`
      : reqUserKey
      ? `guest:${reqUserKey}`
      : `guest:${req.ip || "anonymous"}`;

    let feedback = await PosterFeedback.findOne({ poster_id: id, user_key: userKey });

    if (!feedback) {
      feedback = new PosterFeedback({
        poster_id: id,
        user_key: userKey,
        reaction: validReaction,
      });
    } else {
      if (feedback.reaction === validReaction && validReaction !== "none") {
        feedback.reaction = "none";
      } else {
        feedback.reaction = validReaction;
      }
    }

    await feedback.save();

    const stats = await recalculatePosterStats(id);

    return res.status(200).json({
      success: true,
      userReaction: feedback.reaction,
      ...stats,
    });
  } catch (error) {
    console.error("Error updating reaction:", error);
    return res.status(500).json({ success: false, message: "Failed to update reaction" });
  }
};

export const rateMarketplaceItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, userKey: reqUserKey } = req.body;
    const numericRating = Math.round(Number(rating));

    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5 stars" });
    }

    const userKey = req.user?.id
      ? `user:${req.user.id}`
      : reqUserKey
      ? `guest:${reqUserKey}`
      : `guest:${req.ip || "anonymous"}`;

    let feedback = await PosterFeedback.findOne({ poster_id: id, user_key: userKey });

    if (!feedback) {
      feedback = new PosterFeedback({
        poster_id: id,
        user_key: userKey,
        rating: numericRating,
      });
    } else {
      feedback.rating = numericRating;
    }

    await feedback.save();

    const stats = await recalculatePosterStats(id);

    return res.status(200).json({
      success: true,
      userRating: feedback.rating,
      ...stats,
    });
  } catch (error) {
    console.error("Error rating marketplace item:", error);
    return res.status(500).json({ success: false, message: "Failed to submit rating" });
  }
};

export const getMarketplaceItemFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { userKey: reqUserKey } = req.query;

    const poster = await Poster.findById(id).select(
      "likesCount dislikesCount ratingSum ratingCount averageRating"
    );

    if (!poster) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    let userReaction = "none";
    let userRating = null;

    const userKey = req.user?.id
      ? `user:${req.user.id}`
      : reqUserKey
      ? `guest:${reqUserKey}`
      : null;

    if (userKey) {
      const feedback = await PosterFeedback.findOne({ poster_id: id, user_key: userKey });
      if (feedback) {
        userReaction = feedback.reaction || "none";
        userRating = feedback.rating || null;
      }
    }

    return res.status(200).json({
      success: true,
      likesCount: poster.likesCount || 0,
      dislikesCount: poster.dislikesCount || 0,
      ratingCount: poster.ratingCount || 0,
      averageRating: poster.averageRating || 0,
      userReaction,
      userRating,
    });
  } catch (error) {
    console.error("Error getting item feedback:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch feedback" });
  }
};

async function recalculatePosterStats(posterId) {
  const feedbacks = await PosterFeedback.find({ poster_id: posterId });

  let likesCount = 0;
  let dislikesCount = 0;
  let ratingSum = 0;
  let ratingCount = 0;

  feedbacks.forEach((fb) => {
    if (fb.reaction === "like") likesCount++;
    if (fb.reaction === "dislike") dislikesCount++;
    if (typeof fb.rating === "number" && fb.rating >= 1 && fb.rating <= 5) {
      ratingSum += fb.rating;
      ratingCount++;
    }
  });

  const averageRating = ratingCount > 0 ? parseFloat((ratingSum / ratingCount).toFixed(1)) : 0;

  const updatedPoster = await Poster.findByIdAndUpdate(
    posterId,
    {
      likesCount,
      dislikesCount,
      ratingSum,
      ratingCount,
      averageRating,
    },
    { new: true }
  );

  return {
    likesCount: updatedPoster?.likesCount || 0,
    dislikesCount: updatedPoster?.dislikesCount || 0,
    ratingSum: updatedPoster?.ratingSum || 0,
    ratingCount: updatedPoster?.ratingCount || 0,
    averageRating: updatedPoster?.averageRating || 0,
  };
}

export const togglePosterSold = async (req, res) => {
  try {
    const { id } = req.params;
    const { linkToken } = req.body || {};

    let poster = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      poster = await Poster.findById(id).lean();
    }
    if (!poster) {
      poster = await Poster.findOne({ posterId: id }).lean();
    }

    if (!poster) {
      return res.status(404).json({ success: false, message: "Poster not found" });
    }

    const candidateIds = [
      req.user?._id?.toString(),
      req.user?.authId?.toString(),
      req.user?.id?.toString(),
      req.user?.userId?.toString(),
    ].filter(Boolean);

    let isAuthorized = false;
    if (req.user?.role === "SUPER_ADMIN" || req.user?.role === "ADMIN") {
      isAuthorized = true;
    } else if (poster.user_id && candidateIds.includes(poster.user_id.toString())) {
      isAuthorized = true;
    } else if (linkToken) {
      const link = await ShareableLink.findOne({ token: linkToken });
      if (link && candidateIds.includes(link.createdBy?.toString())) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized && candidateIds.length > 0) {
      return res.status(403).json({ success: false, message: "Unauthorized action: You can only mark your own posters as sold." });
    }

    const newIsSold = !poster.isSold;
    const newSoldAt = newIsSold ? new Date() : null;
    const newIsPublished = newIsSold ? false : poster.isPublishedToMarketplace;

    await Poster.updateOne(
      { _id: poster._id },
      {
        $set: {
          isSold: newIsSold,
          soldAt: newSoldAt,
          isPublishedToMarketplace: newIsPublished,
        },
      }
    );

    return res.status(200).json({
      success: true,
      isSold: newIsSold,
      isPublishedToMarketplace: newIsPublished,
      message: newIsSold ? "Marked as SOLD & removed from marketplace" : "Marked as Available",
    });
  } catch (error) {
    console.error("Error toggling sold status:", error);
    return res.status(500).json({ success: false, message: "Failed to toggle sold status" });
  }
};

export const publishLinkPostersToMarketplace = async (req, res) => {
  try {
    const { token } = req.params;
    const { isPublishedToMarketplace } = req.body;

    const link = await ShareableLink.findOne({ token }).populate("posterIds");
    if (!link) {
      return res.status(404).json({ success: false, message: "Share link not found" });
    }

    const candidateIds = [
      req.user?._id?.toString(),
      req.user?.authId?.toString(),
      req.user?.id?.toString(),
      req.user?.userId?.toString(),
    ].filter(Boolean);

    const isOwner =
      candidateIds.includes(link.createdBy?.toString()) ||
      (req.user?._id && typeof link.createdBy?.equals === "function" ? link.createdBy.equals(req.user._id) : false);

    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Unauthorized action" });
    }

    const targetStatus = isPublishedToMarketplace ?? true;
    link.isPublishedToMarketplace = targetStatus;
    await link.save();

    const posterIds = (link.posterIds || []).map((p) => p._id || p);

    if (posterIds.length > 0) {
      await Poster.updateMany(
        { _id: { $in: posterIds } },
        {
          $set: {
            isPublishedToMarketplace: targetStatus,
            publishedAt: targetStatus ? new Date() : null,
          },
        }
      );
    }

    res.status(200).json({
      success: true,
      message: targetStatus
        ? `Published all ${posterIds.length} poster(s) in this link to Marketplace!`
        : `Unpublished ${posterIds.length} poster(s) from Marketplace`,
      isPublishedToMarketplace: targetStatus,
    });
  } catch (error) {
    console.error("Error publishing link posters to marketplace:", error);
    res.status(500).json({ success: false, message: "Failed to publish link posters" });
  }
};

export {
  getNextPosterId,
  createPoster,
  updatePoster,
  duplicatePoster,
  getPostersByUser,
  getPosterById,
  downloadPostersAsZip,
  uploadPostersFromZip,
  deletePoster,
  toggleFavorite,
};
