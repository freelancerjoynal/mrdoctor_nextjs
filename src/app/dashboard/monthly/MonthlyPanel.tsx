"use client";

import { useCallback, useEffect, useState } from "react";
import { toBn, bnDateLabel, BN_WEEKDAYS } from "@/lib/bn";
import { apiFetch } from "@/lib/auth/apiFetch";

interface ChannelBucket {
  total: number;
  count: number;
}

interface MonthDayRow {
  date: string;
  total: number;
  count: number;
  online: ChannelBucket;
  offline: ChannelBucket;
}

interface MonthDays {
  year: number;
  month: number;
  name: string;
  days: MonthDayRow[];
  total: number;
  count: number;
  online: ChannelBucket;
  offline: ChannelBucket;
}

function taka(n: number): string {
  return `৳${toBn(n)}`;
}

function weekdayBn(year: number, month: number, day: number): string {
  return BN_WEEKDAYS[new Date(year, month - 1, day).getDay()] ?? "";
}

async function monthApi(year: number, month: number): Promise<MonthDays> {
  const res = await apiFetch(
    `/api/backend/api/users/appointments/collection/days?year=${year}&month=${month}`,
  );
  const data = (await res.json().catch(() => null)) as {
    data?: MonthDays;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as MonthDays;
}

/** This month's per-day আদায় (online + offline) — opened from the মাসিক আয় box. */
export function MonthlyPanel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<MonthDays | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError("");
    try {
      setData(await monthApi(y, m));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const shift = (delta: number) => {
    let y = year;
    let m = month + delta;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    if (y < 2000 || y > 2100) return;
    setData(null);
    setYear(y);
    setMonth(m);
  };

  return (
    <div className="space-y-4">
      {/* Header + month totals */}
      <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-5 text-white shadow-xl sm:rounded-3xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">
              মাসের প্রতিদিনের আদায়
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight sm:text-4xl">
              {data ? data.name : "…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shift(-1)}
              aria-label="আগের মাস"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg font-black hover:bg-white/30"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label="পরের মাস"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg font-black hover:bg-white/30"
            >
              →
            </button>
          </div>
        </div>
        {data && (
          <>
            <p className="mt-2 text-3xl font-black">{taka(data.total)}</p>
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
                <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 font-black text-slate-700">
                  <span className="text-base leading-none">{toBn(day)}</span>
                  <span className="mt-0.5 text-[9px] font-bold leading-none text-slate-500">
                    {weekdayBn(data.year, data.month, day).slice(0, 3)}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-900">
                    {bnDateLabel(d.date)} · {weekdayBn(data.year, data.month, day)}
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
                <span className="shrink-0 text-right text-sm font-black text-emerald-700">
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
