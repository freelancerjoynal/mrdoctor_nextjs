import type { Role } from "./types";

export interface RoleMeta {
  label: string;
  tagline: string;
  /** tailwind gradient stops, e.g. "from-violet-600 via-fuchsia-500 to-orange-400" */
  gradient: string;
  /** solid accent used for small elements */
  accent: string;
  accentText: string;
  softBg: string;
  emoji: string;
  stats: { label: string; value: string; delta: string }[];
  actions: { label: string; hint: string }[];
}

export const ROLE_META: Record<Role, RoleMeta> = {
  SUPER_ADMIN: {
    label: "সুপার অ্যাডমিন",
    tagline: "পুরো প্ল্যাটফর্মের নিয়ন্ত্রণ — ইউজার, ডাক্তার, হাসপাতাল।",
    gradient: "from-violet-600 via-purple-500 to-fuchsia-400",
    accent: "bg-violet-600",
    accentText: "text-violet-700",
    softBg: "bg-violet-50",
    emoji: "👑",
    stats: [
      { label: "মোট ইউজার", value: "১২.৪ হাজার", delta: "+৮.২%" },
      { label: "ডাক্তার", value: "১,১৮০", delta: "+৩.১%" },
      { label: "হাসপাতাল", value: "৯৬", delta: "+১.৪%" },
    ],
    actions: [
      { label: "অনুমোদন দেখুন", hint: "বিচারাধীন ডাক্তার ও হাসপাতাল" },
      { label: "ভূমিকা ব্যবস্থাপনা", hint: "স্টাফ ও মালিক নির্ধারণ" },
      { label: "সিস্টেম স্বাস্থ্য", hint: "API, মেইল, হোয়াটসঅ্যাপ" },
    ],
  },
  DOCTOR: {
    label: "ডাক্তার",
    tagline: "চেম্বার, সময়সূচি ও হোয়াটসঅ্যাপ অ্যাপয়েন্টমেন্ট।",
    gradient: "from-emerald-500 via-teal-500 to-cyan-400",
    accent: "bg-emerald-600",
    accentText: "text-emerald-700",
    softBg: "bg-emerald-50",
    emoji: "🩺",
    stats: [
      { label: "আজকের রোগী", value: "২৪", delta: "+৬" },
      { label: "চেম্বার", value: "৩", delta: "সক্রিয়" },
      { label: "বিচারাধীন অনুরোধ", value: "৭", delta: "হোয়াটসঅ্যাপ" },
    ],
    actions: [
      { label: "আজকের সময়সূচি", hint: "চেম্বার অনুযায়ী সময়" },
      { label: "অ্যাপয়েন্টমেন্ট ইনবক্স", hint: "হোয়াটসঅ্যাপ অনুরোধ" },
      { label: "চেম্বার সেটআপ", hint: "ফি ও ঠিকানা" },
    ],
  },
  DOCTOR_STAFF: {
    label: "ডাক্তারের সহকারী",
    tagline: "আপনার ডাক্তারের চেম্বার সুষ্ঠুভাবে চালাতে সাহায্য করুন।",
    gradient: "from-sky-500 via-blue-500 to-indigo-400",
    accent: "bg-sky-600",
    accentText: "text-sky-700",
    softBg: "bg-sky-50",
    emoji: "🧑‍⚕️",
    stats: [
      { label: "আজকের লাইন", value: "১৮", delta: "লাইভ" },
      { label: "নিশ্চিত", value: "১১", delta: "+৪" },
      { label: "ফলো-আপ", value: "৫", delta: "বাকি" },
    ],
    actions: [
      { label: "লাইন ব্যবস্থাপনা", hint: "চেক-ইন ও সিরিয়াল" },
      { label: "বুকিং নিশ্চিত", hint: "হোয়াটসঅ্যাপ উত্তর" },
      { label: "ডাক্তারের রোস্টার", hint: "সাপ্তাহিক সময়সূচি" },
    ],
  },
  BUSINESS_OWNER: {
    label: "ব্যবসায়ী",
    tagline: "আয়, চেম্বার ও প্রবৃদ্ধি এক নজরে।",
    gradient: "from-amber-500 via-orange-500 to-rose-400",
    accent: "bg-amber-600",
    accentText: "text-amber-700",
    softBg: "bg-amber-50",
    emoji: "💼",
    stats: [
      { label: "আয় (মাস)", value: "৳৪.২ লাখ", delta: "+১২%" },
      { label: "চেম্বার", value: "৮", delta: "২ শহরে" },
      { label: "ডাক্তার", value: "২১", delta: "+২ নতুন" },
    ],
    actions: [
      { label: "আয়ের রিপোর্ট", hint: "ফি ও পেমেন্ট" },
      { label: "চেম্বার ব্যবস্থাপনা", hint: "ঠিকানা ও স্টাফ" },
      { label: "ডাক্তার যোগ করুন", hint: "আমন্ত্রণ ও অনুমোদন" },
    ],
  },
  HOSPITAL: {
    label: "হাসপাতাল",
    tagline: "বিভাগ, ডাক্তার ও ডিউটি রোস্টার।",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-400",
    accent: "bg-rose-600",
    accentText: "text-rose-700",
    softBg: "bg-rose-50",
    emoji: "🏥",
    stats: [
      { label: "ডিউটিতে ডাক্তার", value: "৩২", delta: "আজ" },
      { label: "বিভাগ", value: "১২", delta: "সক্রিয়" },
      { label: "অ্যাপয়েন্টমেন্ট", value: "২১৪", delta: "+১৮" },
    ],
    actions: [
      { label: "ডিউটি রোস্টার", hint: "শিফট ও দায়িত্ব" },
      { label: "বিভাগসমূহ", hint: "ইউনিট ও প্রধান" },
      { label: "ভর্তি", hint: "আসা অনুরোধ" },
    ],
  },
  HOSPITAL_STAFF: {
    label: "হাসপাতাল স্টাফ",
    tagline: "ফ্রন্ট-ডেস্ক, সময়সূচি ও রোগী প্রবাহ।",
    gradient: "from-indigo-500 via-violet-500 to-purple-400",
    accent: "bg-indigo-600",
    accentText: "text-indigo-700",
    softBg: "bg-indigo-50",
    emoji: "📋",
    stats: [
      { label: "চেক-ইন", value: "৮৬", delta: "আজ" },
      { label: "টোকেন", value: "৬৪", delta: "লাইভ" },
      { label: "বিচারাধীন", value: "৯", delta: "ফলো-আপ" },
    ],
    actions: [
      { label: "ফ্রন্ট ডেস্ক", hint: "রেজিস্টার ও টোকেন" },
      { label: "ডাক্তারের উপস্থিতি", hint: "এখন কে আছেন" },
      { label: "রোগীর রেকর্ড", hint: "খুঁজুন ও ইতিহাস" },
    ],
  },
};

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "DOCTOR", label: "ডাক্তার" },
  { value: "DOCTOR_STAFF", label: "ডাক্তারের সহকারী" },
  { value: "BUSINESS_OWNER", label: "ব্যবসায়ী" },
  { value: "HOSPITAL", label: "হাসপাতাল" },
  { value: "HOSPITAL_STAFF", label: "হাসপাতাল স্টাফ" },
];
