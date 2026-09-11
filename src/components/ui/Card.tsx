import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="w-full rounded-2xl border border-white/40 bg-white/90 p-5 shadow-2xl shadow-indigo-950/10 backdrop-blur sm:rounded-3xl sm:p-8">
      {children}
    </div>
  );
}
