"use client";

import Link from "next/link";
import { COMPANY } from "@/content/company";

/** Small trade-license line — env-driven, footer + contact e use hoy. */
export function TradeLicenseLine({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs ${className}`}>
      ট্রেড লাইসেন্স নং:{" "}
      <span className="font-bold">{COMPANY.tradeLicense}</span>
    </p>
  );
}

/** Footer / portal e legal link row. */
export function LegalLinks({ dark = false }: { dark?: boolean }) {
  const linkCls = dark
    ? "text-emerald-100/70 transition hover:text-amber-300"
    : "text-slate-500 transition hover:text-emerald-800";
  const items = [
    { href: "/about", label: "আমাদের সম্পর্কে" },
    { href: "/contact", label: "ঠিকানা" },
    { href: "/terms", label: "শর্তাবলী" },
    { href: "/privacy", label: "প্রাইভেসি" },
    { href: "/refund", label: "রিফান্ড" },
    { href: "/delivery", label: "ডেলিভারি" },
  ];
  return (
    <nav aria-label="আইনি তথ্য" className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((l) => (
        <Link key={l.href} href={l.href} className={`text-xs font-semibold ${linkCls}`}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
