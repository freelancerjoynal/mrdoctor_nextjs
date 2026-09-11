import Link from "next/link";

const COLS = [
  {
    title: "সেবা",
    links: [
      { label: "এলাকা দেখুন", href: "/#areas" },
      { label: "ড্যাশবোর্ড", href: "/dashboard" },
      { label: "লগইন", href: "/login" },
      { label: "রেজিস্টার", href: "/register" },
    ],
  },
  {
    title: "সাহায্য",
    links: [
      { label: "পাসওয়ার্ড ভুলে গেছেন?", href: "/forgot-password" },
      { label: "OTP যাচাই", href: "/verify-otp" },
      { label: "ডাক্তার হিসেবে যোগ দিন", href: "/register" },
    ],
  },
];

export function HomeFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-xl font-black text-white">
            মিস্টার ডাক্তার<span className="text-cyan-300">।</span>
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/55">
            রোগীকে ডাক্তারের কাছে পৌঁছে দিই মুহূর্তেই। দেরি নয়, অপেক্ষা নয় —
            সময়মতো ভিজিট ও সেবা, সারা বাংলাদেশে।
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["✓ যাচাইকৃত ডাক্তার", "⏱ সময়মতো সিরিয়াল", "💬 হোয়াটসঅ্যাপ সাপোর্ট"].map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 ring-1 ring-white/10"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-black uppercase tracking-wider text-white/40">
              {c.title}
            </p>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm font-bold text-white/70 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 px-4 pt-5 text-center text-xs text-white/40 sm:px-6">
        © {new Date().getFullYear()} মিস্টার ডাক্তার — সবার জন্য সময়মতো চিকিৎসা।
      </div>
    </footer>
  );
}
