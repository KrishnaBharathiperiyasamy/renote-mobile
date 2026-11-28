import fs from "fs/promises";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

const binPath = path.resolve("./bin");
const isWindows = process.platform === "win32";
ffmpeg.setFfmpegPath(path.join(binPath, isWindows ? "ffmpeg.exe" : "ffmpeg-linux"));
ffmpeg.setFfprobePath(path.join(binPath, isWindows ? "ffprobe.exe" : "ffprobe-linux"));

export const compressVideoTemp = async (req, res) => {
  const result = await compressVideoTempCore(req);
  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }
  return res.json(result);
};

/**
 * Core video compression logic. Returns an object (no res interaction).
 * On success: { success, tempFileName, originalMB, compressedMB, compressedBytes }
 * On failure: { error, status }
 */
export const compressVideoTempCore = async (req) => {
  try {
    const file = req.file;
    if (!file) return { error: "No file uploaded", status: 400 };
    if (!file.mimetype.startsWith("video"))
      return { error: "File must be a video", status: 400 };

    const TARGET_MB = 16;
    const inputPath = file.path;
    const dir = path.dirname(inputPath);
    const tempOutput = path.join(dir, "temp-" + file.filename);

    const stats = await fs.stat(inputPath);
    const originalMB = stats.size / (1024 * 1024);
    console.log(`📄 Original file: ${file.filename}, Size: ${originalMB.toFixed(2)} MB`);

    // ⚡ Skip compression entirely if already under target
    if (originalMB <= TARGET_MB) {
      console.log("⚡ Video already under target size → skipping compression.");
      return {
        success: true,
        tempFileName: file.filename,
        originalMB: originalMB.toFixed(2),
        compressedMB: originalMB.toFixed(2),
        compressedBytes: stats.size,
      };
    }

    let compressedMB = originalMB;
    // Start at CRF 28; jump by 4 each pass for faster convergence
    let crf = 28;

    while (compressedMB > TARGET_MB && crf <= 44) {
      console.log(`🎬 Compressing with CRF ${crf}...`);

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .videoCodec("libx264")
          .size("?x720")
          .outputOptions([
            `-crf ${crf}`,
            "-preset ultrafast",   // ⚡ Much faster than "fast"
            "-threads 0",          // ⚡ Use all CPU cores
            "-movflags +faststart", // web-optimised
          ])
          .save(tempOutput)
          .on("end", resolve)
          .on("error", reject);
      });

      const compressedStats = await fs.stat(tempOutput);
      compressedMB = compressedStats.size / (1024 * 1024);
      console.log(`✅ Compressed size: ${compressedMB.toFixed(2)} MB`);

      await fs.unlink(inputPath);
      await fs.rename(tempOutput, inputPath);
      crf += 4; // jump faster
    }

    if (compressedMB > TARGET_MB) {
      await fs.unlink(inputPath);
      console.log("❌ File exceeds target size even after compression, deleted.");
      return {
        error: `Video too large even after compression. Max allowed size: ${TARGET_MB} MB`,
        status: 400,
      };
    }

    const finalStats = await fs.stat(inputPath);
    return {
      success: true,
      tempFileName: file.filename,
      originalMB: originalMB.toFixed(2),
      compressedMB: compressedMB.toFixed(2),
      compressedBytes: finalStats.size,
    };

  } catch (err) {
    console.error("❌ Temp compression error", err);
    return { error: "Video processing failed", status: 500 };
  }
};
