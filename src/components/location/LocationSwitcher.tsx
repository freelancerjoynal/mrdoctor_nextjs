"use client";

import { useState } from "react";
import { LocationPopup } from "@/components/location/LocationPopup";

/**
 * Fixed top-right location widget (desktop + mobile, same place).
 * Just an eye-catching pill — tapping it opens the universal
 * location popup in the middle of the screen.
 * Wrapped in an animated multicolor border + breathing glow
 * (`.loc-animated-frame` in globals.css) to attract attention.
 */
export function LocationSwitcher({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <div className="fixed right-3 top-[76px] z-50 sm:right-6 sm:top-[88px]">
        <div className="loc-animated-frame rounded-full p-[2.5px]">
          <button
            onClick={() => setOpen(true)}
            aria-label="এলাকা বদলান"
            className="loc-attention flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 via-yellow-50 to-emerald-100 px-3 py-2 text-xs font-black text-emerald-950 transition hover:brightness-105 active:scale-95 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <span className="text-sm sm:text-lg">📍</span>
            এলাকা বদলান
          </button>
        </div>
      </div>
      {open && <LocationPopup onClose={() => setOpen(false)} />}
    </>
  );
}
