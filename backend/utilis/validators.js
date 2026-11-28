import Company from "../models/Company.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import path from "path";
import { UPLOAD_ROOT, UPLOAD_PUBLIC_PREFIX } from "../utils/uploadPaths.js";

// Build the public-facing /uploads/... URL for a multer file, preserving any
// per-user/per-company subdirectories created by the storage destination.
const toPublicUploadUrl = (file) => {
  if (!file) return null;
  let relative;
  if (file.path) {
    relative = path.relative(UPLOAD_ROOT, file.path);
  } else {
    relative = file.filename || "";
  }
  const normalized = String(relative).replace(/\\/g, "/").replace(/^\/+/, "");
  return `${UPLOAD_PUBLIC_PREFIX}/${normalized}`;
};

const allowedImageExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".svg",
  ".avif",
  ".heic",
  ".heif",
  ".tif",
  ".tiff",
]);

const allowedVideoExtensions = new Set([
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".avi",
  ".mkv",
]);

const getFileExtension = (filename = "") => {
  const lastDot = filename.lastIndexOf(".");
  return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : "";
};

const isAllowedUploadFile = (file, type) => {
  const mimeType = (file?.mimetype || "").toLowerCase();
  const extension = getFileExtension(file?.originalname || file?.filename || "");

  const isImage = mimeType.startsWith("image/") || allowedImageExtensions.has(extension);
  const isVideo = mimeType.startsWith("video/") || allowedVideoExtensions.has(extension);

  if (type === "image") return isImage;
  if (type === "media") return isImage || isVideo;
  return false;
};

const validateCompanyIds = async (companyIds, userId) => {
  if (!Array.isArray(companyIds) || companyIds.length === 0) return false;
  const DEFAULT_USER_ID = "69d362ca7421b5bc1882903d";
  const targetUserIds = [userId ? userId.toString() : "", DEFAULT_USER_ID];
  if (mongoose.Types.ObjectId.isValid(userId)) {
    const u = await User.findById(userId);
    if (u?.authId) targetUserIds.push(u.authId.toString());
  } else if (userId) {
    const u = await User.findOne({ authId: userId });
    if (u?._id) targetUserIds.push(u._id.toString());
  }

  const companies = await Company.find({ _id: { $in: companyIds } });
  if (companies.length !== companyIds.length) return false;
  for (let company of companies) {
    if (company.userId && !targetUserIds.includes(company.userId.toString())) return false;
  }
  return true;
};

const validateArrayField = (arr, name) =>
  Array.isArray(arr) && arr.length > 0 ? null : `${name} is required and must be a non-empty array`;

const validateRequiredFields = (items, fields, type) => {
  for (let i = 0; i < items.length; i++) {
    for (const field of fields) {
      if (items[i][field] == null || items[i][field] === "") {
        return `${field} is missing `;
      }
    }
  }
  return null;
};

