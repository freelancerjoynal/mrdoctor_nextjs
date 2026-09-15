import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

function sseHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

/**
 * Authenticated realtime stream — pipes Express `GET /api/users/stream`
 * without buffering (the catch-all proxy buffers bodies, which breaks SSE).
 * Cookies ride along, so the backend resolves the caller's doctor/hospital
 * scope exactly like the appointment APIs do.
 *
 * Auth failures surface as a plain non-200 here; the client hook probes the
 * session through the normal proxy (which owns the refresh dance) and sends
 * the user to /login when the session is dead.
 */
export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  let backendRes: Response | null = null;
  try {
    backendRes = await fetch(`${BACKEND_URL}/api/users/stream`, {
      headers: { Cookie: cookie },
      cache: "no-store",
    });
  } catch {
    backendRes = null;
  }
  if (!backendRes || !backendRes.ok || !backendRes.body) {
    return NextResponse.json({ error: "Stream unavailable" }, { status: backendRes?.status || 502 });
  }
  return new Response(backendRes.body, { headers: sseHeaders() });
}
