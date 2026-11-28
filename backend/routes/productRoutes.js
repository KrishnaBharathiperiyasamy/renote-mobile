// routes/productRoutes.js
import express from "express";
import multer from "multer";
import { downloadMultipleProductsXML, uploadProductXML } from "../utilis/exportXml.js";
import { createProduct, updateProduct, getProductsByUserId, deleteMultipleProducts, NewSuggestions, uploadBulkProducts, extractProductsFromPDF, toggleProductFavorite } from "../controllers/productController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import optionalAuth from "../middleware/optionalAuth.js";
import { ensureDir, resolveUploadPath } from "../utils/uploadPaths.js";

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ensureDir(resolveUploadPath())),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// POST /products/:userId
router.post("/create/:userId", authMiddleware, createProduct);
router.post("/update/:productId", authMiddleware, updateProduct);
router.get("/get/:userId", optionalAuth, getProductsByUserId);
router.patch('/getProduct/:id/favorite', authMiddleware, toggleProductFavorite);
router.post("/newSuggestions", optionalAuth, NewSuggestions);
router.post("/download-xml", authMiddleware,downloadMultipleProductsXML);
router.post("/delete", authMiddleware, deleteMultipleProducts);
router.post("/upload-xml/:userId", authMiddleware, upload.single("file"), uploadProductXML);
router.post("/bulk/:userId", authMiddleware, upload.single("file"), uploadBulkProducts);
router.post("/extract", authMiddleware, upload.single("file"), extractProductsFromPDF);

export default router;
