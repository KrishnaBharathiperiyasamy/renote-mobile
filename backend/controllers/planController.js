import Plan from "../models/Plan.js";

// GET /api/plans - Get all active plans
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    res.status(200).json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ message: "Error fetching plans", error: error.message });
  }
};
