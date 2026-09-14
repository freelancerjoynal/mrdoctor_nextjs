import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { CLOUDINARY_UPLOAD } from "@/lib/cloudinary";
import { uploadImageWithFallback } from "@/lib/cloudinary.server";

/**
 * POST /api/upload — multipart FormData { file, folder? }.
 * Login required. Validates the image, uploads to Cloudinary trying
 * config 1 → 2 → 3, and returns { url } to save in the database.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "ফাইল পাওয়া যায়নি।" }, { status: 400 });
  }

  const file = form.get("file");
  const folder = typeof form.get("folder") === "string" ? (form.get("folder") as string) : "mrdoctor";

  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "ছবি ফাইল দিন।" }, { status: 400 });
  }
  if (file.type && !CLOUDINARY_UPLOAD.ALLOWED_TYPES.includes(file.type as (typeof CLOUDINARY_UPLOAD.ALLOWED_TYPES)[number])) {
    return NextResponse.json({ error: "শুধু JPG / PNG / WebP / GIF ছবি দেওয়া যাবে।" }, { status: 400 });
  }
  if (file.size > CLOUDINARY_UPLOAD.MAX_BYTES) {
    return NextResponse.json({ error: "ছবি ৫ MB-এর বেশি হতে পারবে না।" }, { status: 400 });
  }

  const filename =
    file instanceof File && file.name ? file.name.replace(/[^\w.\-]+/g, "_") : "upload.jpg";

  try {
    const result = await uploadImageWithFallback(file, filename, folder);
    return NextResponse.json({ url: result.url, slot: result.slot });
  } catch (err: unknown) {
    console.error("[upload]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "ছবি আপলোড করা যায়নি। পরে আবার চেষ্টা করুন।" }, { status: 502 });
  }
}
