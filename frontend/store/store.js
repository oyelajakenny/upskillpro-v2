import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import rootReducer from "./rootReducer";

// Conditionally use storage only on the client side
const createPersistStorage = () => {
  if (typeof window !== "undefined") {
    const storage = require("redux-persist/lib/storage").default;
    return storage;
  }
  return undefined;
};

const persistConfig = {
  key: "root",
  storage: createPersistStorage(),
  whitelist: ["auth"],
};

// Create persisted reducer only on client side
const persistedReducer =
  typeof window !== "undefined"
    ? persistReducer(persistConfig, rootReducer)
    : rootReducer;

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor =
  typeof window !== "undefined" ? persistStore(store) : null;
