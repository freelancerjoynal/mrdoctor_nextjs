/**
 * Reusable browser uploader — safe to import anywhere ("use client" OK).
 * It never touches Cloudinary secrets: the file goes to POST /api/upload,
 * the server tries config 1 → 2 → 3 and returns the URL to save in the DB.
 *
 *   import { uploadImageFile } from "@/lib/upload";
 *   const { url } = await uploadImageFile(file, "profile-pictures");
 *   await saveProfilePicture(url); // PATCH your own API with the URL
 */

export const CLIENT_UPLOAD_LIMITS = {
  MAX_BYTES: 5 * 1024 * 1024, // must match CLOUDINARY_UPLOAD in lib/cloudinary.ts
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
} as const;

export function validateImageFile(file: File): string | null {
  if (!file || file.size === 0) return "ছবি ফাইল দিন।";
  if (!CLIENT_UPLOAD_LIMITS.ALLOWED_TYPES.includes(file.type as (typeof CLIENT_UPLOAD_LIMITS.ALLOWED_TYPES)[number])) {
    return "শুধু JPG / PNG / WebP / GIF ছবি দেওয়া যাবে।";
  }
  if (file.size > CLIENT_UPLOAD_LIMITS.MAX_BYTES) {
    return "ছবি ৫ MB-এর বেশি হতে পারবে না।";
  }
  return null;
}

export interface UploadedImage {
  url: string;
  slot: string;
}

/** Upload via /api/upload (server fallback chain). Throws with a Bangla message. */
export async function uploadImageFile(file: File, folder = "mrdoctor"): Promise<UploadedImage> {
  const invalid = validateImageFile(file);
  if (invalid) throw new Error(invalid);
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = (await res.json().catch(() => null)) as {
    url?: string;
    slot?: string;
    error?: string;
  } | null;
  if (!res.ok || !data?.url) {
    throw new Error(data?.error || "ছবি আপলোড করা যায়নি। পরে আবার চেষ্টা করুন।");
  }
  return { url: data.url, slot: data.slot ?? "" };
}
