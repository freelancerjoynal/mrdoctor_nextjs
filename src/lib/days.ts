/** Bangla day-name helpers — single source of truth for the whole site. */

export const DAY_BN: Record<string, string> = {
  SATURDAY: "শনিবার",
  SUNDAY: "রবিবার",
  MONDAY: "সোমবার",
  TUESDAY: "মঙ্গলবার",
  WEDNESDAY: "বুধবার",
  THURSDAY: "বৃহস্পতিবার",
  FRIDAY: "শুক্রবার",
};

/** English enum (SATURDAY…) → Bangla (শনিবার…). Falls back to the input. */
export function dayEnToBn(dayOfWeek: string): string {
  const key = (dayOfWeek || "").trim().toUpperCase();
  return DAY_BN[key] ?? dayOfWeek;
}

/** Short Bangla day names for compact ranges (শনি–বৃহস্পতি). */
export const DAY_BN_SHORT: Record<string, string> = {
  SATURDAY: "শনি",
  SUNDAY: "রবি",
  MONDAY: "সোম",
  TUESDAY: "মঙ্গল",
  WEDNESDAY: "বুধ",
  THURSDAY: "বৃহস্পতি",
  FRIDAY: "শুক্র",
};

const WEEK_ORDER = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

/**
 * ["SATURDAY","SUNDAY","MONDAY"] → "শনি–বুধ" style ranges joined with " · ".
 * Unknown values pass through; empty input returns "".
 */
export function compressDayRanges(days: string[]): string {
  const order = new Map(WEEK_ORDER.map((d, i) => [d, i]));
  const uniq = [...new Set(days.map((d) => (d || "").trim().toUpperCase()).filter(Boolean))];
  const known = uniq.filter((d) => order.has(d)).sort((a, b) => order.get(a)! - order.get(b)!);
  const unknown = uniq.filter((d) => !order.has(d));
  const parts: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length === 0) return;
    const first = DAY_BN_SHORT[run[0]!]!;
    const last = DAY_BN_SHORT[run[run.length - 1]!]!;
    parts.push(run.length === 1 ? first : `${first}–${last}`);
    run = [];
  };
  for (const d of known) {
    if (run.length === 0 || order.get(d)! === order.get(run[run.length - 1]!)! + 1) {
      run.push(d);
    } else {
      flush();
      run.push(d);
    }
  }
  flush();
  return [...parts, ...unknown].join(" · ");
}
