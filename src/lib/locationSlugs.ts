import rawLocations from "./locations.json";

/**
 * Location → subdomain slug system.
 *
 * Source: `locations.json` (English division > district > upazila tree).
 * Slug rule (user requirement): strip a trailing "Sadar" and slugify —
 *   "Nilphamari Sadar" → "nilphamari", "Saidpur" → "saidpur".
 * Same rule applies to every upazila, so the district name always equals
 * its Sadar upazila's slug ("Nilphamari" district head → "nilphamari").
 *
 * Bangla names (for DB chamber filtering) come from `areas.ts` — chambers
 * store division/district/thana in Bangla.
 */

export interface LocationMatch {
  /** URL slug, e.g. "nilphamari" */
  slug: string;
  divisionEn: string;
  divisionBn: string;
  districtEn: string;
  districtBn: string;
  /** English upazila as in locations.json, e.g. "Nilphamari Sadar" */
  upazilaEn: string;
  /** Bangla thana as stored in chambers, e.g. "নীলফামারী সদর" */
  thanaBn: string;
}

/** "Nilphamari Sadar" → "nilphamari"; "Ranishankail" → "ranishankail". */
export function locationSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\bsadar\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** English district → Bangla district (Rangpur division, cf. areas.ts). */
const DISTRICT_BN: Record<string, string> = {
  Rangpur: "রংপুর",
  Panchagarh: "পঞ্চগড়",
  Thakurgaon: "ঠাকুরগাঁও",
  Nilphamari: "নীলফামারী",
  Lalmonirhat: "লালমনিরহাট",
  Gaibandha: "গাইবান্ধা",
  Kurigram: "কুড়িগ্রাম",
  Dinajpur: "দিনাজপুর",
};

/** "District|UpazilaEn" → Bangla thana (cf. areas.ts thana lists). */
const THANAS_BN: Record<string, string> = {
  "Rangpur|Mithapukur": "মিঠাপুকুর",
  "Rangpur|Taraganj": "তারাগঞ্জ",
  "Rangpur|Badarganj": "বদরগঞ্জ",
  "Rangpur|Pirganj": "পীরগঞ্জ",
  "Rangpur|Pirgacha": "পীরগাছা",
  "Rangpur|Gangachara": "গংগাচড়া",
  "Rangpur|Kaunia": "কাউনিয়া",
  "Rangpur|Rangpur Sadar": "রংপুর সদর",
  "Panchagarh|Panchagarh Sadar": "পঞ্চগড় সদর",
  "Panchagarh|Tetulia": "তেঁতুলিয়া",
  "Panchagarh|Atwari": "আটোয়ারী",
  "Panchagarh|Debiganj": "দেবীগঞ্জ",
  "Panchagarh|Boda": "বোদা",
  "Thakurgaon|Thakurgaon Sadar": "ঠাকুরগাঁও সদর",
  "Thakurgaon|Ranishankail": "রাণীশংকৈল",
  "Thakurgaon|Baliadangi": "বালিয়াডাঙ্গী",
  "Thakurgaon|Haripur": "হরিপুর",
  "Thakurgaon|Pirganj": "পীরগঞ্জ",
  "Nilphamari|Dimla": "ডিমলা",
  "Nilphamari|Jaldhaka": "জলঢাকা",
  "Nilphamari|Saidpur": "সৈয়দপুর",
  "Nilphamari|Kishoreganj": "কিশোরগঞ্জ",
  "Nilphamari|Nilphamari Sadar": "নীলফামারী সদর",
  "Nilphamari|Domar": "ডোমার",
  "Lalmonirhat|Patgram": "পাটগ্রাম",
  "Lalmonirhat|Hatibandha": "হাতীবান্ধা",
  "Lalmonirhat|Lalmonirhat Sadar": "লালমনিরহাট সদর",
  "Lalmonirhat|Aditmari": "আদিতমারী",
  "Lalmonirhat|Kaliganj": "কালীগঞ্জ",
  "Gaibandha|Gobindaganj": "গোবিন্দগঞ্জ",
  "Gaibandha|Saghata": "সাঘাটা",
  "Gaibandha|Palashbari": "পলাশবাড়ী",
  "Gaibandha|Gaibandha Sadar": "গাইবান্ধা সদর",
  "Gaibandha|Sadullapur": "সাদুল্লাপুর",
  "Gaibandha|Sundarganj": "সুন্দরগঞ্জ",
  "Gaibandha|Fulchhari": "ফুলছড়ি",
  "Kurigram|Ulipur": "উলিপুর",
  "Kurigram|Phulbari": "ফুলবাড়ী",
  "Kurigram|Bhurungamari": "ভূরুঙ্গামারী",
  "Kurigram|Nageshwari": "নাগেশ্বরী",
  "Kurigram|Rajarhat": "রাজারহাট",
  "Kurigram|Rajibpur": "চর রাজিবপুর",
  "Kurigram|Kurigram Sadar": "কুড়িগ্রাম সদর",
  "Kurigram|Roumari": "রৌমারী",
  "Kurigram|Chilmari": "চিলমারী",
  "Dinajpur|Kaharole": "কাহারোল",
  "Dinajpur|Khansama": "খানসামা",
  "Dinajpur|Birganj": "বিরগঞ্জ",
  "Dinajpur|Chirirbandar": "চিরিরবন্দর",
  "Dinajpur|Birampur": "বিরামপুর",
  "Dinajpur|Ghoraghat": "ঘোড়াঘাট",
  "Dinajpur|Dinajpur Sadar": "দিনাজপুর সদর",
  "Dinajpur|Nawabganj": "নবাবগঞ্জ",
  "Dinajpur|Bochaganj": "বোচাগঞ্জ",
  "Dinajpur|Phulbari": "ফুলবাড়ী",
  "Dinajpur|Biral": "বীরাল",
  "Dinajpur|Parbatipur": "পার্বতীপুর",
  "Dinajpur|Hakimpur": "হাকিমপুর",
};

