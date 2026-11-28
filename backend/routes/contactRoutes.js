import express from "express";
import { sendContactMessage } from "../controllers/contactController.js";

const router = express.Router();

router.post("/contactUs", sendContactMessage);

export default router;
