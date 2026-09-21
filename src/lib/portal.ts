/**
 * Portal URL helpers.
 *
 * Doctor portals live on their own subdomain (`<username>.mrdoctor.com.bd`).
 * Local dev uses ONLY `*.localhost` (e.g. `dr-rahman.localhost:3000` → apex `localhost:3000`).
 * From inside another portal (e.g. a hospital popup) a "view portal" link
 * must navigate to that subdomain — never render it nested under a path
 * like `mrdoctor.com.bd/doctor/<username>` or `/s/<username>`.
 */

import { DEFAULT_ROOT_DOMAIN, DEV_SUFFIXES } from "./subdomain";

function stripPort(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

function effectiveRoot(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "")
    .split(":")[0]
    .trim()
    .toLowerCase()
    .replace(/^\./, "");
  return fromEnv || DEFAULT_ROOT_DOMAIN;
}

/**
 * Build the absolute URL of a public portal (doctor `<username>.mrdoctor.com.bd`
 * or hospital `<slug>.mrdoctor.com.bd`) from the current host.
 * - `localhost:3000` (apex) → `http://<sub>.localhost:3000`
 * - `dr-rahman.localhost:3000` → `http://<sub>.localhost:3000`
 * - `mrdoctor.com.bd` (apex) → `https://<sub>.mrdoctor.com.bd`
 * - `<anything>.mrdoctor.com.bd` → `https://<sub>.mrdoctor.com.bd`
 * Falls back to `/s/<sub>` only when the host shape is unknown
 * (raw IP, tunnel URL, single label) so the link never dead-ends.
 */
export function buildPortalUrl(subdomain: string, host?: string): string {
  const name = (subdomain || "").trim().toLowerCase();
  if (!name) return "/";
  const current =
    host ??
    (typeof window !== "undefined" ? window.location.host : "");
  if (!current) return `/s/${encodeURIComponent(name)}`;

  const proto =
    typeof window !== "undefined" ? window.location.protocol : "https:";
  const portMatch = current.match(/:(\d+)$/);
  const port = portMatch ? `:${portMatch[1]}` : "";
  const hostname = stripPort(current);
  const root = effectiveRoot();
  const isLoopback =
    hostname === "localhost" || DEV_SUFFIXES.some((s) => hostname.endsWith(s));

  // Server-rendered (no window): dev loopback is plain http, production https.
  const serverProto = isLoopback ? "http:" : "https:";
  const base = typeof window !== "undefined" ? proto : serverProto;

  // Local dev ONLY via *.localhost: <anything>.localhost → <username>.localhost
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return `${base}//${encodeURIComponent(name)}.localhost${port}`;
  }
  // loopback helpers (lvh.me etc, rarely used): <anything>.lvh.me → <username>.lvh.me
  for (const suffix of DEV_SUFFIXES.slice(1)) {
    if (hostname === suffix.slice(1) || hostname.endsWith(suffix)) {
      return `${base}//${encodeURIComponent(name)}${suffix}${port}`;
    }
  }
  // Production apex first: mrdoctor.com.bd → <sub>.mrdoctor.com.bd
  if (hostname === root || hostname === `www.${root}` || hostname.endsWith(`.${root}`)) {
    return `${base}//${encodeURIComponent(name)}.${root}${port}`;
  }
  // raw IP / tunnel URL / single label → cannot build a subdomain, keep internal path
  return `/s/${encodeURIComponent(name)}`;
}

/** Doctor-specific alias — same subdomain mechanics as {@link buildPortalUrl}. */
export function buildDoctorPortalUrl(username: string, host?: string): string {
  return buildPortalUrl(username, host);
}

/**
 * Build an apex (main-site) URL from any host, e.g. for Apply/Login links
 * inside a subdomain portal. Never hardcoded — derived from the current host:
 * - `nilphamari.localhost:3000` + `/apply` → `http://localhost:3000/apply`
 * - `nilphamari.mrdoctor.com.bd` + `/apply` → `https://mrdoctor.com.bd/apply`
 * - apex hosts pass through unchanged.
 * - unknown hosts (tunnel URLs, IPs) stay on the same host — only the path changes.
 */
export function buildApexUrl(path: string, host?: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const current =
    host ?? (typeof window !== "undefined" ? window.location.host : "");
  if (!current) return cleanPath;

  const portMatch = current.match(/:(\d+)$/);
  const port = portMatch ? `:${portMatch[1]}` : "";
  const hostname = stripPort(current);
  const root = effectiveRoot();
  const isLoopback =
    hostname === "localhost" || DEV_SUFFIXES.some((s) => hostname.endsWith(s));
  const proto =
    typeof window !== "undefined"
      ? window.location.protocol
      : isLoopback
        ? "http:"
        : "https:";

  // Local dev apex: *.localhost → localhost
  if (hostname === "localhost") return `${proto}//localhost${port}${cleanPath}`;
  if (hostname.endsWith(".localhost")) return `${proto}//localhost${port}${cleanPath}`;
  for (const suffix of DEV_SUFFIXES.slice(1)) {
    const base = suffix.slice(1); // "lvh.me"
    if (hostname === base) return `${proto}//${base}${port}${cleanPath}`;
    if (hostname.endsWith(suffix)) {
      // <sub>.lvh.me → lvh.me (loopback root)
      return `${proto}//${base}${port}${cleanPath}`;
    }
  }

  // Production apex first.
  if (hostname === root || hostname === `www.${root}`) {
    return `${proto}//${root}${port}${cleanPath}`;
  }
  if (hostname.endsWith(`.${root}`)) {
    return `${proto}//${root}${port}${cleanPath}`;
  }

  // Unknown host (tunnel URL, IP): the tunnel URL IS the main site — keep host.
  return `${proto}//${hostname}${port}${cleanPath}`;
}
