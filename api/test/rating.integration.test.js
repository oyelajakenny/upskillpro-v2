import request from "supertest";
import express from "express";
import bodyParser from "body-parser";
import {
  submitRating,
  getCourseRatings,
  getMyRating,
  deleteRating,
  getRatingStats,
} from "../controllers/dynamodb/ratingController.js";
import { RatingRepository } from "../models/dynamodb/rating-repository.js";
import { EnrollmentRepository } from "../models/dynamodb/enrollment-repository.js";
import { UserRepository } from "../models/dynamodb/user-repository.js";
import { CourseRepository } from "../models/dynamodb/course-repository.js";
import { v4 as uuidv4 } from "uuid";

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(bodyParser.json());

  // Mock authentication middleware
  app.use((req, res, next) => {
    if (req.headers.authorization) {
      req.user = { sub: req.headers["x-user-id"] || "test-user-id" };
    }
    next();
  });

  // Rating routes
  app.post("/api/courses/:courseId/ratings", submitRating);
  app.get("/api/courses/:courseId/ratings", getCourseRatings);
  app.get("/api/courses/:courseId/ratings/me", getMyRating);
  app.delete("/api/courses/:courseId/ratings", deleteRating);
  app.get("/api/courses/:courseId/ratings/stats", getRatingStats);

  return app;
};

