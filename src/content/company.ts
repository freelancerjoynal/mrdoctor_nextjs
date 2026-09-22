/**
 * ─────────────────────────────────────────────────────────────
 * MRDOCTOR — EDITABLE COMPANY + LEGAL CONTENT (single place)
 * ─────────────────────────────────────────────────────────────
 * Merchant / payment-gateway discussion er jonno sob static info
 * ekhane group kore rakha holo, jate easily edit kora jay.
 *
 * HOW TO EDIT:
 *  1. Company story / address / phone / email → edit COMPANY below.
 *  2. Trade License number → .env.local e `NEXT_PUBLIC_TRADE_LICENSE_NUMBER`
 *     change korun (env wins). Khali thakle nicher fallback dekhabe.
 *  3. Policy texts → src/content/legal/*.ts files (terms, privacy,
 *     refund, delivery) — Bangla + English duitai ache.
 *
 *  Pages (routes):
 *   /about    → About Us (company story)
 *   /contact  → Business Address + phone/email
 *   /terms    → Terms & Conditions
 *   /privacy  → Privacy Policy
 *   /refund   → Return & Refund Policy
 *   /delivery → Delivery Policy (serial/service delivery model)
 */

export const COMPANY = {
  /** Brand name (footer/header e use hoy). */
  name: process.env.NEXT_PUBLIC_COMPANY_NAME?.trim() || "মিস্টার ডাক্তার",

  nameEn: process.env.NEXT_PUBLIC_COMPANY_NAME_EN?.trim() || "MrDoctor",

  /** Brief story — About Us page er main text. Ekhane edit korun. */
  tagline:
    "আমরা রোগীকে সবার আগে ডাক্তারের কাছে পৌঁছে দিই।",

  storyBn: [
    "মিস্টার ডাক্তার (MrDoctor) একটি বাংলাদেশি হেলথ-টেক প্ল্যাটফর্ম। আমাদের কাজ খুব সহজ — রোগীকে সবার আগে সঠিক ডাক্তারের কাছে পৌঁছে দেওয়া। রোগী ঘরে বসে আমাদের সফটওয়্যারের মাধ্যমে ডাক্তারের সিরিয়াল বুক করেন, অগ্রিম পেমেন্ট দিয়ে সিরিয়ালটি কনফার্ম করেন, তারপর নির্ধারিত সময়ে চেম্বারে গিয়ে ডাক্তারের সেবা নিয়ে চলে আসেন।",
    "রোগীর কাছ থেকে পাওয়া পেমেন্ট আমরা সঙ্গে সঙ্গে রেখে দিই না — সেবা নিশ্চিত হওয়ার পর পরবর্তীতে ডাক্তার/হাসপাতালকে তাদের প্রাপ্য পরিশোধ করি। অর্থাৎ আমরা রোগী ও ডাক্তারের মাঝে বিশ্বস্ত সেতু হিসেবে কাজ করি: সফটওয়্যারের মাধ্যমে সিরিয়াল যোগ হয়, রোগী সেবা পান, তারপর ডাক্তার পেমেন্ট পান।",
    "কেউ সরাসরি চেম্বারে গিয়ে সিরিয়াল বুক করলেও সেটি আমাদের সফটওয়্যারে কানেক্ট হয় — ফলে একই সিরিয়াল দুইবার বুক হয় না, ভিড় কমে, এবং সব পক্ষের হিসাব স্বচ্ছ থাকে।",
  ],

  storyEn: [
    "MrDoctor is a Bangladeshi health-tech platform. We connect patients to the right doctor first: patients book a serial through our software, pay in advance to confirm it, visit the chamber at the scheduled time, receive care, and go home.",
    "Payments collected from patients are held and later settled to the doctor/hospital after the service is delivered. Walk-in bookings made directly at the chamber are also synced into the same software, so queues stay consistent and accounting stays transparent.",
  ],

  /** Physical office address — Contact page + footer e dekhay. */
  address:
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS?.trim() ||
    "মিস্টার ডাক্তার, ঢাকা, বাংলাদেশ (বিস্তারিত ঠিকানা শীঘ্রই যুক্ত হবে)",

  addressEn:
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS_EN?.trim() ||
    "MrDoctor, Dhaka, Bangladesh",

  /** Contact number — WhatsApp/global number theke alada, office number. */
  phone:
    process.env.NEXT_PUBLIC_COMPANY_PHONE?.trim() || "+880-1XXXXXXXXX",

  email:
    process.env.NEXT_PUBLIC_COMPANY_EMAIL?.trim() || "support@mrdoctor.com.bd",

  /** Support hours line (footer/contact e dekhay). */
  supportHours: "প্রতিদিন সকাল ৯টা – রাত ৯টা",

  /**
   * Trade License Number — ENV THEKE ASHE, jate merchant discussion er
   * somoy .env change korlei website e update hoye jay.
   * .env.local e: NEXT_PUBLIC_TRADE_LICENSE_NUMBER=TRAD/XXXX/XXXXXX
   */
  tradeLicense:
    process.env.NEXT_PUBLIC_TRADE_LICENSE_NUMBER?.trim() ||
    "TRAD/XXXX/XXXXXX (হালনাগাদ প্রক্রিয়াধীন — .env থেকে পরিবর্তন করুন)",
} as const;

/** "৳800 (BDT)" format — gateway compliance: price must show BDT. */
export function formatBDT(amount: number | string | null | undefined): string {
  if (amount == null || amount === "") return "৳০ (BDT)";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isFinite(n)) {
    try {
      return `৳${n.toLocaleString("en-IN")} (BDT)`;
    } catch {
      return `৳${n} (BDT)`;
    }
  }
  return `৳${amount} (BDT)`;
}

/** Legal page links — footer + booking form e use hoy. */
export const LEGAL_LINKS = [
  { href: "/about", labelBn: "আমাদের সম্পর্কে", labelEn: "About Us" },
  { href: "/contact", labelBn: "যোগাযোগ ও ঠিকানা", labelEn: "Contact" },
  { href: "/terms", labelBn: "শর্তাবলী", labelEn: "Terms" },
  { href: "/privacy", labelBn: "প্রাইভেসি পলিসি", labelEn: "Privacy" },
  { href: "/refund", labelBn: "রিটার্ন ও রিফান্ড", labelEn: "Refund" },
  { href: "/delivery", labelBn: "ডেলিভারি পলিসি", labelEn: "Delivery" },
] as const;
