"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { PublicDoctor } from "@/lib/profile";
import { toBn } from "@/lib/bn";
import { doctorDemo } from "./doctorDemo";
import { SerialSection } from "./SerialSection";

/**
 * Personal-website template for a doctor — served at `<username>.domain.com`.
 * Every section falls back to static demo content when the database
 * doesn't provide it, so the subdomain always feels like a complete
 * individual website.
 */
export function DoctorSite({
  doctor,
  serialHref,
  username,
  waNumber,
  waHref,
}: {
  doctor: PublicDoctor | null;
  serialHref: string;
  username: string;
  waNumber: string;
  waHref: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const name = doctor?.name || doctorDemo.name;
  const speciality = doctor?.speciality || doctorDemo.speciality;
  const degree = doctor?.degree || doctorDemo.degree;
  const tagline = doctor?.tagline || doctorDemo.tagline;
  const aboutParas = doctor?.bio ? [doctor.bio] : doctorDemo.about;

  const experienceYears =
    doctor?.startedYear != null
      ? Math.max(0, new Date().getFullYear() - doctor.startedYear)
      : doctorDemo.experienceYears;

  const dbChambers = doctor && doctor.chambers.length > 0 ? doctor.chambers : null;
  const chamberCount = dbChambers ? dbChambers.length : doctorDemo.chambers.length;

  // Shared WhatsApp contact — global number, never a personal one.
  const waDisplay = toBn(waNumber);

  const degreeChips = degree
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .slice(0, 4);

  const initials = name
    .replace(/^ডা\.\s*/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const nav = [
    { href: "#home", label: "পরিচিতি" },
    { href: "#services", label: "সেবাসমূহ" },
    { href: "#chambers", label: "চেম্বার" },
    { href: "#serial", label: "সিরিয়াল" },
    { href: "#qualifications", label: "যোগ্যতা" },
    { href: "#blog", label: "ব্লগ" },
    { href: "#testimonials", label: "মতামত" },
    { href: "#contact", label: "যোগাযোগ" },
  ];

  return (
    <div className="font-hind min-h-screen bg-white text-slate-800">
      {/* ---------- Utility top bar ---------- */}
      <div className="hidden bg-emerald-950 text-xs text-emerald-100 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2">
          <p>{doctorDemo.hoursLine}</p>
          <div className="flex items-center gap-4">
            <a href={waHref} target="_blank" rel="noreferrer" className="hover:text-amber-300">
              💬 হোয়াটসঅ্যাপ: {waDisplay}
            </a>
            <span className="text-emerald-700">|</span>
            <p>{doctorDemo.areaLine}</p>
          </div>
        </div>
      </div>

      {/* ---------- Navbar ---------- */}
      <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <a href="#home" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-800 text-lg font-bold text-amber-300">
              {initials}
            </span>
            <span className="leading-tight">
              <span className="block font-bold text-emerald-950">{name}</span>
              <span className="block text-xs text-slate-500">{degree}</span>
            </span>
          </a>
          <nav className="hidden items-center gap-5 text-[15px] font-medium lg:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="text-slate-600 hover:text-emerald-700">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href={serialHref}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 sm:inline-block"
            >
              ✆ সিরিয়াল নিন
            </a>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="মেনু"
              className="rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900 lg:hidden"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-emerald-900/10 bg-white px-5 py-3 lg:hidden">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="block border-b border-slate-50 py-2.5 font-medium text-slate-700 last:border-0 hover:text-emerald-700"
              >
                {n.label}
              </a>
            ))}
            <a
              href={serialHref}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block rounded-full bg-emerald-700 px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              ✆ সিরিয়াল নিন
            </a>
          </nav>
        )}
      </header>

      {/* ---------- Hero ---------- */}
      <section
        id="home"
        className="relative scroll-mt-24 overflow-hidden bg-emerald-950 text-white"
      >
        {/* decorative pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(#fbbf24 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-700/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-teal-600/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
          <div>
            <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
              <span className="inline-block h-px w-10 bg-amber-300" />
              {speciality}
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">{name}</h1>
            <p className="mt-3 text-xl font-medium text-emerald-100 md:text-2xl">{tagline}</p>
            <p className="mt-4 max-w-xl leading-relaxed text-emerald-100/80">
              {doctorDemo.heroIntro}
            </p>
            {degreeChips.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {degreeChips.map((d) => (
                  <span
                    key={d}
                    className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm text-emerald-50"
                  >
                    {d}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={serialHref}
              target="_blank"
              rel="noreferrer"
                className="rounded-full bg-amber-400 px-7 py-3.5 font-bold text-emerald-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300"
              >
                ✆ এখনই সিরিয়াল নিন
              </a>
              <a
                href="#chambers"
                className="rounded-full border border-white/30 px-7 py-3.5 font-semibold text-white hover:bg-white/10"
              >
                চেম্বার ও সময়সূচি
              </a>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                { value: `${toBn(experienceYears)}+`, label: "বছরের অভিজ্ঞতা" },
                { value: doctorDemo.patientsLabel, label: doctorDemo.patientsCaption },
                { value: toBn(chamberCount), label: "চেম্বার" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/15 bg-white/10 px-2 py-4 text-center backdrop-blur"
                >
                  <dd className="text-2xl font-bold text-amber-300 md:text-3xl">{s.value}</dd>
                  <dt className="mt-1 text-xs text-emerald-100/80 md:text-sm">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Portrait card */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 shadow-2xl ring-1 ring-white/20">
              <div className="flex h-80 items-center justify-center">
                <span className="flex h-44 w-44 items-center justify-center rounded-full bg-white/10 text-6xl font-bold text-amber-300 ring-2 ring-amber-300/60">
                  {initials}
                </span>
              </div>
              <div className="border-t border-white/15 bg-black/25 px-6 py-5">
                <p className="text-lg font-bold">{name}</p>
                <p className="text-sm text-emerald-100/90">{degree}</p>
                <p className="mt-1 text-xs text-emerald-100/70">{doctorDemo.regNo}</p>
              </div>
            </div>
            <div className="absolute -right-3 top-6 rounded-2xl bg-amber-400 px-4 py-2.5 text-center text-emerald-950 shadow-xl">
              <p className="text-xl font-bold leading-none">{toBn(experienceYears)}+</p>
              <p className="text-[11px] font-semibold">বছরের অভিজ্ঞতা</p>
            </div>
            <div className="absolute -left-3 bottom-24 rounded-2xl bg-white px-4 py-2.5 text-emerald-950 shadow-xl">
              <p className="text-sm font-bold text-amber-500">★★★★★ {doctorDemo.rating}</p>
              <p className="text-[11px] font-medium text-slate-500">রোগীদের রেটিং</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- About ---------- */}
      <section className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <span className="inline-block h-px w-10 bg-emerald-600" />
              পরিচিতি
            </p>
            <h2 className="mt-3 text-3xl font-bold text-emerald-950 md:text-4xl">
              {doctorDemo.aboutTitle}
            </h2>
            <div className="mt-6 rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-100">
              <p className="text-4xl font-bold text-emerald-800">{toBn(experienceYears)}+</p>
              <p className="mt-1 font-medium text-emerald-900">বছর ধরে রোগীদের সেবায়</p>
              <p className="mt-3 text-sm text-emerald-800/70">{doctorDemo.regNo}</p>
            </div>
          </div>
          <div>
            {aboutParas.map((p, i) => (
              <p
                key={i}
                className={i === 0 ? "text-lg leading-relaxed text-slate-700" : "mt-4 leading-relaxed text-slate-600"}
              >
                {p}
              </p>
            ))}
            <ul className="mt-6 space-y-3">
              {[
                "প্রতিটি রোগীকে পর্যাপ্ত সময় দেওয়া",
                "রোগ ও চিকিৎসা সহজ ভাষায় বুঝিয়ে বলা",
                "অপ্রয়োজনীয় টেস্ট ও ওষুধ এড়িয়ে চলা",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 font-medium text-slate-700">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Services ---------- */}
      <section id="services" className="scroll-mt-24 bg-stone-50">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            <span className="inline-block h-px w-10 bg-emerald-600" />
            সেবাসমূহ
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-xl text-3xl font-bold text-emerald-950 md:text-4xl">
              আমি যেসব চিকিৎসা সক্রিয়ভাবে করি
            </h2>
            <a href={serialHref} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 hover:text-emerald-900">
              পরামর্শ নিন →
            </a>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {doctorDemo.services.map((s, i) => (
              <div
                key={s.title}
                className="group rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md ${
                      i === 0
                        ? "bg-gradient-to-br from-rose-500 to-red-700"
                        : i === 1
                          ? "bg-gradient-to-br from-emerald-500 to-teal-700"
                          : "bg-gradient-to-br from-sky-500 to-indigo-700"
                    }`}
                  >
                    {s.icon}
                  </div>
                  <span className="text-sm font-bold text-slate-200 group-hover:text-amber-400">
                    {toBn(i + 1).padStart(2, "০")}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-emerald-950">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Chambers ---------- */}
      <section id="chambers" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 md:py-20">
        <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          <span className="inline-block h-px w-10 bg-emerald-600" />
          চেম্বার
        </p>
        <h2 className="mt-3 text-3xl font-bold text-emerald-950 md:text-4xl">
          যেখানে আমাকে পাওয়া যাবে
        </h2>
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
          {dbChambers
            ? dbChambers.map((c) => {
                const slots = (doctor?.schedules ?? [])
                  .filter((s) => s.chamber?.id === c.id)
                  .map((s) => ({
                    days: s.dayOfWeek,
                    time: `${s.startTime}–${s.endTime}${s.chamber?.chamberName ? ` (${s.chamber.chamberName})` : ""}`,
                  }));
                return (
                  <article
                    key={c.id}
                    className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-emerald-900/10"
                  >
                    <div className="bg-emerald-900 px-6 py-5 text-white">
                      <h3 className="text-xl font-bold">
                        {c.chamberName || c.hospital?.name || c.addressLine}
                      </h3>
                      <p className="mt-1 text-sm text-emerald-100/80">
                        {c.addressLine}, {c.thana}, {c.district} ({c.division})
                      </p>
                    </div>
                    <div className="p-6">
                      {c.hospital && (
                        <p className="text-sm font-medium text-emerald-700">
                          হাসপাতাল: {c.hospital.name}
                        </p>
                      )}
                      {slots.length > 0 ? (
                        <table className="mt-2 w-full text-[15px]">
                          <tbody>
                            {slots.map((r, i) => (
                              <tr key={i} className="border-b border-slate-100 last:border-0">
                                <td className="py-2.5 pr-2 font-semibold text-emerald-950">{r.days}</td>
                                <td className="py-2.5 text-right text-slate-600">{r.time}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="mt-2 text-slate-500">সময়সূচির জন্য ফোনে যোগাযোগ করুন।</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full bg-emerald-50 px-3.5 py-1.5 font-semibold text-emerald-800">
                          নতুন রোগী ৳{c.newPatientFee}
                        </span>
                        <span className="rounded-full bg-stone-100 px-3.5 py-1.5 font-semibold text-slate-700">
                          পুরনো রোগী ৳{c.oldPatientFee}
                        </span>
                      </div>
                      <a
                        href={serialHref}
              target="_blank"
              rel="noreferrer"
                        className="mt-5 block rounded-full bg-emerald-700 px-5 py-3 text-center font-bold text-white hover:bg-emerald-800"
                      >
                        সিরিয়াল নিন
                      </a>
                    </div>
                  </article>
                );
              })
            : doctorDemo.chambers.map((c) => (
                <article
                  key={c.name}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-emerald-900/10"
                >
                  <div className="flex items-start justify-between gap-3 bg-emerald-900 px-6 py-5 text-white">
                    <div>
                      <h3 className="text-xl font-bold">{c.name}</h3>
                      <p className="mt-1 text-sm text-emerald-100/80">{c.address}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-emerald-950">
                      {c.sessionLabel}
                    </span>
                  </div>
                  <div className="p-6">
                    <table className="w-full text-[15px]">
                      <tbody>
                        {c.rows.map((r, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="py-2.5 pr-2 font-semibold text-emerald-950">{r.days}</td>
                            <td className="py-2.5 text-right text-slate-600">{r.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-emerald-50 px-3.5 py-1.5 font-semibold text-emerald-800">
                        নতুন রোগী {c.feeNew}
                      </span>
                      <span className="rounded-full bg-stone-100 px-3.5 py-1.5 font-semibold text-slate-700">
                        পুরনো রোগী {c.feeOld}
                      </span>
                    </div>
                    <a
                      href={serialHref}
              target="_blank"
              rel="noreferrer"
                      className="mt-5 block rounded-full bg-emerald-700 px-5 py-3 text-center font-bold text-white hover:bg-emerald-800"
                    >
                      সিরিয়াল নিন
                    </a>
                  </div>
                </article>
              ))}
          {/* Odd chamber count (1, 3, 5…) leaves a gap in the 2-col grid —
              fill it with a QR tile so the section looks balanced. */}
          {(dbChambers ? dbChambers.length : doctorDemo.chambers.length) % 2 === 1 && (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-emerald-950 p-8 text-center text-white shadow-sm">
              <div className="rounded-2xl bg-white p-3 shadow-lg">
                <QRCodeSVG value={serialHref} size={150} level="M" />
              </div>
              <p className="mt-4 font-bold">QR স্ক্যান করে সিরিয়াল নিন</p>
              <p className="mt-1 text-sm text-emerald-100/70">
                স্ক্যান করলেই হোয়াটসঅ্যাপে সিরিয়াল চ্যাট চালু হবে
              </p>
              <a
                href={serialHref}
                target="_blank"
                rel="noreferrer"
                className="mt-4 rounded-full bg-amber-400 px-6 py-2.5 text-sm font-bold text-emerald-950 hover:bg-amber-300"
              >
                হোয়াটসঅ্যাপে খুলুন
              </a>
            </div>
          )}
        </div>

        {/* Serial steps */}
        <div className="mt-10 grid gap-4 rounded-3xl bg-emerald-950 p-7 text-white md:grid-cols-3 md:p-9">
          {[
            { n: "১", t: "ফর্ম পূরণ বা QR স্ক্যান", d: "নিচের ফর্মটি পূরণ করুন, অথবা QR স্ক্যান করে হোয়াটসঅ্যাপে যান।" },
            { n: "২", t: "কনফার্মেশন নিন", d: "হোয়াটসঅ্যাপে কনফার্মেশন মেসেজ পেয়ে সিরিয়াল নিশ্চিত করুন।" },
            { n: "৩", t: "চেম্বারে আসুন", d: "সময়মতো এসে ধৈর্য ধরে পরামর্শ নিন।" },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-emerald-950">
                {s.n}
              </span>
              <div>
                <p className="font-bold">{s.t}</p>
                <p className="mt-1 text-sm text-emerald-100/75">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Online serial (QR + form → pendingAppointment) ---------- */}
      <SerialSection
        username={username}
        serialHref={serialHref}
        chambers={(doctor?.chambers ?? []).map((c) => ({
          id: c.id,
          name: c.chamberName || c.hospital?.name || c.addressLine,
        }))}
      />

      {/* ---------- Qualifications ---------- */}
      <section id="qualifications" className="scroll-mt-24 bg-stone-50">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            <span className="inline-block h-px w-10 bg-emerald-600" />
            যোগ্যতা ও অভিজ্ঞতা
          </p>
          <h2 className="mt-3 text-3xl font-bold text-emerald-950 md:text-4xl">
            একটি দীর্ঘ পথের প্রতিফলন
          </h2>
          <ol className="mt-10 space-y-2 border-l-2 border-amber-300 pl-0">
            {doctorDemo.qualifications.map((q) => (
              <li key={q.title} className="relative pb-8 pl-10 last:pb-0">
                <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-[3px] border-amber-300 bg-emerald-800" />
                <p className="text-sm font-bold text-amber-600">{q.year}</p>
                <p className="mt-0.5 text-lg font-medium text-slate-800">{q.title}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Blog ---------- */}
      <section id="blog" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 md:py-20">
        <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          <span className="inline-block h-px w-10 bg-emerald-600" />
          ব্লগ
        </p>
        <h2 className="mt-3 text-3xl font-bold text-emerald-950 md:text-4xl">
          স্বাস্থ্য নিয়ে কিছু জরুরি কথা
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {doctorDemo.posts.map((p) => (
            <article
              key={p.title}
              className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1.5 hover:shadow-xl"
            >
              <div
                className={`relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br text-6xl text-white/90 ${p.gradient}`}
              >
                <span className="transition group-hover:scale-110">{p.symbol}</span>
                <span className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white">
                  স্বাস্থ্য টিপস
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold leading-snug text-emerald-950">{p.title}</h3>
                <p className="mt-2 text-[15px] text-slate-600">{p.excerpt}</p>
                <span className="mt-4 inline-block font-bold text-emerald-700 group-hover:text-emerald-900">
                  বিস্তারিত পড়ুন →
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section id="testimonials" className="scroll-mt-24 bg-emerald-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            <span className="inline-block h-px w-10 bg-amber-300" />
            রোগীদের মতামত
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">যাঁরা আস্থা রেখেছেন</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {doctorDemo.testimonials.map((t) => (
              <figure
                key={t.name}
                className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur transition hover:bg-white/10"
              >
                <p className="text-sm font-bold tracking-widest text-amber-400">★★★★★</p>
                <blockquote className="mt-3 leading-relaxed text-emerald-50/90">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 font-bold text-emerald-950">
                    {t.name[0]}
                  </span>
                  <span className="font-semibold text-emerald-50">{t.name}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Contact ---------- */}
      <section id="contact" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 md:py-20">
        <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          <span className="inline-block h-px w-10 bg-emerald-600" />
          যোগাযোগ
        </p>
        <h2 className="mt-3 text-3xl font-bold text-emerald-950 md:text-4xl">
          নিঃসংকোচে যোগাযোগ করুন
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl bg-emerald-700 p-7 text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-1 hover:bg-emerald-800"
          >
            <p className="text-3xl">💬</p>
            <p className="mt-3 font-bold">হোয়াটসঅ্যাপে সিরিয়াল</p>
            <p className="mt-1 text-emerald-100">{waDisplay}</p>
          </a>
          <a
            href="#serial"
            className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-3xl">📝</p>
            <p className="mt-3 font-bold text-emerald-950">অনলাইন ফর্ম</p>
            <p className="mt-1 text-sm text-slate-600">ফর্ম পূরণ করে সিরিয়াল নিন</p>
          </a>
          <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
            <p className="text-3xl">📍</p>
            <p className="mt-3 font-bold text-emerald-950">চেম্বার এলাকা</p>
            <p className="mt-1 text-sm text-slate-600">
              {doctorDemo.areaLine} · {doctorDemo.hoursLine}
            </p>
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-700 p-8 text-white md:flex md:items-center md:justify-between md:p-10">
          <div>
            <p className="text-2xl font-bold md:text-3xl">আজই আপনার সিরিয়াল নিশ্চিত করুন</p>
            <p className="mt-2 text-emerald-100/85">
              {doctorDemo.areaLine} · {doctorDemo.hoursLine}
            </p>
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block shrink-0 rounded-full bg-amber-400 px-8 py-3.5 font-bold text-emerald-950 shadow-lg hover:bg-amber-300 md:mt-0"
          >
            💬 হোয়াটসঅ্যাপে সিরিয়াল নিন
          </a>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="bg-emerald-950 text-emerald-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-lg font-bold text-amber-300">
              {initials}
            </span>
            <div className="leading-tight">
              <p className="font-bold text-white">{name}</p>
              <p className="text-xs text-emerald-100/70">{doctorDemo.footerLine}</p>
            </div>
          </div>
          <p className="text-sm text-emerald-100/70">
            © {toBn(new Date().getFullYear())} {name} · সর্বস্বত্ব সংরক্ষিত
          </p>
        </div>
      </footer>
    </div>
  );
}
