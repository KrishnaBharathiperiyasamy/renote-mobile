import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
  planSlug: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["captured", "created", "failed", "refunded"], default: "created" },
  billing: { type: String, enum: ["monthly", "annual", "one_time", "unlimited"], default: "monthly" },
  method: { type: String, default: "razorpay" },
  razorpayPaymentId: { type: String },
  razorpayOrderId: { type: String },
  razorpaySignature: { type: String },
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
