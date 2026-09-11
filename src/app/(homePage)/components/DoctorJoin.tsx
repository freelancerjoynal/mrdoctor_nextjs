import Image from "next/image";
import Link from "next/link";

const PERKS = ["অনলাইন চেম্বার ব্যবস্থাপনা", "হোয়াটসঅ্যাপে রোগীর সিরিয়াল", "নিজের সময়সূচি নিজে ঠিক করুন"];

export function DoctorJoin() {
  return (
    <section className="bg-slate-950 py-12 sm:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="inline-block rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 ring-1 ring-cyan-400/25">
            ডাক্তারদের জন্য
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-4xl">
            আপনি কি ডাক্তার? আপনার চেম্বার নিন অনলাইনে
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/60 sm:text-base">
            রেজিস্টার করুন, যাচাই শেষে আপনার চেম্বার, ফি ও সময়সূচি যোগ করুন।
            রোগীরা হোয়াটসঅ্যাপেই সিরিয়াল নেবে — আপনার ফোনে বাড়তি ঝামেলা নেই।
          </p>
          <ul className="mt-5 space-y-2">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm font-bold text-white/85 sm:text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-xs text-emerald-300 ring-1 ring-emerald-400/30">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
            >
              ডাক্তার হিসেবে যোগ দিন →
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20"
            >
              লগইন করুন
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xs sm:max-w-sm">
          <div className="absolute inset-4 rounded-[2.5rem] bg-gradient-to-br from-emerald-400 to-cyan-400 opacity-30 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-slate-800 to-slate-900 ring-1 ring-white/15">
            <Image
              src="/images/doctor33434.png"
              alt="মিস্টার ডাক্তারে যোগ দিন"
              width={480}
              height={640}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
