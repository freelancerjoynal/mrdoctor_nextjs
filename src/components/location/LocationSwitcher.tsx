"use client";

import { useState } from "react";
import { LocationPickerFields } from "@/components/location/LocationPickerFields";

/**
 * Minimizable bottom-right widget inside location portals:
 * collapsed = small "📍 এলাকা বদলান" pill; expanded = the same picker
 * (GPS auto-detect + district → upazila, district alone = whole district).
 */
export function LocationSwitcher({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-50 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-2xl ring-1 ring-white/20 hover:bg-slate-800 sm:bottom-6 sm:right-6"
      >
        📍 এলাকা বদলান
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 w-[calc(100%-1.5rem)] max-w-sm rounded-3xl bg-slate-950 p-4 text-white shadow-2xl ring-1 ring-white/15 sm:bottom-6 sm:right-6 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-black">🩺 ডাক্তার কোথায় খুঁজছেন?</p>
        <button
          onClick={() => setOpen(false)}
          aria-label="ছোট করুন"
          className="rounded-lg px-2 py-0.5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          ➖
        </button>
      </div>
      <p className="mt-1 text-xs text-white/60">
        Where are you looking for a doctor? অন্য এলাকা বাছুন।
      </p>
      <div className="mt-3">
        <LocationPickerFields />
      </div>
    </div>
  );
}
