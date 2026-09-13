"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toBn, bnDateLabel, BN_WEEKDAYS } from "@/lib/bn";
import { apiFetch } from "@/lib/auth/apiFetch";
import { doctorPortrait, fallbackAvatar } from "@/lib/profile";
import { LocalBookingPanel } from "../local-booking/LocalBookingPanel";

type MainTab = "today" | "tomorrow" | "last30";
type SubTab = "ALL" | "ONLINE" | "OFFLINE" | "DONE";
type RowAction = "done" | "delete" | "request";

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
  status: string;
  servedAt?: string | null;
  collectionAmount?: number | null;
  paymentAmount?: number | null;
  amount: number;
  transactionId?: string | null;
  orderId?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
}

interface DoctorInfo {
  name: string;
  degree?: string | null;
  speciality?: string | null;
  tagline?: string | null;
  profilePicture?: string | null;
  gender?: "MALE" | "FEMALE" | null;
  phone?: string | null;
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
  { key: "DONE", label: "✅ সেবা সম্পন্ন" },
];

async function confirmedApi(path: string, init?: RequestInit) {
  const res = await apiFetch(`/api/backend/api/users/appointments/confirmed${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as {
    data?: ConfirmedRow[];
    pagination?: { total?: number };
    counts?: { today?: number; tomorrow?: number; last30?: number };
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return {
    rows: Array.isArray(data?.data) ? (data?.data ?? []) : [],
    total: data?.pagination?.total ?? 0,
    counts: data?.counts ?? null,
  };
}

/** Served tab list (সেবা সম্পন্ন) — reads served_appointments. */
async function servedApi(range: MainTab) {
  const res = await apiFetch(`/api/backend/api/users/appointments/served?range=${range}&limit=50`);
  const data = (await res.json().catch(() => null)) as {
    data?: ConfirmedRow[];
    pagination?: { total?: number };
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return {
    rows: Array.isArray(data?.data) ? (data?.data ?? []) : [],
    total: data?.pagination?.total ?? 0,
  };
}

async function confirmedCountsApi(): Promise<Record<MainTab, number>> {
  const res = await apiFetch("/api/backend/api/users/appointments/confirmed/counts");
  const data = (await res.json().catch(() => null)) as {
    data?: { today?: number; tomorrow?: number; last30?: number };
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return {
    today: data?.data?.today ?? 0,
    tomorrow: data?.data?.tomorrow ?? 0,
    last30: data?.data?.last30 ?? 0,
  };
}

async function summaryApi(): Promise<Summary> {
  const res = await apiFetch("/api/backend/api/users/appointments/summary");
  const data = (await res.json().catch(() => null)) as { data?: Summary; error?: string } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as Summary;
}

/** Row actions: PATCH/DELETE one confirmed booking, or POST a cancel request. */
async function rowApi(url: string, method: string, body?: unknown) {
  const res = await apiFetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as {
    data?: unknown;
    message?: string;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "অনুরোধ ব্যর্থ হয়েছে।");
  return data;
}

interface CollectionSummary {
  today: string;
  /** Served today only — আজকের আয়. */
  todayBox: CollectionBucket;
  /** Confirmed today only — still pending service. */
  todayConfirmed?: CollectionBucket;
  /** Served + confirmed today — আজ আদায় (never drops on serve). */
  todayTotal?: CollectionBucket;
  week: { from: string; to: string } & CollectionBucket;
  month:
    | ({ year: number; month: number; name: string; from: string; to: string } & CollectionBucket)
    | null;
  lifetime: ({ joinedAt: string } & CollectionBucket) | null;
}

interface ChannelBucket {
  total: number;
  count: number;
}

interface CollectionBucket {
  total: number;
  count: number;
  online: ChannelBucket;
  offline: ChannelBucket;
}

async function collectionApi(): Promise<CollectionSummary> {
  const res = await apiFetch("/api/backend/api/users/appointments/collection/summary");
  const data = (await res.json().catch(() => null)) as {
    data?: CollectionSummary;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as CollectionSummary;
}

async function profileApi(): Promise<DoctorInfo | null> {
  const res = await apiFetch("/api/backend/api/users/profile");
  const data = (await res.json().catch(() => null)) as {
    profile?: {
      doctorProfile?: DoctorInfo | null;
      staffDoctor?: DoctorInfo | null;
    };
    error?: string;
  } | null;
  if (!res.ok) return null;
  return data?.profile?.staffDoctor ?? data?.profile?.doctorProfile ?? null;
}

/** Confirmed-only work panel: day tabs × type tabs, daily serials, new-booking popup. */
export function AppointmentsPanel({ isDoctor: _isDoctor }: { isDoctor: boolean }) {
  void _isDoctor;
  const [summary, setSummary] = useState<Summary | null>(null);
  const [collection, setCollection] = useState<CollectionSummary | null>(null);
  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [rows, setRows] = useState<ConfirmedRow[]>([]);
  const [counts, setCounts] = useState<Record<MainTab, number>>({ today: 0, tomorrow: 0, last30: 0 });
  const [mainTab, setMainTab] = useState<MainTab>("today");
  const [subTab, setSubTab] = useState<SubTab>("ALL");
  const [selected, setSelected] = useState<ConfirmedRow | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Upfront row actions: confirm popup + edit popup.
  const [confirmTarget, setConfirmTarget] = useState<{ row: ConfirmedRow; kind: RowAction } | null>(null);
  const [editRow, setEditRow] = useState<ConfirmedRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");

  const openEdit = (row: ConfirmedRow) => {
    setActionMsg("");
    setActionErr("");
    setEditName(row.patientName ?? "");
    setEditPhone(row.contactPhone ?? "");
    setEditDate(String(row.appointmentDate ?? "").slice(0, 10));
    setEditAmount(
      row.collectionAmount != null ? String(row.collectionAmount) : row.amount != null ? String(row.amount) : "",
    );
    setEditRow(row);
  };

  const openConfirm = (row: ConfirmedRow, kind: RowAction) => {
    setActionErr("");
    setConfirmTarget({ row, kind });
  };

  const loadCounts = useCallback(async () => {
    setCounts(await confirmedCountsApi());
  }, []);

  const loadList = useCallback(async (main: MainTab, sub: SubTab) => {
    if (sub === "DONE") {
      const { rows } = await servedApi(main);
      setRows(rows);
      return;
    }
    const { rows, counts } = await confirmedApi(`?range=${main}&bookingType=${sub}&limit=50`);
    setRows(rows);
    if (counts) {
      setCounts({
        today: counts.today ?? 0,
        tomorrow: counts.tomorrow ?? 0,
        last30: counts.last30 ?? 0,
      });
    }
  }, []);

  const refresh = useCallback(
    async (main: MainTab, sub: SubTab, quiet = false) => {
      if (!quiet) setLoading(true);
      setError("");
      try {
        await Promise.all([
          loadList(main, sub),
          loadCounts(),
          summaryApi().then(setSummary).catch(() => {}),
          collectionApi().then(setCollection).catch(() => {}),
        ]);
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
        const [{ rows, counts }, s, c, d] = await Promise.all([
          confirmedApi("?range=today&bookingType=ALL&limit=50"),
          summaryApi().catch(() => null),
          collectionApi().catch(() => null),
          profileApi().catch(() => null),
        ]);
        if (cancelled) return;
        setRows(rows);
        if (counts) {
          setCounts({
            today: counts.today ?? 0,
            tomorrow: counts.tomorrow ?? 0,
            last30: counts.last30 ?? 0,
          });
        }
        if (s) setSummary(s);
        if (c) setCollection(c);
        if (d) setDoctor(d);
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

  // Live counters: quietly re-pull tab counts + boxes every 30s and whenever
  // the tab regains focus, so bookings from any device show up by themselves.
  useEffect(() => {
    const tick = () => {
      loadCounts().catch(() => {});
      collectionApi()
        .then((c) => setCollection(c))
        .catch(() => {});
      summaryApi()
        .then((s) => setSummary(s))
        .catch(() => {});
    };
    const id = setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, [loadCounts]);

  // Last-30-days list grouped by day (only days that have rows appear).
  const dayGroups = useMemo(() => {
    if (mainTab !== "last30") return null;
    const map = new Map<string, ConfirmedRow[]>();
    for (const r of rows) {
      const key = String(r.appointmentDate).slice(0, 10);
      if (!key) continue;
      const list = map.get(key);
      if (list) list.push(r);
      else map.set(key, [r]);
    }
    return [...map.entries()].map(([date, list]) => ({ date, list }));
  }, [mainTab, rows]);

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

  /** Service-done / delete / cancel-request from the confirm popup. */
  const runConfirmAction = async () => {
    if (!confirmTarget || acting) return;
    const { row, kind } = confirmTarget;
    setActing(true);
    setActionMsg("");
    setActionErr("");
    try {
      const base = `/api/backend/api/users/appointments/confirmed/${row.id}`;
      if (kind === "done") {
        await rowApi(base, "PATCH", { status: "DONE" });
        setActionMsg("✓ সেবা সম্পন্ন — সেবা তালিকায় সরানো হয়েছে।");
      } else if (kind === "delete") {
        await rowApi(base, "DELETE");
        setActionMsg("🗑️ বুকিং ডিলিট হয়েছে (লোকাল বাতিল তালিকায় সেভ আছে)।");
      } else {
        await rowApi(`${base}/cancel-request`, "POST", {});
        setActionMsg("📩 রিকোয়েস্ট পাঠানো হয়েছে।");
      }
      setConfirmTarget(null);
      if (selected?.id === row.id) setSelected(null);
      void refresh(mainTab, subTab, true);
    } catch (err: unknown) {
      setActionErr(err instanceof Error ? err.message : "অনুরোধ ব্যর্থ হয়েছে।");
    } finally {
      setActing(false);
    }
  };

  /** Update from the edit popup. */
  const runEditSave = async () => {
    if (!editRow || acting) return;
    setActing(true);
    setActionMsg("");
    setActionErr("");
    try {
      const body: Record<string, unknown> = {};
      if (editName.trim() !== editRow.patientName) body.patientName = editName.trim();
      if (editPhone.trim() !== editRow.contactPhone) body.contactPhone = editPhone.trim();
      if (editDate && editDate !== String(editRow.appointmentDate).slice(0, 10)) {
        body.appointmentDate = editDate;
      }
      if (
        editRow.bookingType === "OFFLINE" &&
        editAmount.trim() !== "" &&
        Number(editAmount) !== Number(editRow.collectionAmount ?? editRow.amount ?? 0)
      ) {
        body.collectionAmount = Number(editAmount);
      }
      if (Object.keys(body).length === 0) throw new Error("বদলানোর মতো কিছু নেই।");
      await rowApi(`/api/backend/api/users/appointments/confirmed/${editRow.id}`, "PATCH", body);
      setActionMsg("✓ আপডেট হয়েছে।");
      setEditRow(null);
      void refresh(mainTab, subTab, true);
    } catch (err: unknown) {
      setActionErr(err instanceof Error ? err.message : "অনুরোধ ব্যর্থ হয়েছে।");
    } finally {
      setActing(false);
    }
  };

  const adayBox = collection?.todayTotal ?? collection?.todayBox ?? null;
  const incomeBox = collection?.todayBox ?? null;
  const todayTotal = adayBox ? adayBox.total : (summary?.todayExpected.total ?? 0);
  const todayCount = adayBox ? adayBox.count : (summary?.todayExpected.count ?? 0);
  const todayOnline = adayBox?.online;
  const todayOffline = adayBox?.offline;
  const doctorSubline = [doctor?.degree, doctor?.speciality].filter(Boolean).join(" · ");

  return (
    <div className="space-y-5">
      {/* ---------- Doctor + আজ আদায় hero ---------- */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 p-5 text-white shadow-xl sm:rounded-3xl sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Doctor identity */}
          <div className="flex min-w-0 items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- portrait may be any external doctor-uploaded URL */}
            <img
              src={doctorPortrait(doctor?.profilePicture)}
              alt={doctor?.name ?? "ডাক্তার"}
              className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white/40 object-cover shadow-lg sm:h-20 sm:w-20"
              onError={(e) => {
                const fallback = fallbackAvatar();
                if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback;
              }}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/75">
                🩺 চিকিৎসক
              </p>
              <p className="truncate text-xl font-black tracking-tight sm:text-2xl">
                {doctor?.name ?? "লোড হচ্ছে…"}
              </p>
              {doctorSubline && (
                <p className="mt-0.5 truncate text-sm font-semibold text-white/90">{doctorSubline}</p>
              )}
              {doctor?.tagline && (
                <p className="mt-0.5 truncate text-sm italic text-white/75">“{doctor.tagline}”</p>
              )}
            </div>
          </div>
          {/* আজ আদায় (served + confirmed — never decreases on serve) */}
          <div className="w-full max-w-md rounded-2xl bg-white/12 p-4 ring-1 ring-white/25 backdrop-blur sm:p-5 lg:text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">
              আজ আদায় · {collection ? bnDateLabel(collection.today) : "…"}
            </p>
            <p className="mt-1 text-3xl font-black tracking-tight sm:text-5xl">{taka(todayTotal)}</p>
            <p className="mt-2 text-sm text-white/85">
              মোট {toBn(todayCount)} জন
              {todayOnline && todayOffline && (
                <>
                  {" "}· অনলাইন {taka(todayOnline.total)} · অফলাইন {taka(todayOffline.total)}
                </>
              )}
            </p>
            {todayOnline && todayOffline && (
              <p className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold lg:justify-end">
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-white">
                  অনলাইন {toBn(todayOnline.count)} জন
                </span>
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-white">
                  অফলাইন {toBn(todayOffline.count)} জন
                </span>
              </p>
            )}
            {/* আজকের আয় — served today only */}
            <p className="mt-3 rounded-xl bg-black/15 px-3 py-2 text-sm font-bold text-white ring-1 ring-white/20">
              💰 আজকের আয় (সেবা সম্পন্ন):{" "}
              {incomeBox ? (
                <>
                  {taka(incomeBox.total)} · {toBn(incomeBox.count)} জন
                </>
              ) : (
                "…"
              )}
            </p>
            <button
              onClick={() => setBookingOpen(true)}
              className="mt-3 w-full rounded-xl bg-white px-5 py-2.5 text-sm font-black text-emerald-700 shadow transition hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
            >
              ➕ নতুন অ্যাপয়েন্টমেন্ট
            </button>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">{error}</p>
      )}
      {actionMsg && (
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
          {actionMsg}
        </p>
      )}
      {actionErr && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">
          {actionErr}
        </p>
      )}

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

      {/* ---------- Rows with upfront actions ---------- */}
      {loading ? (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">লোড হচ্ছে…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
          এই তালিকায় কিছু নেই।
        </p>
      ) : dayGroups ? (
        <div className="space-y-5">
          {dayGroups.map((g) => (
            <section key={g.date}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 px-1">
                <p className="text-sm font-black text-slate-800">📅 {dayHeader(g.date)}</p>
                <p className="text-xs font-bold text-slate-500">
                  {toBn(g.list.length)} জন · {taka(g.list.reduce((s, r) => s + (r.amount ?? 0), 0))}
                </p>
              </div>
              <ul className="space-y-2">
                {g.list.map((r) => (
                  <AppointmentRow
                    key={r.id}
                    r={r}
                    readonly={subTab === "DONE" || !!r.servedAt}
                    onPick={setSelected}
                    onDone={() => openConfirm(r, "done")}
                    onEdit={() => openEdit(r)}
                    onCancel={() => openConfirm(r, r.bookingType === "OFFLINE" ? "delete" : "request")}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <AppointmentRow
              key={r.id}
              r={r}
              readonly={subTab === "DONE" || !!r.servedAt}
              onPick={setSelected}
              onDone={() => openConfirm(r, "done")}
              onEdit={() => openEdit(r)}
              onCancel={() => openConfirm(r, r.bookingType === "OFFLINE" ? "delete" : "request")}
            />
          ))}
        </ul>
      )}

      {/* ---------- Detail popup (read-only) ---------- */}
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

      {/* ---------- Confirm popup (served / delete / cancel-request) ---------- */}
      <AnimatePresence>
        {confirmTarget && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => !acting && setConfirmTarget(null)}
            role="dialog"
            aria-modal="true"
            aria-label="নিশ্চিত করুন"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 48, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black text-white ${
                    confirmTarget.kind === "done"
                      ? "bg-emerald-600"
                      : confirmTarget.kind === "delete"
                        ? "bg-red-600"
                        : "bg-amber-500"
                  }`}
                >
                  {confirmTarget.kind === "done" ? "✓" : confirmTarget.kind === "delete" ? "🗑️" : "⚠️"}
                </span>
                <div>
                  <p className="text-lg font-black text-slate-900">
                    {confirmTarget.kind === "done"
                      ? "সেবা সম্পন্ন করবেন?"
                      : confirmTarget.kind === "delete"
                        ? "বুকিং ডিলিট করবেন?"
                        : "ক্যানসেল রিকোয়েস্ট পাঠাবেন?"}
                  </p>
                  <p className="text-sm font-semibold text-slate-500">
                    {confirmTarget.row.patientName} · সিরিয়াল {toBn(confirmTarget.row.serial || 0)} ·{" "}
                    {confirmTarget.row.contactPhone}
                  </p>
                </div>
              </div>
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-100">
                {confirmTarget.kind === "done" &&
                  "নিশ্চিত করলে এই বুকিং সেবা-সম্পন্ন তালিকায় চলে যাবে।"}
                {confirmTarget.kind === "delete" &&
                  "নিশ্চিত করলে অফলাইন বুকিংটি ডিলিট হবে (লোকাল বাতিল তালিকায় সেভ থাকবে)।"}
                {confirmTarget.kind === "request" &&
                  "নিশ্চিত করলে অনলাইন বুকিংয়ের ক্যানসেল রিকোয়েস্ট পাঠানো হবে। বুকিং অপরিবর্তিত থাকবে।"}
              </p>
              {actionErr && (
                <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 ring-1 ring-red-100">
                  {actionErr}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => void runConfirmAction()}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black text-white disabled:opacity-60 ${
                    confirmTarget.kind === "done"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : confirmTarget.kind === "delete"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {acting ? "প্রসেস হচ্ছে…" : "✓ নিশ্চিত করুন"}
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => setConfirmTarget(null)}
                  className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
                >
                  না, ফিরে যান
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Edit popup ---------- */}
      <AnimatePresence>
        {editRow && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => !acting && setEditRow(null)}
            role="dialog"
            aria-modal="true"
            aria-label="অ্যাপয়েন্টমেন্ট এডিট"
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
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-black text-slate-900">
                  ✏️ এডিট — {editRow.patientName} · সিরিয়াল {toBn(editRow.serial || 0)}
                </p>
                <button
                  onClick={() => setEditRow(null)}
                  aria-label="বন্ধ করুন"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600 hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 space-y-2.5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-500">রোগীর নাম</span>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={80}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-500">মোবাইল</span>
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    inputMode="tel"
                    maxLength={15}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </label>
                <div>
                  <span className="mb-1 block text-xs font-bold text-slate-500">তারিখ (আজ / আগামীকাল)</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1].map((off) => {
                      const d = new Date();
                      d.setDate(d.getDate() + off);
                      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => setEditDate(iso)}
                          className={`rounded-xl px-3 py-2 text-sm font-black ring-1 transition ${
                            editDate === iso
                              ? "bg-emerald-600 text-white ring-emerald-600"
                              : "bg-white text-slate-600 ring-slate-200"
                          }`}
                        >
                          {off === 0 ? "আজকে" : "আগামীকাল"}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {editRow.bookingType === "OFFLINE" && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">আদায়ের টাকা (৳)</span>
                    <input
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      inputMode="decimal"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </label>
                )}
                {actionErr && (
                  <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 ring-1 ring-red-100">
                    {actionErr}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => void runEditSave()}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {acting ? "সেভ হচ্ছে…" : "💾 সেভ করুন"}
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => setEditRow(null)}
                    className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
                  >
                    বাতিল
                  </button>
                </div>
              </div>
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

