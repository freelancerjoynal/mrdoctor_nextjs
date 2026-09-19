/**
 * Shared subdomain helpers.
 *
 * URL stays on the subdomain (e.g. `dr-rahman.domain.com`), while the
 * middleware internally rewrites to a NORMAL route `/s/[subdomain]/...`.
 * The page then resolves the prefix via the backend and renders the
 * matching template (doctor vs hospital).
 *
 * Local dev needs NO hosts-file edit:
 *  - `http://dr-rahman.localhost:3000` (Chrome/Edge/Firefox resolve *.localhost → 127.0.0.1)
 *  - `http://dr-rahman.lvh.me:3000` (lvh.me resolves to 127.0.0.1)
 */

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
  "_next",
]);

function stripPort(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

/**
 * Extract the profile subdomain prefix from a Host header value.
 * Returns null for apex / reserved / IP / single-label hosts.
 *
 * @param host e.g. "dr-rahman.domain.com", "dr-rahman.localhost:3000"
 * @param rootDomain optional apex, e.g. "domain.com" (env NEXT_PUBLIC_ROOT_DOMAIN).
 *   When omitted we fall back to generic rules that already cover
 *   *.localhost, *.lvh.me and any 3+ label host.
 */
export function getSubdomain(host: string, rootDomain?: string): string | null {
  if (!host) return null;
  const hostname = stripPort(host);
  if (!hostname || hostname === "localhost") return null;
  // Never treat raw IPs as subdomains.
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return null;

  const root = (rootDomain ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "")
    .split(":")[0]
    .trim()
    .toLowerCase()
    .replace(/^\./, "");

  if (root) {
    if (hostname === root || hostname === `www.${root}`) return null;
    if (hostname.endsWith(`.${root}`)) {
      const sub = hostname.slice(0, hostname.length - root.length - 1);
      // Only single-level prefixes (dr-rahman.domain.com). Deeper levels ignored.
      if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null;
      return sub;
    }
    return null;
  }

  // Generic fallback (dev-friendly, no env needed):
  // localhost-style: <sub>.localhost
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.slice(0, -".localhost".length);
    if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }
  // lvh.me / nip.io style loopback helpers: <sub>.lvh.me
  const loopbackSuffixes = [".lvh.me", ".nip.io", ".sslip.io"];
  for (const suffix of loopbackSuffixes) {
    if (hostname.endsWith(suffix)) {
      const sub = hostname.slice(0, -suffix.length);
      if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null;
      return sub;
    }
  }

  // Any other 3+ label host: first label is the candidate
  // (covers production domain.com before env is configured).
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const sub = parts[0];
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }
  return null;
}
