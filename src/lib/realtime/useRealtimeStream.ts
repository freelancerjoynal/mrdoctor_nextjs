"use client";

import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";

export type RealtimeType = "appointments" | "live";

interface RealtimeFrame {
  types?: unknown;
}

interface UseRealtimeStreamOptions {
  /** Set false to keep the connection closed (e.g. panel unmounted). */
  enabled?: boolean;
  /** Same-origin stream URL: `/api/stream` or `/api/stream/live?username=…`. */
  url: string;
  /**
   * Lightweight authed GET used as a session probe after repeated stream
   * errors. `apiFetch` redirects to /login on 401; a non-OK answer means a
   * dead session here too, so we send the user to /login ourselves.
   * Omit for public (unauthenticated) streams.
   */
  probeUrl?: string;
  /** Fired for every pushed frame (and once with both types on reconnect). */
  onEvent: (types: RealtimeType[]) => void;
}

/**
 * Websocket-style push without polling: one SSE connection per mounted
 * panel, scoped server-side to the caller's doctor/hospital.
 *
 * - Connects only while the tab is visible; disconnects when hidden, so
 *   idle pages never touch the network. On return it reconnects and fires
 *   a catch-up event for missed pushes.
 * - EventSource auto-retries transient drops. After 3 quick failures the
 *   session is probed once (dead session → /login) instead of retry-looping
 *   forever.
 */
export function useRealtimeStream({ enabled = true, url, probeUrl, onEvent }: UseRealtimeStreamOptions) {
  const handlerRef = useRef(onEvent);
  const probeRef = useRef(probeUrl);
  // Latest callbacks for the long-lived EventSource (synced in effects —
  // refs must not be written during render).
  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    probeRef.current = probeUrl;
  }, [probeUrl]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let es: EventSource | null = null;
    let cancelled = false;
    let errCount = 0;
    let windowStart = 0;

    const open = () => {
      if (cancelled) return;
      es?.close();
      es = new EventSource(url);
      // Catch up on anything pushed while we were away (or before SSR
      // HTML was generated) — without this the board can sit stale until
      // the NEXT push arrives.
      handlerRef.current(["appointments", "live"]);
      es.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as RealtimeFrame;
          const types = Array.isArray(data.types) ? (data.types as RealtimeType[]) : [];
          handlerRef.current(types);
        } catch {
          /* ignore malformed frames */
        }
      };
      es.onerror = () => {
        const now = Date.now();
        if (now - windowStart > 30000) {
          errCount = 0;
          windowStart = now;
        }
        errCount += 1;
        if (errCount === 3 && probeRef.current) {
          void apiFetch(probeRef.current)
            .then((res) => {
              errCount = 0;
              if (!res.ok && typeof window !== "undefined") window.location.href = "/login";
            })
            .catch(() => {
              /* network blip — EventSource keeps retrying */
            });
        }
      };
    };

    const onVisibility = () => {
      if (cancelled) return;
      if (document.hidden) {
        es?.close();
        es = null;
        return;
      }
      open();
      // Just came back (or first open): catch up on anything pushed away.
      handlerRef.current(["appointments", "live"]);
    };

    open();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      es?.close();
      es = null;
    };
  }, [enabled, url]);
}
