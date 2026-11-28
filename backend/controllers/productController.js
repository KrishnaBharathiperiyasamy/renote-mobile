import Product from "../models/Product.js";
import Company from "../models/Company.js";
import mongoose from "mongoose";
import { validateProductData } from "../utilis/validators.js";
import pdfjsLib from "pdfjs-dist";
import { DOMMatrix } from "canvas";
import OpenAI from "openai";
import dotenv from "dotenv";
import User from "../models/User.js";
import * as XLSX from "xlsx";
import csv from "csvtojson";
import fs from "fs";

dotenv.config();
global.DOMMatrix = DOMMatrix;

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export const resolveMongoUserId = async (reqUser, rawUserId) => {
    if (reqUser?._id && mongoose.Types.ObjectId.isValid(reqUser._id)) {
        return reqUser._id;
    }
    const candidate = rawUserId || reqUser?.authId;
    if (!candidate) return null;
    if (mongoose.Types.ObjectId.isValid(candidate)) {
        const u = await User.findById(candidate);
        if (u) return u._id;
    }
    const u = await User.findOne({ authId: String(candidate) });
    if (u) return u._id;
    return null;
};

export const createProduct = async (req, res) => {
    try {
        const { userId } = req.params;
        const { companyId, name, price, qty, unit, gst, hsn, description, dealers } = req.body;

        if (!companyId || !name || price == null || qty == null) {
            return res.status(400).json({
                message: "companyId, name, price, and qty are required",
            });
        }

        const priceNum = Number(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            return res.status(400).json({ message: "Price must be a valid positive number" });
        }
        if (!/^\d+(\.\d{1,2})?$/.test(String(price).trim())) {
            return res.status(400).json({ message: "Price cannot have more than 2 decimal places" });
        }

        const qtyNum = Number(qty);
        if (isNaN(qtyNum) || qtyNum <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than 0" });
        }

        if (hsn && String(hsn).trim() && !/^\d{2,8}$/.test(String(hsn).trim())) {
            return res.status(400).json({ message: "HSN code must be 2 to 8 digits" });
        }

        if (dealers && String(dealers).trim().length > 50) {
            return res.status(400).json({ message: "Dealer name cannot exceed 50 characters" });
        }

        const effectiveUserId = req.user?._id || userId;
        if (!effectiveUserId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const validation = await validateProductData({ userId: effectiveUserId, companyId, name });
        if (!validation.valid)
            return res.status(400).json({ message: validation.message });

        const targetUserId = validation.user._id;

        const newProduct = new Product({
            user_id: targetUserId,
            company_id: validation.company._id,
            name: name.trim(),
            price: priceNum,
            qty: qtyNum,
            unit: unit?.trim() || "",
            gst: gst != null && gst !== "" ? Number(gst) : 0,
            hsn: hsn?.trim() || "",
            description: description?.trim() || "",
            dealers: dealers?.trim() || "",
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({ message: "Product created successfully", product: savedProduct });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Failed to create product", error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { userId, companyId, name, price, qty, unit, gst, hsn, description, dealers } = req.body;

        if (!productId || (!userId && !req.user?._id) || !companyId) {
            return res.status(400).json({
                message: "productId (URL), userId, and companyId (body) are required",
            });
        }

        if (price != null) {
            const priceNum = Number(price);
            if (isNaN(priceNum) || priceNum <= 0) {
                return res.status(400).json({ message: "Price must be a valid positive number" });
            }
            if (!/^\d+(\.\d{1,2})?$/.test(String(price).trim())) {
                return res.status(400).json({ message: "Price cannot have more than 2 decimal places" });
            }
        }

        if (qty != null) {
            const qtyNum = Number(qty);
            if (isNaN(qtyNum) || qtyNum <= 0) {
                return res.status(400).json({ message: "Quantity must be greater than 0" });
            }
        }

        if (hsn && String(hsn).trim() && !/^\d{2,8}$/.test(String(hsn).trim())) {
            return res.status(400).json({ message: "HSN code must be 2 to 8 digits" });
        }

        if (dealers && String(dealers).trim().length > 50) {
            return res.status(400).json({ message: "Dealer name cannot exceed 50 characters" });
        }

        const effectiveUserId = req.user?._id || userId;
        const validation = await validateProductData({
            userId: effectiveUserId,
            companyId,
            name,
            excludeId: productId,
        });

        if (!validation.valid)
            return res.status(400).json({ message: validation.message });

        const targetUserId = validation.user._id;

        const product = await Product.findOne({
            _id: productId,
            company_id: validation.company._id,
            user_id: targetUserId,
        });

        if (!product)
            return res.status(404).json({
                message: "Product not found or does not belong to this user/company",
            });

        if (name) product.name = name.trim();
        if (price != null) product.price = Number(price);
        if (qty != null) product.qty = Number(qty);
        if (unit !== undefined) product.unit = unit?.trim() || "";
        if (gst != null && gst !== "") product.gst = Number(gst);
        if (hsn !== undefined) product.hsn = hsn?.trim() || "";
        if (description !== undefined) product.description = description?.trim() || "";
        if (dealers !== undefined) product.dealers = dealers?.trim() || "";

        const updatedProduct = await product.save();
        res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Failed to update product", error: error.message });
    }
};

export const getProductsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            companyId,
            name,
            startDate,
            endDate,
            minPrice,
            maxPrice,
            sort,
            page = 1,
            limit = 30,
            isHeart,
        } = req.query;

        if (!userId)
            return res.status(400).json({ message: "userId (in URL) is required" });
        const DEFAULT_USER_ID = "69d362ca7421b5bc1882903d";
        let targetUserId = userId;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            const userObj = await User.findOne({ authId: userId });
            if (!userObj) {
                targetUserId = DEFAULT_USER_ID;
            } else {
                targetUserId = userObj._id.toString();
            }
        } else {
            const userObj = await User.findById(userId);
            if (!userObj) {
                targetUserId = DEFAULT_USER_ID;
            }
        }

        if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
            const company = await Company.findById(companyId);
            if (!company) {
                // If company not found, don't hard fail, just ignore company filter
            }
        }
        const filter = { user_id: targetUserId };
        if (companyId && mongoose.Types.ObjectId.isValid(companyId)) filter.company_id = companyId;
        if (name)
            filter.name = { $regex: name, $options: "i" };
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
        // 🔹 Price range filter
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        if (isHeart === "true") filter.isHeart = true;
        let sortOption = {};
        switch (sort) {
            case "priceLowToHigh":
                sortOption.price = 1;
                break;
            case "priceHighToLow":
                sortOption.price = -1;
                break;
            case "newestFirst":
                sortOption.createdAt = -1;
                break;
            case "oldestFirst":
                sortOption.createdAt = 1;
                break;
            default:
                sortOption.createdAt = -1;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        let totalCount = await Product.countDocuments(filter);
        let products = await Product.find(filter)
            .populate("company_id", "name")
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit))
            .select("company_id user_id name price qty unit gst hsn description dealers isHeart createdAt updatedAt");

        if (products.length === 0 && String(targetUserId) !== String(DEFAULT_USER_ID)) {
            const fallbackFilter = { user_id: DEFAULT_USER_ID };
            if (name) fallbackFilter.name = { $regex: name, $options: "i" };
            totalCount = await Product.countDocuments(fallbackFilter);
            products = await Product.find(fallbackFilter)
                .populate("company_id", "name")
                .sort(sortOption)
                .skip(skip)
                .limit(parseInt(limit))
                .select("company_id user_id name price qty unit gst hsn description dealers isHeart createdAt updatedAt");
        }

        res.status(200).json({
            message: "Products fetched successfully",
            count: totalCount,
            page: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            products,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch products", error: error.message });
    }
};

