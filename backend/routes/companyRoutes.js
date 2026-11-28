import express from "express";
import {
  createCompany, editCompany, deleteCompany, getAllCompaniesByUserId, createMultipleCompanies, deleteCustomerCompany
} from "../controllers/companyController.js";
import {
  initiateCompanyPanConsent,
  handlePanVerifyCallback,
  handlePanVerifyPostback,
  getCompanyPanVerificationStatus,
} from "../controllers/panVerificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import optionalAuth from "../middleware/optionalAuth.js";
import upload from "../middleware/companyUpload.js";
import Company from "../models/Company.js";
const router = express.Router();

router.post("/createCompany/:userId", authMiddleware, upload, createCompany);
router.post('/create-multiple/:userId', authMiddleware, createMultipleCompanies);
router.get("/getAllCompanies/:userId", optionalAuth, getAllCompaniesByUserId);
router.put("/editCompany/:id", authMiddleware, upload, editCompany);
router.delete("/deleteCompany/:id", deleteCustomerCompany);
router.delete("/deleteVendorCompany/:id", deleteCompany);
router.post("/pan-verify/initiate/:companyId/:userId", authMiddleware, initiateCompanyPanConsent);
router.post("/:companyId/pan/verify/initiate/:userId", authMiddleware, initiateCompanyPanConsent);
router.get("/pan-verify/status/:companyId/:userId", authMiddleware, getCompanyPanVerificationStatus);
router.get("/:companyId/pan/verify/status/:userId", authMiddleware, getCompanyPanVerificationStatus);
router.post("/pan/verify/callback", handlePanVerifyCallback);
router.post("/pan-verify/callback", handlePanVerifyCallback);
router.post("/pan/verify/postback", handlePanVerifyPostback);
router.post("/pan-verify/postback", handlePanVerifyPostback);
// router.delete("/clean", async (req, res) => {
//   try {
//     await Company.deleteMany({});
//     res.json({ message: "All quotations deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to delete quotations" });
//   }
// });
export default router;
