import express from "express";
import {
    createShareableLink,
    toggleLike,
    addComment,
    getPosterInteractions,
    getSharedPosters,
    deleteMultipleShareableLinks,
    toggleCommentLike,
    updateShareableLink,
    getUserSharedLinks,
    replyToComment,
    revokeShareableLink,
    revokeMultipleShareableLinks,
    setCustomSlug,
    getLinkBySlug,
    redirectShortUrl,
} from "../controllers/linkController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/slug/:slug", getLinkBySlug);
router.patch("/shared/:token/slug", authMiddleware, setCustomSlug);
router.get("/s/:slug", redirectShortUrl);

router.post("/share-poster", authMiddleware, createShareableLink);
router.post("/shared/:token/:posterId/like", authMiddleware, toggleLike);
router.post("/shared/:token/:posterId/comment", authMiddleware, addComment);
router.get("/shared/:token/:posterId/interactions", getPosterInteractions);
router.get("/shared/:token", getSharedPosters);
router.patch("/shared/:token", authMiddleware, updateShareableLink);
router.patch("/shared/:token/revoke", authMiddleware, revokeShareableLink);
router.post("/shared/:token/revoke", authMiddleware, revokeShareableLink);
router.post("/delete-multiple", authMiddleware, deleteMultipleShareableLinks);
router.post("/revoke-multiple", authMiddleware, revokeMultipleShareableLinks);
router.post("/shared/:token/:posterId/comment/:commentId/like", authMiddleware, toggleCommentLike);
router.get("/user/:userId", authMiddleware, getUserSharedLinks);
router.post(
  "/:token/poster/:posterId/comment/:commentId/reply",
  replyToComment
);

export default router;
