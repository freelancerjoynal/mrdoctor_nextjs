"use client";

import { useState } from "react";
import Link from "next/link";
import type { Role } from "@/lib/auth/types";
import { getInitial } from "@/lib/auth/displayName";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { HeaderAvatar } from "@/components/dashboard/HeaderAvatar";
import { HospitalLifetimeBalanceButton } from "@/components/dashboard/HospitalLifetimeBalanceButton";
import { CreditBalanceBadge } from "@/components/dashboard/CreditBalanceBadge";
import { DashboardSidebar } from "./DashboardSidebar";

/**
 * Client shell for the /dashboard section — mirrors the admin shell
 * (fixed sidebar on desktop, drawer + topbar on mobile) but lives in
 * components/dashboard/layout/* with dashboard navigation.
 *
 * Mobile-first: base styles target small screens (px-4, stacked topbar,
 * drawer nav); sm:/lg: variants enhance for larger screens.
 * User identity (avatar + name + role) sits top-right in the topbar —
 * never in the sidebar.
 */
export function DashboardShell({
  name,
  roleLabel,
  role,
  profilePicture,
  portalSubdomain,
  portalKind,
  children,
}: {
  name: string;
  roleLabel: string;
  role: Role;
  /** undefined = initial badge; null/string = photo avatar (see layout). */
  profilePicture?: string | null;
  /** Doctor username or hospital slug — null when the role has no public portal. */
  portalSubdomain?: string | null;
  portalKind?: "doctor" | "hospital" | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <DashboardSidebar role={role} portalSubdomain={portalSubdomain} portalKind={portalKind} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white shadow-2xl">
            <DashboardSidebar
              role={role}
              portalSubdomain={portalSubdomain}
              portalKind={portalKind}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="মেনু খুলুন"
            >
              ☰
            </button>
            <div className="min-w-0 flex-1" />
            {(role === "DOCTOR" ||
              role === "DOCTOR_STAFF" ||
              role === "HOSPITAL" ||
              role === "HOSPITAL_STAFF") && (
              <span className="shrink-0">
                <CreditBalanceBadge tone="light" />
              </span>
            )}
            {role === "HOSPITAL" && <HospitalLifetimeBalanceButton />}
            {/* User identity — top-right */}
            <span className="flex min-w-0 items-center gap-2.5">
              {profilePicture !== undefined ? (
                <HeaderAvatar profilePicture={profilePicture} name={name} />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-cyan-500 text-sm font-black text-white shadow">
                  {getInitial(name)}
                </span>
              )}
              <span className="min-w-0 text-right">
                <span className="block max-w-28 truncate text-sm font-black tracking-tight text-slate-900 min-[420px]:max-w-36 sm:max-w-52 sm:text-base">
                  {name}
                </span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {roleLabel}
                </span>
              </span>
            </span>
            <Link
              href="/"
              className="hidden shrink-0 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 sm:block"
            >
              হোম
            </Link>
            <div className="hidden shrink-0 min-[420px]:block">
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
