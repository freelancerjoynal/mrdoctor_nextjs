import type { ReactNode } from "react";
import Link from "next/link";

/**
 * WeHealth-inspired split-screen shell — rebuilt for MrDoctor.
 * Left (white): logo + blue Sign-In card. Right (brand gradient): doctor
 * visual with floating trust badges. Shared by all auth pages.
 * Server component.
 */
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-700 p-3 sm:p-6 lg:p-10">
      {/* soft outer glows */}
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-blue-900/30 blur-3xl" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_-20px_rgba(0,40,120,0.55)] lg:grid-cols-[1fr_1.05fr] lg:rounded-[28px]">
        {/* ---------- LEFT : form side ---------- */}
        <div className="relative flex flex-col bg-white px-5 py-5 sm:px-10 sm:py-7">
          {/* faint diagonal texture like the reference */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{
              background:
                "linear-gradient(115deg, transparent 62%, rgba(1,102,255,0.06) 62%, rgba(1,102,255,0.06) 68%, transparent 68%, transparent 74%, rgba(0,194,255,0.07) 74%, rgba(0,194,255,0.07) 78%, transparent 78%)",
            }}
          />
          <div className="relative flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center" aria-label="মিস্টার ডাক্তার">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-main.png"
                alt="মিস্টার ডাক্তার — Mr.Doctor.com.bd"
                width={190}
                className="h-auto w-[160px] object-contain sm:w-[190px]"
              />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="hidden rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 sm:block"
              >
                ← হোম
              </Link>
              <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-xs font-black text-white shadow-md shadow-orange-500/30 ring-1 ring-orange-300">
                বাংলা
              </span>
            </div>
          </div>

          {/* blue sign-in card */}
          <div className="relative mx-auto mt-6 w-full max-w-sm flex-1 sm:mt-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#2B8CFF] via-[#1457FF] to-[#0A2FB4] p-6 shadow-[0_24px_50px_-16px_rgba(10,60,200,0.65)] sm:p-7">
              {/* card decorations */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-cyan-300/30 blur-2xl" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40" />

              <h1 className="relative text-center text-xl font-black tracking-tight text-white sm:text-2xl">
                {title}
              </h1>
              <p className="relative mb-5 mt-1.5 text-center text-xs leading-relaxed text-blue-100/90 sm:text-[13px]">
                {subtitle}
              </p>

              <div className="relative">{children}</div>

              {footer && (
                <div className="relative mt-4 text-center text-xs leading-relaxed text-blue-100/90 [&_a]:font-bold [&_a]:text-white! [&_a]:hover:underline">
                  {footer}
                </div>
              )}
            </div>

            {/* trust row under the card — better than reference */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              {["✓ OTP যাচাইকৃত", "🔒 JWT কুকি", "🩺 ৬৪ জেলা"].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <p className="relative mt-5 text-center text-[11px] text-slate-400">
            <Link href="/privacy" className="hover:underline">
              গোপনীয়তা
            </Link>
            <span className="mx-1.5">·</span>
            <Link href="/terms" className="hover:underline">
              শর্তাবলি
            </Link>
            <span className="mx-1.5">·</span>
            <Link href="/contact" className="hover:underline">
              যোগাযোগ
            </Link>
          </p>
        </div>

        {/* ---------- RIGHT : visual side ---------- */}
        <div className="relative hidden min-h-[620px] overflow-hidden bg-gradient-to-br from-[#0A2472] via-[#155BFF] to-[#00C2FF] lg:block">
          {/* white diagonal divider (reference signature) */}
          <div className="absolute -left-14 top-0 h-full w-[110px] -skew-x-[10deg] bg-white" />
          <div className="absolute left-[62px] top-0 h-full w-[10px] -skew-x-[10deg] bg-[#0A2472]/90" />

          {/* deco rings */}
          <div className="absolute right-16 top-14 h-40 w-40 rounded-full border-[14px] border-white/10" />
          <div className="absolute bottom-24 left-24 h-24 w-24 rounded-full bg-white/10 blur-sm" />
          <div className="absolute right-8 top-1/2 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

          {/* headline */}
          <div className="absolute left-28 right-8 top-8">
            <p className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white ring-1 ring-white/30 backdrop-blur">
              MrDoctor.com.bd
            </p>
            <h2 className="mt-3 max-w-sm text-3xl font-black leading-[1.15] text-white">
              ঘরে বসেই
              <br />
              ডাক্তারের সিরিয়াল।
            </h2>
          </div>

          {/* amber hexagon blob behind doctor */}
          <div className="absolute bottom-[70px] left-1/2 h-[430px] w-[380px] -translate-x-[calc(50%-40px)]">
            <div
              className="absolute inset-0 bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 shadow-2xl"
              style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)" }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/doctor_hero_bg.png"
              alt="ডাক্তার"
              className="absolute bottom-0 left-1/2 h-[440px] w-auto -translate-x-1/2 object-contain object-bottom drop-shadow-[0_24px_30px_rgba(0,20,80,0.45)]"
            />
          </div>

          {/* floating badge — customers */}
          <div className="absolute right-6 top-[38%] flex items-center gap-2.5 rounded-2xl bg-white/95 py-2 pl-2.5 pr-4 shadow-xl shadow-blue-950/20 backdrop-blur">
            <div className="flex -space-x-2">
              {["/images/doctor_avatar.jpg", "/images/doctor_avatar_female.jpg", "/images/doctor_avatar.png"].map(
                (src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover ring-2 ring-white"
                  />
                ),
              )}
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">50K+ গ্রাহক</p>
              <p className="text-[10px] font-bold text-amber-500">★★★★★ ৪.৯ রেটিং</p>
            </div>
          </div>

          {/* floating badge — connect */}
          <div className="absolute bottom-[130px] left-[110px] flex items-center gap-2.5 rounded-2xl bg-white/95 py-2.5 pl-2.5 pr-4 shadow-xl shadow-blue-950/20 backdrop-blur">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg text-white">
              ✚
            </span>
            <div>
              <p className="text-xs font-black text-slate-900">ডাক্তারের সাথে যুক্ত হোন</p>
              <p className="text-[10px] text-slate-500">ফ্রি সিরিয়াল • ফ্রি সফটওয়্যার</p>
            </div>
          </div>

          {/* bottom stats */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-5 bg-gradient-to-t from-blue-950/50 to-transparent px-6 pb-5 pt-10 text-center">
            {[
              ["৬৪", "জেলা"],
              ["৪৯৪+", "থানা"],
              ["১০০%", "ফ্রি"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-lg font-black text-white">{n}</p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-100/80">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
