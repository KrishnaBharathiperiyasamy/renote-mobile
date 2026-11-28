import Invoice from "../models/Invoice.js";
import Quotation from "../models/Quotation.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import mongoose from "mongoose";
import { generateInvoicePDF } from "../utilis/pdfGenerator.js";
import { validateQuotationInput } from "../utilis/validators.js";
import { formatInvoiceID, getNextInvoiceSequenceID } from "../utilis/formatInvoice.js";

const DEFAULT_USER_ID = "69d362ca7421b5bc1882903d";

/**
 * Resolves the authenticated or targeted user document from request parameters,
 * JWT tokens, authId, or MongoDB ObjectIds.
 */
const resolveTargetUser = async (req, userIdParam) => {
  let user = null;

  // 1. Authenticated user directly from req.user
  if (req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id)) {
    user = await User.findById(req.user._id);
  }

  // 2. authId from token
  const authId = req.user?.authId || req.user?.sub;
  if (!user && authId) {
    user = await User.findOne({ authId, isDeleted: { $ne: true } });
  }

  // 3. raw ID passed via route parameter, query, or body
  const rawId = userIdParam || req.params?.userId || req.body?.user_id || req.query?.userId;
  if (!user && rawId && rawId !== "undefined" && rawId !== "null") {
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      user = await User.findById(rawId);
    }
    if (!user) {
      user = await User.findOne({ authId: String(rawId), isDeleted: { $ne: true } });
    }
  }

  return user;
};

const getNextInvoiceID = async (req, res) => {
  try {
    const user = await resolveTargetUser(req, req.params.userId);
    const targetUserId = user ? user._id : (mongoose.Types.ObjectId.isValid(req.params.userId) ? req.params.userId : DEFAULT_USER_ID);

    let allInvoices = await Invoice.find({ user_id: targetUserId });
    if (allInvoices.length === 0 && String(targetUserId) !== String(DEFAULT_USER_ID)) {
      allInvoices = await Invoice.find({ user_id: DEFAULT_USER_ID });
    }
    const newID = getNextInvoiceSequenceID(allInvoices);
    res.status(200).json({ invoiceID: newID });
  } catch (error) {
    console.error("Failed to generate invoice ID:", error);
    res.status(500).json({ message: "Failed to generate invoice ID", error: error.message });
  }
};

const createInvoiceForUser = async (req, res) => {
  try {
    const user = await resolveTargetUser(req, req.params.userId);
    if (!user) {
      return res.status(400).json({ message: "Customer (user) not found" });
    }
    const userId = user._id;

    const { invoiceID, products, company_id, customers } = req.body;
    if (!invoiceID)
      return res.status(400).json({ message: "invoiceID is required" });

    if (!company_id || !Array.isArray(company_id) || company_id.length === 0) {
      return res.status(400).json({ message: "Company is required. Please select or add a company." });
    }

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ message: "Customer is required. Please select or add a customer." });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "At least one product/item is required." });
    }

    const validationError = await validateQuotationInput(userId.toString(), { company_id, customers, products });
    if (validationError)
      return res.status(400).json({ message: validationError });

    let finalInvoiceID = invoiceID;
    const exists = await Invoice.findOne({ invoiceID: finalInvoiceID, user_id: userId });
    if (exists) {
      const allInvoices = await Invoice.find({ user_id: userId });
      finalInvoiceID = getNextInvoiceSequenceID(allInvoices);
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
            hsn: p.hsn || "",
            gst: Number(p.gst) || 0,
            user_id: userId,
            company_id: company_id[0],
          });
          await existingProduct.save();
        }
        existingProduct.qty =
          (existingProduct.qty || 0) - (Number(p.quantity) || 0);
        await existingProduct.save();
        return {
          productId: existingProduct._id,
          name: p.name,
          quantity: Number(p.quantity) || 1,
          price: Number(p.price) || 0,
          gst: Number(p.gst) || 0,
          unit: p.unit || "",
          hsn: p.hsn || ""
        };
      })
    );

    const newInvoice = new Invoice({
      invoiceID: finalInvoiceID,
      user_id: userId,
      products: processedProducts,
      company_id,
      customers: customers,
    });
    const savedInvoice = await newInvoice.save();

    await Company.updateMany(
      { _id: { $in: company_id } },
      { $addToSet: { invoices: savedInvoice._id } }
    );

    const populatedInvoice = await Invoice.findById(savedInvoice._id)
      .populate({ path: "user_id", select: "_id firstName lastName email" })
      .populate({
        path: "company_id",
        select: "_id name phone email address city state gstNo logo upiId",
      });

    res.status(201).json({
      message: "Invoice created successfully",
      invoice: populatedInvoice || savedInvoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ message: "Error creating invoice", error: error.message });
  }
};

