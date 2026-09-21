import rawLocations from "./locations.json";
import { DIVISIONS } from "./areas";

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
const DISTRICT_BN: Record<string, string> = {  Rangpur: "রংপুর",
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

/* ------------------------------------------------------------------ */
/* Full-country thana coverage (every location = a thana portal).      */
/*                                                                     */
/* `locations.json` only carries precise English names for Rangpur, so */
/* every other division/district/thana from `areas.ts` (Bangla, the    */
/* same strings chambers store) is added here. District slugs use      */
/* official English spellings; thana slugs use them when known, else a */
/* deterministic Bangla→Latin transliteration. Slug generation is the  */
/* single source of truth — portal links and middleware resolution     */
/* both go through it, so they can never drift apart.                  */
/* ------------------------------------------------------------------ */

/** Bangla division → official English division. */
const DIVISION_EN: Record<string, string> = {
  ঢাকা: "Dhaka",
  চট্টগ্রাম: "Chattogram",
  রাজশাহী: "Rajshahi",
  খুলনা: "Khulna",
  বরিশাল: "Barishal",
  সিলেট: "Sylhet",
  রংপুর: "Rangpur",
  ময়মনসিংহ: "Mymensingh",
};

/** Bangla district → official English district (all 64). */
const DISTRICT_EN: Record<string, string> = {
  ঢাকা: "Dhaka",
  গাজীপুর: "Gazipur",
  নারায়ণগঞ্জ: "Narayanganj",
  মুন্সিগঞ্জ: "Munshiganj",
  মানিকগঞ্জ: "Manikganj",
  নরসিংদী: "Narsingdi",
  টাঙ্গাইল: "Tangail",
  কিশোরগঞ্জ: "Kishoreganj",
  ফরিদপুর: "Faridpur",
  গোপালগঞ্জ: "Gopalganj",
  মাদারীপুর: "Madaripur",
  রাজবাড়ী: "Rajbari",
  শরীয়তপুর: "Shariatpur",
  চট্টগ্রাম: "Chattogram",
  কক্সবাজার: "Coxsbazar",
  কুমিল্লা: "Cumilla",
  ব্রাহ্মণবাড়িয়া: "Brahmanbaria",
  চাঁদপুর: "Chandpur",
  লক্ষ্মীপুর: "Lakshmipur",
  নোয়াখালী: "Noakhali",
  ফেনী: "Feni",
  খাগড়াছড়ি: "Khagrachhari",
  রাঙ্গামাটি: "Rangamati",
  বান্দরবান: "Bandarban",
  বগুড়া: "Bogura",
  জয়পুরহাট: "Joypurhat",
  নওগাঁ: "Naogaon",
  নাটোর: "Natore",
  চাঁপাইনবাবগঞ্জ: "Chapainawabganj",
  পাবনা: "Pabna",
  রাজশাহী: "Rajshahi",
  সিরাজগঞ্জ: "Sirajganj",
  বাগেরহাট: "Bagerhat",
  চুয়াডাঙ্গা: "Chuadanga",
  যশোর: "Jashore",
  ঝিনাইদহ: "Jhenaidah",
  খুলনা: "Khulna",
  কুষ্টিয়া: "Kushtia",
  মাগুরা: "Magura",
  মেহেরপুর: "Meherpur",
  নড়াইল: "Narail",
  সাতক্ষীরা: "Satkhira",
  বরগুনা: "Barguna",
  বরিশাল: "Barishal",
  ভোলা: "Bhola",
  ঝালকাঠি: "Jhalokati",
  পটুয়াখালী: "Patuakhali",
  পিরোজপুর: "Pirojpur",
  হবিগঞ্জ: "Habiganj",
  মৌলভীবাজার: "Moulvibazar",
  সুনামগঞ্জ: "Sunamganj",
  সিলেট: "Sylhet",
  দিনাজপুর: "Dinajpur",
  গাইবান্ধা: "Gaibandha",
  কুড়িগ্রাম: "Kurigram",
  লালমনিরহাট: "Lalmonirhat",
  নীলফামারী: "Nilphamari",
  পঞ্চগড়: "Panchagarh",
  রংপুর: "Rangpur",
  ঠাকুরগাঁও: "Thakurgaon",
  জামালপুর: "Jamalpur",
  ময়মনসিংহ: "Mymensingh",
  নেত্রকোণা: "Netrokona",
  শেরপুর: "Sherpur",
};

/** Base Latin for each Bangla letter / vowel sign (no inherent vowel). */
const BN_LATIN: Record<string, string> = {
  অ: "a",
  আ: "a",
  ই: "i",
  ঈ: "i",
  উ: "u",
  ঊ: "u",
  ঋ: "ri",
  এ: "e",
  ঐ: "oi",
  ও: "o",
  ঔ: "ou",
  ক: "k",
  খ: "kh",
  গ: "g",
  ঘ: "gh",
  ঙ: "ng",
  চ: "c",
  ছ: "ch",
  জ: "j",
  ঝ: "jh",
  ঞ: "n",
  ট: "t",
  ঠ: "th",
  ড: "d",
  ঢ: "dh",
  ণ: "n",
  ত: "t",
  থ: "th",
  দ: "d",
  ধ: "dh",
  ন: "n",
  প: "p",
  ফ: "ph",
  ব: "b",
  ভ: "bh",
  ম: "m",
  য: "y",
  র: "r",
  ল: "l",
  শ: "sh",
  ষ: "sh",
  স: "s",
  হ: "h",
  ড়: "r",
  ঢ়: "rh",
  য়: "y",
  "ৎ": "t",
  "ং": "ng",
  "ঃ": "h",
  "ঁ": "n",
  "া": "a",
  "ি": "i",
  "ী": "i",
  "ু": "u",
  "ূ": "u",
  "ৃ": "ri",
  "ে": "e",
  "ৈ": "oi",
  "ো": "o",
  "ৌ": "ou",
  "্": "",
  "়": "",
};

const BN_CONSONANT = new Set(
  "কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ৎ".split(""),
);
/** Followers that keep the inherent "a" on the preceding consonant. */
const BN_INHERENT_A_FOLLOWER = new Set([...BN_CONSONANT, "ং", "ঃ", "ঁ", "ৎ"]);

/** Deterministic Bangla → Latin (handles the inherent "a" vowel). */
export function transliterateBn(word: string): string {
  const chars = word.split("");
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    const latin = BN_LATIN[ch];
    if (latin === undefined) continue;
    if (latin === "") continue;
    out += latin;
    // Inherent "a": consonant followed by another consonant mid-word.
    if (BN_CONSONANT.has(ch)) {
      const next = chars[i + 1];
      if (next && BN_INHERENT_A_FOLLOWER.has(next)) out += "a";
    }
  }
  return out;
}

