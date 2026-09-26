"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Reveal } from "@/components/motion";
import type { PublicBlog, PublicDoctor, PublicReview } from "@/lib/profile";
import { toBn } from "@/lib/bn";
import { compressDayRanges, dayEnToBn } from "@/lib/days";
import { doctorPortrait, fallbackAvatar } from "@/lib/profile";
import { buildApexUrl } from "@/lib/portal";
import { PortalHeader } from "@/components/sites/PortalHeader";
import { doctorDemo } from "./doctorDemo";

const NAV_LINKS = [
  { href: "#home", label: "পরিচিতি" },
  { href: "#services", label: "সেবাসমূহ" },
  { href: "#chambers", label: "চেম্বার" },
  { href: "#serial", label: "সিরিয়াল" },
  { href: "#qualifications", label: "যোগ্যতা" },
  { href: "#blog", label: "ব্লগ" },
  { href: "#testimonials", label: "মতামত" },
  { href: "#contact", label: "যোগাযোগ" },
];
import { SerialSection } from "./SerialSection";
import { BlogSection } from "@/components/blog";
import { ReviewSection } from "@/components/reviews";

/**
 * Personal-website template for a doctor — served at `<username>.domain.com`.
 * Every section falls back to static demo content when the database
 * doesn't provide it, so the subdomain always feels like a complete
 * individual website.
 */
