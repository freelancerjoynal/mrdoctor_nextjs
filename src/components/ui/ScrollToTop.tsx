"use client";

import { useEffect, useState } from "react";

/**
 * Floating scroll-to-top button (bottom-right). Appears after scrolling
 * down, smooth-scrolls back to the top on click.
 */
export function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="উপরে যান"
      className="loc-backdrop fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-xl font-black text-emerald-950 shadow-[0_10px_30px_-6px_rgba(200,150,20,0.8)] ring-2 ring-white transition hover:brightness-105 sm:bottom-8 sm:right-8"
    >
      ↑
    </button>
  );
}
