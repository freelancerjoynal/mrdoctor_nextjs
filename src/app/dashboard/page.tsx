import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getDisplayName } from "@/lib/auth/displayName";
import { ROLE_META } from "@/lib/auth/constants";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default async function DashboardPage() {
  const data = await getProfile();
  if (!data) redirect("/login");

  const { session, profile } = data;
  const meta = ROLE_META[session.role];
  const name = getDisplayName(session, profile);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Hero */}
      <section
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${meta.gradient} p-5 text-white shadow-2xl sm:rounded-3xl sm:p-8`}
      >
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-black/10 blur-2xl" />
        <p className="relative text-xs font-semibold uppercase tracking-widest text-white/80 sm:text-sm">
          {meta.emoji} {meta.label} dashboard
        </p>
        <h1 className="relative mt-1 break-words text-2xl font-black tracking-tight sm:text-4xl">
          হ্যালো, {name} 👋
        </h1>
        <p className="relative mt-1 max-w-lg text-sm text-white/85 sm:text-base">{meta.tagline}</p>
      </section>

      <ProfileCard session={session} profile={profile} />

      {/* Stats */}
      <section className="grid grid-cols-1 gap-3 sm:gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
        {meta.stats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} delta={s.delta} index={i} />
        ))}
      </section>

      {/* Actions */}
      <section>
        <h2 className="mb-3 text-base font-black text-slate-900 sm:text-lg">দ্রুত কাজ</h2>
        <QuickActions actions={meta.actions} />
      </section>
    </div>
  );
}
