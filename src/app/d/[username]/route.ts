import { NextResponse } from "next/server";
import { buildWaHref } from "@/lib/serial";
import { resolveProfile } from "@/lib/profile";

/**
 * Canonical WhatsApp serial short link: `mrdoctor.com.bd/d/<username>`.
 * Resolves doctor username first, then hospital slug, and redirects
 * into the shared WhatsApp serial flow — same message format as the
 * legacy backend `/d/:username` route.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const identifier = (username || "").trim();
  if (!identifier) {
    return NextResponse.redirect(new URL("/", _req.url), 302);
  }

  const profile = await resolveProfile(identifier).catch(() => null);
  if (!profile) {
    return new NextResponse("❌ দুঃখিত, এই নামে কোনো ডাক্তার বা হাসপাতাল খুঁজে পাওয়া যায়নি!", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const key =
    profile.type === "doctor" ? profile.data.username : profile.data.slug;
  const waNumber = (process.env.WA_NUMBER_GLOBAL ?? "15551967401").replace(
    /[^\d]/g,
    "",
  );
  return NextResponse.redirect(buildWaHref(waNumber, key), 302);
}
