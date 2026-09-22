"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { doctorPortrait, fallbackAvatar } from "@/lib/profile";
import { CreditBalanceBadge } from "@/components/dashboard/CreditBalanceBadge";

export interface HeroDoctor {
  name: string;
  degree?: string | null;
  speciality?: string | null;
  tagline?: string | null;
  profilePicture?: string | null;
}

/** Beautiful doctor hero for /dashboard — profile picture, name, degree, tagline. */
export function DoctorHeroCard({ doctor, greeting }: { doctor: HeroDoctor; greeting: string }) {
  const subline = [doctor.degree, doctor.speciality].filter(Boolean).join(" · ");
  const fallback = fallbackAvatar();

  return (
    <FadeIn>
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-2xl sm:rounded-3xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- portrait may be any external doctor-uploaded URL */}
          <img
            src={doctorPortrait(doctor.profilePicture)}
            alt={doctor.name}
            className="h-24 w-24 shrink-0 rounded-3xl border-2 border-white/50 object-cover shadow-2xl sm:h-32 sm:w-32"
            onError={(e) => {
              if (!e.currentTarget.src.endsWith(fallback)) {
                e.currentTarget.src = fallback;
              }
            }}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80 sm:text-sm">
              🩺 ডাক্তার ড্যাশবোর্ড
            </p>
            <h1 className="mt-1 break-words text-2xl font-black tracking-tight sm:text-4xl">
              হ্যালো, {greeting} 👋
            </h1>
            {subline && <p className="mt-1 text-sm font-semibold text-white/90 sm:text-base">{subline}</p>}
            {doctor.tagline && (
              <p className="mt-1 max-w-lg truncate text-sm italic text-white/75 sm:text-base">
                “{doctor.tagline}”
              </p>
            )}
            <div className="mt-2">
              <CreditBalanceBadge />
            </div>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
