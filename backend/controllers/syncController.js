// controllers/syncController.js
import Invoice from "../models/Invoice.js";
import Company from "../models/Company.js";
import Poster from "../models/Poster.js";
import Product from "../models/Product.js";
import Quotation from "../models/Quotation.js";
import fs from "fs";
import path from "path";
import { ensureDir, resolveUploadPath } from "../utils/uploadPaths.js";

const syncLocalBackend = async (req, res) => {
  try {
    const userId = req.params.userId;
    const localQuotations = req.body.localQuotations;

    if (!Array.isArray(localQuotations) || localQuotations.length === 0)
      return res.status(400).json({ message: "No local quotations to sync" });
    // Step 1: Collect unique companies (vendors + customers)
    const companyMap = new Map();
    for (const q of localQuotations) {
      if (q.company?.name && !companyMap.has(q.company.name)) {
        companyMap.set(q.company.name, { ...q.company, flag: "vendor" });
      }
      q.customers?.forEach((cust) => {
        if (cust.name && !companyMap.has(cust.name)) {
          companyMap.set(cust.name, { ...cust, flag: "customer" });
        }
      });
    }
    const companiesData = Array.from(companyMap.values());
    // Step 2: Check DB & Save companies
    const savedCompanies = [];
    const companyIdMap = {};

    for (const companyData of companiesData) {
      const normalizedName = companyData.name.trim();
      const gstNo = companyData.gstNo ? companyData.gstNo.trim() : null;

      // Check existing by name
      let existingCompany = await Company.findOne({
        userId,
        isDeleted: false,
        name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
      });

      if (!existingCompany && gstNo) {
        existingCompany = await Company.findOne({
          gstNo,
          userId,
          isDeleted: false,
        });
      }

      if (existingCompany) {
        companyIdMap[companyData.name] = existingCompany._id.toString();
        savedCompanies.push(existingCompany);
      } else {
        // Create new company
        const company = new Company({
          logo: companyData.logo || null,
          name: normalizedName,
          phone: companyData.phone || companyData.phoneNumber,
          email: companyData.email || null,
          address: companyData.address || null,
          city: companyData.city || "Unknown",
          state: companyData.state || null,
          zipCode: companyData.zipCode || null,
          gstNo: gstNo || null,
          companyType: companyData.companyType || "General",
          description: companyData.description || null,
          userId,
          quotations: [],
          isDeleted: false,
          flag: companyData.flag,
        });

        const saved = await company.save();
        savedCompanies.push(saved);
        companyIdMap[companyData.name] = saved._id.toString();
      }
    }

    // Step 3: Create quotations & products
    const savedQuotations = [];

    for (const q of localQuotations) {
      const companyIds = [];
      if (q.company?.name && companyIdMap[q.company.name]) {
        companyIds.push(companyIdMap[q.company.name]);
      }

      const customers = (q.customers || []).map((c) => ({
        name: c.name,
        phoneNumber: c.phone || c.phoneNumber,
        email: c.email || "",
        address: c.address || "",
        gstNo: c.gstNo || "",
      }));

      // Generate sequential estimateID
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const prefix = `E${year}${month}`;

      const allUserQuotations = await Quotation.find({ user_id: userId });
      let maxNum = 0;

      allUserQuotations.forEach((q) => {
        if (q.estimateID?.startsWith(prefix)) {
          const num = parseInt(q.estimateID.slice(prefix.length), 10);
          if (num > maxNum) maxNum = num;
        }
      });

      const newEstimateID = `${prefix}${String(maxNum + 1).padStart(3, "0")}`;
      // Handle products
      const processedProducts = await Promise.all(
        (q.products || []).map(async (p) => {
          const name = p.name?.trim();
          if (!name) return null;

          let existingProduct = await Product.findOne({
            user_id: userId,
            name,
          });

          if (!existingProduct && companyIds.length) {
            existingProduct = new Product({
              name,
              price: Number(p.price) || 0,
              qty: 0,
              unit: p.unit || "",
              gst: Number(p.gst) || 0,
              user_id: userId,
              company_id: companyIds[0],
            });
            await existingProduct.save();
          }

          return {
            productId: existingProduct?._id,
            name: name,
            quantity: Number(p.quantity) || 0,
            price: Number(p.price) || 0,
            gst: Number(p.gst) || 0,
            unit: p.unit || "",
          };
        })
      );

      // Create quotation
      const newQuotation = new Quotation({
        estimateID: newEstimateID,
        user_id: userId,
        products: processedProducts.filter(Boolean),
        company_id: companyIds,
        customers,
      });

      const savedQuotation = await newQuotation.save();
      savedQuotations.push(savedQuotation);

      // Link quotation to companies
      await Company.updateMany(
        { _id: { $in: companyIds } },
        { $push: { quotations: savedQuotation._id } }
      );
    }

    res.status(201).json({
      message: "Local data synced successfully",
      companies: savedCompanies,
      quotations: savedQuotations,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to sync local data", error: err.message });
  }
};

const saveImageFromBase64 = (base64Data, folder = resolveUploadPath()) => {
  if (!base64Data) return "";
  const matches = base64Data.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return "";

  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const filePath = path.join(folder, fileName);
  ensureDir(folder);
  fs.writeFileSync(filePath, buffer);
  return path.posix.join("uploads", fileName);
};

const normalizeZoomValue = (value, fallback = 1) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return numeric;
};

const normalizeNumberArrayInput = (value) => {
  if (value === undefined || value === null) return [];

  if (Array.isArray(value)) return value.map((item) => Number(item));

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => Number(item));
    } catch {
      // Fall back to comma-separated input.
    }

    return trimmed.split(",").map((item) => Number(item.trim()));
  }

  return [];
};

