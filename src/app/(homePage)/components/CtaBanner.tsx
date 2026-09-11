import Link from "next/link";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-6 text-center text-white shadow-2xl sm:p-10">
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-12 -right-8 h-56 w-56 rounded-full bg-black/15 blur-2xl" />
        <h2 className="relative text-2xl font-black sm:text-3xl">
          অসুস্থতায় অপেক্ষা কেন?
        </h2>
        <p className="relative mx-auto mt-2 max-w-lg text-sm text-white/85 sm:text-base">
          আজই ফ্রি অ্যাকাউন্ট খুলুন — আপনার এলাকার ডাক্তারের সাথে সংযুক্ত হোন মুহূর্তেই।
        </p>
        <div className="relative mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-200"
          >
            ফ্রি অ্যাকাউন্ট খুলুন →
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-black/20 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-black/30"
          >
            লগইন করুন
          </Link>
        </div>
      </div>
    </section>
  );
}
