# Scripts

Operational maintenance scripts for the `renote_be` backend. Run from the project root unless noted.

## `cleanUnusedUploads.js`

Deletes media files under `UPLOAD_ROOT` (default `./uploads`) that are **not referenced** by any DB record. References are collected from:

- `Company.logo`
- `Poster.company_logo`
- `Poster.product_image`
- `Poster.product_gallery_images[]`

Matching is done by **full relative path** (e.g. `userId/companyId/file.png`), so stale duplicates that live at the wrong location (e.g. directly under `uploads/`) are also removed.

### Safety

- Dry-run by default — no files are touched unless `--delete` is passed.
- Files modified within the last 60 minutes are skipped (configurable via `--min-age-minutes`).
- `uploads/temp/` and `uploads/tmp_zip/` are excluded from the main sweep and handled by a separate temp-purge pass (enabled by default with `--delete`; opt out via `--no-clean-temp`). Temp files older than 1 hour are removed (configurable via `--temp-age-hours`).
- Non-media files (`.txt`, `.json`, etc.) are left alone.

### Commands

```powershell
# Preview first:
node scripts/cleanUnusedUploads.js

# Delete (respects the 60-min age guard):
node scripts/cleanUnusedUploads.js --delete

# Aggressive — ignore age guard, also clean temp dirs immediately:
node scripts/cleanUnusedUploads.js --delete --min-age-minutes=0 --temp-age-hours=0
```

### All flags

| Flag                       | Default | Description                                                                  |
| -------------------------- | ------- | ---------------------------------------------------------------------------- |
| `--delete`                 | off     | Perform deletions. Without this, the script only prints what would be removed. |
| `--min-age-minutes=N`      | `60`    | Skip unused files modified within the last `N` minutes. Use `0` to disable.   |
| `--no-clean-temp`          | off     | Skip the `uploads/temp/` and `uploads/tmp_zip/` cleanup pass.                 |
| `--temp-age-hours=N`       | `1`     | Only purge temp files older than `N` hours. Use `0` to purge all.             |
| `--prune-empty`            | off     | After deletions, remove any directories left empty (excluding reserved dirs). |

---

## `migrateProductImagesToUserCompanyFolder.js`

One-time migration that moves `Poster.product_image` files stored at the uploads root (e.g. `/uploads/<file>`) into the per-user/per-company folder (`/uploads/{userId}/{companyId}/<file>`) and updates the DB path.

If the source file is missing at root but found under the user's folder, the DB record is fixed without moving anything.

```powershell
# Preview:
node scripts/migrateProductImagesToUserCompanyFolder.js

# Apply:
node scripts/migrateProductImagesToUserCompanyFolder.js --apply
```