const validateCompanyFields = async (req, res, companyId = null, userIdParam = null) => {
  const userId = userIdParam || req.body.userId || req.params.userId;
  if (userId && !mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  const { name, phone, email, address, city, state, zipCode, gstNo, panNo, companyType, description, quotations, isDeleted, flag, upiId } = req.body;

  const fieldLabels = { name: "Company name", phone: "Phone number", city: "City", companyType: "Company category", flag: "Flag" };

  // Required fields check (reject empty or whitespace-only)
  const requiredFields = { name, phone, city, companyType, flag };
  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value || (typeof value === "string" && !value.trim()))
      return res.status(400).json({ message: `${fieldLabels[key]} is required` });
  }

  const normalizedName = name.trim();
  if (normalizedName.length < 2 || normalizedName.length > 100) {
    return res.status(400).json({ message: "Company name must be between 2 and 100 characters." });
  }

  // Phone validation (10-digit Indian mobile number starting with 6-9)
  const phoneTrimmed = String(phone).trim();
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phoneTrimmed))
    return res.status(400).json({ message: "Invalid phone number! It should be a 10-digit Indian mobile number (starts with 6-9)." });

  // Email validation (optional, valid provider/domain)
  if (email && String(email).trim()) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(String(email).trim()))
      return res.status(400).json({ message: "Invalid email format." });
  }

  // City validation (reject empty or whitespace-only)
  const cityTrimmed = String(city).trim();
  if (!/^[a-zA-Z\s.'-]{2,50}$/.test(cityTrimmed)) {
    return res.status(400).json({ message: "Invalid city name." });
  }

  // State validation (optional)
  if (state && String(state).trim()) {
    const stateTrimmed = String(state).trim();
    if (!/^[a-zA-Z\s.'-]{2,50}$/.test(stateTrimmed)) {
      return res.status(400).json({ message: "Invalid state name." });
    }
  }

  // Zip / PIN code validation (optional, 6-digit Indian PIN code starting 1-9)
  if (zipCode && String(zipCode).trim()) {
    const zipCodeRegex = /^[1-9]\d{5}$/;
    if (!zipCodeRegex.test(String(zipCode).trim()))
      return res.status(400).json({ message: "Invalid zip code! It should be a valid 6-digit PIN code." });
  }

  // GST format check
  if (gstNo && String(gstNo).trim()) {
    const normalizedGst = String(gstNo).trim().toUpperCase();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(normalizedGst)) {
      return res.status(400).json({ message: "Invalid GST format. Expected 15-character GSTIN (e.g. 22AAAAA0000A1Z5)." });
    }
  }

  // PAN format check
  if (panNo && String(panNo).trim()) {
    if (flag !== "vendor") {
      return res.status(400).json({ message: "PAN number can only be added for vendor companies." });
    }

    const normalizedPan = String(panNo).trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    if (!panRegex.test(normalizedPan)) {
      return res.status(400).json({ message: "Invalid PAN format. Expected format: AAAAA9999A" });
    }

    // Verify PAN matches the PAN portion of GSTIN if both provided
    if (gstNo && String(gstNo).trim()) {
      const normalizedGst = String(gstNo).trim().toUpperCase();
      if (normalizedGst.slice(2, 12) !== normalizedPan) {
        return res.status(400).json({ message: "GST number PAN part does not match the entered PAN number." });
      }
    }

    const existingPan = await Company.findOne({
      userId,
      isDeleted: false,
      panNo: normalizedPan,
      ...(companyId && { _id: { $ne: companyId } }),
    });

    if (existingPan) {
      return res.status(400).json({ message: `PAN number already exists for this user under category: ${existingPan.flag}!` });
    }
  }

  // GST duplicate check
  if (gstNo && String(gstNo).trim()) {
    const normalizedGst = String(gstNo).trim().toUpperCase();
    const existingCompany = await Company.findOne({ gstNo: normalizedGst, userId, isDeleted: false, ...(companyId && { _id: { $ne: companyId } }) });
    if (existingCompany) {
      return res.status(400).json({ message: `GST number already exists for this user under category: ${existingCompany.flag}!` });
    }
  }

  // UPI ID validation (optional, valid format)
  if (upiId && String(upiId).trim()) {
    const normalizedUpi = String(upiId).trim();
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(normalizedUpi)) {
      return res.status(400).json({ message: "Invalid UPI ID format (e.g. name@upi or name@bank)." });
    }
  }

  // Address and Description limits
  if (address && String(address).trim().length > 500) {
    return res.status(400).json({ message: "Street address cannot exceed 500 characters." });
  }
  if (description && String(description).trim().length > 1000) {
    return res.status(400).json({ message: "About company cannot exceed 1000 characters." });
  }

  // Duplicate company name check
  const existingCompanyName = await Company.findOne({
    userId,
    isDeleted: false,
    name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
    ...(companyId && { _id: { $ne: companyId } }) // exclude self
  });

  if (existingCompanyName) {
    return res.status(400).json({ message: `Company name already exists for this user under category: ${existingCompanyName.flag}!` });
  }

  return null;
};

const validateQuotationInput = async (userId, { company_id, customers, products }) => {
  const companyError = validateArrayField(company_id, "Company_id");
  if (companyError) return companyError;

  const areValidCompanies = await validateCompanyIds(company_id, userId);
  if (!areValidCompanies) return "Invalid company IDs or user not associated with the companies";
  const customerArrayError = validateArrayField(customers, "Customers");
  if (customerArrayError) return customerArrayError;

  const customerFieldsError = validateRequiredFields(customers, ["name"], "Customer");
  if (customerFieldsError) return customerFieldsError;

  const productArrayError = validateArrayField(products, "Products");
  if (productArrayError) return productArrayError;

  return validateRequiredFields(products, ["name", "quantity", "price"], "Product");
};

