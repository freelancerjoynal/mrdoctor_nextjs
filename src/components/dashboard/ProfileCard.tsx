import { FadeIn } from "@/components/motion/FadeIn";
import { RoleBadge } from "./RoleBadge";
import { HeaderAvatar } from "./HeaderAvatar";
import type { Session, UserProfile } from "@/lib/auth/types";
import { getDisplayName } from "@/lib/auth/displayName";
import { ROLE_META } from "@/lib/auth/constants";
import Link from "next/link";

export function ProfileCard({
  session,
  profile,
}: {
  session: Session;
  profile: UserProfile | null;
}) {
  const meta = ROLE_META[session.role];
  const name = getDisplayName(session, profile);
  // Intro photo: doctor's own picture, staff's uploaded photo, else emoji badge.
  const introPicture =
    session.role === "DOCTOR"
      ? (profile?.doctorProfile?.profilePicture ?? null)
      : session.role === "DOCTOR_STAFF"
        ? (profile?.profilePicture ?? null)
        : null;
  const subline =
    session.role === "DOCTOR" && profile?.doctorProfile
      ? [profile.doctorProfile.degree, profile.doctorProfile.speciality]
          .filter(Boolean)
          .join(" · ") || profile.email
      : (profile?.email ?? meta.tagline);

  return (
    <FadeIn delay={0.1}>
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${meta.gradient} p-[1px] shadow-xl`}>
        <div className="rounded-2xl bg-white/95 p-4 backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              {introPicture ? (
                <HeaderAvatar
                  profilePicture={introPicture}
                  name={name}
                  className="h-12 w-12 rounded-2xl sm:h-14 sm:w-14"
                />
              ) : (
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-xl text-white shadow-lg sm:h-14 sm:w-14 sm:text-2xl`}
                >
                  {meta.emoji}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-base font-black text-slate-900 sm:text-lg">
                  {name}
                </p>
                <p className="truncate text-xs text-slate-500 sm:text-sm">{subline}</p>
              </div>
            </div>
            <RoleBadge role={session.role} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:mt-5 sm:gap-3 lg:grid-cols-4">
            {[
              ["ইউজার আইডি", session.userId.slice(0, 8) + "…"],
              ["ভূমিকা", meta.label],
              ["যাচাইকৃত", profile ? (profile.isVerified ? "হ্যাঁ ✓" : "না") : "—"],
              ["যোগদান", profile ? new Date(profile.createdAt).toLocaleDateString("bn-BD") : "—"],
            ].map(([k, v]) => (
              <div key={k} className={`${meta.softBg} min-w-0 rounded-xl px-3 py-2`}>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k}</dt>
                <dd className={`truncate font-bold ${meta.accentText}`}>{v}</dd>
              </div>
            ))}
          </dl>
          {(session.role === "DOCTOR" || session.role === "DOCTOR_STAFF") && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="truncate text-xs text-slate-500">{profile?.email}</p>
              <Link
                href="/dashboard/profile"
                className="rounded-full px-4 py-2 text-sm font-bold text-white shadow transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #059669, #0891b2)" }}
              >
                👤 প্রোফাইল সম্পাদনা
              </Link>
            </div>
          )}
        </div>
      </div>
    </FadeIn>
  );
}
