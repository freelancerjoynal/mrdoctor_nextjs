import { buildPortalUrl } from "@/lib/portal";
import { doctorPortrait } from "@/lib/profile";
import type { LocationMatch } from "@/lib/locationSlugs";
import { PortalLink } from "@/components/sites/PortalLink";
import { LocationSwitcher } from "@/components/location/LocationSwitcher";

export interface LocationDoctor {
  username: string;
  name: string;
  degree: string;
  speciality: string;
  tagline?: string | null;
  profilePicture?: string | null;
}

export interface LocationHospital {
  slug: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}

/**
 * Location portal template — deliberately its own design (directory-style),
 * separate from DoctorSite / HospitalSite.
 * Served from the `app/l/[location]` folder, on URLs like
 * `nilphamari.domain.com` (middleware rewrites to `/l/nilphamari`).
 */
export function LocationSite({
  matches,
  doctors,
  hospitals,
  host,
  districtWide = false,
}: {
  matches: LocationMatch[];
  doctors: LocationDoctor[];
  hospitals: LocationHospital[];
  host: string;
  /** District-wide portal (`?scope=district`) vs single-upazila portal. */
  districtWide?: boolean;
}) {
  const primary = matches[0]!;
  const title = districtWide ? `${primary.districtBn} জেলা` : primary.thanaBn;
  const sub = districtWide
    ? `${primary.districtEn} জেলার সব উপজেলা`
    : matches.map((m) => `${m.upazilaEn} (${m.districtEn})`).join(" · ");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero */}
      <header className="bg-gradient-to-br from-teal-700 via-emerald-700 to-green-600 px-4 py-10 text-white sm:py-14">
        <div className="mx-auto max-w-5xl text-center">
          <p className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest ring-1 ring-white/25">
            📍 এলাকা পোর্টাল
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-2 text-sm font-bold text-white/80 sm:text-base">{sub}</p>
          <p className="mx-auto mt-3 max-w-xl text-xs text-white/70 sm:text-sm">
            {doctors.length} জন ডাক্তার · {hospitals.length}টি হাসপাতাল — সরাসরি সিরিয়াল নিন
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        {/* Doctors */}
        <section>
          <h2 className="text-lg font-black sm:text-xl">🩺 ডাক্তার ({doctors.length})</h2>
          {doctors.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-6 text-center text-sm font-bold text-slate-400 ring-1 ring-slate-200">
              এই এলাকায় এখনও কোনো ডাক্তার নেই। পরে আবার দেখুন।
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {doctors.map((d) => (
                <PortalLink
                  key={d.username}
                  href={buildPortalUrl(d.username, host)}
                  message="🩺 ডাক্তার দেখুন…"
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-emerald-300"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doctorPortrait(d.profilePicture)}
                    alt={d.name}
                    className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-black">{d.name}</span>
                    <span className="block truncate text-xs font-bold text-slate-500">
                      {d.degree} · {d.speciality}
                    </span>
                    {d.tagline ? (
                      <span className="block truncate text-xs text-slate-400">{d.tagline}</span>
                    ) : null}
                  </span>
                </PortalLink>
              ))}
            </div>
          )}
        </section>

        {/* Hospitals */}
        <section>
          <h2 className="text-lg font-black sm:text-xl">🏥 হাসপাতাল ({hospitals.length})</h2>
          {hospitals.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-6 text-center text-sm font-bold text-slate-400 ring-1 ring-slate-200">
              এই এলাকায় এখনও কোনো হাসপাতাল নেই। পরে আবার দেখুন।
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {hospitals.map((h) => (
                <PortalLink
                  key={h.slug}
                  href={buildPortalUrl(h.slug, host)}
                  message="🏥 হাসপাতাল দেখুন…"
                  className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-emerald-300"
                >
                  <span className="block font-black">{h.name}</span>
                  {h.address ? (
                    <span className="mt-1 block text-xs font-bold text-slate-500">📍 {h.address}</span>
                  ) : null}
                  {h.phone ? (
                    <span className="mt-0.5 block text-xs font-bold text-slate-500">📞 {h.phone}</span>
                  ) : null}
                </PortalLink>
              ))}
            </div>
          )}
        </section>

        <p className="rounded-2xl bg-white p-4 text-center text-xs font-bold text-slate-400 ring-1 ring-slate-200">
          💡 অন্য এলাকা দেখতে <a href="/" className="text-emerald-700 underline">মূল সাইটে</a> ফিরে যান
        </p>
      </main>
      <LocationSwitcher defaultOpen />
    </div>
  );
}
