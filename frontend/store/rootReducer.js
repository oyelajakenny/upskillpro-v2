import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import courseReducer from "../features/course/courseSlice";
import ratingReducer from "../features/rating/ratingSlice";

// Combine all reducers into a single reducer
const appReducer = combineReducers({
  auth: authReducer,
  courses: courseReducer,
  ratings: ratingReducer,
});

// Global reducer to handle state reset on logout
const rootReducer = (state, action) => {
  if (action.type === "auth/logout") {
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;
