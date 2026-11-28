/**
 * migrateProductImagesToUserCompanyFolder.js
 *
 * One-time migration: moves Poster.product_image files that live at the
 * uploads root (e.g. /uploads/<file>) into the per-user/per-company
 * folder (e.g. /uploads/{userId}/{companyId}/<file>) and updates the
 * stored path in the DB.
 *
 * Usage:
 *   node scripts/migrateProductImagesToUserCompanyFolder.js          # dry-run
 *   node scripts/migrateProductImagesToUserCompanyFolder.js --apply  # perform moves + DB updates
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import connectDb from "../db.js";
import Poster from "../models/Poster.js";
import { UPLOAD_ROOT, resolveUploadPath, ensureDir } from "../utils/uploadPaths.js";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");

const sanitizeIdSegment = (value) => {
  if (value === undefined || value === null) return "";
  const str = String(value).trim();
  if (!str) return "";
  const cleaned = str.replace(/[^a-zA-Z0-9_.-]/g, "");
  if (!cleaned || cleaned === "." || cleaned === "..") return "";
  return cleaned;
};

// Returns the path segments (relative to UPLOAD_ROOT) for a given public
// `/uploads/...` path, or null if it can't be parsed.
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

// Search shallow tree under userRoot for a file with this exact name.
// Checks userRoot/<file> first, then userRoot/<companyDir>/<file>.
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

const run = async () => {
  console.log("=== migrateProductImagesToUserCompanyFolder ===");
  console.log(`UPLOAD_ROOT: ${UPLOAD_ROOT}`);
  console.log(`Mode:        ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  connectDb();
  await new Promise((resolve, reject) => {
    mongoose.connection.once("open", resolve);
    mongoose.connection.once("error", reject);
  });

  const stats = {
    scanned: 0,
    alreadyNested: 0,
    missingFile: 0,
    noUser: 0,
    moved: 0,
    updated: 0,
    conflicts: 0,
    errors: 0,
  };

  try {
    const posters = await Poster.find(
      { product_image: { $exists: true, $ne: null, $ne: "" } },
      { product_image: 1, user_id: 1, company_id: 1 }
    ).lean();

    for (const p of posters) {
      stats.scanned += 1;
      const segments = toRelativeSegments(p.product_image);
      if (!segments || segments.length === 0) {
        stats.errors += 1;
        console.log(`  [skip] cannot parse product_image: ${p.product_image}  (poster ${p._id})`);
        continue;
      }

      // Already nested under at least a userId folder -> nothing to do.
      if (segments.length > 1) {
        stats.alreadyNested += 1;
        continue;
      }

      const fileName = segments[0];
      const userId = sanitizeIdSegment(p.user_id);
      const companyId = sanitizeIdSegment(p.company_id);

      if (!userId) {
        stats.noUser += 1;
        console.log(`  [skip] no user_id for poster ${p._id} (file: ${fileName})`);
        continue;
      }

      const srcAbs = path.join(UPLOAD_ROOT, fileName);
      const destSegments = [userId];
      if (companyId) destSegments.push(companyId);
      const destDirAbs = resolveUploadPath(...destSegments);
      const destAbs = path.join(destDirAbs, fileName);
      const newPublicPath = `/uploads/${[...destSegments, fileName].join("/")}`;

      if (!fs.existsSync(srcAbs)) {
        // Source file is gone from root. Check whether it already lives
        // at the expected nested destination — if so, just fix the DB.
        if (fs.existsSync(destAbs)) {
          console.log(`  [db-only] file already at dest, updating path: ${p.product_image} -> ${newPublicPath}`);
          if (APPLY) {
            try {
              await Poster.updateOne({ _id: p._id }, { $set: { product_image: newPublicPath } });
              stats.updated += 1;
            } catch (err) {
              stats.errors += 1;
              console.error(`     ! DB update failed: ${err.message}`);
            }
          }
          continue;
        }

        // Fallback: scan {userId}/* and {userId}/*/<file> in case the
        // file lives under a different company folder than what's on
        // the poster record.
        const userRoot = resolveUploadPath(userId);
        const foundAt = findFileUnderUser(userRoot, fileName);
        if (foundAt) {
          const relFromRoot = path
            .relative(UPLOAD_ROOT, foundAt)
            .replace(/\\/g, "/");
          const fixedPublicPath = `/uploads/${relFromRoot}`;
          console.log(`  [db-only] located file under user folder, updating path: ${p.product_image} -> ${fixedPublicPath}`);
          if (APPLY) {
            try {
              await Poster.updateOne({ _id: p._id }, { $set: { product_image: fixedPublicPath } });
              stats.updated += 1;
            } catch (err) {
              stats.errors += 1;
              console.error(`     ! DB update failed: ${err.message}`);
            }
          }
          continue;
        }

        stats.missingFile += 1;
        console.log(`  [missing] source file not found anywhere: ${fileName}  (poster ${p._id})`);
        continue;
      }

      if (fs.existsSync(destAbs)) {
        stats.conflicts += 1;
        console.log(`  [conflict] dest already exists: ${destAbs}  (poster ${p._id}) — leaving source in place`);
        continue;
      }

      console.log(`  [move] ${p.product_image} -> ${newPublicPath}`);
      if (APPLY) {
        try {
          ensureDir(destDirAbs);
          fs.renameSync(srcAbs, destAbs);
          stats.moved += 1;
          await Poster.updateOne({ _id: p._id }, { $set: { product_image: newPublicPath } });
          stats.updated += 1;
        } catch (err) {
          stats.errors += 1;
          console.error(`     ! move/update failed: ${err.message}`);
        }
      }
    }

    console.log("\n=== Summary ===");
    console.log(`Posters scanned:    ${stats.scanned}`);
    console.log(`Already nested:     ${stats.alreadyNested}`);
    console.log(`Files missing:      ${stats.missingFile}`);
    console.log(`No user_id:         ${stats.noUser}`);
    console.log(`Dest conflicts:     ${stats.conflicts}`);
    console.log(`Files moved:        ${stats.moved}`);
    console.log(`DB records updated: ${stats.updated}`);
    console.log(`Errors:             ${stats.errors}`);
    if (!APPLY) console.log("\nDry-run only. Re-run with --apply to perform the migration.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
