import puppeteer from "puppeteer";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import Poster from "../models/Poster.js";
import autoCleanupOldVideos from "./autoCleanVideos.js";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import { execFile } from "child_process";
import { promisify } from "util";
const execFileAsync = promisify(execFile);

const getFrontendOrigins = () => {
  const primary = (process.env.FRONTEND_URL || "").trim();
  const extra = (process.env.FRONTEND_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  const candidates = [primary, ...extra].filter(Boolean);

  if (candidates.length > 0) {
    return [...new Set(candidates)];
  }

  if (process.env.NODE_ENV === "production") {
    return [];
  }

  return ["http://localhost:6001", "http://localhost:3001"];
};

const buildPosterPagePaths = (posterId) => [
  `/pages/createPoster?posterId=${posterId}&preview=true&recording=true`,
  `/createPoster?posterId=${posterId}&preview=true&recording=true`,
];

const waitForPosterRoot = async (page) => {
  await page.waitForFunction(
    () => Boolean(document.querySelector(".frame") || document.querySelector("#posterFrame")),
    { timeout: 45000 }
  );
};

const binPath = path.resolve("./bin");
const isWindows = process.platform === "win32";
const FFMPEG_PATH = path.join(binPath, isWindows ? "ffmpeg.exe" : "ffmpeg-linux");
const FFPROBE_PATH = path.join(binPath, isWindows ? "ffprobe.exe" : "ffprobe-linux");
ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

// ---------------------------------------------------------------------------
// Warm Puppeteer browser singleton.
// Avoids ~1-2s launch cost on every render. Auto-closes after idle timeout.
// ---------------------------------------------------------------------------
let _browserPromise = null;
let _browserIdleTimer = null;
const BROWSER_IDLE_MS = 5 * 60 * 1000;

const launchBrowser = () =>
  puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--no-first-run",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
    ],
  });

const getBrowser = async () => {
  if (!_browserPromise) {
    _browserPromise = launchBrowser();
    try {
      const b = await _browserPromise;
      b.on("disconnected", () => { _browserPromise = null; });
    } catch (e) {
      _browserPromise = null;
      throw e;
    }
  }
  return _browserPromise;
};

const scheduleBrowserIdleClose = () => {
  if (_browserIdleTimer) clearTimeout(_browserIdleTimer);
  _browserIdleTimer = setTimeout(async () => {
    const p = _browserPromise;
    _browserPromise = null;
    try {
      const b = await p;
      await b?.close();
    } catch {}
  }, BROWSER_IDLE_MS);
};

// ---------------------------------------------------------------------------
// In-flight render dedupe — same poster+version requested twice = one render.
// ---------------------------------------------------------------------------
const _inflight = new Map();

