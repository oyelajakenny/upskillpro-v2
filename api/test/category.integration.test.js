import request from "supertest";
import express from "express";
import bodyParser from "body-parser";
import {
  getAllCategories,
  getCategoryById,
} from "../controllers/dynamodb/categoryController.js";
import { CategoryRepository } from "../models/dynamodb/category-repository.js";
import { CourseRepository } from "../models/dynamodb/course-repository.js";
import { v4 as uuidv4 } from "uuid";

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(bodyParser.json());

  // Category routes
  app.get("/api/categories", getAllCategories);
  app.get("/api/categories/:id", getCategoryById);

  return app;
};

describe("Category Integration Tests", () => {
  let app;
  let testCategoryId;

  beforeAll(async () => {
    app = createTestApp();

    // Seed categories if not already present
    try {
      const categories = await CategoryRepository.findAll();
      if (categories.length === 0) {
        await CategoryRepository.seedCategories();
      }
      // Get a test category ID
      const allCategories = await CategoryRepository.findAll();
      if (allCategories.length > 0) {
        testCategoryId = allCategories[0].categoryId;
      }
    } catch (error) {
      console.error("Setup error:", error);
    }
  });

  describe("GET /api/categories", () => {
    it("should return all categories with 200 status", async () => {
      const response = await request(app).get("/api/categories");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should return categories with correct structure", async () => {
      const response = await request(app).get("/api/categories");

      expect(response.status).toBe(200);
      const category = response.body[0];
      expect(category).toHaveProperty("id");
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("description");
      expect(category).toHaveProperty("slug");
      expect(category).toHaveProperty("createdAt");
    });
  });

  describe("GET /api/categories/:id", () => {
    it("should return a specific category with 200 status", async () => {
      const response = await request(app).get(
        `/api/categories/${testCategoryId}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", testCategoryId);
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("description");
    });

    it("should return 404 for non-existent category", async () => {
      const fakeId = uuidv4();
      const response = await request(app).get(`/api/categories/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Category not found");
    });
  });
});
