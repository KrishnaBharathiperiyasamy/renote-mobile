import { create } from "xmlbuilder2";
import xml2js from "xml2js";
import fs from "fs/promises";
import { validateProductData } from "./validators.js";
import Quotation from "../models/Quotation.js";
import Invoice from "../models/Invoice.js";
import Company from "../models/Company.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export const downloadMultipleInvoicesXML = async (req, res) => {
  try {
    const { ids } = req.body; // expect array of invoice IDs
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invoice IDs are required" });
    }

    // Fetch invoices with populated company
    const invoices = await Invoice.find({ _id: { $in: ids } })
      .populate("company_id");

    if (!invoices.length) {
      return res.status(404).json({ message: "No invoices found" });
    }

    // XML root
    const root = create({ version: "1.0", encoding: "UTF-8" })
      .ele("Invoices");

    invoices.forEach((invoice) => {
      const company = invoice.company_id?.[0] || {};
      const customer = invoice.customers?.[0] || {};
      const products = invoice.products || [];

      const invNode = root.ele("Invoice", { id: invoice._id });

      invNode.ele("InvoiceID").txt(invoice.invoiceID || "");
      invNode.ele("CreatedAt").txt(invoice.createdAt.toISOString());

      // Company
      const cNode = invNode.ele("Company");
      cNode.ele("Name").txt(company.name || "");
      cNode.ele("Address").txt(company.address || "");
      cNode.ele("Phone").txt(company.phone || "");
      cNode.ele("Email").txt(company.email || "");

      // Customer
      const cuNode = invNode.ele("Customer");
      cuNode.ele("Name").txt(customer.name || "");
      cuNode.ele("PhoneNumber").txt(customer.phoneNumber || "");
      cuNode.ele("Email").txt(customer.email || "");
      cuNode.ele("Address").txt(customer.address || "");
      cuNode.ele("GSTNo").txt(customer.gstNo || "");

      // Products
      const pNode = invNode.ele("Products");
      products.forEach((p) => {
        const prod = pNode.ele("Product");
        prod.ele("Name").txt(p.name);
        prod.ele("Quantity").txt(p.quantity);
        prod.ele("Price").txt(p.price);
        prod.ele("HSN").txt(p.hsn || "");
        prod.ele("Unit").txt(p.unit || "");
        prod.ele("GST").txt(p.gst || 0);
        prod.ele("Amount").txt(p.price * p.quantity * (1 + (p.gst || 0) / 100));
      });

      // Totals
      const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
      const gstTotal = products.reduce(
        (sum, p) => sum + (p.price * p.quantity * (p.gst || 0)) / 100,
        0
      );
      const grandTotal = subtotal + gstTotal;
      const tNode = invNode.ele("Totals");
      tNode.ele("Subtotal").txt(subtotal.toFixed(2));
      tNode.ele("GST").txt(gstTotal.toFixed(2));
      tNode.ele("GrandTotal").txt(grandTotal.toFixed(2));
    });

    const xmlString = root.end({ prettyPrint: true });

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", "attachment; filename=invoices.xml");
    res.send(xmlString);

  } catch (error) {
    console.error("Invoice XML Download Error:", error);
    res.status(500).json({ message: "Failed to generate XML" });
  }
};