export function DoctorSite({
  doctor,
  serialHref,
  waNumber,
  waHref,
  host,
}: {
  doctor: PublicDoctor | null;
  serialHref: string;
  waNumber: string;
  waHref: string;
  /** Request host — logo links to the apex main site (SSR-safe). */
  host?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  function scrollToSection(href: string) {
    setMenuOpen(false);
    // Let the dropdown close first, then smooth-scroll to the section.
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    });
  }

  const name = doctor?.name || doctorDemo.name;
  const speciality = doctor?.speciality || doctorDemo.speciality;
  const degree = doctor?.degree || doctorDemo.degree;
  const tagline = doctor?.tagline || doctorDemo.tagline;
  const aboutParas = doctor?.bio ? [doctor.bio] : doctorDemo.about;

  const experienceYears = useMemo(
    () =>
      doctor?.startedYear != null
        ? Math.max(0, new Date().getFullYear() - doctor.startedYear)
        : doctorDemo.experienceYears,
    [doctor],
  );

  const dbChambers = doctor && doctor.chambers.length > 0 ? doctor.chambers : null;
  const chamberCount = dbChambers ? dbChambers.length : doctorDemo.chambers.length;

  // Dynamic "আমি যেসব চিকিৎসা সক্রিয়ভাবে করি" — doctor_informations.expertise
  // [{ icon, service, service_details }], fallback to static demo when empty.
  const services = useMemo(() => {
    const rawExpertise = doctor?.information?.expertise;
    return Array.isArray(rawExpertise) && rawExpertise.length > 0
      ? rawExpertise
          .filter((e) => e && typeof e.service === "string" && typeof e.service_details === "string")
          .map((e) => ({
            icon: typeof e.icon === "string" && e.icon ? e.icon : "✚",
            title: e.service,
            desc: e.service_details,
          }))
      : doctorDemo.services;
  }, [doctor?.information?.expertise]);

  // Dynamic "যোগ্যতা ও অভিজ্ঞতা" timeline — doctor_informations.timeline
  // [{ year, title }], unbounded length, fallback to static demo when empty.
  const qualifications = useMemo(() => {
    const rawTimeline = doctor?.information?.timeline;
    return Array.isArray(rawTimeline) && rawTimeline.length > 0
      ? rawTimeline
          .filter((t) => t && typeof t.year === "string" && typeof t.title === "string")
          .map((t) => ({ year: t.year, title: t.title }))
      : doctorDemo.qualifications;
  }, [doctor?.information?.timeline]);

  // Dynamic পরিচিতি ✓ highlights — doctor_informations.highlights
  // [{ icon, text }], fallback to static demo when empty.
  const highlights = useMemo(() => {
    const rawHighlights = doctor?.information?.highlights;
    return Array.isArray(rawHighlights) && rawHighlights.length > 0
      ? rawHighlights
          .filter((h) => h && typeof h.text === "string" && h.text.trim())
          .map((h) => ({
            icon: typeof h.icon === "string" && h.icon.trim() ? h.icon.trim() : "✓",
            text: h.text.trim(),
          }))
      : [
          { icon: "✓", text: "প্রতিটি রোগীকে পর্যাপ্ত সময় দেওয়া" },
          { icon: "✓", text: "রোগ ও চিকিৎসা সহজ ভাষায় বুঝিয়ে বলা" },
          { icon: "✓", text: "অপ্রয়োজনীয় টেস্ট ও ওষুধ এড়িয়ে চলা" },
        ];
  }, [doctor?.information?.highlights]);

  // Dynamic hero stat — doctor_informations.stats[0] [{ value, label }],
  // e.g. ১২ হাজার+ / সুস্থ রোগী. Falls back to the demo stat.
  const heroStat = useMemo(() => {
    const rawStats = doctor?.information?.stats;
    return Array.isArray(rawStats) && rawStats.length > 0 && typeof rawStats[0]?.value === "string"
      ? { value: rawStats[0].value, label: typeof rawStats[0].label === "string" ? rawStats[0].label : "" }
      : { value: doctorDemo.patientsLabel, label: doctorDemo.patientsCaption };
  }, [doctor?.information?.stats]);

  // Dynamic chamber summary for the CTA banner / contact card / top bar —
  // area from the first chamber's thana + district, days compressed from the
  // weekly schedules, time from the earliest start to the latest end.
  const chamberSummary = useMemo(() => {
    if (!dbChambers) return null;
    const first = dbChambers.find((c) => c.thana?.trim() || c.district?.trim());
    const areaLine = first
      ? [first.thana?.trim(), first.district?.trim()].filter(Boolean).join(", ")
      : null;
    const dayEnums = [...new Set((doctor?.schedules ?? []).map((s) => String(s.dayOfWeek).toUpperCase()))];
    const daysLine = dayEnums.length > 0 ? compressDayRanges(dayEnums) : null;
    const starts = (doctor?.schedules ?? []).map((s) => s.startTime).filter(Boolean).sort();
    const ends = (doctor?.schedules ?? []).map((s) => s.endTime).filter(Boolean).sort();
    const timeLine = starts.length > 0 && ends.length > 0 ? `${toBn(starts[0]!)} – ${toBn(ends[ends.length - 1]!)}` : null;
    if (!areaLine && !daysLine && !timeLine) return null;
    return { areaLine, daysLine, timeLine };
  }, [dbChambers, doctor?.schedules]);

  // Dynamic "স্বাস্থ্য নিয়ে কিছু জরুরি কথা" — blogs table (own PUBLISHED posts).
  // Falls back to static demo posts so the section never looks empty.
  const blogPosts: PublicBlog[] = useMemo(() => {
    const rawBlogs = doctor?.blogs;
    return Array.isArray(rawBlogs) && rawBlogs.length > 0
      ? rawBlogs.map((b) => ({
          id: b.id,
          slug: b.slug,
          title: b.title,
          excerpt: b.excerpt,
          content: b.content,
          coverImage: b.coverImage,
          coverGradient: b.coverGradient || "from-emerald-500 to-teal-700",
          coverSymbol: b.coverSymbol || "✿",
          category: b.category || "স্বাস্থ্য টিপস",
          tags: Array.isArray(b.tags) ? b.tags : [],
          authorName: b.authorName,
          publishedAt: b.publishedAt,
          views: b.views ?? 0,
        }))
      : doctorDemo.posts.map((p, i) => ({
          id: `demo-${i}`,
          slug: `demo-${i}`,
          title: p.title,
          excerpt: p.excerpt,
          content: p.excerpt,
          coverImage: null,
          coverGradient: p.gradient,
          coverSymbol: p.symbol,
          category: "স্বাস্থ্য টিপস",
          tags: [],
          authorName: null,
          publishedAt: null,
          views: 0,
        }));
  }, [doctor?.blogs]);

  // Shared WhatsApp contact — global number, never a personal one.
  const waDisplay = toBn(waNumber);

  // Dynamic "রোগীদের মতামত" — reviews table (APPROVED), fallback to demo.
  const reviewList: PublicReview[] = useMemo(() => {
    const rawReviews = doctor?.reviews;
    return Array.isArray(rawReviews)
      ? rawReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          reviewerName: r.reviewerName,
          title: r.title,
          comment: r.comment,
          createdAt: r.createdAt,
        }))
      : [];
  }, [doctor?.reviews]);
  const reviewFallback: PublicReview[] = useMemo(
    () =>
      doctorDemo.testimonials.map((t, i) => ({
        id: `demo-t-${i}`,
        rating: 5,
        reviewerName: t.name,
        title: null,
        comment: t.quote,
        createdAt: null,
      })),
    [],
  );
  const ratingSummary = doctor?.rating ?? null;
  const heroRating =
    ratingSummary && ratingSummary.count > 0
      ? toBn(ratingSummary.average.toFixed(1))
      : doctorDemo.rating;

  // Hero portrait + logos: DB profile picture, else the global bundled avatar.
  const portrait = doctorPortrait(doctor?.profilePicture);
  const avatarFallback = fallbackAvatar();

  const degreeChips = useMemo(
    () =>
      degree
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean)
        .slice(0, 4),
    [degree],
  );

  const nav = NAV_LINKS;
  // Brand initial for the navbar / footer badge (no second portrait image —
  // the hero portrait card is the single profile-picture showcase).
  const brandInitial = (name.trim()[0] ?? "ড").toUpperCase();

  return (
    <div className="font-hind min-h-screen bg-white text-slate-800">
      {/* ---------- Utility top bar ---------- */}
      <div className="hidden bg-emerald-950 text-xs text-emerald-100 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2">
          <p>
            {chamberSummary?.daysLine && chamberSummary?.timeLine
              ? `${chamberSummary.daysLine} · ${chamberSummary.timeLine}`
              : doctorDemo.hoursLine}
          </p>
          <div className="flex items-center gap-4">
            <a href={waHref} target="_blank" rel="noreferrer" className="hover:text-amber-300">
              💬 হোয়াটসঅ্যাপ: {waDisplay}
            </a>
            <span className="text-emerald-700">|</span>
            <p>{chamberSummary?.areaLine ?? doctorDemo.areaLine}</p>
          </div>
        </div>
      </div>

      {/* ---------- Navbar (unified portal header: logo left, category pill first) ---------- */}
      <PortalHeader
        logoHref={host ? buildApexUrl("/", host) : "#home"}
        logoAriaLabel="মিস্টার ডাক্তার — মূল সাইট"
        pill={
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 ring-1 ring-emerald-200 min-[420px]:inline-flex">
            🩺 {speciality}
          </span>
        }
        nav={nav}
        navClassName="hidden lg:flex"
        actions={
          <>
            <a
              href={serialHref}
              target="_blank"
              rel="noreferrer"
              className="hidden shrink-0 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 sm:inline-block"
            >
              ✆ সিরিয়াল নিন
            </a>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="মেনু"
              aria-expanded={menuOpen}
              className="shrink-0 rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900 transition active:scale-95 lg:hidden"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </>
        }
        mobilePanel={
          <AnimatePresence initial={false}>
            {menuOpen && (
              <motion.nav
                className="overflow-hidden border-t border-emerald-900/10 bg-white px-5 lg:hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="py-3">
                  {nav.map((n) => (
                    <button
                      key={n.href}
                      onClick={() => scrollToSection(n.href)}
                      className="block w-full border-b border-slate-50 py-2.5 text-left font-medium text-slate-700 last:border-0 hover:text-emerald-700"
                    >
                      {n.label}
                    </button>
                  ))}
                  <a
                    href={serialHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block rounded-full bg-emerald-700 px-5 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    ✆ সিরিয়াল নিন
                  </a>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        }
      />

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
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
              <span className="inline-block h-px w-10 bg-amber-300" />
              {speciality}
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">{name}</h1>
            <p className="mt-3 text-xl font-medium text-emerald-100 md:text-2xl">{speciality}</p>
            <p className="mt-4 max-w-xl leading-relaxed text-emerald-100/80">
              {tagline}
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
                { value: heroStat.value, label: heroStat.label },
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
          </motion.div>

          {/* Portrait card */}
          <motion.div
            className="relative mx-auto w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          >
            <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 shadow-2xl ring-1 ring-white/20">
              <div className="flex h-80 items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- portrait may be any external doctor-uploaded URL */}
                <img
                  src={portrait}
                  alt={name}
                  fetchPriority="high"
                  className="h-full w-full object-cover"
              onError={(e) => {
                if (!e.currentTarget.src.endsWith(avatarFallback)) {
                  e.currentTarget.src = avatarFallback;
                }
              }}
                />
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
            <div className="absolute -right-3 bottom-24 rounded-2xl bg-white px-4 py-2.5 text-right text-emerald-950 shadow-xl">
              <p className="text-sm font-bold text-amber-500">★★★★★ {heroRating}</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">রোগীদের রেটিং</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- About ---------- */}
      <section className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 md:py-20">
        <Reveal>
          <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <span className="inline-block h-px w-10 bg-emerald-600" />
              পরিচিতি
            </p>
            <h2 className="mt-3 text-3xl font-bold text-emerald-950 md:text-4xl">
              {doctorDemo.aboutTitle}
            </h2>
            <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-900 p-7 text-white shadow-xl">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage: "radial-gradient(#fbbf24 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              />
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-600/40 blur-3xl" />
              <div className="relative grid grid-cols-2 gap-5">
                <div>
                  <p className="text-4xl font-bold text-amber-300">{toBn(experienceYears)}+</p>
                  <p className="mt-1 text-sm font-medium text-emerald-100/85">বছর ধরে রোগীদের সেবায়</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-amber-300">{heroStat.value}</p>
                  <p className="mt-1 text-sm font-medium text-emerald-100/85">{heroStat.label}</p>
                </div>
                <div className="border-t border-white/15 pt-4">
                  <p className="text-lg font-bold text-amber-300">★ {heroRating}</p>
                  <p className="mt-1 text-sm font-medium text-emerald-100/85">রোগীদের রেটিং</p>
                </div>
                <div className="border-t border-white/15 pt-4">
                  <p className="text-lg font-bold text-amber-300">{toBn(chamberCount)}টি</p>
                  <p className="mt-1 text-sm font-medium text-emerald-100/85">চেম্বার</p>
                </div>
              </div>
              <p className="relative mt-5 border-t border-white/15 pt-4 text-xs text-emerald-100/70">
                {doctorDemo.regNo}
              </p>
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
              {highlights.map((h) => (
                <li key={h.text} className="flex items-start gap-3 font-medium text-slate-700">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {h.icon}
                  </span>
                  {h.text}
                </li>
              ))}
            </ul>
          </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- Services ---------- */}
      <section id="services" className="scroll-mt-24 bg-stone-50">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <Reveal>
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
          </Reveal>
          <motion.div
            className="mt-10 grid gap-5 md:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                className="group rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1.5 hover:shadow-xl"
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
                }}
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------- Chambers ---------- */}
      <section id="chambers" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 md:py-20">
        <Reveal>
          <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            <span className="inline-block h-px w-10 bg-emerald-600" />
            চেম্বার
          </p>
          <h2 className="mt-3 text-3xl font-bold text-emerald-950 md:text-4xl">
            যেখানে আমাকে পাওয়া যাবে
          </h2>
        </Reveal>
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
          {dbChambers
            ? dbChambers.map((c) => {
                const slots = (doctor?.schedules ?? [])
                  .filter((s) => s.chamber?.id === c.id)
                  .map((s) => ({
                    days: dayEnToBn(s.dayOfWeek),
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
                          নতুন রোগী ৳{c.newPatientFee} (BDT)
                        </span>
                        <span className="rounded-full bg-stone-100 px-3.5 py-1.5 font-semibold text-slate-700">
                          পুরনো রোগী ৳{c.oldPatientFee} (BDT)
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

      {/* ---------- Serial (online booking form + QR + WhatsApp) ---------- */}
      <SerialSection
        serialHref={serialHref}
        waHref={waHref}
        doctorUsername={doctor?.username ?? null}
      />

      {/* ---------- Qualifications ---------- */}
      <section id="qualifications" className="scroll-mt-24 bg-stone-50">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <Reveal>
            <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <span className="inline-block h-px w-10 bg-emerald-600" />
              যোগ্যতা ও অভিজ্ঞতা
            </p>
            <h2 className="mt-3 text-3xl font-bold text-emerald-950 md:text-4xl">
              একটি দীর্ঘ পথের প্রতিফলন
            </h2>
          </Reveal>
          <motion.ol
            className="mt-10 space-y-2 border-l-2 border-amber-300 pl-0"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            {qualifications.map((q) => (
              <motion.li
                key={q.title}
                className="relative pb-8 pl-10 last:pb-0"
                variants={{
                  hidden: { opacity: 0, x: -16 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
                }}
              >
                <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-[3px] border-amber-300 bg-emerald-800" />
                <p className="text-sm font-bold text-amber-600">{q.year}</p>
                <p className="mt-0.5 text-lg font-medium text-slate-800">{q.title}</p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* ---------- Blog (DB-driven, modular components) ---------- */}
      <BlogSection posts={blogPosts} />

      {/* ---------- Testimonials (DB-driven, modular components) ---------- */}
      <ReviewSection
        target={{ type: "doctor", username: doctor?.username || "demo" }}
        reviews={reviewList}
        rating={ratingSummary}
        fallback={reviewFallback}
        showForm={!!doctor}
        dark
      />

      {/* ---------- Contact ---------- */}
      <section id="contact" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 md:py-20">
        <Reveal>
          <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            <span className="inline-block h-px w-10 bg-emerald-600" />
            যোগাযোগ
          </p>
          <h2 className="mt-3 text-3xl font-bold text-emerald-950 md:text-4xl">
            নিঃসংকোচে যোগাযোগ করুন
          </h2>
        </Reveal>
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
              {chamberSummary?.areaLine ?? doctorDemo.areaLine}
              {chamberSummary?.daysLine && chamberSummary?.timeLine
                ? ` · ${chamberSummary.daysLine} · ${chamberSummary.timeLine}`
                : ` · ${doctorDemo.hoursLine}`}
            </p>
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-700 p-8 text-white md:flex md:items-center md:justify-between md:p-10">
          <div>
            <p className="text-2xl font-bold md:text-3xl">আজই আপনার সিরিয়াল নিশ্চিত করুন</p>
            <p className="mt-2 text-emerald-100/85">
              {chamberSummary?.areaLine ?? doctorDemo.areaLine}
              {chamberSummary?.daysLine && chamberSummary?.timeLine
                ? ` · ${chamberSummary.daysLine} · ${chamberSummary.timeLine}`
                : ` · ${doctorDemo.hoursLine}`}
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
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl font-black text-emerald-950 ring-1 ring-white/20"
              >
                {brandInitial}
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
          <nav
            aria-label="আইনি তথ্য"
            className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/10 pt-5 text-xs md:justify-start"
          >
            {[
              { href: "/about", label: "আমাদের সম্পর্কে" },
              { href: "/contact", label: "ঠিকানা" },
              { href: "/terms", label: "শর্তাবলী" },
              { href: "/privacy", label: "প্রাইভেসি" },
              { href: "/refund", label: "রিফান্ড" },
              { href: "/delivery", label: "ডেলিভারি" },
            ].map((l) => (
              <a
                key={l.href}
                href={host ? buildApexUrl(l.href, host) : l.href}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-emerald-100/70 transition hover:text-amber-300"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
