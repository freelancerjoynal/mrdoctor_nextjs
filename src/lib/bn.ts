/** Convert latin digits to Bengali digits for display. */
export function toBn(value: string | number): string {
  const map: Record<string, string> = {
    "0": "০",
    "1": "১",
    "2": "২",
    "3": "৩",
    "4": "৪",
    "5": "৫",
    "6": "৬",
    "7": "৭",
    "8": "৮",
    "9": "৯",
  };
  return String(value).replace(/[0-9]/g, (d) => map[d]);
}

export const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export const BN_WEEKDAYS = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
];

/** "2026-09-13" → "১৩ সেপ্টেম্বর ২০২৬". Falls back to the raw string. */
export function bnDateLabel(iso: string): string {
  const parts = String(iso).split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d || m < 1 || m > 12) return String(iso);
  return `${toBn(d)} ${BN_MONTHS[m - 1]} ${toBn(y)}`;
}
