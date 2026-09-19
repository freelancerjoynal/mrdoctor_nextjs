"use client";

import { useEffect, useRef, useState } from "react";
import {
  goToLocation,
  readLocationCookie,
  reverseGeocode,
  writeLocationCookie,
  type GeoHit,
} from "@/lib/locationClient";
import { LocationPickerFields } from "@/components/location/LocationPickerFields";

/**
 * Main-domain location gate: the picker popup is ALWAYS shown (whether GPS
 * detects the area or not) until the visitor explicitly closes it.
 * A silent GPS attempt runs in the background — on success it surfaces a
 * one-tap suggestion at the top, but never redirects on its own.
 * Close (✕) = 7-day skip cookie; picking an area = 1-year cookie + redirect.
 */
export function LocationAutoRedirect() {
  // Mount-gated render (SSR emits nothing → no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [suggestion, setSuggestion] = useState<GeoHit | null>(null);
  const tried = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (readLocationCookie() || tried.current) return;
    tried.current = true;
    // Popup shows regardless — GPS just adds a shortcut when it hits.
    setVisible(true);
    if (!("geolocation" in navigator)) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const hit = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (hit) setSuggestion(hit);
        } catch {
          // no suggestion — manual picker stays
        } finally {
          setDetecting(false);
        }
      },
      () => setDetecting(false),
      { timeout: 15000 },
    );
  }, []);

  if (!mounted || !visible) return null;

  const close = () => {
    writeLocationCookie("skip", 7);
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-950 p-5 text-white shadow-2xl ring-1 ring-white/15 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <p className="font-black">🩺 ডাক্তার কোথায় খুঁজছেন?</p>
          <button
            onClick={close}
            aria-label="বন্ধ করুন"
            className="rounded-lg px-2 py-0.5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-white/60">
          Where are you looking for a doctor? এলাকা বাছুন — সরাসরি ওই এলাকার ডাক্তার ও
          হাসপাতালের পোর্টালে নিয়ে যাওয়া হবে।
        </p>

        {detecting ? (
          <p className="mt-3 rounded-xl bg-white/5 px-4 py-2.5 text-center text-xs font-bold text-white/60 ring-1 ring-white/10">
            🛰️ আপনার অবস্থান শনাক্ত করা হচ্ছে…
          </p>
        ) : null}
        {suggestion ? (
          <button
            onClick={() => goToLocation(suggestion.slug, suggestion.districtWide)}
            className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black hover:bg-emerald-400"
          >
            ✅ {suggestion.slug} পোর্টালে যান →
          </button>
        ) : null}

        <div className="mt-3">
          <LocationPickerFields />
        </div>
      </div>
    </div>
  );
}