describe("Rating Integration Tests", () => {
  let app;
  let testUserId;
  let testCourseId;
  let testInstructorId;

  beforeAll(async () => {
    app = createTestApp();
    testUserId = uuidv4();
    testCourseId = uuidv4();
    testInstructorId = uuidv4();

    // Create test user
    try {
      await UserRepository.create({
        userId: testUserId,
        name: "Test Student",
        email: `test-${testUserId}@example.com`,
        password: "hashedpassword",
        role: "student",
      });
    } catch (error) {
      console.log("Test user may already exist");
    }

    // Create test course
    try {
      await CourseRepository.create({
        courseId: testCourseId,
        instructorId: testInstructorId,
        title: "Test Course for Ratings",
        description: "A test course",
        price: 99.99,
        level: "beginner",
      });
    } catch (error) {
      console.log("Test course may already exist");
    }

    // Create enrollment
    try {
      await EnrollmentRepository.create({
        userId: testUserId,
        courseId: testCourseId,
      });
    } catch (error) {
      console.log("Enrollment may already exist");
    }
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await RatingRepository.delete(testUserId, testCourseId);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("POST /api/courses/:courseId/ratings - Submit Rating", () => {
    it("should create a new rating when user is enrolled", async () => {
      const response = await request(app)
        .post(`/api/courses/${testCourseId}/ratings`)
        .set("Authorization", "Bearer token")
        .set("x-user-id", testUserId)
        .send({
          rating: 5,
          review: "Excellent course!",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("userId", testUserId);
      expect(response.body).toHaveProperty("courseId", testCourseId);
      expect(response.body).toHaveProperty("rating", 5);
      expect(response.body).toHaveProperty("review", "Excellent course!");
    });

    it("should update existing rating", async () => {
      const response = await request(app)
        .post(`/api/courses/${testCourseId}/ratings`)
        .set("Authorization", "Bearer token")
        .set("x-user-id", testUserId)
        .send({
          rating: 4,
          review: "Updated review",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("rating", 4);
      expect(response.body).toHaveProperty("review", "Updated review");
    });

    it("should reject rating without enrollment", async () => {
      const unenrolledUserId = uuidv4();

      // Create user without enrollment
      try {
        await UserRepository.create({
          userId: unenrolledUserId,
          name: "Unenrolled User",
          email: `unenrolled-${unenrolledUserId}@example.com`,
          password: "hashedpassword",
          role: "student",
        });
      } catch (error) {
        // User may exist
      }

      const response = await request(app)
        .post(`/api/courses/${testCourseId}/ratings`)
        .set("Authorization", "Bearer token")
        .set("x-user-id", unenrolledUserId)
        .send({
          rating: 5,
          review: "Should not work",
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("code", "NOT_ENROLLED");
    });

    it("should reject invalid rating value", async () => {
      const response = await request(app)
        .post(`/api/courses/${testCourseId}/ratings`)
        .set("Authorization", "Bearer token")
        .set("x-user-id", testUserId)
        .send({
          rating: 6,
          review: "Invalid rating",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "INVALID_RATING");
    });

    it("should reject review exceeding 1000 characters", async () => {
      const longReview = "a".repeat(1001);

      const response = await request(app)
        .post(`/api/courses/${testCourseId}/ratings`)
        .set("Authorization", "Bearer token")
        .set("x-user-id", testUserId)
        .send({
          rating: 5,
          review: longReview,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "REVIEW_TOO_LONG");
    });
  });

  describe("GET /api/courses/:courseId/ratings - Get Course Ratings", () => {
    it("should return paginated ratings for a course", async () => {
      const response = await request(app)
        .get(`/api/courses/${testCourseId}/ratings`)
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("ratings");
      expect(Array.isArray(response.body.ratings)).toBe(true);
      expect(response.body).toHaveProperty("hasMore");
    });

    it("should return ratings with correct structure", async () => {
      const response = await request(app).get(
        `/api/courses/${testCourseId}/ratings`
      );

      expect(response.status).toBe(200);
      if (response.body.ratings.length > 0) {
        const rating = response.body.ratings[0];
        expect(rating).toHaveProperty("userId");
        expect(rating).toHaveProperty("userName");
        expect(rating).toHaveProperty("rating");
        expect(rating).toHaveProperty("review");
        expect(rating).toHaveProperty("createdAt");
      }
    });

    it("should reject invalid limit parameter", async () => {
      const response = await request(app)
        .get(`/api/courses/${testCourseId}/ratings`)
        .query({ limit: 100 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "INVALID_LIMIT");
    });
  });

  describe("GET /api/courses/:courseId/ratings/me - Get My Rating", () => {
    it("should return user's own rating", async () => {
      const response = await request(app)
        .get(`/api/courses/${testCourseId}/ratings/me`)
        .set("Authorization", "Bearer token")
        .set("x-user-id", testUserId);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("userId", testUserId);
      expect(response.body).toHaveProperty("courseId", testCourseId);
      expect(response.body).toHaveProperty("rating");
    });

    it("should return 404 if user has not rated", async () => {
      const newUserId = uuidv4();

      const response = await request(app)
        .get(`/api/courses/${testCourseId}/ratings/me`)
        .set("Authorization", "Bearer token")
        .set("x-user-id", newUserId);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("code", "RATING_NOT_FOUND");
    });
  });

  describe("GET /api/courses/:courseId/ratings/stats - Get Rating Stats", () => {
    it("should return rating statistics", async () => {
      const response = await request(app).get(
        `/api/courses/${testCourseId}/ratings/stats`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("averageRating");
      expect(response.body).toHaveProperty("ratingCount");
      expect(response.body).toHaveProperty("distribution");
      expect(response.body.distribution).toHaveProperty("1");
      expect(response.body.distribution).toHaveProperty("5");
    });

    it("should return zero stats for course with no ratings", async () => {
      const newCourseId = uuidv4();

      const response = await request(app).get(
        `/api/courses/${newCourseId}/ratings/stats`
      );

      expect(response.status).toBe(200);
      expect(response.body.averageRating).toBe(0);
      expect(response.body.ratingCount).toBe(0);
    });
  });

  describe("DELETE /api/courses/:courseId/ratings - Delete Rating", () => {
    it("should delete user's own rating", async () => {
      // First create a rating
      await request(app)
        .post(`/api/courses/${testCourseId}/ratings`)
        .set("Authorization", "Bearer token")
        .set("x-user-id", testUserId)
        .send({
          rating: 5,
          review: "To be deleted",
        });

      // Then delete it
      const response = await request(app)
        .delete(`/api/courses/${testCourseId}/ratings`)
        .set("Authorization", "Bearer token")
        .set("x-user-id", testUserId);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
    });

    it("should return 404 when deleting non-existent rating", async () => {
      const response = await request(app)
        .delete(`/api/courses/${testCourseId}/ratings`)
        .set("Authorization", "Bearer token")
        .set("x-user-id", testUserId);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("code", "RATING_NOT_FOUND");
    });
  });
});
