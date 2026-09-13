"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { doctorPortrait, fallbackAvatar } from "@/lib/profile";
import type { StaffDoctorInfo } from "@/lib/auth/types";

/** "My doctor" card — shows staff which doctor they work under. */
export function MyDoctorCard({ doctor }: { doctor: StaffDoctorInfo }) {
  const subline = [doctor.degree, doctor.speciality].filter(Boolean).join(" · ");

  return (
    <FadeIn delay={0.15}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-400 p-[1px] shadow-xl">
        <div className="rounded-2xl bg-white/95 p-4 backdrop-blur sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            🩺 আমার ডাক্তার — যার অধীনে কাজ করছি
          </p>
          <div className="mt-3 flex min-w-0 items-center gap-3 sm:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- portrait may be any external doctor-uploaded URL */}
            <img
              src={doctorPortrait(doctor.profilePicture)}
              alt={doctor.name}
              className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-lg ring-1 ring-slate-200 sm:h-16 sm:w-16"
              onError={(e) => {
                const fallback = fallbackAvatar();
                if (!e.currentTarget.src.endsWith(fallback)) {
                  e.currentTarget.src = fallback;
                }
              }}
            />
            <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-900 sm:text-lg">
                {doctor.name}
              </p>
              {subline && <p className="truncate text-xs text-slate-500 sm:text-sm">{subline}</p>}
              {doctor.tagline && (
                <p className="mt-0.5 truncate text-xs italic text-slate-400">{doctor.tagline}</p>
              )}
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:gap-3">
            <div className="min-w-0 rounded-xl bg-sky-50 px-3 py-2">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ফোন</dt>
              <dd className="truncate font-bold text-sky-700">{doctor.phone || "—"}</dd>
            </div>
            <div className="min-w-0 rounded-xl bg-sky-50 px-3 py-2">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">বিশেষজ্ঞতা</dt>
              <dd className="truncate font-bold text-sky-700">{doctor.speciality || "—"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </FadeIn>
  );
}
