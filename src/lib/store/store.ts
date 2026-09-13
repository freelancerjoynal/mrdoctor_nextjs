"use client";

import { configureStore } from "@reduxjs/toolkit";
import profileReducer from "./profileSlice";

/**
 * Client store — caches session-stable data (profile/identity) so panels
 * don't refetch it on every visit. Live counters (counts, collections, rows)
 * intentionally stay as direct fetches with polling.
 */
export const store = configureStore({
  reducer: { profile: profileReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
