import Image from "next/image";
import Link from "next/link";

const PROMISES = ["দেরি নয়", "অপেক্ষা নয়", "সময়মতো ভিজিট"];

export function Hero({
  districts,
  thanas,
}: {
  districts: number;
  thanas: number;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -top-10 left-1/4 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-fuchsia-600/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:grid-cols-2">
        {/* Copy */}
        <div>
          <p className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-200 ring-1 ring-white/15">
            তাৎক্ষণিক ডাক্তার সংযোগ
          </p>
          <h1 className="mt-4 max-w-xl text-3xl font-black leading-snug tracking-tight text-white min-[480px]:text-4xl sm:text-5xl sm:leading-tight">
            রোগীকে ডাক্তারের কাছে পৌঁছে দিই{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
              মুহূর্তেই
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
            দেরি নয়, অপেক্ষা নয় — সঠিক সময়ে ভিজিট ও সেবা। আপনার এলাকার ডাক্তার,
            চেম্বার ও হাসপাতাল এখন এক ক্লিকেই। নিচে আপনার জেলা বেছে নিন, থানা দেখুন,
            আর সময়মতো ডাক্তার দেখান।
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {PROMISES.map((p) => (
              <span
                key={p}
                className="rounded-full bg-emerald-400/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/25 sm:text-sm"
              >
                ✓ {p}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#areas"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-200"
            >
              আপনার এলাকার ডাক্তার ↓
            </a>
            <Link
              href="/register"
              className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20"
            >
              ফ্রি অ্যাকাউন্ট খুলুন
            </Link>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              [`${districts}টি`, "জেলা"],
              [`${thanas}+`, "থানা ও উপজেলা"],
              ["সময়মতো", "ভিজিট ও সেবা"],
            ].map(([v, l]) => (
              <div
                key={l}
                className="rounded-2xl bg-white/5 p-3 text-center ring-1 ring-white/10 sm:p-4"
              >
                <p className="bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-xl font-black text-transparent sm:text-2xl">
                  {v}
                </p>
                <p className="mt-0.5 text-xs font-bold text-white/60 sm:text-sm">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor image with floating badges */}
        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 blur-2xl opacity-40" />
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600/40 via-slate-900 to-cyan-900/40 ring-1 ring-white/15">
            <Image
              src="/images/doctor_hero_bg.png"
              alt="মিস্টার ডাক্তার — অভিজ্ঞ ডাক্তার"
              width={640}
              height={640}
              priority
              className="h-auto w-full object-cover"
            />
          </div>
          <div className="absolute -left-2 top-8 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-2xl backdrop-blur sm:left-2">
            <p className="text-lg font-black text-slate-900">✓</p>
            <p className="text-xs font-bold text-slate-700">যাচাইকৃত ডাক্তার</p>
          </div>
          <div className="absolute -right-2 bottom-10 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-2xl backdrop-blur sm:right-2">
            <p className="text-lg font-black text-emerald-600">⏱</p>
            <p className="text-xs font-bold text-slate-700">সময়মতো সিরিয়াল</p>
          </div>
        </div>
      </div>
    </section>
  );
}
