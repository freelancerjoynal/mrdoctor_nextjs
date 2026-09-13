"use client";

import { useCallback, useEffect, useState } from "react";
import { toBn } from "@/lib/bn";

interface Bucket {
  total: number;
  count: number;
  newCount: number;
  renewCount: number;
}

interface WeeklyBucket {
  from: string;
  to: string;
  total: number;
  patientCount: number;
  doneCount: number;
  newCount: number;
  renewCount: number;
  cancelled: number;
}

interface Summary {
  today: string;
  todayExpected: Bucket;
  todayDone: Bucket;
  week: Bucket;
  thisWeek: WeeklyBucket;
  lastWeek: WeeklyBucket;
  month: Bucket | null;
  lifetime: Bucket | null;
}

interface WeekRow {
  id: string;
  patientName: string;
  patientType?: string | null;
  contactPhone: string;
  appointmentDate: string;
  dayLabel?: string | null;
  chamberName?: string | null;
  status: string;
  fee?: number;
}

function taka(n: number): string {
  return `৳${toBn(n)}`;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "অপেক্ষমাণ", cls: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "নিশ্চিত", cls: "bg-blue-100 text-blue-800" },
  DONE: { label: "সম্পন্ন", cls: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "বাতিল", cls: "bg-red-100 text-red-700" },
};

async function fetchSummary(query = ""): Promise<Summary> {
  const res = await fetch(`/api/backend/api/users/appointments/summary${query}`);
  const data = (await res.json().catch(() => null)) as { data?: Summary; error?: string } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as Summary;
}

/** Detail popup for one Mon–Sun week: stats + every appointment row. */
function WeekModal({
  title,
  range,
  bucket,
  onClose,
}: {
  title: string;
  range: string;
  bucket: WeeklyBucket;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<WeekRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = `?from=${encodeURIComponent(bucket.from)}&to=${encodeURIComponent(bucket.to)}&limit=50`;
        const res = await fetch(`/api/backend/api/users/appointments${q}`);
        const data = (await res.json().catch(() => null)) as {
          data?: WeekRow[];
          pagination?: { total?: number };
          error?: string;
        } | null;
        if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
        if (cancelled) return;
        setRows(Array.isArray(data?.data) ? (data?.data ?? []) : []);
        setTotalRows(data?.pagination?.total ?? 0);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bucket.from, bucket.to]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-start gap-3 bg-gradient-to-br from-emerald-600 to-teal-500 px-5 py-5 text-white sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">{title}</p>
            <p className="mt-0.5 text-sm font-bold text-white/90">{range}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">{taka(bucket.total)}</p>
            <p className="mt-1 text-xs text-white/85">
              মোট {toBn(bucket.patientCount)} জন · সম্পন্ন {toBn(bucket.doneCount)} · বাতিল{" "}
              {toBn(bucket.cancelled)} · নতুন {toBn(bucket.newCount)} · পুরনো {toBn(bucket.renewCount)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg font-bold hover:bg-white/30"
          >
            ✕
          </button>
        </div>

        {/* Rows */}
        <div className="space-y-2 bg-slate-50 px-4 py-5 sm:px-6">
          {loading ? (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
              লোড হচ্ছে…
            </p>
          ) : error ? (
            <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">
              {error}
            </p>
          ) : rows.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
              এই সপ্তাহে কোনো অ্যাপয়েন্টমেন্ট নেই।
            </p>
          ) : (
            <>
              <p className="text-xs font-bold text-slate-500">
                {toBn(rows.length)}টি দেখা যাচ্ছে{totalRows > rows.length ? ` (মোট ${toBn(totalRows)}টি)` : ""}
              </p>
              <ul className="space-y-2">
                {rows.map((r) => {
                  const meta = STATUS_META[r.status] ?? {
                    label: r.status,
                    cls: "bg-slate-100 text-slate-600",
                  };
                  return (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base font-black text-slate-700">
                        {(r.patientName.trim()[0] || "অ").toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-slate-900">
                          {r.patientName}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          📞 {r.contactPhone}
                          {r.dayLabel ? ` · ${r.dayLabel}` : ""}
                        </span>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-black ${meta.cls}`}
                        >
                          {meta.label}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-sm font-black text-emerald-700">
                        {r.status === "CANCELLED" ? "—" : r.fee != null ? taka(r.fee) : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Real collection cards shown on the dashboard home after the intro. */
export function DashboardCollections({ isDoctor }: { isDoctor: boolean }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openWeek, setOpenWeek] = useState<"this" | "last" | null>(null);
  const closeModal = useCallback(() => setOpenWeek(null), []);

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

  const thisWeek = summary?.thisWeek ?? null;
  const lastWeek = summary?.lastWeek ?? null;

  return (
    <section className="space-y-3 sm:space-y-4">
      {error && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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

        {/* This week (Monday → now) — click for details */}
        <button
          type="button"
          onClick={() => thisWeek && setOpenWeek("this")}
          className="rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            📅 এই সপ্তাহের কালেকশন
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            {loading || !thisWeek ? "…" : taka(thisWeek.total)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {thisWeek
              ? `${toBn(thisWeek.patientCount)} জন · ${toBn(thisWeek.cancelled)} বাতিল · বিস্তারিত 👆`
              : "সোমবার → এখন"}
          </p>
        </button>

        {/* Last week (Monday → Sunday) — click for details */}
        <button
          type="button"
          onClick={() => lastWeek && setOpenWeek("last")}
          className="rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            🗓️ গত সপ্তাহের কালেকশন
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            {loading || !lastWeek ? "…" : taka(lastWeek.total)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {lastWeek
              ? `${toBn(lastWeek.patientCount)} জন · ${toBn(lastWeek.cancelled)} বাতিল · বিস্তারিত 👆`
              : "সোম → রবি"}
          </p>
        </button>
      </div>

      {/* Detail popup */}
      {openWeek === "this" && thisWeek && (
        <WeekModal
          title="এই সপ্তাহের কালেকশন"
          range={`সোমবার ${toBn(thisWeek.from)} → এখন (${toBn(thisWeek.to)})`}
          bucket={thisWeek}
          onClose={closeModal}
        />
      )}
      {openWeek === "last" && lastWeek && (
        <WeekModal
          title="গত সপ্তাহের কালেকশন"
          range={`সোমবার ${toBn(lastWeek.from)} → রবিবার ${toBn(lastWeek.to)}`}
          bucket={lastWeek}
          onClose={closeModal}
        />
      )}
    </section>
  );
}
