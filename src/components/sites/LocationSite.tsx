"use client";

import { useMemo, useState } from "react";
import { buildApexUrl, buildPortalUrl } from "@/lib/portal";
import { doctorPortrait, type PublicBlog } from "@/lib/profile";
import type { LocationMatch } from "@/lib/locationSlugs";
import { thanasOfDistrict } from "@/lib/locationSlugs";
import { DoctorPortalModal } from "@/components/sites/DoctorPortalModal";
import { HospitalPortalModal } from "@/components/sites/HospitalPortalModal";
import { PortalHeader } from "@/components/sites/PortalHeader";
import { BlogModal } from "@/components/blog/BlogModal";
import { LocationSwitcher } from "@/components/location/LocationSwitcher";

export interface PortalChamber {
  id: string;
  chamberName?: string | null;
  addressLine?: string | null;
  thana?: string | null;
  district?: string | null;
  division?: string | null;
  newPatientFee?: number | null;
  oldPatientFee?: number | null;
  hospital?: { name: string; slug: string } | null;
  doctor?: {
    username: string;
    name: string;
    degree: string;
    speciality: string;
    tagline?: string | null;
    profilePicture?: string | null;
  } | null;
}

export interface LocationDoctorSchedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  chamber?: { id: string; chamberName?: string | null } | null;
}

export interface LocationDoctorReview {
  id: string;
  rating: number;
  reviewerName: string;
  title?: string | null;
  comment: string;
  createdAt?: string | null;
}

export interface LocationDoctor {
  username: string;
  name: string;
  degree: string;
  speciality: string;
  tagline?: string | null;
  bio?: string | null;
  profilePicture?: string | null;
  startedYear?: number | null;
  bmdcNumber?: string | null;
  chambers?: PortalChamber[] | null;
  schedules?: LocationDoctorSchedule[] | null;
  reviews?: LocationDoctorReview[] | null;
  blogs?: PublicBlog[] | null;
}

export interface LocationHospitalReview {
  id: string;
  rating: number;
  reviewerName: string;
  title?: string | null;
  comment: string;
  createdAt?: string | null;
}

export interface LocationHospital {
  slug: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  chambers?: PortalChamber[] | null;
  reviews?: LocationHospitalReview[] | null;
}

export interface PortalCategory {
  speciality: string;
  doctors: number;
}

/** Super-admin customization for one thana portal (null = defaults). */
export interface LocationPortalSetting {
  slug: string;
  division?: string | null;
  district?: string | null;
  thana?: string | null;
  heroImage?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  description?: string | null;
  notice?: string | null;
}

/** Speciality (Bangla or English) → tile icon, like the reference directory. */
function specialityIcon(speciality: string): string {
  const s = speciality.toLowerCase();
  if (/শিশু|child|pediatr|neonat/.test(speciality) || s.includes("pediatr") || s.includes("child"))
    return "👶";
  if (/গাইনি|প্রসূতি|ধাত্রী|gyn|obs|infertility|reproductive/.test(speciality) || s.includes("gyn") || s.includes("obs"))
    return "🤰";
  if (/অর্থো|হাড়|ortho|bone|joint|spine/.test(speciality) || s.includes("ortho"))
    return "🦴";
  if (/চক্ষু|চোখ|eye|ophthal/.test(speciality) || s.includes("eye") || s.includes("ophthal"))
    return "👁️";
  if (/দন্ত|দাঁত|dent|tooth|oral|maxillofacial/.test(speciality) || s.includes("dent") || s.includes("oral"))
    return "🦷";
  if (/হৃদ|হার্ট|heart|cardio/.test(speciality) || s.includes("cardio") || s.includes("heart"))
    return "❤️";
  if (/চর্ম|ত্বক|skin|derma/.test(speciality) || s.includes("derma") || s.includes("skin"))
    return "🧴";
  if (/নাক|কান|গলা|ent|throat/.test(speciality) || s.includes("ent"))
    return "👂";
  if (/কিডনি|বৃক্ক|nephro|uro|kidney/.test(speciality) || s.includes("nephro") || s.includes("uro") || s.includes("kidney"))
    return "💧";
  if (/ডায়াবেটিস|diabet|hormon|endo/.test(speciality) || s.includes("diabet") || s.includes("endo"))
    return "🩸";
  if (/ক্যান্সার|onco|cancer|tumor/.test(speciality) || s.includes("onco") || s.includes("cancer"))
    return "🎗️";
  if (/সার্জারি|surger/.test(speciality) || s.includes("surger"))
    return "🩹";
  if (/নিউরো|neuro|brain|nerve/.test(speciality) || s.includes("neuro") || s.includes("psych") || /মানসিক/.test(speciality))
    return "🧠";
  if (/ফুসফুস|শ্বাস|pulmo|respir|tb|যক্ষ্মা/.test(speciality) || s.includes("pulmo") || s.includes("respir"))
    return "🫁";
  if (/লিভার|hepat|gastro|পেট/.test(speciality) || s.includes("hepat") || s.includes("gastro") || s.includes("liver"))
    return "🫀";
  if (/রক্ত|haemat|hemat|blood/.test(speciality) || s.includes("haemat") || s.includes("hemat"))
    return "🩸";
  if (/পুষ্টি|nutrition|diet/.test(speciality) || s.includes("nutri") || s.includes("diet"))
    return "🥗";
  if (/ফার্মা|pharma|medicine|মেডিসিন/.test(speciality) || s.includes("pharma") || s.includes("medicine"))
    return "💊";
  return "🩺";
}

