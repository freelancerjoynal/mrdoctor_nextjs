/**
 * Portal URL helpers.
 *
 * Doctor portals live on their own subdomain (`<username>.domain.com`).
 * From inside another portal (e.g. a hospital popup) a "view portal" link
 * must navigate to that subdomain — never render it nested under a path
 * like `domain.com/doctor/<username>` or `/s/<username>`.
 */

function stripPort(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

/**
 * Build the absolute URL of a doctor's portal from the current host.
 * - `dr-rahman.localhost:3000` → `http://<username>.localhost:3000`
 * - `hospital1.domain.com` → `https://<username>.domain.com`
 * - apex `domain.com` → `https://<username>.domain.com`
 * Falls back to `/s/<username>` only when the host shape is unknown
 * (raw IP, single label) so the link never dead-ends.
 */
export function buildDoctorPortalUrl(username: string, host?: string): string {
  const name = (username || "").trim().toLowerCase();
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

  // localhost-style: <anything>.localhost → <username>.localhost
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return `${proto}//${encodeURIComponent(name)}.localhost${port}`;
  }
  // loopback helpers: <anything>.lvh.me → <username>.lvh.me
  for (const suffix of [".lvh.me", ".nip.io", ".sslip.io"]) {
    if (hostname.endsWith(suffix)) {
      return `${proto}//${encodeURIComponent(name)}${suffix}${port}`;
    }
  }
  // raw IP or single label → cannot build a subdomain, keep internal path
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || !hostname.includes(".")) {
    return `/s/${encodeURIComponent(name)}`;
  }
  // production-style: first label is a subdomain (or www) → swap it
  const parts = hostname.split(".");
  const root =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split(":")[0].trim().toLowerCase().replace(/^\./, "") ||
    (parts.length >= 3 ? parts.slice(1).join(".") : hostname);
  return `${proto}//${encodeURIComponent(name)}.${root}${port}`;
}
