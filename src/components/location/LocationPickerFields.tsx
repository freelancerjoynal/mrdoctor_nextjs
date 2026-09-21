"use client";

import { useMemo, useState } from "react";
import { LOCATION_TABLE, districtSlug } from "@/lib/locationSlugs";
import { goToLocation, reverseGeocode, type GeoHit } from "@/lib/locationClient";

/**
 * Shared location picker fields — same behaviour everywhere:
 * GPS auto-detect (with one-tap suggestion) + district → upazila selects
 * (district alone = whole-district portal, thana skipped).
 * Used by the homepage LocationPrompt and the portal LocationSwitcher.
 * `tone="dark"` (default) for dark cards, `tone="light"` for white cards.
 */
export function LocationPickerFields({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const light = tone === "light";
  const [districtEn, setDistrictEn] = useState("");
  const [upazilaEn, setUpazilaEn] = useState("");
  const [gpsState, setGpsState] = useState<"idle" | "locating" | "failed">("idle");
  const [suggestion, setSuggestion] = useState<GeoHit | null>(null);

  const districts = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of LOCATION_TABLE) {
      if (!seen.has(r.districtEn)) seen.set(r.districtEn, r.districtBn);
    }
    return [...seen.entries()].map(([en, bn]) => ({ en, bn }));
  }, []);

  const upazilas = useMemo(
    () => LOCATION_TABLE.filter((r) => r.districtEn === districtEn),
    [districtEn],
  );

  const pickDistrict = (en: string) => {
    setDistrictEn(en);
    setUpazilaEn("");
    setSuggestion(null);
  };

  const confirmManual = () => {
    if (!districtEn) return;
    if (upazilaEn) {
      const row = upazilas.find((r) => r.upazilaEn === upazilaEn);
      if (row) goToLocation(row.slug, false);
      return;
    }
    // District alone → its Sadar thana portal (strict thana-by-thana;
    // there is no district-wide view).
    const slug = districtSlug(districtEn);
    if (slug) goToLocation(slug, false);
  };

  const autoDetect = () => {
    if (!("geolocation" in navigator)) {
      setGpsState("failed");
      return;
    }
    setGpsState("locating");
    setSuggestion(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const hit = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (hit) {
            setSuggestion(hit);
            setGpsState("idle");
            return;
          }
        } catch {
          // fall through
        }
        setGpsState("failed");
      },
      () => setGpsState("failed"),
      { timeout: 15000 },
    );
  };

  return (
    <div>
      <button
        onClick={autoDetect}
        disabled={gpsState === "locating"}
        className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-400 disabled:opacity-60"
      >
        {gpsState === "locating" ? "🛰️ অবস্থান খোঁজা হচ্ছে…" : "🛰️ অটো-ডিটেক্ট (GPS)"}
      </button>

      {suggestion ? (
        <button
          onClick={() => goToLocation(suggestion.slug, false)}
          className={
            light
              ? "mt-2 w-full rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-900 ring-1 ring-emerald-200 hover:bg-emerald-100"
              : "mt-2 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-900 hover:bg-emerald-100"
          }
        >
          ✅ {suggestion.slug} পোর্টালে যান →
        </button>
      ) : null}
      {gpsState === "failed" ? (
        <p className={`mt-2 text-xs font-bold ${light ? "text-amber-600" : "text-amber-300"}`}>
          GPS থেকে এলাকা চেনা যায়নি — নিচে থেকে বেছে নিন।
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <select
          value={districtEn}
          onChange={(e) => pickDistrict(e.target.value)}
          className={
            light
              ? "rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 ring-1 ring-slate-200 focus:outline-none"
              : "rounded-xl bg-white/10 px-3 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 focus:outline-none"
          }
        >
          <option value="">জেলা…*</option>
          {districts.map((d) => (
            <option key={d.en} value={d.en} className="text-slate-900">
              {d.bn} ({d.en})
            </option>
          ))}
        </select>
        <select
          value={upazilaEn}
          onChange={(e) => setUpazilaEn(e.target.value)}
          disabled={!districtEn}
          className={
            light
              ? "rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 ring-1 ring-slate-200 focus:outline-none disabled:opacity-50"
              : "rounded-xl bg-white/10 px-3 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 focus:outline-none disabled:opacity-50"
          }
        >
          <option value="">উপজেলা (ঐচ্ছিক)</option>
          {upazilas.map((u) => (
            <option key={u.upazilaEn} value={u.upazilaEn} className="text-slate-900">
              {u.thanaBn}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={confirmManual}
        disabled={!districtEn}
        className={
          light
            ? "mt-2 w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-50"
            : "mt-2 w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm font-black text-white ring-1 ring-white/15 hover:bg-white/20 disabled:opacity-50"
        }
      >
        {upazilaEn ? "থানা পোর্টালে যান →" : "সদর থানার পোর্টালে যান →"}
      </button>
    </div>
  );
}
