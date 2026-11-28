// routes/adminRoutes.ts
import express from "express";
import dotenv from "dotenv";
const router = express.Router();
dotenv.config()
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY

router.post("/verify-admin", (req, res) => {
  const { password } = req.body;
  if (!password) 
    return res.status(400).json({ success: false, message: "Password required" });
  if (password === ADMIN_SECRET) 
    return res.json({ success: true });
  return res.status(401).json({ success: false, message: "Invalid password" });
});

export default router;
