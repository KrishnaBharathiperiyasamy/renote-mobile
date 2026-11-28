import crypto from "crypto";
import axios from "axios";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import client from "../utilis/twilio.js";
import { isApprovedEmail, UNAUTHORIZED_EMAIL_MESSAGE } from "../config/approvedEmails.js";

const AUTH_SERVICE_URL = (process.env.AUTH_SERVICE_BE_URL || "http://localhost:3004")
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/auth\/?$/, "");
const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
const PHONE_REGEX = /^\d{10}$/;

// In-memory sliding window rate-limiter for failed login attempts
// Key: ip:identifier -> { count, lockUntil }
const loginAttemptTracker = new Map();

function cleanPhoneNumber(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "").slice(-10);
}

function cleanGmail(email) {
  if (!email) return "";
  return String(email).trim().toLowerCase();
}

function isLockedOut(key) {
  const record = loginAttemptTracker.get(key);
  if (!record) return false;
  if (record.lockUntil && record.lockUntil > Date.now()) {
    return Math.ceil((record.lockUntil - Date.now()) / 1000);
  }
  if (record.lockUntil && record.lockUntil <= Date.now()) {
    loginAttemptTracker.delete(key);
  }
  return false;
}

function recordFailedAttempt(key) {
  const record = loginAttemptTracker.get(key) || { count: 0, lockUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockUntil = Date.now() + 5 * 60 * 1000; // 5 min lock
  }
  loginAttemptTracker.set(key, record);
  return record.count;
}

function resetFailedAttempts(key) {
  loginAttemptTracker.delete(key);
}

// Helper to safely send SMS
async function dispatchSmsOtp(phoneNumber, otp) {
  const formattedTo = `+91${phoneNumber}`;
  console.log(`[AUTH RECOVERY] Generated OTP for ${formattedTo}: ${otp}`);

  // 1. Try Twilio if credentials configured
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  ) {
    try {
      await client.messages.create({
        from: process.env.TWILIO_FROM_NUMBER,
        to: formattedTo,
        body: `Your ReNote verification OTP is ${otp}. It will expire in 5 minutes. Do not share this code with anyone.`,
      });
      console.log(`[AUTH RECOVERY] SMS dispatched via Twilio to ${formattedTo}`);
      return true;
    } catch (twilioErr) {
      console.warn(`[AUTH RECOVERY] Twilio dispatch notice:`, twilioErr.message);
    }
  }

  // 2. Try MSG91 if configured
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    try {
      await axios.post(
        "https://control.msg91.com/api/v5/otp",
        {
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: `91${phoneNumber}`,
          authkey: process.env.MSG91_AUTH_KEY,
          otp,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(`[AUTH RECOVERY] SMS dispatched via MSG91 to ${formattedTo}`);
      return true;
    } catch (msg91Err) {
      console.warn(`[AUTH RECOVERY] MSG91 dispatch notice:`, msg91Err.message);
    }
  }

  return false;
}

/**
 * 1. SECURE LOGIN
 * Allows user to log in with Email or Phone number (only 2 fields: Email/Phone + Password)
 * Validates against registered account and checks password against Auth Service
 */
