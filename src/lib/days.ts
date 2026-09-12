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
