"use client";

import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib/auth/apiFetch";
import type { UserProfile } from "@/lib/auth/types";

interface ProfileState {
  /** Canonical session profile — fetched once per session, shared by all panels. */
  data: UserProfile | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ProfileState = { data: null, status: "idle", error: null };

/**
 * Session profile (name, role, doctor/staff linkage, approval right).
 * Stable for the whole login session, so the thunk refuses to refetch once
 * it has loaded — panels read it from the store instead of hitting
 * `/api/users/profile` on every visit.
 */
export const fetchProfile = createAsyncThunk<UserProfile>(
  "profile/fetch",
  async () => {
    const res = await apiFetch("/api/backend/api/users/profile");
    const data = (await res.json().catch(() => null)) as {
      profile?: UserProfile;
      error?: string;
    } | null;
    if (!res.ok || !data?.profile) throw new Error(data?.error || "প্রোফাইল লোড করা যায়নি।");
    return data.profile;
  },
  {
    // One flight per session: skip while loading and once loaded.
    condition: (_, { getState }) => {
      const s = (getState() as { profile: ProfileState }).profile;
      return s.status === "idle";
    },
  },
);

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    /** Keep the cache fresh after a self-service rename (no refetch needed). */
    patchLocalName(state, action: PayloadAction<string>) {
      if (state.data) state.data = { ...state.data, name: action.payload };
    },
    /** Force the next reader to refetch (e.g. after logout/login). */
    invalidateProfile(state) {
      state.data = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "প্রোফাইল লোড করা যায়নি।";
      });
  },
});

export const { patchLocalName, invalidateProfile } = profileSlice.actions;
export default profileSlice.reducer;
