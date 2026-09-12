"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { doctorPortrait, fallbackAvatar } from "@/lib/profile";
import { buildDoctorPortalUrl } from "@/lib/portal";
import { Stars } from "@/components/reviews";
import type { HospitalDoctorEntry } from "./doctorTypes";

interface SpotlightReview {
  id: string;
  rating: number;
  reviewerName: string;
  title?: string | null;
  comment: string;
}

/**
 * Quick-view popup for a hospital's doctor — info only (no booking form).
 * Shows speciality, tagline and 2 random picks from the latest 10 reviews;
 * "সম্পূর্ণ প্রোফাইল" opens the doctor's own subdomain portal
 * (`<username>.domain.com`) in a new tab, never an in-site path.
 */
export function DoctorQuickView({
  entry,
  serialHref,
  onClose,
}: {
  entry: HospitalDoctorEntry;
  serialHref: string;
  onClose: () => void;
}) {
  // 2 random picks from the latest 10 reviews of this doctor.
  const [spotlight, setSpotlight] = useState<SpotlightReview[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    let cancelled = false;
    fetch(
      `/api/backend/api/website/doctors/${encodeURIComponent(entry.username)}/reviews/spotlight`,
    )
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setSpotlight([]);
          return;
        }
        const json = (await res.json()) as { data: SpotlightReview[] };
        setSpotlight(Array.isArray(json.data) ? json.data : []);
      })
      .catch(() => {
        if (!cancelled) setSpotlight([]);
      });
    return () => {
      cancelled = true;
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [entry, onClose]);

  // Popup only ever opens from a user click on the client, so
  // window.location.host is available — the link goes straight to the
  // doctor's own subdomain portal, never an in-site path.
  const portalUrl =
    typeof window !== "undefined" ? buildDoctorPortalUrl(entry.username) : "";

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={entry.name}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
      >
        {/* Identity band — institutional blue, not the doctor-template emerald */}
        <div className="flex items-start gap-4 bg-blue-900 px-6 py-6 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- portrait may be any external doctor-uploaded URL */}
          <img
            src={doctorPortrait(entry.profilePicture, entry.gender)}
            alt={entry.name}
            className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-white/30"
            onError={(e) => {
              const fallback = fallbackAvatar(entry.gender);
              if (!e.currentTarget.src.endsWith(fallback)) {
                e.currentTarget.src = fallback;
              }
            }}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-300">{entry.speciality}</p>
            <h3 className="mt-1 text-2xl font-bold leading-tight">{entry.name}</h3>
            <p className="mt-1 text-sm text-blue-100">{entry.degree}</p>
            {entry.tagline && (
              <p className="mt-2 border-l-2 border-sky-300/60 pl-3 text-[15px] leading-relaxed text-blue-50">
                {entry.tagline}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg font-bold hover:bg-white/30"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 bg-slate-50 px-4 py-5 sm:px-6">
          {entry.chamberName && (
            <p className="flex items-center gap-2 text-[15px] text-slate-600">
              <span aria-hidden>📍</span> {entry.chamberName}
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-blue-50 px-3.5 py-1.5 font-semibold text-blue-800">
              নতুন রোগী ৳{entry.newPatientFee}
            </span>
            <span className="rounded-full bg-slate-100 px-3.5 py-1.5 font-semibold text-slate-700">
              পুরনো রোগী ৳{entry.oldPatientFee}
            </span>
          </div>

          {/* Latest 2 random reviews */}
          {spotlight !== null && spotlight.length > 0 && (
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
              <p className="text-sm font-bold text-slate-900">
                সাম্প্রতিক রোগীদের মতামত
              </p>
              <motion.ul
                className="mt-3 space-y-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {spotlight.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"
                  >
                    <Stars rating={r.rating} className="text-xs" />
                    {r.title && (
                      <p className="mt-1 text-sm font-bold text-slate-900">{r.title}</p>
                    )}
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      “{r.comment}”
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-500">
                      — {r.reviewerName}
                    </p>
                  </li>
                ))}
              </motion.ul>
            </div>
          )}

          <div className="grid gap-2.5 sm:grid-cols-2">
            <a
              href={serialHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border-2 border-blue-700 px-5 py-3 text-center font-bold text-blue-800 hover:bg-blue-50"
            >
              ✆ হোয়াটসঅ্যাপে সিরিয়াল
            </a>
            {portalUrl ? (
              <a
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-blue-700 px-5 py-3 text-center font-bold text-white shadow hover:bg-blue-800"
              >
                সম্পূর্ণ প্রোফাইল →
              </a>
            ) : (
              <span className="rounded-xl bg-blue-700/40 px-5 py-3 text-center font-bold text-white">
                সম্পূর্ণ প্রোফাইল →
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
