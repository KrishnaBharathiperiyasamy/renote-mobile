import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/User.js";
import Company from "../models/Company.js"
import Invoice from "../models/Invoice.js";
import Quotation from "../models/Quotation.js";
import Poster from "../models/Poster.js";
import Product from "../models/Product.js";
import { isApprovedEmail, UNAUTHORIZED_EMAIL_MESSAGE } from "../config/approvedEmails.js";

const KRISHUB_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@krishub\.in$/i;

const createUser = async (req, res) => {
  try {
    const {
      authId,
      email = "",
      phoneNumber = "",
      firstName = "",
      lastName = "",
      isDeleted,
    } = req.body;

    if (!authId) {
      return res.status(400).json({ message: "authId is required" });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !isApprovedEmail(cleanEmail)) {
      return res.status(400).json({
        message: UNAUTHORIZED_EMAIL_MESSAGE,
      });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ authId });
    if (existingUser) {
      if (!existingUser.email || !isApprovedEmail(existingUser.email)) {
        return res.status(403).json({
          message: UNAUTHORIZED_EMAIL_MESSAGE,
        });
      }
      return res.status(200).json({ exists: true, message: "User already exists", user_id: existingUser._id });
    }

    const savedUser = await User.create({
      authId,
      email: cleanEmail,
      phoneNumber: phoneNumber.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: "USER", // Normal registrations always receive USER role
      isDeleted: isDeleted || false,
    });

    return res.status(201).json({
      exists: false,
      message: "User created successfully",
      user_id: savedUser._id,
    });

  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      { $match: { isDeleted: { $ne: true } } },

      // Quotations count
      {
        $lookup: {
          from: "quotations",
          localField: "_id",
          foreignField: "user_id",
          as: "userQuotations"
        }
      },

      // Invoices count
      {
        $lookup: {
          from: "invoices",
          localField: "_id",
          foreignField: "user_id",
          as: "userInvoices"
        }
      },

      // Posters count
      {
        $lookup: {
          from: "posters",
          localField: "_id",
          foreignField: "user_id",
          as: "userPosters"
        }
      },

      // Project only counts + essential fields
      {
        $project: {
          authId: 1,
          email: 1,
          phoneNumber: 1,
          firstName: 1,
          lastName: 1,
          invoicesCount: { $size: "$userInvoices" },
          postersCount: { $size: "$userPosters" },
          estimationsCount: { $size: "$userQuotations" }
        }
      }
    ]);

    res.status(200).json({ message: "Users fetched successfully", users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const rawId = req.params.id || req.params.authId;
    let user = null;

    if (!rawId || rawId === "me" || rawId === "profile") {
      if (req.user?._id) {
        user = await User.findById(req.user._id);
      }
      if (!user && req.user?.authId) {
        user = await User.findOne({ authId: req.user.authId, isDeleted: { $ne: true } });
      }
    } else {
      if (mongoose.Types.ObjectId.isValid(rawId)) {
        user = await User.findById(rawId);
      }
      if (!user) {
        user = await User.findOne({ authId: rawId, isDeleted: { $ne: true } });
      }
      if (!user && req.user?._id && (rawId === req.user?.authId || String(rawId) === String(req.user?._id))) {
        user = await User.findById(req.user._id);
      }
    }

    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User fetched successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const {
      email,
      phoneNumber,
      phone,
      firstName,
      lastName,
      profilePic,
      profileImage,
      uploadedImage,
      isDeleted,
    } = req.body;
    const rawId = req.params.id || req.params.authId;
    let user = null;

    if (!rawId || rawId === "me" || rawId === "profile") {
      if (req.user?._id) {
        user = await User.findById(req.user._id);
      }
      if (!user && req.user?.authId) {
        user = await User.findOne({ authId: req.user.authId, isDeleted: { $ne: true } });
      }
    } else {
      if (mongoose.Types.ObjectId.isValid(rawId)) {
        user = await User.findById(rawId);
      }
      if (!user) {
        user = await User.findOne({ authId: rawId, isDeleted: { $ne: true } });
      }
      if (!user && req.user?._id && (rawId === req.user?.authId || String(rawId) === String(req.user?._id))) {
        user = await User.findById(req.user._id);
      }
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    // Enforce role security: Prevent normal users and update requests from modifying role or admin fields
    if (req.body.role !== undefined && req.body.role !== user.role) {
      return res.status(403).json({ message: "Modifying user role is strictly restricted" });
    }

    // Update the relevant fields
    if (email !== undefined) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!cleanEmail || !isApprovedEmail(cleanEmail)) {
        return res.status(400).json({ message: UNAUTHORIZED_EMAIL_MESSAGE });
      }
      user.email = cleanEmail;
    }
    const resolvedPhone = phoneNumber !== undefined ? phoneNumber : phone;
    if (resolvedPhone !== undefined) user.phoneNumber = String(resolvedPhone).trim();
    if (firstName !== undefined) user.firstName = String(firstName).trim();
    if (lastName !== undefined) user.lastName = String(lastName).trim();
    const resolvedPic = profilePic || profileImage || uploadedImage;
    if (resolvedPic !== undefined) {
      user.profilePic = String(resolvedPic).trim();
      user.profileImage = String(resolvedPic).trim();
    }
    user.isDeleted = isDeleted !== undefined ? isDeleted : user.isDeleted;
    const updatedUser = await user.save();
    const refreshedUser = await User.findById(updatedUser._id).lean();
    res.status(200).json({ message: "User updated successfully", user: refreshedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params; 
  if (!mongoose.Types.ObjectId.isValid(id)) 
    return res.status(400).json({ message: "Invalid user ID" });
  
  try {
    const user = await User.findById(id);
    if (!user) 
      return res.status(404).json({ message: "User not found" });
    await Quotation.deleteMany({ user_id: id });
    await Invoice.deleteMany({ user_id: id });
    await Company.deleteMany({ userId: id });
    await Poster.deleteMany({ user_id: id });
    await Product.deleteMany({ user_id: id });
    await User.findByIdAndDelete(id);
    return res.status(200).json({
      message: "User and all related data (quotations, invoices, companies, posters, products) deleted successfully"
    });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDevSession = async (req, res) => {
  return res.status(403).json({ success: false, message: "Development mock session is disabled." });
};

const getAuthServiceBaseUrl = () => {
  const raw = process.env.AUTH_SERVICE_BE_URL || "http://localhost:3004";
  return raw.replace(/\/api\/v1\/?$/, "").replace(/\/auth\/?$/, "");
};

const getSession = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "No active session" });
    }
    const authId = req.user.authId || req.user.sub || req.user.id || req.user.userId;
    let user = null;
    if (req.user._id) {
      user = await User.findById(req.user._id).select("-__v");
    }
    if (!user && authId) {
      user = await User.findOne({ authId }).select("-__v");
    }
    if (user && user.isDeleted) {
      return res.status(404).json({ success: false, message: "User Account not found" });
    }
    return res.status(200).json({
      success: true,
      session: {
        valid: true,
        authId,
        user: user || req.user,
        role: req.user.roleCode || req.user.role || 'USER',
        exp: req.user.exp,
      },
      user: user || req.user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const refreshUserToken = async (req, res) => {
  try {
    const refreshToken = req.body?.refreshToken;
    const appCode = req.body?.appCode || "RENOTE";
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token is required" });
    }
    const authBase = getAuthServiceBaseUrl();
    try {
      const response = await axios.post(`${authBase}/auth/refresh-token`, {
        refreshToken,
        appCode,
      });
      return res.status(response.status).json(response.data);
    } catch (authErr) {
      const status = authErr.response?.status || 401;
      const data = authErr.response?.data || { success: false, message: "Token refresh failed" };
      return res.status(status).json(data);
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.body?.refreshToken;
    const authBase = getAuthServiceBaseUrl();
    if (refreshToken) {
      try {
        await axios.post(`${authBase}/auth/logout`, { refreshToken }).catch(() => {});
      } catch {}
    }
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.status(200).json({ success: true, message: "Logged out" });
  }
};

export {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDevSession,
  getSession,
  refreshUserToken,
  logoutUser,
};