import request from "supertest";
import express from "express";
import bodyParser from "body-parser";
import {
  createCourse,
  getAllCourses,
} from "../controllers/dynamodb/courseController.js";
import { CategoryRepository } from "../models/dynamodb/category-repository.js";
import { CourseRepository } from "../models/dynamodb/course-repository.js";
import { UserRepository } from "../models/dynamodb/user-repository.js";
import { v4 as uuidv4 } from "uuid";

// Mock authentication middleware
const mockAuthMiddleware = (req, res, next) => {
  req.user = {
    sub: "test-instructor-id",
    role: "instructor",
  };
  next();
};

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(bodyParser.json());

  // Course routes with mock auth
  app.post("/api/courses", mockAuthMiddleware, createCourse);
  app.get("/api/courses", getAllCourses);

  return app;
};

describe("Course with Category Integration Tests", () => {
  let app;
  let testCategoryId;
  let testCategoryName;
  let testInstructorId;
  let createdCourseId;

  beforeAll(async () => {
    app = createTestApp();

    // Ensure categories exist
    try {
      const categories = await CategoryRepository.findAll();
      if (categories.length === 0) {
        await CategoryRepository.seedCategories();
      }
      const allCategories = await CategoryRepository.findAll();
      if (allCategories.length > 0) {
        testCategoryId = allCategories[0].categoryId;
        testCategoryName = allCategories[0].name;
      }

      // Create a test instructor if needed
      testInstructorId = "test-instructor-id";
      const existingInstructor =
        await UserRepository.findById(testInstructorId);
      if (!existingInstructor) {
        await UserRepository.create({
          userId: testInstructorId,
          name: "Test Instructor",
          email: "test@instructor.com",
          password: "hashedpassword",
          role: "instructor",
        });
      }
    } catch (error) {
      console.error("Setup error:", error);
    }
  });

  afterAll(async () => {
    // Clean up created test course
    if (createdCourseId) {
      try {
        // Note: You may need to implement a delete method or manually clean up
        // For now, we'll leave it as the test data
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    }
  });

  describe("POST /api/courses with categoryId", () => {
    it("should create a course with valid categoryId", async () => {
      const courseData = {
        title: "Test Course with Category",
        description: "A test course for category integration",
        price: 99,
        imageKey: "test-image.jpg",
        categoryId: testCategoryId,
      };

      const response = await request(app).post("/api/courses").send(courseData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("courseId");
      expect(response.body).toHaveProperty("categoryId", testCategoryId);
      expect(response.body).toHaveProperty("categoryName", testCategoryName);

      createdCourseId = response.body.courseId;
    });

    it("should return 400 for invalid categoryId", async () => {
      const courseData = {
        title: "Test Course with Invalid Category",
        description: "A test course with invalid category",
        price: 99,
        imageKey: "test-image.jpg",
        categoryId: uuidv4(), // Non-existent category
      };

      const response = await request(app).post("/api/courses").send(courseData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid category ID");
    });

    it("should create a course without categoryId", async () => {
      const courseData = {
        title: "Test Course without Category",
        description: "A test course without category",
        price: 49,
        imageKey: "test-image2.jpg",
      };

      const response = await request(app).post("/api/courses").send(courseData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("courseId");
      expect(response.body.categoryId).toBeUndefined();
    });
  });

  describe("GET /api/courses with category filtering", () => {
    it("should filter courses by categoryId", async () => {
      const response = await request(app)
        .get("/api/courses")
        .query({ categoryId: testCategoryId });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // All returned courses should have the specified categoryId
      response.body.forEach((course) => {
        expect(course.categoryId).toBe(testCategoryId);
      });
    });

    it("should return all courses when no categoryId is provided", async () => {
      const response = await request(app).get("/api/courses");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 404 when no courses exist in category", async () => {
      // Create a new category that has no courses
      const emptyCategory = await CategoryRepository.create({
        name: "Empty Test Category",
        description: "A category with no courses",
        slug: "empty-test-category",
      });

      const response = await request(app)
        .get("/api/courses")
        .query({ categoryId: emptyCategory.categoryId });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "No courses found");
    });
  });

  describe("Category validation in course operations", () => {
    it("should validate category exists before creating course", async () => {
      const courseData = {
        title: "Course with Non-existent Category",
        description: "Testing category validation",
        price: 79,
        imageKey: "test-image3.jpg",
        categoryId: "non-existent-category-id",
      };

      const response = await request(app).post("/api/courses").send(courseData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should include category information in course response", async () => {
      const response = await request(app)
        .get("/api/courses")
        .query({ categoryId: testCategoryId });

      if (response.status === 200 && response.body.length > 0) {
        const course = response.body[0];
        expect(course).toHaveProperty("categoryId");
        expect(course).toHaveProperty("categoryName");
      }
    });
  });
});
