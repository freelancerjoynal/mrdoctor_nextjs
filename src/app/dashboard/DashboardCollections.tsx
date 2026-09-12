"use client";

import { useEffect, useState } from "react";
import { toBn } from "@/lib/bn";

interface Bucket {
  total: number;
  count: number;
  newCount: number;
  renewCount: number;
}

interface Summary {
  today: string;
  todayExpected: Bucket;
  todayDone: Bucket;
  week: Bucket;
  month: Bucket | null;
  lifetime: Bucket | null;
}

function taka(n: number): string {
  return `৳${toBn(n)}`;
}

async function fetchSummary(query = ""): Promise<Summary> {
  const res = await fetch(`/api/backend/api/users/appointments/summary${query}`);
  const data = (await res.json().catch(() => null)) as { data?: Summary; error?: string } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as Summary;
}

/** Real collection cards shown on the dashboard home after the intro. */
export function DashboardCollections({ isDoctor }: { isDoctor: boolean }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchSummary()
      .then((s) => {
        if (cancelled) return;
        setSummary(s);
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

  return (
    <section className="space-y-3 sm:space-y-4">
      {error && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {/* Today's collection with hover note */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-4 text-white shadow-xl sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">আজকের কালেকশন</p>
            <div className="group relative shrink-0">
              <span className="flex h-6 w-6 cursor-help items-center justify-center rounded-full bg-white/25 text-xs font-black">
                !
              </span>
              <div className="pointer-events-none absolute right-0 top-8 z-10 w-52 rounded-xl bg-slate-900 p-3 text-xs leading-relaxed text-white opacity-0 shadow-2xl transition group-hover:opacity-100">
                এই অঙ্ক পরিবর্তন হতে পারে, কারণ যেকোনো অ্যাপয়েন্টমেন্টের অবস্থা বদলাতে পারে।
              </div>
            </div>
          </div>
          <p className="mt-1 text-2xl font-black sm:text-3xl">
            {loading || !summary ? "…" : taka(summary.todayExpected.total)}
          </p>
          <p className="mt-0.5 text-xs text-white/80">
            {summary ? `${toBn(summary.todayExpected.count)} জন · আদায় ${taka(summary.todayDone.total)}` : ""}
          </p>
        </div>

        {/* Gross (lifetime) — doctor only */}
        {isDoctor && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">মোট কালেকশন</p>
            <p className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
              {loading || !summary ? "…" : summary.lifetime ? taka(summary.lifetime.total) : "—"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {summary?.lifetime ? `${toBn(summary.lifetime.count)} জন সম্পন্ন` : "সর্বমোট আদায়"}
            </p>
          </div>
        )}

        {/* Weekly */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">সাপ্তাহিক কালেকশন</p>
          <p className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            {loading || !summary ? "…" : taka(summary.week.total)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {summary ? `গত ৭ দিন · ${toBn(summary.week.count)} জন` : ""}
          </p>
        </div>

      </div>
    </section>
  );
}
