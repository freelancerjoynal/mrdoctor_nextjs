import { COMPANY } from "@/content/company";
import { buildApexUrl } from "@/lib/portal";

/**
 * Universal public footer — the main homepage footer, used across the
 * entire public website (apex, info pages, thana/doctor/hospital portals).
 * On subdomain portals pass `host` so every link resolves to the apex.
 */
export function PublicFooter({
  host,
  tagline,
  bottomSuffix,
  adminHref,
}: {
  /** Subdomain host (portals) — omit on the apex. */
  host?: string;
  /** Brand line under the logo (portal pages pass their own). */
  tagline?: string | null;
  /** Copyright suffix, e.g. "জলঢাকা পোর্টাল · সবার জন্য সময়মতো চিকিৎসা।" */
  bottomSuffix?: string | null;
  /** Extra admin link (location portals: "পোর্টাল সাজান"). */
  adminHref?: string | null;
}) {
  const href = (p: string) => (host ? buildApexUrl(p, host) : p);
  const cols = [
    {
      title: "সেবা",
      links: [
        ...(host ? [{ label: "🏠 মূল সাইট", href: href("/") }] : []),
        { label: "এলাকা দেখুন", href: href("/#areas") },
        { label: "আবেদন করুন", href: href("/apply") },
      ],
    },
    {
      title: "সাহায্য",
      links: [
        { label: "পাসওয়ার্ড ভুলে গেছেন?", href: href("/forgot-password") },
        { label: "OTP যাচাই", href: href("/verify-otp") },
        { label: "ডাক্তার হিসেবে আবেদন", href: href("/apply/doctor") },
        { label: "হাসপাতাল হিসেবে আবেদন", href: href("/apply/hospital") },
      ],
    },
    {
      title: "আইনি তথ্য",
      links: [
        { label: "আমাদের সম্পর্কে", href: href("/about") },
        { label: "যোগাযোগ ও ঠিকানা", href: href("/contact") },
        { label: "শর্তাবলী (T&C)", href: href("/terms") },
        { label: "প্রাইভেসি পলিসি", href: href("/privacy") },
        { label: "রিটার্ন ও রিফান্ড", href: href("/refund") },
        { label: "ডেলিভারি পলিসি", href: href("/delivery") },
      ],
    },
  ];

  return (
    <footer className="border-t border-amber-200/70 bg-white">
      <div className="h-0.5 bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-main.png" alt="মিস্টার ডাক্তার" className="h-16 w-auto object-contain" />
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            {tagline?.trim() ||
              "রোগীকে ডাক্তারের কাছে পৌঁছে দিই মুহূর্তেই। দেরি নয়, অপেক্ষা নয় — সময়মতো ভিজিট ও সেবা, সারা বাংলাদেশে।"}
          </p>
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-500">
            📍 {COMPANY.address}
            <br />📞 {COMPANY.phone} · ✉️ {COMPANY.email}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            ট্রেড লাইসেন্স নং: <span className="font-bold">{COMPANY.tradeLicense}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["✓ যাচাইকৃত ডাক্তার", "⏱ সময়মতো সিরিয়াল", "💬 হোয়াটসঅ্যাপ সাপোর্ট"].map((t) => (
              <span
                key={t}
                className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-emerald-900 ring-1 ring-amber-200"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-black uppercase tracking-wider text-amber-600">
              {c.title}
            </p>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm font-bold text-slate-600 transition hover:text-emerald-800">
                    {l.label}
                  </a>
                </li>
              ))}
              {c.title === "আইনি তথ্য" && adminHref ? (
                <li>
                  <a
                    href={adminHref}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-slate-600 transition hover:text-emerald-800"
                  >
                    ⚙️ পোর্টাল সাজান
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-6xl border-t border-amber-100 px-4 py-5 text-center text-xs text-slate-400 sm:px-6">
        © {new Date().getFullYear()} মিস্টার ডাক্তার — {bottomSuffix?.trim() || "সবার জন্য সময়মতো চিকিৎসা।"}
      </div>
    </footer>
  );
}
