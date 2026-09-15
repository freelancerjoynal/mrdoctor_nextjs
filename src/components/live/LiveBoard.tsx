"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { apiFetch } from "@/lib/auth/apiFetch";
import { toBn } from "@/lib/bn";
import { doctorPortrait, fallbackAvatar } from "@/lib/profile";
import { useRealtimeStream } from "@/lib/realtime/useRealtimeStream";
import type { LiveSnapshot } from "@/lib/live";

/**
 * Hydration-safe clock — null until mounted (client-only ticking),
 * so server and first paint always match.
 */
function useClock(): { now: Date | null; time: string; tick: number } {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return { now: null, time: "––:––:––", tick: 0 };
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    now,
    time: toBn(`${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`),
    tick: now.getSeconds(),
  };
}

/** Online / offline pill for a queue entry. */
function BookingBadge({ type }: { type: "ONLINE" | "OFFLINE" | null | undefined }) {
  if (type !== "ONLINE" && type !== "OFFLINE") return null;
  const online = type === "ONLINE";
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-3 py-0.5 font-black text-white shadow ${
        online ? "bg-sky-500" : "bg-slate-500"
      }`}
      style={{ fontSize: "clamp(0.75rem, 1.8vw, 1.15rem)" }}
    >
      {online ? "🌐 অনলাইন" : "🧾 অফলাইন"}
    </span>
  );
}

/** Gold-ring analog wall clock — hands render only after mount. */
function AnalogClock({ now }: { now: Date | null }) {
  const sec = now ? now.getSeconds() + now.getMilliseconds() / 1000 : 0;
  const min = now ? now.getMinutes() + sec / 60 : 0;
  const hr = now ? (now.getHours() % 12) + min / 60 : 0;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]" role="img" aria-label="ঘড়ি">
      <circle cx="50" cy="50" r="47" fill="rgba(255,255,255,0.04)" stroke="#fbbf24" strokeWidth="2.5" opacity="0.9" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff" strokeWidth="0.75" opacity="0.25" />
      {Array.from({ length: 12 }).map((_, i) => {
        // Fixed precision: raw floats serialize differently on server vs
        // client and trip hydration (x2={22.287…7972} vs "22.287…797").
        const a = (i * 30 * Math.PI) / 180;
        const f = (n: number) => n.toFixed(2);
        const x1 = f(50 + 38 * Math.sin(a));
        const y1 = f(50 - 38 * Math.cos(a));
        const x2 = f(50 + 32 * Math.sin(a));
        const y2 = f(50 - 32 * Math.cos(a));
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={i % 3 === 0 ? "#fbbf24" : "#ffffff"}
            strokeWidth={i % 3 === 0 ? 3 : 1.5}
            strokeLinecap="round"
            opacity={i % 3 === 0 ? 0.95 : 0.55}
          />
        );
      })}
      {now && (
        <>
          <line x1="50" y1="50" x2="50" y2="32" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" transform={`rotate(${hr * 30} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="22" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" transform={`rotate(${min * 6} 50 50)`} />
          <line
            x1="50"
            y1="58"
            x2="50"
            y2="15"
            stroke="#f87171"
            strokeWidth="1.75"
            strokeLinecap="round"
            transform={`rotate(${sec * 6} 50 50)`}
            style={{ transition: "transform 0.95s linear" }}
          />
          <circle cx="50" cy="50" r="3.5" fill="#fbbf24" />
        </>
      )}
    </svg>
  );
}

/**
 * Premium single-viewport TV board (no scrolling): glowing current serial,
 * gold clock + upcoming list, hospital lower-third | doctor photo +
 * booking QR + powered-by.
 */
