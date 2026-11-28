import mongoose from "mongoose";
import User from "../models/User.js";

/**
 * Resolves a userId parameter (which may be a MongoDB ObjectId, an Auth-service authId UUID,
 * an email, or a phone number) or the authenticated req.user to a valid MongoDB User ObjectId.
 * 
 * @param {string|mongoose.Types.ObjectId} userIdInput - Raw user identifier from params or body
 * @param {Object} [reqUser] - The req.user object attached by authMiddleware or optionalAuth
 * @returns {Promise<mongoose.Types.ObjectId|null>} Valid MongoDB ObjectId or null
 */
export async function resolveUserMongoId(userIdInput, reqUser = null) {
  try {
    // 1. If reqUser is already authenticated with a valid MongoDB _id, prefer it
    if (reqUser?._id && mongoose.Types.ObjectId.isValid(reqUser._id)) {
      return reqUser._id;
    }

    if (!userIdInput) {
      if (reqUser?.authId && mongoose.connection.readyState === 1) {
        const u = await User.findOne({ authId: String(reqUser.authId) }).maxTimeMS(1000).select("_id");
        if (u) return u._id;
      }
      return null;
    }

    // 2. If userIdInput is already a 24-hex ObjectId
    if (mongoose.Types.ObjectId.isValid(userIdInput)) {
      if (mongoose.connection.readyState === 1) {
        const exists = await User.findById(userIdInput).maxTimeMS(1000).select("_id");
        if (exists) return exists._id;
      }
      return new mongoose.Types.ObjectId(userIdInput);
    }

    // If database is not connected, cannot query by authId/email/phone
    if (mongoose.connection.readyState !== 1) {
      return null;
    }

    // 3. Look up by authId (UUID from auth-service)
    const byAuthId = await User.findOne({ authId: String(userIdInput) }).maxTimeMS(1000).select("_id");
    if (byAuthId) return byAuthId._id;

    // 4. Look up by email
    const byEmail = await User.findOne({ email: String(userIdInput).trim().toLowerCase() }).maxTimeMS(1000).select("_id");
    if (byEmail) return byEmail._id;

    // 5. Look up by phone number
    const byPhone = await User.findOne({
      $or: [
        { phoneNumber: String(userIdInput).trim() },
        { phone: String(userIdInput).trim() },
      ],
    }).maxTimeMS(1000).select("_id");
    if (byPhone) return byPhone._id;

    // 6. Fallback to reqUser authId if available
    if (reqUser?.authId) {
      const u = await User.findOne({ authId: String(reqUser.authId) }).maxTimeMS(1000).select("_id");
      if (u) return u._id;
    }

    return null;
  } catch (err) {
    console.error("Error in resolveUserMongoId:", err);
    return null;
  }
}

export default resolveUserMongoId;
