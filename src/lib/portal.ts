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
 * Build the absolute URL of a public portal (doctor `<username>.domain.com`
 * or hospital `<slug>.domain.com`) from the current host.
 * - `dr-rahman.localhost:3000` → `http://<sub>.localhost:3000`
 * - `hospital1.domain.com` → `https://<sub>.domain.com`
 * - apex `domain.com` → `https://<sub>.domain.com`
 * Falls back to `/s/<sub>` only when the host shape is unknown
 * (raw IP, single label) so the link never dead-ends.
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
  const loopbackSuffixes = [".localhost", ".lvh.me", ".nip.io", ".sslip.io"];
  const isLoopback =
    hostname === "localhost" || loopbackSuffixes.some((s) => hostname.endsWith(s));

  // Server-rendered (no window): dev loopback is plain http, production https.
  const serverProto = isLoopback ? "http:" : "https:";
  const base = typeof window !== "undefined" ? proto : serverProto;

  // localhost-style: <anything>.localhost → <username>.localhost
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return `${base}//${encodeURIComponent(name)}.localhost${port}`;
  }
  // loopback helpers: <anything>.lvh.me → <username>.lvh.me
  for (const suffix of [".lvh.me", ".nip.io", ".sslip.io"]) {
    if (hostname.endsWith(suffix)) {
      return `${base}//${encodeURIComponent(name)}${suffix}${port}`;
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
  return `${base}//${encodeURIComponent(name)}.${root}${port}`;
}

/** Doctor-specific alias — same subdomain mechanics as {@link buildPortalUrl}. */
export function buildDoctorPortalUrl(username: string, host?: string): string {
  return buildPortalUrl(username, host);
}

/**
 * Build an apex (main-site) URL from any host, e.g. for Apply/Login links
 * inside a subdomain portal. Never hardcoded — derived from the current host:
 * - `nilphamari.localhost:3000` + `/apply` → `http://localhost:3000/apply`
 * - `nilphamari.mrdoctor.com` + `/apply` → `https://mrdoctor.com/apply`
 * - apex hosts pass through unchanged.
 */
export function buildApexUrl(path: string, host?: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const current =
    host ?? (typeof window !== "undefined" ? window.location.host : "");
  if (!current) return cleanPath;

  const portMatch = current.match(/:(\d+)$/);
  const port = portMatch ? `:${portMatch[1]}` : "";
  const hostname = stripPort(current);
  const loopbackSuffixes = [".localhost", ".lvh.me", ".nip.io", ".sslip.io"];
  const isLoopback =
    hostname === "localhost" || loopbackSuffixes.some((s) => hostname.endsWith(s));
  const proto =
    typeof window !== "undefined"
      ? window.location.protocol
      : isLoopback
        ? "http:"
        : "https:";

  let apex = hostname;
  const firstDot = hostname.indexOf(".");
  if (firstDot > 0) {
    const configured = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split(":")[0]
      .trim()
      .toLowerCase()
      .replace(/^\./, "");
    if (configured && hostname.endsWith(`.${configured}`)) {
      apex = configured;
    } else if (hostname !== "localhost") {
      // Drop the subdomain label (one level: <sub>.apex).
      apex = hostname.slice(firstDot + 1);
    }
  }
  return `${proto}//${apex}${port}${cleanPath}`;
}
