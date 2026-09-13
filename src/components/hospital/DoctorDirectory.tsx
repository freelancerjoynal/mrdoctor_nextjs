"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { buildSerialUrl } from "@/lib/serial";
import { doctorPortrait, fallbackAvatar } from "@/lib/profile";
import type { HospitalDoctorEntry } from "./doctorTypes";
import { DoctorQuickView } from "./DoctorQuickView";

const ALL = "সবাই";

/** First `max` words + … (card teaser; popup shows the full tagline). */
function truncateWords(text: string, max = 10): string {
  const words = text.trim().split(/\s+/);
  return words.length > max ? `${words.slice(0, max).join(" ")}…` : text;
}

/**
 * Hospital doctor directory — department filter chips + responsive grid.
 * Clicking a doctor opens the animated quick-view popup
 * (speciality + tagline + spotlight reviews + portal link).
 */
export function DoctorDirectory({
  doctors,
  serialBase,
}: {
  doctors: HospitalDoctorEntry[];
  serialBase: string;
}) {
  const [active, setActive] = useState<string>(ALL);
  const [openUsername, setOpenUsername] = useState<string | null>(null);

  const departments = useMemo(() => {
    const set = new Map<string, number>();
    for (const d of doctors) set.set(d.speciality, (set.get(d.speciality) ?? 0) + 1);
    return [...set.entries()].sort((a, b) => b[1] - a[1]);
  }, [doctors]);

  const visible = active === ALL ? doctors : doctors.filter((d) => d.speciality === active);
  const openEntry = openUsername ? (doctors.find((d) => d.username === openUsername) ?? null) : null;

  return (
    <div>
      {/* Department filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActive(ALL)}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            active === ALL
              ? "bg-blue-700 text-white shadow"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {ALL} ({doctors.length})
        </button>
        {departments.map(([dept, count]) => (
          <button
            key={dept}
            onClick={() => setActive(dept)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              active === dept
                ? "bg-blue-700 text-white shadow"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {dept} ({count})
          </button>
        ))}
      </div>

      {/* Doctor grid */}
      {visible.length === 0 ? (
        <p className="mt-8 text-slate-500">এই বিভাগে কোনো ডাক্তার পাওয়া যায়নি।</p>
      ) : (
        <motion.ul
          key={active}
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {visible.map((d) => (
            <motion.li
              key={d.username}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
              }}
            >
              <button
                onClick={() => setOpenUsername(d.username)}
                className="group flex w-full items-center gap-4 rounded-xl border-l-4 border-blue-600 bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- portrait may be any external doctor-uploaded URL */}
                <img
                  src={doctorPortrait(d.profilePicture)}
                  alt={d.name}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                  onError={(e) => {
                    const fallback = fallbackAvatar();
                    if (!e.currentTarget.src.endsWith(fallback)) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-slate-900 group-hover:text-blue-800">
                    {d.name}
                  </span>
                  <span className="mt-0.5 inline-block rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                    {d.speciality}
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-500">{d.degree}</span>
                  {d.tagline && (
                    <span className="mt-1 block truncate text-[13px] text-slate-600">
                      {truncateWords(d.tagline, 10)}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-bold text-blue-700 transition group-hover:translate-x-1">→</span>
              </button>
            </motion.li>
          ))}
        </motion.ul>
      )}

      <AnimatePresence>
        {openEntry && (
          <DoctorQuickView
            key={openEntry.username}
            entry={openEntry}
            serialHref={buildSerialUrl(serialBase, openEntry.username)}
            onClose={() => setOpenUsername(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
