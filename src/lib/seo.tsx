import type { Metadata } from "next";

/**
 * Central SEO kit — top-notch SEO + AI-search (SGE/GEO) readiness.
 *
 * Data flow (performance-isolated by design):
 * - Managers/admins write per-page SEO into the backend `seo_settings`
 *   table (never touched by appointment or other hot paths).
 * - Public pages fetch AT MOST one row per render via
 *   `GET /api/website/seo?pageType=&pageKey=`; missing row → curated
 *   auto defaults below. JSON-LD is always emitted (auto schema +
 *   any manager-supplied `extraJsonLd` blocks merged in).
 */

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export type SeoPageType = "GLOBAL" | "LOCATION" | "DOCTOR" | "HOSPITAL";

export interface PageSeo {
  title?: string | null;
  h1?: string | null;
  siteName?: string | null;
  description?: string | null;
  keywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  extraJsonLd?: unknown;
  updatedAt?: string | null;
}

/** Production apex base, e.g. https://mrdoctor.com.bd */
export function apexBase(): string {
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "mrdoctor.com.bd")
    .split(":")[0]
    .trim()
    .toLowerCase()
    .replace(/^\./, "");
  return `https://${root || "mrdoctor.com.bd"}`;
}

export function absUrl(path: string): string {
  return `${apexBase()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** One-row SEO read for a public page. Null = use auto defaults. */
export async function fetchPageSeo(
  pageType: SeoPageType,
  pageKey: string,
): Promise<PageSeo | null> {
  try {
    const q = new URLSearchParams({ pageType, pageKey: pageKey.trim().toLowerCase() });
    const res = await fetch(`${BACKEND_URL}/api/website/seo?${q.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: PageSeo | null };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export interface PageMetaInput {
  defaultTitle: string;
  defaultDescription: string;
  /** Canonical path or full URL (seo.canonicalUrl wins when set). */
  canonical: string;
  ogImage?: string;
  ogType?: "website" | "profile" | "article";
  /** Per-page favicon override (e.g. doctor portrait). */
  favicon?: string;
  /**
   * Individual-website name for this portal (OG site_name + search
   * display). Manager override (seo.siteName) wins, else this default,
   * else the master brand.
   */
  siteName?: string;
}

/**
 * Full <head> metadata: unique title, 150–160 char description,
 * robots, canonical, Open Graph + Twitter cards. Manager overrides
 * from `seo_settings` win; everything else falls back to curated input.
 */
export function buildPageMetadata(seo: PageSeo | null, input: PageMetaInput): Metadata {
  const title = seo?.title?.trim() || input.defaultTitle;
  const description = seo?.description?.trim() || input.defaultDescription;
  const canonical = seo?.canonicalUrl?.trim() || input.canonical;
  const canonicalAbs = canonical.startsWith("http") ? canonical : absUrl(canonical);
  const ogImageAbs =
    seo?.ogImage?.trim() ||
    (input.ogImage
      ? input.ogImage.startsWith("http")
        ? input.ogImage
        : absUrl(input.ogImage)
      : absUrl("/logo-main.png"));
  const keywords = seo?.keywords
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  // Each subdomain behaves like an individual website — its own name
  // in OG/search display, with the master brand as the fallback.
  const siteName = seo?.siteName?.trim() || input.siteName || "মিস্টার ডাক্তার";

  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    ...(input.favicon ? { icons: { icon: input.favicon } } : {}),
    robots: {
      index: !(seo?.robots ?? "").toLowerCase().includes("noindex"),
      follow: !(seo?.robots ?? "").toLowerCase().includes("nofollow"),
      googleBot: {
        index: !(seo?.robots ?? "").toLowerCase().includes("noindex"),
        follow: !(seo?.robots ?? "").toLowerCase().includes("nofollow"),
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: { canonical: canonicalAbs },
    openGraph: {
      type: input.ogType ?? "website",
      siteName,
      locale: "bn_BD",
      url: canonicalAbs,
      title: seo?.ogTitle?.trim() || title,
      description: seo?.ogDescription?.trim() || description,
      images: [{ url: ogImageAbs, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.ogTitle?.trim() || title,
      description: seo?.ogDescription?.trim() || description,
      images: [ogImageAbs],
    },
  };
}

/* ------------------------- JSON-LD builders ------------------------- */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${apexBase()}/#organization`,
    name: "মিস্টার ডাক্তার",
    alternateName: "MrDoctor",
    url: `${apexBase()}/`,
    logo: absUrl("/logo-main.png"),
    description:
      "ডাক্তার, হাসপাতাল ও রোগীর মিলনস্থল — অনলাইনে ফ্রি সিরিয়াল, ফ্রি চেম্বার সফটওয়্যার।",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${apexBase()}/#website`,
    url: `${apexBase()}/`,
    name: "মিস্টার ডাক্তার",
    inLanguage: "bn",
    publisher: { "@id": `${apexBase()}/#organization` },
  };
}

/**
 * Individual sub-website schema — every subdomain portal (thana,
 * doctor, hospital) is presented to search/AI engines as its own
 * website (one shared database behind the scenes).
 */
export function portalWebsiteJsonLd(input: {
  name: string;
  url: string;
  description?: string | null;
}) {
  const url = input.url.startsWith("http") ? input.url : absUrl(input.url);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}#website`,
    url,
    name: input.name,
    inLanguage: "bn",
    ...(input.description ? { description: input.description } : {}),
    publisher: { "@id": `${apexBase()}/#organization` },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : absUrl(it.url),
    })),
  };
}

export function physicianJsonLd(input: {
  name: string;
  degree?: string | null;
  speciality: string;
  url: string;
  image?: string | null;
  description?: string | null;
  rating?: { average: number; count: number } | null;
}) {
  const url = input.url.startsWith("http") ? input.url : absUrl(input.url);
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    "@id": `${url}#physician`,
    name: input.name,
    url,
    ...(input.image ? { image: input.image.startsWith("http") ? input.image : absUrl(input.image) } : {}),
    medicalSpecialty: input.speciality,
    ...(input.degree ? { credential: input.degree } : {}),
    ...(input.description ? { description: input.description } : {}),
    inLanguage: "bn",
    ...(input.rating && input.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(input.rating.average.toFixed(1)),
            reviewCount: input.rating.count,
          },
        }
      : {}),
  };
}

export function hospitalJsonLd(input: {
  name: string;
  url: string;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  rating?: { average: number; count: number } | null;
}) {
  const url = input.url.startsWith("http") ? input.url : absUrl(input.url);
  return {
    "@context": "https://schema.org",
    "@type": "Hospital",
    "@id": `${url}#hospital`,
    name: input.name,
    url,
    ...(input.address ? { address: input.address } : {}),
    ...(input.phone ? { telephone: input.phone } : {}),
    ...(input.description ? { description: input.description } : {}),
    inLanguage: "bn",
    ...(input.rating && input.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(input.rating.average.toFixed(1)),
            reviewCount: input.rating.count,
          },
        }
      : {}),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Server component — emits one <script type="application/ld+json"> per schema. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Merge manager-supplied extraJsonLd blocks (array) with auto schemas. */
export function withExtra(seo: PageSeo | null, auto: unknown[]): unknown[] {
  const extra = Array.isArray(seo?.extraJsonLd) ? (seo!.extraJsonLd as unknown[]) : [];
  return [...auto, ...extra.filter((b) => b && typeof b === "object").slice(0, 5)];
}