// ---------------------------------------------------------------------------
// Core renderer — returns the path to a cached mp4 (renders on miss).
// ---------------------------------------------------------------------------
const renderPosterVideo = async ({ poster, token, user_id }) => {
  autoCleanupOldVideos().catch(() => {});

  const version = poster.updatedAt.getTime();
  const outputDir = path.resolve("public", "rendered", "videos");
  await fs.mkdir(outputDir, { recursive: true });
  const fileName = `${poster._id}_${version}.mp4`;
  const finalRenderedPath = path.join(outputDir, fileName);

  // Cache hit
  try {
    await fs.access(finalRenderedPath);
    return finalRenderedPath;
  } catch {}

  // Dedupe concurrent renders for the same output file
  if (_inflight.has(finalRenderedPath)) {
    return _inflight.get(finalRenderedPath);
  }

  const job = (async () => {
    const tempDir = path.resolve("public", "downloads");
    await fs.mkdir(tempDir, { recursive: true });
    const recordedPath = path.join(tempDir, `${poster._id}-record.mp4`);
    const screenshotPath = path.join(tempDir, `${poster._id}-frame.png`);
    const trimmedPath = path.join(tempDir, `${poster._id}-trimmed.mp4`);

    let finalW = 550, finalH = 550, cropX = 0, cropY = 0;
    const vpSize = 768;
    const dpr = 2;
    let page = null;

    const browser = await getBrowser();
    if (_browserIdleTimer) clearTimeout(_browserIdleTimer);

    try {
      const paths = buildPosterPagePaths(poster._id);
      const origins = getFrontendOrigins();
      if (origins.length === 0) {
        throw new Error("No frontend origin configured. Set FRONTEND_URL (and optional FRONTEND_URLS).");
      }

      let lastNavigationError = null;
      let navigatedUrl = "";

      for (const origin of origins) {
        for (const pagePath of paths) {
          const pageUrl = `${origin}${pagePath}`;
          try {
            if (page) await page.close().catch(() => {});
            page = await browser.newPage();
            await page.setViewport({ width: vpSize, height: vpSize, deviceScaleFactor: dpr });
            page.on("requestfailed", () => {});
            page.on("pageerror", () => {});

            await page.evaluateOnNewDocument((data) => {
              localStorage.setItem("token", data.token);
              localStorage.setItem("user_id", data.user_id);
            }, { token, user_id });
            await page.setExtraHTTPHeaders({ Authorization: `Bearer ${token}` });

            await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
            await waitForPosterRoot(page);
            navigatedUrl = pageUrl;
            lastNavigationError = null;
            break;
          } catch (error) {
            lastNavigationError = error;
          }
        }
        if (!lastNavigationError) break;
      }

      if (lastNavigationError) {
        throw new Error(`Unable to load poster page from configured frontend origins. Last error: ${lastNavigationError.message}`);
      }
      if (!page || page.isClosed()) {
        throw new Error("Browser page closed unexpectedly during poster rendering.");
      }

      const currentUrl = page.url();
      if (!navigatedUrl || /login|signin/i.test(currentUrl)) {
        throw new Error(`Poster page redirected unexpectedly to ${currentUrl}. Check auth propagation.`);
      }

      await page.waitForSelector('.frame, #posterFrame', { timeout: 45000 });

      // Wait for inner video to be ready (if any)
      await page.evaluate(() => {
        return new Promise((resolve) => {
          const vid = document.querySelector('.image-container video');
          if (!vid) return resolve();
          if (vid.readyState >= 3) return resolve();
          vid.addEventListener('canplay', resolve, { once: true });
          setTimeout(resolve, 5000);
        });
      });

      const cleanupStyles = async () => {
        await page.evaluate(() => {
          document.documentElement.style.setProperty('scrollbar-width', 'none', 'important');
          if (!document.getElementById('_rec_sb')) {
            const s = document.createElement('style'); s.id = '_rec_sb';
            s.textContent = '::-webkit-scrollbar{display:none!important}';
            document.head.appendChild(s);
          }
          const frame = document.querySelector('.frame');
          if (frame) {
            const bg = getComputedStyle(frame).background;
            document.body.style.setProperty('background', bg, 'important');
          }
          for (const el of [document.documentElement, document.body]) {
            el.style.setProperty('margin', '0', 'important');
            el.style.setProperty('padding', '0', 'important');
            el.style.setProperty('overflow', 'hidden', 'important');
          }
          const pc = document.getElementById('posterFrame');
          if (pc) {
            pc.style.setProperty('padding', '0', 'important');
            pc.style.setProperty('margin', '0', 'important');
          }
        });
      };
      await cleanupStyles();

      const frameEl = await page.$('.frame');
      const frameHandle = await page.$('#posterFrame');
      const measureEl = frameEl || frameHandle;
      if (!measureEl) throw new Error("Poster frame element not found after navigation.");

      let bbox = await measureEl.boundingBox();
      if (!bbox) throw new Error("Unable to measure poster frame bounding box.");

      let recW = Math.max(768, Math.ceil(bbox.width / 2) * 2);
      let recH = Math.ceil(bbox.height / 2) * 2;
      await page.setViewport({ width: recW, height: recH, deviceScaleFactor: dpr });
      await cleanupStyles();
      await new Promise((r) => setTimeout(r, 50));

      bbox = await measureEl.boundingBox();
      cropX = Math.floor(bbox.x);
      cropY = Math.floor(bbox.y);
      finalW = Math.floor(bbox.width / 2) * 2;
      finalH = Math.floor(bbox.height / 2) * 2;

      // ----------------------------------------------------------------
      // FAST PATH: image-only poster → one screenshot wrapped in a tiny mp4.
      // Skips screen recording entirely (saves many seconds).
      // ----------------------------------------------------------------
      if (!poster.isVideo) {
        await measureEl.screenshot({ path: screenshotPath, type: "png" });

        ffmpeg.setFfmpegPath(FFMPEG_PATH);
        ffmpeg.setFfprobePath(FFPROBE_PATH);
        await new Promise((resolve, reject) => {
          ffmpeg(screenshotPath)
            .inputOptions(["-loop", "1", "-framerate", "30"])
            .videoCodec("libx264")
            .outputOptions([
              "-t", "3",
              "-r", "30",
              "-crf", "20",
              "-preset", "veryfast",
              "-pix_fmt", "yuv420p",
              "-movflags", "+faststart",
              "-vf", `scale=${finalW}:${finalH}:flags=lanczos`,
              "-an",
            ])
            .save(trimmedPath)
            .on("end", resolve)
            .on("error", reject);
        });

        try {
          await fs.rename(trimmedPath, finalRenderedPath);
        } catch {
          await fs.copyFile(trimmedPath, finalRenderedPath);
          fs.unlink(trimmedPath).catch(() => {});
        }
        fs.unlink(screenshotPath).catch(() => {});
        return finalRenderedPath;
      }

      // ----------------------------------------------------------------
      // VIDEO PATH: live screen recording (must run for video duration).
      // ----------------------------------------------------------------
      const recorder = new PuppeteerScreenRecorder(page, {
        fps: 30,
        ffmpeg_Path: FFMPEG_PATH,
        videoFrame: { width: recW * dpr, height: recH * dpr },
      });
      await recorder.start(recordedPath);
      const durationSource = frameHandle || frameEl;
      const duration = await durationSource.evaluate(() => {
        const vid = document.querySelector(".image-container video");
        return vid?.duration ? vid.duration * 1000 : 8000;
      });
      await new Promise((resolve) => setTimeout(resolve, duration + 200));
      await recorder.stop();
    } finally {
      if (page) await page.close().catch(() => {});
      scheduleBrowserIdleClose();
    }

    // Re-set ffmpeg path (PuppeteerScreenRecorder overrides it)
    ffmpeg.setFfmpegPath(FFMPEG_PATH);
    ffmpeg.setFfprobePath(FFPROBE_PATH);

    // Detect audio from original product video
    let originalVideoPath = null;
    let hasAudio = false;
    if (poster.isVideo && poster.product_image) {
      originalVideoPath = path.resolve(poster.product_image.replace(/^\//, ""));
      try {
        await fs.access(originalVideoPath);
        const { stdout } = await execFileAsync(FFPROBE_PATH, [
          "-v", "error",
          "-select_streams", "a:0",
          "-show_entries", "stream=codec_type",
          "-of", "csv=p=0",
          originalVideoPath,
        ]);
        hasAudio = stdout.trim() === "audio";
      } catch {
        hasAudio = false;
      }
    }

    let heavyCompression = false;
    if (originalVideoPath) {
      try {
        const originalStat = await fs.stat(originalVideoPath);
        const originalSizeMB = originalStat.size / (1024 * 1024);
        heavyCompression = originalSizeMB > 16;
      } catch {}
    }

    const outW = finalW;
    const outH = finalH;
    await new Promise((resolve, reject) => {
      const cmd = ffmpeg(recordedPath);
      if (hasAudio && originalVideoPath) cmd.input(originalVideoPath);
      cmd.videoCodec("libx264")
        .outputOptions([
          "-crf", heavyCompression ? "22" : "18",
          "-preset", "veryfast",
          "-pix_fmt", "yuv420p",
          "-movflags", "+faststart",
          ...(hasAudio
            ? ["-map", "0:v:0", "-map", "1:a:0", "-c:a", "aac", "-b:a", "128k", "-shortest"]
            : ["-an"]),
        ])
        .videoFilters(
          `crop=${finalW * dpr}:${finalH * dpr}:${cropX * dpr}:${cropY * dpr},scale=${outW}:${outH}:flags=lanczos`
        )
        .save(trimmedPath)
        .on("end", resolve)
        .on("error", reject);
    });

    try {
      await fs.rename(trimmedPath, finalRenderedPath);
    } catch {
      await fs.copyFile(trimmedPath, finalRenderedPath);
      fs.unlink(trimmedPath).catch(() => {});
    }
    fs.unlink(recordedPath).catch(() => {});
    return finalRenderedPath;
  })();

  _inflight.set(finalRenderedPath, job);
  try {
    return await job;
  } finally {
    _inflight.delete(finalRenderedPath);
  }
};

// ---------------------------------------------------------------------------
// HTTP: download. Waits for render if no cache, instant on cache hit.
// ---------------------------------------------------------------------------
export const downloadPosterWithVideo = async (req, res) => {
  try {
    const { user_id: bodyUserId, poster_id } = req.body;
    const user_id = bodyUserId || req.user?.userId || req.user?.id;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || !user_id || !poster_id)
      return res.status(400).json({ error: "Missing token or params" });

    const poster = await Poster.findOne({ _id: poster_id, user_id });
    if (!poster) return res.status(404).json({ error: "Poster not found" });

    const finalRenderedPath = await renderPosterVideo({ poster, token, user_id });
    res.setHeader("Content-Type", "video/mp4");
    return res.download(finalRenderedPath, `${poster.poster_title}.mp4`);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Unexpected server error" });
    }
  }
};

