"use client";

import { buildPortalUrl } from "@/lib/portal";
import { doctorPortrait } from "@/lib/profile";
import type { LocationDoctor, PortalChamber } from "@/components/sites/LocationSite";

/** Speciality (Bangla or English) → tile icon, like the reference directory. */
export function specialityIcon(speciality: string): string {
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

export function experienceYears(startedYear?: number | null): number | null {
  if (!startedYear) return null;
  const years = new Date().getFullYear() - startedYear;
  return years > 0 ? years : null;
}

/**
 * Card quote line: always the doctor's own tagline when set;
 * only when empty does the chamber line step in as fallback.
 */
export function cardSubtitle(d: LocationDoctor, ch: PortalChamber | null): string {
  const tag = (d.tagline ?? "").trim();
  if (tag) return tag;
  const place = ch?.hospital?.name || ch?.chamberName || null;
  const area = [ch?.thana, ch?.district].filter(Boolean).join(", ");
  return [place, area].filter(Boolean).join(" · ") || "চেম্বার তথ্য প্রোফাইলে";
}

/** Strict thana match only — never fall back to another thana's chamber. */
export function chamberHere(d: LocationDoctor, thanaNames: string[]): PortalChamber | null {
  const list = d.chambers ?? [];
  return list.find((c) => c.thana && thanaNames.includes(c.thana)) ?? null;
}

/**
 * Universal doctor card — the SAME card everywhere (main grid, AI suggest
 * results, anywhere else). Clicking the card calls `onSelect` so the caller
 * opens the standard detail popup (`DoctorPortalModal`).
 */
export function DoctorCard({
  doctor: d,
  thanaNames,
  areaTitle,
  host,
  onSelect,
}: {
  doctor: LocationDoctor;
  thanaNames: string[];
  areaTitle: string;
  host: string;
  onSelect: (d: LocationDoctor) => void;
}) {
  const ch = chamberHere(d, thanaNames);
  const yrs = experienceYears(d.startedYear);
  return (
    <article
      onClick={() => onSelect(d)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(d);
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
          loading="lazy"
          decoding="async"
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
        <span title={areaTitle} className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm ring-1 ring-emerald-300">📍</span>
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
}
