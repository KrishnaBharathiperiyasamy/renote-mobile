import Company from "../models/Company.js";
import mongoose from "mongoose";
import Quotation from "../models/Quotation.js";
import Product from "../models/Product.js";
import Invoice from "../models/Invoice.js";
import { validateCompanyFields } from "../utilis/validators.js";
import { getUserPlan } from "../utilis/getUserPlan.js";
import User from "../models/User.js";
import path from "path";
import fs from "fs";
import { normalizeUploadPublicPath, resolveStoredUploadPath, resolveUploadPath } from "../utils/uploadPaths.js";
import { getFolderSize, formatBytes } from "../utilis/folderSize.js";

const normalizePan = (pan) => (pan ? String(pan).trim().toUpperCase() : "");


// Subscription-based company limit logic removed


const createMultipleCompanies = async (req, res) => {
  const userId = req.params.userId;
  const companiesData = req.body.companies; // expect an array of companies

  if (!Array.isArray(companiesData) || companiesData.length === 0)
    return res.status(400).json({ message: "Please provide an array of companies." });
  try {
    // Subscription-based company limit logic removed

    const savedCompanies = [];
    for (const companyData of companiesData) {
      const validationError = await validateCompanyFields({ body: companyData }, res, null, userId);
      if (validationError) return validationError;
      const {
        name, phone, email, address, city, state, zipCode,
        gstNo, panNo, companyType, description, quotations, isDeleted, flag
      } = companyData;
      const company = new Company({
        logo: null,
        name: name.trim(),
        phone,
        email: email?.trim() || null,
        address: address?.trim() || null,
        city: city.trim(),
        state: state?.trim() || null,
        zipCode: zipCode?.trim() || null,
        gstNo: gstNo?.trim() || null,
        panNo: normalizePan(panNo),
        companyType,
        description: description?.trim() || null,
        userId,
        quotations: quotations || [],
        isDeleted: isDeleted || false,
        flag,
        panVerificationStatus: "unverified",
      });
      const savedCompany = await company.save();
      savedCompanies.push(savedCompany);
    }
    res.status(201).json({ message: "Companies created successfully!", companies: savedCompanies });
  } catch (error) {
    res.status(500).json({ message: "Error creating companies", error: error.message });
  }
};

const createCompany = async (req, res) => {
  const rawUserId = req.params.userId;
  try {
    let userId = null;
    if (req.user?._id) {
      userId = req.user._id.toString();
    }
    if (!userId && rawUserId && rawUserId !== "undefined" && rawUserId !== "null") {
      let u = null;
      if (mongoose.Types.ObjectId.isValid(rawUserId)) {
        u = await User.findById(rawUserId);
      }
      if (!u) {
        u = await User.findOne({ authId: rawUserId });
      }
      if (u) userId = u._id.toString();
      else if (mongoose.Types.ObjectId.isValid(rawUserId)) userId = rawUserId;
    }
    if (!userId) {
      return res.status(400).json({ message: "Invalid or missing user ID" });
    }
    const { flag } = req.body;
    if (flag === 'vendor') {
      // Enforce vendor company limit based on plan
      const plan = await getUserPlan(userId);
      const maxFromCompanies = plan?.features?.maxFromCompanies ?? 1;
      // Count vendor companies (flag === 'vendor')
      const vendorCount = await Company.countDocuments({ userId, flag: 'vendor', isDeleted: false });
      if (vendorCount >= maxFromCompanies) {
        return res.status(403).json({
          message: `Your plan allows only ${maxFromCompanies} vendor company(ies). Please upgrade your plan to add more.`
        });
      }
    }

    const validationError = await validateCompanyFields(req, res, null, userId);
    if (validationError) return validationError;
    const {
      name, phone, email, address, city, state, zipCode,
      gstNo, panNo, companyType, description, quotations, isDeleted, upiId
    } = req.body;
    let logo = null;
    if (req.file) {
      logo = normalizeUploadPublicPath(req.file.path);
    }
    const company = new Company({
      logo,
      name: name.trim(),
      phone: String(phone).trim(),
      email: email?.trim() || null,
      address: address?.trim() || null,
      city: city.trim(),
      state: state?.trim() || null,
      zipCode: zipCode?.trim() || null,
      gstNo: gstNo ? String(gstNo).trim().toUpperCase() : null,
      panNo: normalizePan(panNo) || null,
      companyType: companyType.trim(),
      description: description?.trim() || null,
      userId,
      quotations: quotations || [],
      isDeleted: isDeleted || false,
      flag,
      upiId: upiId?.trim() || '',
      panVerificationStatus: "unverified",
    });
    const savedCompany = await company.save();
    res.status(201).json({ message: "Company created successfully!", company: savedCompany });
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ message: "Error creating company", error: error.message });
  }
};

