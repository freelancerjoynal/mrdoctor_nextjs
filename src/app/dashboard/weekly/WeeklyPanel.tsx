"use client";

import { useCallback, useEffect, useState } from "react";
import { toBn, bnDateLabel, BN_WEEKDAYS } from "@/lib/bn";
import { apiFetch } from "@/lib/auth/apiFetch";

interface ChannelBucket {
  total: number;
  count: number;
}

interface WeekDayRow {
  date: string;
  total: number;
  count: number;
  online: ChannelBucket;
  offline: ChannelBucket;
}

interface WeekDays {
  from: string;
  to: string;
  offset: number;
  days: WeekDayRow[];
  total: number;
  count: number;
  online: ChannelBucket;
  offline: ChannelBucket;
}

function taka(n: number): string {
  return `৳${toBn(n)}`;
}

function weekdayOf(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  return BN_WEEKDAYS[new Date(y!, m! - 1, d!).getDay()] ?? "";
}

async function weekApi(offset: number): Promise<WeekDays> {
  const res = await apiFetch(
    `/api/backend/api/users/appointments/collection/week?offset=${offset}`,
  );
  const data = (await res.json().catch(() => null)) as {
    data?: WeekDays;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as WeekDays;
}

/** This week's per-day আয় (online + offline) — opened from the সাপ্তাহিক আয় box. */
export function WeeklyPanel() {
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<WeekDays | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (o: number) => {
    setLoading(true);
    setError("");
    try {
      setData(await weekApi(o));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional refetch on week change
    load(offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const shift = (delta: number) => {
    const next = offset + delta;
    if (next < -52 || next > 0) return;
    setData(null);
    setOffset(next);
  };

  return (
    <div className="space-y-4">
      {/* Header + week totals */}
      <section className="rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 p-5 text-white shadow-xl sm:rounded-3xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">
              📊 সপ্তাহের প্রতিদিনের আয় · সোম–রবি
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight sm:text-4xl">
              {data ? `${bnDateLabel(data.from)} → ${bnDateLabel(data.to)}` : "…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shift(-1)}
              aria-label="আগের সপ্তাহ"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg font-black hover:bg-white/30"
            >
              ←
            </button>
            {offset !== 0 && (
              <button
                type="button"
                onClick={() => {
                  setData(null);
                  setOffset(0);
                }}
                className="rounded-full bg-white/15 px-4 py-2 text-xs font-black hover:bg-white/30"
              >
                এই সপ্তাহ
              </button>
            )}
            <button
              type="button"
              onClick={() => shift(1)}
              disabled={offset >= 0}
              aria-label="পরের সপ্তাহ"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg font-black hover:bg-white/30 disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
        {data && (
          <>
            <p className="mt-2 text-3xl font-black sm:text-4xl">{taka(data.total)}</p>
            <p className="mt-1 text-sm text-white/85">
              মোট {toBn(data.count)} জন · অনলাইন {taka(data.online.total)} ({toBn(data.online.count)}{" "}
              জন) · অফলাইন {taka(data.offline.total)} ({toBn(data.offline.count)} জন)
            </p>
          </>
        )}
      </section>

      {error && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}

      {loading || !data ? (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
          লোড হচ্ছে…
        </p>
      ) : (
        <ul className="space-y-2">
          {data.days.map((d) => {
            const day = Number(d.date.split("-")[2]);
            const empty = d.count === 0;
            return (
              <li
                key={d.date}
                className={`flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 ${
                  empty ? "opacity-60" : ""
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 font-black text-blue-800">
                  <span className="text-base leading-none">{toBn(day)}</span>
                  <span className="mt-0.5 text-[9px] font-bold leading-none text-blue-500">
                    {weekdayOf(d.date).slice(0, 3)}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-900">
                    {bnDateLabel(d.date)} · {weekdayOf(d.date)}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-bold">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                      অনলাইন {taka(d.online.total)} · {toBn(d.online.count)}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                      অফলাইন {taka(d.offline.total)} · {toBn(d.offline.count)}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-right text-sm font-black text-blue-700">
                  {empty ? "—" : taka(d.total)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
