import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: false, index: true },
    email: { type: String, required: false, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    resetToken: { type: String, default: null },
  },
  { timestamps: true }
);

// Auto-delete expired OTPs after 15 minutes of expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 900 });

export default mongoose.model("Otp", otpSchema);
