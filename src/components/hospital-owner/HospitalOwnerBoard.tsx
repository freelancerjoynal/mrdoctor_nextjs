"use client";

import { useCallback, useEffect, useState } from "react";
import { toBn, bnDateLabel } from "@/lib/bn";
import { useRealtimeStream } from "@/lib/realtime/useRealtimeStream";
import {
  fetchBalance,
  fetchDays,
  fetchPayouts,
  type BalanceSummary,
  type DayList,
  type PayoutList,
} from "./balanceApi";
import { LocalBookingTab } from "./LocalBookingTab";

function taka(n: number): string {
  return `৳${toBn(Math.round(n))}`;
}

type Tab = "account" | "ledger" | "payments" | "local";

/**
 * Rebuilt hospital-owner board (online ledger design).
 * - Hero = withdrawable ONLINE balance (ledger + today live − payouts).
 * - Every midnight the finished day freezes into the ledger automatically
 *   (lazy on first read); today's online is counted live.
 * - Online only — no cash/local anywhere on this board.
 * - Ledger + payment history page in on demand (zero cost until clicked).
 */
export function HospitalOwnerBoard() {
  const [tab, setTab] = useState<Tab>("account");
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [days, setDays] = useState<DayList | null>(null);
  const [daysPage, setDaysPage] = useState(1);
  const [daysLoading, setDaysLoading] = useState(false);

  const [payouts, setPayouts] = useState<PayoutList | null>(null);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      setSummary(await fetchBalance());
    } catch (err: unknown) {
      if (!silent) setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadDays = useCallback(async (page: number) => {
    setDaysLoading(true);
    try {
      setDays(await fetchDays(page));
      setDaysPage(page);
    } catch {
      /* keep last good page */
    } finally {
      setDaysLoading(false);
    }
  }, []);

  const loadPayouts = useCallback(async (page: number) => {
    setPayoutsLoading(true);
    try {
      setPayouts(await fetchPayouts(page));
      setPayoutsPage(page);
    } catch {
      /* keep last good page */
    } finally {
      setPayoutsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  // Ledger + payments fetch on first tab open only (never prefetched).
  useEffect(() => {
    if (tab === "ledger" && !days && !daysLoading) void loadDays(1);
    if (tab === "payments" && !payouts && !payoutsLoading) void loadPayouts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useRealtimeStream({
    url: "/api/stream",
    probeUrl: "/api/backend/api/users/hospital-balance/summary",
    onEvent: (types) => {
      if (!types.includes("appointments")) return;
      void load(true);
      if (tab === "ledger" && days) void loadDays(daysPage);
      if (tab === "payments" && payouts) void loadPayouts(payoutsPage);
    },
  });

  return (
    <div className="space-y-4">
      {/* ---------- Balance hero ---------- */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-5 text-white shadow-2xl sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
                💰 বর্তমান ব্যালেন্স (পেআউট বাদে) · {summary ? summary.hospitalName : "…"}
              </p>
              {loading && !summary ? (
                <div className="mt-2 h-12 w-48 animate-pulse rounded-xl bg-white/10" />
              ) : error && !summary ? (
                <p className="mt-2 text-sm font-bold text-red-300">{error}</p>
              ) : (
                <>
                  <p className="mt-1 text-5xl font-black tracking-tight sm:text-6xl">
                    {taka(summary?.currentBalance ?? 0)}
                  </p>
                  <p className="mt-2 text-xs font-bold leading-relaxed text-slate-300">
                    সব সময়ের অনলাইন {taka(summary?.lifetimeOnline.total ?? 0)} ({toBn(summary?.lifetimeOnline.count ?? 0)} জন)
                    {" − "}পরিশোধিত {taka(summary?.payout.totalPaid ?? 0)}
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-right ring-1 ring-white/15 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-300">⚡ আজকের অনলাইন (live)</p>
                <p className="text-2xl font-black text-emerald-300">
                  {loading && !summary ? "…" : taka(summary?.today.online.total ?? 0)}
                </p>
                <p className="text-[11px] font-bold text-slate-400">
                  {summary ? `${toBn(summary.today.online.count)} জন সেবা · ব্যালেন্সে ধরা আছে` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void load(true)}
                disabled={refreshing}
                className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-black text-slate-200 ring-1 ring-white/15 transition hover:bg-white/20 disabled:opacity-50"
              >
                {refreshing ? "…" : "↻ রিফ্রেশ"}
              </button>
            </div>
          </div>

          {/* Today / week / month strip — online only, no cash anywhere here */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <StripTile
              label="📊 সপ্তাহ অনলাইন"
              value={summary ? taka(summary.week.online.total) : "…"}
              hint={summary ? `${bnDateLabel(summary.week.from)} →` : ""}
            />
            <StripTile
              label="🗓️ মাস অনলাইন"
              value={summary ? taka(summary.month.online.total) : "…"}
              hint={summary ? summary.month.name : ""}
            />
            <StripTile
              label="✅ মোট পরিশোধিত"
              value={summary ? taka(summary.payout.totalPaid) : "…"}
              hint={summary ? `${toBn(summary.payout.count)} বার পেআউট` : ""}
            />
          </div>
        </div>
      </section>

      {/* ---------- Tabs ---------- */}
      <div className="flex gap-2">
        {(
          [
            { id: "account", label: "🧾 হিসাব" },
            { id: "ledger", label: "📒 দৈনিক লেজার" },
            { id: "payments", label: "💸 পেমেন্ট হিস্ট্রি" },
            { id: "local", label: "🏥 লোকাল বুকিং" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-black transition sm:flex-none sm:px-6 ${
              tab === t.id ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-500 ring-1 ring-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "account" && <AccountTab summary={summary} loading={loading} />}

      {tab === "ledger" && (
        <LedgerTab
          summary={summary}
          days={days}
          page={daysPage}
          loading={daysLoading}
          onPage={(p) => void loadDays(p)}
        />
      )}

      {tab === "payments" && (
        <PaymentsTab
          summary={summary}
          payouts={payouts}
          page={payoutsPage}
          loading={payoutsLoading}
          onPage={(p) => void loadPayouts(p)}
        />
      )}

      {tab === "local" && <LocalBookingTab />}
    </div>
  );
}

function StripTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10 backdrop-blur sm:px-4 sm:py-3">
      <p className="truncate text-[11px] font-black text-slate-300">{label}</p>
      <p className="mt-0.5 truncate text-base font-black sm:text-lg">{value}</p>
      <p className="truncate text-[10px] font-bold text-slate-400">{hint}</p>
    </div>
  );
}

/** হিসাব: where the balance comes from, in one formula card + week/month rows. */
function AccountTab({ summary, loading }: { summary: BalanceSummary | null; loading: boolean }) {
  if (loading && !summary) {
    return <div className="animate-pulse rounded-2xl bg-white p-8 text-center text-sm text-slate-400 ring-1 ring-slate-100">লোড হচ্ছে…</div>;
  }
  if (!summary) return null;
  const rows = [
    { label: "➕ সব সময়ের অনলাইন আয়", value: taka(summary.lifetimeOnline.total), hint: `${toBn(summary.lifetimeOnline.count)} জন · ${bnDateLabel(summary.lifetimeOnline.joinedAt)} থেকে`, tone: "text-emerald-700" },
    { label: "➖ সুপার-অ্যাডমিন পরিশোধ", value: taka(summary.payout.totalPaid), hint: `${toBn(summary.payout.count)} বার${summary.payout.lastPaidAt ? ` · শেষ ${bnDateLabel(summary.payout.lastPaidAt.slice(0, 10))}` : ""}`, tone: "text-rose-600" },
    { label: "🟰 বর্তমান ব্যালেন্স", value: taka(summary.currentBalance), hint: "উত্তোলনযোগ্য", tone: "text-slate-900" },
  ];
  return (
    <div className="space-y-3">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">🧮 ব্যালেন্সের হিসাব</p>
        <ul className="mt-2 divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-2 py-2.5">
              <span className="min-w-0">
                <span className="block text-sm font-black text-slate-800">{r.label}</span>
                <span className="block truncate text-[11px] font-bold text-slate-400">{r.hint}</span>
              </span>
              <span className={`shrink-0 text-lg font-black ${r.tone}`}>{r.value}</span>
            </li>
          ))}
        </ul>
        <p className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold leading-relaxed text-slate-500">
          প্রতিদিন রাত ১২টায় ওই দিনের অনলাইন আয় লেজারে জমা হয়। আজকের অনলাইন (live) ব্যালেন্সে ধরা আছে। সুপার-অ্যাডমিন টাকা
          পাঠালেই ব্যালেন্স কমে যাবে।
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <PeriodCard
          title="📊 সাপ্তাহিক অনলাইন"
          range={`${bnDateLabel(summary.week.from)} → ${bnDateLabel(summary.week.to)}`}
          online={taka(summary.week.online.total)}
          onlineCount={summary.week.online.count}
        />
        <PeriodCard
          title="🗓️ মাসিক অনলাইন"
          range={summary.month.name}
          online={taka(summary.month.online.total)}
          onlineCount={summary.month.online.count}
        />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">📆 আজকের অনলাইন সেবা · {bnDateLabel(summary.today.date)}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-black text-blue-700">🌐 {taka(summary.today.online.total)} · {toBn(summary.today.online.count)} জন সেবা</span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black text-emerald-700">ব্যালেন্সে ধরা আছে</span>
        </div>
      </section>
    </div>
  );
}

function PeriodCard({
  title,
  range,
  online,
  onlineCount,
}: {
  title: string;
  range: string;
  online: string;
  onlineCount: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <p className="text-sm font-black text-slate-800">{title}</p>
      <p className="text-[11px] font-bold text-slate-400">{range}</p>
      <div className="mt-2 text-sm font-black">
        <p className="flex justify-between gap-2">
          <span className="text-blue-700">🌐 {toBn(onlineCount)} জন সেবা</span>
          <span className="text-blue-700">{online}</span>
        </p>
      </div>
    </div>
  );
}

/** দৈনিক লেজার: frozen days (latest first) + today-live row. Click-to-load pages. */
function LedgerTab({
  summary,
  days,
  page,
  loading,
  onPage,
}: {
  summary: BalanceSummary | null;
  days: DayList | null;
  page: number;
  loading: boolean;
  onPage: (p: number) => void;
}) {
  const list = days?.data ?? summary?.recentDays ?? [];
  const totalPages = days?.pagination.totalPages ?? 1;
  const totalOnline = days?.totalOnline ?? 0;
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black text-slate-800">📒 দৈনিক অনলাইন লেজার</p>
          <p className="text-[11px] font-bold text-slate-400">
            রাত ১২টায় দিন close হয় · লেজার মোট {taka(totalOnline)}
          </p>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPage(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-600 disabled:opacity-40"
              aria-label="আগের পাতা"
            >
              ←
            </button>
            <span className="text-xs font-black text-slate-500">{toBn(page)} / {toBn(totalPages)}</span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => onPage(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-600 disabled:opacity-40"
              aria-label="পরের পাতা"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Today live row */}
      {summary && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
          <span className="min-w-0">
            <span className="block text-sm font-black text-emerald-900">⚡ আজ · {bnDateLabel(summary.today.date)} (live)</span>
            <span className="block text-[11px] font-bold text-emerald-700/70">{toBn(summary.today.online.count)} জন সেবা · রাত ১২টায় close হবে</span>
          </span>
          <span className="shrink-0 text-lg font-black text-emerald-700">{taka(summary.today.online.total)}</span>
        </div>
      )}

      {loading && list.length === 0 ? (
        <p className="mt-3 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
      ) : list.length === 0 ? (
        <p className="mt-3 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">এখনো কোনো লেজার এন্ট্রি নেই।</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {list.map((d) => (
            <li
              key={`${d.kind}-${d.date}`}
              className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-2.5 ring-1 ring-slate-100"
            >
              <span className="min-w-0">
                <span className="block text-sm font-black text-slate-800">
                  {bnDateLabel(d.date)} {d.kind === "OPENING" && <span className="text-[10px] font-black text-slate-400">· শুরুর জমা</span>}
                </span>
                <span className="block text-[11px] font-bold text-slate-400">{toBn(d.onlineCount)} জন সেবা · closed</span>
              </span>
              <span className="shrink-0 text-base font-black text-slate-900">{taka(d.onlineTotal)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** পেমেন্ট হিস্ট্রি: super-admin transfers (latest first). Click-to-load pages. */
function PaymentsTab({
  summary,
  payouts,
  page,
  loading,
  onPage,
}: {
  summary: BalanceSummary | null;
  payouts: PayoutList | null;
  page: number;
  loading: boolean;
  onPage: (p: number) => void;
}) {
  const list = payouts?.data ?? summary?.recentPayouts ?? [];
  const totalPages = payouts?.pagination.totalPages ?? 1;
  const totalPaid = payouts?.totalPaid ?? summary?.payout.totalPaid ?? 0;
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black text-slate-800">💸 পেমেন্ট হিস্ট্রি</p>
          <p className="text-[11px] font-bold text-slate-400">মোট পরিশোধিত {taka(totalPaid)}</p>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPage(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-600 disabled:opacity-40"
              aria-label="আগের পাতা"
            >
              ←
            </button>
            <span className="text-xs font-black text-slate-500">{toBn(page)} / {toBn(totalPages)}</span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => onPage(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-600 disabled:opacity-40"
              aria-label="পরের পাতা"
            >
              →
            </button>
          </div>
        )}
      </div>
      {loading && list.length === 0 ? (
        <p className="mt-3 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
      ) : list.length === 0 ? (
        <p className="mt-3 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          এখনো কোনো পেআউট হয়নি — ব্যালেন্স পুরোটাই বকেয়া।
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {list.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-rose-50/60 px-4 py-2.5 ring-1 ring-rose-100"
            >
              <span className="min-w-0">
                <span className="block text-sm font-black text-slate-900">💸 {taka(p.amount)}</span>
                <span className="block truncate text-[11px] font-bold text-slate-500">
                  {bnDateLabel(p.paidAt.slice(0, 10))} · {p.method || "পেমেন্ট"} · {p.paidByName || "সুপার-অ্যাডমিন"}
                  {p.note ? ` · ${p.note}` : ""}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black text-emerald-700">
                পরিশোধিত
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
