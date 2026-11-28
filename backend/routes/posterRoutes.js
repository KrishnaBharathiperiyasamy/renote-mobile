import express from "express";
import posterUpload from "../middleware/posterUpload.js";
import authMiddleware from "../middleware/authMiddleware.js";
import optionalAuth from "../middleware/optionalAuth.js";
import attachPosterUpdateContext from "../middleware/posterUpdateContext.js";
import { downloadPosterWithVideo, clearVideoCache, prerenderPosterVideo } from "../utilis/generatePoster.js";
import tempUpload from "../middleware/tempUpload.js";
import {
  getNextPosterId,
  createPoster,
  updatePoster,
  duplicatePoster,
  getPostersByUser,
  getPosterById,
  deletePoster,
  toggleFavorite,
  getUserTags,
  uploadPostersFromZip,
  downloadPostersAsZip,
  compressMediaTemp,
  togglePosterSold
} from "../controllers/posterController.js";
import multer from "multer";
import { ensureDir, resolveUploadPath } from "../utils/uploadPaths.js";

const router = express.Router();
const upload = multer({ dest: ensureDir(resolveUploadPath("tmp_zip")) });

router.post("/import", authMiddleware, upload.single("zipFile"), uploadPostersFromZip);
router.post("/createPoster/:userId", authMiddleware, posterUpload, createPoster);
router.post("/duplicate/:id", optionalAuth, duplicatePoster);
router.post("/uploadTempVideo", authMiddleware, optionalAuth, tempUpload, compressMediaTemp);
router.post("/renderVideo", authMiddleware, downloadPosterWithVideo);
router.post("/prerenderVideo", authMiddleware, prerenderPosterVideo);
router.delete("/clearVideoCache/:poster_id", authMiddleware, clearVideoCache);
router.get("/tags/:userId", optionalAuth, getUserTags);
router.put("/updatePoster/:id", authMiddleware, attachPosterUpdateContext, posterUpload, updatePoster);
router.post("/export", authMiddleware, downloadPostersAsZip);
router.post("/:id/favorite", optionalAuth, toggleFavorite);
router.patch("/:id/sold", authMiddleware, togglePosterSold);
router.get("/next-poster-id/:userId", optionalAuth, getNextPosterId);
router.get("/getPoster/:userId", optionalAuth, getPostersByUser);
router.get("/:id", optionalAuth, getPosterById);
router.post("/deletePoster", authMiddleware, deletePoster);
router.delete("/deletePoster/:id", authMiddleware, deletePoster);
router.delete("/deletePoster", authMiddleware, deletePoster);
// router.delete("/clean", async (req, res) => {
//   try {
//     await Poster.deleteMany({});
//     res.json({ message: "All quotations deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to delete quotations" });
//   }
// });

export default router;
