/**
 * cleanUnusedUploads.js
 *
 * Walks the uploads directory and deletes any image/video file that is
 * NOT referenced by the database. References are collected from:
 *   - Company.logo
 *   - Poster.company_logo
 *   - Poster.product_image
 *   - Poster.product_gallery_images[]
 *
 * Usage:
 *   node scripts/cleanUnusedUploads.js              # dry-run (default, no deletions)
 *   node scripts/cleanUnusedUploads.js --delete     # delete unreferenced files + old temp/tmp_zip files
 *   node scripts/cleanUnusedUploads.js --delete --prune-empty   # also remove empty dirs
 *   node scripts/cleanUnusedUploads.js --delete --no-clean-temp # skip the temp/tmp_zip purge
 *
 * Notes:
 *   - `uploads/temp/` and `uploads/tmp_zip/` are skipped during the
 *     DB-reference sweep (they hold in-flight uploads / extraction
 *     scratch), but are purged in a separate pass by default — files
 *     older than --temp-age-hours (default 24h) are removed. Pass
 *     --no-clean-temp to disable this pass.
 *   - Files modified within the safety window (default 60 minutes) are
 *     skipped to avoid deleting brand-new uploads that may not yet have
 *     been persisted to the DB. Override via --min-age-minutes=<n>.
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import connectDb from "../db.js";
import Company from "../models/Company.js";
import Poster from "../models/Poster.js";
import { UPLOAD_ROOT } from "../utils/uploadPaths.js";

// ---------- CLI args ----------
const args = process.argv.slice(2);
const DO_DELETE = args.includes("--delete");
const PRUNE_EMPTY = args.includes("--prune-empty");
// Temp cleanup runs by default; pass --no-clean-temp to skip it.
const CLEAN_TEMP = !args.includes("--no-clean-temp");
const minAgeArg = args.find((a) => a.startsWith("--min-age-minutes="));
const MIN_AGE_MINUTES = minAgeArg ? Number(minAgeArg.split("=")[1]) : 60;
const MIN_AGE_MS = Math.max(0, MIN_AGE_MINUTES) * 60 * 1000;
const tempAgeArg = args.find((a) => a.startsWith("--temp-age-hours="));
const TEMP_AGE_HOURS = tempAgeArg ? Number(tempAgeArg.split("=")[1]) : 1;
const TEMP_AGE_MS = Math.max(0, TEMP_AGE_HOURS) * 60 * 60 * 1000;

// Directories (relative to UPLOAD_ROOT) to skip during the DB-reference sweep.
// These are handled separately when --clean-temp is provided.
const SKIP_DIRS = new Set(["temp", "tmp_zip"]);

// File extensions considered "media" and therefore eligible for deletion.
const MEDIA_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg",
  ".avif", ".heic", ".heif", ".tif", ".tiff",
  ".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv",
]);

// ---------- Helpers ----------
const toBasename = (p) => {
  if (!p || typeof p !== "string") return null;
  const clean = p.split("?")[0].replace(/\\/g, "/").trim();
  if (!clean) return null;
  const base = path.posix.basename(clean);
  return base || null;
};

// Convert a stored DB value (e.g. "/uploads/u/c/file.png") into a path
// relative to UPLOAD_ROOT using forward slashes ("u/c/file.png").
const toRelativePath = (p) => {
  if (!p || typeof p !== "string") return null;
  const clean = p.split("?")[0].replace(/\\/g, "/").trim();
  if (!clean) return null;
  const idx = clean.indexOf("/uploads/");
  const rel =
    idx !== -1
      ? clean.slice(idx + "/uploads/".length)
      : clean.replace(/^\/+/, "").replace(/^uploads\//, "");
  return rel || null;
};

const collectReferences = async () => {
  const paths = new Set();
  const basenames = new Set();

  const addAll = (...values) => {
    for (const v of values) {
      const items = Array.isArray(v) ? v : [v];
      items.forEach((item) => {
        const rel = toRelativePath(item);
        if (rel) paths.add(rel);
        const base = toBasename(item);
        if (base) basenames.add(base);
      });
    }
  };

  const companies = await Company.find({}, { logo: 1 }).lean();
  companies.forEach((c) => addAll(c.logo));

  const posters = await Poster.find(
    {},
    { company_logo: 1, product_image: 1, product_gallery_images: 1 }
  ).lean();
  posters.forEach((p) =>
    addAll(p.company_logo, p.product_image, p.product_gallery_images)
  );

  return { paths, basenames };
};

const walkFiles = function* (dir, rootRel = "") {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = rootRel ? `${rootRel}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // Skip top-level reserved dirs.
      if (!rootRel && SKIP_DIRS.has(entry.name)) continue;
      yield* walkFiles(abs, rel);
    } else if (entry.isFile()) {
      yield { abs, rel, name: entry.name };
    }
  }
};

// Like walkFiles, but does NOT skip reserved top-level dirs. Used for the
// targeted temp/tmp_zip purge.
const walkFilesUnrestricted = function* (dir, rootRel = "") {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = rootRel ? `${rootRel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      yield* walkFilesUnrestricted(abs, rel);
    } else if (entry.isFile()) {
      yield { abs, rel, name: entry.name };
    }
  }
};

const pruneEmptyDirs = (dir) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }

  let allRemoved = true;
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const sub = path.join(dir, entry.name);
      // Never prune the reserved top-level dirs.
      const isTopLevelReserved =
        path.dirname(sub) === UPLOAD_ROOT && SKIP_DIRS.has(entry.name);
      if (isTopLevelReserved) {
        allRemoved = false;
        continue;
      }
      const removed = pruneEmptyDirs(sub);
      if (!removed) allRemoved = false;
    } else {
      allRemoved = false;
    }
  }

  if (allRemoved && dir !== UPLOAD_ROOT) {
    try {
      fs.rmdirSync(dir);
      console.log(`  [dir] removed empty: ${path.relative(UPLOAD_ROOT, dir)}`);
      return true;
    } catch {
      return false;
    }
  }
  return false;
};

// ---------- Main ----------
const run = async () => {
  console.log("=== cleanUnusedUploads ===");
  console.log(`UPLOAD_ROOT:        ${UPLOAD_ROOT}`);
  console.log(`Mode:               ${DO_DELETE ? "DELETE" : "DRY-RUN"}`);
  console.log(`Min file age (min): ${MIN_AGE_MINUTES}`);
  console.log(`Prune empty dirs:   ${PRUNE_EMPTY ? "yes" : "no"}`);
  console.log(`Clean temp dirs:    ${CLEAN_TEMP ? `yes (>${TEMP_AGE_HOURS}h old)` : "no"}`);
  console.log(`Skipped top dirs:   ${[...SKIP_DIRS].join(", ") || "(none)"}`);
  console.log("");

  if (!fs.existsSync(UPLOAD_ROOT)) {
    console.error(`Upload root does not exist: ${UPLOAD_ROOT}`);
    process.exitCode = 1;
    return;
  }

  connectDb();
  await new Promise((resolve, reject) => {
    mongoose.connection.once("open", resolve);
    mongoose.connection.once("error", reject);
  });

  try {
    const { paths: referencedPaths, basenames: referencedBasenames } =
      await collectReferences();
    console.log(`Referenced paths in DB:    ${referencedPaths.size}`);
    console.log(`Referenced basenames (DB): ${referencedBasenames.size}`);

    const now = Date.now();
    const stats = {
      scanned: 0,
      skippedNonMedia: 0,
      skippedTooNew: 0,
      kept: 0,
      toDelete: 0,
      staleDuplicates: 0,
      deleted: 0,
      bytesFreed: 0,
      errors: 0,
    };

    for (const file of walkFiles(UPLOAD_ROOT)) {
      stats.scanned += 1;
      const ext = path.extname(file.name).toLowerCase();

      if (!MEDIA_EXTENSIONS.has(ext)) {
        stats.skippedNonMedia += 1;
        continue;
      }

      // Exact-path match against the DB. Files whose full relative
      // path matches a stored reference are kept.
      if (referencedPaths.has(file.rel)) {
        stats.kept += 1;
        continue;
      }

      // Otherwise: this file is unreferenced. If its basename matches
      // another DB record (i.e. a stale duplicate that lives at the
      // wrong location — typically the uploads root), still delete it,
      // but tag it so it's visible in the log.
      const isStaleDuplicate = referencedBasenames.has(file.name);

      let st;
      try {
        st = fs.statSync(file.abs);
      } catch {
        stats.errors += 1;
        continue;
      }

      if (MIN_AGE_MS > 0 && now - st.mtimeMs < MIN_AGE_MS) {
        stats.skippedTooNew += 1;
        continue;
      }

      stats.toDelete += 1;
      if (isStaleDuplicate) stats.staleDuplicates += 1;
      const sizeKb = (st.size / 1024).toFixed(1);
      const tag = isStaleDuplicate ? "[stale-dup]" : "[unused]   ";
      console.log(`  ${tag} ${file.rel}  (${sizeKb} KB)`);

      if (DO_DELETE) {
        try {
          fs.unlinkSync(file.abs);
          stats.deleted += 1;
          stats.bytesFreed += st.size;
        } catch (err) {
          stats.errors += 1;
          console.error(`     ! failed to delete: ${err.message}`);
        }
      }
    }

    // ---------- Optional: purge old files inside temp/ and tmp_zip/ ----------
    const tempStats = { scanned: 0, toDelete: 0, deleted: 0, bytesFreed: 0, errors: 0 };
    if (CLEAN_TEMP) {
      console.log("\nScanning temp directories...");
      for (const dirName of SKIP_DIRS) {
        const dirAbs = path.join(UPLOAD_ROOT, dirName);
        if (!fs.existsSync(dirAbs)) continue;

        for (const file of walkFilesUnrestricted(dirAbs, dirName)) {
          tempStats.scanned += 1;
          let st;
          try {
            st = fs.statSync(file.abs);
          } catch {
            tempStats.errors += 1;
            continue;
          }

          if (TEMP_AGE_MS > 0 && now - st.mtimeMs < TEMP_AGE_MS) {
            continue;
          }

          tempStats.toDelete += 1;
          const sizeKb = (st.size / 1024).toFixed(1);
          console.log(`  [temp] ${file.rel}  (${sizeKb} KB)`);

          if (DO_DELETE) {
            try {
              fs.unlinkSync(file.abs);
              tempStats.deleted += 1;
              tempStats.bytesFreed += st.size;
            } catch (err) {
              tempStats.errors += 1;
              console.error(`     ! failed to delete: ${err.message}`);
            }
          }
        }
      }
    }

    if (DO_DELETE && PRUNE_EMPTY) {
      console.log("\nPruning empty directories...");
      pruneEmptyDirs(UPLOAD_ROOT);
    }

    console.log("\n=== Summary ===");
    console.log(`Files scanned:        ${stats.scanned}`);
    console.log(`Non-media skipped:    ${stats.skippedNonMedia}`);
    console.log(`Kept (referenced):    ${stats.kept}`);
    console.log(`Skipped (too new):    ${stats.skippedTooNew}`);
    console.log(`Unused identified:    ${stats.toDelete}`);
    console.log(`  of which stale dup: ${stats.staleDuplicates}`);
    console.log(`Deleted:              ${stats.deleted}`);
    console.log(`Bytes freed:          ${(stats.bytesFreed / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Errors:               ${stats.errors}`);
    if (CLEAN_TEMP) {
      console.log("--- Temp dirs ---");
      console.log(`Temp files scanned:   ${tempStats.scanned}`);
      console.log(`Temp identified:      ${tempStats.toDelete}`);
      console.log(`Temp deleted:         ${tempStats.deleted}`);
      console.log(`Temp bytes freed:     ${(tempStats.bytesFreed / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Temp errors:          ${tempStats.errors}`);
    }
    if (!DO_DELETE) {
      console.log("\nDry-run only. Re-run with --delete to remove the files above.");
    }
  } catch (err) {
    console.error("cleanUnusedUploads failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
