import Quotation from "../models/Quotation.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Company from "../models/Company.js";
import mongoose from "mongoose";
import { validateQuotationInput } from "../utilis/validators.js";
import { generateQuotationPDF } from "../utilis/pdfGenerator.js";

const getNextEstimateID = async (req, res) => {
  try {
    let userId = req.params.userId || req.query.userId || req.user?._id?.toString() || req.user?.authId;
    let user = null;
    if (req.user?._id) user = await User.findById(req.user._id);
    if (!user && userId && userId !== "undefined" && userId !== "null") {
      user = (mongoose.Types.ObjectId.isValid(userId) ? await User.findById(userId) : null) || await User.findOne({ authId: userId });
    }
    if (!user) {
      return res.status(400).json({ message: "UserId is required" });
    }
    userId = user._id.toString();

    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `E${year}${month}`;
    const lastQuotation = await Quotation.findOne({
      user_id: userId,
      estimateID: { $regex: `^${prefix}` },
    })
      .sort({ createdAt: -1 })
      .limit(1);

    let serialNum = 1;

    if (lastQuotation && lastQuotation.estimateID) {
      const lastEstimateID = lastQuotation.estimateID;
      const lastNum = parseInt(lastEstimateID.slice(-3), 10);
      if (!isNaN(lastNum)) {
        serialNum = lastNum + 1;
      }
    }
    const newID = `${prefix}${String(serialNum).padStart(3, "0")}`;
    res.status(200).json({ estimateID: newID });
  } catch (error) {
    console.error("Error generating estimate ID:", error);
    res.status(500).json({ message: "Failed to generate estimate ID" });
  }
};

const createQuotationForUser = async (req, res) => {
  try {
    let userId = req.params.userId || req.user?._id?.toString() || req.user?.authId;
    let user = null;
    if (req.user?._id) {
      user = await User.findById(req.user._id);
    }
    if (!user && userId && userId !== "undefined" && userId !== "null") {
      user = (mongoose.Types.ObjectId.isValid(userId) ? await User.findById(userId) : null) || await User.findOne({ authId: userId });
    }
    if (!user) {
      return res.status(400).json({ message: "Customer (user) not found" });
    }
    userId = user._id.toString();

    const { estimateID, products, company_id, customers } = req.body;

    if (!estimateID)
      return res.status(400).json({ message: "estimateID is required" });

    if (!company_id || !Array.isArray(company_id) || company_id.length === 0) {
      return res.status(400).json({ message: "Company is required. Please select or add a company." });
    }

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ message: "Customer is required. Please select or add a customer." });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "At least one product/item is required." });
    }

    const validationError = await validateQuotationInput(userId, { company_id, customers, products });
    if (validationError)
      return res.status(400).json({ message: validationError });

    let finalEstimateID = estimateID;
    const exists = await Quotation.findOne({ estimateID, user_id: userId });
    if (exists) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const prefix = `E${year}${month}`;
      const count = await Quotation.countDocuments({ user_id: userId, estimateID: { $regex: `^${prefix}` } });
      finalEstimateID = `${prefix}${String(count + 1).padStart(3, "0")}`;
    }

    const processedProducts = await Promise.all(
      products.map(async (p) => {
        let existingProduct = await Product.findOne({ user_id: userId, name: p.name, company_id: company_id[0] });
        if (!existingProduct) {
          existingProduct = new Product({
            name: p.name,
            price: Number(p.price) || 0,
            qty: 0,
            unit: p.unit || "",
            gst: Number(p.gst) || 0,
            user_id: userId,
            company_id: company_id[0],
          });
          await existingProduct.save();
        }

        return {
          productId: existingProduct._id,
          name: p.name,
          quantity: Number(p.quantity) || 1,
          price: Number(p.price) || 0,
          gst: Number(p.gst) || 0,
          unit: p.unit || "",
          hsn: p.hsn || "",
        };
      })
    );

    const newQuotation = new Quotation({
      estimateID: finalEstimateID,
      user_id: userId,
      products: processedProducts,
      company_id,
      customers,
    });
    const savedQuotation = await newQuotation.save();
    await savedQuotation.populate("company_id");

    // Update companies
    await Promise.all(
      company_id.map((companyId) =>
        Company.findByIdAndUpdate(companyId, {
          $addToSet: { quotations: savedQuotation._id },
        })
      )
    );

    res.status(201).json({
      message: "Quotation created successfully",
      quotation: savedQuotation,
    });
  } catch (error) {
    console.error("Error creating quotation:", error);
    res.status(500).json({ message: "Error creating quotation", error: error.message });
  }
};

