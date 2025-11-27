import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  courses: [],
  enrolledCourses: [],
  categories: [],
  selectedCategory: null,
  loading: false,
  categoryLoading: false,
  error: null,
  categoryError: null,
  // Cache for individual course details with rating data
  courseDetails: {},
};

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    fetchCoursesStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchCoursesSuccess(state, action) {
      state.courses = action.payload;
      state.loading = false;
    },
    fetchCoursesFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    addCourse(state, action) {
      state.courses.push(action.payload);
    },
    enrollCourse(state, action) {
      const courseId = action.payload;
      if (!state.enrolledCourses.includes(courseId)) {
        state.enrolledCourses.push(courseId);
      }
    },
    setUserEnrolledCourses(state, action) {
      state.enrolledCourses = action.payload;
    },
    clearEnrolledCourses(state) {
      state.courses = [];
      state.enrolledCourses = [];
    },
    fetchCategoriesStart(state) {
      state.categoryLoading = true;
      state.categoryError = null;
    },
    fetchCategoriesSuccess(state, action) {
      state.categories = action.payload;
      state.categoryLoading = false;
      state.categoryError = null;
    },
    fetchCategoriesFailure(state, action) {
      state.categoryLoading = false;
      state.categoryError = action.payload;
    },
    setSelectedCategory(state, action) {
      state.selectedCategory = action.payload;
    },
    clearCategoryFilter(state) {
      state.selectedCategory = null;
    },
    // Update course rating aggregates (called when ratings change)
    updateCourseRatings(state, action) {
      const { courseId, averageRating, ratingCount, distribution } =
        action.payload;

      // Update in courses array
      const courseIndex = state.courses.findIndex((c) => c.id === courseId);
      if (courseIndex !== -1) {
        state.courses[courseIndex].averageRating = averageRating;
        state.courses[courseIndex].ratingCount = ratingCount;
        if (distribution) {
          state.courses[courseIndex].ratingDistribution = distribution;
        }
      }

      // Update in course details cache
      if (state.courseDetails[courseId]) {
        state.courseDetails[courseId].averageRating = averageRating;
        state.courseDetails[courseId].ratingCount = ratingCount;
        if (distribution) {
          state.courseDetails[courseId].ratingDistribution = distribution;
        }
      }
    },
    // Set course details (for individual course page)
    setCourseDetails(state, action) {
      const course = action.payload;
      state.courseDetails[course.id] = course;
    },
    // Clear course details cache
    clearCourseDetails(state, action) {
      if (action.payload) {
        delete state.courseDetails[action.payload];
      } else {
        state.courseDetails = {};
      }
    },
  },
});

export const {
  fetchCoursesStart,
  fetchCoursesSuccess,
  fetchCoursesFailure,
  addCourse,
  enrollCourse,
  setUserEnrolledCourses,
  clearEnrolledCourses,
  fetchCategoriesStart,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
  setSelectedCategory,
  clearCategoryFilter,
  updateCourseRatings,
  setCourseDetails,
  clearCourseDetails,
} = coursesSlice.actions;

export default coursesSlice.reducer;