interface RawLocations {
  divisions: { division: string; districts: { district: string; upazilas: string[] }[] }[];
}

/** English division → Bangla division (only populated divisions mapped). */
const DIVISION_BN: Record<string, string> = { Rangpur: "রংপুর" };

function buildTable(): LocationMatch[] {
  const data = rawLocations as RawLocations;
  const out: LocationMatch[] = [];
  for (const div of data.divisions) {
    const divisionBn = DIVISION_BN[div.division] ?? div.division;
    for (const dist of div.districts ?? []) {
      const districtBn = DISTRICT_BN[dist.district] ?? dist.district;
      for (const upazila of dist.upazilas ?? []) {
        const thanaBn = THANAS_BN[`${dist.district}|${upazila}`] ?? upazila;
        out.push({
          slug: locationSlug(upazila),
          divisionEn: div.division,
          divisionBn,
          districtEn: dist.district,
          districtBn,
          upazilaEn: upazila,
          thanaBn,
        });
      }
    }
  }
  return out;
}

/** Every upazila entry (58 for Rangpur; grows as locations.json fills up). */
export const LOCATION_TABLE: LocationMatch[] = buildTable();

/** slug → all matching upazilas (usually 1; "pirganj"/"phulbari" match 2 districts). */
const bySlug = new Map<string, LocationMatch[]>();
for (const row of LOCATION_TABLE) {
  const list = bySlug.get(row.slug) ?? [];
  list.push(row);
  bySlug.set(row.slug, list);
}

/** Fast edge-safe membership test for the middleware. */
export const LOCATION_SLUG_SET: ReadonlySet<string> = new Set(bySlug.keys());

export function getLocationBySlug(slug: string): LocationMatch[] {
  return bySlug.get(slug.trim().toLowerCase()) ?? [];
}

export function allLocationSlugs(): string[] {
  return [...bySlug.keys()];
}

/** Fuzzy-match a free-text place name (e.g. from reverse-geocoding) to a slug. */
export function matchPlaceToSlug(place: string): string | null {
  return matchPlace(place)?.slug ?? null;
}

/**
 * Fuzzy-match with granularity: upazila hits are thana-scoped,
 * district-only hits are district-wide (`?scope=district`).
 */
export function matchPlace(place: string): { slug: string; districtWide: boolean } | null {
  const norm = place.trim().toLowerCase();
  if (!norm) return null;
  // Exact upazila / district English name match first.
  for (const row of LOCATION_TABLE) {
    if (row.upazilaEn.toLowerCase() === norm) return { slug: row.slug, districtWide: false };
    if (row.districtEn.toLowerCase() === norm) return { slug: row.slug, districtWide: true };
  }
  // Contains-match (e.g. "Saidpur Upazila" → saidpur).
  for (const row of LOCATION_TABLE) {
    if (norm.includes(row.upazilaEn.toLowerCase()) || row.upazilaEn.toLowerCase().includes(norm)) {
      return { slug: row.slug, districtWide: false };
    }
  }
  for (const row of LOCATION_TABLE) {
    if (norm.includes(row.districtEn.toLowerCase()) || row.districtEn.toLowerCase().includes(norm)) {
      return { slug: row.slug, districtWide: true };
    }
  }
  return null;
}

/** District's Sadar slug doubles as the district-wide portal slug. */
export function districtSlug(districtEn: string): string | null {
  const row = LOCATION_TABLE.find(
    (r) => r.districtEn === districtEn && r.upazilaEn === `${districtEn} Sadar`,
  );
  return row?.slug ?? null;
}