function experienceYears(startedYear?: number | null): number | null {
  if (!startedYear) return null;
  const years = new Date().getFullYear() - startedYear;
  return years > 0 ? years : null;
}

/**
 * Thana directory portal (`nilphamari.domain.com`) — layout modelled on
 * bddoctorsdirectory.com with MrDoctor branding: department tiles,
 * doctor carousel cards, and a hero with search.
 */
export function LocationSite({
  matches,
  doctors,
  hospitals,
  categories,
  chambers,
  doctorsTotal,
  hospitalsTotal,
  host,
  setting = null,
}: {
  matches: LocationMatch[];
  doctors: LocationDoctor[];
  hospitals: LocationHospital[];
  categories: PortalCategory[];
  /** Total chambers in this thana (all pages, not just the listed doctors). */
  chambers: number;
  doctorsTotal: number;
  hospitalsTotal: number;
  host: string;
  /** Super-admin hero/text customization (null = defaults). */
  setting?: LocationPortalSetting | null;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<LocationDoctor | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<LocationHospital | null>(null);
  const [activeBlog, setActiveBlog] = useState<{ post: PublicBlog; doctor: LocationDoctor } | null>(null);

  const primary = matches[0]!;
  const title = primary.thanaBn;
  // All Bangla — never show the English upazila/district names on the portal.
  const areaLine = `${primary.districtBn} জেলা · ${primary.divisionBn} বিভাগ`;
  const subBn = matches.map((m) => `${m.thanaBn} (${m.districtBn})`).join(" · ");
  const thanaNames = useMemo(() => matches.map((m) => m.thanaBn), [matches]);
  const portalSlug = matches[0]?.slug ?? "";
  const nearby = useMemo(
    () => thanasOfDistrict(primary.districtBn).filter((t) => !thanaNames.includes(t.thanaBn)),
    [primary.districtBn, thanaNames],
  );

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      if (activeCategory && d.speciality !== activeCategory) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.speciality.toLowerCase().includes(q) ||
        d.degree.toLowerCase().includes(q)
      );
    });
  }, [doctors, query, activeCategory]);

  const pickCategory = (speciality: string | null) => {
    setActiveCategory(speciality);
    document.getElementById("doctors")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /**
   * Card quote line: always the doctor's own tagline when set;
   * only when empty does the chamber line step in as fallback.
   */
  const cardSubtitle = (d: LocationDoctor, ch: PortalChamber | null): string => {
    const tag = (d.tagline ?? "").trim();
    if (tag) return tag;
    const place = ch?.hospital?.name || ch?.chamberName || null;
    const area = [ch?.thana, ch?.district].filter(Boolean).join(", ");
    return [place, area].filter(Boolean).join(" · ") || "চেম্বার তথ্য প্রোফাইলে";
  };

  /** Health articles: one blog per doctor (first published post each). */
  const portalBlogs = useMemo(() => {
    const out: { post: PublicBlog; doctor: LocationDoctor }[] = [];
    for (const d of doctors) {
      const post = (d.blogs ?? [])[0];
      if (post) out.push({ post, doctor: d });
      if (out.length >= 6) break;
    }
    return out;
  }, [doctors]);

  const blogShareBase =
    typeof window !== "undefined"
      ? window.location.origin + window.location.pathname
      : "";

  const chamberHere = (d: LocationDoctor): PortalChamber | null => {
    // Strict thana match only — never fall back to another thana's chamber.
    const list = d.chambers ?? [];
    return list.find((c) => c.thana && thanaNames.includes(c.thana)) ?? null;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── Top bar: logo left (big), location pill first on the right ── */}
      <PortalHeader
        logoHref="/"
        pill={
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-black text-teal-800 ring-1 ring-teal-200 min-[420px]:inline-flex">
            📍 থানা: {primary.thanaBn} · জেলা: {[...new Set(matches.map((m) => m.districtBn))].join(", ")}
          </span>
        }
        nav={[
          { href: "#departments", label: "বিভাগ" },
          { href: "#doctors", label: "ডাক্তার" },
          { href: "#hospitals", label: "হাসপাতাল" },
        ]}
        navClassName="hidden min-[560px]:flex"
        actions={
          <a
            href={buildApexUrl("/apply/doctor", host)}
            className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-sm font-bold text-white shadow hover:opacity-90 sm:px-4"
          >
            আপনি কি ডাক্তার?
          </a>
        }
      />

      {/* ── Notice banner (super-admin) ── */}
      {setting?.notice ? (
        <div className="bg-amber-400 px-4 py-2.5 text-center text-sm font-black text-amber-950 sm:text-base">
          📢 {setting.notice}
        </div>
      ) : null}

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-14 lg:pt-12">
          {/* Copy + search */}
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
              <a href={buildApexUrl("/", host)} className="hover:text-teal-700 hover:underline">হোম</a>
              <span className="text-slate-300">/</span>
              <span>{primary.districtBn}</span>
              <span className="text-slate-300">/</span>
              <span className="text-teal-700">{title}</span>
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              {setting?.headline ? (
                setting.headline
              ) : (
                <>
                  {title} সেরা ডাক্তার{" "}
                  <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    খুঁজুন
                  </span>
                </>
              )}
            </h1>
            <p className="mt-2 text-sm font-bold text-slate-500 sm:text-base">
              {setting?.subheadline || `আপনার স্বাস্থ্যের জন্য সঠিক বিশেষজ্ঞ খুঁজুন — ${subBn}`}
            </p>
            {setting?.description ? (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
                {setting.description}
              </p>
            ) : null}

            {/* Search */}
            <div className="mt-5 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200">
              <span className="pl-2 text-lg">🔍</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("doctors")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                placeholder="ডাক্তার, বিভাগ বা ডিগ্রি লিখে খুঁজুন…"
                className="w-full bg-transparent px-1 py-2 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
              />
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  মুছুন
                </button>
              ) : null}
              <a
                href="#doctors"
                className="shrink-0 rounded-xl bg-teal-600 px-4 py-2 text-sm font-black text-white shadow hover:bg-teal-700 sm:px-5"
              >
                খুঁজুন
              </a>
            </div>

            {/* Stats */}
            <div className="mt-5 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["🩺", `${doctorsTotal} জন`, "ডাক্তার"],
                ["🏥", `${hospitalsTotal}টি`, "হাসপাতাল"],
                ["📋", `${chambers}টি`, "চেম্বার"],
                ["🗂️", `${categories.length}টি`, "বিভাগ"],
              ].map(([icon, value, label]) => (
                <div key={label} className="rounded-2xl bg-white/80 px-3 py-2.5 text-center shadow-sm ring-1 ring-slate-200 backdrop-blur">
                  <p className="text-base leading-none">{icon}</p>
                  <p className="mt-1 text-sm font-black sm:text-base">{value}</p>
                  <p className="text-[11px] font-bold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute inset-8 rounded-[2.5rem] bg-gradient-to-br from-teal-400 to-cyan-500 opacity-30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl ring-1 ring-slate-200">
              {/* Hero image is super-admin controlled (location settings), bundled art is the fallback. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={setting?.heroImage || "/images/doctor_hero_bg.png"}
                alt={`${title} — যাচাইকৃত ডাক্তার`}
                className="h-auto w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-5 pt-12">
                <p className="text-lg font-black text-white">{title}</p>
                <p className="text-xs font-bold text-white/80">{areaLine} · যাচাইকৃত চেম্বার ডিরেক্টরি</p>
              </div>
            </div>
            <div className="absolute -left-2 top-6 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur sm:left-3">
              <p className="text-sm font-black text-teal-600">✓ যাচাইকৃত</p>
              <p className="text-[11px] font-bold text-slate-500">{doctorsTotal} জন ডাক্তার</p>
            </div>
            <div className="absolute -right-2 bottom-24 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur sm:right-3">
              <p className="text-sm font-black text-slate-900">⏱ সিরিয়াল নিন</p>
              <p className="text-[11px] font-bold text-slate-500">প্রোফাইল থেকে সরাসরি</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Departments (tiles like the reference) ── */}
      <section id="departments" className="scroll-mt-24 bg-gradient-to-b from-slate-50 to-white py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight sm:text-4xl">বিভাগ অনুযায়ী খুঁজুন</h2>
            <p className="mt-2 text-sm font-bold text-slate-500 sm:text-base">
              যোগ্য বিশেষজ্ঞদের খুঁজুন।
            </p>
          </div>
          {activeCategory && (
            <div className="mt-4 text-center">
              <button
                onClick={() => pickCategory(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                ✕ “{activeCategory}” ফিল্টার তুলুন
              </button>
            </div>
          )}
          {categories.length === 0 ? (
            <p className="mx-auto mt-6 max-w-md rounded-2xl bg-white p-6 text-center text-sm font-bold text-slate-400 ring-1 ring-slate-200">
              এই এলাকায় এখনও কোনো বিভাগ পাওয়া যায়নি।
            </p>
          ) : (
            <div className="mt-7 grid grid-cols-2 gap-3 min-[560px]:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {categories.map((c, i) => {
                const active = activeCategory === c.speciality;
                return (
                  <button
                    key={c.speciality}
                    onClick={() => pickCategory(active ? null : c.speciality)}
                    className={`group flex flex-col overflow-hidden rounded-2xl bg-white text-center shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl ${
                      active ? "ring-2 ring-teal-600" : "ring-slate-200 hover:ring-teal-300"
                    }`}
                  >
                    <span className="relative block px-3 pb-1 pt-3 sm:px-4">
                      <span className="absolute left-2.5 top-2.5 text-[11px] font-black text-slate-900 sm:left-3">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-[26px] text-white shadow-lg transition group-hover:scale-110 sm:h-16 sm:w-16 sm:text-3xl">
                        {specialityIcon(c.speciality)}
                      </span>
                      <span className="mt-2.5 block min-h-10 text-xs font-black leading-snug text-slate-900 sm:min-h-12 sm:text-[13px]">
                        {c.speciality}
                      </span>
                      <span className="mt-1 block text-[11px] font-bold text-teal-700">
                        {c.doctors} জন ডাক্তার
                      </span>
                    </span>
                    <span className={`mt-2.5 block py-2.5 text-xs font-black text-white transition sm:text-sm ${active ? "bg-teal-600" : "bg-slate-950 group-hover:bg-teal-700"}`}>
                      {active ? "✓ নির্বাচিত" : "সব দেখুন"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Doctors grid (3 per row) ── */}
      <section id="doctors" className="scroll-mt-24 bg-teal-50/50 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight sm:text-4xl">
              {activeCategory ? `${activeCategory} (${filteredDoctors.length})` : "জনপ্রিয় ডাক্তার"}
            </h2>
            <p className="mt-2 text-sm font-bold text-slate-500 sm:text-base">
              আপনার স্বাস্থ্যের জন্য সঠিক বিশেষজ্ঞ
            </p>
          </div>

          {filteredDoctors.length === 0 ? (
            <p className="mx-auto mt-6 max-w-md rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-400 ring-1 ring-slate-200">
              {doctors.length === 0
                ? "এই এলাকায় এখনও কোনো ডাক্তার নেই। পরে আবার দেখুন।"
                : "এই খোঁজে কোনো ডাক্তার মিলল না। অন্য নামে খুঁজুন।"}
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDoctors.map((d) => {
                const ch = chamberHere(d);
                const yrs = experienceYears(d.startedYear);
                return (
                  <article
                    key={d.username}
                    onClick={() => setSelected(d)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(d);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${d.name} — বিস্তারিত দেখুন`}
                    className="flex w-full cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:ring-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    {/* Photo + Verified */}
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doctorPortrait(d.profilePicture)}
                        alt={d.name}
                        className="h-60 w-full object-cover sm:h-64"
                      />
                      <span className="absolute right-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black text-teal-700 shadow">
                        ✓ যাচাইকৃত
                      </span>
                      {yrs ? (
                        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur">
                          ⭐ {yrs}+ বছরের অভিজ্ঞতা
                        </span>
                      ) : null}
                    </div>
                    {/* Mini badges (data-backed) */}
                    <div className="flex items-center justify-center gap-1.5 border-b border-slate-100 px-3 py-2">
                      <span title="যাচাইকৃত" className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-sm ring-1 ring-amber-300">🎖️</span>
                      <span title={d.speciality} className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-sm ring-1 ring-teal-300">{specialityIcon(d.speciality)}</span>
                      {ch?.hospital ? (
                        <span title={ch.hospital.name} className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sm ring-1 ring-sky-300">🏥</span>
                      ) : null}
                      {yrs ? (
                        <span title={`${yrs}+ বছরের অভিজ্ঞতা`} className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-sm ring-1 ring-violet-300">⭐</span>
                      ) : null}
                      <span title={title} className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm ring-1 ring-emerald-300">📍</span>
                    </div>
                    {/* Body */}
                    <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                      <h3 className="truncate text-base font-black">{d.name}</h3>
                      <p className="mt-0.5 line-clamp-2 min-h-8 text-xs leading-snug text-slate-500">{d.degree}</p>
                      <p className="mt-1 text-sm font-black text-teal-600">{d.speciality}</p>
                      <p className="mt-1.5 line-clamp-2 border-l-2 border-teal-200 pl-2 text-xs italic leading-snug text-slate-600">
                        “{cardSubtitle(d, ch)}”
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-slate-50 px-2 py-2 text-center ring-1 ring-slate-100">
                          <p className="text-[10px] font-bold text-slate-400">অভিজ্ঞতা</p>
                          <p className="text-xs font-black">{yrs ? `${yrs}+ বছর` : "—"}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2 py-2 text-center ring-1 ring-slate-100">
                          <p className="text-[10px] font-bold text-slate-400">বিএমডিসি নং</p>
                          <p className="truncate text-xs font-black">{d.bmdcNumber || "—"}</p>
                        </div>
                      </div>
                      {/* Doctor's own subdomain portal — new tab, no loading overlay */}
                      <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <a
                          href={buildPortalUrl(d.username, host)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block rounded-xl bg-teal-500 px-4 py-2.5 text-center text-sm font-black text-white transition hover:bg-teal-600"
                        >
                          প্রোফাইল দেখুন
                        </a>
                      </span>
                      <p className="mt-2 text-center text-[11px] font-bold text-slate-400">
                        কার্ডে ক্লিক করলে সম্পূর্ণ বিবরণ 👆
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Health articles (one blog per doctor) ── */}
      {portalBlogs.length > 0 ? (
        <section id="blogs" className="scroll-mt-24 bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-widest text-teal-700">
                স্বাস্থ্য কথা
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-4xl">
                ডাক্তারদের লেখা
              </h2>
              <p className="mt-2 text-sm font-bold text-slate-500 sm:text-base">
                এই এলাকার ডাক্তারদের স্বাস্থ্য পরামর্শ — প্রতি ডাক্তার থেকে একটি করে
              </p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {portalBlogs.map(({ post, doctor }) => (
                <article
                  key={post.slug}
                  className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <button
                    onClick={() => setActiveBlog({ post, doctor })}
                    className="block w-full text-left"
                    aria-label={post.title}
                  >
                    <div className="relative flex h-44 items-center justify-center overflow-hidden text-6xl text-white/90">
                      {post.coverImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- cover may be any external author-uploaded URL */
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${post.coverGradient}`}>
                          <span className="transition group-hover:scale-110">{post.coverSymbol}</span>
                        </div>
                      )}
                      <span className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white">
                        {post.category}
                      </span>
                    </div>
                  </button>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-900">
                      {post.title}
                    </h3>
                    {post.excerpt ? (
                      <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{post.excerpt}</p>
                    ) : null}
                    <span className="mt-3 flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doctorPortrait(doctor.profilePicture)}
                        alt={doctor.name}
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-black text-slate-800">
                          {doctor.name}
                        </span>
                        <span className="block truncate text-[11px] font-bold text-teal-700">
                          {doctor.speciality}
                        </span>
                      </span>
                    </span>
                    <button
                      onClick={() => setActiveBlog({ post, doctor })}
                      className="mt-3 rounded-xl bg-teal-50 px-4 py-2.5 text-center text-sm font-black text-teal-700 ring-1 ring-teal-100 transition hover:bg-teal-600 hover:text-white"
                    >
                      পুরো পড়ুন →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── How it works ── */}
      <section className="bg-white pb-2 pt-10 sm:pt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["1", "🗂️", "বিভাগ বেছে নিন", "উপরে বিভাগের তালিকা থেকে আপনার সমস্যার বিশেষজ্ঞ খুঁজুন।"],
              ["2", "👆", "কার্ডে ক্লিক করুন", "চেম্বার, ফি, সময়সূচি ও মতামত — সব বিবরণ পপআপে দেখুন।"],
              ["3", "🚀", "প্রোফাইলে সিরিয়াল", "প্রোফাইল দেখুন চাপুন — ডাক্তারের নিজস্ব পোর্টালে সিরিয়াল নিন।"],
            ].map(([n, icon, titleText, desc]) => (
              <div key={n} className="flex gap-3 rounded-3xl bg-gradient-to-br from-teal-50 to-cyan-50 p-4 ring-1 ring-teal-100 sm:p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-teal-100">
                  {icon}
                </span>
                <span>
                  <span className="block text-xs font-black text-teal-700">ধাপ {n}</span>
                  <span className="block font-black">{titleText}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hospitals ── */}
      <section id="hospitals" className="scroll-mt-24 bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight sm:text-4xl">
              হাসপাতাল ({hospitalsTotal})
            </h2>
            <p className="mt-2 text-sm font-bold text-slate-500 sm:text-base">
              এই এলাকার হাসপাতাল ও স্বাস্থ্য কমপ্লেক্স
            </p>
          </div>
          {hospitals.length === 0 ? (
            <p className="mx-auto mt-6 max-w-md rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-400 ring-1 ring-slate-200">
              এই এলাকায় এখনও কোনো হাসপাতাল নেই। পরে আবার দেখুন।
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 lg:grid-cols-3">
              {hospitals.map((h) => {
                // Strict thana match only — chambers from other thanas never count here.
                const chList = (h.chambers ?? []).filter(
                  (c) => c.thana && thanaNames.includes(c.thana),
                );
                const docCount = new Set(
                  chList.map((c) => c.doctor?.username).filter(Boolean),
                ).size;
                return (
                  <article
                    key={h.slug}
                    onClick={() => setSelectedHospital(h)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedHospital(h);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${h.name} — বিস্তারিত দেখুন`}
                    className="flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:ring-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                  >
                    {/* Visual band */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 px-5 pb-5 pt-6 text-white">
                      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                      <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black text-sky-700 shadow">
                        ✓ যাচাইকৃত
                      </span>
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-4xl ring-2 ring-white/25">
                        🏥
                      </span>
                      <h3 className="mt-3 line-clamp-2 min-h-11 text-base font-black leading-snug">
                        {h.name}
                      </h3>
                      {h.address ? (
                        <p className="mt-1 truncate text-xs font-bold text-sky-100">📍 {h.address}</p>
                      ) : null}
                    </div>
                    {/* Body */}
                    <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                      {h.phone ? (
                        <p className="truncate text-xs font-bold text-slate-500">📞 {h.phone}</p>
                      ) : (
                        <p className="truncate text-xs text-slate-400">📞 ফোন নম্বর প্রোফাইলে</p>
                      )}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-slate-50 px-2 py-2 text-center ring-1 ring-slate-100">
                          <p className="text-[10px] font-bold text-slate-400">ডাক্তার</p>
                          <p className="text-xs font-black">{docCount > 0 ? `${docCount} জন` : "—"}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2 py-2 text-center ring-1 ring-slate-100">
                          <p className="text-[10px] font-bold text-slate-400">চেম্বার</p>
                          <p className="text-xs font-black">{chList.length > 0 ? `${chList.length}টি` : "—"}</p>
                        </div>
                      </div>
                      <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <a
                          href={buildPortalUrl(h.slug, host)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block rounded-xl bg-sky-600 px-4 py-2.5 text-center text-sm font-black text-white transition hover:bg-sky-700"
                        >
                          হাসপাতাল দেখুন
                        </a>
                      </span>
                      <p className="mt-2 text-center text-[11px] font-bold text-slate-400">
                        কার্ডে ক্লিক করলে সম্পূর্ণ বিবরণ 👆
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Nearby thanas in the same district ── */}
      {nearby.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14">
          <div className="rounded-3xl bg-slate-950 p-5 text-white sm:p-8">
            <h2 className="text-lg font-black sm:text-xl">
              📍 {primary.districtBn} জেলার অন্যান্য থানা
            </h2>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">
              পাশের থানার ডাক্তারও দেখুন — প্রতিটি থানার নিজস্ব পোর্টাল আছে
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {nearby.map((t) => (
                <a
                  key={t.slug}
                  href={buildPortalUrl(t.slug, host)}
                  className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold ring-1 ring-white/15 transition hover:bg-gradient-to-r hover:from-teal-500 hover:to-emerald-500 sm:text-sm"
                >
                  {t.thanaBn}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Doctor CTA ── */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-800 p-6 text-white sm:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-xl font-black sm:text-2xl">🩺 আপনি কি {title} এলাকায় চেম্বার করেন?</h2>
              <p className="mt-1 text-sm font-bold text-white/80">
                মিস্টার ডাক্তারে যোগ দিন — নিজস্ব পোর্টাল, অনলাইন সিরিয়াল ও রোগীর মতামত এক জায়গায়।
              </p>
            </div>
            <a
              href={buildApexUrl("/apply/doctor", host)}
              className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-teal-800 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
            >
              ডাক্তার হিসেবে যোগ দিন →
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer (MrDoctor brand) ── */}
      <footer className="border-t border-slate-100 bg-slate-50 py-10">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-main.png" alt="মিস্টার ডাক্তার" className="h-9 w-auto object-contain" />
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              {title} — {areaLine} এলাকার যাচাইকৃত ডাক্তার, চেম্বার ও হাসপাতাল —
              দেরি নয়, অপেক্ষা নয়, সময়মতো ভিজিট।
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["✓ যাচাইকৃত ডাক্তার", "⏱ সময়মতো সিরিয়াল", "📍 প্রতিটি থানায় পোর্টাল"].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-slate-400">লিংক</p>
            <ul className="mt-3 space-y-2">
              <li><a href={buildApexUrl("/", host)} className="text-sm font-bold text-slate-600 hover:text-teal-700">🏠 মূল সাইট</a></li>
              <li><a href={buildApexUrl("/apply/doctor", host)} className="text-sm font-bold text-slate-600 hover:text-teal-700">🩺 ডাক্তার হিসেবে যোগ দিন</a></li>
              <li><a href={buildApexUrl("/apply/hospital", host)} className="text-sm font-bold text-slate-600 hover:text-teal-700">🏥 হাসপাতাল হিসেবে যোগ দিন</a></li>
              <li><a href={buildApexUrl("/login", host)} className="text-sm font-bold text-slate-600 hover:text-teal-700">🔑 লগইন</a></li>
              {portalSlug ? (
                <li>
                  <a
                    href={buildApexUrl(`/admin/locations?slug=${encodeURIComponent(portalSlug)}`, host)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-slate-600 hover:text-teal-700"
                  >
                    ⚙️ পোর্টাল সাজান
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl border-t border-slate-200 px-4 pt-5 text-center text-xs text-slate-400 sm:px-6">
          © {new Date().getFullYear()} মিস্টার ডাক্তার — {title} পোর্টাল · সবার জন্য সময়মতো চিকিৎসা।
        </div>
      </footer>
      {/* Detail popups (whole-card clicks); profile buttons → subdomains */}
      <DoctorPortalModal
        doctor={selected}
        thanaNames={thanaNames}
        areaTitle={title}
        host={host}
        onClose={() => setSelected(null)}
      />
      <HospitalPortalModal
        hospital={selectedHospital}
        thanaNames={thanaNames}
        areaTitle={title}
        host={host}
        onClose={() => setSelectedHospital(null)}
      />
      <BlogModal
        post={activeBlog?.post ?? null}
        shareUrl={activeBlog ? `${blogShareBase}#blog-${activeBlog.post.slug}` : blogShareBase}
        onClose={() => setActiveBlog(null)}
      />
      <LocationSwitcher defaultOpen={false} />
    </div>
  );
}