const updateQuotationForUser = async (req, res) => {
  try {
    const quotationId = req.params.id;
    const { user_id, products, company_id, customers, estimateID } = req.body;
    let quotation = null;
    if (mongoose.Types.ObjectId.isValid(quotationId)) {
      quotation = await Quotation.findById(quotationId);
    }
    if (!quotation) {
      quotation = await Quotation.findOne({ estimateID: quotationId });
    }
    if (!quotation)
      return res.status(404).json({ message: "Quotation not found" });

    let userId = user_id || req.user?._id?.toString() || req.user?.authId || quotation.user_id?.toString();
    let user = null;
    if (req.user?._id) {
      user = await User.findById(req.user._id);
    }
    if (!user && userId && userId !== "undefined" && userId !== "null") {
      user = (mongoose.Types.ObjectId.isValid(userId) ? await User.findById(userId) : null) || await User.findOne({ authId: userId });
    }
    if (!user && quotation.user_id) {
      user = await User.findById(quotation.user_id);
    }
    if (!user)
      return res.status(400).json({ message: "User not found" });
    userId = user._id.toString();

    const validationError = await validateQuotationInput(userId, {
      company_id,
      customers,
      products,
    });
    if (validationError)
      return res.status(400).json({ message: validationError });

    const processedProducts = await Promise.all(
      products.map(async (p) => {
        let existingProduct = await Product.findOne({ user_id: userId, name: p.name, company_id: company_id[0] });
        if (!existingProduct) {
          existingProduct = new Product({
            name: p.name,
            price: Number(p.price) || 0,
            qty: 0,
            unit: p.unit || "",
            gst: Number(p.gst) || 0,
            user_id: userId,
            company_id: company_id[0],
          });
          await existingProduct.save();
        }

        return {
          productId: existingProduct._id,
          name: p.name,
          quantity: Number(p.quantity) || 1,
          price: Number(p.price) || 0,
          gst: Number(p.gst) || 0,
          unit: p.unit || "",
          hsn: p.hsn || "",
        };
      })
    );

    // Update quotation
    quotation.products = processedProducts;
    quotation.company_id = company_id;
    quotation.customers = customers;
    if (estimateID) quotation.estimateID = estimateID;

    const updatedQuotation = await quotation.save();
    await updatedQuotation.populate("company_id");

    res.status(200).json({
      message: "Quotation updated successfully",
      quotation: updatedQuotation,
    });
  } catch (error) {
    console.error("Error updating quotation:", error);
    res.status(500).json({ message: "Error updating quotation", error: error.message });
  }
};

const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    let quotation = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      quotation = await Quotation.findById(id).populate("company_id");
    }
    if (!quotation) {
      quotation = await Quotation.findOne({ estimateID: id }).populate("company_id");
    }
    if (!quotation)
      return res.status(404).json({ message: "Quotation not found" });

    let total = 0;
    (quotation.products || []).forEach((product) => {
      const base = (product.price || 0) * (product.quantity || product.qty || 1);
      const gstAmount = (base * (product.gst || 0)) / 100;
      total += base + gstAmount;
    });

    const quotationObj = {
      ...quotation.toObject(),
      total: parseFloat(total.toFixed(2)),
    };

    res.status(200).json({ quotation: quotationObj });
  } catch (error) {
    console.error("Error fetching quotation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find().populate("user_id").populate("company_id");
    res.status(200).json({ message: "Quotations fetched successfully", quotations });
  } catch (error) {
    res.status(500).json({ message: "Error fetching quotations", error: error.message });
  }
};

