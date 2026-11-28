import razorpay from "../utilis/razorpay.js";
import crypto from "crypto";
import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";
import User from "../models/User.js";
import { getUserPlan } from "../utilis/getUserPlan.js";

// POST /api/razorpay/create-subscription-session
export const createRazorpaySubscriptionSession = async (req, res) => {
  try {
    const userAuthId = req.user.authId;
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ message: "planId is required" });

    const user = await User.findOne({ authId: userAuthId, isDeleted: false });
    if (!user) return res.status(404).json({ message: "User not found" });

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) return res.status(404).json({ message: "Plan not found or inactive" });

    // You must create a Razorpay plan in the Razorpay dashboard and store its razorpayPlanId in your Plan model
    if (!plan.razorpayPlanId) return res.status(400).json({ message: "Razorpay plan not configured for this plan" });

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_notify: 1,
      total_count: 1, // 1 cycle for now
      // Optionally, add customer details
    });

    // Optionally, save the razorpay subscription id to the user or a temp collection for later verification

    res.json({ subscription });
  } catch (error) {
    console.error("Error creating Razorpay subscription session:", error);
    res.status(500).json({ message: "Error creating Razorpay subscription session", error: error.message });
  }
};

// POST /api/razorpay/verify-payment
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const userAuthId = req.user.authId;
    const { planId, razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
    if (!planId || !razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Payment is verified, now create the subscription in your DB
    const user = await User.findOne({ authId: userAuthId, isDeleted: false });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check for active subscription (same as createSubscription)
    const activeSub = await Subscription.findOne({ userId: user._id, isActive: true }).populate("planId");
    if (activeSub) {
      return res.status(400).json({
        message: "You already have an active subscription. Please cancel your current subscription before subscribing to a new plan.",
        activeSubscription: activeSub
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) return res.status(404).json({ message: "Plan not found or inactive" });

    // Calculate endDate based on plan duration
    let endDate = new Date();
    if (plan.duration === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.duration === "annually") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = new Subscription({
      userId: user._id,
      planId: plan._id,
      startDate: new Date(),
      endDate,
      isActive: true,
      renewalType: plan.duration,
      razorpaySubscriptionId: razorpay_subscription_id,
      razorpayPaymentId: razorpay_payment_id,
    });
    await subscription.save();
    res.status(201).json({ message: "Subscription created after payment", subscription });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({ message: "Error verifying Razorpay payment", error: error.message });
  }
};

// POST /api/subscription - Create a new subscription for the user
export const createSubscription = async (req, res) => {
  try {
    const userAuthId = req.user.authId;
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ message: "planId is required" });

    const user = await User.findOne({ authId: userAuthId, isDeleted: false });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check for active subscription
    const activeSub = await Subscription.findOne({ userId: user._id, isActive: true }).populate("planId");
    if (activeSub) {
      return res.status(400).json({
        message: "You already have an active subscription. Please cancel your current subscription before subscribing to a new plan.",
        activeSubscription: activeSub
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) return res.status(404).json({ message: "Plan not found or inactive" });

    // Calculate endDate based on plan duration
    let endDate = new Date();
    if (plan.duration === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.duration === "annually") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = new Subscription({
      userId: user._id,
      planId: plan._id,
      startDate: new Date(),
      endDate,
      isActive: true,
      renewalType: plan.duration,
    });
    await subscription.save();
    res.status(201).json({ message: "Subscription created", subscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Error creating subscription", error: error.message });
  }
};

// POST /api/subscription/cancel - Cancel the user's active subscription
export const cancelSubscription = async (req, res) => {
  try {
    const userAuthId = req.user.authId;
    const user = await User.findOne({ authId: userAuthId, isDeleted: false });
    if (!user) return res.status(404).json({ message: "User not found" });

    const activeSub = await Subscription.findOne({ userId: user._id, isActive: true });
    if (!activeSub) return res.status(400).json({ message: "No active subscription to cancel." });

    activeSub.isActive = false;
    await activeSub.save();
    res.status(200).json({ message: "Subscription cancelled successfully.", subscription: activeSub });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling subscription", error: error.message });
  }
};

// GET /api/subscription/history - Get all subscriptions for the user
export const getSubscriptionHistory = async (req, res) => {
  try {
    const userAuthId = req.user.authId;
    const user = await User.findOne({ authId: userAuthId, isDeleted: false });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get all subscriptions (history)
    const subs = await Subscription.find({ userId: user._id }).populate("planId").sort({ createdAt: -1 });

    // Get resolved plan from getUserPlan (handles admin@krishub.in, unlimited, active sub, or free)
    const resolvedPlan = await getUserPlan(user._id);

    // Find current active subscription
    let currentSub = await Subscription.findOne({ userId: user._id, isActive: true }).populate("planId");

    let currentPlanResponse = null;
    if (currentSub && currentSub.planId) {
      const planObj = currentSub.planId.toObject ? currentSub.planId.toObject() : currentSub.planId;
      currentPlanResponse = {
        ...currentSub.toObject(),
        planId: {
          ...planObj,
          name: resolvedPlan?.name || planObj.name,
          slug: resolvedPlan?.slug || planObj.slug,
          features: resolvedPlan?.features || planObj.features,
        }
      };
    } else if (resolvedPlan) {
      currentPlanResponse = {
        _id: `plan_${user._id}`,
        userId: user._id,
        planId: resolvedPlan,
        planSlug: resolvedPlan.slug || "unlimited",
        billing: resolvedPlan.slug === "unlimited" ? "unlimited" : "free",
        status: "active",
        isActive: true,
        currentPeriodStart: user.createdAt,
        currentPeriodEnd: resolvedPlan.slug === "unlimited" ? new Date("2099-12-31") : null,
      };
    }

    res.status(200).json({ currentPlan: currentPlanResponse, resolvedPlan, subscriptions: subs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching subscription history", error: error.message });
  }
};
