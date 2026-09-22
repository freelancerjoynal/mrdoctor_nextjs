"use client";

import Link from "next/link";

/**
 * Booking-form (checkout) policy acceptance checkbox.
 * T&C + Return & Refund + Privacy hyperlinked — submit blocked
 * until the patient ticks the box.
 */
export function PolicyAcceptance({
  checked,
  onChange,
  accent = "emerald",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: "emerald" | "blue";
}) {
  const box = accent === "blue" ? "accent-blue-700" : "accent-emerald-700";
  const linkCls =
    accent === "blue"
      ? "font-bold text-blue-700 underline hover:text-blue-900"
      : "font-bold text-emerald-700 underline hover:text-emerald-900";
  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={`mt-1 h-5 w-5 shrink-0 cursor-pointer ${box}`}
          aria-label="শর্তাবলী ও নীতিমালায় সম্মতি"
        />
        <span className="text-sm leading-relaxed text-slate-700">
          আমি{" "}
          <Link href="/terms" target="_blank" rel="noreferrer" className={linkCls}>
            শর্তাবলী (T&amp;C)
          </Link>
          {", "}
          <Link href="/refund" target="_blank" rel="noreferrer" className={linkCls}>
            রিটার্ন ও রিফান্ড পলিসি
          </Link>
          {" এবং "}
          <Link href="/privacy" target="_blank" rel="noreferrer" className={linkCls}>
            প্রাইভেসি পলিসি
          </Link>{" "}
          পড়েছি ও সম্মত আছি। *
        </span>
      </label>
    </div>
  );
}
