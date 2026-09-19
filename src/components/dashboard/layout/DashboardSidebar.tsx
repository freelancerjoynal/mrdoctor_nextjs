"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Role } from "@/lib/auth/types";
import { buildPortalUrl } from "@/lib/portal";
import { LogoutButton } from "@/components/auth/LogoutButton";

interface NavItem {
  href: string;
  label: string;
  emoji: string;
  exact?: boolean;
  roles: Role[];
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "ওভারভিউ", emoji: "🏠", exact: true, roles: ["DOCTOR", "DOCTOR_STAFF", "HOSPITAL", "HOSPITAL_STAFF"] },
  { href: "/dashboard/appointments", label: "অ্যাপয়েন্টমেন্ট", emoji: "📋", roles: ["DOCTOR", "DOCTOR_STAFF", "HOSPITAL_STAFF"] },
  { href: "/dashboard/local-booking", label: "লোকাল বুকিং", emoji: "➕", roles: ["DOCTOR", "DOCTOR_STAFF", "HOSPITAL", "HOSPITAL_STAFF"] },
  { href: "/dashboard/collection", label: "কাস্টম কালেকশন", emoji: "🗓️", roles: ["DOCTOR", "DOCTOR_STAFF"] },
  { href: "/dashboard/chambers", label: "চেম্বার ও সময়সূচি", emoji: "🏥", roles: ["DOCTOR", "DOCTOR_STAFF"] },
  { href: "/dashboard/blogs", label: "ব্লগ ব্যবস্থাপনা", emoji: "✍️", roles: ["DOCTOR"] },
  { href: "/dashboard/staff", label: "স্টাফ ব্যবস্থাপনা", emoji: "🧑‍⚕️", roles: ["DOCTOR", "HOSPITAL"] },
  { href: "/dashboard/profile", label: "প্রোফাইল", emoji: "👤", roles: ["DOCTOR", "DOCTOR_STAFF", "HOSPITAL", "HOSPITAL_STAFF"] },
];

/**
 * Sidebar for the /dashboard section (doctor / staff / hospital roles).
 * Logo-only brand mark at the top — the user name + role live in the
 * topbar (top-right), not in the sidebar.
 * Public links (portal profile, website) live at the bottom and open in
 * a new tab.
 */
export function DashboardSidebar({
  role,
  portalSubdomain,
  portalKind,
  onNavigate,
}: {
  role: Role;
  /** Doctor username or hospital slug — null when the role has no public portal. */
  portalSubdomain?: string | null;
  portalKind?: "doctor" | "hospital" | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV.filter((item) => item.roles.includes(role));

  // Portal URL needs window.location.host, which doesn't exist during SSR —
  // first render uses the /s/<sub> path, upgraded after mount (same pattern
  // the old dashboard footer used). External links open in a new tab.
  const serverSafeUrl = portalSubdomain
    ? `/s/${encodeURIComponent(portalSubdomain.trim().toLowerCase())}`
    : null;
  const [portalUrl, setPortalUrl] = useState<string | null>(serverSafeUrl);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration upgrade to the subdomain URL
    if (portalSubdomain) setPortalUrl(buildPortalUrl(portalSubdomain));
  }, [portalSubdomain]);
  const portalLabel =
    portalKind === "hospital" ? "🏥 হাসপাতাল প্রোফাইল" : "🩺 ডাক্তার প্রোফাইল";

  return (
    <nav className="flex h-full flex-col gap-1 p-4">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mb-4 flex items-center px-2 py-1"
        aria-label="MrDoctor ড্যাশবোর্ড"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- bundled static logo */}
        <img src="/images/logo.png" alt="MrDoctor" className="h-9 w-auto object-contain" />
      </Link>

      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
              active
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="text-base">{item.emoji}</span>
            <span className="flex-1">{item.label}</span>
          </Link>
        );
      })}

      <div className="mt-auto space-y-1 border-t border-slate-100 pt-3">
        {portalUrl && portalKind && (
          <a
            href={portalUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
          >
            <span className="text-base">{portalKind === "hospital" ? "🏥" : "🩺"}</span>
            <span className="flex-1">{portalLabel}</span>
            <span aria-hidden>↗</span>
          </a>
        )}
        <a
          href="https://mrdoctor.com.bd"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
        >
          <span className="text-base">🌐</span>
          <span className="flex-1">mrdoctor.com.bd</span>
          <span aria-hidden>↗</span>
        </a>
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
        >
          <span className="text-base">🏠</span> ওয়েবসাইট
        </Link>
        <div className="px-1 pt-1">
          <LogoutButton />
        </div>
        <p className="px-3.5 pb-1 pt-2 text-center text-[11px] font-semibold text-slate-400">
          Powered by{" "}
          <a
            href="https://mrdoctor.com.bd"
            target="_blank"
            rel="noreferrer"
            className="font-black text-slate-500 hover:underline"
          >
            mrdoctor.com.bd
          </a>
        </p>
      </div>
    </nav>
  );
}
