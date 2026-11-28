import express from "express";
import { fileURLToPath } from "url";
import { createServer } from "http";
import connectDb from "./db.js";
import ogPreviewRoutes from "./routes/ogPreviewRoutes.js"
import contactRoutes from "./routes/contactRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import linkRoutes from "./routes/linkRoutes.js";
import { redirectShortUrl } from "./controllers/linkController.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import path from "path";
import fs from "fs";
import syncRoutes from "./routes/syncRoutes.js";
import xlsxRoutes from "./routes/xlsx.js"
import adminRoutes from "./routes/adminRoutes.js";
import posterRoutes from "./routes/posterRoutes.js"
import planRoutes from "./routes/planRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import razorpayRoutes from "./routes/razorpayRoutes.js";
import quotationRoutes from "./routes/quotationRoutes.js";
import gstRoutes from "./routes/gstRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { UPLOAD_ROOT, ensureDir, resolveUploadPath } from './utils/uploadPaths.js';
import { handlePanVerifyPostback } from "./controllers/panVerificationController.js";
import cors from 'cors';
import { initSocket } from './utils/socket.js';
import { seedSuperAdmin } from "./utils/seedSuperAdmin.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import { seedCategoriesIfNeeded } from "./scripts/seedCategories.js";
import maintenanceCheck from "./middleware/maintenanceCheck.js";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


// Chrome/Chromium Private Network Access (PNA) preflight header support
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

const allowedOrigins = [
  'https://renote.krishub.in',
  'https://renote.co.in',
  'http://renote.co.in',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3004',
  'http://localhost:6001',
  'http://localhost:6003',
  /\.trycloudflare\.com$/,
  /\.devtunnels\.ms$/,
  /\.loca\.lt$/,
  /\.app\.github\.dev$/,
  /\.ngrok(-free)?\.app$/,
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Allow any localhost, 127.0.0.1, 0.0.0.0, or local IPv4 on any port
    if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    const isAllowed = allowedOrigins.some((pattern) => {
      if (typeof pattern === 'string') return pattern === origin;
      if (pattern instanceof RegExp) return pattern.test(origin);
      return false;
    });
    if (isAllowed) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
    'Expires',
    'If-Modified-Since',
    'If-None-Match',
    'Access-Control-Request-Headers',
    'Access-Control-Request-Method',
    'Access-Control-Request-Private-Network',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Access-Control-Allow-Private-Network'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Handle all preflight requests safely in Express 5 using regex
app.options(/.*/, cors(corsOptions));

import marketplaceRoutes from "./routes/marketplaceRoutes.js";

// Routes
app.get("/", (req, res) => {
  res.send("Hello, I am alive");
});

// Super Admin routes (before maintenance check)
app.use("/api/superadmin", superAdminRoutes);

// Maintenance mode gate (blocks non-SA routes when enabled)
app.use(maintenanceCheck);

app.use("/", ogPreviewRoutes);
app.use("/api", ogPreviewRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/posters", posterRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/links", linkRoutes);
app.get("/s/:slug", redirectShortUrl);
app.use("/api/admin", adminRoutes);
app.use("/api/xlsx", xlsxRoutes)
app.use("/api/otp", otpRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/gst", gstRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/settings", settingsRoutes);
app.post("/api/consent/postback", handlePanVerifyPostback);
const staticUploadDirs = Array.from(
  new Set([
    UPLOAD_ROOT,
    path.resolve("D:/myreno/uploads"),
    process.env.LOCAL_UPLOAD_ROOT ? path.resolve(process.env.LOCAL_UPLOAD_ROOT) : null,
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "uploads"),
    "/k_live/data/renote/uploads",
  ].filter(Boolean))
);

staticUploadDirs.forEach((dirPath) => {
  ensureDir(dirPath);
  app.use("/uploads", express.static(dirPath));
});

// Upstream proxy fallback: if asset does not exist locally, fetch from live backend and cache
app.use("/uploads", async (req, res, next) => {
  try {
    const upstreamUrl = `https://renote.co.in/uploads${req.path}`;
    const response = await fetch(upstreamUrl);
    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      const buffer = Buffer.from(await response.arrayBuffer());
      try {
        const localDest = path.join(UPLOAD_ROOT, req.path);
        fs.mkdirSync(path.dirname(localDest), { recursive: true });
        fs.writeFileSync(localDest, buffer);
      } catch {}
      return res.send(buffer);
    }
  } catch (err) {
    // pass through to 404
  }
  next();
});
app.use((req, res) => { return res.status(404).json({ msg: "invalid url" }) })
// Server restarted for auth routes
const PORT = process.env.PORT || 6003;

const startServer = async () => {
  try {
    await connectDb();
    await seedCategoriesIfNeeded();
    await seedSuperAdmin();
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();