const buildGalleryZoomArray = (galleryImages, zoomInput) => {
  if (!Array.isArray(galleryImages) || galleryImages.length === 0) return [];
  const providedZoom = normalizeNumberArrayInput(zoomInput);
  if (providedZoom.length === 0) return galleryImages.map(() => 1);
  return galleryImages.map((_, index) => normalizeZoomValue(providedZoom[index], 1));
};

const normalizePositionValue = (value) => {
  if (!value || typeof value !== "object") {
    return { x: 0, y: 0 };
  }

  const x = Number(value.x);
  const y = Number(value.y);

  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
  };
};

const normalizePositionArrayInput = (value) => {
  if (value === undefined || value === null) return [];

  if (Array.isArray(value)) {
    return value.map((item) => normalizePositionValue(item));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => normalizePositionValue(item));
      }
    } catch {
      // Ignore invalid JSON and fall back to defaults.
    }
  }

  return [];
};

const buildGalleryPositionArray = (galleryImages, positionInput) => {
  if (!Array.isArray(galleryImages) || galleryImages.length === 0) return [];

  const providedPositions = normalizePositionArrayInput(positionInput);
  if (providedPositions.length === 0) {
    return galleryImages.map(() => ({ x: 0, y: 0 }));
  }

  return galleryImages.map((_, index) => normalizePositionValue(providedPositions[index]));
};

