import express from "express";
import { createRazorpaySubscriptionSession, verifyRazorpayPayment } from "../controllers/subscriptionController.js";
import authenticate from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/razorpay/create-subscription-session
router.post("/create-subscription-session", authenticate, createRazorpaySubscriptionSession);

// POST /api/razorpay/verify-payment
router.post("/verify-payment", authenticate, verifyRazorpayPayment);

export default router;
