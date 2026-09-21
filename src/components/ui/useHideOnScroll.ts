"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shared hide-on-scroll behaviour for every site header:
 * scrolling down hides the bar, scrolling up reveals it again.
 * Design/content of each header stays untouched — only the
 * `hidden` / `scrolled` flags are shared.
 */
export function useHideOnScroll(threshold = 140) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (y > threshold && y > lastY.current) setHidden(true);
      else if (y < lastY.current) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { hidden, scrolled };
}
