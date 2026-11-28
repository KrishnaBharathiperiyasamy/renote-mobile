import fs from "fs/promises";
import path from "path";

const VIDEO_DIR = path.join("public", "rendered", "videos");
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 2 days

async function autoCleanupOldVideos() {
    try {
        const files = await fs.readdir(VIDEO_DIR);

        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(VIDEO_DIR, file);
            const stats = await fs.stat(filePath);
            const age = now - stats.mtimeMs;

            if (age > MAX_AGE_MS) {
                await fs.unlink(filePath);
                console.log("🗑 Deleted expired video:", file);
            }
        }
    } catch (err) {
        console.error("Cleanup error:", err);
    }
}

export default autoCleanupOldVideos;