import Otp from "../models/Otp.js";
import nodemailer from "nodemailer";
import client from "../utilis/twilio.js";
import { isApprovedEmail, UNAUTHORIZED_EMAIL_MESSAGE } from "../config/approvedEmails.js";

// export const requestOtp = async (req, res) => {
//   try {
//     const { phoneNumber } = req.body;
//     if (!phoneNumber)
//       return res.status(400).json({ success: false, message: "Phone number is required" });

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins validity

//     // Save OTP (replace old one if exists)
//     await Otp.findOneAndUpdate(
//       { phoneNumber },
//       { otp, expiresAt },
//       { upsert: true, new: true }
//     );

//     // Send via WhatsApp or SMS
//     const useWhatsApp = phoneNumber.startsWith("whatsapp:");
//     const fromNumber = useWhatsApp
//       ? process.env.TWILIO_WHATSAPP_NUMBER
//       : process.env.TWILIO_FROM_NUMBER;

//     const formattedTo = useWhatsApp
//       ? phoneNumber
//       : `+${phoneNumber.replace(/\D/g, "")}`; // clean up to E.164

//     await client.messages.create({
//       from: fromNumber,
//       to: formattedTo,
//       body: `Your OTP for verification is ${otp}. It will expire in 5 minutes.`,
//     });

//     return res.json({ success: true, message: "OTP sent successfully!" });
//   } catch (error) {
//     console.error("OTP send error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to send OTP",
//       error: error.message,
//     });
//   }
// };


export const requestOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber)
      return res.status(400).json({ success: false, message: "Phone number is required" });

    // Hardcoded OTP
    const otp = "123456";
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins validity

    // Save OTP (replace old one if exists)
    await Otp.findOneAndUpdate(
      { phoneNumber },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Skip Twilio entirely
    return res.json({ success: true, message: `OTP stored successfully! OTP is ${otp}` });
  } catch (error) {
    console.error("OTP store error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to store OTP",
      error: error.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp)
      return res.status(400).json({ success: false, message: "Phone and OTP required" });

    const record = await Otp.findOne({ phoneNumber });
    if (!record)
      return res.status(400).json({ success: false, message: "OTP not found or expired" });

    if (record.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    await Otp.deleteOne({ phoneNumber }); // remove OTP after successful verification

    return res.json({ success: true, message: "OTP verified successfully!" });
  } catch (error) {
    console.error("OTP verify error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
};

export const requestEmailOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required" });

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isApprovedEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: UNAUTHORIZED_EMAIL_MESSAGE,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins validity

    // Save OTP in DB (replace old one if exists)
    await Otp.findOneAndUpdate(
      { email: cleanEmail },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send OTP via SMTP
    const host = process.env.SMTP_HOST || "smtp.titan.email";
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE !== undefined ? String(process.env.SMTP_SECURE) === "true" : port === 465;
    const fromName = process.env.SMTP_FROM_NAME || "Verification";
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: cleanEmail,
      subject: "Your OTP Code",
      text: `Your OTP for verification is ${otp}. It will expire in 5 minutes.`,
    });

    return res.json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Email OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!isApprovedEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: UNAUTHORIZED_EMAIL_MESSAGE,
      });
    }

    // Find OTP record by email
    const record = await Otp.findOne({ email: cleanEmail });
    if (!record) {
      return res.status(400).json({ success: false, message: "OTP not found or expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Delete OTP after successful verification
    await Otp.deleteOne({ email: cleanEmail });

    return res.json({ success: true, message: "OTP verified successfully!" });
  } catch (error) {
    console.error("Email OTP verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
};
