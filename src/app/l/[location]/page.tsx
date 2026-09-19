import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getLocationBySlug, allLocationSlugs } from "@/lib/locationSlugs";
import {
  LocationSite,
  type LocationDoctor,
  type LocationHospital,
} from "@/components/sites/LocationSite";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

interface LocationParams {
  location: string;
}

/**
 * Location portal route — its own folder (`app/l/[location]`), separate
 * from the profile portals (`app/s/[subdomain]`).
 * Public URL stays `<slug>.domain.com`, middleware rewrites here as
 * `/l/<slug>`. Also directly visitable on the apex: `domain.com/l/saidpur`.
 */
export async function generateStaticParams(): Promise<LocationParams[]> {
  return allLocationSlugs().map((location) => ({ location }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LocationParams>;
}): Promise<Metadata> {
  const { location } = await params;
  const matches = getLocationBySlug(location);
  if (matches.length === 0) return { title: "এলাকা পাওয়া যায়নি" };
  const primary = matches[0]!;
  return {
    title: `${primary.thanaBn} — ডাক্তার ও হাসপাতাল`,
    description: `${primary.thanaBn} (${primary.upazilaEn}, ${primary.districtEn}) এলাকার ডাক্তার ও হাসপাতালের তালিকা।`,
  };
}

async function fetchList(path: string): Promise<{ data?: unknown[] }> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return {};
    return (await res.json()) as { data?: unknown[] };
  } catch {
    return {};
  }
}

export default async function LocationPage({
  params,
  searchParams,
}: {
  params: Promise<LocationParams>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { location } = await params;
  const { scope } = await searchParams;
  const matches = getLocationBySlug(location);
  if (matches.length === 0) notFound();

  // `?scope=district` → whole-district portal (thana skipped);
  // default → single-upazila portal (district + thana filter per match).
  // (Slugs like "pirganj"/"phulbari" exist in two districts — merge both.)
  const districtWide = scope === "district";
  const doctorsByKey = new Map<string, LocationDoctor>();
  const hospitalsByKey = new Map<string, LocationHospital>();

  if (districtWide) {
    const districtBn = matches[0]!.districtBn;
    const q = `district=${encodeURIComponent(districtBn)}&limit=50`;
    const [dJson, hJson] = await Promise.all([
      fetchList(`/api/website/doctors?${q}`),
      fetchList(`/api/website/hospitals?${q}`),
    ]);
    for (const d of (dJson.data ?? []) as LocationDoctor[]) {
      if (d?.username && !doctorsByKey.has(d.username)) doctorsByKey.set(d.username, d);
    }
    for (const h of (hJson.data ?? []) as LocationHospital[]) {
      if (h?.slug && !hospitalsByKey.has(h.slug)) hospitalsByKey.set(h.slug, h);
    }
  } else {
    // One filtered query per (district, thana) pair, then merge + dedupe.
    for (const m of matches) {
      const q = `district=${encodeURIComponent(m.districtBn)}&thana=${encodeURIComponent(m.thanaBn)}&limit=50`;
      const [dJson, hJson] = await Promise.all([
        fetchList(`/api/website/doctors?${q}`),
        fetchList(`/api/website/hospitals?${q}`),
      ]);
      for (const d of (dJson.data ?? []) as LocationDoctor[]) {
        if (d?.username && !doctorsByKey.has(d.username)) doctorsByKey.set(d.username, d);
      }
      for (const h of (hJson.data ?? []) as LocationHospital[]) {
        if (h?.slug && !hospitalsByKey.has(h.slug)) hospitalsByKey.set(h.slug, h);
      }
    }
  }

  const host = (await headers()).get("host") ?? "";
  return (
    <LocationSite
      matches={matches}
      doctors={[...doctorsByKey.values()]}
      hospitals={[...hospitalsByKey.values()]}
      host={host}
      districtWide={districtWide}
    />
  );
}
