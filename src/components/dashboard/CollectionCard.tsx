"use client";

import { toBn } from "@/lib/bn";

function taka(n: number): string {
  return `৳${toBn(n)}`;
}

export interface ChannelBucket {
  total: number;
  count: number;
}

export interface CollectionBucket {
  total: number;
  count: number;
  online: ChannelBucket;
  offline: ChannelBucket;
}

/** Shared collection box: total + patient count + online/offline split. */
export function CollectionCard({
  label,
  hint,
  bucket,
  loading,
  onClick,
  actionLabel,
}: {
  label: string;
  hint?: string;
  bucket?: CollectionBucket | null;
  loading: boolean;
  onClick?: () => void;
  actionLabel?: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
        {loading || bucket === undefined ? "…" : bucket === null ? "—" : taka(bucket.total)}
      </p>
      {bucket && (
        <>
          <p className="mt-0.5 text-xs text-slate-500">
            {toBn(bucket.count)} জন{hint ? ` · ${hint}` : ""}
          </p>
          <p className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-bold">
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
              অনলাইন {taka(bucket.online.total)} · {toBn(bucket.online.count)}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
              অফলাইন {taka(bucket.offline.total)} · {toBn(bucket.offline.count)}
            </span>
          </p>
        </>
      )}
    </>
  );
  if (!onClick) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">{inner}</div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
    >
      {inner}
      <p className="mt-1 text-[11px] font-bold text-emerald-700">{actionLabel ?? "বিস্তারিত 👆"}</p>
    </button>
  );
}
