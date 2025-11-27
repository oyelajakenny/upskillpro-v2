/**
 * Frontend validation utilities for rating system
 */

/**
 * Validate rating value
 * @param {*} rating - Rating value to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateRating(rating) {
  if (rating === undefined || rating === null || rating === 0) {
    return {
      isValid: false,
      error: "Please select a rating",
    };
  }

  if (!Number.isInteger(rating)) {
    return {
      isValid: false,
      error: "Rating must be a whole number",
    };
  }

  if (rating < 1 || rating > 5) {
    return {
      isValid: false,
      error: "Rating must be between 1 and 5 stars",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate review text
 * @param {*} review - Review text to validate
 * @param {number} maxLength - Maximum allowed length (default: 1000)
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateReview(review, maxLength = 1000) {
  // Review is optional, so null/undefined/empty is valid
  if (review === null || review === undefined || review === "") {
    return { isValid: true, error: null };
  }

  if (typeof review !== "string") {
    return {
      isValid: false,
      error: "Review must be text",
    };
  }

  if (review.length > maxLength) {
    return {
      isValid: false,
      error: `Review must not exceed ${maxLength} characters`,
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
    };
  }

  // Basic UUID format validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(courseId)) {
    return {
      isValid: false,
      error: "Invalid course ID format",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Sanitize review text for display
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

  return sanitized;
}

/**
 * Get character count status for review
 * @param {string} review - Review text
 * @param {number} maxLength - Maximum allowed length
 * @returns {Object} { count: number, remaining: number, isOverLimit: boolean, percentage: number }
 */
export function getReviewCharacterStatus(review, maxLength = 1000) {
  const count = review ? review.length : 0;
  const remaining = maxLength - count;
  const isOverLimit = remaining < 0;
  const percentage = (count / maxLength) * 100;

  return {
    count,
    remaining,
    isOverLimit,
    percentage,
  };
}

/**
 * Format error message for display
 * @param {Error|ApiError} error - Error object
 * @returns {string} Formatted error message
 */
export function formatErrorMessage(error) {
  if (!error) {
    return "An unexpected error occurred";
  }

  // If it's an API error with a code, use user-friendly messages
  if (error.code) {
    const errorMessages = {
      NOT_ENROLLED: "You must be enrolled in this course to rate it.",
      INVALID_RATING: "Please select a valid rating (1-5 stars).",
      RATING_REQUIRED: "Please select a rating before submitting.",
      REVIEW_TOO_LONG:
        "Your review is too long. Please keep it under 1000 characters.",
      RATING_NOT_FOUND: "Rating not found. It may have been deleted.",
      UNAUTHORIZED: "You can only modify your own ratings.",
      FORBIDDEN: "You don't have permission to perform this action.",
      INVALID_COURSE_ID: "Invalid course ID.",
      NETWORK_ERROR:
        "Network error. Please check your connection and try again.",
      INTERNAL_ERROR: "Something went wrong. Please try again later.",
    };

    return errorMessages[error.code] || error.message || "An error occurred";
  }

  return error.message || "An unexpected error occurred";
}

/**
 * Check if error is retryable
 * @param {Error|ApiError} error - Error object
 * @returns {boolean} Whether the error is retryable
 */
export function isRetryableError(error) {
  if (!error) {
    return false;
  }

  // Network errors are retryable
  if (error.code === "NETWORK_ERROR") {
    return true;
  }

  // 5xx server errors are retryable
  if (error.status && error.status >= 500) {
    return true;
  }

  // 429 rate limit errors are retryable
  if (error.status === 429) {
    return true;
  }

  return false;
}
