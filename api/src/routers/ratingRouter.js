import "dotenv/config";
import express from "express";
import authenticateToken from "../../middlewares/authenticateToken.js";
import authorizeRole from "../../middlewares/authorizeRole.js";
import {
  submitRating,
  getCourseRatings,
  getMyRating,
  deleteRating,
  getRatingStats,
  getInstructorRatings,
} from "../../controllers/dynamodb/ratingController.js";

const ratingRouter = express.Router();

// Submit or update a rating for a course (requires authentication)
ratingRouter.post(
  "/courses/:courseId/ratings",
  authenticateToken,
  submitRating
);

// Get all ratings for a course (public access)
ratingRouter.get("/courses/:courseId/ratings", getCourseRatings);

// Get current user's rating for a course (requires authentication)
ratingRouter.get(
  "/courses/:courseId/ratings/me",
  authenticateToken,
  getMyRating
);

// Delete user's rating for a course (requires authentication)
ratingRouter.delete(
  "/courses/:courseId/ratings",
  authenticateToken,
  deleteRating
);

// Get rating statistics for a course (public access)
ratingRouter.get("/courses/:courseId/ratings/stats", getRatingStats);

// Get ratings for instructor's courses (requires authentication and instructor role)
ratingRouter.get(
  "/instructor/ratings",
  authenticateToken,
  authorizeRole("instructor"),
  getInstructorRatings
);

export default ratingRouter;
