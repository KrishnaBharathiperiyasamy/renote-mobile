import express from "express";
import { createSubscription, cancelSubscription, getSubscriptionHistory } from "../controllers/subscriptionController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/subscription
router.post("/create", authMiddleware, createSubscription);

// POST /api/subscription/cancel
router.post("/cancel", authMiddleware, cancelSubscription);

// GET /api/subscription/history
router.get("/history", authMiddleware, getSubscriptionHistory);

export default router;
