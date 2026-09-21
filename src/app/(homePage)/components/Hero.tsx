import Link from "next/link";
import { toBn } from "@/lib/bn";

export function Hero({
  districts,
  thanas,
  h1,
}: {
  districts: number;
  thanas: number;
  /** SEO H1 override from the dashboard (plain text). */
  h1?: string | null;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      <div className="absolute -top-10 left-1/4 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-fuchsia-300/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:grid-cols-2">
        {/* Copy */}
        <div>
          <p className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-800 ring-1 ring-emerald-200">
            ডাক্তার · হাসপাতাল · রোগী — এক ঠিকানায়
          </p>
          <h1 className="mt-4 max-w-xl text-3xl font-black leading-snug tracking-tight text-slate-900 min-[480px]:text-4xl sm:text-5xl sm:leading-tight">
            {h1?.trim() ? (
              h1.trim()
            ) : (
              <>
                রোগীকে ডাক্তারের কাছে, ডাক্তারকে হাসপাতালের সাথে{" "}
                <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-emerald-600 bg-clip-text text-transparent">
                  যুক্ত করি আমরা
                </span>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            মিস্টার ডাক্তার হলো ডাক্তার, হাসপাতাল ও রোগীর মিলনস্থল। রোগী ঘরে বসে
            অনলাইনে সিরিয়াল নেন — ডাক্তার ও হাসপাতাল পান ফ্রি চেম্বার
            সফটওয়্যার, সিরিয়াল ব্যবস্থাপনা আর নিজস্ব ওয়েবসাইট। কোনো লুকানো
            চার্জ নেই।
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {["রোগীর জন্য ফ্রি সিরিয়াল", "ডাক্তারের জন্য ফ্রি সফটওয়্যার", "হাসপাতালের জন্য ফ্রি ড্যাশবোর্ড"].map(
              (p) => (
                <span
                  key={p}
                  className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 sm:text-sm"
                >
                  ✓ {p}
                </span>
              ),
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#areas"
              className="rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 px-5 py-2.5 text-sm font-black text-emerald-950 shadow-[0_8px_24px_-8px_rgba(200,150,20,0.8)] transition hover:brightness-105"
            >
              📍 আপনার এলাকা খুঁজুন ↓
            </a>
            <a
              href="#how"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              আমরা কীভাবে কাজ করি?
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs sm:text-sm">
            <Link href="/apply/doctor" className="font-bold text-emerald-700 hover:text-emerald-900">
              ডাক্তার হিসেবে যোগ দিন →
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/apply/hospital" className="font-bold text-fuchsia-700 hover:text-fuchsia-900">
              হাসপাতাল নিবন্ধন করুন →
            </Link>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              [`${toBn(districts)}টি`, "জেলা"],
              [`${toBn(thanas)}+`, "থানা ও উপজেলা"],
              ["১০০% ফ্রি", "সিরিয়াল ও সফটওয়্যার"],
            ].map(([v, l]) => (
              <div
                key={l}
                className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-amber-100 sm:p-4"
              >
                <p className="bg-gradient-to-r from-amber-600 to-emerald-600 bg-clip-text text-xl font-black text-transparent sm:text-2xl">
                  {v}
                </p>
                <p className="mt-0.5 text-xs font-bold text-slate-500 sm:text-sm">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Connection visual: patient–doctor–hospital triangle */}
        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-amber-400 via-fuchsia-400 to-emerald-400 blur-2xl opacity-30" />
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 p-6 text-white shadow-2xl ring-1 ring-amber-200/40 sm:p-8">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-amber-300">
              আমরা যাদের যুক্ত করি
            </p>
            {/* Triangle nodes */}
            <div className="relative mx-auto mt-6 h-64 max-w-xs">
              {/* connecting lines */}
              <svg viewBox="0 0 300 220" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <path
                  d="M150 30 L60 180 L240 180 Z"
                  fill="none"
                  stroke="rgba(252,211,77,0.5)"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
              </svg>
              {/* Doctor (top) */}
              <div className="absolute left-1/2 top-0 -translate-x-1/2 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-3xl shadow-xl ring-2 ring-white/30">
                  🩺
                </div>
                <p className="mt-1.5 rounded-full bg-white/10 px-3 py-0.5 text-xs font-black text-white ring-1 ring-white/20">
                  ডাক্তার
                </p>
              </div>
              {/* Patient (bottom-left) */}
              <div className="absolute bottom-0 left-0 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-3xl shadow-xl ring-2 ring-white/30">
                  🧑‍🦱
                </div>
                <p className="mt-1.5 rounded-full bg-white/10 px-3 py-0.5 text-xs font-black text-white ring-1 ring-white/20">
                  রোগী
                </p>
              </div>
              {/* Hospital (bottom-right) */}
              <div className="absolute bottom-0 right-0 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 text-3xl shadow-xl ring-2 ring-white/30">
                  🏥
                </div>
                <p className="mt-1.5 rounded-full bg-white/10 px-3 py-0.5 text-xs font-black text-white ring-1 ring-white/20">
                  হাসপাতাল
                </p>
              </div>
              {/* Center hub */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-500 px-4 py-2 shadow-2xl">
                  <p className="text-sm font-black text-emerald-950">মিস্টার ডাক্তার</p>
                  <p className="text-[11px] font-bold text-emerald-900">ফ্রি সংযোগ + সফটওয়্যার</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["💬", "হোয়াটসঅ্যাপ সিরিয়াল"],
                ["🖥️", "ফ্রি চেম্বার সফটওয়্যার"],
                ["🌐", "নিজস্ব ওয়েবসাইট"],
              ].map(([e, t]) => (
                <div key={t} className="rounded-xl bg-white/10 px-2 py-2.5 ring-1 ring-white/15">
                  <p className="text-lg">{e}</p>
                  <p className="mt-0.5 text-[11px] font-bold leading-tight text-white/80">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
