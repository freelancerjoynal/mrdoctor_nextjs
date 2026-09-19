"use client";

import { useCallback, useEffect, useState } from "react";
import { toBn, bnDateLabel } from "@/lib/bn";
import { useRealtimeStream } from "@/lib/realtime/useRealtimeStream";
import {
  fetchStaffBuckets,
  fetchStaffDetail,
  fetchLocalMonthly,
  type StaffBucket,
  type StaffDetail,
  type LocalMonthly,
} from "./balanceApi";

function taka(n: number): string {
  return `৳${toBn(Math.round(n))}`;
}

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Local booking card-tab: desk-cash (OFFLINE) data for the selected day.
 * - Date picker: today / yesterday / any calendar date.
 * - Staff list: who took how much (served + pending).
 * - Click a name: which doctor they took it for, how much each.
 */
export function LocalBookingTab() {
  const todayIso = isoLocal(new Date());
  const yesterdayIso = isoLocal(new Date(Date.now() - 86400000));

  const [mode, setMode] = useState<"today" | "yesterday" | "custom">("today");
  const [dateInput, setDateInput] = useState("");
  const [date, setDate] = useState(todayIso);

  const [list, setList] = useState<StaffBucket[]>([]);
  const [loading, setLoading] = useState(true);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StaffDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Monthly counter (this month) + last-12-months list on click.
  const [monthly, setMonthly] = useState<LocalMonthly | null>(null);
  const [showMonths, setShowMonths] = useState(false);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      setList(await fetchStaffBuckets(d));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
    setOpenId(null);
    setDetail(null);
    setDetailError("");
  }, []);

  const loadMonthly = useCallback(async () => {
    try {
      setMonthly(await fetchLocalMonthly());
    } catch {
      /* counter keeps last good value */
    }
  }, []);

  useEffect(() => {
    void load(date);
  }, [date, load]);

  useEffect(() => {
    void loadMonthly();
  }, [loadMonthly]);

  useRealtimeStream({
    url: "/api/stream",
    probeUrl: "/api/backend/api/users/hospital-balance/summary",
    onEvent: (types) => {
      if (!types.includes("appointments")) return;
      void load(date);
      void loadMonthly();
      setOpenId(null);
      setDetail(null);
    },
  });

  const toggle = useCallback(
    async (b: StaffBucket) => {
      if (openId === b.userId) {
        setOpenId(null);
        setDetail(null);
        setDetailError("");
        return;
      }
      setOpenId(b.userId);
      setDetail(null);
      setDetailError("");
      setDetailLoading(true);
      try {
        setDetail(await fetchStaffDetail(b.userId, date));
      } catch (err: unknown) {
        setDetailError(err instanceof Error ? err.message : "লোড করা যায়নি।");
      } finally {
        setDetailLoading(false);
      }
    },
    [openId, date],
  );

  const pick = (m: "today" | "yesterday" | "custom", custom?: string) => {
    setMode(m);
    if (m === "today") setDate(todayIso);
    else if (m === "yesterday") setDate(yesterdayIso);
    else if (custom) setDate(custom);
  };

  // Served balance comes only from served_appointments (realized income).
  const servedTotal = list.reduce((s, b) => s + b.servedTotal, 0);
  const servedCount = list.reduce((s, b) => s + b.servedCount, 0);
  const pendingTotal = list.reduce((s, b) => s + b.confirmedTotal, 0);
  const pendingCount = list.reduce((s, b) => s + b.confirmedCount, 0);

  return (
    <section className="space-y-3">
      {/* Date selector */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 sm:p-4">
        <button
          type="button"
          onClick={() => pick("today")}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            mode === "today" ? "bg-slate-900 text-white shadow" : "bg-slate-100 text-slate-600"
          }`}
        >
          আজ
        </button>
        <button
          type="button"
          onClick={() => pick("yesterday")}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            mode === "yesterday" ? "bg-slate-900 text-white shadow" : "bg-slate-100 text-slate-600"
          }`}
        >
          গতকাল
        </button>
        <label className="flex items-center gap-2 rounded-full bg-slate-50 py-1.5 pl-4 pr-1.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
          <span>📅</span>
          <input
            type="date"
            value={dateInput}
            max={todayIso}
            onChange={(e) => setDateInput(e.target.value)}
            className="rounded-full bg-white px-2 py-1 text-sm font-bold text-slate-800 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => dateInput.trim() && pick("custom", dateInput.trim())}
            disabled={!dateInput}
            className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-black text-white shadow disabled:opacity-40"
          >
            দেখুন
          </button>
        </label>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
          📆 {bnDateLabel(date)}
        </span>
      </div>

      {/* Monthly counter — click for last 12 months (number only) */}
      <button
        type="button"
        onClick={() => setShowMonths((v) => !v)}
        className="block w-full rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-4 text-left text-white shadow-xl"
      >
        <p className="text-[11px] font-black uppercase tracking-widest text-white/75">
          🗓️ এই মাসে লোকাল বুকিং · {monthly?.thisMonth.name ?? "…"}
        </p>
        <p className="mt-1 text-3xl font-black">
          {monthly ? `${toBn(monthly.thisMonth.count)} জন` : "…"}
        </p>
        <p className="mt-0.5 text-[11px] font-black text-white/75">
          {showMonths ? "▲ লুকান" : "▼ ক্লিক করলে গত ১২ মাসের সংখ্যা"}
        </p>
      </button>

      {showMonths && monthly && (
        <ul className="space-y-1.5">
          {[...monthly.months].reverse().map((m) => (
            <li
              key={`${m.year}-${m.month}`}
              className="flex items-center justify-between gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-100"
            >
              <span className="text-sm font-black text-slate-800">{m.name}</span>
              <span className="text-sm font-black text-violet-700">{toBn(m.count)} জন</span>
            </li>
          ))}
        </ul>
      )}

      {/* Day served balance (from served_appointments only) */}
      <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-xl">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          ✅ সেবা সম্পন্ন লোকাল কালেকশন · {bnDateLabel(date)}
        </p>
        <p className="mt-1 text-3xl font-black">{loading ? "…" : taka(servedTotal)}</p>
        <p className="mt-0.5 text-xs font-bold text-slate-300">
          {loading ? "" : `👥 ${toBn(servedCount)} জনকে সেবা দেওয়া হয়েছে`}
        </p>
        {!loading && pendingCount > 0 && (
          <p className="mt-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-black text-amber-200 ring-1 ring-white/10">
            ⏳ বাকি {taka(pendingTotal)} · {toBn(pendingCount)} জন (এখনো সেবা হয়নি — ব্যালেন্স নয়)
          </p>
        )}
      </div>

      {/* Who took how much */}
      {loading ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 ring-1 ring-slate-100">লোড হচ্ছে…</p>
      ) : list.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-100">
          এই তারিখে কোনো লোকাল বুকিং নেই।
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((b) => {
            const open = openId === b.userId;
            return (
              <li key={b.userId} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                <button
                  type="button"
                  onClick={() => void toggle(b)}
                  className="flex w-full items-center gap-3 p-3 text-left sm:p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-base font-black text-amber-800">
                    {(b.name.trim()[0] || "স").toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-slate-900">{b.name}</span>
                    <span className="block text-xs font-bold text-slate-500">
                      💵 {toBn(b.count)} জন · ✅ {toBn(b.servedCount)} সেবা · ⏳ {toBn(b.confirmedCount)} বাকি
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-base font-black text-slate-900">{taka(b.total)}</span>
                    <span className="block text-[11px] font-black text-slate-400">{open ? "▲ বন্ধ" : "▼ কোন ডাক্তার?"}</span>
                  </span>
                </button>
                {open && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-3 sm:p-4">
                    {detailLoading ? (
                      <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
                    ) : detailError ? (
                      <p className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600">{detailError}</p>
                    ) : detail ? (
                      detail.byDoctor.length === 0 ? (
                        <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-500">ডাক্তারভিত্তিক হিসাব নেই।</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {detail.byDoctor.map((d) => (
                            <li
                              key={d.doctorId}
                              className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-black text-slate-900">🩺 {d.doctorName}</span>
                                <span className="block text-[11px] font-bold text-slate-500">
                                  {toBn(d.count)} জন · ✅ {toBn(d.servedCount)} ({taka(d.servedTotal)}) · ⏳{" "}
                                  {toBn(d.confirmedCount)} ({taka(d.confirmedTotal)})
                                </span>
                              </span>
                              <span className="shrink-0 text-sm font-black text-slate-900">{taka(d.total)}</span>
                            </li>
                          ))}
                        </ul>
                      )
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
