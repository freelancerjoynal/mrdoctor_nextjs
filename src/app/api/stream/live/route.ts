import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * Public live-board stream — pipes Express
 * `GET /api/website/doctors/:username/stream` (live frames only, no auth).
 */
export async function GET(req: Request) {
  const username = new URL(req.url).searchParams.get("username")?.trim() ?? "";
  if (!username) return NextResponse.json({ error: "Doctor username required" }, { status: 400 });
  let backendRes: Response | null = null;
  try {
    backendRes = await fetch(
      `${BACKEND_URL}/api/website/doctors/${encodeURIComponent(username)}/stream`,
      { cache: "no-store" },
    );
  } catch {
    backendRes = null;
  }
  if (!backendRes || !backendRes.ok || !backendRes.body) {
    return NextResponse.json({ error: "Stream unavailable" }, { status: backendRes?.status || 502 });
  }
  return new Response(backendRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
