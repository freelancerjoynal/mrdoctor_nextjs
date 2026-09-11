import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * Deterministic logout: tell Express to drop the server-side refresh
 * token, then ALWAYS delete both cookies on this domain.
 * LogoutButton calls this instead of the generic proxy so logout can
 * never leave stale cookies behind (the old infinite-redirect cause).
 */
export async function POST(req: Request) {
  try {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
  } catch {
    /* backend down — still clear local cookies */
  }
  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.delete("accessToken");
  res.cookies.delete("refreshToken");
  return res;
}
