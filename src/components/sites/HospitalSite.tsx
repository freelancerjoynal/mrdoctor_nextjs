import type { PublicBlog, PublicHospital, PublicReview } from "@/lib/profile";
import { toBn } from "@/lib/bn";
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
}: {
  hospital: PublicHospital;
  serialBase: string;
}) {
  // One entry per doctor (first chamber's fee info), chambers themselves hidden.
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
    { href: "#blog", label: "ব্লগ" },
    { href: "#testimonials", label: "মতামত" },
    { href: "#contact", label: "যোগাযোগ" },
  ];

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

      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <a href="#top" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-2xl font-bold text-white">
              {hospital.name.trim()[0] || "হ"}
            </span>
            <span className="leading-tight">
              <span className="block font-bold text-slate-900">{hospital.name}</span>
              <span className="block text-xs text-slate-500">
                {hospital.establishedYear ? `প্রতিষ্ঠিত ${toBn(hospital.establishedYear)} · ` : ""}
                {hospital.address || "হাসপাতাল পোর্টাল"}
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-5 text-[15px] font-medium md:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="text-slate-600 hover:text-blue-700">
                {n.label}
              </a>
            ))}
          </nav>
          <a
            href="#doctors"
            className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-800"
          >
            🩺 ডাক্তার রিজার্ভ করুন
          </a>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section id="top" className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white">
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
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-center md:flex-row md:text-left">
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
      </footer>
    </div>
  );
}
