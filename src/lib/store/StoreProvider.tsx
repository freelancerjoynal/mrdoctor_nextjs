"use client";

import { Provider } from "react-redux";
import { store } from "./store";

/** Single client store instance for the whole session (survives navigation). */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
