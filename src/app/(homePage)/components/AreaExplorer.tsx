"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DivisionNode } from "@/lib/locations";
import { slugForBanglaThana } from "@/lib/locationSlugs";
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

/** Tab-style explorer over the REAL chamber tree: division → district → thana, instantly. */
export function AreaExplorer({ tree }: { tree: DivisionNode[] }) {  const [division, setDivision] = useState(tree[0]?.division ?? "");
  const [districtName, setDistrictName] = useState(tree[0]?.districts[0]?.district ?? "");
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const searching = trimmed.length > 0;

  const activeDivision = useMemo(
    () => tree.find((d) => d.division === division) ?? tree[0],
    [tree, division],
  );

  // Search across every division; otherwise show the active division's districts.
  const visibleDistricts = useMemo(() => {
    if (!searching) return activeDivision?.districts ?? [];
    return tree.flatMap((d) =>
      d.districts.filter((x) => x.district.includes(trimmed)),
    );
  }, [searching, trimmed, tree, activeDivision]);

  const active =
    visibleDistricts.find((d) => d.district === districtName) ?? visibleDistricts[0];

  function pickDivision(name: string) {
    const div = tree.find((d) => d.division === name);
    if (!div) return;
    setDivision(name);
    setQuery("");
    setDistrictName(div.districts[0]?.district ?? "");
  }

  if (tree.length === 0) {
    return (
      <section id="areas" className="scroll-mt-20 bg-slate-50 py-12 sm:py-16">
        <p className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-400 ring-1 ring-slate-200">
          এখনও কোনো এলাকার তথ্য পাওয়া যায়নি। পরে আবার দেখুন।
        </p>
      </section>
    );
  }

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
            placeholder="জেলা খুঁজুন… (যেমন: নীলফামারী)"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:text-sm"
          />
        </div>

        {/* Division pills */}
        {!searching && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {tree.map((d, i) => (
              <button
                key={d.division}
                onClick={() => pickDivision(d.division)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
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

        {/* District tabs */}
        <div className="mt-6">
          {visibleDistricts.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-400 ring-1 ring-slate-200">
              “{trimmed}” নামে কোনো জেলা পাওয়া যায়নি। অন্য নামে খুঁজুন।
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
              {visibleDistricts.map((d) => {
                const selected = active?.district === d.district;
                return (
                  <button
                    key={d.district}
                    onClick={() => setDistrictName(d.district)}
                    className={`relative rounded-2xl px-3 py-3 text-sm font-bold transition sm:text-base ${
                      selected
                        ? "bg-slate-900 text-white shadow-xl"
                        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-indigo-300"
                    }`}
                  >
                    {d.district}
                    <span
                      className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] ${
                        selected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {d.thanas.length}
                    </span>
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
              className="mt-6 overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-2xl sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-black sm:text-2xl">
                  📍 {active.district}
                  <span className="ml-2 align-middle text-xs font-bold text-cyan-300 sm:text-sm">
                    {active.thanas.length}টি থানা · {active.doctors} জন ডাক্তার
                    {active.hospitals > 0 && ` · ${active.hospitals}টি হাসপাতাল`}
                  </span>
                </h3>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                  ✓ সেবা চালু আছে
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {active.thanas.map((t, i) => (
                  <ThanaPill
                    key={t.thana}
                    thana={t.thana}
                    district={active.district}
                    doctors={t.doctors}
                    index={i}
                  />
                ))}
              </div>
              <p className="mt-5 rounded-2xl bg-white/5 p-3 text-center text-xs text-white/60 ring-1 ring-white/10 sm:text-sm">
                💡 {active.district}-এর যেকোনো থানা থেকে এখনই ডাক্তারের সিরিয়াল নিন —
                দেরি নয়, অপেক্ষা নয়, সময়মতো ভিজিট।
              </p>
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
 */
function ThanaPill({
  thana,
  district,
  doctors,
  index,
}: {
  thana: string;
  district: string;
  doctors: number;
  index: number;
}) {
  const slug = slugForBanglaThana(thana, district);
  const href = usePortalHref(slug);
  const cls =
    "rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold ring-1 ring-white/15 transition hover:bg-gradient-to-r hover:from-indigo-500 hover:to-fuchsia-500 sm:text-sm";
  const inner = (
    <>
      {thana}
      {doctors > 0 && <span className="ml-1.5 text-cyan-300">{doctors} জন</span>}
    </>
  );
  const anim = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { delay: Math.min(index * 0.02, 0.3) },
  };
  return href ? (
    <motion.a href={href} className={cls} title={`${thana} পোর্টাল খুলুন`} {...anim}>
      {inner}
    </motion.a>
  ) : (
    <motion.span className={`cursor-default ${cls}`} {...anim}>
      {inner}
    </motion.span>
  );
}
