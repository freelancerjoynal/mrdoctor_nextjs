import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * Same-origin proxy: client calls /api/backend/... -> Express backend.
 * Forwards browser cookies; re-hosts backend Set-Cookie as Next.js cookies
 * so access/refresh tokens stay httpOnly on this domain.
 */
async function proxy(req: Request, path: string[]) {
  const target = `${BACKEND_URL}/${path.join("/")}${new URL(req.url).search}`;
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.text();

  const backendRes = await fetch(target, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Cookie: req.headers.get("cookie") ?? "",
    },
    body,
    cache: "no-store",
  });

  const data = await backendRes.text();
  const res = new NextResponse(data, {
    status: backendRes.status,
    headers: { "Content-Type": "application/json" },
  });

  const setCookies = (backendRes.headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie?.() ?? [];
  for (const raw of setCookies) {
    const [pair, ...attrs] = raw.split(";");
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (name !== "accessToken" && name !== "refreshToken") continue;
    // Backend clearCookie() sends an empty value with an expired date.
    // Honor the clearing — never re-set a dead cookie with a fresh maxAge.
    const attrStr = attrs.join(";").toLowerCase();
    const isClearing =
      value === "" ||
      value === '""' ||
      attrStr.includes("max-age=0") ||
      attrStr.includes("expires=thu, 01 jan 1970");
    if (isClearing) {
      res.cookies.delete(name);
      continue;
    }
    const maxAge = name === "accessToken" ? 15 * 60 : 7 * 24 * 60 * 60;
    res.cookies.set(name, value, {
      httpOnly: true,
      path: "/",
      maxAge,
      sameSite: "lax",
    });
    void attrs;
  }

  // Explicit logout: always drop both cookies, even if the backend
  // response carried no Set-Cookie headers at all.
  if (path.join("/") === "api/auth/logout") {
    res.cookies.delete("accessToken");
    res.cookies.delete("refreshToken");
  }

  // Backend also returns accessToken in JSON (verify/refresh). Mirror it
  // into a cookie when Set-Cookie was not forwarded (server-to-server).
  try {
    const json = JSON.parse(data) as { accessToken?: string };
    if (json.accessToken && !res.cookies.get("accessToken")) {
      res.cookies.set("accessToken", json.accessToken, {
        httpOnly: true,
        path: "/",
        maxAge: 15 * 60,
        sameSite: "lax",
      });
    }
  } catch {
    /* non-JSON body: ignore */
  }

  return res;
}

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await ctx.params).path);
}
export async function PATCH(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await ctx.params).path);
}
