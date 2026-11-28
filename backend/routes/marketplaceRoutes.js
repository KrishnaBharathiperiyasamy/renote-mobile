import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getMarketplaceFeed,
  getMarketplaceItemDetails,
  publishPosterToMarketplace,
  publishLinkPostersToMarketplace,
  likeMarketplaceItem,
  reactToMarketplaceItem,
  rateMarketplaceItem,
  getMarketplaceItemFeedback,
  togglePosterSold,
} from "../controllers/posterController.js";

const router = express.Router();

// Public Feed & Feedback routes
router.get("/feed", getMarketplaceFeed);
router.get("/item/:id", getMarketplaceItemDetails);
router.post("/item/:id/like", likeMarketplaceItem);
router.post("/item/:id/reaction", reactToMarketplaceItem);
router.post("/item/:id/rate", rateMarketplaceItem);
router.get("/item/:id/feedback", getMarketplaceItemFeedback);

// Protected routes
router.patch("/item/:id/sold", authMiddleware, togglePosterSold);
router.patch("/publish/:id", authMiddleware, publishPosterToMarketplace);
router.patch("/publish-link/:token", authMiddleware, publishLinkPostersToMarketplace);

export default router;
