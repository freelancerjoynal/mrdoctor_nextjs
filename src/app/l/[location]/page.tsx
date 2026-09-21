import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getLocationBySlug, allLocationSlugs } from "@/lib/locationSlugs";
import { getRootDomain } from "@/lib/subdomain";
import { buildPortalUrl } from "@/lib/portal";
import {
  fetchPageSeo,
  buildPageMetadata,
  portalWebsiteJsonLd,
  withExtra,
  JsonLd,
} from "@/lib/seo";
import {
  LocationSite,
  type LocationDoctor,
  type LocationHospital,
  type LocationPortalSetting,
  type PortalCategory,
} from "@/components/sites/LocationSite";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

interface LocationParams {
  location: string;
}

interface PortalResponse {
  data?: {
    categories?: PortalCategory[];
    doctors?: LocationDoctor[];
    doctorsTotal?: number;
    hospitals?: LocationHospital[];
    hospitalsTotal?: number;
    chambers?: number;
  };
}

/**
 * Thana portal route — its own folder (`app/l/[location]`), separate
 * from the profile portals (`app/s/[subdomain]`).
 * Every location is a thana: `<slug>.domain.com` lists the categories
 * (specialities from chambers in this thana) plus doctors & hospitals.
 * Middleware rewrites here as `/l/<slug>`. Also directly visitable on
 * the apex: `domain.com/l/saidpur`.
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
  const key = location.trim().toLowerCase();
  const seo = await fetchPageSeo("LOCATION", key);
  return buildPageMetadata(seo, {
    defaultTitle: `${primary.thanaBn} — ডাক্তার ও হাসপাতাল`,
    defaultDescription: `${primary.thanaBn} (${primary.districtBn} জেলা) এলাকার যাচাইকৃত ডাক্তার, বিভাগ, চেম্বার ও হাসপাতাল — অনলাইনে ফ্রি সিরিয়াল নিন।`,
    // Primary URL is the thana subdomain portal (avoids /l/* duplication).
    canonical: `https://${key}.${getRootDomain()}/`,
    ogImage: "/logo-main.png",
    // Individual website name for this thana portal.
    siteName: `${primary.thanaBn} · মিস্টার ডাক্তার`,
  });
}

async function fetchPortal(
  divisionBn: string,
  districtBn: string,
  thanaBn: string,
): Promise<PortalResponse["data"] | null> {
  // Strict thana-by-thana: district + thana always filter together, so a
  // chamber from another thana can never leak into this portal — even
  // within the same district.
  const q = new URLSearchParams({ limit: "100" });
  if (divisionBn) q.set("division", divisionBn);
  if (districtBn) q.set("district", districtBn);
  if (thanaBn) q.set("thana", thanaBn);
  try {
    const res = await fetch(`${BACKEND_URL}/api/website/portal?${q.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as PortalResponse;
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function LocationPage({
  params,
}: {
  params: Promise<LocationParams>;
}) {
  const { location } = await params;
  const matches = getLocationBySlug(location);
  if (matches.length === 0) notFound();

  // Strict thana-by-thana: one filtered query per (district, thana) pair,
  // then merge + dedupe. (Slugs like "pirganj"/"phulbari" exist in two
  // districts — both thanas merge, never the whole district.)
  const doctorsByKey = new Map<string, LocationDoctor>();
  const hospitalsByKey = new Map<string, LocationHospital>();
  const categoryCounts = new Map<string, number>();
  let chambers = 0;
  let doctorsTotal = 0;
  let hospitalsTotal = 0;

  // One portal query per (district, thana) pair, then merge + dedupe.
  const seenPair = new Set<string>();
  for (const m of matches) {
    const pairKey = `${m.districtBn}|${m.thanaBn}`;
    if (seenPair.has(pairKey)) continue;
    seenPair.add(pairKey);
    const portal = await fetchPortal(m.divisionBn, m.districtBn, m.thanaBn);
    if (!portal) continue;
    for (const d of portal.doctors ?? []) {
      if (d?.username && !doctorsByKey.has(d.username)) doctorsByKey.set(d.username, d);
    }
    for (const h of portal.hospitals ?? []) {
      if (h?.slug && !hospitalsByKey.has(h.slug)) hospitalsByKey.set(h.slug, h);
    }
    for (const c of portal.categories ?? []) {
      if (!c?.speciality) continue;
      categoryCounts.set(c.speciality, (categoryCounts.get(c.speciality) ?? 0) + c.doctors);
    }
    chambers += portal.chambers ?? 0;
    doctorsTotal += portal.doctorsTotal ?? 0;
    hospitalsTotal += portal.hospitalsTotal ?? 0;
  }

  const categories: PortalCategory[] = [...categoryCounts.entries()]
    .map(([speciality, doctors]) => ({ speciality, doctors }))
    .sort((a, b) => b.doctors - a.doctors);

  // Super-admin customization for this portal (null = defaults).
  let setting: LocationPortalSetting | null = null;
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/website/portal-settings/${encodeURIComponent(location.toLowerCase())}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const json = (await res.json()) as { data?: LocationPortalSetting | null };
      setting = json.data ?? null;
    }
  } catch {
    setting = null;
  }

  const host = (await headers()).get("host") ?? "";
  const key = location.trim().toLowerCase();
  const portalUrl = `https://${key}.${getRootDomain()}/`;
  const doctors = [...doctorsByKey.values()];
  const hospitals = [...hospitalsByKey.values()];
  const seo = await fetchPageSeo("LOCATION", key);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${matches[0]!.thanaBn} — ডাক্তার ও হাসপাতাল`,
    itemListElement: [
      ...doctors.slice(0, 10).map((d, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Physician",
          name: d.name,
          medicalSpecialty: d.speciality,
          url: buildPortalUrl(d.username, host),
        },
      })),
      ...hospitals.slice(0, 10).map((h, i) => ({
        "@type": "ListItem",
        position: doctors.slice(0, 10).length + i + 1,
        item: {
          "@type": "Hospital",
          name: h.name,
          url: buildPortalUrl(h.slug, host),
        },
      })),
    ],
  };
  const schemas = withExtra(seo, [
    // Individual-website schema for this thana portal.
    portalWebsiteJsonLd({
      name: seo?.siteName?.trim() || `${matches[0]!.thanaBn} · মিস্টার ডাক্তার`,
      url: portalUrl,
      description: `${matches[0]!.thanaBn} এলাকার যাচাইকৃত ডাক্তার, চেম্বার ও হাসপাতাল — অনলাইনে ফ্রি সিরিয়াল।`,
    }),
    itemList,
  ]);
  return (
    <>
      {schemas.map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}
      <LocationSite
        matches={matches}
        doctors={doctors}
        hospitals={hospitals}
        categories={categories}
        chambers={chambers}
        doctorsTotal={doctorsTotal}
        hospitalsTotal={hospitalsTotal}
        host={host}
        setting={setting}
        h1={seo?.h1?.trim() || null}
      />
    </>
  );
}
