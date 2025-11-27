import { CategoryRepository } from "../../models/dynamodb/category-repository.js";

/**
 * Get all categories
 * @route GET /api/categories
 */
const getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryRepository.findAll();

    if (!categories.length) {
      return res.status(404).json({ message: "No categories found" });
    }

    // Format response data consistently
    const formattedCategories = categories.map((category) => ({
      categoryId: category.categoryId,
      name: category.name,
      description: category.description,
      slug: category.slug,
      createdAt: category.createdAt,
    }));

    res.status(200).json(formattedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

/**
 * Get a single category by ID
 * @route GET /api/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await CategoryRepository.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Format response data consistently
    const formattedCategory = {
      categoryId: category.categoryId,
      name: category.name,
      description: category.description,
      slug: category.slug,
      createdAt: category.createdAt,
    };

    res.status(200).json(formattedCategory);
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
};

export { getAllCategories, getCategoryById };
