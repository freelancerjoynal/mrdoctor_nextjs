import type { ReactNode } from "react";
import Link from "next/link";

/** Gradient split-screen shell shared by all auth pages (server component). */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-violet-600/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="absolute left-1/3 top-1/3 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <Link href="/" className="relative flex items-center" aria-label="মিস্টার ডাক্তার">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="মিস্টার ডাক্তার" className="h-11 w-auto object-contain" />
        </Link>
        <div className="relative">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200 ring-1 ring-white/20">
            নিরাপদ প্রবেশ
          </p>
          <h2 className="max-w-md text-4xl font-black leading-tight">
            ডাক্তার, হাসপাতাল ও টিমের জন্য একটাই লগইন।
          </h2>
          <div className="mt-6 flex gap-2">
            {["OTP যাচাইকৃত", "JWT কুকি", "ভূমিকা ভিত্তিক"].map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/15"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/50">
          অ্যাক্সেস টোকেন (১৫ মিনিট) + রিফ্রেশ টোকেন (৭ দিন) নিরাপদ httpOnly কুকিতে থাকে।
        </p>
      </aside>

      <main className="relative flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 py-10 sm:p-6">
        <div className="w-full max-w-md">
          <div className="mb-5 lg:hidden">
            <Link href="/" className="flex items-center" aria-label="মিস্টার ডাক্তার">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-main.png" alt="মিস্টার ডাক্তার" className="h-10 w-auto object-contain" />
            </Link>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mb-5 mt-1.5 text-sm text-slate-500 sm:mb-6">{subtitle}</p>
          {children}
          {footer && <div className="mt-5 text-center text-sm text-slate-500 sm:mt-6">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
