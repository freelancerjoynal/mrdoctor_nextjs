"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toBn } from "@/lib/bn";
import { LocalBookingPanel } from "../local-booking/LocalBookingPanel";

type MainTab = "today" | "tomorrow" | "last30";
type SubTab = "ALL" | "ONLINE" | "OFFLINE";

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

interface ConfirmedRow {
  id: string;
  serial: number;
  patientName: string;
  patientType?: string | null;
  patientAge?: number | null;
  patientArea?: string | null;
  contactPhone: string;
  problem: string;
  appointmentDate: string;
  dayLabel?: string | null;
  chamberName?: string | null;
  hospitalName?: string | null;
  doctorName?: string | null;
  bookingType: "ONLINE" | "OFFLINE";
  collectionAmount?: number | null;
  paymentAmount?: number | null;
  amount: number;
  transactionId?: string | null;
  orderId?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
}

const TYPE_BN: Record<ConfirmedRow["bookingType"], string> = {
  ONLINE: "অনলাইন",
  OFFLINE: "অফলাইন",
};

const TYPE_CLS: Record<ConfirmedRow["bookingType"], string> = {
  ONLINE: "bg-violet-100 text-violet-800",
  OFFLINE: "bg-teal-100 text-teal-800",
};

function taka(n: number): string {
  return `৳${toBn(n)}`;
}

const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: "today", label: "আজকের অ্যাপয়েন্টমেন্ট" },
  { key: "tomorrow", label: "আগামীকালের অ্যাপয়েন্টমেন্ট" },
  { key: "last30", label: "গত ৩০ দিনের অ্যাপয়েন্টমেন্ট" },
];

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: "ALL", label: "সব" },
  { key: "ONLINE", label: "অনলাইন" },
  { key: "OFFLINE", label: "অফলাইন" },
];

