/**
 * Shared subdomain helpers.
 *
 * URL stays on the subdomain (e.g. `dr-rahman.mrdoctor.com.bd`), while the
 * middleware internally rewrites to a NORMAL route `/s/[subdomain]/...`.
 * The page then resolves the prefix via the backend and renders the
 * matching template (doctor vs hospital).
 *
 * Local dev needs NO hosts-file edit:
 *  - `http://dr-rahman.localhost:3000` (Chrome/Edge/Firefox resolve *.localhost → 127.0.0.1)
 *  - `http://dr-rahman.lvh.me:3000` (lvh.me resolves to 127.0.0.1)
 */

/** Main production apex. First priority — never treated as a subdomain. */
export const DEFAULT_ROOT_DOMAIN = "mrdoctor.com.bd";

/** Local-only dev suffixes. `*.localhost` needs no hosts-file edit. */
export const DEV_SUFFIXES = [".localhost", ".lvh.me", ".nip.io", ".sslip.io"] as const;

/** Effective root domain: env wins, production apex is the fallback. */
export function getRootDomain(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "")
    .split(":")[0]
    .trim()
    .toLowerCase()
    .replace(/^\./, "");
  return fromEnv || DEFAULT_ROOT_DOMAIN;
}
/** Subdomains that belong to the platform itself — never treated as a profile. */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "login",
  "apply",
  "verify-otp",
  "forgot-password",
  "reset-password",
  "static",
  "assets",
  "cdn",
  "mail",
  "ftp",
  "blog",
  "support",
  "help",
  "status",
  "s", // internal rewrite prefix (/s/[subdomain]) — must not loop
  "l", // internal rewrite prefix (/l/[location]) — must not loop
  "_next",
]);

function stripPort(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

/**
 * Extract the profile subdomain prefix from a Host header value.
 * Returns null for apex / reserved / IP / single-label hosts.
 *
 * Priority:
 *  1. `mrdoctor.com.bd` (or NEXT_PUBLIC_ROOT_DOMAIN) is the apex — never a subdomain.
 *     `<sub>.mrdoctor.com.bd` → `<sub>` (single level only).
 *  2. Local dev only: `<sub>.localhost`, `<sub>.lvh.me`, etc. → `<sub>`.
 *  3. Everything else (IPs, tunnel URLs, bare domains) → null (main site).
 *
 * @param host e.g. "dr-rahman.mrdoctor.com.bd", "dr-rahman.localhost:3000"
 * @param rootDomain optional apex override (defaults to env or mrdoctor.com.bd).
 */
export function getSubdomain(host: string, rootDomain?: string): string | null {
  if (!host) return null;
  const hostname = stripPort(host);
  if (!hostname || hostname === "localhost") return null;
  // Never treat raw IPs as subdomains.
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return null;

  const root = ((rootDomain ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "")
    .split(":")[0]
    .trim()
    .toLowerCase()
    .replace(/^\./, "") || DEFAULT_ROOT_DOMAIN).toLowerCase();

  // ---- 1. Production apex first ----
  if (hostname === root || hostname === `www.${root}`) return null;
  if (hostname.endsWith(`.${root}`)) {
    const sub = hostname.slice(0, hostname.length - root.length - 1);
    // Only single-level prefixes (dr-rahman.mrdoctor.com.bd). Deeper levels ignored.
    if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  // ---- 2. Local dev only ----
  // localhost-style: <sub>.localhost
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.slice(0, -".localhost".length);
    if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }
  // lvh.me / nip.io style loopback helpers: <sub>.lvh.me
  for (const suffix of DEV_SUFFIXES.slice(1)) {
    if (hostname.endsWith(suffix)) {
      const sub = hostname.slice(0, -suffix.length);
      if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null;
      return sub;
    }
  }

  // ---- 3. Unknown hosts are the main site, never a subdomain ----
  // (Cloudflare Tunnel trycloudflare.com URLs, other domains, bare lvh.me, etc.)
  // Guessing `parts[0]` here is what broke `mrdoctor.com.bd` (apex is 3 labels
  // with the .com.bd public suffix) — so do NOT guess.
  return null;
}