const editCompany = async (req, res) => {
  const companyId = req.params.id;
  try {
    const company = await Company.findById(companyId);
    if (!company)
      return res.status(404).json({ message: "Company not found!" });
    const validationError = await validateCompanyFields(req, res, companyId, company.userId);
    if (validationError) return validationError;
    const {
      name, phone, email, address, city, state, zipCode,
      gstNo, panNo, companyType, description, userId, quotations, isDeleted, flag
    } = req.body;
    let logo = company.logo;
    if (req.file) {
      // Delete old logo if it exists
      if (company.logo) {
        const oldLogoPath = resolveStoredUploadPath(company.logo);
        if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);
      }
      // Store new logo as relative path with forward slashes
      logo = normalizeUploadPublicPath(req.file.path);
    }
    const updateFields = [
      'name', 'phone', 'email', 'address', 'city', 'state', 'zipCode',
      'gstNo', 'companyType', 'description', 'quotations', 'userId',
      'isDeleted', 'flag', 'upiId'
    ];
    updateFields.forEach(field => { if (req.body[field] !== undefined) company[field] = req.body[field]; });

    if (req.body.panNo !== undefined) {
      const normalizedPan = normalizePan(req.body.panNo);
      const hasPanChanged = normalizedPan !== (company.panNo || "");
      company.panNo = normalizedPan;
      if (hasPanChanged) {
        company.panVerificationStatus = "unverified";
        company.panVerifiedAt = null;
        company.panVerificationRefId = "";
        company.panVerificationSource = "";
        company.panVerificationMeta = null;
      }
    }

    company.logo = logo;
    await company.save();
    res.status(200).json({ message: "Company updated successfully!", company });
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ message: "Error updating company", error: error.message });
  }
};

const getAllCompaniesByUserId = async (req, res) => {
  const rawUserId = req.params.userId;
  const flag = req.query.flag; // 'vendor' or 'customer' or undefined
  try {
    let resolvedUserId = null;
    if (req.user?._id) {
      resolvedUserId = req.user._id.toString();
    }
    if (!resolvedUserId && rawUserId && rawUserId !== "undefined" && rawUserId !== "null") {
      let u = null;
      if (mongoose.Types.ObjectId.isValid(rawUserId)) {
        u = await User.findById(rawUserId);
      }
      if (!u) {
        u = await User.findOne({ authId: rawUserId });
      }
      if (u) resolvedUserId = u._id.toString();
      else if (mongoose.Types.ObjectId.isValid(rawUserId)) resolvedUserId = rawUserId;
    }

    const query = { isDeleted: false };
    if (resolvedUserId) {
      query.userId = resolvedUserId;
    }
    if (flag === "vendor" || flag === "customer") {
      query.flag = flag;
    }
    let companies = await Company.find(query);

    // If companies requested and user has no companies yet, fallback to default user companies
    if (!companies || companies.length === 0) {
      const defaultUserId = "69d362ca7421b5bc1882903d";
      const fallbackQuery = { userId: defaultUserId, isDeleted: false };
      if (flag === "vendor" || flag === "customer") {
        fallbackQuery.flag = flag;
      }
      companies = await Company.find(fallbackQuery);
      if (!companies || companies.length === 0) {
        const anyQuery = { isDeleted: false };
        if (flag === "vendor" || flag === "customer") {
          anyQuery.flag = flag;
        }
        companies = await Company.find(anyQuery);
      }
    }

    const normalized = companies.map((item) => {
      const obj = item.toObject();
      obj.logo = normalizeUploadPublicPath(item.logo);
      const ownerId = obj.userId ? obj.userId.toString() : (resolvedUserId || "default");
      const companyFolder = resolveUploadPath(ownerId, obj._id.toString());
      const sizeBytes = getFolderSize(companyFolder);
      obj.totalConsumedSpace = formatBytes(sizeBytes);
      return obj;
    });
    return res.status(200).json({ company: normalized || [] });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving companies", error: error.message });
  }
};

const deleteCustomerCompany = async (req, res) => {
  const companyId = req.params.id;
  if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
    return res.status(400).json({ message: "Invalid company ID" });
  }
  try {
    const company = await Company.findByIdAndUpdate(companyId, { isDeleted: true }, { new: true });
    if (!company)
      return res.status(404).json({ message: "Company not found!" });
    res.status(200).json({ message: "Company deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error soft-deleting company", error: error.message });
  }
};

const deleteCompany = async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid company ID" });
  }
  const { quotations, invoices, products } = req.body || {};

  try {
    const companyId = new mongoose.Types.ObjectId(id);
    const company = await Company.findById(companyId);
    if (!company)
      return res.status(404).json({ success: false, message: "Company not found" });

    // Track deleted counts
    let deletedQuotations = 0;
    let deletedInvoices = 0;
    let deletedProducts = 0;

    // Delete associated quotations if requested
    if (quotations) {
      const result = await Quotation.deleteMany({ company_id: companyId });
      deletedQuotations = result.deletedCount;
    }

    // Delete associated invoices if requested
    if (invoices) {
      const result = await Invoice.deleteMany({ company_id: companyId });
      deletedInvoices = result.deletedCount;
    }

    // Delete associated products if requested
    if (products) {
      const result = await Product.deleteMany({ company_id: companyId });
      deletedProducts = result.deletedCount;
    }

    // If all three selected → HARD DELETE company
    if (quotations && invoices && products) {
      await Company.findByIdAndDelete(companyId);
      return res.status(200).json({ success: true, message: "Company and all associated data permanently deleted!" });
    }

    // Otherwise → SOFT DELETE company
    await Company.findByIdAndUpdate(companyId, { isDeleted: true }, { new: true });
    return res.status(200).json({ success: true, message: "Company deleted. Associated data removed." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting company and associated data", error: error.message, });
  }
};

export { createCompany, createMultipleCompanies, deleteCompany, editCompany, getAllCompaniesByUserId, deleteCustomerCompany };
