import { createSlice } from "@reduxjs/toolkit";
import { persistStore } from "redux-persist";

const initialState = {
  user: {},
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = {};
      state.token = null;
      state.isAuthenticated = false;
      // persistStore(store).purge();
    },
    updateUserInfo: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };
    },
  },
});

export const { loginSuccess, logout, updateUserInfo } = authSlice.actions;

export default authSlice.reducer;
