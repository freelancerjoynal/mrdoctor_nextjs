import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth/session";
import { getDisplayName, getInitial } from "@/lib/auth/displayName";
import { ROLE_META } from "@/lib/auth/constants";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getProfile();
  if (!data) redirect("/login");
  const name = getDisplayName(data.session, data.profile);
  const roleBn = ROLE_META[data.session.role].label;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-sm font-black text-white shadow">
              {getInitial(name)}
            </span>
            <span className="min-w-0">
              <span className="block max-w-36 truncate text-sm font-black tracking-tight text-slate-900 sm:max-w-52 sm:text-base">
                {name}
              </span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {roleBn}
              </span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 sm:block"
            >
              হোম
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
