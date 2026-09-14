"use client";

import { useRef, useState } from "react";
import { uploadImageFile } from "@/lib/upload";

/**
 * Reusable Cloudinary image field — usable anywhere a picture URL is needed.
 * Uploads the picked file (server tries config 1 → 2 → 3) and reports the
 * URL via onChange so the parent can save it to the database.
 *
 *   <CloudinaryImageInput
 *     label="প্রোফাইল ছবি"
 *     value={url} onChange={setUrl} folder="profile-pictures"
 *   />
 */
export function CloudinaryImageInput({
  label,
  value,
  onChange,
  folder = "mrdoctor",
  previewSize = "h-20 w-20",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  previewSize?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { url } = await uploadImageFile(file, folder);
      onChange(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ছবি আপলোড করা যায়নি।");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="mb-1 block text-sm font-bold text-slate-600">{label}</span>
      <div className="flex items-center gap-3">
        {value.trim() ? (
          /* eslint-disable-next-line @next/next/no-img-element -- preview of an uploaded URL */
          <img
            src={value.trim()}
            alt={label}
            className={`${previewSize} shrink-0 rounded-2xl object-cover ring-1 ring-slate-200`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span
            className={`${previewSize} flex shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400 ring-1 ring-slate-200`}
          >
            🖼️
          </span>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… অথবা নিচে আপলোড করুন"
            maxLength={500}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {uploading ? "☁️ আপলোড হচ্ছে…" : "☁️ ছবি আপলোড করুন"}
            </button>
            {value.trim() && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-xl px-3 py-2 text-sm font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
              >
                সরান
              </button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs font-bold text-red-600">{error}</p>}
    </div>
  );
}