export const loginSecure = async (req, res) => {
  try {
    const rawIdentifier = (req.body.identifier || req.body.emailOrPhone || req.body.email || req.body.phoneNumber || "").trim();
    const { password, appCode = "RENOTE" } = req.body;
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "ip";

    if (!rawIdentifier) {
      return res.status(400).json({
        success: false,
        message: "Email or phone number is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    const trackingKey = `${clientIp}:${rawIdentifier.toLowerCase()}`;

    // Rate-limiting check (5 failed attempts = 5 min lock)
    const lockSeconds = isLockedOut(trackingKey);
    if (lockSeconds) {
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Please wait ${lockSeconds} seconds before trying again.`,
      });
    }

    let user = null;
    let authIdentifier = "";

    if (rawIdentifier.includes("@")) {
      // Email login
      const cleanEmail = cleanGmail(rawIdentifier);
      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!EMAIL_REGEX.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
        });
      }

      if (!isApprovedEmail(cleanEmail)) {
        return res.status(403).json({
          success: false,
          message: UNAUTHORIZED_EMAIL_MESSAGE,
        });
      }

      user = await User.findOne({ email: cleanEmail, isDeleted: { $ne: true } });
      if (!user) {
        recordFailedAttempt(trackingKey);
        return res.status(401).json({
          success: false,
          message: "No registered account found with this email address.",
        });
      }
      authIdentifier = cleanEmail;
    } else {
      // Phone login: Must be 10 digits
      const cleanPhone = cleanPhoneNumber(rawIdentifier);
      if (!PHONE_REGEX.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit phone number.",
        });
      }

      user = await User.findOne({ phoneNumber: cleanPhone, isDeleted: { $ne: true } });
      if (!user) {
        recordFailedAttempt(trackingKey);
        return res.status(401).json({
          success: false,
          message: "No registered account found with this phone number.",
        });
      }
      if (!user.email || !isApprovedEmail(user.email)) {
        return res.status(403).json({
          success: false,
          message: UNAUTHORIZED_EMAIL_MESSAGE,
        });
      }
      authIdentifier = cleanPhone;
    }

    // Authenticate password with Auth Service
    let authServiceRes;
    try {
      authServiceRes = await axios.post(`${AUTH_SERVICE_URL}/auth/login`, {
        emailOrPhone: authIdentifier,
        password,
        appCode,
      });
    } catch (authErr) {
      // Try alternate identifier if available on the user document (phone <-> email)
      const fallbackIdentifier = authIdentifier === user.phoneNumber ? user.email : user.phoneNumber;
      let secondTrySuccess = false;
      if (fallbackIdentifier) {
        try {
          authServiceRes = await axios.post(`${AUTH_SERVICE_URL}/auth/login`, {
            emailOrPhone: fallbackIdentifier,
            password,
            appCode,
          });
          secondTrySuccess = true;
        } catch {
          /* ignore */
        }
      }

      if (!secondTrySuccess) {
        recordFailedAttempt(trackingKey);
        const data = authErr.response?.data;
        let errMsg = data?.message;
        if (Array.isArray(data?.errors) && data.errors.length > 0) {
          errMsg = data.errors.join(". ");
        } else if (Array.isArray(errMsg) && errMsg.length > 0) {
          errMsg = errMsg.join(". ");
        }
        if (!errMsg || errMsg === "Validation failed") {
          errMsg = "Incorrect password. Please try again.";
        }
        return res.status(401).json({
          success: false,
          message: errMsg,
        });
      }
    }

    // Login succeeded -> verify returned account possesses an approved email
    const authData = authServiceRes.data?.data;
    const authEmail = authData?.user?.email || user?.email;
    if (!authEmail || !isApprovedEmail(authEmail)) {
      return res.status(403).json({
        success: false,
        message: UNAUTHORIZED_EMAIL_MESSAGE,
      });
    }

    // Clear failure tracker
    resetFailedAttempts(trackingKey);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: authServiceRes.data?.data,
    });
  } catch (error) {
    console.error("Login secure error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during login. Please try again.",
      error: error.message,
    });
  }
};

/**
 * 2. FORGOT PASSWORD - REQUEST OTP
 * Supports Email or Phone identifier or both; validates registered account, enforces resend limits & expiry, sends OTP
 */
export const forgotPasswordRequestOtp = async (req, res) => {
  try {
    const rawIdentifier = (req.body.identifier || req.body.emailOrPhone || "").trim();
    const explicitPhone = req.body.phoneNumber ? cleanPhoneNumber(req.body.phoneNumber) : "";
    const explicitEmail = req.body.email ? cleanGmail(req.body.email) : "";

    let user = null;

    if (explicitEmail && explicitPhone) {
      if (!isApprovedEmail(explicitEmail)) {
        return res.status(403).json({
          success: false,
          message: UNAUTHORIZED_EMAIL_MESSAGE,
        });
      }
      user = await User.findOne({
        email: explicitEmail,
        phoneNumber: explicitPhone,
        isDeleted: { $ne: true },
      });
    } else if (rawIdentifier.includes("@") || explicitEmail) {
      const cleanEmail = cleanGmail(rawIdentifier || explicitEmail);
      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!EMAIL_REGEX.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
        });
      }
      if (!isApprovedEmail(cleanEmail)) {
        return res.status(403).json({
          success: false,
          message: UNAUTHORIZED_EMAIL_MESSAGE,
        });
      }
      user = await User.findOne({ email: cleanEmail, isDeleted: { $ne: true } });
    } else {
      const cleanPhone = cleanPhoneNumber(rawIdentifier || explicitPhone);
      if (!PHONE_REGEX.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit registered phone number.",
        });
      }
      user = await User.findOne({ phoneNumber: cleanPhone, isDeleted: { $ne: true } });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No registered account found with provided credentials.",
      });
    }

    const cleanEmail = user.email;
    const cleanPhone = user.phoneNumber;

    if (!cleanEmail || !isApprovedEmail(cleanEmail)) {
      return res.status(403).json({
        success: false,
        message: UNAUTHORIZED_EMAIL_MESSAGE,
      });
    }

    // Check existing OTP record for resend limits
    const existingOtp = await Otp.findOne({
      $or: [{ phoneNumber: cleanPhone }, { email: cleanEmail }],
    }).sort({ createdAt: -1 });

    const now = Date.now();

    if (existingOtp) {
      // 1. Resend cooldown: 60 seconds
      const elapsedSeconds = Math.floor((now - new Date(existingOtp.lastSentAt || existingOtp.createdAt).getTime()) / 1000);
      if (elapsedSeconds < 60) {
        const waitTime = 60 - elapsedSeconds;
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
          retryAfter: waitTime,
        });
      }

      // 2. Resend limit: Max 3 requests in 10 minutes
      const tenMinutesAgo = new Date(now - 10 * 60 * 1000);
      if (existingOtp.lastSentAt && existingOtp.lastSentAt > tenMinutesAgo && existingOtp.resendCount >= 3) {
        return res.status(429).json({
          success: false,
          message: "Maximum OTP request limit reached (3 requests). Please wait 10 minutes before trying again.",
          retryAfter: 600,
        });
      }
    }

    // Call Auth Service to trigger / record OTP for reset password flow
    let authServiceOtp = null;
    try {
      const authOtpRes = await axios.post(`${AUTH_SERVICE_URL}/otp/send`, {
        emailOrPhone: cleanPhone,
        type: "RESET_PASSWORD",
      });
      authServiceOtp = authOtpRes.data?.data?.otp || null;
    } catch (authErr) {
      console.warn("[AUTH RECOVERY] Auth service otp/send notice:", authErr.response?.data || authErr.message);
    }

    // Generate secure 6-digit OTP code (use auth service's if provided, or generate random)
    const otpCode = authServiceOtp || Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes validity
    const newResendCount = existingOtp && (now - new Date(existingOtp.lastSentAt).getTime() < 10 * 60 * 1000)
      ? (existingOtp.resendCount || 0) + 1
      : 1;

    // Upsert OTP record
    await Otp.findOneAndUpdate(
      { phoneNumber: cleanPhone },
      {
        phoneNumber: cleanPhone,
        email: cleanEmail,
        otp: otpCode,
        expiresAt,
        attempts: 0,
        resendCount: newResendCount,
        lastSentAt: new Date(now),
        verified: false,
        resetToken: null,
      },
      { upsert: true, new: true }
    );

    // Send SMS
    await dispatchSmsOtp(cleanPhone, otpCode);

    return res.status(200).json({
      success: true,
      message: `OTP has been sent to your registered phone number (+91 ******${cleanPhone.slice(-4)}).`,
      expiresInSeconds: 300,
      maskedPhone: `+91 ******${cleanPhone.slice(-4)}`,
      // For developer / test transparency in local environments
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otpCode } : {}),
    });
  } catch (error) {
    console.error("Forgot password request OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send recovery OTP. Please try again later.",
      error: error.message,
    });
  }
};

/**
 * 3. FORGOT PASSWORD - VERIFY OTP
 * Validates 6-digit OTP, protects against brute-force (max 5 attempts), checks expiry, issues reset token
 */
export const forgotPasswordVerifyOtp = async (req, res) => {
  try {
    const { email, phoneNumber, otp } = req.body;
    const cleanEmail = cleanGmail(email);
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    const cleanOtp = String(otp || "").trim();

    if (!cleanEmail || !isApprovedEmail(cleanEmail)) {
      return res.status(403).json({
        success: false,
        message: UNAUTHORIZED_EMAIL_MESSAGE,
      });
    }

    if (!cleanPhone || !cleanOtp || cleanOtp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "A valid 6-digit OTP is required.",
      });
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({
      phoneNumber: cleanPhone,
      email: cleanEmail,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "No active OTP request found. Please request a new OTP.",
      });
    }

    // Expiry check
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "This OTP has expired. Please request a new OTP.",
      });
    }

    // Repeated incorrect attempt protection (Max 5 attempts)
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. This OTP has been invalidated for security. Please request a new OTP.",
      });
    }

    // Verify OTP match
    const isMatch = otpRecord.otp === cleanOtp;

    if (!isMatch) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      await otpRecord.save();
      const remaining = Math.max(0, 5 - otpRecord.attempts);

      if (remaining === 0) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. This OTP has been invalidated. Please request a new OTP.",
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. You have ${remaining} attempt(s) remaining.`,
        remainingAttempts: remaining,
      });
    }

    // OTP matched and validated! Issue secure reset token valid for 10 minutes
    const resetToken = crypto.randomBytes(32).toString("hex");
    otpRecord.verified = true;
    otpRecord.resetToken = resetToken;
    otpRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes to complete password reset
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You may now set a new password.",
      resetToken,
    });
  } catch (error) {
    console.error("Forgot password verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again.",
      error: error.message,
    });
  }
};

