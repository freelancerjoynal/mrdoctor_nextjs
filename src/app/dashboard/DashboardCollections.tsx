"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { bnDateLabel, toBn } from "@/lib/bn";
import { apiFetch } from "@/lib/auth/apiFetch";
import { useRealtimeStream } from "@/lib/realtime/useRealtimeStream";
import { CollectionCard, type CollectionBucket } from "@/components/dashboard/CollectionCard";

interface CollectionSummary {
  today: string;
  todayBox: CollectionBucket;
  week: { from: string; to: string } & CollectionBucket;
  month:
    | ({ year: number; month: number; name: string; from: string; to: string } & CollectionBucket)
    | null;
  lifetime: ({ joinedAt: string } & CollectionBucket) | null;
}

async function collectionApi(): Promise<CollectionSummary> {
  const res = await apiFetch("/api/backend/api/users/appointments/collection/summary");
  const data = (await res.json().catch(() => null)) as {
    data?: CollectionSummary;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as CollectionSummary;
}

/** Home collection boxes — served-appointments income ledger. */
export function DashboardCollections({ isDoctor }: { isDoctor: boolean }) {
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    collectionApi()
      .then((c) => {
        if (cancelled) return;
        setCollection(c);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Push-driven counters: re-pull only when the server pushes an
  // `appointments` frame for this scope (or on reconnect catch-up).
  // No polling timers — the hook owns visibility handling.
  useRealtimeStream({
    url: "/api/stream",
    probeUrl: "/api/backend/api/users/appointments/collection/summary",
    onEvent: (types) => {
      if (!types.includes("appointments")) return;
      collectionApi()
        .then((c) => {
          setCollection(c);
          setError("");
        })
        .catch(() => {});
    },
  });

  return (
    <section className="space-y-3 sm:space-y-4">
      {error && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <CollectionCard
          label="আজকের মোট আয়"
          hint={collection ? `আজ · ${bnDateLabel(collection.today)}` : "অপেক্ষা করুন"}
          bucket={collection?.todayBox}
          loading={loading}
          tone="today"
        />
        <CollectionCard
          label="সাপ্তাহিক আয়"
          hint={
            collection
              ? `সোম–রবি · ${bnDateLabel(collection.week.from)} → ${bnDateLabel(collection.week.to)}`
              : "অপেক্ষা করুন"
          }
          bucket={collection?.week}
          loading={loading}
          tone="week"
          onClick={() => router.push("/dashboard/weekly")}
          actionLabel="সপ্তাহের প্রতিদিন দেখুন 👆"
        />
        {isDoctor && (
          <>
            <CollectionCard
              label="মাসিক আয়"
              hint={
                collection?.month
                  ? `${collection.month.name} · ১–${toBn(collection.month.to.split("-")[2] ?? "")} তারিখ`
                  : "অপেক্ষা করুন"
              }
              bucket={collection?.month}
              loading={loading}
              tone="month"
              onClick={() => router.push("/dashboard/monthly")}
              actionLabel="প্রতিদিনের হিসাব দেখুন 👆"
            />
            <CollectionCard
              label="সর্বমোট আয়"
              hint={collection?.lifetime ? `যোগদান ${bnDateLabel(collection.lifetime.joinedAt)} থেকে` : "অপেক্ষা করুন"}
              bucket={collection?.lifetime}
              loading={loading}
              tone="lifetime"
            />
          </>
        )}
      </div>
    </section>
  );
}
