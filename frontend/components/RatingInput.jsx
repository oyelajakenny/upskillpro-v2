"use client";
import React, { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * RatingInput Component
 *
 * Interactive star rating input with optional text review.
 * Includes form validation, character count, and loading states.
 *
 * @param {Object} props
 * @param {number} props.initialRating - Initial rating value (0-5)
 * @param {string} props.initialReview - Initial review text
 * @param {Function} props.onSubmit - Callback function(rating, review)
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {string} props.className - Additional CSS classes
 */
const RatingInput = ({
  initialRating = 0,
  initialReview = "",
  onSubmit,
  disabled = false,
  className = "",
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState(initialReview);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const MAX_REVIEW_LENGTH = 1000;

  // Validate form
  const validate = () => {
    const newErrors = {};

    // Validate rating
    if (rating === 0) {
      newErrors.rating = "Please select a rating";
    } else if (rating < 1 || rating > 5) {
      newErrors.rating = "Rating must be between 1 and 5 stars";
    } else if (!Number.isInteger(rating)) {
      newErrors.rating = "Rating must be a whole number";
    }

    // Validate review
    if (review && typeof review !== "string") {
      newErrors.review = "Review must be text";
    } else if (review && review.length > MAX_REVIEW_LENGTH) {
      newErrors.review = `Review must not exceed ${MAX_REVIEW_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(rating, review);
    } catch (error) {
      // Extract user-friendly error message
      let errorMessage = "Failed to submit rating";

      if (error.code) {
        // Map error codes to user-friendly messages
        const errorMessages = {
          NOT_ENROLLED: "You must be enrolled in this course to rate it.",
          INVALID_RATING: "Please select a valid rating (1-5 stars).",
          RATING_REQUIRED: "Please select a rating before submitting.",
          REVIEW_TOO_LONG:
            "Your review is too long. Please keep it under 1000 characters.",
          UNAUTHORIZED: "You can only modify your own ratings.",
          NETWORK_ERROR:
            "Network error. Please check your connection and try again.",
          INTERNAL_ERROR: "Something went wrong. Please try again later.",
        };

        errorMessage = errorMessages[error.code] || error.message;
      } else {
        errorMessage = error.message || errorMessage;
      }

      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle star click
  const handleStarClick = (value) => {
    if (!disabled && !isSubmitting) {
      // Validate rating value
      if (value >= 1 && value <= 5 && Number.isInteger(value)) {
        setRating(value);
        setErrors((prev) => ({ ...prev, rating: undefined }));
      } else {
        setErrors((prev) => ({
          ...prev,
          rating: "Invalid rating value",
        }));
      }
    }
  };

  // Handle star hover
  const handleStarHover = (value) => {
    if (!disabled && !isSubmitting) {
      setHoverRating(value);
    }
  };

  // Handle review change
  const handleReviewChange = (e) => {
    const value = e.target.value;
    setReview(value);

    // Real-time validation
    if (value.length > MAX_REVIEW_LENGTH) {
      setErrors((prev) => ({
        ...prev,
        review: `Review must not exceed ${MAX_REVIEW_LENGTH} characters`,
      }));
    } else {
      setErrors((prev) => ({ ...prev, review: undefined }));
    }
  };

  const displayRating = hoverRating || rating;
  const remainingChars = MAX_REVIEW_LENGTH - review.length;
  const isOverLimit = remainingChars < 0;

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {/* Star Rating Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Your Rating *
        </label>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleStarClick(value)}
              onMouseEnter={() => handleStarHover(value)}
              disabled={disabled || isSubmitting}
              className={cn(
                "transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded",
                disabled || isSubmitting
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              )}
              aria-label={`Rate ${value} stars`}
            >
              <Star
                className={cn(
                  "w-8 h-8 transition-colors",
                  value <= displayRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-600">
              {rating} {rating === 1 ? "star" : "stars"}
            </span>
          )}
        </div>
        {errors.rating && (
          <p className="text-sm text-red-600">{errors.rating}</p>
        )}
      </div>

      {/* Review Text Area */}
      <div className="space-y-2">
        <label
          htmlFor="review"
          className="block text-sm font-medium text-gray-700"
        >
          Your Review (Optional)
        </label>
        <textarea
          id="review"
          value={review}
          onChange={handleReviewChange}
          disabled={disabled || isSubmitting}
          placeholder="Share your experience with this course..."
          rows={4}
          className={cn(
            "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none",
            isOverLimit ? "border-red-500" : "border-gray-300",
            disabled || isSubmitting
              ? "bg-gray-100 cursor-not-allowed"
              : "bg-white"
          )}
        />
        <div className="flex justify-between items-center text-sm">
          <span className={cn(isOverLimit ? "text-red-600" : "text-gray-500")}>
            {remainingChars} characters remaining
          </span>
          {review.length > 0 && (
            <span className="text-gray-500">
              {review.length} / {MAX_REVIEW_LENGTH}
            </span>
          )}
        </div>
        {errors.review && (
          <p className="text-sm text-red-600">{errors.review}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="space-y-2">
        <Button
          type="submit"
          disabled={disabled || isSubmitting || isOverLimit}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Submitting...
            </>
          ) : initialRating > 0 ? (
            "Update Rating"
          ) : (
            "Submit Rating"
          )}
        </Button>
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">Error</p>
            <p className="text-sm text-red-600 mt-1">{errors.submit}</p>
            {errors.submit.includes("Network") && (
              <button
                type="button"
                onClick={handleSubmit}
                className="mt-2 text-sm text-red-700 underline hover:text-red-800"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  );
};

export default RatingInput;
