/**
 * Custom hook for rating operations
 * Provides easy access to rating state and actions
 */

import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  submitRating,
  fetchCourseRatings,
  fetchMyRating,
  deleteRating,
  fetchRatingStats,
  fetchInstructorRatings,
} from "./ratingThunks";
import { clearCourseRatings, clearErrors } from "./ratingSlice";

export function useRatings(courseId = null) {
  const dispatch = useDispatch();

  // Select rating state
  const myRating = useSelector((state) =>
    courseId ? state.ratings.myRatings[courseId] : null
  );

  const courseRatings = useSelector((state) =>
    courseId ? state.ratings.courseRatings[courseId] : null
  );

  const ratingStats = useSelector((state) =>
    courseId ? state.ratings.ratingStats[courseId] : null
  );

  const instructorRatings = useSelector(
    (state) => state.ratings.instructorRatings
  );

  const loading = useSelector((state) => state.ratings.loading);
  const error = useSelector((state) => state.ratings.error);

  // Action creators
  const handleSubmitRating = useCallback(
    async (rating, review) => {
      if (!courseId) {
        throw new Error("Course ID is required");
      }
      return dispatch(submitRating(courseId, rating, review));
    },
    [dispatch, courseId]
  );

  const handleFetchCourseRatings = useCallback(
    async (options = {}) => {
      if (!courseId) {
        throw new Error("Course ID is required");
      }
      return dispatch(fetchCourseRatings(courseId, options));
    },
    [dispatch, courseId]
  );

  const handleFetchMyRating = useCallback(async () => {
    if (!courseId) {
      throw new Error("Course ID is required");
    }
    return dispatch(fetchMyRating(courseId));
  }, [dispatch, courseId]);

  const handleDeleteRating = useCallback(async () => {
    if (!courseId) {
      throw new Error("Course ID is required");
    }
    return dispatch(deleteRating(courseId));
  }, [dispatch, courseId]);

  const handleFetchRatingStats = useCallback(async () => {
    if (!courseId) {
      throw new Error("Course ID is required");
    }
    return dispatch(fetchRatingStats(courseId));
  }, [dispatch, courseId]);

  const handleFetchInstructorRatings = useCallback(
    async (filterCourseId = null) => {
      return dispatch(fetchInstructorRatings(filterCourseId));
    },
    [dispatch]
  );

  const handleClearCourseRatings = useCallback(() => {
    if (!courseId) {
      throw new Error("Course ID is required");
    }
    dispatch(clearCourseRatings({ courseId }));
  }, [dispatch, courseId]);

  const handleClearErrors = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  return {
    // State
    myRating,
    courseRatings: courseRatings?.ratings || [],
    hasMoreRatings: courseRatings?.hasMore || false,
    lastEvaluatedKey: courseRatings?.lastEvaluatedKey,
    ratingStats,
    instructorRatings,
    loading,
    error,

    // Actions
    submitRating: handleSubmitRating,
    fetchCourseRatings: handleFetchCourseRatings,
    fetchMyRating: handleFetchMyRating,
    deleteRating: handleDeleteRating,
    fetchRatingStats: handleFetchRatingStats,
    fetchInstructorRatings: handleFetchInstructorRatings,
    clearCourseRatings: handleClearCourseRatings,
    clearErrors: handleClearErrors,
  };
}