export const downloadMultipleQuotationsXML = async (req, res) => {
  try {
    const { ids } = req.body; // expect an array of quotation IDs
    if (!ids || !Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "Quotation IDs are required" });

    const quotations = await Quotation.find({ _id: { $in: ids } })
      .populate("company_id");
    if (!quotations.length)
      return res.status(404).json({ message: "No quotations found" });

    // Convert to XML
    const root = create({ version: "1.0", encoding: "UTF-8" })
      .ele("Quotations");

    quotations.forEach((quotation) => {
      const company = quotation.company_id?.[0] || {};
      const customer = quotation.customers?.[0] || {};
      const products = quotation.products || [];

      const qNode = root.ele("Quotation", { id: quotation._id });

      qNode.ele("EstimateID").txt(quotation.estimateID || "");
      qNode.ele("CreatedAt").txt(quotation.createdAt.toISOString());

      // Company
      const cNode = qNode.ele("Company");
      cNode.ele("Name").txt(company.name || "");
      cNode.ele("Address").txt(company.address || "");
      cNode.ele("Phone").txt(company.phone || "");
      cNode.ele("Email").txt(company.email || "");
      // Customer
      const cuNode = qNode.ele("Customer");
      cuNode.ele("Name").txt(customer.name || "");
      cuNode.ele("PhoneNumber").txt(customer.phoneNumber || "");
      cuNode.ele("Email").txt(customer.email || "");
      cuNode.ele("Address").txt(customer.address || "");
      cuNode.ele("GSTNo").txt(customer.gstNo || ""); 
      // Products
      const pNode = qNode.ele("Products");
      products.forEach((p) => {
        const prod = pNode.ele("Product");
        prod.ele("Name").txt(p.name);
        prod.ele("Quantity").txt(p.quantity);
        prod.ele("Price").txt(p.price);
        prod.ele("GST").txt(p.gst || 0);
        prod.ele("Unit").txt(p.unit || "");
        prod.ele("Amount").txt(p.price * p.quantity * (1 + (p.gst || 0) / 100));
      });
      // Totals
      const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
      const gstTotal = products.reduce(
        (sum, p) => sum + (p.price * p.quantity * (p.gst || 0)) / 100,
        0
      );
      const grandTotal = subtotal + gstTotal;
      const tNode = qNode.ele("Totals");
      tNode.ele("Subtotal").txt(subtotal.toFixed(2));
      tNode.ele("GST").txt(gstTotal.toFixed(2));
      tNode.ele("GrandTotal").txt(grandTotal.toFixed(2));
    });
    const xmlString = root.end({ prettyPrint: true });
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", "attachment; filename=Estimations.xml");
    res.send(xmlString);
  } catch (error) {
    console.error("XML Download Error:", error);
    res.status(500).json({ message: "Failed to generate XML" });
  }
};

export const downloadMultipleProductsXML = async (req, res) => {
  try {
    const { ids } = req.body; // expect array of product IDs

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Product IDs are required" });
    }

    // Fetch products with populated company
    const products = await Product.find({ _id: { $in: ids } })
      .populate("company_id", "name address phone email");

    if (!products.length) {
      return res.status(404).json({ message: "No products found" });
    }

    // XML root
    const root = create({ version: "1.0", encoding: "UTF-8" }).ele("Products");

    products.forEach((product) => {
      const company = product.company_id || {};

      const pNode = root.ele("Product", { id: product._id });

      // Product Info
      pNode.ele("Name").txt(product.name || "");
      pNode.ele("Price").txt(product.price?.toFixed(2) || "0.00");
      pNode.ele("Quantity").txt(product.qty || 0);
      pNode.ele("Unit").txt(product.unit || "");
      pNode.ele("HSN").txt(product.hsn || "");
      pNode.ele("GST").txt(product.gst || 0);
      pNode.ele("Description").txt(product.description || "");
      pNode.ele("Dealers").txt(product.dealers || "");
      pNode.ele("IsFavourite").txt(product.isHeart ? "true" : "false");

      // Amount
      const amount = product.price * product.qty;
      const gstAmount = (amount * (product.gst || 0)) / 100;
      const totalAmount = amount + gstAmount;

      const amtNode = pNode.ele("Amounts");
      amtNode.ele("Subtotal").txt(amount.toFixed(2));
      amtNode.ele("GSTAmount").txt(gstAmount.toFixed(2));
      amtNode.ele("Total").txt(totalAmount.toFixed(2));

      // Company Info
      const cNode = pNode.ele("Company");
      cNode.ele("Name").txt(company.name || "");
      cNode.ele("Address").txt(company.address || "");
      cNode.ele("Phone").txt(company.phone || "");
      cNode.ele("Email").txt(company.email || "");
    });

    // Final XML
    const xmlString = root.end({ prettyPrint: true });

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", "attachment; filename=products.xml");
    res.send(xmlString);
  } catch (error) {
    res.status(500).json({ message: "Failed to generate product XML" });
  }
};

