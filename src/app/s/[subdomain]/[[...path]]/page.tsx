import type { Metadata } from "next";
import { headers } from "next/headers";
import { doctorPortrait, resolveProfile } from "@/lib/profile";
import { buildSerialUrl, buildWaHref } from "@/lib/serial";
import { getRootDomain } from "@/lib/subdomain";
import {
  fetchPageSeo,
  buildPageMetadata,
  physicianJsonLd,
  hospitalJsonLd,
  portalWebsiteJsonLd,
  withExtra,
  JsonLd,
} from "@/lib/seo";
import { DoctorSite } from "@/components/sites/DoctorSite";
import { HospitalSite } from "@/components/sites/HospitalSite";
import { SubdomainNotFound } from "@/components/sites/SubdomainNotFound";

interface SiteParams {
  subdomain: string;
  path?: string[];
}

/** Primary portal URL (canonical) for a profile prefix. */
function portalCanonical(subdomain: string): string {
  return `https://${subdomain.trim().toLowerCase()}.${getRootDomain()}/`;
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
  // Not-found portals must never index.
  if (!profile)
    return {
      title: "পেজ পাওয়া যায়নি",
      description: `“${subdomain}” নামে কোনো ডাক্তার বা হাসপাতালের পোর্টাল নেই।`,
      robots: { index: false, follow: false },
    };
  if (profile.type === "doctor") {
    const d = profile.data;
    const seo = await fetchPageSeo("DOCTOR", d.username);
    return buildPageMetadata(seo, {
      defaultTitle: `${d.name} — ${d.speciality}`,
      defaultDescription: `${d.name} (${d.degree}) — ${d.speciality}। চেম্বারের ঠিকানা, ভিজিট ফি, সময়সূচি দেখুন ও অনলাইনে ফ্রি সিরিয়াল নিন।`,
      canonical: portalCanonical(d.username),
      ogImage: doctorPortrait(d.profilePicture),
      ogType: "profile",
      favicon: doctorPortrait(d.profilePicture),
      // Individual website name for this doctor's portal.
      siteName: `${d.name} · মিস্টার ডাক্তার`,
    });
  }
  const h = profile.data;
  const seo = await fetchPageSeo("HOSPITAL", h.slug);
  return buildPageMetadata(seo, {
    defaultTitle: `${h.name} — হাসপাতাল`,
    defaultDescription: `${h.name} — ঠিকানা, বিভাগ অনুযায়ী বিশেষজ্ঞ ডাক্তার ও অনলাইন সিরিয়াল। ${h.address ?? ""}`.trim(),
    canonical: portalCanonical(h.slug),
    ogImage: "/logo-main.png",
    // Individual website name for this hospital's portal.
    siteName: `${h.name} · মিস্টার ডাক্তার`,
  });
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
    const d = profile.data;
    const host = (await headers()).get("host") ?? "";
    const seo = await fetchPageSeo("DOCTOR", d.username);
    const schemas = withExtra(seo, [
      // Individual-website schema for this doctor's portal.
      portalWebsiteJsonLd({
        name: seo?.siteName?.trim() || `${d.name} · মিস্টার ডাক্তার`,
        url: portalCanonical(d.username),
        description: d.tagline || d.bio?.slice(0, 200) || null,
      }),
      physicianJsonLd({
        name: d.name,
        degree: d.degree,
        speciality: d.speciality,
        url: portalCanonical(d.username),
        image: doctorPortrait(d.profilePicture),
        description: d.tagline || d.bio?.slice(0, 200) || null,
        rating: d.rating ?? null,
      }),
    ]);
    return (
      <>
        {schemas.map((s, i) => (
          <JsonLd key={i} data={s} />
        ))}
        <DoctorSite
          doctor={d}
          serialHref={buildSerialUrl(serialBase, d.username)}
          waNumber={waNumber}
          waHref={buildWaHref(waNumber, d.username)}
          host={host}
        />
      </>
    );
  }
  const h = profile.data;
  const host = (await headers()).get("host") ?? "";
  const seo = await fetchPageSeo("HOSPITAL", h.slug);
  const schemas = withExtra(seo, [
    // Individual-website schema for this hospital's portal.
    portalWebsiteJsonLd({
      name: seo?.siteName?.trim() || `${h.name} · মিস্টার ডাক্তার`,
      url: portalCanonical(h.slug),
      description: h.address,
    }),
    hospitalJsonLd({
      name: h.name,
      url: portalCanonical(h.slug),
      address: h.address,
      phone: h.phone,
      rating: h.rating ?? null,
    }),
  ]);
  return (
    <>
      {schemas.map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}
      <HospitalSite hospital={h} serialBase={serialBase} host={host} />
    </>
  );
}
