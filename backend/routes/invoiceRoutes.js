import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import multer from "multer";
import { uploadInvoiceXML, downloadMultipleInvoicesXML } from "../utilis/exportXml.js";
import { getNextInvoiceID, createInvoiceForUser, updateInvoiceForUser, getInvoicesForUser, deleteInvoices, toggleInvoiceFavorite, downloadInvoice } from "../controllers/invoiceController.js";
import optionalAuth from "../middleware/optionalAuth.js";
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/next-id/:userId", optionalAuth, getNextInvoiceID);
router.post("/createInvoice/:userId", optionalAuth, createInvoiceForUser);
router.put("/updateInvoice/:id", authMiddleware, updateInvoiceForUser);
router.post("/download/xml", authMiddleware, downloadMultipleInvoicesXML);
router.post("/upload-xml/:userId", authMiddleware, upload.single("xmlFile"), uploadInvoiceXML);
router.patch('/getInvoice/:id/favorite', optionalAuth, toggleInvoiceFavorite);
router.get("/invoice/download/:id", optionalAuth, downloadInvoice);
router.get("/getInvoiceByUser/:userId", optionalAuth, getInvoicesForUser);
router.post("/deleteInvoices", optionalAuth, deleteInvoices);
router.delete("/deleteInvoice/:id", authMiddleware, deleteInvoices);
router.delete("/deleteInvoices", authMiddleware, deleteInvoices);
// router.delete("/clean", async (req, res) => {
//     try {
//         await Invoice.deleteMany({});
//         res.json({ message: "All quotations deleted successfully" });
//     } catch (error) {
//         res.status(500).json({ error: "Failed to delete quotations" });
//     }
// });

export default router; 