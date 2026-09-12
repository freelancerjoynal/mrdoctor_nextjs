"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toBn } from "@/lib/bn";

type Status = "PENDING" | "CONFIRMED" | "DONE" | "CANCELLED";
type Tab = "today" | "upcoming" | "pending" | "last30";

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

interface Row {
  id: string;
  patientName: string;
  patientType?: string | null;
  patientAge?: number | null;
  patientWeight?: number | null;
  patientArea?: string | null;
  contactPhone: string;
  problem: string;
  appointmentDate: string;
  dayLabel?: string | null;
  chamberName?: string | null;
  hospitalName?: string | null;
  doctorName?: string | null;
  status: Status;
  fee?: number;
}

const STATUS_BN: Record<Status, string> = {
  PENDING: "বিচারাধীন",
  CONFIRMED: "নিশ্চিত",
  DONE: "সম্পন্ন",
  CANCELLED: "বাতিল",
};

const STATUS_CLS: Record<Status, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  DONE: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-slate-200 text-slate-500",
};

function taka(n: number): string {
  return `৳${toBn(n)}`;
}

function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoShift(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "today", label: "আজকের" },
  { key: "upcoming", label: "আসন্ন" },
  { key: "pending", label: "পেন্ডিং অনুরোধ" },
  { key: "last30", label: "গত ৩০ দিন" },
];

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`/api/backend/api/users/appointments${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as {
    data?: unknown;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data;
}

function rowsOf(payload: unknown): Row[] {
  if (Array.isArray(payload)) return payload as Row[];
  const list = (payload as { data?: Row[] })?.data;
  return Array.isArray(list) ? list : [];
}

async function fetchTab(tab: Tab): Promise<Row[]> {
  if (tab === "today") return rowsOf(await api("/today"));
  if (tab === "upcoming") {
    // From tomorrow onward, nearest first.
    const list = rowsOf(await api(`?from=${isoShift(1)}&limit=50`));
    return [...list].sort((a, b) => +new Date(a.appointmentDate) - +new Date(b.appointmentDate));
  }
  if (tab === "last30") return rowsOf(await api(`?from=${isoShift(-29)}&to=${isoToday()}&limit=50`));
  return rowsOf(await api("?status=PENDING&limit=50"));
}

/** Doctor/staff work panel: compact rows open a full-detail popup. */
export function AppointmentsPanel({ isDoctor }: { isDoctor: boolean }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<Tab, number>>({ today: 0, upcoming: 0, pending: 0, last30: 0 });
  const [tab, setTab] = useState<Tab>("today");
  const [selected, setSelected] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const loadTab = useCallback(async (t: Tab, quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const [list, s] = await Promise.all([
        fetchTab(t),
        api("/summary") as Promise<Summary>,
      ]);
      setRows(list);
      setSummary(s);
      if (!quiet) {
        const [todayL, upL, pendL, lastL] = await Promise.all([
          fetchTab("today"),
          fetchTab("upcoming"),
          fetchTab("pending"),
          fetchTab("last30"),
        ]);
        setCounts({ today: todayL.length, upcoming: upL.length, pending: pendL.length, last30: lastL.length });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, u, p, l, s] = await Promise.all([
          fetchTab("today"),
          fetchTab("upcoming"),
          fetchTab("pending"),
          fetchTab("last30"),
          api("/summary") as Promise<Summary>,
        ]);
        if (cancelled) return;
        setRows(t);
        setCounts({ today: t.length, upcoming: u.length, pending: p.length, last30: l.length });
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

  const switchTab = (t: Tab) => {
    setTab(t);
    setSelected(null);
    void loadTab(t);
  };

  const setStatus = async (id: string, status: Status) => {
    if (acting) return;
    setActing(id);
    try {
      const updated = (await api(`/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })) as Row;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: updated.status ?? status } : r)));
      setSelected((prev) => (prev && prev.id === id ? { ...prev, status: updated.status ?? status } : prev));
      // Refresh counts + summary quietly so collection stays correct.
      const [lists, s] = await Promise.all([
        Promise.all([fetchTab("today"), fetchTab("upcoming"), fetchTab("pending"), fetchTab("last30")]),
        api("/summary") as Promise<Summary>,
      ]);
      const byTab: Record<Tab, Row[]> = { today: lists[0], upcoming: lists[1], pending: lists[2], last30: lists[3] };
      setRows(byTab[tab]);
      setCounts({ today: lists[0].length, upcoming: lists[1].length, pending: lists[2].length, last30: lists[3].length });
      setSummary(s);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "আপডেট করা যায়নি।");
    } finally {
      setActing(null);
    }
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
          <div className="group relative">
            <span
              className="flex h-8 w-8 cursor-help items-center justify-center rounded-full bg-white/20 text-base font-bold"
              aria-label="নোট"
            >
              !
            </span>
            <div className="pointer-events-none absolute right-0 top-10 z-10 w-56 rounded-xl bg-slate-900 p-3 text-xs leading-relaxed text-white opacity-0 shadow-2xl transition group-hover:opacity-100">
              এই অঙ্ক পরিবর্তন হতে পারে, কারণ যেকোনো অ্যাপয়েন্টমেন্টের অবস্থা বদলাতে পারে।
            </div>
          </div>
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

      {/* ---------- Tabs ---------- */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`rounded-full px-4 py-2.5 text-sm font-bold transition sm:px-5 ${
              tab === t.key ? "bg-emerald-600 text-white shadow" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {t.label} ({toBn(counts[t.key])})
          </button>
        ))}
      </div>

      {/* ---------- Compact rows: name · mobile · amount ---------- */}
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
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-800">
                  {(r.patientName.trim()[0] || "অ").toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-black text-slate-900">{r.patientName}</span>
                  <span className="block truncate text-sm text-slate-500">📞 {r.contactPhone}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-black text-emerald-700">{r.fee != null ? taka(r.fee) : "—"}</span>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_CLS[r.status]}`}
                  >
                    {STATUS_BN[r.status]}
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
                <div>
                  <p className="text-xl font-black text-slate-900">{selected.patientName}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLS[selected.status]}`}>
                      {STATUS_BN[selected.status]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                      {selected.patientType === "RENEW" ? "পুরনো রোগী" : "নতুন রোগী"}
                    </span>
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
                <DetailRow label="পেমেন্ট" value={selected.fee != null ? taka(selected.fee) : "—"} strong />
                <DetailRow label="সমস্যা" value={selected.problem} />
                {selected.dayLabel && <DetailRow label="তারিখ" value={selected.dayLabel} />}
                {selected.chamberName && <DetailRow label="চেম্বার" value={selected.chamberName} />}
                {selected.hospitalName && <DetailRow label="হাসপাতাল" value={selected.hospitalName} />}
                {selected.patientAge != null && <DetailRow label="বয়স" value={toBn(selected.patientAge)} />}
                {selected.patientWeight != null && (
                  <DetailRow label="ওজন" value={`${toBn(selected.patientWeight)} কেজি`} />
                )}
                {selected.patientArea && <DetailRow label="এলাকা" value={selected.patientArea} />}
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                {selected.status === "PENDING" && (
                  <button
                    disabled={acting === selected.id}
                    onClick={() => void setStatus(selected.id, "CONFIRMED")}
                    className="flex-1 rounded-xl bg-sky-600 px-4 py-2.5 font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    নিশ্চিত করুন
                  </button>
                )}
                {(selected.status === "PENDING" || selected.status === "CONFIRMED") && (
                  <button
                    disabled={acting === selected.id}
                    onClick={() => void setStatus(selected.id, "DONE")}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    সম্পন্ন
                  </button>
                )}
                {selected.status !== "CANCELLED" && selected.status !== "DONE" && (
                  <button
                    disabled={acting === selected.id}
                    onClick={() => void setStatus(selected.id, "CANCELLED")}
                    className="flex-1 rounded-xl px-4 py-2.5 font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
                  >
                    বাতিল
                  </button>
                )}
              </div>
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
