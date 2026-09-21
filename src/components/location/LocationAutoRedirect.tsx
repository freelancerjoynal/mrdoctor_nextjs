"use client";

import { useEffect, useRef, useState } from "react";
import {
  goToLocation,
  readLocationCookie,
  reverseGeocode,
  useMounted,
  writeLocationCookie,
  type GeoHit,
} from "@/lib/locationClient";
import { LocationPickerFields } from "@/components/location/LocationPickerFields";
import { LocationModal } from "@/components/location/LocationModal";

/**
 * Main-domain location gate: the picker popup is ALWAYS shown (whether GPS
 * detects the area or not) until the visitor explicitly closes it.
 * A silent GPS attempt runs in the background — on success it surfaces a
 * one-tap suggestion at the top, but never redirects on its own.
 * Close (✕) = 7-day skip cookie; picking an area = 1-year cookie + redirect.
 */
export function LocationAutoRedirect() {
  // Mount-gated render (SSR emits nothing → no hydration mismatch).
  const mounted = useMounted();
  // Initializer-driven (no setState inside effects): popup shows when no
  // location cookie exists; spinner shows when GPS is available to try.
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && !readLocationCookie(),
  );
  const [detecting, setDetecting] = useState(
    () =>
      typeof window !== "undefined" &&
      "geolocation" in navigator &&
      !readLocationCookie(),
  );
  const [suggestion, setSuggestion] = useState<GeoHit | null>(null);
  const tried = useRef(false);

  useEffect(() => {
    if (!visible || tried.current) return;
    tried.current = true;
    if (!("geolocation" in navigator)) return;
    let alive = true;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const hit = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (alive && hit) setSuggestion(hit);
        } catch {
          // no suggestion — manual picker stays
        } finally {
          if (alive) setDetecting(false);
        }
      },
      () => {
        if (alive) setDetecting(false);
      },
      { timeout: 15000 },
    );
    return () => {
      alive = false;
    };
  }, [visible]);

  if (!mounted || !visible) return null;

  const close = () => {
    writeLocationCookie("skip", 7);
    setVisible(false);
  };

  return (
    <LocationModal
      title="📍 আপনার এলাকা বেছে নিন"
      subtitle="Where are you looking for a doctor? জেলা ও উপজেলা সিলেক্ট করুন — সরাসরি সেই এলাকার ডাক্তার ও হাসপাতালের পোর্টালে নিয়ে যাওয়া হবে।"
      onClose={close}
    >
      {detecting ? (
        <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-center text-xs font-bold text-amber-700 ring-1 ring-amber-200">
          🛰️ আপনার অবস্থান শনাক্ত করা হচ্ছে…
        </p>
      ) : null}
      {suggestion ? (
        <button
          onClick={() => goToLocation(suggestion.slug, false)}
          className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700"
        >
          ✅ {suggestion.slug} পোর্টালে যান →
        </button>
      ) : null}

      <div className="mt-3">
        <LocationPickerFields tone="light" />
      </div>
    </LocationModal>
  );
}
