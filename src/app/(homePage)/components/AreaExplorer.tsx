"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DivisionNode, DistrictNode } from "@/lib/locations";
import { DIVISIONS } from "@/lib/areas";
import { slugForBanglaThana, districtEnFor } from "@/lib/locationSlugs";
import { toBn } from "@/lib/bn";
import { usePortalHref } from "@/lib/locationClient";

const DIVISION_COLORS = [
  "from-indigo-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-blue-500",
  "from-rose-500 to-pink-500",
  "from-violet-500 to-fuchsia-500",
  "from-cyan-500 to-sky-500",
  "from-orange-500 to-rose-500",
];

function isNilphamari(name: string) {
  return name === "নীলফামারী" || name.toLowerCase() === "nilphamari";
}

function isRangpur(name: string) {
  return name === "রংপুর" || name.toLowerCase() === "rangpur";
}

/**
 * Static full-country skeleton (8 divisions → 64 districts → thanas)
 * with the live chamber tree overlaid on top. Divisions without any
 * chamber data still show up — their thanas render disabled with a
 * "join as a doctor" call-to-action instead of dead links.
 */
function mergeFullTree(tree: DivisionNode[]): DivisionNode[] {
  const byDiv = new Map(tree.map((d) => [d.division, d]));
  return DIVISIONS.map((sdiv) => {
    const live = byDiv.get(sdiv.name);
    if (!live) {
      return {
        division: sdiv.name,
        chambers: 0,
        doctors: 0,
        hospitals: 0,
        districts: sdiv.districts.map((sdist) => ({
          district: sdist.name,
          chambers: 0,
          doctors: 0,
          hospitals: 0,
          thanas: sdist.thanas.map((t) => ({ thana: t, chambers: 0, doctors: 0, hospitals: 0 })),
        })),
      };
    }
    const byDist = new Map(live.districts.map((d) => [d.district, d]));
    const districts: DistrictNode[] = [...live.districts];
    for (const sdist of sdiv.districts) {
      if (!byDist.has(sdist.name)) {
        districts.push({
          district: sdist.name,
          chambers: 0,
          doctors: 0,
          hospitals: 0,
          thanas: sdist.thanas.map((t) => ({ thana: t, chambers: 0, doctors: 0, hospitals: 0 })),
        });
      }
    }
    return { ...live, districts };
  });
}

/** Default division: Rangpur when present, else the first one. */
function defaultDivision(full: DivisionNode[]): string {
  return full.find((d) => isRangpur(d.division))?.division ?? full[0]?.division ?? "";
}

/** Default district: Nilphamari when present, else the first one. */
function defaultDistrict(full: DivisionNode[], division: string): string {
  const div = full.find((d) => d.division === division) ?? full[0];
  return (
    div?.districts.find((x) => isNilphamari(x.district))?.district ??
    div?.districts[0]?.district ??
    ""
  );
}

