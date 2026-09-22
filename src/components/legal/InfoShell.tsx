import type { ReactNode } from "react";
import Link from "next/link";
import { HomeHeader } from "@/app/(homePage)/components/HomeHeader";
import { HomeFooter } from "@/app/(homePage)/components/HomeFooter";
import { COMPANY } from "@/content/company";

/**
 * Shared shell for all static info/legal pages.
 * Title + updated date + Bangla sections + optional English summary.
 */
export function InfoShell({
  eyebrow,
  title,
  description,
  updated,
  children,
  extra,
}: {
  eyebrow: string;
  title: string;
  description: string;
  updated?: string;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <HomeHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-3 leading-relaxed text-slate-600">{description}</p>
        {updated ? (
          <p className="mt-2 text-xs font-semibold text-slate-400">
            সর্বশেষ হালনাগাদ: {updated}
          </p>
        ) : null}

        <div className="mt-8 space-y-7">{children}</div>

        {extra}

        {/* Trade license strip — env-driven */}
        <div className="mt-10 rounded-2xl bg-emerald-950 p-5 text-white">
          <p className="text-sm font-black text-amber-300">
            {COMPANY.name} · {COMPANY.nameEn}
          </p>
          <p className="mt-1 text-sm text-emerald-100/85">{COMPANY.address}</p>
          <p className="mt-1 text-sm text-emerald-100/85">
            📞 {COMPANY.phone} · ✉️ {COMPANY.email}
          </p>
          <p className="mt-2 border-t border-white/15 pt-2 text-xs text-emerald-100/70">
            ট্রেড লাইসেন্স নং:{" "}
            <span className="font-bold text-white">{COMPANY.tradeLicense}</span>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { href: "/about", label: "আমাদের সম্পর্কে" },
            { href: "/contact", label: "ঠিকানা" },
            { href: "/terms", label: "শর্তাবলী" },
            { href: "/privacy", label: "প্রাইভেসি" },
            { href: "/refund", label: "রিফান্ড" },
            { href: "/delivery", label: "ডেলিভারি" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-100 hover:text-emerald-900"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}

/** One Bangla policy section block. */
export function PolicySection({
  heading,
  body,
}: {
  heading: string;
  body: string[];
}) {
  return (
    <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 md:p-6">
      <h2 className="text-lg font-black text-emerald-950">{heading}</h2>
      {body.map((p, i) => (
        <p key={i} className="mt-2 text-[15px] leading-relaxed text-slate-700">
          {p}
        </p>
      ))}
    </section>
  );
}

/** Collapsible English summary (merchant/gateway reviewers). */
export function EnglishSummary({
  sections,
}: {
  sections: { heading: string; body: string[] }[];
}) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-5">
      <summary className="cursor-pointer text-sm font-black text-slate-800">
        English summary (for payment-gateway review)
      </summary>
      <div className="mt-4 space-y-4">
        {sections.map((s) => (
          <div key={s.heading}>
            <p className="text-sm font-black text-slate-900">{s.heading}</p>
            {s.body.map((p, i) => (
              <p key={i} className="mt-1 text-sm leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}
