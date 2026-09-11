import { DIVISIONS } from "./areas";

export interface ThanaNode {
  thana: string;
  chambers: number;
  doctors: number;
  hospitals: number;
}

export interface DistrictNode {
  district: string;
  chambers: number;
  doctors: number;
  hospitals: number;
  thanas: ThanaNode[];
}

export interface DivisionNode {
  division: string;
  chambers: number;
  doctors: number;
  hospitals: number;
  districts: DistrictNode[];
}

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/** Static fallback so the homepage stays alive when the backend is down. */
function fallbackTree(): DivisionNode[] {
  return DIVISIONS.map((d) => ({
    division: d.name,
    chambers: 0,
    doctors: 0,
    hospitals: 0,
    districts: d.districts.map((x) => ({
      district: x.name,
      chambers: 0,
      doctors: 0,
      hospitals: 0,
      thanas: x.thanas.map((t) => ({ thana: t, chambers: 0, doctors: 0, hospitals: 0 })),
    })),
  }));
}

/**
 * Division > District > Thana tree, derived from chambers in the database
 * (single source of truth — includes hospital chambers via hospitalId).
 * Note: the Hospital table itself has no district/thana columns; a
 * hospital's location comes through its chambers.
 */
export async function getLocationTree(): Promise<{
  tree: DivisionNode[];
  fromDb: boolean;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/website/locations`, {
      cache: "no-store",
    });
    if (!res.ok) return { tree: fallbackTree(), fromDb: false };
    const json = (await res.json()) as { data?: DivisionNode[] };
    if (!Array.isArray(json.data) || json.data.length === 0) {
      return { tree: fallbackTree(), fromDb: false };
    }
    return { tree: json.data, fromDb: true };
  } catch {
    return { tree: fallbackTree(), fromDb: false };
  }
}

export function treeTotals(tree: DivisionNode[]): {
  districts: number;
  thanas: number;
  doctors: number;
} {
  let districts = 0;
  let thanas = 0;
  for (const div of tree) {
    districts += div.districts.length;
    for (const d of div.districts) thanas += d.thanas.length;
  }
  const doctors = tree.reduce((n, d) => n + d.doctors, 0);
  return { districts, thanas, doctors };
}
