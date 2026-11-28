import express from "express";
import SystemSetting from "../models/SystemSetting.js";

const router = express.Router();

// GET /api/settings/gst-options — public, no auth needed
router.get("/gst-options", async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ key: "gst_options" });
    const defaults = [0, 5, 18, 40];
    res.json({ gstOptions: setting?.value || defaults });
  } catch (error) {
    res.status(500).json({ message: "Error fetching GST options" });
  }
});

export default router;
