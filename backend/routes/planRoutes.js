import express from "express";
import { getAllPlans } from "../controllers/planController.js";

const router = express.Router();

// GET /api/plans
router.get("/get-plans", getAllPlans);

export default router;
