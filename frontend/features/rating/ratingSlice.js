import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Current user's ratings by courseId
  myRatings: {},

  // Course ratings data by courseId
  courseRatings: {},

  // Rating statistics by courseId
  ratingStats: {},

  // Instructor ratings data
  instructorRatings: null,

  // Loading states
  loading: {
    submit: false,
    fetch: false,
    delete: false,
    stats: false,
    instructor: false,
  },

  // Error states
  error: {
    submit: null,
    fetch: null,
    delete: null,
    stats: null,
    instructor: null,
  },
};

const ratingSlice = createSlice({
  name: "ratings",
  initialState,
  reducers: {
    // Submit rating actions
    submitRatingStart(state) {
      state.loading.submit = true;
      state.error.submit = null;
    },
    submitRatingSuccess(state, action) {
      const { courseId, rating } = action.payload;
      state.myRatings[courseId] = rating;
      state.loading.submit = false;
      state.error.submit = null;
    },
    submitRatingFailure(state, action) {
      state.loading.submit = false;
      state.error.submit = action.payload;
    },

    // Fetch course ratings actions
    fetchCourseRatingsStart(state) {
      state.loading.fetch = true;
      state.error.fetch = null;
    },
    fetchCourseRatingsSuccess(state, action) {
      const { courseId, ratings, lastEvaluatedKey, hasMore } = action.payload;

      if (!state.courseRatings[courseId]) {
        state.courseRatings[courseId] = {
          ratings: [],
          lastEvaluatedKey: null,
          hasMore: false,
        };
      }

      // Append new ratings (for pagination)
      state.courseRatings[courseId].ratings = [
        ...state.courseRatings[courseId].ratings,
        ...ratings,
      ];
      state.courseRatings[courseId].lastEvaluatedKey = lastEvaluatedKey;
      state.courseRatings[courseId].hasMore = hasMore;
      state.loading.fetch = false;
      state.error.fetch = null;
    },
    fetchCourseRatingsFailure(state, action) {
      state.loading.fetch = false;
      state.error.fetch = action.payload;
    },

    // Fetch my rating actions
    fetchMyRatingStart(state) {
      state.loading.fetch = true;
      state.error.fetch = null;
    },
    fetchMyRatingSuccess(state, action) {
      const { courseId, rating } = action.payload;
      state.myRatings[courseId] = rating;
      state.loading.fetch = false;
      state.error.fetch = null;
    },
    fetchMyRatingFailure(state, action) {
      state.loading.fetch = false;
      state.error.fetch = action.payload;
    },

    // Delete rating actions
    deleteRatingStart(state) {
      state.loading.delete = true;
      state.error.delete = null;
    },
    deleteRatingSuccess(state, action) {
      const { courseId } = action.payload;
      delete state.myRatings[courseId];
      state.loading.delete = false;
      state.error.delete = null;
    },
    deleteRatingFailure(state, action) {
      state.loading.delete = false;
      state.error.delete = action.payload;
    },

    // Fetch rating stats actions
    fetchRatingStatsStart(state) {
      state.loading.stats = true;
      state.error.stats = null;
    },
    fetchRatingStatsSuccess(state, action) {
      const { courseId, stats } = action.payload;
      state.ratingStats[courseId] = stats;
      state.loading.stats = false;
      state.error.stats = null;
    },
    fetchRatingStatsFailure(state, action) {
      state.loading.stats = false;
      state.error.stats = action.payload;
    },

    // Fetch instructor ratings actions
    fetchInstructorRatingsStart(state) {
      state.loading.instructor = true;
      state.error.instructor = null;
    },
    fetchInstructorRatingsSuccess(state, action) {
      state.instructorRatings = action.payload;
      state.loading.instructor = false;
      state.error.instructor = null;
    },
    fetchInstructorRatingsFailure(state, action) {
      state.loading.instructor = false;
      state.error.instructor = action.payload;
    },

    // Update course rating aggregates (optimistic update)
    updateCourseAggregates(state, action) {
      const { courseId, averageRating, ratingCount } = action.payload;
      if (!state.ratingStats[courseId]) {
        state.ratingStats[courseId] = {};
      }
      state.ratingStats[courseId].averageRating = averageRating;
      state.ratingStats[courseId].ratingCount = ratingCount;
    },

    // Clear course ratings (useful when navigating away)
    clearCourseRatings(state, action) {
      const { courseId } = action.payload;
      if (state.courseRatings[courseId]) {
        delete state.courseRatings[courseId];
      }
    },

    // Clear all errors
    clearErrors(state) {
      state.error = {
        submit: null,
        fetch: null,
        delete: null,
        stats: null,
        instructor: null,
      };
    },

    // Reset ratings state (on logout)
    resetRatings(state) {
      return initialState;
    },
  },
});

export const {
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
  clearCourseRatings,
  clearErrors,
  resetRatings,
} = ratingSlice.actions;

export default ratingSlice.reducer;
