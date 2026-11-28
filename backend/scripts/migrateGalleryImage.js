/**
 * migratePosterAssetsToUserCompanyFolder.js
 *
 * One-time migration: for any Poster where an asset path is stored at the
 * uploads root (e.g. `/uploads/<file>`) instead of inside the per-user/
 * per-company folder (`/uploads/{userId}/{companyId}/<file>`), move the
 * file on disk and rewrite the stored path in MongoDB.
 *
 * Handles all three poster asset fields:
 *   - product_image           (string)
 *   - company_logo            (string)
 *   - product_gallery_images  (string[])
 *
 * Background: an earlier bug in the update flow caused multer to drop
 * newly-uploaded files at the uploads root because `req.body` was reset
 * by multer before the destination callback ran. That has since been
 * fixed; this script repairs records written while the bug was live.
 *
 * Usage:
 *   node scripts/migratePosterAssetsToUserCompanyFolder.js           # dry-run
 *   node scripts/migratePosterAssetsToUserCompanyFolder.js --apply   # perform moves + DB updates
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import connectDb from "../db.js";
import Poster from "../models/Poster.js";
import { UPLOAD_ROOT, resolveUploadPath, ensureDir } from "../utils/uploadPaths.js";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");

const ASSET_FIELDS = [
  { field: "product_image", isArray: false },
  { field: "company_logo", isArray: false },
  { field: "product_gallery_images", isArray: true },
];

const sanitizeIdSegment = (value) => {
  if (value === undefined || value === null) return "";
  const str = String(value).trim();
  if (!str) return "";
  const cleaned = str.replace(/[^a-zA-Z0-9_.-]/g, "");
  if (!cleaned || cleaned === "." || cleaned === "..") return "";
  return cleaned;
};

// Returns path segments (relative to UPLOAD_ROOT) for a `/uploads/...` path,
// or null if it can't be parsed.
const toRelativeSegments = (publicPath) => {
  if (!publicPath || typeof publicPath !== "string") return null;
  const cleaned = publicPath.split("?")[0].replace(/\\/g, "/").trim();
  if (!cleaned) return null;
  const idx = cleaned.indexOf("/uploads/");
  const rel =
    idx !== -1
      ? cleaned.slice(idx + "/uploads/".length)
      : cleaned.replace(/^\/+/, "").replace(/^uploads\//, "");
  if (!rel) return null;
  return rel.split("/").filter(Boolean);
};

// Search the user's folder (and its immediate sub-folders) for a file with
// the given name. Returns the absolute path if found.
const findFileUnderUser = (userRoot, fileName) => {
  if (!fs.existsSync(userRoot)) return null;
  const direct = path.join(userRoot, fileName);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;

  let entries;
  try {
    entries = fs.readdirSync(userRoot, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(userRoot, entry.name, fileName);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
};

// Decide what the public path for a single asset should become, and (if
// APPLY) perform any required filesystem move. Returns:
//   { status, newPath }
// where status is one of: 'unchanged' | 'updated' | 'missing' | 'conflict' |
// 'error' | 'invalid'.
const processAssetPath = (publicPath, userId, companyId, posterId, fieldLabel) => {
  const segments = toRelativeSegments(publicPath);
  if (!segments || segments.length === 0) {
    console.log(`  [skip] cannot parse ${fieldLabel}: ${publicPath}  (poster ${posterId})`);
    return { status: "invalid", newPath: publicPath };
  }

  // Already nested under at least a userId folder -> nothing to do.
  if (segments.length > 1) {
    return { status: "unchanged", newPath: publicPath };
  }

  const fileName = segments[0];

  if (!userId) {
    console.log(`  [skip] no user_id for poster ${posterId} (${fieldLabel} file: ${fileName})`);
    return { status: "error", newPath: publicPath };
  }

  const srcAbs = path.join(UPLOAD_ROOT, fileName);
  const destSegments = [userId];
  if (companyId) destSegments.push(companyId);
  const destDirAbs = resolveUploadPath(...destSegments);
  const destAbs = path.join(destDirAbs, fileName);
  const newPublicPath = `/uploads/${[...destSegments, fileName].join("/")}`;

  if (!fs.existsSync(srcAbs)) {
    // Source not at root. Maybe it's already at the expected nested dest.
    if (fs.existsSync(destAbs)) {
      console.log(`  [db-only] ${fieldLabel} file already at dest, updating path: ${publicPath} -> ${newPublicPath}`);
      return { status: "updated", newPath: newPublicPath };
    }

    // Fallback: scan {userId}/<file> and {userId}/*/<file>.
    const userRoot = resolveUploadPath(userId);
    const foundAt = findFileUnderUser(userRoot, fileName);
    if (foundAt) {
      const relFromRoot = path
        .relative(UPLOAD_ROOT, foundAt)
        .replace(/\\/g, "/");
      const fixedPublicPath = `/uploads/${relFromRoot}`;
      console.log(`  [db-only] located ${fieldLabel} file under user folder, updating path: ${publicPath} -> ${fixedPublicPath}`);
      return { status: "updated", newPath: fixedPublicPath };
    }

    console.log(`  [missing] ${fieldLabel} source file not found anywhere: ${fileName}  (poster ${posterId})`);
    return { status: "missing", newPath: publicPath };
  }

  if (fs.existsSync(destAbs)) {
    console.log(`  [conflict] ${fieldLabel} dest already exists: ${destAbs}  (poster ${posterId}) — leaving source in place`);
    return { status: "conflict", newPath: publicPath };
  }

  console.log(`  [move] ${fieldLabel}: ${publicPath} -> ${newPublicPath}`);
  if (APPLY) {
    try {
      ensureDir(destDirAbs);
      fs.renameSync(srcAbs, destAbs);
    } catch (err) {
      console.error(`     ! ${fieldLabel} move failed: ${err.message}`);
      return { status: "error", newPath: publicPath };
    }
  }
  return { status: APPLY ? "updated" : "updated_dry", newPath: newPublicPath };
};