function dayHeader(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  const wd = BN_WEEKDAYS[new Date(y!, m! - 1, d!).getDay()] ?? "";
  return `${bnDateLabel(dateIso)} · ${wd}`;
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m4 10.5 4.5 4.5L16 5.5" />
    </svg>
  );
}

function PencilIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M13.5 3.5 16.5 6.5 7 16l-4 1 1-4L13.5 3.5Z" />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 5.5h14M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5.5 5.5l.8 10a1 1 0 0 0 1 .9h5.4a1 1 0 0 0 1-.9l.8-10" />
      <path d="M8.5 9v4.5M11.5 9v4.5" />
    </svg>
  );
}

function WarnIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10 2.5 2.8 15a1 1 0 0 0 .87 1.5h12.66a1 1 0 0 0 .87-1.5L10 2.5Z" />
      <path d="M10 8v3.5M10 13.8v.3" />
    </svg>
  );
}

/** Icon button with text-on-hover tooltip. */
function HoverAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className: string;
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${className}`}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}

function AppointmentRow({
  r,
  readonly,
  onPick,
  onDone,
  onEdit,
  onCancel,
}: {
  r: ConfirmedRow;
  readonly: boolean;
  onPick: (r: ConfirmedRow) => void;
  onDone: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <li className="flex w-full items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md sm:gap-3 sm:p-4">
      <button
        onClick={() => onPick(r)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-label={`${r.patientName} বিস্তারিত`}
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
      {readonly ? (
        <span className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
          ✓ সম্পন্ন
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <HoverAction
            label="সেবা সম্পন্ন"
            onClick={onDone}
            className="bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-700"
          >
            <CheckIcon />
          </HoverAction>
          <HoverAction
            label="এডিট"
            onClick={onEdit}
            className="bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
          >
            <PencilIcon />
          </HoverAction>
          {r.bookingType === "OFFLINE" ? (
            <HoverAction
              label="ডিলিট"
              onClick={onCancel}
              className="bg-red-50 text-red-700 ring-red-200 hover:bg-red-100"
            >
              <TrashIcon />
            </HoverAction>
          ) : (
            <HoverAction
              label="ক্যানসেল রিকোয়েস্ট"
              onClick={onCancel}
              className="bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100"
            >
              <WarnIcon />
            </HoverAction>
          )}
        </span>
      )}
    </li>
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
