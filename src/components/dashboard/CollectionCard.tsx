"use client";

import { toBn } from "@/lib/bn";
import { Skeleton } from "./Skeleton";

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

export type CollectionTone = "today" | "week" | "month" | "lifetime";

const TONES: Record<CollectionTone, { bg: string; pill: string; emoji: string }> = {
  today: { bg: "from-emerald-500 via-emerald-600 to-teal-600", pill: "bg-white/20 text-white", emoji: "💰" },
  week: { bg: "from-sky-500 via-blue-600 to-indigo-600", pill: "bg-white/20 text-white", emoji: "📊" },
  month: { bg: "from-amber-500 via-orange-500 to-rose-500", pill: "bg-white/20 text-white", emoji: "🗓️" },
  lifetime: { bg: "from-violet-500 via-purple-600 to-fuchsia-600", pill: "bg-white/20 text-white", emoji: "🏆" },
};

/** Shared collection box: big colorful total + patient count + online/offline split. */
export function CollectionCard({
  label,
  hint,
  bucket,
  loading,
  onClick,
  actionLabel,
  tone = "today",
}: {
  label: string;
  hint?: string;
  bucket?: CollectionBucket | null;
  loading: boolean;
  onClick?: () => void;
  actionLabel?: string;
  tone?: CollectionTone;
}) {
  const t = TONES[tone];
  // Shimmer only while the first load is in flight — background refreshes
  // keep showing the last known figures instead of blanking.
  const showSkeleton = loading && bucket === undefined;
  const inner = (
    <>
      <p className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-white/85">
        <span aria-hidden="true">{t.emoji}</span> {label}
      </p>
      {showSkeleton ? (
        <div className="mt-2 space-y-2" aria-label="লোড হচ্ছে">
          <Skeleton light className="h-9 w-36 sm:h-10" />
          <Skeleton light className="h-4 w-28" />
          <p className="flex flex-wrap gap-1.5">
            <Skeleton light className="h-6 w-24 !rounded-full" />
            <Skeleton light className="h-6 w-24 !rounded-full" />
          </p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-3xl font-black tracking-tight text-white drop-shadow-sm sm:text-4xl">
            {bucket == null ? "—" : taka(bucket.total)}
          </p>
          {bucket && (
            <>
              <p className="mt-1 text-sm font-bold text-white/90">
                👥 {toBn(bucket.count)} জন{hint ? ` · ${hint}` : ""}
              </p>
              <p className="mt-2 flex flex-wrap gap-1.5 text-xs font-black">
                <span className={`rounded-full px-2.5 py-1 ${t.pill}`}>
                  অনলাইন {taka(bucket.online.total)} · {toBn(bucket.online.count)}
                </span>
                <span className={`rounded-full px-2.5 py-1 ${t.pill}`}>
                  অফলাইন {taka(bucket.offline.total)} · {toBn(bucket.offline.count)}
                </span>
              </p>
            </>
          )}
        </>
      )}
    </>
  );
  const cls = `relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.bg} p-5 text-left shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl sm:rounded-3xl sm:p-6`;
  const decor = (
    <>
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-black/10 blur-2xl" />
    </>
  );
  if (!onClick) {
    return (
      <div className={cls}>
        {decor}
        <div className="relative">{inner}</div>
      </div>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${cls} cursor-pointer`}>
      {decor}
      <div className="relative">
        {inner}
        <p className="mt-2 text-xs font-black text-white underline decoration-white/50 underline-offset-4">
          {actionLabel ?? "বিস্তারিত 👆"}
        </p>
      </div>
    </button>
  );
}