const run = async () => {
  console.log("=== migratePosterAssetsToUserCompanyFolder ===");
  console.log(`UPLOAD_ROOT: ${UPLOAD_ROOT}`);
  console.log(`Mode:        ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  connectDb();
  await new Promise((resolve, reject) => {
    mongoose.connection.once("open", resolve);
    mongoose.connection.once("error", reject);
  });

  const stats = {
    postersScanned: 0,
    postersUpdated: 0,
    assetsMovedOrUpdated: 0,
    assetsAlreadyOk: 0,
    assetsMissing: 0,
    assetsConflict: 0,
    assetsInvalid: 0,
    assetsError: 0,
  };

  try {
    // Pull every poster that has at least one asset field populated.
    const posters = await Poster.find(
      {
        $or: [
          { product_image: { $exists: true, $ne: null, $ne: "" } },
          { company_logo: { $exists: true, $ne: null, $ne: "" } },
          { product_gallery_images: { $exists: true, $ne: [] } },
        ],
      },
      {
        product_image: 1,
        company_logo: 1,
        product_gallery_images: 1,
        user_id: 1,
        company_id: 1,
      }
    ).lean();

    for (const p of posters) {
      stats.postersScanned += 1;
      const userId = sanitizeIdSegment(p.user_id);
      const companyId = sanitizeIdSegment(p.company_id);
      const update = {};
      let posterChanged = false;

      for (const { field, isArray } of ASSET_FIELDS) {
        const current = p[field];
        if (isArray) {
          if (!Array.isArray(current) || current.length === 0) continue;
          const next = [];
          let arrayChanged = false;
          for (const item of current) {
            if (!item) {
              next.push(item);
              continue;
            }
            const result = processAssetPath(item, userId, companyId, p._id, `${field}[]`);
            switch (result.status) {
              case "unchanged":
                stats.assetsAlreadyOk += 1;
                break;
              case "updated":
              case "updated_dry":
                stats.assetsMovedOrUpdated += 1;
                if (result.newPath !== item) arrayChanged = true;
                break;
              case "missing":
                stats.assetsMissing += 1;
                break;
              case "conflict":
                stats.assetsConflict += 1;
                break;
              case "invalid":
                stats.assetsInvalid += 1;
                break;
              default:
                stats.assetsError += 1;
            }
            next.push(result.newPath);
          }
          if (arrayChanged) {
            update[field] = next;
            posterChanged = true;
          }
        } else {
          if (!current) continue;
          const result = processAssetPath(current, userId, companyId, p._id, field);
          switch (result.status) {
            case "unchanged":
              stats.assetsAlreadyOk += 1;
              break;
            case "updated":
            case "updated_dry":
              stats.assetsMovedOrUpdated += 1;
              if (result.newPath !== current) {
                update[field] = result.newPath;
                posterChanged = true;
              }
              break;
            case "missing":
              stats.assetsMissing += 1;
              break;
            case "conflict":
              stats.assetsConflict += 1;
              break;
            case "invalid":
              stats.assetsInvalid += 1;
              break;
            default:
              stats.assetsError += 1;
          }
        }
      }

      if (posterChanged && APPLY) {
        try {
          await Poster.updateOne({ _id: p._id }, { $set: update });
          stats.postersUpdated += 1;
        } catch (err) {
          stats.assetsError += 1;
          console.error(`  ! DB update failed for poster ${p._id}: ${err.message}`);
        }
      } else if (posterChanged) {
        stats.postersUpdated += 1; // counted as "would update" in dry-run
      }
    }

    console.log("\n=== Summary ===");
    console.log(`Posters scanned:                 ${stats.postersScanned}`);
    console.log(`Posters ${APPLY ? "updated" : "to update"}: ${stats.postersUpdated}`);
    console.log(`Assets moved/path-fixed:         ${stats.assetsMovedOrUpdated}`);
    console.log(`Assets already nested:           ${stats.assetsAlreadyOk}`);
    console.log(`Assets missing on disk:          ${stats.assetsMissing}`);
    console.log(`Assets dest conflicts:           ${stats.assetsConflict}`);
    console.log(`Assets invalid paths:            ${stats.assetsInvalid}`);
    console.log(`Assets errors:                   ${stats.assetsError}`);
    if (!APPLY) console.log("\nDry-run only. Re-run with --apply to perform the migration.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