async function findOrCreateCompany(data, userId, flag) {
  if (!data?.name) throw new Error("Company Name is required");
  const normalizedName = data.name.trim();
  const gstNo = data.gstNo ? data.gstNo.trim() : null;
  const orConditions = [{ name: { $regex: new RegExp(`^${normalizedName}$`, "i") } }];
  if (gstNo)
    orConditions.push({ gstNo });
  let existing = await Company.findOne({
    userId,
    isDeleted: false,
    $or: orConditions
  });
  if (existing) return existing;
  const company = new Company({
    name: normalizedName,
    phone: data.phone || data.phoneNumber || null,
    email: data.email || null,
    address: data.address || null,
    city: data.city || "Unknown",
    state: data.state || null,
    zipCode: data.zipCode || null,
    gstNo: gstNo || null,
    companyType: data.companyType || "General",
    description: data.description || null,
    userId,
    invoices: [],
    quotations: [],
    isDeleted: false,
    flag
  });
  const savedCompany = await company.save();
  return savedCompany;
}

export const uploadInvoiceXML = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!req.file)
      return res.status(400).json({ message: "No XML file uploaded" });
    const xmlData = req.file.buffer.toString("utf-8");
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsed = await parser.parseStringPromise(xmlData);
    let invoices = [];
    if (parsed.Invoices?.Invoice) {
      invoices = Array.isArray(parsed.Invoices.Invoice)
        ? parsed.Invoices.Invoice
        : [parsed.Invoices.Invoice];
    } else if (parsed.Invoice) {
      invoices = [parsed.Invoice];
    } else {
      return res.status(400).json({ message: "Invalid XML format" });
    }
    const allInvoices = await Invoice.find({ user_id: userId }).lean();
    let maxNum = 0;
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `I${year}${month}`;

    allInvoices.forEach((inv) => {
      if (inv.invoiceID?.startsWith(prefix)) {
        const num = parseInt(inv.invoiceID.slice(prefix.length), 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const savedInvoices = [];
    for (const inv of invoices) {
      maxNum++;
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const newInvoiceID = `I${year}${month}${String(maxNum).padStart(3, "0")}`;
      const companyData = {
        name: inv.Company?.Name,
        phone: inv.Company?.Phone,
        email: inv.Company?.Email,
        address: inv.Company?.Address,
        gstNo: inv.Company?.GSTNo || null,
        city: inv.Company?.City || "Unknown",
        state: inv.Company?.State || null,
        zipCode: inv.Company?.ZipCode || null,
        description: inv.Company?.Description || null,
      };
      const vendor = await findOrCreateCompany(companyData, userId, "vendor");
      if (!inv.Customer || !inv.Customer.Name) {
        return res.status(400).json({
          message: `Customer details are required for invoice ${newInvoiceID}`,
        });
      }
      const customerData = {
        name: inv.Customer.Name,
        phoneNumber: inv.Customer.PhoneNumber || "",
        email: inv.Customer.Email || "",
        address: inv.Customer.Address || "",
        gstNo: inv.Customer.GSTNo || "",
      };
      const customer = await findOrCreateCompany(
        customerData,
        userId,
        "customer"
      );
      const productsRaw = inv.Products?.Product || [];
      const parsedProducts = Array.isArray(productsRaw)
        ? productsRaw
        : [productsRaw];
      const processedProducts = await Promise.all(
        parsedProducts.map(async (p) => {
          const name = p.Name?.trim();
          if (!name) return null;

          let existingProduct = await Product.findOne({
            user_id: userId,
            name,
          });
          if (!existingProduct) {
            existingProduct = new Product({
              name,
              price: Number(p.Price) || 0,
              qty: 0,
              unit: p.Unit || "",
              gst: Number(p.GST) || 0,
              user_id: userId,
              company_id: vendor._id,
            });
            await existingProduct.save();
          }
          const quantity = Number(p.Quantity) || 0;
          existingProduct.qty = (existingProduct.qty || 0) - quantity;
          await existingProduct.save();

          return {
            productId: existingProduct._id,
            name: existingProduct.name,
            quantity,
            price: Number(p.Price) || 0,
            gst: Number(p.GST) || 0,
            unit: p.Unit || "",
          };
        })
      );
      const newInvoice = new Invoice({
        invoiceID: newInvoiceID,
        user_id: userId,
        products: processedProducts.filter(Boolean),
        company_id: [vendor._id],
        customers: [
          {
            name: customerData.name,
            phoneNumber: customerData.phoneNumber,
            email: customerData.email,
            address: customerData.address,
            gstNo: customerData.gstNo,
          },
        ],
        total: inv.Totals?.GrandTotal ? Number(inv.Totals.GrandTotal) : 0,
        createdAt: new Date(),
      });

      const savedInvoice = await newInvoice.save();
      savedInvoices.push(savedInvoice);
      await Company.updateOne(
        { _id: vendor._id },
        { $push: { invoices: savedInvoice._id } }
      );
      await Company.updateOne(
        { _id: customer._id },
        { $push: { invoices: savedInvoice._id } }
      );
    }

    res.status(201).json({
      message: `${savedInvoices.length} invoice(s) created via XML successfully!`,
      invoices: savedInvoices,
    });
  } catch (err) {
    console.error("Error uploading XML:", err);
    res
      .status(500)
      .json({ message: "Failed to upload XML", error: err.message });
  }
};

export const uploadQuotationXML = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.file)
      return res.status(400).json({ message: "No XML file uploaded" });

    const xmlData = req.file.buffer.toString("utf-8");
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsed = await parser.parseStringPromise(xmlData);

    let quotations = [];
    if (parsed.Quotations?.Quotation) {
      quotations = Array.isArray(parsed.Quotations.Quotation)
        ? parsed.Quotations.Quotation
        : [parsed.Quotations.Quotation];
    } else if (parsed.Quotation) {
      quotations = [parsed.Quotation];
    } else {
      return res.status(400).json({ message: "Invalid XML format" });
    }

    const allQuotations = await Quotation.find({ user_id: userId }).lean();
    let maxNum = 0;
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `E${year}${month}`;
    allQuotations.forEach((q) => {
      if (q.estimateID?.startsWith(prefix)) {
        const num = parseInt(q.estimateID.slice(prefix.length), 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const savedQuotations = [];
    for (const q of quotations) {
      maxNum++;
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const newEstimateID = `E${year}${month}${String(maxNum).padStart(
        3,
        "0"
      )}`;
      // Vendor
      const companyData = {
        name: q.Company?.Name,
        phone: q.Company?.Phone,
        email: q.Company?.Email,
        address: q.Company?.Address,
        gstNo: q.Company?.GSTNo || null,
        city: q.Company?.City || "Unknown",
        state: q.Company?.State || null,
        zipCode: q.Company?.ZipCode || null,
        description: q.Company?.Description || null,
      };
      const vendor = await findOrCreateCompany(companyData, userId, "vendor");

      // Customer
      if (!q.Customer || !q.Customer.Name) {
        return res.status(400).json({
          message: `Customer details are required for quotation ${newEstimateID}`,
        });
      }
      const customerData = {
        name: q.Customer.Name,
        phoneNumber: q.Customer.PhoneNumber || "",
        email: q.Customer.Email || "",
        address: q.Customer.Address || "",
        gstNo: q.Customer.GSTNo || "",
      };
      const customer = await findOrCreateCompany(
        customerData,
        userId,
        "customer"
      );

      // Products — same as createInvoiceForUser logic but **do not subtract quantity**
      const productsRaw = q.Products?.Product || [];
      const parsedProducts = Array.isArray(productsRaw)
        ? productsRaw
        : [productsRaw];
      const processedProducts = await Promise.all(
        parsedProducts.map(async (p) => {
          const name = p.Name?.trim();
          if (!name) return null;
          let existingProduct = await Product.findOne({
            user_id: userId,
            name,
            
          });
          if (!existingProduct) {
            existingProduct = new Product({
              name,
              price: Number(p.Price) || 0,
              qty: 0,
              unit: p.Unit || "",
              gst: Number(p.GST) || 0,
              user_id: userId,
              company_id: vendor._id,
            });
            await existingProduct.save();
          }
          return {
            productId: existingProduct._id,
            name: existingProduct.name,
            quantity: Number(p.Quantity) || 0,
            price: Number(p.Price) || 0,
            gst: Number(p.GST) || 0,
            unit: p.Unit || "",
          };
        })
      );

      // Create quotation
      const newQuotation = new Quotation({
        estimateID: newEstimateID,
        user_id: userId,
        products: processedProducts.filter(Boolean),
        company_id: [vendor._id],
        customers: [
          {
            name: customerData.name,
            phoneNumber: customerData.phoneNumber,
            email: customerData.email,
            address: customerData.address,
            gstNo: customerData.gstNo,
          },
        ],
        total: q.Totals?.GrandTotal ? Number(q.Totals.GrandTotal) : 0,
        createdAt: new Date(),
      });

      const savedQuotation = await newQuotation.save();
      savedQuotations.push(savedQuotation);

      await Company.updateOne(
        { _id: vendor._id },
        { $push: { quotations: savedQuotation._id } }
      );
      await Company.updateOne(
        { _id: customer._id },
        { $push: { quotations: savedQuotation._id } }
      );
    }

    res.status(201).json({
      message: `${savedQuotations.length} quotation(s) created via XML successfully!`,
      quotations: savedQuotations,
    });
  } catch (err) {
    console.error("Error uploading quotation XML:", err);
    res
      .status(500)
      .json({ message: "Failed to upload quotation XML", error: err.message });
  }
};

export const uploadProductXML = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!req.file)
      return res.status(400).json({ message: "No XML file uploaded" });

    let targetUserId = req.user?._id;
    if (!targetUserId) {
      const user = mongoose.Types.ObjectId.isValid(userId)
        ? await User.findById(userId)
        : await User.findOne({ authId: String(userId) });
      targetUserId = user?._id;
    }
    if (!targetUserId) {
      return res.status(400).json({ message: "Valid user required" });
    }

    const xmlData = await fs.readFile(req.file.path, "utf-8");
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsed = await parser.parseStringPromise(xmlData);

    let products = [];
    if (parsed.Products?.Product) {
      products = Array.isArray(parsed.Products.Product)
        ? parsed.Products.Product
        : [parsed.Products.Product];
    } else {
      return res.status(400).json({ message: "Invalid XML format" });
    }

    const savedProducts = [];
    const skippedProducts = [];

    for (const p of products) {
      const companyData = {
        name: p.Company?.Name || "Unknown Company",
        phone: p.Company?.Phone || "",
        email: p.Company?.Email || "",
        address: p.Company?.Address || "",
      };

      const company = await findOrCreateCompany(companyData, targetUserId, "vendor");

      const productData = {
        userId: targetUserId,
        companyId: company._id.toString(),
        name: p.Name || "Unnamed Product",
      };

      // ✅ Validate product before creating
      const validation = await validateProductData(productData);

      if (!validation.valid) {
        skippedProducts.push({ name: productData.name, reason: validation.message });
        continue; // skip duplicate or invalid product
      }

      const qty = Number(p.Quantity) || 0;
      const price = Number(p.Price) || 0;
      const gst = Number(p.GST) || 0;
      const hsn = p.HSN || "";

      const newProduct = new Product({
        company_id: company._id,
        user_id: targetUserId,
        name: productData.name.trim(),
        price,
        qty,
        unit: p.Unit || "",
        gst,
        hsn,
        description: p.Description || "",
        dealers: p.Dealers || "",
        isHeart: p.IsFavourite === "true",
      });

      const savedProduct = await newProduct.save();
      savedProducts.push(savedProduct);

      await Company.updateOne(
        { _id: company._id },
        { $push: { products: savedProduct._id } }
      );
    }

    let message = `${savedProducts.length} product(s) uploaded successfully!`;
    if (skippedProducts.length > 0) {
      message += ` Skipped ${skippedProducts.length} duplicate/invalid product(s).`;
    }

    res.status(201).json({
      message,
      insertedCount: savedProducts.length,
      skippedCount: skippedProducts.length,
      skippedProducts,
      products: savedProducts,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to upload XML",
      error: err.message,
      stack: err.stack,
    });
  }
};
