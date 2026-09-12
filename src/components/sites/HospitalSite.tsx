import type { PublicHospital, PublicReview } from "@/lib/profile";
import { ReviewSection } from "@/components/reviews";

/** Hospital profile template — rendered at `<slug>.domain.com`. */
export function HospitalSite({ hospital }: { hospital: PublicHospital }) {
  const doctors = hospital.chambers
    .map((c) => c.doctor)
    .filter((d): d is NonNullable<typeof d> => Boolean(d));
  const uniqueDoctors = [...new Map(doctors.map((d) => [d.username, d])).values()];
  const hospitalReviews: PublicReview[] = Array.isArray(hospital.reviews) ? hospital.reviews : [];

  return (
    <div className="min-h-screen bg-indigo-50 text-slate-900">
      {/* Hospital hero — deliberately different look from doctor template */}
      <header className="bg-indigo-800 text-white">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-sm uppercase tracking-widest text-indigo-300">
            হাসপাতাল · @{hospital.slug}
          </p>
          <h1 className="mt-2 text-4xl font-bold">{hospital.name}</h1>
          {hospital.address && <p className="mt-2 text-indigo-100">{hospital.address}</p>}
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {hospital.phone && (
              <span className="rounded-full bg-white/15 px-3 py-1">📞 {hospital.phone}</span>
            )}
            {hospital.establishedYear != null && (
              <span className="rounded-full bg-white/15 px-3 py-1">
                প্রতিষ্ঠিত: {hospital.establishedYear}
              </span>
            )}
            <span className="rounded-full bg-white/15 px-3 py-1">
              {uniqueDoctors.length} জন ডাক্তার
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">বিভাগ / চেম্বার</h2>
          {hospital.chambers.length === 0 ? (
            <p className="mt-2 text-slate-500">এখনো কোনো চেম্বার যোগ করা হয়নি।</p>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {hospital.chambers.map((c) => (
                <li key={c.id} className="rounded-xl border border-indigo-100 p-4">
                  <p className="font-medium">{c.chamberName || c.addressLine}</p>
                  <p className="text-sm text-slate-600">
                    {c.addressLine}, {c.thana}, {c.district}
                  </p>
                  {c.doctor && (
                    <p className="mt-1 text-sm text-indigo-700">
                      {c.doctor.name} · {c.doctor.speciality}
                    </p>
                  )}
                  <p className="mt-1 text-sm">
                    নতুন: ৳{c.newPatientFee} · পুরনো: ৳{c.oldPatientFee}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {uniqueDoctors.length > 0 && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">আমাদের ডাক্তারগণ</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {uniqueDoctors.map((d) => (
                <li key={d.username} className="rounded-xl bg-indigo-50 px-4 py-3">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-sm text-slate-600">
                    {d.degree} · {d.speciality}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ReviewSection
          target={{ type: "hospital", slug: hospital.slug }}
          reviews={hospitalReviews}
          rating={hospital.rating ?? null}
          eyebrow="রোগীদের মতামত"
          heading="আমাদের সেবা সম্পর্কে"
        />
      </main>
    </div>
  );
}
