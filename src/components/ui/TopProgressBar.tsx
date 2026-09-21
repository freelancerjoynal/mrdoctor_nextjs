"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Lightweight top progress bar for App Router navigation.
 * No `<style>` tags in the tree (React 19 forbids those outside `<head>`) —
 * all animation lives in `globals.css` (`.topbar-anim`).
 * Shows on internal link clicks, hides automatically once the new
 * URL lands (render-time comparison — no setState inside effects).
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [target, setTarget] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const visible = target !== null && target !== current;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const a = el?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      try {
        const url = new URL(href, window.location.origin);
        // Same-page anchors / identical URLs never trigger a route load.
        if (url.pathname === window.location.pathname && url.hash) return;
        if (url.href === window.location.href) return;
        setTarget(`${url.pathname}${url.search}`);
      } catch {
        return;
      }
      // Failsafe: never leave the bar stuck on screen.
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setTarget(null), 8000);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden"
    >
      <div className="topbar-anim h-full w-2/5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-emerald-500 shadow-[0_0_12px_rgba(200,150,20,0.9)]" />
    </div>
  );
}
