/**
 * Server-only Cloudinary uploader (signed uploads — needs the API secrets).
 *
 * ⚠️ Never import this file from client components. It is used by
 * `app/api/upload/route.ts` only.
 */
import { createHash } from "node:crypto";
import { CLOUDINARY_SLOTS } from "./cloudinary";
import type { CloudinarySlot } from "./cloudinary";

export interface CloudinaryUploadResult {
  /** secure_url to save in the database. */
  url: string;
  publicId: string;
  /** Which config slot succeeded (ONE / TWO / THREE …). */
  slot: string;
}

function signParams(params: Record<string, string>, apiSecret: string): string {
  const payload =
    Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&") + apiSecret;
  return createHash("sha1").update(payload).digest("hex");
}

function sanitizeFolder(folder: string): string {
  const clean = folder.trim().replace(/[^a-zA-Z0-9-_\/]/g, "").replace(/^\/+|\/+$/g, "");
  return clean || "mrdoctor";
}

async function uploadToSlot(
  slot: CloudinarySlot,
  file: Blob,
  filename: string,
  folder: string,
): Promise<CloudinaryUploadResult> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params: Record<string, string> = { folder, timestamp };
  const signature = signParams(params, slot.API_SECRET);

  const form = new FormData();
  form.append("file", file, filename);
  form.append("api_key", slot.API_KEY);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${slot.CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  const json = (await res.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  } | null;
  if (!res.ok || !json?.secure_url) {
    throw new Error(json?.error?.message || `Cloudinary ${slot.name} upload failed (${res.status})`);
  }
  return { url: json.secure_url, publicId: json.public_id ?? "", slot: slot.name };
}

/**
 * Upload an image trying slot 1 → 2 → 3. Resolves with the first success;
 * throws only when every slot failed (with each slot's error attached).
 */
export async function uploadImageWithFallback(
  file: Blob,
  filename: string,
  folder = "mrdoctor",
): Promise<CloudinaryUploadResult> {
  const safeFolder = sanitizeFolder(folder);
  const failures: string[] = [];
  for (const slot of CLOUDINARY_SLOTS) {
    try {
      return await uploadToSlot(slot, file, filename, safeFolder);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "unknown error";
      console.error(`[Cloudinary] slot ${slot.name} failed: ${msg}`);
      failures.push(`${slot.name}: ${msg}`);
    }
  }
  throw new Error(`Image upload failed on all Cloudinary slots — ${failures.join(" | ")}`);
}
