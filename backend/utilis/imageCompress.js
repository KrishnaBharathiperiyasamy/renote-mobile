import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function safeUnlink(filePath) {
    try { await fs.unlink(filePath); } catch { }
}

export const compressImageTemp = async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: "No file uploaded" });
        if (!file.mimetype.startsWith("image"))
            return res.status(400).json({ error: "File must be an image" });

        const TARGET_MB = 3.5;
        const inputPath = file.path;
        const dir = path.dirname(inputPath);

        const originalStats = await fs.stat(inputPath);
        let sizeMB = originalStats.size / (1024 * 1024);
        // ⚡ Skip compression if under target
        if (sizeMB <= TARGET_MB) {
            console.log("⚡ Image under target size → skipping compression.");
            return res.json({
                success: true,
                tempFileName: file.filename,
                finalSize: sizeMB.toFixed(2),
            });
        }

        let quality = 80;
        let width = 2000;
        let continueCompression = true;

        while (continueCompression) {
            const tempOutput = path.join(dir, `temp-${Date.now()}-${file.filename}`);
            console.log(`🗜 Compressing with quality=${quality}, width=${width}`);

            try {
                await sharp(inputPath)
                    .resize({ width })
                    .toFormat("webp", { quality })
                    .toFile(tempOutput);

                await sleep(200); // give Windows time to release handle

                const tempStats = await fs.stat(tempOutput);
                sizeMB = tempStats.size / (1024 * 1024);
                console.log(`✅ Compressed size: ${sizeMB.toFixed(2)} MB`);

                if (sizeMB <= TARGET_MB) {
                    const finalOutput = path.join(dir, `final-${file.filename}`);
                    await fs.copyFile(tempOutput, finalOutput); // safe copy
                    await safeUnlink(tempOutput); // remove temp file
                    console.log(`✅ Compressed file saved as ${finalOutput}`);
                    return res.json({
                        success: true,
                        tempFileName: `final-${file.filename}`,
                        finalSize: sizeMB.toFixed(2),
                    });
                } else {
                    await safeUnlink(tempOutput);
                }
            } catch (err) {
                console.error("Compression iteration error:", err);
                break;
            }

            if (quality > 30) quality -= 10;
            else if (width > 900) width -= 300;
            else continueCompression = false;
        }

        if (sizeMB > TARGET_MB) {
            await safeUnlink(inputPath);
            console.log("❌ Image too large after max compression. Deleted.");
            return res.status(400).json({
                error: `Image too large even after compression. Max allowed is ${TARGET_MB} MB.`,
            });
        }

        return res.json({
            success: true,
            tempFileName: file.filename,
            finalSize: sizeMB.toFixed(2),
        });
    } catch (err) {
        console.error("❌ Image compression error", err);
        return res.status(500).json({ error: "Image processing failed" });
    }
};
