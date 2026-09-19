import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth/session";
import { getDisplayName, getInitial } from "@/lib/auth/displayName";
import { ROLE_META } from "@/lib/auth/constants";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { HeaderAvatar } from "@/components/dashboard/HeaderAvatar";
import { HospitalLifetimeBalanceButton } from "@/components/dashboard/HospitalLifetimeBalanceButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getProfile();
  if (!data) redirect("/login");
  const name = getDisplayName(data.session, data.profile);
  const roleBn = ROLE_META[data.session.role].label;

  // Public portal link for the footer: doctor username / hospital slug
  // (subdomain portal), resolved per role.
  let portalSubdomain: string | null = null;
  let portalKind: "doctor" | "hospital" | null = null;
  if (data.session.role === "DOCTOR" && data.profile?.doctorProfile?.username?.trim()) {
    portalSubdomain = data.profile.doctorProfile.username.trim();
    portalKind = "doctor";
  } else if (data.session.role === "DOCTOR_STAFF" && data.profile?.staffDoctor?.username?.trim()) {
    portalSubdomain = data.profile.staffDoctor.username.trim();
    portalKind = "doctor";
  } else if (data.session.role === "HOSPITAL" && data.profile?.hospitalProfile?.slug?.trim()) {
    portalSubdomain = data.profile.hospitalProfile.slug.trim();
    portalKind = "hospital";
  } else if (data.session.role === "HOSPITAL_STAFF") {
    const slug = data.profile?.staffHospital?.slug?.trim() || data.profile?.hospitalProfile?.slug?.trim();
    if (slug) { portalSubdomain = slug; portalKind = "hospital"; }
  }

  // Header avatar: the doctor's profile picture (own profile for DOCTOR,
  // own uploaded photo for DOCTOR_STAFF, global avatar fallback included);
  // other roles keep the initial badge.
  const headerPicture =
    data.session.role === "DOCTOR"
      ? (data.profile?.doctorProfile?.profilePicture ?? null)
      : data.session.role === "DOCTOR_STAFF" || data.session.role === "HOSPITAL_STAFF"
        ? (data.profile?.profilePicture ?? null)
        : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex min-w-0 shrink-0 items-center" aria-label="MrDoctor ড্যাশবোর্ড">
            {/* eslint-disable-next-line @next/next/no-img-element -- bundled static logo */}
            <img
              src="/images/logo.png"
              alt="MrDoctor"
              className="h-9 w-auto object-contain sm:h-10"
            />
          </Link>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Owner only: lifetime served balance (lazy — fetches on click, never on load). */}
            {data.session.role === "HOSPITAL" && <HospitalLifetimeBalanceButton />}
            <span className="flex min-w-0 items-center gap-2.5">
              {headerPicture !== undefined ? (
                <HeaderAvatar profilePicture={headerPicture} name={name} />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-sm font-black text-white shadow">
                  {getInitial(name)}
                </span>
              )}
              <span className="hidden min-w-0 sm:block">
                <span className="block max-w-36 truncate text-sm font-black tracking-tight text-slate-900 sm:max-w-52 sm:text-base">
                  {name}
                </span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {roleBn}
                </span>
              </span>
            </span>
            <Link
              href="/"
              className="hidden shrink-0 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 sm:block"
            >
              হোম
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-8">{children}</div>
      <DashboardFooter portalSubdomain={portalSubdomain} portalKind={portalKind} />
    </div>
  );
}
