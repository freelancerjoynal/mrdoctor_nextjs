"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";
import { LogoutButton } from "@/components/auth/LogoutButton";

const NAV = [
  { href: "/admin", label: "ওভারভিউ", emoji: "🏠", exact: true },
  { href: "/admin/directory", label: "ডাক্তার ও হাসপাতাল", emoji: "🏥", exact: false },
  { href: "/admin/locations", label: "লোকেশন পোর্টাল", emoji: "📍", exact: false },
  { href: "/admin/seo", label: "SEO সেটিংস", emoji: "🔍", exact: false },
  { href: "/admin/applications", label: "যোগদানের আবেদন", emoji: "📥", exact: false },
  { href: "/admin/create-account", label: "অ্যাকাউন্ট তৈরি", emoji: "➕", exact: false },
  { href: "/admin/income", label: "আয়", emoji: "💰", exact: false },
  { href: "/admin/payouts", label: "পেআউট", emoji: "💸", exact: false },
];

/**
 * Sidebar navigation for the /admin section (SUPER_ADMIN + ADMIN_MANAGER).
 * Shows the pending join-request count as a badge (lazy — fetched on mount).
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch("/api/backend/api/applications/pending-count");
        const data = (await res.json().catch(() => null)) as {
          data?: { total?: number };
        } | null;
        if (alive && typeof data?.data?.total === "number") setPending(data.data.total);
      } catch {
        /* badge stays hidden — never blocks navigation */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <nav className="flex h-full flex-col gap-1 p-4">
      <Link
        href="/admin"
        onClick={onNavigate}
        className="mb-4 flex items-center gap-2.5 rounded-2xl px-2 py-1"
        aria-label="অ্যাডমিন ড্যাশবোর্ড"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- bundled static logo */}
        <img src="/images/logo.png" alt="MrDoctor" className="h-9 w-auto object-contain" />
        <span className="text-sm font-black tracking-tight text-slate-900">
          অ্যাডমিন
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            MrDoctor
          </span>
        </span>
      </Link>

      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
              active
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="text-base">{item.emoji}</span>
            <span className="flex-1">{item.label}</span>
            {item.href === "/admin/applications" && pending !== null && pending > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                  active ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"
                }`}
              >
                {pending}
              </span>
            )}
          </Link>
        );
      })}

      <div className="mt-auto space-y-1 border-t border-slate-100 pt-3">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
        >
          <span className="text-base">🧭</span> মূল ড্যাশবোর্ড
        </Link>
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
        >
          <span className="text-base">🌐</span> ওয়েবসাইট
        </Link>
        <div className="px-1 pt-1">
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
