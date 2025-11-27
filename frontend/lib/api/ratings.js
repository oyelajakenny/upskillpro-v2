/**
 * Rating API Service
 * Handles all rating-related API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Get authentication headers with JWT token
 */
function getAuthHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Handle API response and errors
 */
async function handleResponse(response) {
  if (!response.ok) {
    const errorText = await response.text();
    let errorData = {
      error: errorText,
      code: "UNKNOWN_ERROR",
    };

    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      // If not JSON, use the text as is
    }

    const errorMessage = errorData.error || errorData.message || errorText;
    throw new ApiError(
      errorMessage,
      errorData.code,
      response.status,
      errorData.details
    );
  }

  return response.json();
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 2, delay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) except for 429 (rate limit)
      if (
        error.status &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 429
      ) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, attempt))
      );
    }
  }

  throw lastError;
}

/**
 * Get user-friendly error message based on error code
 * @param {ApiError} error - API error object
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyErrorMessage(error) {
  if (!(error instanceof ApiError)) {
    return error.message || "An unexpected error occurred";
  }

  const errorMessages = {
    NOT_ENROLLED: "You must be enrolled in this course to rate it.",
    INVALID_RATING: "Please select a rating between 1 and 5 stars.",
    RATING_REQUIRED: "Please select a rating before submitting.",
    REVIEW_TOO_LONG:
      "Your review is too long. Please keep it under 1000 characters.",
    RATING_NOT_FOUND: "Rating not found. It may have been deleted.",
    UNAUTHORIZED: "You can only modify your own ratings.",
    FORBIDDEN: "You don't have permission to perform this action.",
    INVALID_COURSE_ID: "Invalid course ID.",
    INVALID_PAGINATION_TOKEN:
      "Invalid pagination token. Please refresh the page.",
    INTERNAL_ERROR: "Something went wrong. Please try again later.",
    NETWORK_ERROR: "Network error. Please check your connection and try again.",
  };

  return errorMessages[error.code] || error.message || "An error occurred";
}

/**
 * Submit or update a rating for a course
 * @param {string} courseId - The course ID
 * @param {number} rating - Rating value (1-5)
 * @param {string} review - Optional review text
 * @param {string} token - JWT authentication token
 * @param {boolean} retry - Whether to retry on failure (default: true)
 * @returns {Promise<Object>} The created/updated rating
 */
export async function submitRating(
  courseId,
  rating,
  review,
  token,
  retry = true
) {
  const submitFn = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/courses/${courseId}/ratings`,
        {
          method: "POST",
          headers: getAuthHeaders(token),
          body: JSON.stringify({ rating, review }),
        }
      );

      return handleResponse(response);
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new ApiError(
          "Network error. Please check your connection.",
          "NETWORK_ERROR",
          0
        );
      }
      throw error;
    }
  };

  if (retry) {
    return retryWithBackoff(submitFn, 2, 1000);
  }

  return submitFn();
}

/**
 * Get all ratings for a course with pagination
 * @param {string} courseId - The course ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of ratings per page (default: 10)
 * @param {string} options.lastKey - Pagination token for next page
 * @returns {Promise<Object>} Ratings list with pagination info
 */
export async function getCourseRatings(courseId, options = {}) {
  const { limit = 10, lastKey } = options;

  const queryParams = new URLSearchParams();
  if (limit) queryParams.append("limit", limit);
  if (lastKey) queryParams.append("lastKey", lastKey);

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/courses/${courseId}/ratings${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

/**
 * Get the current user's rating for a course
 * @param {string} courseId - The course ID
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object|null>} The user's rating or null if not found
 */
export async function getMyRating(courseId, token) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/courses/${courseId}/ratings/me`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    if (response.status === 404) {
      return null;
    }

    return handleResponse(response);
  } catch (error) {
    if (error.message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

/**
 * Delete the current user's rating for a course
 * @param {string} courseId - The course ID
 * @param {string} token - JWT authentication token
 * @param {boolean} retry - Whether to retry on failure (default: true)
 * @returns {Promise<Object>} Success message
 */
export async function deleteRating(courseId, token, retry = true) {
  const deleteFn = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/courses/${courseId}/ratings`,
        {
          method: "DELETE",
          headers: getAuthHeaders(token),
        }
      );

      return handleResponse(response);
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new ApiError(
          "Network error. Please check your connection.",
          "NETWORK_ERROR",
          0
        );
      }
      throw error;
    }
  };

  if (retry) {
    return retryWithBackoff(deleteFn, 2, 1000);
  }

  return deleteFn();
}

/**
 * Get rating statistics for a course
 * @param {string} courseId - The course ID
 * @returns {Promise<Object>} Rating statistics including average, count, and distribution
 */
export async function getRatingStats(courseId) {
  const response = await fetch(
    `${API_BASE_URL}/api/courses/${courseId}/ratings/stats`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  return handleResponse(response);
}

/**
 * Get ratings for all courses taught by the instructor
 * @param {string} token - JWT authentication token
 * @param {string} courseId - Optional course ID to filter by specific course
 * @returns {Promise<Object>} Instructor ratings data
 */
export async function getInstructorRatings(token, courseId = null) {
  const queryParams = new URLSearchParams();
  if (courseId) queryParams.append("courseId", courseId);

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/instructor/ratings${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  return handleResponse(response);
}
