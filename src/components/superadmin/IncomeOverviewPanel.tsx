"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";
import { toBn } from "@/lib/bn";

function taka(n: number): string {
  return `৳${toBn(Math.round(n))}`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Scope = "doctors" | "hospitals";
type Period = "daily" | "weekly" | "monthly";

interface IncomeRow {
  id: string;
  name: string;
  sub: string | null;
  total: number;
  count: number;
  onlineTotal: number;
  onlineCount: number;
  offlineTotal: number;
  offlineCount: number;
}

interface IncomeDay {
  date: string;
  total: number;
  count: number;
}

interface Overview {
  scope: Scope;
  period: Period;
  label: string;
  from: string;
  to: string;
  total: number;
  count: number;
  rows: IncomeRow[];
  days: IncomeDay[] | null;
}

/**
 * Super-admin only: platform-wide income — per doctor / per hospital,
 * switchable between daily / weekly / monthly. Served ledger (realized income).
 */
export function IncomeOverviewPanel() {
  const [scope, setScope] = useState<Scope>("doctors");
  const [period, setPeriod] = useState<Period>("daily");
  const [anchor, setAnchor] = useState(todayIso());
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ scope, period, anchor, take: "20" });
      if (search.trim()) q.set("search", search.trim());
      const res = await apiFetch(`/api/backend/api/users/income/overview?${q.toString()}`);
      const json = (await res.json().catch(() => null)) as { data?: Overview; error?: string } | null;
      if (!res.ok) throw new Error(json?.error || "লোড করা যায়নি।");
      setData(json?.data as Overview);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [scope, period, anchor, search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const maxDay = data?.days?.reduce((m, d) => Math.max(m, d.total), 0) ?? 0;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <p className="text-sm font-black text-slate-800">💰 আয়ের হিসাব (সুপার-অ্যাডমিন)</p>
      <p className="mb-3 mt-0.5 text-xs font-bold text-slate-400">
        ডাক্তার ও হাসপাতালের আয় — দৈনিক / সাপ্তাহিক / মাসিক
      </p>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(["doctors", "hospitals"] as Scope[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                scope === s ? "bg-white text-slate-900 shadow" : "text-slate-500"
              }`}
            >
              {s === "doctors" ? "🩺 ডাক্তার" : "🏥 হাসপাতাল"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                period === p ? "bg-white text-slate-900 shadow" : "text-slate-500"
              }`}
            >
              {p === "daily" ? "📆 দৈনিক" : p === "weekly" ? "📊 সাপ্তাহিক" : "🗓️ মাসিক"}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={anchor}
          onChange={(e) => e.target.value && setAnchor(e.target.value)}
          className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-violet-500 focus:outline-none"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="নাম দিয়ে খুঁজুন…"
          className="min-w-36 flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-violet-500 focus:outline-none"
        />
      </div>

      {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
      {loading && <p className="mt-3 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">লোড হচ্ছে…</p>}

      {data && !loading && (
        <div className="mt-3 space-y-3">
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-4 text-white">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/80">
              মোট আয় · {data.label}
            </p>
            <p className="mt-1 text-3xl font-black">{taka(data.total)}</p>
            <p className="mt-1 text-xs font-bold text-white/85">
              {toBn(data.count)}টি সেবা · {toBn(data.rows.length)}টি {scope === "doctors" ? "ডাক্তার" : "হাসপাতাল"}
            </p>
          </div>

          {data.days && data.days.length > 1 && (
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">প্রতিদিনের আয়</p>
              <div className="flex h-24 items-end gap-1">
                {data.days.map((d) => (
                  <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${d.date}: ${taka(d.total)}`}>
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-violet-500 to-fuchsia-400"
                      style={{ height: `${maxDay > 0 ? Math.max(4, (d.total / maxDay) * 88) : 4}px` }}
                    />
                    <span className="text-[9px] font-bold text-slate-400">{d.date.slice(8)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ul className="space-y-2">
            {data.rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800">{r.name}</p>
                    {r.sub && <p className="truncate text-xs text-slate-400">{r.sub}</p>}
                  </div>
                  <p className="shrink-0 text-base font-black text-slate-900">{taka(r.total)}</p>
                </div>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  {toBn(r.count)}টি সেবা · 🌐 অনলাইন {taka(r.onlineTotal)} ({toBn(r.onlineCount)}) · 💵 ক্যাশ{" "}
                  {taka(r.offlineTotal)} ({toBn(r.offlineCount)})
                </p>
              </li>
            ))}
            {data.rows.length === 0 && (
              <li className="rounded-xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-400">
                এই সময়ে কোনো আয় নেই।
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
