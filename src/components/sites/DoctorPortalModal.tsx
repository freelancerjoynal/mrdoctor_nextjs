"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { buildPortalUrl } from "@/lib/portal";
import { doctorPortrait, fallbackAvatar } from "@/lib/profile";
import { dayEnToBn } from "@/lib/days";
import { Stars } from "@/components/reviews";
import type { LocationDoctor } from "@/components/sites/LocationSite";

function experienceYears(startedYear?: number | null): number | null {
  if (!startedYear) return null;
  const years = new Date().getFullYear() - startedYear;
  return years > 0 ? years : null;
}

/**
 * Full-detail popup for a thana-portal doctor card.
 * Everything shown comes from the portal payload (no extra fetch):
 * tagline, bio, chambers in this thana with fees, weekly schedule,
 * patient reviews — and "View Profile" goes to the doctor's own
 * subdomain portal (`<username>.domain.com`).
 */
export function DoctorPortalModal({
  doctor,
  thanaNames,
  areaTitle,
  host,
  onClose,
}: {
  doctor: LocationDoctor | null;
  thanaNames: string[];
  areaTitle: string;
  host: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!doctor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [doctor, onClose]);

  const yrs = doctor ? experienceYears(doctor.startedYear) : null;
  // Strict thana match only — chambers/schedules from other thanas are
  // never shown here, even if the doctor has them elsewhere.
  const chambersHere = doctor
    ? (doctor.chambers ?? []).filter((c) => c.thana && thanaNames.includes(c.thana))
    : [];
  const localChamberIds = new Set(chambersHere.map((c) => c.id));
  const schedulesHere = (doctor?.schedules ?? []).filter(
    (s) => s.chamber && localChamberIds.has(s.chamber.id),
  );

  return (
    <AnimatePresence>
      {doctor ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={doctor.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            {/* Identity band */}
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-cyan-900 px-5 py-6 text-white sm:px-6">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <button
                onClick={onClose}
                aria-label="বন্ধ করুন"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg font-bold hover:bg-white/30"
              >
                ✕
              </button>
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- portrait may be any external doctor-uploaded URL */}
                <img
                  src={doctorPortrait(doctor.profilePicture)}
                  alt={doctor.name}
                  loading="lazy"
                  decoding="async"
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-white/30"
                  onError={(e) => {
                    const fallback = fallbackAvatar();
                    if (!e.currentTarget.src.endsWith(fallback)) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
                <div className="min-w-0 pr-8">
                  <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-black">
                    <span className="rounded-full bg-white/95 px-2 py-0.5 text-teal-700">✓ যাচাইকৃত</span>
                    <span className="rounded-full bg-white/15 px-2 py-0.5 ring-1 ring-white/25">{doctor.speciality}</span>
                  </p>
                  <h3 className="mt-1.5 text-xl font-black leading-tight">{doctor.name}</h3>
                  <p className="mt-0.5 text-xs font-bold text-teal-100">{doctor.degree}</p>
                  {doctor.tagline ? (
                    <p className="mt-2 border-l-2 border-teal-300/60 pl-3 text-sm italic leading-relaxed text-teal-50">
                      “{doctor.tagline}”
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/15">
                  <p className="text-[10px] font-bold text-teal-100">অভিজ্ঞতা</p>
                  <p className="text-xs font-black">{yrs ? `${yrs}+ বছর` : "—"}</p>
                </div>
                <div className="rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/15">
                  <p className="text-[10px] font-bold text-teal-100">বিএমডিসি নং</p>
                  <p className="truncate text-xs font-black">{doctor.bmdcNumber || "—"}</p>
                </div>
                <div className="rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/15">
                  <p className="text-[10px] font-bold text-teal-100">এলাকা</p>
                  <p className="truncate text-xs font-black">{areaTitle}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 px-4 py-5 sm:px-6">
              {doctor.bio ? (
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                  <p className="text-sm font-black text-slate-900">👨‍⚕️ পরিচিতি</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{doctor.bio}</p>
                </div>
              ) : null}

              {/* Chambers in this thana */}
              {chambersHere.length > 0 ? (
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                  <p className="text-sm font-black text-slate-900">
                    📍 এই থানায় চেম্বার ({chambersHere.length})
                  </p>
                  <ul className="mt-2.5 space-y-2.5">
                    {chambersHere.map((c) => (
                      <li key={c.id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="text-sm font-black text-slate-900">
                          {c.hospital?.name || c.chamberName || "চেম্বার"}
                        </p>
                        {c.addressLine ? (
                          <p className="mt-0.5 text-xs font-bold text-slate-500">📍 {c.addressLine}</p>
                        ) : null}
                        {[c.thana, c.district].filter(Boolean).length > 0 ? (
                          <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                            {[c.thana, c.district].filter(Boolean).join(", ")}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-black">
                          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-800 ring-1 ring-teal-100">
                            নতুন ৳{c.newPatientFee ?? 0}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                            পুরনো ৳{c.oldPatientFee ?? 0}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Weekly schedule (this thana's chambers only) */}
              {schedulesHere.length > 0 ? (
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                  <p className="text-sm font-black text-slate-900">🗓️ সাপ্তাহিক সময়সূচি</p>
                  <ul className="mt-2.5 space-y-1.5">
                    {schedulesHere.slice(0, 7).map((s, i) => (
                      <li
                        key={`${s.dayOfWeek}-${s.startTime}-${i}`}
                        className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold ring-1 ring-slate-100"
                      >
                        <span className="text-slate-900">{dayEnToBn(s.dayOfWeek)}</span>
                        <span className="text-slate-500">
                          {s.startTime} – {s.endTime}
                          {s.chamber?.chamberName ? ` · ${s.chamber.chamberName}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Patient reviews (embedded in portal payload) */}
              {(doctor.reviews ?? []).length > 0 ? (
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                  <p className="text-sm font-black text-slate-900">💬 রোগীদের মতামত</p>
                  <ul className="mt-2.5 space-y-2.5">
                    {(doctor.reviews ?? []).slice(0, 3).map((r) => (
                      <li key={r.id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <Stars rating={r.rating} className="text-xs" />
                        {r.title ? (
                          <p className="mt-1 text-sm font-bold text-slate-900">{r.title}</p>
                        ) : null}
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">“{r.comment}”</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">— {r.reviewerName}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Actions: View Profile → doctor's own subdomain */}
              <div className="grid gap-2.5 sm:grid-cols-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onClose}
                  className="rounded-xl border-2 border-slate-200 px-5 py-3 text-center text-sm font-black text-slate-600 hover:bg-slate-100"
                >
                  ← ফিরে যান
                </button>
                <a
                  href={buildPortalUrl(doctor.username, host)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-teal-600 px-5 py-3 text-center text-sm font-black text-white shadow hover:bg-teal-700"
                >
                  প্রোফাইল দেখুন →
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