const updateInvoiceForUser = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { user_id, products, company_id, customers } = req.body;
    let invoice = null;
    if (mongoose.Types.ObjectId.isValid(invoiceId)) {
      invoice = await Invoice.findById(invoiceId);
    }
    if (!invoice) {
      invoice = await Invoice.findOne({ invoiceID: invoiceId });
    }
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const user = await resolveTargetUser(req, user_id || invoice.user_id?.toString());
    if (!user) return res.status(400).json({ message: "User not found" });
    const resolvedUserId = user._id;

    const validationError = await validateQuotationInput(resolvedUserId.toString(), { company_id, customers, products });
    if (validationError) return res.status(400).json({ message: validationError });

    await Promise.all(
      invoice.products.map(async (oldProd) => {
        let productDoc = null;
        if (oldProd.productId)
          productDoc = await Product.findById(oldProd.productId);
        if (!productDoc && invoice.company_id?.[0])
          productDoc = await Product.findOne({ user_id: resolvedUserId, name: oldProd.name, company_id: invoice.company_id[0] });
        if (productDoc) {
          productDoc.qty = (productDoc.qty || 0) + (Number(oldProd.quantity) || 0);
          await productDoc.save();
        }
      })
    );

    const processedProducts = await Promise.all(
      products.map(async (p) => {
        let productDoc = await Product.findOne({ user_id: resolvedUserId, name: p.name, company_id: company_id[0] });
        if (!productDoc) {
          productDoc = new Product({
            name: p.name,
            price: Number(p.price) || 0,
            qty: 0,
            unit: p.unit || "",
            hsn: p.hsn || "",
            gst: Number(p.gst) || 0,
            user_id: resolvedUserId,
            company_id: company_id[0],
          });
        }
        productDoc.qty = (productDoc.qty || 0) - (Number(p.quantity) || 0);
        await productDoc.save();
        return {
          productId: productDoc._id,
          name: p.name,
          quantity: Number(p.quantity) || 1,
          price: Number(p.price) || 0,
          gst: Number(p.gst) || 0,
          unit: p.unit || "",
          hsn: p.hsn || "",
        };
      })
    );

    invoice.products = processedProducts;
    invoice.company_id = company_id;
    invoice.customers = customers || [];
    const updatedInvoice = await invoice.save();

    const populatedInvoice = await Invoice.findById(updatedInvoice._id)
      .populate({ path: "user_id", select: "_id firstName lastName email" })
      .populate({
        path: "company_id",
        select: "_id name phone email address city state gstNo logo upiId",
      });

    res.status(200).json({ message: "Invoice updated successfully", invoice: populatedInvoice || updatedInvoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ message: "Error updating invoice", error: error.message });
  }
};

const toggleInvoiceFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    let invoice = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      invoice = await Invoice.findById(id);
    }
    if (!invoice) {
      invoice = await Invoice.findOne({ invoiceID: id });
    }
    if (!invoice)
      return res.status(404).json({ message: 'Invoice not found' });
    invoice.isHeart = !invoice.isHeart;
    await invoice.save();
    return res.status(200).json({ message: 'Favorite status updated', isHeart: invoice.isHeart });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    let invoice = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      invoice = await Invoice.findById(id).populate("company_id");
    }
    if (!invoice) {
      invoice = await Invoice.findOne({ invoiceID: id }).populate("company_id");
    }
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    await generateInvoicePDF(res, invoice);
  } catch (error) {
    console.error("Error downloading invoice PDF:", error);
    res.status(500).json({ message: "Failed to generate PDF", error: error.message });
  }
};

const getInvoicesForUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const rawUserId = req.params.userId;
    const user = await resolveTargetUser(req, rawUserId);
    let targetUserId = user ? user._id : (mongoose.Types.ObjectId.isValid(rawUserId) ? rawUserId : DEFAULT_USER_ID);

    const companyId = req.query.companyId;
    const companyName = req.query.companyName ? req.query.companyName.toLowerCase() : null;
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : null;
    const customerName = req.query.customer ? req.query.customer.toLowerCase() : null;
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const sort = req.query.sort;
    const isHeart = req.query.isHeart === "true";

    const query = { user_id: targetUserId };
    if (companyId) query.company_id = { $in: [companyId] };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (isHeart) query.isHeart = true;
    let invoices = await Invoice.find(query)
      .populate({ path: "user_id", select: "_id firstName lastName email" })
      .populate({
        path: "company_id",
        select: "_id name phone email address city state gstNo logo upiId",
      });

    if (invoices.length === 0 && String(targetUserId) !== String(DEFAULT_USER_ID)) {
      const fallbackQuery = { ...query, user_id: DEFAULT_USER_ID };
      invoices = await Invoice.find(fallbackQuery)
        .populate({ path: "user_id", select: "_id firstName lastName email" })
        .populate({
          path: "company_id",
          select: "_id name phone email address city state gstNo logo upiId",
        });
    }

    if (searchQuery) {
      invoices = invoices.filter(inv => {
        const idMatch = inv.invoiceID && inv.invoiceID.toLowerCase().includes(searchQuery);
        const custMatch = inv.customers && inv.customers.some(c => c.name && c.name.toLowerCase().includes(searchQuery));
        const compMatch = inv.company_id && inv.company_id.some(c => c.name && c.name.toLowerCase().includes(searchQuery));
        return idMatch || custMatch || compMatch;
      });
    }
    if (customerName)
      invoices = invoices.filter(inv => inv.customers.some(c => c.name && c.name.toLowerCase().includes(customerName)));

    // Filter by company name
    if (companyName)
      invoices = invoices.filter(inv => inv.company_id.some(c => c.name && c.name.toLowerCase().includes(companyName)));

    // Calculate totals
    const formattedInvoices = invoices.map(inv => {
      let total = 0;
      inv.products.forEach(product => {
        const base = (Number(product.price) || 0) * (Number(product.quantity) || 0);
        const gstAmount = (base * (Number(product.gst) || 0)) / 100;
        total += base + gstAmount;
      });
      return { ...inv.toObject(), invoiceID: formatInvoiceID(inv.invoiceID), total: parseFloat(total.toFixed(2)) };
    });

    // Price filtering
    const filteredByPrice = formattedInvoices.filter(inv => {
      if (!isNaN(minPrice) && inv.total < minPrice) return false;
      if (!isNaN(maxPrice) && inv.total > maxPrice) return false;
      return true;
    });

    switch (sort) {
      case "priceLowToHigh":
        filteredByPrice.sort((a, b) => a.total - b.total);
        break;
      case "priceHighToLow":
        filteredByPrice.sort((a, b) => b.total - a.total);
        break;
      case "newestFirst":
        filteredByPrice.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldestFirst":
        filteredByPrice.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        filteredByPrice.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    const paginatedInvoices = filteredByPrice.slice(skip, skip + limit);
    res.status(200).json({
      message: "Invoices fetched successfully",
      invoices: paginatedInvoices,
      pagination: { total: filteredByPrice.length, page, limit, totalPages: Math.ceil(filteredByPrice.length / limit) }
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Error fetching invoices", error: error.message });
  }
};

const deleteInvoices = async (req, res) => {
  try {
    let invoiceIds = req.body.ids;
    if (!invoiceIds && req.params.id) invoiceIds = [req.params.id];
    if (!invoiceIds && req.body.id) invoiceIds = [req.body.id];
    if (typeof invoiceIds === "string") invoiceIds = [invoiceIds];
    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0)
      return res.status(400).json({ message: "No invoice IDs provided" });

    const validMongoIds = invoiceIds.filter((id) => id && mongoose.Types.ObjectId.isValid(String(id)));
    const stringIds = invoiceIds.filter((id) => id && !mongoose.Types.ObjectId.isValid(String(id))).map(String);
    const orClauses = [];
    if (validMongoIds.length > 0) orClauses.push({ _id: { $in: validMongoIds } });
    if (stringIds.length > 0) orClauses.push({ invoiceID: { $in: stringIds } });

    if (orClauses.length === 0)
      return res.status(400).json({ message: "No valid invoice IDs provided" });

    const deletedResult = await Invoice.deleteMany({ $or: orClauses });
    if (validMongoIds.length > 0) {
      await Company.updateMany({ invoices: { $in: validMongoIds } }, { $pull: { invoices: { $in: validMongoIds } } });
    }
    res.status(200).json({ message: "Invoices deleted successfully", deletedCount: deletedResult.deletedCount });
  } catch (error) {
    console.error("Error deleting invoices:", error);
    res.status(500).json({ message: "Error deleting invoices", error: error.message });
  }
};

export {
  getNextInvoiceID,
  createInvoiceForUser,
  updateInvoiceForUser,
  toggleInvoiceFavorite,
  downloadInvoice,
  getInvoicesForUser,
  deleteInvoices
};