/** "নীলফামারী সদর" → "nilphamari" (Sadar stripped, like the English rule). */
export function bnThanaSlug(thanaBn: string): string {
  const base = thanaBn.replace(/\s*সদর\s*$/u, "").trim() || thanaBn.trim();
  return locationSlug(transliterateBn(base));
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Merge full-country thanas into the table (Rangpur precise rows win).
{
  const seen = new Set(
    LOCATION_TABLE.map((r) => `${r.districtBn}|${r.thanaBn}`),
  );
  for (const div of DIVISIONS) {
    const divisionEn = DIVISION_EN[div.name] ?? div.name;
    const divisionBn = div.name;
    for (const dist of div.districts) {
      const districtEn = DISTRICT_EN[dist.name] ?? dist.name;
      for (const thanaBn of dist.thanas) {
        if (seen.has(`${dist.name}|${thanaBn}`)) continue;
        seen.add(`${dist.name}|${thanaBn}`);
        const isSadar = /\s*সদর\s*$/u.test(thanaBn);
        const slug = isSadar
          ? locationSlug(districtEn)
          : bnThanaSlug(thanaBn) || locationSlug(districtEn);
        LOCATION_TABLE.push({
          slug,
          divisionEn,
          divisionBn,
          districtEn,
          districtBn: dist.name,
          upazilaEn: isSadar ? `${districtEn} Sadar` : titleCase(slug),
          thanaBn,
        });
      }
    }
  }
}

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
  const row =
    LOCATION_TABLE.find(
      (r) => r.districtEn === districtEn && r.upazilaEn === `${districtEn} Sadar`,
    ) ?? LOCATION_TABLE.find((r) => r.districtEn === districtEn);
  return row?.slug ?? null;
}

/**
 * Bangla thana → portal slug (for AreaExplorer / nearby-thana links).
 * Pass districtBn too when a thana name repeats across districts —
 * the slug is shared, so either match works.
 */
export function slugForBanglaThana(thanaBn: string, districtBn?: string): string | null {
  const t = thanaBn.trim();
  const row =
    (districtBn
      ? LOCATION_TABLE.find((r) => r.thanaBn === t && r.districtBn === districtBn.trim())
      : undefined) ?? LOCATION_TABLE.find((r) => r.thanaBn === t);
  return row?.slug ?? null;
}

/** Bangla district → district-wide portal slug (`?scope=district`). */
export function slugForBanglaDistrict(districtBn: string): string | null {
  const t = districtBn.trim();
  // Prefer the Sadar thana's slug (it doubles as the district portal);
  // districts without a Sadar thana (e.g. Dhaka) fall back to any thana —
  // callers pair it with `?scope=district`, which ignores the thana.
  const row =
    LOCATION_TABLE.find((r) => r.districtBn === t && r.thanaBn === `${t} সদর`) ??
    LOCATION_TABLE.find((r) => r.districtBn === t);
  return row?.slug ?? null;
}

/** All thanas of a Bangla district (for "nearby thanas" on the portal). */
export function thanasOfDistrict(districtBn: string): LocationMatch[] {
  const t = districtBn.trim();
  const seen = new Set<string>();
  return LOCATION_TABLE.filter((r) => {
    if (r.districtBn !== t) return false;
    if (seen.has(r.thanaBn)) return false;
    seen.add(r.thanaBn);
    return true;
  });
}

/** Bangla district → official English district (for bilingual search/labels). */
export function districtEnFor(districtBn: string): string | null {
  const row = LOCATION_TABLE.find((r) => r.districtBn === districtBn.trim());
  return row?.districtEn ?? DISTRICT_EN[districtBn.trim()] ?? null;
}

/** Bangla division → official English division (for bilingual search/labels). */
export function divisionEnFor(divisionBn: string): string | null {
  const row = LOCATION_TABLE.find((r) => r.divisionBn === divisionBn.trim());
  return row?.divisionEn ?? DIVISION_EN[divisionBn.trim()] ?? null;
}