const syncPosters = async (req, res) => {
  try {
    const { userId } = req.params;
    const { posters } = req.body; // array of poster objects

    if (!Array.isArray(posters) || posters.length === 0) {
      return res.status(400).json({ error: "No posters to sync" });
    }

    const existingPosters = await Poster.find({ user_id: userId });
    const existingNames = existingPosters.map((p) => p.poster_name);

    // Get max number for posterId
    let maxNum = 0;
    if (existingPosters.length > 0) {
      maxNum = Math.max(
        ...existingPosters.map((p) => parseInt(p.posterId?.replace("POS-", ""), 10) || 0)
      );
    }

    const savedPosters = [];

    for (let poster of posters) {
      const {
        poster_title,
        product_name,
        product_description,
        product_price,
        product_image,
        product_gallery_images,
        product_gallery_zoom,
        product_gallery_positions,
        company_logo,
        logo_zoom,
        product_zoom,
        template, // ✅ include template if provided
      } = poster;

      // Save Base64 images as files if they are Base64
      const productImagePath = product_image.startsWith("data:image/")
        ? saveImageFromBase64(product_image)
        : product_image;

      const companyLogoPath = company_logo.startsWith("data:image/")
        ? saveImageFromBase64(company_logo)
        : company_logo;

      // Unique poster_name logic
      let baseName = poster_title;
      let uniqueName = baseName;
      let counter = 1;
      while (existingNames.includes(uniqueName)) {
        uniqueName = `${baseName} [${counter}]`;
        counter++;
      }
      existingNames.push(uniqueName);

      // Generate sequential posterId
      maxNum++;
      const newPosterId = `POS-${maxNum}`;

      const newPoster = new Poster({
        posterId: newPosterId,
        poster_name: uniqueName,
        poster_title,
        product_name,
        product_description,
        product_price,
        product_image: productImagePath,
        product_gallery_images: Array.isArray(product_gallery_images)
          ? product_gallery_images
          : [],
        product_gallery_zoom: buildGalleryZoomArray(
          Array.isArray(product_gallery_images) ? product_gallery_images : [],
          product_gallery_zoom
        ),
        product_gallery_positions: buildGalleryPositionArray(
          Array.isArray(product_gallery_images) ? product_gallery_images : [],
          product_gallery_positions
        ),
        company_logo: companyLogoPath,
        logo_zoom: logo_zoom ? Number(logo_zoom) : 1,
        product_zoom: product_zoom ? Number(product_zoom) : 1,
        user_id: userId,
        template: template || "frame1", // ✅ default to frame1 if not provided
      });

      await newPoster.save();
      savedPosters.push(newPoster);
    }

    res.status(201).json({ message: "Posters synced successfully", posters: savedPosters });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const syncLocalInvoices = async (req, res) => {
  try {
    const userId = req.params.userId;
    const localInvoices = req.body.localInvoices;

    if (!Array.isArray(localInvoices) || localInvoices.length === 0) {
      return res.status(400).json({ message: "No local invoices to sync" });
    }

    // Step 1: Collect unique companies (vendors + customers)
    const companyMap = new Map();
    for (const inv of localInvoices) {
      if (inv.company?.name && !companyMap.has(inv.company.name)) {
        companyMap.set(inv.company.name, { ...inv.company, flag: "vendor" });
      }
      inv.customers?.forEach(cust => {
        if (cust.name && !companyMap.has(cust.name)) {
          companyMap.set(cust.name, { ...cust, flag: "customer" });
        }
      });
    }

    const companiesData = Array.from(companyMap.values());

    // Step 2: Check DB & Save companies
    const savedCompanies = [];
    const companyIdMap = {};

    for (const companyData of companiesData) {
      const normalizedName = companyData.name.trim();
      const gstNo = companyData.gstNo ? companyData.gstNo.trim() : null;

      let existingCompany = await Company.findOne({
        userId,
        isDeleted: false,
        name: { $regex: new RegExp(`^${normalizedName}$`, "i") }
      });

      if (!existingCompany && gstNo) {
        existingCompany = await Company.findOne({ gstNo, userId, isDeleted: false });
      }

      if (existingCompany) {
        companyIdMap[companyData.name] = existingCompany._id.toString();
        savedCompanies.push(existingCompany);
        continue;
      }

      const company = new Company({
        logo: companyData.logo || null,
        name: normalizedName,
        phone: companyData.phone || companyData.phoneNumber,
        email: companyData.email || null,
        address: companyData.address || null,
        city: companyData.city || "Unknown",
        state: companyData.state || null,
        zipCode: companyData.zipCode || null,
        gstNo: gstNo || null,
        companyType: companyData.companyType || "General",
        description: companyData.description || null,
        userId,
        invoices: [],
        isDeleted: false,
        flag: companyData.flag
      });

      const saved = await company.save();
      savedCompanies.push(saved);
      companyIdMap[companyData.name] = saved._id.toString();
    }

    // Step 3: Create invoices & products
    const savedInvoices = [];

    for (const inv of localInvoices) {
      const companyIds = [];
      if (inv.company?.name && companyIdMap[inv.company.name]) {
        companyIds.push(companyIdMap[inv.company.name]);
      }

      const customers = (inv.customers || []).map(c => ({
        name: c.name,
        phoneNumber: c.phone || c.phoneNumber,
        email: c.email || "",
        address: c.address || "",
        gstNo: c.gstNo || "",
      }));

      // Generate sequential invoiceID
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const prefix = `I${year}${month}`;
      const allInvoices = await Invoice.find({ user_id: userId });
      let maxNum = 0;

      allInvoices.forEach((inv) => {
        if (inv.invoiceID?.startsWith(prefix)) {
          const num = parseInt(inv.invoiceID.slice(prefix.length), 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const newInvoiceID = `${prefix}${String(maxNum + 1).padStart(3, "0")}`;

      // Handle products
      const processedProducts = await Promise.all(
        (inv.products || []).map(async (p) => {
          const name = p.name?.trim();
          if (!name) return null;

          let existingProduct = await Product.findOne({ user_id: userId, name });

          if (!existingProduct && companyIds.length) {
            existingProduct = new Product({
              name,
              price: Number(p.price) || 0,
              qty: 0,
              unit: p.unit || "",
              gst: Number(p.gst) || 0,
              user_id: userId,
              company_id: companyIds[0], // link to vendor
            });
            await existingProduct.save();
          }

          const quantity = Number(p.quantity) || 0;
          // Decrease product qty in stock
          existingProduct.qty = (existingProduct.qty || 0) - quantity
          await existingProduct.save();

          return {
            productId: existingProduct._id,
            name: existingProduct.name,
            quantity,
            price: Number(p.price) || 0,
            gst: Number(p.gst) || 0,
            hsn: p.hsn || "",
            unit: p.unit || ""
          };
        })
      );

      // Create invoice
      const newInvoice = new Invoice({
        invoiceID: newInvoiceID,
        user_id: userId,
        products: processedProducts.filter(Boolean),
        company_id: companyIds,
        customers,
        total: inv.total,
        createdAt: inv.createdAt || new Date()
      });

      const savedInvoice = await newInvoice.save();
      savedInvoices.push(savedInvoice);

      // Link invoice to companies
      await Company.updateMany(
        { _id: { $in: companyIds } },
        { $push: { invoices: savedInvoice._id } }
      );
    }

    res.status(201).json({
      message: "Local invoices synced successfully",
      companies: savedCompanies,
      invoices: savedInvoices
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to sync local invoices", error: err.message });
  }
};

export { syncLocalBackend, syncPosters, syncLocalInvoices };
