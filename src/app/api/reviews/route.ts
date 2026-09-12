import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * Same-origin proxy for visitor review submissions.
 * The browser posts here (no CORS / no backend URL leaks);
 * this handler forwards to the backend's public review endpoint.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/website/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "জমা দেওয়া যায়নি। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
