import type { Metadata } from "next";
import { resolveProfile } from "@/lib/profile";
import { buildSerialUrl, buildWaHref } from "@/lib/serial";
import { DoctorSite } from "@/components/sites/DoctorSite";
import { HospitalSite } from "@/components/sites/HospitalSite";
import { doctorDemo } from "@/components/sites/doctorDemo";

interface SiteParams {
  subdomain: string;
  path?: string[];
}

/**
 * Internal target of the subdomain rewrite.
 * Public URL stays `<prefix>.domain.com/...`, middleware rewrites here as
 * `/s/<prefix>/...`. Also directly visitable on the apex for testing:
 * `domain.com/s/dr-rahman`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<SiteParams>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const profile = await resolveProfile(subdomain);
  // No database record (yet) → static demo personal site, so every
  // subdomain still feels like a complete individual website.
  if (!profile)
    return {
      title: `${doctorDemo.name} — ${doctorDemo.speciality}`,
      description: doctorDemo.heroIntro.slice(0, 150),
    };
  if (profile.type === "doctor") {
    const d = profile.data;
    return {
      title: `${d.name} — ${d.speciality}`,
      description: d.tagline || d.bio?.slice(0, 150) || `${d.name}, ${d.degree}`,
    };
  }
  const h = profile.data;
  return {
    title: `${h.name} — Hospital`,
    description: h.address || `${h.name} profile`,
  };
}

export default async function SubdomainSitePage({
  params,
}: {
  params: Promise<SiteParams>;
}) {
  const { subdomain } = await params;
  const profile = await resolveProfile(subdomain);
  // Serial deep-link base already lives in env (WA_BOT_URL=.../d/).
  // Username after `d/` is the doctor's username (subdomain on static demo).
  // All direct contact goes through the shared WhatsApp number (WA_NUMBER_GLOBAL)
  // with the doctor's own username attached — no personal numbers on site.
  const serialBase = process.env.WA_BOT_URL ?? "https://mrdoctor.mdjoynal.com/d/";
  const waNumber = (process.env.WA_NUMBER_GLOBAL ?? "15551967401").replace(/[^\d]/g, "");
  if (!profile) {
    const username = subdomain;
    return (
      <DoctorSite
        doctor={null}
        username={username}
        serialHref={buildSerialUrl(serialBase, username)}
        waNumber={waNumber}
        waHref={buildWaHref(waNumber, username)}
      />
    );
  }

  if (profile.type === "doctor") {
    const username = profile.data.username;
    return (
      <DoctorSite
        doctor={profile.data}
        username={username}
        serialHref={buildSerialUrl(serialBase, username)}
        waNumber={waNumber}
        waHref={buildWaHref(waNumber, username)}
      />
    );
  }
  return <HospitalSite hospital={profile.data} />;
}