/**
 * 4. FORGOT PASSWORD - RESET PASSWORD
 * Resets password using verified resetToken and delegates secure update to auth-service
 */
export const forgotPasswordResetPassword = async (req, res) => {
  try {
    const { email, phoneNumber, resetToken, newPassword } = req.body;
    const cleanEmail = cleanGmail(email);
    const cleanPhone = cleanPhoneNumber(phoneNumber);

    if (!cleanEmail || !isApprovedEmail(cleanEmail)) {
      return res.status(403).json({
        success: false,
        message: UNAUTHORIZED_EMAIL_MESSAGE,
      });
    }

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "Reset authorization token is missing. Please verify OTP first.",
      });
    }

    // Password strength validation: min 8 chars, uppercase, lowercase, number, special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!newPassword || !passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special character.",
      });
    }

    // Validate reset session in MongoDB Otp
    const otpRecord = await Otp.findOne({
      phoneNumber: cleanPhone,
      email: cleanEmail,
      resetToken,
      verified: true,
    });

    if (!otpRecord) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired password reset session. Please verify OTP again.",
      });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(403).json({
        success: false,
        message: "Password reset session has expired. Please verify OTP again.",
      });
    }

    // Call Auth Service to securely update the password in PostgreSQL
    let resetSucceeded = false;
    let authServiceMsg = "";

    try {
      const authResetRes = await axios.post(`${AUTH_SERVICE_URL}/auth/reset-password`, {
        emailOrPhone: cleanPhone,
        otp: otpRecord.otp,
        newPassword,
      });
      if (authResetRes.data?.success) {
        resetSucceeded = true;
      }
    } catch (authErr) {
      authServiceMsg = authErr.response?.data?.message || authErr.message;
      // If phone fails, retry with email
      try {
        const retryRes = await axios.post(`${AUTH_SERVICE_URL}/auth/reset-password`, {
          emailOrPhone: cleanEmail,
          otp: otpRecord.otp,
          newPassword,
        });
        if (retryRes.data?.success) {
          resetSucceeded = true;
        }
      } catch (retryErr) {
        console.warn("[AUTH RECOVERY] Auth service password reset retry failed:", retryErr.response?.data || retryErr.message);
      }
    }

    if (!resetSucceeded) {
      return res.status(400).json({
        success: false,
        message:
          (Array.isArray(authServiceMsg) ? authServiceMsg[0] : authServiceMsg) ||
          "Failed to reset password. Please verify your OTP and try again.",
      });
    }

    // Delete OTP record once reset is complete
    await Otp.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Forgot password reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password. Please try again.",
      error: error.message,
    });
  }
};
