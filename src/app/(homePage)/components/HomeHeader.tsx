import Link from "next/link";

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="text-xl font-black tracking-tight text-white sm:text-2xl">
          মিস্টার ডাক্তার<span className="text-cyan-300">।</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="#areas"
            className="hidden rounded-xl px-3 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white min-[480px]:block"
          >
            এলাকা দেখুন
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20 sm:px-4"
          >
            লগইন
          </Link>
          <Link
            href="/apply"
            className="rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-3 py-2 text-sm font-bold text-white shadow-lg transition hover:opacity-90 sm:px-4"
          >
            আবেদন করুন
          </Link>
        </nav>
      </div>
    </header>
  );
}
