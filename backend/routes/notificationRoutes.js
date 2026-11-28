import express from "express";
import Notification from "../models/Notification.js";            
import {
  getUserNotifications,
  markAsRead,
  clearNotifications,
  checkSystemNotifications
} from "../controllers/notificationController.js";

import { resolveUserMongoId } from "../utils/resolveUser.js";

const router = express.Router();
router.get("/notifications/:userId", getUserNotifications);
router.patch("/notifications/mark/:id", markAsRead);
router.delete("/notifications/clear/:userId", clearNotifications);
router.post("/system/:userId", checkSystemNotifications);
router.get("/count/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.json({ count: 0 });

    const targetUserId = await resolveUserMongoId(userId, req.user);
    if (!targetUserId) {
      return res.json({ count: 0 });
    }

    const count = await Notification.countDocuments({ 
      userId: targetUserId, 
      isRead: false 
    });

    res.json({ count: count || 0 });
  } catch (error) {
    console.warn("Could not retrieve notification count:", error?.message);
    res.json({ count: 0 });
  }
});

export default router;