import type { MetadataRoute } from "next";
import { allLocationSlugs } from "@/lib/locationSlugs";
import { apexBase } from "@/lib/seo";
import { getRootDomain } from "@/lib/subdomain";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function fetchKeys(
  path: string,
  key: "username" | "slug",
): Promise<string[]> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { [k: string]: unknown }[] };
    if (!Array.isArray(json.data)) return [];
    const out = new Set<string>();
    for (const row of json.data) {
      const v = row?.[key];
      if (typeof v === "string" && v.trim()) out.add(v.trim().toLowerCase());
    }
    return [...out];
  } catch {
    return [];
  }
}

/**
 * Dynamic sitemap — AI crawlers and search engines discover every
 * public surface: home, apply/login, every thana portal, every
 * doctor + hospital portal (subdomain URLs = canonical).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apex = apexBase();
  const root = getRootDomain();
  const now = new Date();

  const [usernames, slugs] = await Promise.all([
    fetchKeys("/api/website/doctors?limit=1000", "username"),
    fetchKeys("/api/website/hospitals?limit=1000", "slug"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${apex}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${apex}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${apex}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${apex}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${apex}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${apex}/refund`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${apex}/delivery`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${apex}/apply`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${apex}/apply/doctor`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${apex}/apply/hospital`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${apex}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const locations: MetadataRoute.Sitemap = allLocationSlugs().map((slug) => ({
    url: `https://${slug}.${root}/`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const doctors: MetadataRoute.Sitemap = usernames.map((u) => ({
    url: `https://${u}.${root}/`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const hospitals: MetadataRoute.Sitemap = slugs.map((s) => ({
    url: `https://${s}.${root}/`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...locations, ...doctors, ...hospitals];
}
