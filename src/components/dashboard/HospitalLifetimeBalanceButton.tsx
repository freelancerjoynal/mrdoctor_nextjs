"use client";

import { useState } from "react";
import { toBn } from "@/lib/bn";
import { apiFetch } from "@/lib/auth/apiFetch";

function taka(n: number): string {
  return `৳${toBn(Math.round(n))}`;
}

interface BalanceSummary {
  hospitalName: string;
  currentBalance: number;
  lifetimeOnline: { total: number; count: number };
  today: { online: { total: number; count: number } };
  payout: { totalPaid: number; count: number };
}

async function balanceApi(): Promise<BalanceSummary> {
  const res = await apiFetch("/api/backend/api/users/hospital-balance/summary");
  const data = (await res.json().catch(() => null)) as {
    data?: BalanceSummary;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as BalanceSummary;
}

/**
 * Hospital owner only — header balance button (online ledger only).
 * Load-managed by design: NOTHING is fetched on page load. The summary
 * runs only when the owner clicks the button (first open), the result
 * is cached for reopen, and refresh is manual (↻) — no polling, no realtime.
 */
export function HospitalLifetimeBalanceButton() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (refresh = false) => {
    if (loading) return;
    if (data && !refresh) {
      setOpen(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setData(await balanceApi());
      setOpen(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    void load(false);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        title="অনলাইন ব্যালেন্স দেখুন (ক্লিক করলেই লোড হবে)"
        className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-black text-white shadow transition hover:bg-slate-700 disabled:opacity-60"
      >
        <span aria-hidden="true">💰</span>
        <span className="hidden min-[420px]:inline">
          {loading ? "লোড হচ্ছে…" : data ? taka(data.currentBalance) : "ব্যালেন্স"}
        </span>
        <span className="min-[420px]:hidden">{loading ? "…" : data ? taka(data.currentBalance) : "💰"}</span>
        <span className="text-[10px] font-black opacity-80">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default bg-transparent"
          />
          <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="bg-slate-900 p-4 text-white">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                💰 অনলাইন ব্যালেন্স · উত্তোলনযোগ্য
              </p>
              {loading && !data ? (
                <p className="mt-1 animate-pulse text-2xl font-black">লোড হচ্ছে…</p>
              ) : error && !data ? (
                <p className="mt-1 text-sm font-bold text-red-300">{error}</p>
              ) : data ? (
                <>
                  <p className="mt-1 text-3xl font-black tracking-tight">{taka(data.currentBalance)}</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-300">
                    🌐 সব সময়ের অনলাইন {taka(data.lifetimeOnline.total)} ({toBn(data.lifetimeOnline.count)} জন)
                  </p>
                  <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                    ✅ পরিশোধিত {taka(data.payout.totalPaid)} ({toBn(data.payout.count)} বার) · ⚡ আজ {taka(data.today.online.total)}
                  </p>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5">
              <button
                type="button"
                onClick={() => void load(true)}
                disabled={loading}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-50"
              >
                {loading ? "…" : "↻ নতুন করে দেখুন"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                লুকান
              </button>
              {!data && !loading && !error && (
                <span className="ml-auto text-[11px] font-bold text-slate-400">ক্লিক করলেই লোড হবে</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
