import type { Metadata } from "next";
import { headers } from "next/headers";
import { doctorPortrait, resolveProfile } from "@/lib/profile";
import { buildSerialUrl, buildWaHref } from "@/lib/serial";
import { DoctorSite } from "@/components/sites/DoctorSite";
import { HospitalSite } from "@/components/sites/HospitalSite";
import { SubdomainNotFound } from "@/components/sites/SubdomainNotFound";

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
  // No database record → "page not available" (never a demo stand-in —
  // unknown subdomains must not impersonate a real-looking doctor).
  if (!profile)
    return {
      title: "পেজ পাওয়া যায়নি | মিস্টার ডাক্তার",
      description: `“${subdomain}” নামে কোনো ডাক্তার বা হাসপাতালের পোর্টাল নেই।`,
    };
  if (profile.type === "doctor") {
    const d = profile.data;
    return {
      title: `${d.name} — ${d.speciality}`,
      description: d.tagline || d.bio?.slice(0, 150) || `${d.name}, ${d.degree}`,
      icons: { icon: doctorPortrait(d.profilePicture) },
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
  // Canonical: https://mrdoctor.com.bd/d/<username> (Next `/d/[username]`
  // route → WhatsApp). Username after `d/` is the doctor's username
  // (subdomain on static demo); hospitals use their slug.
  // All direct contact goes through the shared WhatsApp number (WA_NUMBER_GLOBAL)
  // with the doctor's own username attached — no personal numbers on site.
  const serialBase = process.env.WA_BOT_URL ?? "https://mrdoctor.com.bd/d/";
  const waNumber = (process.env.WA_NUMBER_GLOBAL ?? "15551967401").replace(/[^\d]/g, "");
  if (!profile) {
    const host = (await headers()).get("host") ?? "";
    return <SubdomainNotFound subdomain={subdomain} host={host} />;
  }

  if (profile.type === "doctor") {
    const username = profile.data.username;
    const host = (await headers()).get("host") ?? "";
    return (
      <DoctorSite
        doctor={profile.data}
        serialHref={buildSerialUrl(serialBase, username)}
        waNumber={waNumber}
        waHref={buildWaHref(waNumber, username)}
        host={host}
      />
    );
  }
  const host = (await headers()).get("host") ?? "";
  return <HospitalSite hospital={profile.data} serialBase={serialBase} host={host} />;
}