// ---------------------------------------------------------------------------
// HTTP: fire-and-forget prerender.
// Returns 202 immediately and renders in the background so the user's later
// download is instant. Call this from the frontend after saving the poster
// (or when the user opens the poster editor / hovers the download button).
// ---------------------------------------------------------------------------
export const prerenderPosterVideo = async (req, res) => {
  try {
    const { user_id: bodyUserId, poster_id } = req.body;
    const user_id = bodyUserId || req.user?.userId || req.user?.id;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || !user_id || !poster_id)
      return res.status(400).json({ error: "Missing token or params" });

    const poster = await Poster.findOne({ _id: poster_id, user_id });
    if (!poster) return res.status(404).json({ error: "Poster not found" });

    const version = poster.updatedAt.getTime();
    const outputDir = path.resolve("public", "rendered", "videos");
    const finalRenderedPath = path.join(outputDir, `${poster_id}_${version}.mp4`);
    let cached = false;
    try {
      await fs.access(finalRenderedPath);
      cached = true;
    } catch {}

    if (!cached) {
      renderPosterVideo({ poster, token, user_id }).catch((e) => {
        console.error("prerender failed:", e?.message || e);
      });
    }

    return res
      .status(cached ? 200 : 202)
      .json({ cached, status: cached ? "ready" : "rendering" });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Unexpected server error" });
  }
};

export const clearVideoCache = async (req, res) => {
  try {
    const { poster_id } = req.params;
    if (!poster_id) return res.status(400).json({ error: "Missing poster_id" });
    const outputDir = path.resolve("public", "rendered", "videos");
    const files = await fs.readdir(outputDir).catch(() => []);
    const toDelete = files.filter((f) => f.startsWith(poster_id));
    await Promise.all(toDelete.map((f) => fs.unlink(path.join(outputDir, f)).catch(() => {})));
    res.json({ cleared: toDelete.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear cache" });
  }
};