const validatePosterInput = (body, files, existingPoster = null) => {
  const { poster_title, product_name, product_description, template } = body;
  const productFile = files?.product_image?.[0];
  const productGalleryFiles = files?.product_gallery_images || [];
  const logoFile = files?.company_logo?.[0];
  const errors = [];
  // --- Extract path safely ---
  const product_image = productFile ? toPublicUploadUrl(productFile) : null;
  const product_gallery_images = productGalleryFiles.map((file) =>
    toPublicUploadUrl(file)
  );
  const company_logo = logoFile ? toPublicUploadUrl(logoFile) : null;

  // Frames that do NOT use product description
  const framesWithoutDescription = new Set([
    "frame0", "frame11", "frame13", "frame16", "frame17",
    "frame20", "frame23", "frame25", "frame27", "frame30",
    "frame33", "frame36", "frame39",
  ]);
  const currentTemplate = template || existingPoster?.template || "frame1";

  // --- Validate product_price / price if provided ---
  const rawPrice = body.product_price !== undefined ? body.product_price : body.price;
  if (rawPrice !== undefined && rawPrice !== null && rawPrice !== "") {
    const priceStr = String(rawPrice).trim();
    if (priceStr.includes("-") || Number(priceStr) < 0) {
      errors.push("Price cannot be negative");
    } else if (priceStr.length > 1 && priceStr.startsWith("0") && !priceStr.startsWith("0.")) {
      errors.push("Price cannot have leading zeros");
    } else if (Number(priceStr) > 99999999) {
      errors.push("Maximum price limit is ₹99,999,999");
    }
  }

  // --- Validate text fields ---
  if (!poster_title || poster_title.trim() === "") errors.push("Poster title is required");
  if (!product_name || product_name.trim() === "") errors.push("Product name is required");
  // --- Validate product_image only if missing and no existing one ---
  if (!productFile && !existingPoster?.product_image && !body?.product_image && !body?.tempFileName) {
    errors.push("Product image or video is required");
  } else if (productFile && !isAllowedUploadFile(productFile, "media")) {
    errors.push("Product image must be an image or video file (jpg, png, webp, mp4, webm, mov)");
  }

  if (logoFile && !isAllowedUploadFile(logoFile, "image")) {
    errors.push("Company logo must be an image file");
  }

  for (const galleryFile of productGalleryFiles) {
    if (!isAllowedUploadFile(galleryFile, "image")) {
      errors.push("Product gallery images must be image files");
      break;
    }
  }

  // Total media cap: 1 primary + up to 4 gallery = 5 max
  const existingGalleryCount = Array.isArray(existingPoster?.product_gallery_images)
    ? existingPoster.product_gallery_images.length
    : 0;
  if (productGalleryFiles.length + existingGalleryCount > 4) {
    errors.push(
      `Gallery limit exceeded. You can have at most 4 extra images (5 total including the primary image). Currently have ${existingGalleryCount}, tried to add ${productGalleryFiles.length}.`
    );
  }

  return { errors, product_image, product_gallery_images, company_logo };
};

const validateProductData = async ({
  userId,
  companyId,
  name,
  excludeId,
}) => {
  if (!userId || !companyId) {
    return { valid: false, message: "userId and companyId are required" };
  }

  let user = null;
  if (mongoose.Types.ObjectId.isValid(userId)) {
    user = await User.findById(userId);
  }
  if (!user) {
    user = await User.findOne({ authId: String(userId) });
  }
  if (!user) return { valid: false, message: "User not found" };

  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    return { valid: false, message: "Invalid company ID" };
  }

  const company = await Company.findById(companyId);
  if (!company) return { valid: false, message: "Company not found" };

  if (name) {
    const normalizedName = name
      .normalize("NFKC")
      .replace(/\r?\n|\r/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const existingProducts = await Product.find({
      user_id: user._id,
      company_id: company._id,
      ...(excludeId && { _id: { $ne: excludeId } }),
    }).select("name");

    for (const p of existingProducts) {
      const normalizedExisting = p.name
        .normalize("NFKC")
        .replace(/\r?\n|\r/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (normalizedExisting.toLowerCase() === normalizedName.toLowerCase()) {
        return {
          valid: false,
          message: `Product "${normalizedName}" already exists for this company.`,
        };
      }
    }
  }

  return { valid: true, user, company };
};


export { validateCompanyIds, validateArrayField, validateRequiredFields, validateQuotationInput, validateCompanyFields, validatePosterInput, validateProductData };