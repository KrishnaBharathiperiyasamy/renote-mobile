// routes/syncRoutes.js
import express from "express";
import { syncLocalBackend, syncPosters, syncLocalInvoices } from "../controllers/syncController.js"
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/:userId", authMiddleware, syncLocalBackend);
router.post("/syncPosters/:userId", authMiddleware, syncPosters)
router.post("/syncInvoice/:userId", authMiddleware, syncLocalInvoices)

export default router;
