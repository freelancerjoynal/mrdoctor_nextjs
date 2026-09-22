 "use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PublicBlog, PublicHospital, PublicReview } from "@/lib/profile";
import { toBn } from "@/lib/bn";
import { buildApexUrl } from "@/lib/portal";
import { PortalHeader } from "@/components/sites/PortalHeader";
import { BlogSection } from "@/components/blog";
import { ReviewSection } from "@/components/reviews";
import { Reveal } from "@/components/motion";
import { DoctorDirectory, type HospitalDoctorEntry } from "@/components/hospital";

/**
 * Institutional portal template for a hospital — served at `<slug>.domain.com`.
 * Deliberately different system from the doctor template: slate/blue,
 * squared cards with accent borders, department-tabbed doctor directory
 * (no chamber listings), quick-view popup per doctor with direct booking.
 */
export function HospitalSite({
  hospital,
  serialBase,
  host,
}: {
  hospital: PublicHospital;
  serialBase: string;
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
  const seen = new Map<string, HospitalDoctorEntry>();
  for (const c of hospital.chambers) {
    if (!c.doctor || seen.has(c.doctor.username)) continue;
    seen.set(c.doctor.username, {
      username: c.doctor.username,
      name: c.doctor.name,
      degree: c.doctor.degree,
      speciality: c.doctor.speciality,
      tagline: c.doctor.tagline,
      profilePicture: c.doctor.profilePicture,
      gender: c.doctor.gender,
      chamberName: c.chamberName,
      newPatientFee: c.newPatientFee,
      oldPatientFee: c.oldPatientFee,
    });
  }
  const doctorEntries = [...seen.values()];
  const departmentCount = new Set(doctorEntries.map((d) => d.speciality)).size;

  const hospitalReviews: PublicReview[] = Array.isArray(hospital.reviews) ? hospital.reviews : [];
  const hospitalRating = hospital.rating ?? null;

  const blogPosts: PublicBlog[] = Array.isArray(hospital.blogs)
    ? hospital.blogs.map((b) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        excerpt: b.excerpt,
        content: b.content,
        coverImage: b.coverImage,
        coverGradient: b.coverGradient || "from-sky-500 to-blue-700",
        coverSymbol: b.coverSymbol || "⚕",
        category: b.category || "স্বাস্থ্য টিপস",
        tags: Array.isArray(b.tags) ? b.tags : [],
        authorName: b.authorName,
        publishedAt: b.publishedAt,
        views: b.views ?? 0,
      }))
    : [];

  const stats = [
    { value: toBn(doctorEntries.length), label: "বিশেষজ্ঞ চিকিৎসক" },
    { value: toBn(departmentCount), label: "বিভাগ" },
    {
      value: hospitalRating && hospitalRating.count > 0 ? toBn(hospitalRating.average.toFixed(1)) : "—",
      label: "গড় রেটিং",
    },
    {
      value: hospitalRating ? toBn(hospitalRating.count) : "০",
      label: "রোগীর মতামত",
    },
  ];

  const nav = [
    { href: "#doctors", label: "চিকিৎসক" },
    ...(blogPosts.length > 0 ? [{ href: "#blog", label: "ব্লগ" }] : []),
    { href: "#testimonials", label: "মতামত" },
    { href: "#contact", label: "যোগাযোগ" },
  ];

  // Header area pill from the first chamber (hospital has no own location
  // columns — location always comes through chambers).
  const firstChamber = hospital.chambers[0];
  const areaPill = firstChamber
    ? [firstChamber.thana, firstChamber.district].filter(Boolean).join(", ")
    : null;

  return (
    <div className="font-hind min-h-screen bg-slate-100 text-slate-800">
      {/* ---------- Utility strip ---------- */}
      <div className="bg-slate-900 text-xs text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-2">
          <p className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            জরুরি বিভাগ ২৪ ঘণ্টা খোলা
          </p>
          <div className="flex items-center gap-4">
            {hospital.phone && <span>📞 {hospital.phone}</span>}
            {hospital.address && <span className="hidden sm:inline">📍 {hospital.address}</span>}
          </div>
        </div>
      </div>

      {/* ---------- Header (unified portal header: logo left, area pill first) ---------- */}
      <PortalHeader
        logoHref={host ? buildApexUrl("/", host) : "#top"}
        logoAriaLabel="মিস্টার ডাক্তার — মূল সাইট"
        identity={
          <span className="flex min-w-0 items-center gap-2 border-l border-slate-200 pl-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-lg font-bold text-white">
              {hospital.name.trim()[0] || "হ"}
            </span>
            <span className="hidden min-w-0 leading-tight min-[480px]:block">
              <span className="block truncate text-sm font-bold text-slate-900">{hospital.name}</span>
              <span className="block truncate text-[11px] text-slate-500">
                {hospital.establishedYear ? `প্রতিষ্ঠিত ${toBn(hospital.establishedYear)}` : "হাসপাতাল পোর্টাল"}
              </span>
            </span>
          </span>
        }
        pill={
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-800 ring-1 ring-sky-200 min-[420px]:inline-flex">
            📍 {areaPill || "হাসপাতাল"}
          </span>
        }
        nav={nav}
        navClassName="hidden lg:flex"
        actions={
          <>
            <button
              onClick={() => scrollToSection("#doctors")}
              className="shrink-0 rounded-full bg-blue-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              🩺 ডাক্তার দেখুন
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="মেনু"
              aria-expanded={menuOpen}
              className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-slate-800 transition active:scale-95 lg:hidden"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </>
        }
        mobilePanel={
          <AnimatePresence initial={false}>
            {menuOpen && (
              <motion.nav
                className="overflow-hidden border-t border-slate-200 bg-white px-5 lg:hidden"
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
                      className="block w-full border-b border-slate-50 py-2.5 text-left font-medium text-slate-700 last:border-0 hover:text-blue-700"
                    >
                      {n.label}
                    </button>
                  ))}
                  <button
                    onClick={() => scrollToSection("#doctors")}
                    className="mt-2 block w-full rounded-full bg-blue-700 px-5 py-2.5 text-center text-sm font-bold text-white"
                  >
                    🩺 ডাক্তার রিজার্ভ করুন
                  </button>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        }
      />

      {/* ---------- Hero ---------- */}
      <section id="top" className="relative scroll-mt-24 overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(#c7d2fe 1.2px, transparent 1.2px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-14 md:py-20">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-sky-200 ring-1 ring-white/20">
              ✓ যাচাইকৃত হাসপাতাল · @{hospital.slug}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">{hospital.name}</h1>
            {hospital.address && <p className="mt-3 max-w-2xl text-lg text-blue-100">{hospital.address}</p>}
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl bg-white/10 px-3 py-4 text-center ring-1 ring-white/15 backdrop-blur">
                  <p className="text-2xl font-bold text-white md:text-3xl">{s.value}</p>
                  <p className="mt-1 text-xs text-blue-100 md:text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#doctors"
                className="rounded-full bg-white px-7 py-3.5 font-bold text-blue-900 shadow-lg hover:bg-blue-50"
              >
                চিকিৎসক দেখুন
              </a>
              <a
                href="#testimonials"
                className="rounded-full border border-white/40 px-7 py-3.5 font-semibold text-white hover:bg-white/10"
              >
                মতামত দিন
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Doctors ---------- */}
      <section id="doctors" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-14 md:py-16">
        <Reveal>
          <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            <span className="inline-block h-1 w-10 rounded bg-blue-600" />
            আমাদের চিকিৎসকগণ
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">বিভাগ অনুযায়ী খুঁজুন</h2>
            <p className="font-semibold text-slate-500">মোট {toBn(doctorEntries.length)} জন বিশেষজ্ঞ</p>
          </div>
        </Reveal>
        <div className="mt-8">
          {doctorEntries.length > 0 ? (
            <DoctorDirectory doctors={doctorEntries} serialBase={serialBase} />
          ) : (
            <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
              এখনো কোনো ডাক্তার যোগ করা হয়নি।
            </p>
          )}
        </div>
      </section>

      {/* ---------- Blogs ---------- */}
      {blogPosts.length > 0 && (
        <div className="bg-white">
          <BlogSection posts={blogPosts} eyebrow="হাসপাতাল ব্লগ" heading="স্বাস্থ্য বার্তা ও ঘোষণা" />
        </div>
      )}

      {/* ---------- Reviews ---------- */}
      <div className="mx-auto max-w-6xl px-5 py-14 md:py-16">
        <Reveal>
          <ReviewSection
            target={{ type: "hospital", slug: hospital.slug }}
            reviews={hospitalReviews}
            rating={hospitalRating}
            eyebrow="রোগীদের মতামত"
            heading="আমাদের সেবা সম্পর্কে"
          />
        </Reveal>
      </div>

      {/* ---------- Contact ---------- */}
      <section id="contact" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-14 md:pb-16">
        <Reveal>
          <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-blue-700 p-7 text-white shadow-lg">
            <p className="text-3xl">📞</p>
            <p className="mt-3 font-bold">ফোনে যোগাযোগ</p>
            {hospital.phone ? (
              <a href={`tel:${hospital.phone.replace(/[^+\d]/g, "")}`} className="mt-1 block text-lg font-bold text-white hover:underline">
                {hospital.phone}
              </a>
            ) : (
              <p className="mt-1 text-blue-100">শীঘ্রই আসছে</p>
            )}
          </div>
          <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
            <p className="text-3xl">📍</p>
            <p className="mt-3 font-bold text-slate-900">ঠিকানা</p>
            <p className="mt-1 text-sm text-slate-600">{hospital.address || "ঠিকানা শীঘ্রই যোগ করা হবে।"}</p>
          </div>
          <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
            <p className="text-3xl">🏥</p>
            <p className="mt-3 font-bold text-slate-900">জরুরি বিভাগ</p>
            <p className="mt-1 text-sm text-slate-600">দিন-রাত ২৪ ঘণ্টা জরুরি সেবা চালু আছে।</p>
          </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-2xl font-bold text-white">
                {hospital.name.trim()[0] || "হ"}
              </span>
              <div className="leading-tight">
                <p className="font-bold text-white">{hospital.name}</p>
                <p className="text-xs text-slate-400">সবার জন্য মানসম্মত স্বাস্থ্যসেবা</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              © {toBn(new Date().getFullYear())} {hospital.name} · সর্বস্বত্ব সংরক্ষিত
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
                className="font-semibold text-slate-400 transition hover:text-white"
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
