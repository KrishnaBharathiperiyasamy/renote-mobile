import Category from "../models/Category.js";

// GET /api/categories - Public: Get all active categories with subcategories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};

// GET /api/categories/admin - SuperAdmin: Get all categories (including inactive)
export const getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ order: 1, name: 1 });
    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories for admin:", error);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};

// POST /api/categories - SuperAdmin: Create new Category
export const createCategory = async (req, res) => {
  try {
    const { name, icon, subcategories, order, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const category = new Category({
      name: name.trim(),
      icon: icon || "Sparkles",
      subcategories: Array.isArray(subcategories)
        ? subcategories.map((s) => s.trim()).filter(Boolean)
        : [],
      order: Number(order) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ success: false, message: "Failed to create category" });
  }
};

// PUT /api/categories/:id - SuperAdmin: Update Category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, subcategories, order, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (name && name.trim() !== category.name) {
      const existing = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ success: false, message: "Another category with this name already exists" });
      }
      category.name = name.trim();
    }

    if (icon !== undefined) category.icon = icon;
    if (subcategories !== undefined && Array.isArray(subcategories)) {
      category.subcategories = subcategories.map((s) => s.trim()).filter(Boolean);
    }
    if (order !== undefined) category.order = Number(order);
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ success: false, message: "Failed to update category" });
  }
};

// DELETE /api/categories/:id - SuperAdmin: Delete Category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, message: "Failed to delete category" });
  }
};
