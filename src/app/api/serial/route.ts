import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * Proxies the public serial form to the backend (`POST /api/website/serial`),
 * keeping BACKEND_URL server-side. Forwards backend status + message as-is.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "সঠিক তথ্য দিন।" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/website/serial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({ error: "সার্ভার ত্রুটি।" }));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "সার্ভারে পৌঁছানো যাচ্ছে না, পরে আবার চেষ্টা করুন।" },
      { status: 502 },
    );
  }
}