export const deleteMultipleProducts = async (req, res) => {
    try {
        const { userId, productIds } = req.body;
        if ((!userId && !req.user?._id) || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                message: "userId and a non-empty array of productIds are required",
            });
        }
        let targetUserId = await resolveMongoUserId(req.user, userId);
        if (!targetUserId)
            return res.status(404).json({ message: "User not found" });

        const validProductIds = productIds.filter(id => id && mongoose.Types.ObjectId.isValid(String(id)));
        if (validProductIds.length === 0) {
            return res.status(400).json({
                message: "No valid product ObjectIds provided",
            });
        }

        const result = await Product.deleteMany({
            _id: { $in: validProductIds },
            user_id: targetUserId,
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "No products found for this user with given IDs",
            });
        }
        res.status(200).json({
            message: `${result.deletedCount} product(s) deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Error deleting products:", error);
        res.status(500).json({ message: "❌ Failed to delete products" });
    }
};
const normalizeName = (name = "") => {
    return name
        .toLowerCase()
        .normalize("NFD") 
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9\s]/gi, "") 
        .replace(/\s+/g, " ") 
        .trim();
};

export const uploadBulkProducts = async (req, res) => {
    try {
        const { userId } = req.params;
        const { company_id } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ message: "File is required" });
        if (!company_id) {
            if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({ message: "Company ID required" });
        }

        const targetUserId = await resolveMongoUserId(req.user, userId);
        if (!targetUserId) {
            if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({ message: "Valid user required" });
        }

        const filePath = file.path;
        const fileExtension = file.originalname.split(".").pop().toLowerCase();
        let products = [];

        // --- Parse file ---
        if (fileExtension === "csv") {
            products = await csv().fromFile(filePath);
        } else if (fileExtension === "xlsx" || fileExtension === "xls") {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            products = XLSX.utils.sheet_to_json(sheet);
        } else {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ message: "Invalid file format. Upload CSV or Excel only." });
        }

        if (!products.length) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ message: "Empty file or no valid data found." });
        }

        // --- Format & normalize ---
        const formattedProducts = products
            .map((p) => ({
                company_id,
                user_id: targetUserId,
                name: p.name?.trim(),
                normalizedName: normalizeName(p.name),
                price: Number(p.price) || 0,
                qty: Number(p.qty || p.quantity) || 0,
                unit: p.unit?.trim() || "",
                gst: Number(p.gst) || 0,
                hsn: p.hsn ? String(p.hsn).trim() : "",
                description: p.description?.trim() || "",
                dealers: p.dealers?.trim() || "",
            }))
            .filter((p) => p.name);
        const existingProducts = await Product.find({
            user_id: targetUserId,
            company_id,
        }).select("name");

        const existingNames = existingProducts.map((p) => normalizeName(p.name));
        const uniqueProducts = [];
        const skippedNames = [];

        for (const p of formattedProducts) {
            if (existingNames.includes(p.normalizedName))
                skippedNames.push(p.name);
            else
                uniqueProducts.push(p);
        }
        let insertedProducts = [];
        if (uniqueProducts.length > 0) {
            insertedProducts = await Product.insertMany(uniqueProducts);
        }
        fs.unlinkSync(filePath);
        let message = `Added ${insertedProducts.length} new product(s).`;
        if (skippedNames.length > 0) {
            const namesToShow = skippedNames.slice(0, 3).join(", ");
            const more = skippedNames.length > 3 ? "..." : "";
            message += ` Skipped ${skippedNames.length} duplicate(s): ${namesToShow}${more}.`;
        }

        res.status(201).json({
            message,
            insertedCount: insertedProducts.length,
            skippedCount: skippedNames.length,
            skippedNames,
            data: insertedProducts,
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to upload products",
            error: err.message,
        });
    }
};

export const extractProductsFromPDF = async (req, res) => {
    try {
        const { user_id, company_id } = req.body;

        if (!req.file)
            return res.status(400).json({ success: false, message: "No file uploaded" });
        if (!company_id)
            return res.status(400).json({ success: false, message: "company_id is required" });

        const targetUserId = await resolveMongoUserId(req.user, user_id);
        if (!targetUserId) {
            if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: "Valid user required" });
        }

        const filePath = req.file.path;
        const data = new Uint8Array(fs.readFileSync(filePath));
        const pdf = await pdfjsLib.getDocument({ data }).promise;

        let text = "";
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            text += content.items.map((item) => item.str).join(" ") + "\n\n";
        }
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        const prompt = `
Extract structured product data from the following text.
Return ONLY valid JSON array with keys:
name, price, qty, unit, gst, hsn, description ,dealers(if available).

Ignore irrelevant data and ensure all keys exist for each object.

Text:
"""${text}"""
`;
        const aiResponse = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "You are a JSON data extractor bot. Respond with clean JSON only." },
                { role: "user", content: prompt },
            ],
        });

        let aiReply = aiResponse.choices[0].message.content.trim()
            .replace(/^```json/g, "")
            .replace(/^```/g, "")
            .replace(/```$/g, "")
            .replace(/```/g, "")
            .replace(/^Here(.|\n)*?\[/, "[")
            .replace(/\n/g, "")
            .trim();

        let jsonData;
        try {
            const match = aiReply.match(/\[.*\]/s);
            if (!match) return res.json({ success: false, aiReplyRaw: aiReply });
            jsonData = JSON.parse(match[0]);
        } catch {
            return res.json({ success: false, aiReplyRaw: aiReply });
        }

        if (!Array.isArray(jsonData) || jsonData.length === 0)
            return res.status(400).json({ success: false, message: "No valid products found in PDF" });

        const formattedProducts = jsonData
            .map((p) => ({
                user_id: targetUserId,
                company_id,
                name: p.name?.trim(),
                normalizedName: normalizeName(p.name),
                price: Number(p.price) || 0,
                qty: Number(p.qty) || 0,
                unit: p.unit || "",
                gst: Number(p.gst) || 0,
                hsn: p.hsn || "",
                description: p.description?.trim() || "",
                dealers: p.dealers?.trim() || "",
            }))
            .filter((p) => p.name);

        const existingProducts = await Product.find({ user_id: targetUserId, company_id }).select("name");
        const existingNames = existingProducts.map((p) => normalizeName(p.name));

        const uniqueProducts = [];
        const skippedNames = [];

        for (const p of formattedProducts) {
            if (existingNames.includes(p.normalizedName)) skippedNames.push(p.name);
            else uniqueProducts.push(p);
        }

        if (uniqueProducts.length > 0) {
            const toInsert = uniqueProducts.map(({ normalizedName, ...rest }) => rest);
            const insertedProducts = await Product.insertMany(toInsert);
            uniqueProducts.splice(0, uniqueProducts.length, ...insertedProducts);
        }

        let message = `Uploaded ${uniqueProducts.length} new product(s) from PDF.`;
        if (skippedNames.length > 0) {
            const namesToShow = skippedNames.slice(0, 3).join(", ");
            const more = skippedNames.length > 3 ? "..." : "";
            message += ` Skipped ${skippedNames.length} duplicate(s): ${namesToShow}${more}.`;
        }

        res.json({
            success: true,
            message,
            insertedCount: uniqueProducts.length,
            skippedCount: skippedNames.length,
            skippedNames,
            data: uniqueProducts,
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const toggleProductFavorite = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: "Invalid product ID" });
        // Find product
        const product = await Product.findById(id);
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        // Toggle isHeart
        product.isHeart = !product.isHeart;
        await product.save();
        return res.status(200).json({
            message: "Favorite status updated",
            isHeart: product.isHeart,
        });
    } catch (error) {
        console.error("Error toggling favorite product:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const NewSuggestions = async (req, res) => {
  const { query, userId, companyId } = req.body;
  const DEFAULT_USER_ID = "69d362ca7421b5bc1882903d";
  const targetUserId = userId || DEFAULT_USER_ID;

  try {
    const matchFilter = {};
    if (mongoose.Types.ObjectId.isValid(targetUserId)) {
      matchFilter.user_id = new mongoose.Types.ObjectId(targetUserId);
    }
    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      matchFilter.company_id = new mongoose.Types.ObjectId(companyId);
    }
    if (query && query.trim()) {
      matchFilter.name = new RegExp(escapeRegex(query.trim()), "i");
    }

    let productResults = await Product.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            name: "$name",
            price: "$price",
            hsn: { $ifNull: ["$hsn", ""] },
            unit: { $ifNull: ["$unit", "Pcs"] },
            gst: { $ifNull: ["$gst", 18] },
          },
        },
      },
      { $limit: 100 }
    ]);

    if (productResults.length === 0 && String(targetUserId) !== String(DEFAULT_USER_ID)) {
      const fallbackFilter = { user_id: new mongoose.Types.ObjectId(DEFAULT_USER_ID) };
      if (query && query.trim()) {
        fallbackFilter.name = new RegExp(escapeRegex(query.trim()), "i");
      }
      productResults = await Product.aggregate([
        { $match: fallbackFilter },
        {
          $group: {
            _id: {
              name: "$name",
              price: "$price",
              hsn: { $ifNull: ["$hsn", ""] },
              unit: { $ifNull: ["$unit", "Pcs"] },
              gst: { $ifNull: ["$gst", 18] },
            },
          },
        },
        { $limit: 100 }
      ]);
    }

    // Deduplicate by name + price + unit
    const uniqueSuggestions = [
      ...new Map(
        productResults.map((s) => [`${s._id.name}-${s._id.price}-${s._id.unit}`, s])
      ).values(),
    ].slice(0, 50);

    // Send final suggestions
    res.json({
      suggestions: uniqueSuggestions.map((s) => ({
        name: s._id.name,
        price: s._id.price,
        hsn: s._id.hsn || "",
        unit: s._id.unit || "Pcs",
        gst: s._id.gst !== undefined ? s._id.gst : 18,
      })),
    });
  } catch (err) {
    console.error("Error fetching product suggestions:", err);
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
};