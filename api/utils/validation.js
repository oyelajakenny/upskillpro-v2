/**
 * Validation utility functions for rating system and user management
 */

import { VALID_ROLES, isValidRole } from "./constants.js";

/**
 * Validate rating value
 * @param {*} rating - Rating value to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateRating(rating) {
  if (rating === undefined || rating === null) {
    return {
      isValid: false,
      error: "Rating is required",
      code: "RATING_REQUIRED",
    };
  }

  if (!Number.isInteger(rating)) {
    return {
      isValid: false,
      error: "Rating must be an integer",
      code: "INVALID_RATING_TYPE",
    };
  }

  if (rating < 1 || rating > 5) {
    return {
      isValid: false,
      error: "Rating must be between 1 and 5",
      code: "INVALID_RATING",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate review text
 * @param {*} review - Review text to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateReview(review) {
  // Review is optional, so null/undefined is valid
  if (review === null || review === undefined || review === "") {
    return { isValid: true, error: null };
  }

  if (typeof review !== "string") {
    return {
      isValid: false,
      error: "Review must be a string",
      code: "INVALID_REVIEW_TYPE",
    };
  }

  if (review.length > 1000) {
    return {
      isValid: false,
      error: "Review must not exceed 1000 characters",
      code: "REVIEW_TOO_LONG",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate course ID format
 * @param {*} courseId - Course ID to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateCourseId(courseId) {
  if (!courseId || typeof courseId !== "string") {
    return {
      isValid: false,
      error: "Invalid course ID",
      code: "INVALID_COURSE_ID",
    };
  }

  // Basic UUID format validation (optional but recommended)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(courseId)) {
    return {
      isValid: false,
      error: "Invalid course ID format",
      code: "INVALID_COURSE_ID_FORMAT",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate user ID format
 * @param {*} userId - User ID to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateUserId(userId) {
  if (!userId || typeof userId !== "string") {
    return {
      isValid: false,
      error: "Invalid user ID",
      code: "INVALID_USER_ID",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate user role
 * @param {*} role - Role to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateUserRole(role) {
  if (!role || typeof role !== "string") {
    return {
      isValid: false,
      error: "Role is required and must be a string",
      code: "INVALID_ROLE_TYPE",
    };
  }

  if (!isValidRole(role)) {
    return {
      isValid: false,
      error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
      code: "INVALID_ROLE",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Sanitize review text to prevent XSS and other issues
 * @param {string} review - Review text to sanitize
 * @returns {string} Sanitized review text
 */
export function sanitizeReview(review) {
  if (!review || typeof review !== "string") {
    return "";
  }

  // Trim whitespace
  let sanitized = review.trim();

  // Remove any HTML tags (basic sanitization)
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Remove any script tags and their content
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  return sanitized;
}