const getQuotationsByUserId = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    let userId = req.params.userId || req.query.userId || req.user?._id?.toString() || req.user?.authId;
    let user = null;
    if (req.user?._id) user = await User.findById(req.user._id);
    if (!user && userId && userId !== "undefined" && userId !== "null") {
      user = (mongoose.Types.ObjectId.isValid(userId) ? await User.findById(userId) : null) || await User.findOne({ authId: userId });
    }
    if (!user) {
      return res.status(200).json({
        message: "Quotations fetched successfully",
        quotations: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      });
    }
    userId = user._id.toString();

    const companyId = req.query.companyId;
    const companyName = req.query.companyName?.toLowerCase();
    const searchQuery = req.query.search?.toLowerCase();
    const customerName = req.query.customer?.toLowerCase();
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const sort = req.query.sort;
    const isHeart = req.query.isHeart === "true";

    const query = { user_id: userId };

    if (companyId) query.company_id = { $in: [companyId] };
    if (searchQuery)
      query.estimateID = { $regex: searchQuery, $options: "i" };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (isHeart) query.isHeart = true;

    let quotations = await Quotation.find(query)
      .populate({ path: "user_id", select: "_id email" })
      .populate({ path: "company_id" })
      .sort({ createdAt: -1 });

    // Filter by customer name
    if (customerName) {
      quotations = quotations.filter((q) =>
        (q.customers || []).some((c) =>
          c.name?.toLowerCase().includes(customerName)
        )
      );
    }

    // Filter by company name
    if (companyName) {
      quotations = quotations.filter((q) =>
        (q.company_id || []).some((c) =>
          c.name?.toLowerCase().includes(companyName)
        )
      );
    }

    // Add totals
    const formattedQuotations = quotations.map((q) => {
      let total = 0;
      (q.products || []).forEach((product) => {
        const base = (product.price || 0) * (product.quantity || product.qty || 1);
        const gstAmount = (base * (product.gst || 0)) / 100;
        total += base + gstAmount;
      });
      return {
        ...q.toObject(),
        total: parseFloat(total.toFixed(2)),
      };
    });

    // Price filtering
    const filteredByPrice = formattedQuotations.filter((q) => {
      if (!isNaN(minPrice) && q.total < minPrice) return false;
      if (!isNaN(maxPrice) && q.total > maxPrice) return false;
      return true;
    });

    // Sorting
    switch (sort) {
      case "priceLowToHigh":
        filteredByPrice.sort((a, b) => a.total - b.total);
        break;
      case "priceHighToLow":
        filteredByPrice.sort((a, b) => b.total - a.total);
        break;
      case "newestFirst":
        filteredByPrice.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case "oldestFirst":
        filteredByPrice.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
      default:
    }

    const paginatedQuotations = filteredByPrice.slice(skip, skip + limit);

    res.status(200).json({
      message: "Quotations fetched successfully",
      quotations: paginatedQuotations,
      pagination: {
        total: filteredByPrice.length,
        page,
        limit,
        totalPages: Math.ceil(filteredByPrice.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    res.status(500).json({ message: "Error fetching quotations", error: error.message });
  }
};

const downloadQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id).populate("company_id");
    if (!quotation)
      return res.status(404).json({ message: "Quotation not found" });

    await generateQuotationPDF(res, quotation);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid quotation ID' });
    const quotation = await Quotation.findById(id);
    if (!quotation)
      return res.status(404).json({ message: 'Quotation not found' });
    quotation.isHeart = !quotation.isHeart;
    await quotation.save();
    return res.status(200).json({ message: 'Favorite status updated', isHeart: quotation.isHeart, });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteQuotation = async (req, res) => {
  try {
    const quotationId = req.params.id;
    if (!quotationId) {
      return res.status(400).json({ message: "Quotation ID required" });
    }

    let deletedQuotation = null;
    if (mongoose.Types.ObjectId.isValid(quotationId)) {
      deletedQuotation = await Quotation.findByIdAndDelete(quotationId);
    }
    if (!deletedQuotation) {
      deletedQuotation = await Quotation.findOneAndDelete({ estimateID: quotationId });
    }

    if (!deletedQuotation)
      return res.status(404).json({ message: "Quotation not found" });

    res.status(200).json({ message: "Quotation deleted successfully", deletedQuotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting quotation", error: error.message });
  }
};

const deleteQuotations = async (req, res) => {
  try {
    let quotationIds = req.body.ids;
    if (!quotationIds && req.params.id) quotationIds = [req.params.id];
    if (!quotationIds && req.body.id) quotationIds = [req.body.id];
    if (typeof quotationIds === "string") quotationIds = [quotationIds];

    if (!Array.isArray(quotationIds) || quotationIds.length === 0) {
      return res.status(400).json({ message: "No quotation IDs provided" });
    }

    const validMongoIds = quotationIds.filter((id) => id && mongoose.Types.ObjectId.isValid(String(id)));
    const stringIds = quotationIds.filter((id) => id && !mongoose.Types.ObjectId.isValid(String(id))).map(String);
    const orClauses = [];
    if (validMongoIds.length > 0) orClauses.push({ _id: { $in: validMongoIds } });
    if (stringIds.length > 0) orClauses.push({ estimateID: { $in: stringIds } });

    if (orClauses.length === 0) {
      return res.status(400).json({ message: "No valid quotation IDs provided" });
    }

    const deletedResult = await Quotation.deleteMany({ $or: orClauses });
    res.status(200).json({
      message: "Quotations deleted successfully",
      deletedCount: deletedResult.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting quotations",
      error: error.message,
    });
  }
};


export {
  getNextEstimateID,
  createQuotationForUser,
  updateQuotationForUser,
  getAllQuotations,
  toggleFavorite,
  deleteQuotations,
  downloadQuotation,
  getQuotationById,
  getQuotationsByUserId,
  deleteQuotation
};