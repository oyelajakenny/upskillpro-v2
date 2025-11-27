import { RatingRepository } from "../../models/dynamodb/rating-repository.js";
import { CourseRepository } from "../../models/dynamodb/course-repository.js";
import { EnrollmentRepository } from "../../models/dynamodb/enrollment-repository.js";
import { UserRepository } from "../../models/dynamodb/user-repository.js";
import {
  validateRating,
  validateReview,
  validateCourseId,
  validateUserId,
  sanitizeReview,
} from "../../utils/validation.js";

/**
 * Submit a rating for a course (create or update)
 * POST /api/courses/:courseId/ratings
 */
const submitRating = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { courseId } = req.params;
    const { rating, review } = req.body;

    // Validate user ID
    const userIdValidation = validateUserId(userId);
    if (!userIdValidation.isValid) {
      return res.status(400).json({
        error: userIdValidation.error,
        code: userIdValidation.code,
      });
    }

    // Validate course ID
    const courseIdValidation = validateCourseId(courseId);
    if (!courseIdValidation.isValid) {
      return res.status(400).json({
        error: courseIdValidation.error,
        code: courseIdValidation.code,
      });
    }

    // Validate rating value (1-5)
    const ratingValidation = validateRating(rating);
    if (!ratingValidation.isValid) {
      return res.status(400).json({
        error: ratingValidation.error,
        code: ratingValidation.code,
      });
    }

    // Validate review length (max 1000 characters)
    const reviewValidation = validateReview(review);
    if (!reviewValidation.isValid) {
      return res.status(400).json({
        error: reviewValidation.error,
        code: reviewValidation.code,
      });
    }

    // Sanitize review text
    const sanitizedReview = sanitizeReview(review);

    // Verify user enrollment
    const enrollment = await EnrollmentRepository.findByUserAndCourse(
      userId,
      courseId
    );
    if (!enrollment) {
      return res.status(403).json({
        error: "You must be enrolled in this course to rate it",
        code: "NOT_ENROLLED",
      });
    }

    // Get user information for userName
    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Check if rating already exists (upsert logic)
    const existingRating = await RatingRepository.findByUserAndCourse(
      userId,
      courseId
    );

    let ratingItem;
    if (existingRating) {
      // Update existing rating - verify ownership (already verified by userId match)
      ratingItem = await RatingRepository.update(userId, courseId, {
        rating,
        review: sanitizedReview,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Create new rating
      ratingItem = await RatingRepository.create({
        userId,
        courseId,
        rating,
        review: sanitizedReview,
        userName: user.name,
        createdAt: new Date().toISOString(),
      });
    }

    // Update course aggregates
    try {
      const aggregates = await RatingRepository.calculateAggregates(courseId);
      const distribution =
        await RatingRepository.getRatingDistribution(courseId);

      await CourseRepository.updateRatingAggregates(courseId, {
        averageRating: aggregates.averageRating,
        ratingCount: aggregates.ratingCount,
        ratingDistribution: distribution,
      });
    } catch (aggregateError) {
      console.error("Error updating course aggregates:", aggregateError);
      // Continue - eventual consistency is acceptable
    }

    res.status(existingRating ? 200 : 201).json({
      userId: ratingItem.userId,
      courseId: ratingItem.courseId,
      rating: ratingItem.rating,
      review: ratingItem.review,
      createdAt: ratingItem.createdAt,
      updatedAt: ratingItem.updatedAt,
    });
  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({
      error: "An error occurred while submitting the rating",
      code: "INTERNAL_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get all ratings for a course with pagination
 * GET /api/courses/:courseId/ratings
 */
const getCourseRatings = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate course ID
    const courseIdValidation = validateCourseId(courseId);
    if (!courseIdValidation.isValid) {
      return res.status(400).json({
        error: courseIdValidation.error,
        code: courseIdValidation.code,
      });
    }

    // Validate and sanitize limit parameter
    const limitParam = parseInt(req.query.limit) || 10;
    if (limitParam < 1 || limitParam > 50) {
      return res.status(400).json({
        error: "Limit must be between 1 and 50",
        code: "INVALID_LIMIT",
      });
    }
    const limit = Math.min(limitParam, 50);

    // Parse pagination token
    let lastKey = null;
    if (req.query.lastKey) {
      try {
        lastKey = JSON.parse(
          Buffer.from(req.query.lastKey, "base64").toString()
        );
      } catch (parseError) {
        return res.status(400).json({
          error: "Invalid pagination token",
          code: "INVALID_PAGINATION_TOKEN",
        });
      }
    }

    const result = await RatingRepository.findByCourse(courseId, {
      limit,
      lastEvaluatedKey: lastKey,
    });

    const ratings = result.ratings.map((rating) => ({
      userId: rating.userId,
      userName: rating.userName,
      rating: rating.rating,
      review: rating.review,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    }));

    const response = {
      ratings,
      hasMore: result.hasMore,
    };

    if (result.lastEvaluatedKey) {
      response.lastEvaluatedKey = Buffer.from(
        JSON.stringify(result.lastEvaluatedKey)
      ).toString("base64");
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching course ratings:", error);
    res.status(500).json({
      error: "An error occurred while fetching ratings",
      code: "INTERNAL_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get current user's rating for a course
 * GET /api/courses/:courseId/ratings/me
 */
const getMyRating = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { courseId } = req.params;

    // Validate user ID
    const userIdValidation = validateUserId(userId);
    if (!userIdValidation.isValid) {
      return res.status(400).json({
        error: userIdValidation.error,
        code: userIdValidation.code,
      });
    }

    // Validate course ID
    const courseIdValidation = validateCourseId(courseId);
    if (!courseIdValidation.isValid) {
      return res.status(400).json({
        error: courseIdValidation.error,
        code: courseIdValidation.code,
      });
    }

    const rating = await RatingRepository.findByUserAndCourse(userId, courseId);

    if (!rating) {
      return res.status(404).json({
        error: "Rating not found",
        code: "RATING_NOT_FOUND",
      });
    }

    res.status(200).json({
      userId: rating.userId,
      courseId: rating.courseId,
      rating: rating.rating,
      review: rating.review,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching user rating:", error);
    res.status(500).json({
      error: "An error occurred while fetching your rating",
      code: "INTERNAL_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Delete user's rating for a course
 * DELETE /api/courses/:courseId/ratings
 */
const deleteRating = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { courseId } = req.params;

    // Validate user ID
    const userIdValidation = validateUserId(userId);
    if (!userIdValidation.isValid) {
      return res.status(400).json({
        error: userIdValidation.error,
        code: userIdValidation.code,
      });
    }

    // Validate course ID
    const courseIdValidation = validateCourseId(courseId);
    if (!courseIdValidation.isValid) {
      return res.status(400).json({
        error: courseIdValidation.error,
        code: courseIdValidation.code,
      });
    }

    // Verify rating exists and belongs to user
    const rating = await RatingRepository.findByUserAndCourse(userId, courseId);

    if (!rating) {
      return res.status(404).json({
        error: "Rating not found",
        code: "RATING_NOT_FOUND",
      });
    }

    // Verify ownership (rating userId should match authenticated user)
    if (rating.userId !== userId) {
      return res.status(403).json({
        error: "You can only delete your own ratings",
        code: "UNAUTHORIZED",
      });
    }

    // Delete the rating
    await RatingRepository.delete(userId, courseId);

    // Recalculate course aggregates
    try {
      const aggregates = await RatingRepository.calculateAggregates(courseId);
      const distribution =
        await RatingRepository.getRatingDistribution(courseId);

      await CourseRepository.updateRatingAggregates(courseId, {
        averageRating: aggregates.averageRating,
        ratingCount: aggregates.ratingCount,
        ratingDistribution: distribution,
      });
    } catch (aggregateError) {
      console.error("Error updating course aggregates:", aggregateError);
      // Continue - eventual consistency is acceptable
    }

    res.status(200).json({
      message: "Rating deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting rating:", error);
    res.status(500).json({
      error: "An error occurred while deleting the rating",
      code: "INTERNAL_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get rating statistics for a course
 * GET /api/courses/:courseId/ratings/stats
 */
const getRatingStats = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate course ID
    const courseIdValidation = validateCourseId(courseId);
    if (!courseIdValidation.isValid) {
      return res.status(400).json({
        error: courseIdValidation.error,
        code: courseIdValidation.code,
      });
    }

    const aggregates = await RatingRepository.calculateAggregates(courseId);
    const distribution = await RatingRepository.getRatingDistribution(courseId);

    res.status(200).json({
      averageRating: aggregates.averageRating,
      ratingCount: aggregates.ratingCount,
      distribution,
    });
  } catch (error) {
    console.error("Error fetching rating stats:", error);
    res.status(500).json({
      error: "An error occurred while fetching rating statistics",
      code: "INTERNAL_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get ratings for instructor's courses
 * GET /api/instructor/ratings
 */
const getInstructorRatings = async (req, res) => {
  try {
    const instructorId = req.user.sub;
    const { courseId } = req.query;

    // Validate instructor ID
    const instructorIdValidation = validateUserId(instructorId);
    if (!instructorIdValidation.isValid) {
      return res.status(400).json({
        error: instructorIdValidation.error,
        code: instructorIdValidation.code,
      });
    }

    // Validate courseId if provided
    if (courseId) {
      const courseIdValidation = validateCourseId(courseId);
      if (!courseIdValidation.isValid) {
        return res.status(400).json({
          error: courseIdValidation.error,
          code: courseIdValidation.code,
        });
      }
    }

    // Verify user is an instructor
    const user = await UserRepository.findById(instructorId);
    if (!user || user.role !== "instructor") {
      return res.status(403).json({
        error: "Access denied. Instructor role required.",
        code: "FORBIDDEN",
      });
    }

    // Get instructor's courses
    let courses = await CourseRepository.findByInstructor(instructorId);

    // Filter by courseId if provided
    if (courseId) {
      courses = courses.filter((course) => course.courseId === courseId);
    }

    if (courses.length === 0) {
      return res.status(404).json({
        error: "No courses found",
        code: "NO_COURSES",
      });
    }

    // Get rating data for each course
    const coursesWithRatings = await Promise.all(
      courses.map(async (course) => {
        const aggregates = await RatingRepository.calculateAggregates(
          course.courseId
        );
        const distribution = await RatingRepository.getRatingDistribution(
          course.courseId
        );

        // Get recent reviews (limit 5)
        const recentReviewsResult = await RatingRepository.findByCourse(
          course.courseId,
          { limit: 5 }
        );

        const recentReviews = recentReviewsResult.ratings
          .filter((r) => r.review && r.review.trim() !== "")
          .map((r) => ({
            userName: r.userName,
            rating: r.rating,
            review: r.review,
            createdAt: r.createdAt,
          }));

        return {
          courseId: course.courseId,
          courseTitle: course.title,
          averageRating: aggregates.averageRating,
          ratingCount: aggregates.ratingCount,
          distribution,
          recentReviews,
        };
      })
    );

    res.status(200).json({
      courses: coursesWithRatings,
    });
  } catch (error) {
    console.error("Error fetching instructor ratings:", error);
    res.status(500).json({
      error: "An error occurred while fetching instructor ratings",
      code: "INTERNAL_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export {
  submitRating,
  getCourseRatings,
  getMyRating,
  deleteRating,
  getRatingStats,
  getInstructorRatings,
};
