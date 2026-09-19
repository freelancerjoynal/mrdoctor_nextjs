"use client";

import { matchPlace } from "@/lib/locationSlugs";
import { buildPortalUrl } from "@/lib/portal";

/** Shared browser helpers for the location portals (prompt + switcher). */
export const LOCATION_COOKIE = "md_location";

export function readLocationCookie(): string | null {
  const m = document.cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${LOCATION_COOKIE}=`));
  return m ? decodeURIComponent(m.slice(LOCATION_COOKIE.length + 1)) : null;
}

export function writeLocationCookie(value: string, days: number) {
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${LOCATION_COOKIE}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
}

export interface GeoHit {
  slug: string;
  districtWide: boolean;
}

/** Browser GPS → free reverse-geocode → nearest location slug. */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoHit | null> {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
  );
  const json = (await res.json()) as {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
  };
  const candidates = [json.city, json.locality, json.principalSubdivision].filter(Boolean) as string[];
  for (const c of candidates) {
    const hit = matchPlace(c);
    if (hit) return hit;
  }
  return null;
}

/** Save choice + redirect to the area subdomain portal. */
export function goToLocation(slug: string, districtWide = false) {
  writeLocationCookie(districtWide ? `${slug}?scope=district` : slug, 365);
  window.location.href = buildPortalUrl(slug) + (districtWide ? "?scope=district" : "");
}
