import type { MetadataRoute } from "next";
import { apexBase } from "@/lib/seo";

/** Crawlers welcome on public portals; app internals stay out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api/", "/login", "/verify-otp", "/forgot-password", "/reset-password"],
      },
    ],
    sitemap: `${apexBase()}/sitemap.xml`,
  };
}
