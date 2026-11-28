import express from "express";
import { requestOtp, verifyOtp, requestEmailOtp, verifyEmailOtp } from "../controllers/otpController.js";

const router = express.Router();

router.post("/request", requestOtp);
router.post("/verify", verifyOtp);
router.post("/request-email", requestEmailOtp);
router.post("/verify-email", verifyEmailOtp);

export default router;
