import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDevSession,
  getSession,
  refreshUserToken,
  logoutUser,
} from "../controllers/userController.js";
import {
  loginSecure,
  forgotPasswordRequestOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordResetPassword,
} from "../controllers/authFlowController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import userMiddleware from "../middleware/UserMiddleware.js";
import User from "../models/User.js";
const router = express.Router();

// Secure Auth & Recovery Routes
router.post("/login-secure", loginSecure);
router.post("/forgot-password/request-otp", forgotPasswordRequestOtp);
router.post("/forgot-password/verify-otp", forgotPasswordVerifyOtp);
router.post("/forgot-password/reset-password", forgotPasswordResetPassword);

// Session, Refresh & Logout Routes
router.get("/session", authMiddleware, getSession);
router.post("/refresh-token", refreshUserToken);
router.post("/logout", logoutUser);
router.get("/dev-session", getDevSession);
// Define the route for creating a user
router.post("/create-user", userMiddleware, createUser);
router.get("/me", authMiddleware, getUserById);
router.get("/profile", authMiddleware, getUserById);
router.get("/check-user/:authId", authMiddleware, getUserById);
router.get("/get-users", getAllUsers);
router.get("/get-users/:id", authMiddleware, getUserById);
router.post("/update-user", authMiddleware, updateUser);
router.post("/update-user/:id", authMiddleware, updateUser);
router.put("/update-user/:id", authMiddleware, updateUser);
router.patch("/update-user/:id", authMiddleware, updateUser);
router.delete("/delete-users/:id",authMiddleware, deleteUser);
// router.delete("/clean", async (req, res) => {
//   try {
//     await User.deleteMany({});
//     res.json({ message: "All quotations deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to delete quotations" });
//   }
// });

export default router; 
