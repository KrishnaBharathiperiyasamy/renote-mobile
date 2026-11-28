import express from "express";
import superAdminAuth from "../middleware/superAdminAuth.js";
import {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// Public route to fetch active categories
router.get("/", getCategories);

// SuperAdmin protected routes
router.get("/admin", superAdminAuth, getAllCategoriesAdmin);
router.post("/", superAdminAuth, createCategory);
router.put("/:id", superAdminAuth, updateCategory);
router.delete("/:id", superAdminAuth, deleteCategory);

export default router;
