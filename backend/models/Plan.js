import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  razorpayPlanId: { type: String, default: null }, // Generalized Razorpay plan ID (set per plan record)
  features: {
    maxFromCompanies: { type: Number, default: 1 }, // e.g., 1 for Free, 2 for Starter, etc.
    maxPostersPerMonth: { type: Number, default: 5 },
    maxPosterLinks: { type: Number, default: 3 },
    posterLinkExpiryDays: { type: Number, default: 7 },
    maxVideoUploadsPerMonth: { type: Number, default: 1 },
    maxVideoStorageMB: { type: Number, default: 75 },
    posterFrames: { type: Number, default: 50 },
    supportLevel: { type: String, default: "none" }, // email, priority, dedicated
    unlimitedInvoices: { type: Boolean, default: true },
    unlimitedEstimations: { type: Boolean, default: true },
    unlimitedProducts: { type: Boolean, default: true },
    unlimitedToCompanies: { type: Boolean, default: true },
    unlimitedPosters: { type: Boolean, default: false },
    unlimitedPosterLinks: { type: Boolean, default: false },
    unlimitedVideoUploads: { type: Boolean, default: false },
  },
  duration: { type: String, enum: ["monthly", "annually", "both"], default: "both" },
  isActive: { type: Boolean, default: true },

});

// Compound unique index on name and duration
planSchema.index({ name: 1, duration: 1 }, { unique: true });

export default mongoose.model("Plan", planSchema);
