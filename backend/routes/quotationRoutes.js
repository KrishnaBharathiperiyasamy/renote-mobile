import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import multer from "multer";
import { downloadMultipleQuotationsXML, uploadQuotationXML } from "../utilis/exportXml.js";
import {
  getNextEstimateID,
  createQuotationForUser,
  updateQuotationForUser,
  getAllQuotations,
  getQuotationsByUserId,
  getQuotationById,
  downloadQuotation,
  deleteQuotations,
  deleteQuotation,
  toggleFavorite
} from "../controllers/quotationController.js";
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.get("/next-id", authMiddleware, getNextEstimateID);
router.get("/next-id/:userId", authMiddleware, getNextEstimateID);
router.post("/createQuotation", authMiddleware, createQuotationForUser);
router.post("/createQuotation/:userId", authMiddleware, createQuotationForUser);
router.put("/updateQuotation/:id", authMiddleware, updateQuotationForUser);
router.post("/updateQuotation/:id", authMiddleware, updateQuotationForUser);
router.patch('/getQuotations/:id/favorite', authMiddleware, toggleFavorite);
router.get("/download/:id", authMiddleware, downloadQuotation);
router.post("/download/xml", authMiddleware, downloadMultipleQuotationsXML);
router.post("/upload-xml/:userId", authMiddleware, upload.single("xmlFile"), uploadQuotationXML);
router.get("/getQuotation/:id", authMiddleware, getQuotationById);
router.get("/getQuotations", authMiddleware, getAllQuotations);
router.get("/getQuotations/:userId", authMiddleware, getQuotationsByUserId);
router.post("/deleteQuotation", authMiddleware, deleteQuotations);
router.delete("/deleteQuotation/:id", authMiddleware, deleteQuotation);
// router.delete("/clean", async (req, res) => {
//   try {
//     await Quotation.deleteMany({});
//     res.json({ message: "All quotations deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to delete quotations" });
//   }
// });

export default router; 