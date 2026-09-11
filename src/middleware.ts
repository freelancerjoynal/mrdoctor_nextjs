import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/register", "/verify-otp", "/forgot-password", "/reset-password"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
  matcher: ["/dashboard/:path*", "/login", "/register", "/verify-otp", "/forgot-password", "/reset-password"],
};
