import { NextResponse, type NextRequest } from "next/server";
import { getSubdomain } from "@/lib/subdomain";
import { LOCATION_SLUG_SET } from "@/lib/locationSlugs";

const AUTH_PAGES = ["/login", "/apply", "/apply/doctor", "/apply/hospital", "/verify-otp", "/forgot-password", "/reset-password"];
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
// Refresh a bit before real expiry so slow requests don't die mid-flight.
const EXP_SKEW_MS = 30_000;

// যে সাবডোমেইনগুলো ওয়াইল্ডকার্ডের ভেতরে যাবে না (এখানে আপনার প্রয়োজনমতো নতুন সাবডোমেইন যোগ করতে পারবেন)
const EXCLUDED_SUBDOMAINS = [
  "api-backend",
  "control-panel",
  "api",
  "coolify",
];

/** Edge-safe JWT role read (decode only — verification happens on the backend). */
function getRoleClaim(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const json = JSON.parse(atob(b64)) as { role?: unknown };
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}
/** Edge-safe JWT expiry read (decode only — verification happens on the backend). */
function getExpMs(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const json = JSON.parse(atob(b64)) as { exp?: unknown };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Try the backend refresh endpoint with the request's cookies.
 * Returns the fresh access token, "invalid" when the refresh token is
 * rejected, or "unreachable" when the backend can't be contacted
 * (restarting deploys must never log the user out).
 */
async function tryBackendRefresh(
  cookieHeader: string,
): Promise<{ status: "ok"; accessToken: string } | { status: "invalid" } | { status: "unreachable" }> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({}),
      cache: "no-store",
    });
  } catch {
    return { status: "unreachable" };
  }
  if (!res.ok) return { status: "invalid" };
  try {
    const data = (await res.json()) as { accessToken?: unknown };
    if (typeof data.accessToken !== "string" || !data.accessToken) return { status: "invalid" };
    return { status: "ok", accessToken: data.accessToken };
  } catch {
    return { status: "invalid" };
  }
}

export function middleware(req: NextRequest) {
  return handle(req).catch(() => NextResponse.next());
}

async function handle(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ---- Subdomain → normal-route rewrite ----
  // Location slugs win over profile prefixes (`pirganj.domain.com` is the
  // Pirganj area portal, even if a username ever collides with it).
  // - `<location-slug>.domain.com/...` → `/l/<slug>/...` (area portal)
  // - `<username>.domain.com/...` → `/s/<username>/...` (doctor/hospital)
  // URL stays on the subdomain in both cases.
  // Skip API, Next internals and the internal prefixes themselves (no loops).
  // Public sites never need auth handling.
  // Legal/company pages ALWAYS serve from the apex route, even on a
  // subdomain (booking-form policy links must open the real page,
  // never a rewritten portal).
  const APEX_ONLY_PATHS = [
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/refund",
    "/delivery",
  ];
  const isApexOnly = APEX_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  
  if (
    !isApexOnly &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/s/") &&
    !pathname.startsWith("/l/")
  ) {
    const host = req.headers.get("host") ?? "";
    const subdomain = getSubdomain(host);
    
    if (subdomain) {
      // যদি সাবডোমেইনটি এক্সক্লুডেড লিস্টে থাকে, তবে ওয়াইল্ডকার্ড রিরাইট বাইপাস করবে
      if (EXCLUDED_SUBDOMAINS.includes(subdomain)) {
        return NextResponse.next();
      }

      const url = req.nextUrl.clone();
      if (LOCATION_SLUG_SET.has(subdomain)) {
        url.pathname = `/l/${subdomain}${pathname === "/" ? "" : pathname}`;
        const res = NextResponse.rewrite(url);
        res.headers.set("x-location", subdomain);
        return res;
      }
      url.pathname = `/s/${subdomain}${pathname === "/" ? "" : pathname}`;
      const res = NextResponse.rewrite(url);
      res.headers.set("x-subdomain", subdomain);
      return res;
    }
  }

  // NOTE: check truthy VALUES, not mere presence — a cleared cookie can
  // linger as an empty string, and that must count as logged out.
  const hadAccess = !!req.cookies.get("accessToken")?.value;
  const hadRefresh = !!req.cookies.get("refreshToken")?.value;
  let access = hadAccess ? req.cookies.get("accessToken")!.value : undefined;
  let refresh = hadRefresh ? req.cookies.get("refreshToken")!.value : undefined;

  const exp = access ? getExpMs(access) : null;
  let accessUsable = !!access && exp != null && exp > Date.now() + EXP_SKEW_MS;

  // Stale access + live refresh token → silent re-login (one backend call).
  // Dead refresh token → drop both cookies so the user lands on login
  // instead of bouncing between /dashboard and /login forever.
  // Backend unreachable (code changes / restarts) → touch nothing.
  let refreshedToken: string | null = null;
  if (!accessUsable && refresh) {
    const result = await tryBackendRefresh(req.headers.get("cookie") ?? "");
    if (result.status === "ok") {
      access = result.accessToken;
      accessUsable = true;
      refreshedToken = result.accessToken;
    } else if (result.status === "invalid") {
      access = undefined;
      refresh = undefined;
    }
  }
  // Expired access with no refresh token is dead weight — drop it so it
  // can never pass a presence check and cause a redirect loop.
  if (!accessUsable) access = undefined;

  const loggedIn = accessUsable;

  const finish = (res: NextResponse) => {
    if (refreshedToken) {
      res.cookies.set("accessToken", refreshedToken, {
        httpOnly: true,
        path: "/",
        maxAge: 15 * 60,
        sameSite: "lax",
      });
    }
    // Only clear cookies the request actually carried: anonymous traffic
    // must pass through untouched, stale ones get dropped so they can
    // never pass a presence check and cause a redirect loop.
    if (!refresh && hadRefresh) res.cookies.delete("refreshToken");
    if (!access && hadAccess) res.cookies.delete("accessToken");
    return res;
  };

  if (pathname.startsWith("/dashboard")) {
    if (!loggedIn) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return finish(NextResponse.redirect(url));
    }
    return finish(NextResponse.next());
  }

  // /admin is SUPER_ADMIN + ADMIN_MANAGER only — everyone else goes to /dashboard.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!loggedIn) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return finish(NextResponse.redirect(url));
    }
    const role = access ? getRoleClaim(access) : null;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN_MANAGER") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return finish(NextResponse.redirect(url));
    }
    return finish(NextResponse.next());
  }

  if (AUTH_PAGES.includes(pathname) && loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return finish(NextResponse.redirect(url));
  }

  return finish(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};