import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
  planSlug: { type: String, default: "free" },
  billing: { type: String, default: "monthly" },
  status: { type: String, enum: ["active", "pending", "cancelled", "expired", "halted"], default: "active" },
  isActive: { type: Boolean, default: true },
  isTrial: { type: Boolean, default: false },
  trialDurationMonths: { type: Number },
  grantedBy: { type: String },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  currentPeriodStart: { type: Date, default: Date.now },
  currentPeriodEnd: { type: Date },
  cancelledAt: { type: Date },
  renewalType: { type: String, default: "monthly" },
  razorpaySubscriptionId: { type: String },
  razorpayCustomerId: { type: String },
  razorpayPaymentId: { type: String },
}, { timestamps: true, strict: false });

export default mongoose.model("Subscription", subscriptionSchema);