/** Tab-style explorer: division → district → thana, instantly. */
export function AreaExplorer({ tree }: { tree: DivisionNode[] }) {
  const fullTree = useMemo(() => mergeFullTree(tree), [tree]);

  const [division, setDivision] = useState(() => defaultDivision(fullTree));
  const [districtName, setDistrictName] = useState(() =>
    defaultDistrict(fullTree, defaultDivision(fullTree)),
  );
  const [query, setQuery] = useState("");
  // Which thana portal is currently opening (spinner feedback on click).
  const [navigating, setNavigating] = useState<string | null>(null);

  const trimmed = query.trim();
  const searching = trimmed.length > 0;

  const activeDivision = useMemo(
    () => fullTree.find((d) => d.division === division) ?? fullTree[0],
    [fullTree, division],
  );

  // Bilingual search across every division (Bangla + English):
  // "nilphamari" matches নীলফামারী, "রংপুর" matches Rangpur, etc.
  // Otherwise show the active division's districts.
  const visibleDistricts = useMemo(() => {
    if (!searching) return activeDivision?.districts ?? [];
    const qLower = trimmed.toLowerCase();
    return fullTree.flatMap((d) =>
      d.districts.filter((x) => {
        if (x.district.includes(trimmed)) return true;
        const en = districtEnFor(x.district);
        return en != null && en.toLowerCase().includes(qLower);
      }),
    );
  }, [searching, trimmed, fullTree, activeDivision]);

  const active =
    visibleDistricts.find((d) => d.district === districtName) ?? visibleDistricts[0];

  function pickDivision(name: string) {
    const div = fullTree.find((d) => d.division === name);
    if (!div) return;
    setDivision(name);
    setQuery("");
    setNavigating(null);
    setDistrictName(
      div.districts.find((x) => isNilphamari(x.district))?.district ??
        div.districts[0]?.district ??
        "",
    );
  }

  function pickDistrict(name: string) {
    setDistrictName(name);
    setNavigating(null);
  }

  if (fullTree.length === 0) {
    return (
      <section id="areas" className="scroll-mt-20 bg-slate-50 py-12 sm:py-16">
        <p className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-400 ring-1 ring-slate-200">
          এখনও কোনো এলাকার তথ্য পাওয়া যায়নি। পরে আবার দেখুন।
        </p>
      </section>
    );
  }

  const emptyDistrict =
    !!active && active.thanas.every((t) => t.chambers === 0 && t.doctors === 0 && t.hospitals === 0);

  return (
    <section id="areas" className="scroll-mt-20 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700">
            এলাকা অনুযায়ী খুঁজুন
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
            আপনার এলাকা বেছে নিন
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
            বিভাগ, তারপর জেলায় ক্লিক করুন — সাথে সাথে নিচে থানার তালিকা দেখা যাবে।
          </p>
        </div>

        {/* Search */}
        <div className="mx-auto mt-6 max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="জেলা খুঁজুন… বাংলা বা English (যেমন: নীলফামারী / Nilphamari)"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:text-sm"
          />
        </div>

        {/* Division pills — all 8 divisions */}
        {!searching && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {fullTree.map((d, i) => (
              <button
                key={d.division}
                onClick={() => pickDivision(d.division)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
                  d.division === activeDivision?.division
                    ? `bg-gradient-to-r ${DIVISION_COLORS[i % DIVISION_COLORS.length]} text-white shadow-lg`
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-indigo-300"
                }`}
              >
                {d.division}
              </button>
            ))}
          </div>
        )}

        {/* District grid — always white boxes, selected = white + emerald ring */}
        <div className="mt-6">
          {visibleDistricts.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-400 ring-1 ring-slate-200">
              “{trimmed}” নামে কোনো জেলা পাওয়া যায়নি। অন্য নামে খুঁজুন।
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
              {visibleDistricts.map((d) => {
                const selected = active?.district === d.district;
                const en = districtEnFor(d.district);
                return (
                  <button
                    key={d.district}
                    onClick={() => pickDistrict(d.district)}
                    title={en ?? d.district}
                    className={`relative rounded-2xl bg-white px-3 py-3 text-sm font-bold transition active:scale-95 sm:text-base ${
                      selected
                        ? "text-emerald-800 shadow-xl ring-2 ring-emerald-500"
                        : "text-slate-700 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-emerald-300"
                    }`}
                  >
                    {selected && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs text-white shadow">
                        ✓
                      </span>
                    )}
                    {d.district}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Thana panel */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.div
              key={active.district}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mt-6 overflow-hidden rounded-3xl bg-white shadow-[0_24px_70px_-24px_rgba(16,120,80,0.45)] ring-1 ring-emerald-100"
            >
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-fuchsia-500" />
              <div className="p-5 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2.5 text-lg font-black text-slate-900 sm:text-2xl">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl shadow-lg">
                      📍
                    </span>
                    {active.district}
                  </h3>
                  {emptyDistrict ? (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                      🕐 শীঘ্রই সেবা আসছে
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                      ✓ সেবা চালু আছে
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 ring-1 ring-amber-200">
                    {toBn(active.thanas.length)}টি থানা
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-200">
                    {toBn(active.doctors)} জন ডাক্তার
                  </span>
                  {active.hospitals > 0 && (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-800 ring-1 ring-sky-200">
                      {toBn(active.hospitals)}টি হাসপাতাল
                    </span>
                  )}
                </div>

                {emptyDistrict ? (
                  <div className="mt-5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 p-5 text-center ring-1 ring-amber-200">
                    <p className="text-base font-black text-slate-900">
                      🩺 এই এলাকায় এখনো কোনো ডাক্তার যোগ হয়নি
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                      প্রথম ডাক্তার হিসেবে যোগ দিন — আপনার চেম্বার, সিরিয়াল আর
                      ওয়েবসাইট সম্পূর্ণ ফ্রি।
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                      <a
                        href="/apply/doctor"
                        className="rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 px-5 py-2.5 text-sm font-black text-emerald-950 shadow-lg transition hover:brightness-105 active:scale-95"
                      >
                        ডাক্তার হিসেবে যোগ দিন →
                      </a>
                      <a
                        href="/apply/hospital"
                        className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95"
                      >
                        হাসপাতাল নিবন্ধন →
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-5 text-xs font-bold text-slate-400">
                      👇 থানায় ক্লিক করলেই সেই এলাকার পোর্টাল খুলবে
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      {active.thanas.map((t, i) => (
                        <ThanaPill
                          key={t.thana}
                          thana={t.thana}
                          district={active.district}
                          doctors={t.doctors}
                          hasData={t.chambers > 0 || t.doctors > 0 || t.hospitals > 0}
                          index={i}
                          navigating={navigating}
                          onNavigate={setNavigating}
                        />
                      ))}
                    </div>
                    <p className="mt-5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 p-3 text-center text-xs text-slate-600 ring-1 ring-amber-200 sm:text-sm">
                      💡 {active.district}-এর যেকোনো থানায় ক্লিক করুন — সেই এলাকার
                      ডাক্তার ও হাসপাতালের পোর্টাল খুলে যাবে।
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/**
 * One thana pill — own component so the portal href hook runs per pill.
 * usePortalHref renders `/s/<slug>` on the server + first client render
 * (identical HTML, no hydration mismatch) and swaps to the absolute
 * `<slug>.domain.com` URL after hydration.
 * Clicking a live pill shows a spinner until the portal page loads.
 * Zero-data thanas render disabled (no dead links).
 */
function ThanaPill({
  thana,
  district,
  doctors,
  hasData,
  index,
  navigating,
  onNavigate,
}: {
  thana: string;
  district: string;
  doctors: number;
  hasData: boolean;
  index: number;
  navigating: string | null;
  onNavigate: (slug: string) => void;
}) {
  const slug = slugForBanglaThana(thana, district);
  const href = usePortalHref(slug);
  const live = hasData && !!href;
  const busy = live && navigating === slug;

  const anim = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { delay: Math.min(index * 0.02, 0.3) },
  };

  if (!live) {
    return (
      <motion.span
        title="এই থানায় এখনো সেবা চালু হয়নি"
        className="flex cursor-not-allowed items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 text-sm font-black text-slate-400 opacity-80 ring-1 ring-slate-200"
        {...anim}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-400">
          {toBn(index + 1)}
        </span>
        <span>{thana}</span>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-400">
          শীঘ্রই
        </span>
      </motion.span>
    );
  }

  const cls =
    "group flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 text-sm font-black text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-teal-600 hover:text-white hover:shadow-xl hover:ring-emerald-600 active:scale-95";
  const inner = busy ? (
    <>
      <span
        aria-hidden="true"
        className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white"
      />
      <span>খুলছে…</span>
    </>
  ) : (
    <>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-black text-white shadow group-hover:from-white/25 group-hover:to-white/25 group-hover:ring-1 group-hover:ring-white/40">
        {toBn(index + 1)}
      </span>
      <span>{thana}</span>
      {doctors > 0 && (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-800 group-hover:bg-white/20 group-hover:text-white">
          {toBn(doctors)} জন
        </span>
      )}
      <span className="font-black text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-white">
        →
      </span>
    </>
  );

  return (
    <motion.a
      href={href}
      onClick={() => slug && onNavigate(slug)}
      className={
        busy
          ? "flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2.5 text-sm font-black text-white shadow-xl ring-1 ring-emerald-600"
          : cls
      }
      title={`${thana} পোর্টাল খুলুন`}
      {...anim}
    >
      {inner}
    </motion.a>
  );
}