export function LiveBoard({ username, initial }: { username: string; initial: LiveSnapshot | null }) {
  const [snap, setSnap] = useState<LiveSnapshot | null>(initial);
  const { now, time: clock } = useClock();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const pull = useCallback(async () => {
    try {
      const res = await apiFetch(
        `/api/backend/api/website/doctors/${encodeURIComponent(username)}/serial-live`,
      );
      const json = (await res.json().catch(() => null)) as { data?: LiveSnapshot } | null;
      if (res.ok && json?.data) setSnap(json.data);
    } catch {
      /* keep last frame on network blips */
    }
  }, [username]);

  // Push-driven board: snapshot re-pulls only when the server pushes a
  // `live` frame for this doctor (or on reconnect catch-up). No polling —
  // the 1s wall clock above is local-only and never hits the network.
  useRealtimeStream({
    url: `/api/stream/live?username=${encodeURIComponent(username)}`,
    onEvent: (types) => {
      if (!types.includes("live")) return;
      void pull();
    },
  });

  if (!snap) {
    return (
      <div className="flex h-dvh items-center justify-center overflow-hidden">
        <div className="text-center">
          <p className="text-3xl font-black text-white">ডাক্তার পাওয়া যায়নি।</p>
          <p className="mt-2 text-lg text-white/60">ইউজারনেমটি ঠিক আছে কি না দেখুন।</p>
        </div>
      </div>
    );
  }

  const bookingUrl = origin ? `${origin}/s/${encodeURIComponent(snap.doctor.username)}#serial` : "";
  const nextFour = snap.upcoming.slice(0, 4);
  const missed = snap.missed ?? [];
  const portrait = doctorPortrait(snap.doctor.profilePicture);
  const avatarFallback = fallbackAvatar();

  return (
    <div className="relative flex h-dvh flex-col gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4">
      {/* ambient stage light */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-emerald-500/20 blur-[100px]" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-teal-400/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      {/* Slim status strip */}
      <div className="relative flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/50 px-4 py-2 shadow-lg backdrop-blur-md sm:px-5">
        <p className="flex min-w-0 items-center gap-2.5 text-base font-black text-white sm:text-lg">
          {snap.live ? (
            <>
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
              </span>
              <span className="tracking-[0.2em] drop-shadow">LIVE</span>
              <span className="truncate font-bold normal-case tracking-normal text-white/70">
                · {snap.doctor.name}
              </span>
            </>
          ) : (
            <span className="tracking-widest text-white/60">📴 OFFLINE · {snap.doctor.name}</span>
          )}
        </p>
        <p className="shrink-0 font-mono text-base font-black tabular-nums text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] sm:text-xl" aria-label="বর্তমান সময়">
          🕒 {clock}
        </p>
      </div>

      {!snap.live || !snap.current ? (
        <div className="relative flex flex-1 items-center justify-center">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] px-10 py-12 text-center shadow-2xl backdrop-blur-md">
            <p className="text-5xl">{snap.live ? "✅" : "📴"}</p>
            <p className="mt-4 bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-2xl font-black text-transparent sm:text-4xl">
              {snap.live ? "আজকের সব রোগী দেখা শেষ" : "সম্প্রচার বন্ধ আছে"}
            </p>
            <p className="mt-2 text-base text-white/60 sm:text-lg">
              {snap.live
                ? `মোট ${toBn(snap.totalToday)} জন সিরিয়াল ছিল।`
                : "ডাক্তার লাইভ চালু করলেই এখানে সিরিয়াল দেখা যাবে।"}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative grid min-h-0 flex-1 grid-cols-[1.3fr_1fr] gap-3 pt-3 sm:gap-4 sm:pt-4">
          {/* LEFT */}
          <div className="flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4">
            {/* Current serial + patient */}
            <div className="relative flex shrink-0 items-center gap-4 overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-5 py-3 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.5)] sm:gap-6 sm:px-6">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: "radial-gradient(#ffffff 1.5px, transparent 1.5px)",
                  backgroundSize: "26px 26px",
                }}
              />
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
              <AnimatePresence mode="wait">
                <motion.p
                  key={snap.current.serial}
                  initial={{ opacity: 0, scale: 0.85, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -10 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="relative shrink-0 bg-gradient-to-b from-white via-white to-amber-200 bg-clip-text font-black tabular-nums tracking-tight text-transparent drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
                  style={{ fontSize: "400px", lineHeight: 0.8, whiteSpace: "nowrap" }}
                >
                  {toBn(snap.current.serial)}
                </motion.p>
              </AnimatePresence>
              <div className="relative min-w-0 flex-1">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-300 sm:text-base">
                  ✅ ভিতরে আছেন
                </p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={snap.current.serial + snap.current.patientName}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 truncate font-black text-white drop-shadow"
                    style={{ fontSize: "clamp(1.7rem, 4.6vw, 3.6rem)" }}
                  >
                    {snap.current.patientName}
                  </motion.p>
                </AnimatePresence>
                <p
                  className="mt-2 flex flex-wrap items-center gap-2"
                  style={{ fontSize: "clamp(0.85rem, 1.9vw, 1.25rem)" }}
                >
                  <span className="inline-block rounded-full border border-white/25 bg-black/30 px-4 py-1 font-bold text-emerald-50">
                    📍 {snap.current.chamberName ?? "চেম্বার"}
                  </span>
                  <BookingBadge type={snap.current.bookingType} />
                </p>
              </div>
              {/* ticking pulse behind */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-start pl-10" aria-hidden="true">
                <span className="absolute h-48 w-48 animate-ping rounded-full bg-white/10 [animation-duration:1.8s] sm:h-64 sm:w-64" />
              </div>
            </div>

            {/* Clock + upcoming */}
            <div className="grid min-h-0 flex-1 grid-cols-[auto_1fr] items-stretch gap-3 sm:gap-4">
              <div className="flex aspect-square w-full max-w-[9rem] items-center justify-center self-center rounded-full border border-amber-300/30 bg-slate-900/70 p-2.5 text-emerald-100 shadow-[0_0_40px_-10px_rgba(251,191,36,0.4)] sm:max-w-[12rem]">
                <AnalogClock now={now} />
              </div>
              <ul className="flex min-h-0 min-w-0 flex-col justify-center gap-2">
                {nextFour.length > 0 ? (
                  nextFour.map((q, i) => (
                    <li
                      key={q.serial}
                      className={`flex min-w-0 items-center gap-3 rounded-2xl px-3 py-1.5 shadow sm:px-4 ${
                        i === 0
                          ? "border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-white"
                          : "border border-white/10 bg-white/[0.08] backdrop-blur"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black tabular-nums sm:h-12 sm:w-12 ${
                          i === 0
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-emerald-950 shadow"
                            : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow"
                        }`}
                        style={{ fontSize: "clamp(1rem, 2.4vw, 1.6rem)" }}
                      >
                        {toBn(q.serial)}
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate font-bold ${i === 0 ? "text-slate-900" : "text-white"}`}
                        style={{ fontSize: "clamp(1rem, 2.6vw, 1.8rem)" }}
                      >
                        {q.patientName}
                      </span>
                      <BookingBadge type={q.bookingType} />
                      {i === 0 && (
                        <span
                          className="shrink-0 animate-pulse rounded-full bg-emerald-600 px-3 py-1 font-black text-white"
                          style={{ fontSize: "clamp(0.75rem, 1.8vw, 1.1rem)" }}
                        >
                          পরবর্তী
                        </span>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-center font-bold text-white/70 backdrop-blur" style={{ fontSize: "clamp(1rem, 2.4vw, 1.5rem)" }}>
                    আর কেউ অপেক্ষায় নেই
                  </li>
                )}
              </ul>
            </div>

            {/* Hospital lower-third + waiting */}
            <div className="flex shrink-0 items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 px-4 py-2.5 shadow-lg sm:px-5">
              <p className="min-w-0 truncate font-black text-white" style={{ fontSize: "clamp(1rem, 2.6vw, 1.8rem)" }}>
                🏥 {snap.current.hospitalName ?? snap.current.chamberName ?? "চেম্বার"}
                {snap.current.hospitalName && snap.current.chamberName && (
                  <span className="font-bold text-white/75"> · {snap.current.chamberName}</span>
                )}
              </p>
              <p className="shrink-0 rounded-xl bg-black/30 px-4 py-1 font-black tabular-nums text-amber-300" style={{ fontSize: "clamp(0.95rem, 2.3vw, 1.6rem)" }}>
                মোট অপেক্ষায় আছেন {toBn(snap.waitingCount)} জন
              </p>
            </div>
          </div>

          {/* RIGHT — powered-by first, then picture + QR */}
          <div className="flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4">
            {/* Powered by — white box, Bangla label first, then bigger logo */}
            <div className="flex shrink-0 items-center justify-center gap-3 rounded-2xl bg-white px-4 py-2 shadow-lg">
              <p className="font-black text-slate-700" style={{ fontSize: "clamp(1rem, 2.4vw, 1.7rem)" }}>
                পাওয়ার্ড বাই
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element -- bundled static logo */}
              <img src="/images/logo.png" alt="MrDoctor" className="h-[3.75rem] w-auto object-contain sm:h-[4.5rem]" />
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-[0.85fr_1.15fr] gap-3 sm:gap-4">
              {/* Doctor image (shorter when the missed list shows) + missed panel */}
              <div className="flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4">
                <div
                  className={`relative overflow-hidden rounded-[1.75rem] border border-white/15 shadow-2xl ${
                    missed.length > 0 ? "min-h-0 flex-[2]" : "min-h-0 flex-1"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- doctor-uploaded portrait, bundled fallback */}
                  <img
                    src={portrait}
                    alt={snap.doctor.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                      if (!e.currentTarget.src.endsWith(avatarFallback)) {
                        e.currentTarget.src = avatarFallback;
                      }
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2.5 pt-8 text-center">
                    <p className="truncate font-black text-white" style={{ fontSize: "clamp(0.85rem, 1.9vw, 1.2rem)" }}>
                      {snap.doctor.name}
                    </p>
                    {snap.doctor.speciality && (
                      <p className="truncate text-emerald-200/90" style={{ fontSize: "clamp(0.7rem, 1.5vw, 0.95rem)" }}>
                        {snap.doctor.speciality}
                      </p>
                    )}
                  </div>
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-black tracking-widest text-white shadow-lg">
                    ● LIVE
                  </span>
                </div>
                {/* Missed panel — skipped serials, asked to wait for their turn */}
                {missed.length > 0 && (
                  <div className="flex min-h-0 flex-[3] flex-col overflow-hidden rounded-[1.75rem] border border-amber-300/30 bg-amber-950/60 p-3 shadow-2xl backdrop-blur">
                    <p className="shrink-0 font-black text-amber-300" style={{ fontSize: "clamp(0.9rem, 2vw, 1.3rem)" }}>
                      ⏳ উপস্থিত হননি
                    </p>
                    <p className="shrink-0 font-bold text-amber-100/80" style={{ fontSize: "clamp(0.7rem, 1.6vw, 1rem)" }}>
                      অপেক্ষা করুন, ডাকা হবে
                    </p>
                    <ul className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-hidden">
                      {missed.slice(0, 5).map((m) => (
                        <li
                          key={m.serial}
                          className="flex min-w-0 items-center gap-2 rounded-xl bg-black/30 px-2.5 py-1"
                        >
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 font-black tabular-nums text-emerald-950"
                            style={{ fontSize: "clamp(0.8rem, 1.8vw, 1.1rem)" }}
                          >
                            {toBn(m.serial)}
                          </span>
                          <span
                            className="min-w-0 flex-1 truncate font-bold text-white"
                            style={{ fontSize: "clamp(0.8rem, 1.8vw, 1.15rem)" }}
                          >
                            {m.patientName}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {missed.length > 5 && (
                      <p className="mt-1.5 shrink-0 text-center font-bold text-amber-200/80" style={{ fontSize: "clamp(0.7rem, 1.6vw, 1rem)" }}>
                        …আরো {toBn(missed.length - 5)} জন
                      </p>
                    )}
                  </div>
                )}
              </div>
              {/* QR card — same look as the public website: dark emerald,
                  amber eyebrow, white QR box, instructions */}
              <div className="flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[1.75rem] bg-emerald-950 p-3 text-center text-white shadow-2xl ring-1 ring-white/10">
                <p className="shrink-0 font-semibold uppercase tracking-[0.2em] text-amber-300" style={{ fontSize: "clamp(0.7rem, 1.6vw, 1rem)" }}>
                  QR স্ক্যান করুন
                </p>
                <p className="shrink-0 font-black" style={{ fontSize: "clamp(0.95rem, 2.1vw, 1.4rem)" }}>
                  📱 অনলাইনে সিরিয়াল নিন
                </p>
                <div className="mt-2 min-h-0 w-full flex-1 rounded-2xl bg-white p-2 shadow-xl">
                  {bookingUrl ? (
                    <QRCodeSVG value={bookingUrl} size={512} level="M" className="h-full max-h-full w-full" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">…</div>
                  )}
                </div>
                <ol className="mt-2 w-full shrink-0 space-y-0.5 text-left font-bold text-emerald-100/85" style={{ fontSize: "clamp(0.7rem, 1.6vw, 1rem)" }}>
                  <li>১️⃣ মোবাইলের ক্যামেরা খুলুন</li>
                  <li>২️⃣ QR কোডটি স্ক্যান করুন</li>
                  <li>৩️⃣ ফর্ম পূরণ করে সিরিয়াল নিন</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patience note */}
      <p className="relative mt-3 shrink-0 truncate rounded-2xl bg-amber-300 px-4 py-2 text-center font-black text-emerald-950 shadow-lg sm:mt-4" style={{ fontSize: "clamp(0.95rem, 2.3vw, 1.6rem)" }}>
        🙏 অপেক্ষা করুন, হুড়াহুড়ি করবেন না · <span dir="rtl" lang="ar">«وَبَشِّرِ الصَّابِرِينَ»</span> — “ধৈর্যশীলদের সুসংবাদ দিন” (২:১৫৫)
      </p>
    </div>
  );
}