async function confirmedApi(path: string, init?: RequestInit) {
  const res = await fetch(`/api/backend/api/users/appointments/confirmed${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as {
    data?: ConfirmedRow[];
    pagination?: { total?: number };
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return { rows: Array.isArray(data?.data) ? (data?.data ?? []) : [], total: data?.pagination?.total ?? 0 };
}

async function summaryApi(): Promise<Summary> {
  const res = await fetch("/api/backend/api/users/appointments/summary");
  const data = (await res.json().catch(() => null)) as { data?: Summary; error?: string } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as Summary;
}

/** Confirmed-only work panel: day tabs × type tabs, daily serials, new-booking popup. */
export function AppointmentsPanel({ isDoctor }: { isDoctor: boolean }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<ConfirmedRow[]>([]);
  const [counts, setCounts] = useState<Record<MainTab, number>>({ today: 0, tomorrow: 0, last30: 0 });
  const [mainTab, setMainTab] = useState<MainTab>("today");
  const [subTab, setSubTab] = useState<SubTab>("ALL");
  const [selected, setSelected] = useState<ConfirmedRow | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCounts = useCallback(async () => {
    const [t, m, l] = await Promise.all([
      confirmedApi("?range=today&bookingType=ALL&limit=1"),
      confirmedApi("?range=tomorrow&bookingType=ALL&limit=1"),
      confirmedApi("?range=last30&bookingType=ALL&limit=1"),
    ]);
    setCounts({ today: t.total, tomorrow: m.total, last30: l.total });
  }, []);

  const loadList = useCallback(async (main: MainTab, sub: SubTab) => {
    const { rows } = await confirmedApi(`?range=${main}&bookingType=${sub}&limit=50`);
    setRows(rows);
  }, []);

  const refresh = useCallback(
    async (main: MainTab, sub: SubTab, quiet = false) => {
      if (!quiet) setLoading(true);
      setError("");
      try {
        await Promise.all([loadList(main, sub), loadCounts(), summaryApi().then(setSummary)]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
      } finally {
        setLoading(false);
      }
    },
    [loadCounts, loadList],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ rows }, t, m, l, s] = await Promise.all([
          confirmedApi("?range=today&bookingType=ALL&limit=50"),
          confirmedApi("?range=today&bookingType=ALL&limit=1"),
          confirmedApi("?range=tomorrow&bookingType=ALL&limit=1"),
          confirmedApi("?range=last30&bookingType=ALL&limit=1"),
          summaryApi(),
        ]);
        if (cancelled) return;
        setRows(rows);
        setCounts({ today: t.total, tomorrow: m.total, last30: l.total });
        setSummary(s);
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
  }, []);

  const switchMain = (t: MainTab) => {
    setMainTab(t);
    setSelected(null);
    setLoading(true);
    setError("");
    loadList(t, subTab)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "লোড করা যায়নি।"))
      .finally(() => setLoading(false));
  };

  const switchSub = (s: SubTab) => {
    setSubTab(s);
    setSelected(null);
    setLoading(true);
    setError("");
    loadList(mainTab, s)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "লোড করা যায়নি।"))
      .finally(() => setLoading(false));
  };

  // After a popup booking: refresh the list quietly but keep the popup open
  // so staff can read the SMS receipt before closing it manually.
  const onBooked = () => {
    void refresh(mainTab, subTab, true);
  };

  return (
    <div className="space-y-5">
      {/* ---------- Today's collection (expected) ---------- */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-5 text-white shadow-xl sm:rounded-3xl sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/80 sm:text-sm">
              আজকের কালেকশন (সম্ভাব্য)
            </p>
            <p className="mt-1 text-3xl font-black tracking-tight sm:text-5xl">
              {summary ? taka(summary.todayExpected.total) : "…"}
            </p>
            {summary && (
              <p className="mt-2 text-sm text-white/85">
                মোট {toBn(summary.todayExpected.count)} জন · নতুন {toBn(summary.todayExpected.newCount)} · পুরনো{" "}
                {toBn(summary.todayExpected.renewCount)} · আদায় {taka(summary.todayDone.total)}
              </p>
            )}
          </div>
          <button
            onClick={() => setBookingOpen(true)}
            className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-emerald-700 shadow transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            ➕ নতুন অ্যাপয়েন্টমেন্ট
          </button>
        </div>
      </section>

      {error && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">{error}</p>
      )}

      {/* ---------- Income buckets ---------- */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <IncomeCard label="আজ আদায়" bucket={summary?.todayDone} loading={!summary} />
        <IncomeCard label="সাপ্তাহিক আয়" hint="গত ৭ দিন" bucket={summary?.week} loading={!summary} />
        {isDoctor && (
          <>
            <IncomeCard label="মাসিক আয়" hint="গত ৩০ দিন" bucket={summary?.month} loading={!summary} />
            <IncomeCard label="সর্বমোট আয়" hint="সবসময়" bucket={summary?.lifetime} loading={!summary} />
          </>
        )}
      </section>

      {/* ---------- Main tabs: confirmed only ---------- */}
      <div className="flex flex-wrap gap-2">
        {MAIN_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchMain(t.key)}
            className={`rounded-full px-4 py-2.5 text-sm font-bold transition sm:px-5 ${
              mainTab === t.key ? "bg-emerald-600 text-white shadow" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {t.label} ({toBn(counts[t.key])})
          </button>
        ))}
      </div>

      {/* ---------- Sub tabs: all / online / offline ---------- */}
      <div className="flex flex-wrap gap-2">
        {SUB_TABS.map((s) => (
          <button
            key={s.key}
            onClick={() => switchSub(s.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              subTab === s.key ? "bg-slate-900 text-white shadow" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ---------- Rows with daily serial ---------- */}
      {loading ? (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">লোড হচ্ছে…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
          এই তালিকায় কিছু নেই।
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => setSelected(r)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white">
                  {toBn(r.serial || 0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-black text-slate-900">{r.patientName}</span>
                  <span className="block truncate text-sm text-slate-500">📞 {r.contactPhone}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-black text-emerald-700">{taka(r.amount ?? 0)}</span>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${TYPE_CLS[r.bookingType]}`}
                  >
                    {TYPE_BN[r.bookingType]}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ---------- Detail popup ---------- */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label={selected.patientName}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 48, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white">
                    {toBn(selected.serial || 0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-black text-slate-900">{selected.patientName}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TYPE_CLS[selected.bookingType]}`}
                      >
                        {TYPE_BN[selected.bookingType]} · সিরিয়াল {toBn(selected.serial || 0)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                        {selected.patientType === "RENEW" ? "পুরনো রোগী" : "নতুন রোগী"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="বন্ধ করুন"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600 hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              <dl className="mt-4 space-y-2.5 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-100">
                <DetailRow label="মোবাইল" value={selected.contactPhone} />
                <DetailRow label="আদায়" value={taka(selected.amount ?? 0)} strong />
                <DetailRow label="সমস্যা" value={selected.problem} />
                {selected.dayLabel && <DetailRow label="তারিখ" value={selected.dayLabel} />}
                {selected.chamberName && <DetailRow label="চেম্বার" value={selected.chamberName} />}
                {selected.hospitalName && <DetailRow label="হাসপাতাল" value={selected.hospitalName} />}
                {selected.patientAge != null && <DetailRow label="বয়স" value={toBn(selected.patientAge)} />}
                {selected.patientArea && <DetailRow label="এলাকা" value={selected.patientArea} />}
                {selected.bookingType === "ONLINE" && (
                  <>
                    {selected.paymentMethod && <DetailRow label="মাধ্যম" value={selected.paymentMethod} />}
                    {selected.transactionId && <DetailRow label="ট্রানজেকশন" value={selected.transactionId} />}
                    {selected.orderId && <DetailRow label="অর্ডার" value={selected.orderId} />}
                  </>
                )}
              </dl>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- New appointment popup (offline local booking) ---------- */}
      <AnimatePresence>
        {bookingOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setBookingOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="নতুন অ্যাপয়েন্টমেন্ট"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-slate-50 p-4 shadow-2xl sm:rounded-2xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 48, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-lg font-black text-slate-900">➕ নতুন অ্যাপয়েন্টমেন্ট</p>
                <button
                  onClick={() => setBookingOpen(false)}
                  aria-label="বন্ধ করুন"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
              <LocalBookingPanel onSuccess={onBooked} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 font-bold text-slate-400">{label}</dt>
      <dd className={`text-right ${strong ? "font-black text-emerald-700" : "font-semibold text-slate-700"}`}>
        {value}
      </dd>
    </div>
  );
}

function IncomeCard({
  label,
  hint,
  bucket,
  loading,
}: {
  label: string;
  hint?: string;
  bucket?: { total: number; count: number } | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
        {loading || bucket === undefined ? "…" : bucket === null ? "—" : taka(bucket.total)}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        {hint ?? ""}
        {bucket ? ` · ${toBn(bucket.count)} জন` : ""}
      </p>
    </div>
  );
}
