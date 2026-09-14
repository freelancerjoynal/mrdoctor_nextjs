// Shared chamber types — server-safe (no client directive), imported by
// server components (page/overview/skeleton) and client islands alike.

export const DAYS = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const;

export type Day = (typeof DAYS)[number];

export const DAY_BN: Record<string, string> = {
  SATURDAY: "শনি",
  SUNDAY: "রবি",
  MONDAY: "সোম",
  TUESDAY: "মঙ্গল",
  WEDNESDAY: "বুধ",
  THURSDAY: "বৃহস্পতি",
  FRIDAY: "শুক্র",
};

export const DAY_BN_FULL: Record<string, string> = {
  SATURDAY: "শনিবার",
  SUNDAY: "রবিবার",
  MONDAY: "সোমবার",
  TUESDAY: "মঙ্গলবার",
  WEDNESDAY: "বুধবার",
  THURSDAY: "বৃহস্পতিবার",
  FRIDAY: "শুক্রবার",
};

/** One gradient per chamber (cycled) — separates chambers + highlights taken days. */
export const CHAMBER_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-indigo-600",
  "from-violet-500 to-fuchsia-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
] as const;

export const gradientFor = (index: number): string =>
  CHAMBER_GRADIENTS[index % CHAMBER_GRADIENTS.length]!;

export interface ScheduleRow {
  id: string;
  chamberId?: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ChamberHospital {
  id: string;
  name: string;
  name_en?: string | null;
}

export interface ChamberRow {
  id: string;
  chamberName?: string | null;
  chamberName_en?: string | null;
  addressLine?: string | null;
  addressLine_en?: string | null;
  thana?: string | null;
  thana_en?: string | null;
  district?: string | null;
  district_en?: string | null;
  division?: string | null;
  division_en?: string | null;
  newPatientFee: number;
  oldPatientFee: number;
  latitude?: number | null;
  longitude?: number | null;
  hospitalId?: string | null;
  hospital?: ChamberHospital | null;
  schedules?: ScheduleRow[];
}

export interface HospitalOption {
  id: string;
  name: string;
  name_en?: string | null;
  division?: string | null;
  division_en?: string | null;
  district?: string | null;
  district_en?: string | null;
  thana?: string | null;
  thana_en?: string | null;
}

export interface HospitalFacets {
  divisions: string[];
  districts: string[];
  thanas: string[];
}

export function shortLabel(c: ChamberRow, index: number): string {
  const raw = c.chamberName?.trim() || c.addressLine?.trim() || `চেম্বার ${index + 1}`;
  return raw.split(" ")[0]!.slice(0, 12);
}

/** Which chamber owns each weekday (first owner wins for display). */
export function buildTakenBy(rows: ChamberRow[]): Record<string, { chamberId: string; chamberIndex: number }> {
  const map: Record<string, { chamberId: string; chamberIndex: number }> = {};
  rows.forEach((c, ci) => {
    for (const s of c.schedules ?? []) {
      const day = String(s.dayOfWeek).toUpperCase();
      if (!map[day]) map[day] = { chamberId: c.id, chamberIndex: ci };
    }
  });
  return map;
}
