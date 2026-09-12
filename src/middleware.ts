import { NextResponse, type NextRequest } from "next/server";
import { getSubdomain } from "@/lib/subdomain";

const AUTH_PAGES = ["/login", "/register", "/verify-otp", "/forgot-password", "/reset-password"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ---- Subdomain → normal-route rewrite ----
  // URL stays `dr-rahman.domain.com/...`, internally serves `/s/dr-rahman/...`.
  // Skip API, Next internals and the internal prefix itself (no loops).
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/s/")
  ) {
    const host = req.headers.get("host") ?? "";
    const subdomain = getSubdomain(host);
    if (subdomain) {
      const url = req.nextUrl.clone();
      url.pathname = `/s/${subdomain}${pathname === "/" ? "" : pathname}`;
      const res = NextResponse.rewrite(url);
      res.headers.set("x-subdomain", subdomain);
      return res;
    }
  }
  // NOTE: check truthy VALUES, not mere presence — a cleared cookie can
  // linger as an empty string, and that must count as logged out.
  const hasAccess = Boolean(req.cookies.get("accessToken")?.value);
  const hasRefresh = Boolean(req.cookies.get("refreshToken")?.value);
  const loggedIn = hasAccess || hasRefresh;

  if (pathname.startsWith("/dashboard")) {
    if (!loggedIn) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (AUTH_PAGES.includes(pathname) && loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
