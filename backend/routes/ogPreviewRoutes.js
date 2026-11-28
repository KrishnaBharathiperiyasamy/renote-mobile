import express from "express";
import ShareableLink from "../models/shareableLinkSchema.js";
import Poster from "../models/Poster.js";

const router = express.Router();

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html = "") {
  return String(html).replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

function normalizeUrl(url) {
  if (!url) return "https://renote.co.in/logo.png";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://renote.co.in${url.startsWith("/") ? "" : "/"}${url}`;
}

function getBestImageForOG(poster = {}) {
  const images = [
    poster.product_image,
    ...(Array.isArray(poster.product_gallery_images) ? poster.product_gallery_images : []),
    poster.poster_image,
    poster.thumbnailUrl,
    poster.imageUrl,
    poster.company_id?.logo,
    poster.company_logo,
  ].filter(Boolean);

  const isVideo = (url) => /\.(mp4|webm|mov|avi|m4v)$/i.test(url);
  const photo = images.find((url) => !isVideo(url));
  return photo || images[0] || "/logo.png";
}

// 1. Shareable Link OG Preview: /preview/:token
router.get("/preview/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const link = await ShareableLink.findOne({ token })
      .populate({
        path: "posterIds",
        populate: { path: "company_id" },
      })
      .lean();

    if (!link) return res.status(404).send("Link not found");

    const poster = Array.isArray(link.posterIds) ? link.posterIds[0] : null;
    const company = poster?.company_id || {};

    const vendorCompanyName = escapeHtml(
      link.company_name || company.name || "reNote Vendor"
    );
    const vendorLogoUrl = normalizeUrl(
      link.company_logo || company.logo || "/logo.png"
    );

    const productName = poster?.product_name || poster?.poster_name || poster?.poster_title || link.name || "Poster";
    const price = poster?.marketplacePrice ?? poster?.product_price;
    const priceFormatted = price ? ` • ₹${Number(price).toLocaleString("en-IN")}` : "";

    const title = escapeHtml(`${productName}${priceFormatted}`);
    const rawDesc = poster?.product_description || poster?.description || "Check out this poster on reNote Marketplace";
    const description = escapeHtml(`${vendorCompanyName} • ${stripHtml(rawDesc).slice(0, 160)}`);

    const image = normalizeUrl(getBestImageForOG(poster || {}));

    return res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${title} | ${vendorCompanyName}</title>
    <meta name="description" content="${description}" />

    <!-- Favicon with Vendor Logo -->
    <link rel="icon" type="image/png" href="${vendorLogoUrl}" />
    <link rel="shortcut icon" href="${vendorLogoUrl}" />
    <link rel="apple-touch-icon" href="${vendorLogoUrl}" />

    <!-- Required Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="reNote Marketplace" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="https://renote.co.in/preview/${token}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />

    <!-- Redirect humans -->
    <script>
      const ua = navigator.userAgent.toLowerCase();
      const isBot = ua.includes('facebookexternalhit') ||
                    ua.includes('twitterbot') ||
                    ua.includes('linkedinbot') ||
                    ua.includes('slackbot') ||
                    ua.includes('telegrambot') ||
                    ua.includes('whatsapp') ||
                    ua.includes('discordbot');

      if (!isBot) {
        window.location.href = "https://renote.co.in/pages/view?token=${token}";
      }
    </script>
  </head>
  <body>Redirecting to ${vendorCompanyName}...</body>
</html>`);
  } catch (err) {
    console.error("OG link preview error:", err);
    res.status(500).send("Internal server error");
  }
});

// 2. Poster / Marketplace Item OG Preview: /preview/poster/:posterId
router.get("/preview/poster/:posterId", async (req, res) => {
  try {
    const { posterId } = req.params;

    const poster = await Poster.findById(posterId)
      .populate("company_id")
      .lean();

    if (!poster) return res.status(404).send("Poster not found");

    const company = poster.company_id || {};
    const vendorCompanyName = escapeHtml(
      company.name || poster.company_name || "reNote Vendor"
    );
    const city = poster.marketplaceCity || company.city;
    const vendorLogoUrl = normalizeUrl(
      company.logo || poster.company_logo || "/logo.png"
    );

    const productName = poster.product_name || poster.poster_name || poster.poster_title || "Marketplace Poster";
    const price = poster.marketplacePrice ?? poster.product_price;
    const priceFormatted = price ? ` • ₹${Number(price).toLocaleString("en-IN")}` : "";

    const title = escapeHtml(`${productName}${priceFormatted}`);
    const rawDesc = poster.product_description
      ? stripHtml(poster.product_description).slice(0, 160)
      : `Check out ${productName} by ${vendorCompanyName} on reNote Marketplace`;

    const description = escapeHtml(`${vendorCompanyName}${city ? ` (${city})` : ""} • ${rawDesc}`);

    const image = normalizeUrl(getBestImageForOG(poster));

    return res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${title} | ${vendorCompanyName}</title>
    <meta name="description" content="${description}" />

    <!-- Favicon with Vendor Logo -->
    <link rel="icon" type="image/png" href="${vendorLogoUrl}" />
    <link rel="shortcut icon" href="${vendorLogoUrl}" />
    <link rel="apple-touch-icon" href="${vendorLogoUrl}" />

    <!-- Required Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="reNote Marketplace" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="https://renote.co.in/preview/poster/${posterId}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />

    <!-- Redirect humans -->
    <script>
      const ua = navigator.userAgent.toLowerCase();
      const isBot = ua.includes('facebookexternalhit') ||
                    ua.includes('twitterbot') ||
                    ua.includes('linkedinbot') ||
                    ua.includes('slackbot') ||
                    ua.includes('telegrambot') ||
                    ua.includes('whatsapp') ||
                    ua.includes('discordbot');

      if (!isBot) {
        window.location.href = "https://renote.co.in/pages/marketplace?posterId=${posterId}";
      }
    </script>
  </head>
  <body>Redirecting to ${vendorCompanyName}...</body>
</html>`);
  } catch (err) {
    console.error("OG poster preview error:", err);
    res.status(500).send("Internal server error");
  }
});

export default router;
