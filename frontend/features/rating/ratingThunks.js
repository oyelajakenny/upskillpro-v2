/**
 * Rating Thunks
 * Async action creators for rating operations
 */

import * as ratingApi from "../../lib/api/ratings";
import {
  submitRatingStart,
  submitRatingSuccess,
  submitRatingFailure,
  fetchCourseRatingsStart,
  fetchCourseRatingsSuccess,
  fetchCourseRatingsFailure,
  fetchMyRatingStart,
  fetchMyRatingSuccess,
  fetchMyRatingFailure,
  deleteRatingStart,
  deleteRatingSuccess,
  deleteRatingFailure,
  fetchRatingStatsStart,
  fetchRatingStatsSuccess,
  fetchRatingStatsFailure,
  fetchInstructorRatingsStart,
  fetchInstructorRatingsSuccess,
  fetchInstructorRatingsFailure,
  updateCourseAggregates,
} from "./ratingSlice";
import { updateCourseRatings } from "../course/courseSlice";

/**
 * Submit or update a rating
 */
export const submitRating =
  (courseId, rating, review) => async (dispatch, getState) => {
    dispatch(submitRatingStart());

    // Store previous rating for rollback on error
    const { ratings } = getState();
    const previousRating = ratings.myRatings[courseId];

    try {
      const { auth } = getState();
      const token = auth.token;

      // Optimistic update: immediately update local state
      const optimisticRating = {
        userId: auth.user?.id,
        courseId,
        rating,
        review,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch(
        submitRatingSuccess({
          courseId,
          rating: optimisticRating,
        })
      );

      // Make API call
      const result = await ratingApi.submitRating(
        courseId,
        rating,
        review,
        token
      );

      // Update with actual server response
      dispatch(
        submitRatingSuccess({
          courseId,
          rating: result,
        })
      );

      // Fetch updated stats and update course data
      const stats = await ratingApi.getRatingStats(courseId);
      dispatch(
        fetchRatingStatsSuccess({
          courseId,
          stats,
        })
      );

      // Update course ratings in course slice
      dispatch(
        updateCourseRatings({
          courseId,
          averageRating: stats.averageRating,
          ratingCount: stats.ratingCount,
          distribution: stats.distribution,
        })
      );

      return result;
    } catch (error) {
      // Rollback optimistic update on error
      if (previousRating) {
        dispatch(
          submitRatingSuccess({
            courseId,
            rating: previousRating,
          })
        );
      } else {
        dispatch(deleteRatingSuccess({ courseId }));
      }

      dispatch(submitRatingFailure(error.message));
      throw error;
    }
  };

/**
 * Fetch all ratings for a course
 */
export const fetchCourseRatings =
  (courseId, options = {}) =>
  async (dispatch) => {
    dispatch(fetchCourseRatingsStart());

    try {
      const result = await ratingApi.getCourseRatings(courseId, options);

      dispatch(
        fetchCourseRatingsSuccess({
          courseId,
          ratings: result.ratings || [],
          lastEvaluatedKey: result.lastEvaluatedKey,
          hasMore: result.hasMore || false,
        })
      );

      return result;
    } catch (error) {
      dispatch(fetchCourseRatingsFailure(error.message));
      throw error;
    }
  };

/**
 * Fetch current user's rating for a course
 */
export const fetchMyRating = (courseId) => async (dispatch, getState) => {
  dispatch(fetchMyRatingStart());

  try {
    const { auth } = getState();
    const token = auth.token;

    const result = await ratingApi.getMyRating(courseId, token);

    dispatch(
      fetchMyRatingSuccess({
        courseId,
        rating: result,
      })
    );

    return result;
  } catch (error) {
    dispatch(fetchMyRatingFailure(error.message));
    throw error;
  }
};

/**
 * Delete current user's rating
 */
export const deleteRating = (courseId) => async (dispatch, getState) => {
  dispatch(deleteRatingStart());

  // Store previous rating for rollback on error
  const { ratings } = getState();
  const previousRating = ratings.myRatings[courseId];

  try {
    const { auth } = getState();
    const token = auth.token;

    // Optimistic update: immediately remove from local state
    dispatch(deleteRatingSuccess({ courseId }));

    // Make API call
    await ratingApi.deleteRating(courseId, token);

    // Fetch updated stats and update course data
    const stats = await ratingApi.getRatingStats(courseId);
    dispatch(
      fetchRatingStatsSuccess({
        courseId,
        stats,
      })
    );

    // Update course ratings in course slice
    dispatch(
      updateCourseRatings({
        courseId,
        averageRating: stats.averageRating,
        ratingCount: stats.ratingCount,
        distribution: stats.distribution,
      })
    );

    return true;
  } catch (error) {
    // Rollback optimistic update on error
    if (previousRating) {
      dispatch(
        submitRatingSuccess({
          courseId,
          rating: previousRating,
        })
      );
    }

    dispatch(deleteRatingFailure(error.message));
    throw error;
  }
};

/**
 * Fetch rating statistics for a course
 */
export const fetchRatingStats = (courseId) => async (dispatch) => {
  dispatch(fetchRatingStatsStart());

  try {
    const result = await ratingApi.getRatingStats(courseId);

    dispatch(
      fetchRatingStatsSuccess({
        courseId,
        stats: result,
      })
    );

    // Also update course aggregates in the rating state
    dispatch(
      updateCourseAggregates({
        courseId,
        averageRating: result.averageRating,
        ratingCount: result.ratingCount,
      })
    );

    // Update course ratings in course slice
    dispatch(
      updateCourseRatings({
        courseId,
        averageRating: result.averageRating,
        ratingCount: result.ratingCount,
        distribution: result.distribution,
      })
    );

    return result;
  } catch (error) {
    dispatch(fetchRatingStatsFailure(error.message));
    throw error;
  }
};

/**
 * Fetch instructor ratings
 */
export const fetchInstructorRatings =
  (courseId = null) =>
  async (dispatch, getState) => {
    dispatch(fetchInstructorRatingsStart());

    try {
      const { auth } = getState();
      const token = auth.token;

      const result = await ratingApi.getInstructorRatings(token, courseId);

      dispatch(fetchInstructorRatingsSuccess(result));

      return result;
    } catch (error) {
      dispatch(fetchInstructorRatingsFailure(error.message));
      throw error;
    }
  };
