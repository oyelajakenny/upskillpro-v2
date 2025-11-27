"use client";
import React, { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * ReviewList Component
 *
 * Displays paginated list of course reviews sorted by date (newest first).
 * Shows reviewer name, rating, review text, and submission date.
 *
 * @param {Object} props
 * @param {string} props.courseId - Course ID to fetch reviews for
 * @param {number} props.pageSize - Number of reviews per page (default: 10)
 * @param {Function} props.fetchReviews - Function to fetch reviews (courseId, limit, lastKey)
 * @param {string} props.className - Additional CSS classes
 */
const ReviewList = ({
  courseId,
  pageSize = 10,
  fetchReviews,
  className = "",
}) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [pageKeys, setPageKeys] = useState([null]); // Track keys for each page

  // Fetch reviews
  useEffect(() => {
    const loadReviews = async () => {
      if (!courseId || !fetchReviews) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const pageIndex = currentPage - 1;
        const lastKey = pageKeys[pageIndex];

        const response = await fetchReviews(courseId, pageSize, lastKey);

        setReviews(response.ratings || []);
        setHasMore(response.hasMore || false);
        setLastEvaluatedKey(response.lastEvaluatedKey || null);

        // Store the next page key if we have more results
        if (response.hasMore && response.lastEvaluatedKey) {
          setPageKeys((prev) => {
            const newKeys = [...prev];
            newKeys[currentPage] = response.lastEvaluatedKey;
            return newKeys;
          });
        }
      } catch (err) {
        // Format error message
        let errorMessage = "Failed to load reviews";

        if (err.code) {
          const errorMessages = {
            INVALID_COURSE_ID: "Invalid course ID",
            INVALID_PAGINATION_TOKEN:
              "Invalid pagination token. Please refresh the page.",
            NETWORK_ERROR:
              "Network error. Please check your connection and try again.",
            INTERNAL_ERROR: "Something went wrong. Please try again later.",
          };
          errorMessage = errorMessages[err.code] || err.message;
        } else {
          errorMessage = err.message || errorMessage;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [courseId, currentPage, pageSize, fetchReviews]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Render stars
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            className={cn(
              "w-4 h-4",
              value <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading reviews...</span>
        </div>
      </div>
    );
  }

  // Retry loading reviews
  const handleRetry = () => {
    setCurrentPage(1);
    setPageKeys([null]);
    setError(null);
  };

  // Error state
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-red-600 font-medium mb-1">
                  Failed to load reviews
                </p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
        <Card className="border-gray-200">
          <CardContent className="p-12 text-center">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No reviews yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Be the first to share your experience with this course!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold text-gray-900">
        Reviews ({reviews.length})
      </h3>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <Card key={`${review.userId}-${index}`} className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {review.userName || "Anonymous"}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {renderStars(review.rating)}
                </div>
              </div>

              {review.review && (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {review.review}
                </p>
              )}

              {review.updatedAt && review.updatedAt !== review.createdAt && (
                <p className="text-xs text-gray-500 mt-3 italic">
                  Edited {formatDate(review.updatedAt)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {(currentPage > 1 || hasMore) && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <span className="text-sm text-gray-600">Page {currentPage}</span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasMore}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
