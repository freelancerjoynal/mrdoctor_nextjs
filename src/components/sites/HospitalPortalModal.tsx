"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { buildPortalUrl } from "@/lib/portal";
import { doctorPortrait } from "@/lib/profile";
import { Stars } from "@/components/reviews";
import type { LocationHospital } from "@/components/sites/LocationSite";

/**
 * Full-detail popup for a thana-portal hospital card.
 * Chambers in this thana with fees, chamber doctors (each linking to
 * their own subdomain portal), patient reviews — and "হাসপাতাল দেখুন"
 * goes to the hospital's own subdomain portal (`<slug>.domain.com`).
 */
export function HospitalPortalModal({
  hospital,
  thanaNames,
  areaTitle,
  host,
  onClose,
}: {
  hospital: LocationHospital | null;
  thanaNames: string[];
  areaTitle: string;
  host: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!hospital) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [hospital, onClose]);

  const chambersHere = useMemo(() => {
    if (!hospital) return [];
    // Strict thana match only — chambers from other thanas never show here.
    return (hospital.chambers ?? []).filter((c) => c.thana && thanaNames.includes(c.thana));
  }, [hospital, thanaNames]);

  const chamberDoctors = useMemo(() => {
    const seen = new Map<string, NonNullable<NonNullable<LocationHospital["chambers"]>[number]["doctor"]>>();
    for (const c of chambersHere) {
      if (c.doctor?.username && !seen.has(c.doctor.username)) seen.set(c.doctor.username, c.doctor);
    }
    return [...seen.values()];
  }, [chambersHere]);

  return (
    <AnimatePresence>
      {hospital ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={hospital.name}
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
            <div className="relative overflow-hidden bg-gradient-to-br from-sky-700 via-blue-800 to-indigo-900 px-5 py-6 text-white sm:px-6">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <button
                onClick={onClose}
                aria-label="বন্ধ করুন"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg font-bold hover:bg-white/30"
              >
                ✕
              </button>
              <div className="flex items-start gap-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-4xl ring-2 ring-white/30">
                  🏥
                </span>
                <div className="min-w-0 pr-8">
                  <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-black">
                    <span className="rounded-full bg-white/95 px-2 py-0.5 text-sky-700">✓ যাচাইকৃত</span>
                    <span className="rounded-full bg-white/15 px-2 py-0.5 ring-1 ring-white/25">{areaTitle}</span>
                  </p>
                  <h3 className="mt-1.5 text-xl font-black leading-tight">{hospital.name}</h3>
                  {hospital.address ? (
                    <p className="mt-1 text-xs font-bold text-sky-100">📍 {hospital.address}</p>
                  ) : null}
                  {hospital.phone ? (
                    <p className="mt-0.5 text-xs font-bold text-sky-100">📞 {hospital.phone}</p>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/15">
                  <p className="text-[10px] font-bold text-sky-100">চেম্বার</p>
                  <p className="text-xs font-black">{chambersHere.length}টি</p>
                </div>
                <div className="rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/15">
                  <p className="text-[10px] font-bold text-sky-100">ডাক্তার</p>
                  <p className="text-xs font-black">{chamberDoctors.length} জন</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 px-4 py-5 sm:px-6">
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
                          {c.chamberName || hospital.name}
                        </p>
                        {c.addressLine ? (
                          <p className="mt-0.5 text-xs font-bold text-slate-500">📍 {c.addressLine}</p>
                        ) : null}
                        {c.doctor ? (
                          <span onClick={(e) => e.stopPropagation()}>
                            <a
                              href={buildPortalUrl(c.doctor.username, host)}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 flex items-center gap-2 rounded-xl bg-white p-2 text-left ring-1 ring-slate-200 transition hover:ring-teal-300"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={doctorPortrait(c.doctor.profilePicture)}
                                alt={c.doctor.name}
                                className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-black text-slate-900">
                                  {c.doctor.name}
                                </span>
                                <span className="block truncate text-[11px] font-bold text-teal-700">
                                  {c.doctor.speciality} · প্রোফাইল →
                                </span>
                              </span>
                            </a>
                          </span>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-black">
                          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-800 ring-1 ring-sky-100">
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

              {/* Chamber doctors */}
              {chamberDoctors.length > 0 ? (
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                  <p className="text-sm font-black text-slate-900">
                    🩺 যেসব ডাক্তার বসেন ({chamberDoctors.length})
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {chamberDoctors.slice(0, 12).map((d) => (
                      <span key={d.username} onClick={(e) => e.stopPropagation()}>
                        <a
                          href={buildPortalUrl(d.username, host)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-full bg-slate-50 py-1 pl-1 pr-3 ring-1 ring-slate-200 transition hover:ring-teal-300"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={doctorPortrait(d.profilePicture)}
                            alt={d.name}
                            className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <span className="max-w-32 truncate text-xs font-black text-slate-800">
                            {d.name}
                          </span>
                        </a>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Patient reviews */}
              {(hospital.reviews ?? []).length > 0 ? (
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                  <p className="text-sm font-black text-slate-900">💬 রোগীদের মতামত</p>
                  <ul className="mt-2.5 space-y-2.5">
                    {(hospital.reviews ?? []).slice(0, 3).map((r) => (
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

              {/* Actions: View Hospital → hospital's own subdomain */}
              <div className="grid gap-2.5 sm:grid-cols-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onClose}
                  className="rounded-xl border-2 border-slate-200 px-5 py-3 text-center text-sm font-black text-slate-600 hover:bg-slate-100"
                >
                  ← ফিরে যান
                </button>
                <a
                  href={buildPortalUrl(hospital.slug, host)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-sky-700 px-5 py-3 text-center text-sm font-black text-white shadow hover:bg-sky-800"
                >
                  হাসপাতাল দেখুন →
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
