"use client";

import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/** The doctor behind the current session (own profile, or staff's doctor). */
export function useSessionDoctor() {
  return useAppSelector((s) => {
    const p = s.profile.data;
    if (!p) return null;
    return p.staffDoctor ?? p.doctorProfile ?? null;
  });
}
