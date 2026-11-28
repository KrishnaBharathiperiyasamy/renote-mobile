import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";
import User from "../models/User.js";

/**
 * Returns the user's current plan (active subscription), or the Free plan if none.
 * Handles userId as MongoDB ObjectId, authId string, email string, or phone number.
 * Grants permanent unlimited storage (-1) and poster limits (-1) for Vyshwa Srinivassaan (admin@krishub.in / 9092024444).
 * @param {string|ObjectId} userIdInput - MongoDB _id or authId or email or phone
 * @returns {Promise<Object>} The plan document / features object
 */
export async function getUserPlan(userIdInput) {
  if (!userIdInput) return null;

  try {
    // 1. Resolve user document by ObjectId, authId, email, or phone number
    let user = null;
    if (mongoose.Types.ObjectId.isValid(userIdInput)) {
      user = await User.findById(userIdInput);
    }
    if (!user) {
      user = await User.findOne({ authId: String(userIdInput) });
    }
    if (!user) {
      user = await User.findOne({ email: String(userIdInput) });
    }
    if (!user) {
      user = await User.findOne({
        $or: [
          { phoneNumber: String(userIdInput) },
          { phone: String(userIdInput) },
        ],
      });
    }

    const saUsername = (process.env.SUPER_ADMIN_USERNAME || "Vyshwa").trim().toLowerCase();
    const saRole = (process.env.SUPER_ADMIN_ROLE || "SUPER_ADMIN").trim().toUpperCase();

    const isDirectSaInput =
      userIdInput === "super-admin" ||
      userIdInput === "super-admin-root" ||
      userIdInput === "SUPER_ADMIN" ||
      (typeof userIdInput === "object" &&
        userIdInput !== null &&
        (userIdInput.isSuperAdmin ||
          String(userIdInput.role).toUpperCase() === saRole ||
          String(userIdInput.role).toLowerCase() === "super-admin"));

    const isPrimaryAdmin =
      isDirectSaInput ||
      (user &&
        (String(user.role).toUpperCase() === saRole ||
          String(user.role).toUpperCase() === "ADMIN" ||
          (user.username && user.username.toLowerCase() === saUsername) ||
          (user.firstName && user.firstName.toLowerCase() === saUsername) ||
          (user.firstName === "Vyshwa" && user.lastName === "Srinivassaan") ||
          user.email === "admin@krishub.in" ||
          user.phoneNumber === "9092024444" ||
          user.phone === "9092024444"));

    // Default free plan fallback if no Plan documents in database
    const DEFAULT_FREE_PLAN = {
      _id: "plan_free_default",
      name: "Free",
      slug: "free",
      price: 0,
      monthlyPrice: 0,
      annualPrice: 0,
      duration: "free",
      limits: {
        postersPerMonth: 5,
        posterLinks: 1,
        linkExpiryDays: 7,
        videoUploadsPerMonth: 2,
        companies: 1,
        totalVideoStorageMB: 75,
      },
      features: {
        maxFromCompanies: 1,
        maxPostersPerMonth: 5,
        maxPosterLinks: 1,
        posterLinkExpiryDays: 7,
        maxVideoUploadsPerMonth: 2,
        maxVideoStorageMB: 75,
        posterFrames: 10,
        supportLevel: "community",
        unlimitedInvoices: false,
        unlimitedEstimations: false,
        unlimitedProducts: false,
        unlimitedToCompanies: false,
        unlimitedPosters: false,
        unlimitedPosterLinks: false,
        unlimitedVideoUploads: false,
      },
      isActive: true,
    };

    // Permanent unlimited plan object
    const UNLIMITED_PLAN = {
      _id: "plan_unlimited_business",
      name: "Unlimited Business",
      slug: "unlimited",
      price: 0,
      monthlyPrice: 0,
      annualPrice: 0,
      duration: "unlimited",
      limits: {
        postersPerMonth: -1,
        posterLinks: -1,
        linkExpiryDays: 36500,
        videoUploadsPerMonth: -1,
        companies: -1,
        totalVideoStorageMB: -1,
      },
      features: {
        maxFromCompanies: -1,
        maxPostersPerMonth: -1,
        maxPosterLinks: -1,
        posterLinkExpiryDays: 36500,
        maxVideoUploadsPerMonth: -1,
        maxVideoStorageMB: -1,
        posterFrames: 99999,
        supportLevel: "dedicated",
        unlimitedInvoices: true,
        unlimitedEstimations: true,
        unlimitedProducts: true,
        unlimitedToCompanies: true,
        unlimitedPosters: true,
        unlimitedPosterLinks: true,
        unlimitedVideoUploads: true,
      },
      isActive: true,
    };

    if (isPrimaryAdmin) {
      return UNLIMITED_PLAN;
    }

    if (!user) return DEFAULT_FREE_PLAN;

    // 2. Look for active subscription in MongoDB
    const sub = await Subscription.findOne({ userId: user._id, isActive: true })
      .populate("planId")
      .lean();

    if (sub) {
      if (
        sub.billing === "unlimited" ||
        sub.planSlug === "unlimited" ||
        (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd).getFullYear() > 2090)
      ) {
        return UNLIMITED_PLAN;
      }

      if (sub.planId) {
        const planObj = sub.planId;
        const maxStorage = planObj.limits?.totalVideoStorageMB ?? planObj.features?.maxVideoStorageMB ?? 75;
        const maxPosters = planObj.limits?.postersPerMonth ?? planObj.features?.maxPostersPerMonth ?? 5;
        return {
          ...planObj,
          features: {
            ...(planObj.features || {}),
            maxVideoStorageMB: maxStorage,
            maxPostersPerMonth: maxPosters,
          },
        };
      }
    }

    // 3. Fallback to Free plan
    let freePlan = await Plan.findOne({ name: "Free", isActive: true }).lean();
    if (!freePlan) freePlan = await Plan.findOne({ isActive: true }).lean();

    if (freePlan) {
      const maxStorage = freePlan.limits?.totalVideoStorageMB ?? freePlan.features?.maxVideoStorageMB ?? 75;
      const maxPosters = freePlan.limits?.postersPerMonth ?? freePlan.features?.maxPostersPerMonth ?? 5;
      return {
        ...freePlan,
        features: {
          ...(freePlan.features || {}),
          maxVideoStorageMB: maxStorage,
          maxPostersPerMonth: maxPosters,
        },
      };
    }

    return DEFAULT_FREE_PLAN;
  } catch (err) {
    console.error("Error in getUserPlan:", err);
  }

  return {
    _id: "plan_free_default",
    name: "Free",
    slug: "free",
    price: 0,
    monthlyPrice: 0,
    annualPrice: 0,
    duration: "free",
    limits: {
      postersPerMonth: 5,
      posterLinks: 1,
      linkExpiryDays: 7,
      videoUploadsPerMonth: 2,
      companies: 1,
      totalVideoStorageMB: 75,
    },
    features: {
      maxFromCompanies: 1,
      maxPostersPerMonth: 5,
      maxPosterLinks: 1,
      posterLinkExpiryDays: 7,
      maxVideoUploadsPerMonth: 2,
      maxVideoStorageMB: 75,
      posterFrames: 10,
      supportLevel: "community",
      unlimitedInvoices: false,
      unlimitedEstimations: false,
      unlimitedProducts: false,
      unlimitedToCompanies: false,
      unlimitedPosters: false,
      unlimitedPosterLinks: false,
      unlimitedVideoUploads: false,
    },
    isActive: true,
  };
}
