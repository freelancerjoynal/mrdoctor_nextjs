"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toBn, bnDateLabel } from "@/lib/bn";
import { apiFetch } from "@/lib/auth/apiFetch";
import { doctorPortrait, fallbackAvatar } from "@/lib/profile";
import { Skeleton, SkeletonCards } from "@/components/dashboard/Skeleton";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchProfile } from "@/lib/store/profileSlice";
import { useRealtimeStream } from "@/lib/realtime/useRealtimeStream";
import { LocalBookingPanel } from "@/app/dashboard/local-booking/LocalBookingPanel";
import { CreditBalanceBadge } from "@/components/dashboard/CreditBalanceBadge";

type DayRange = "yesterday" | "today";

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoToday(): string {
  return isoLocal(new Date());
}

function isoYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return isoLocal(d);
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

interface CollectionSummary {
  today: string;
  tomorrow?: string;
  todayBox?: CollectionBucket;
  todayTotal?: CollectionBucket;
  tomorrowBox?: CollectionBucket;
  tomorrowTotal?: CollectionBucket;
  day?: ({ date: string } & CollectionBucket) | null;
}

interface StaffBucket {
  userId: string;
  name: string;
  count: number;
  total: number;
  confirmedCount: number;
  confirmedTotal: number;
  servedCount: number;
  servedTotal: number;
}

interface StaffRow {
  id: string;
  serial: number;
  patientName: string;
  contactPhone: string;
  problem: string;
  appointmentDate: string;
  served: boolean;
  amount: number;
  doctorId?: string | null;
  doctorName?: string | null;
  doctorSpeciality?: string | null;
}

interface StaffDoctorBreakdown {
  doctorId: string;
  doctorName: string;
  doctorSpeciality?: string | null;
  count: number;
  total: number;
  confirmedCount: number;
  confirmedTotal: number;
  servedCount: number;
  servedTotal: number;
}

function taka(n: number): string {
  return `৳${toBn(n)}`;
}

async function collectionApi(date?: string): Promise<CollectionSummary> {
  const q = date?.trim() ? `?date=${encodeURIComponent(date.trim())}` : "";
  const res = await apiFetch(`/api/backend/api/users/appointments/collection/summary${q}`);
  const data = (await res.json().catch(() => null)) as {
    data?: CollectionSummary;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as CollectionSummary;
}

async function staffApi(range: DayRange, date?: string | null): Promise<StaffBucket[]> {
  const q = date?.trim() ? `&date=${encodeURIComponent(date.trim())}` : "";
  const res = await apiFetch(`/api/backend/api/users/appointments/staff-collections?range=${range}${q}`);
  const data = (await res.json().catch(() => null)) as {
    data?: StaffBucket[];
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return Array.isArray(data?.data) ? (data?.data ?? []) : [];
}

async function staffRowsApi(
  range: DayRange,
  userId: string,
  date?: string | null,
): Promise<{ name: string; confirmed: StaffRow[]; served: StaffRow[]; byDoctor: StaffDoctorBreakdown[] }> {
  const q = date?.trim() ? `&date=${encodeURIComponent(date.trim())}` : "";
  const res = await apiFetch(
    `/api/backend/api/users/appointments/staff-collections/rows?range=${range}&userId=${encodeURIComponent(userId)}&limit=100${q}`,
  );
  const data = (await res.json().catch(() => null)) as {
    data?: { name: string; confirmed: StaffRow[]; served: StaffRow[]; byDoctor?: StaffDoctorBreakdown[] };
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return {
    name: data?.data?.name ?? "স্টাফ",
    confirmed: Array.isArray(data?.data?.confirmed) ? (data?.data?.confirmed ?? []) : [],
    served: Array.isArray(data?.data?.served) ? (data?.data?.served ?? []) : [],
    byDoctor: Array.isArray(data?.data?.byDoctor) ? (data?.data?.byDoctor ?? []) : [],
  };
}

/**
 * Hospital-desk home: stable hero + cash cards + booking.
 * No doctor filter here — figures always cover the whole hospital, so they
 * never shift when the appointments page filters by doctor.
 */
export function HospitalDeskDashboard() {
  const dispatch = useAppDispatch();
  const sessionProfile = useAppSelector((s) => s.profile.data);

  const [range, setRange] = useState<DayRange>("today");
  // Explicit calendar day (yyyy-mm-dd) from the date picker — wins over the tab.
  const [customDate, setCustomDate] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [collection, setCollection] = useState<CollectionSummary | null>(null);
  const [staffCols, setStaffCols] = useState<StaffBucket[]>([]);
  const [myRows, setMyRows] = useState<{
    name: string;
    confirmed: StaffRow[];
    served: StaffRow[];
    byDoctor: StaffDoctorBreakdown[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [myLoading, setMyLoading] = useState(false);
  // Day-switch shimmer: true while yesterday/today/custom-date data loads,
  // so figures never swap silently (background polling stays quiet).
  const [dayLoading, setDayLoading] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [staffView, setStaffView] = useState<{ userId: string; name: string } | null>(null);
  const [staffRows, setStaffRows] = useState<{
    name: string;
    confirmed: StaffRow[];
    served: StaffRow[];
    byDoctor: StaffDoctorBreakdown[];
  } | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffErr, setStaffErr] = useState("");

  const currentUserId = sessionProfile?.id ?? "";
  const todayIso = isoToday();
  const yesterdayIso = isoYesterday();
  // Effective calendar day: explicit picker date wins, else the active tab.
  const effectiveDate = customDate ?? (range === "today" ? todayIso : yesterdayIso);
  const isToday = !customDate && range === "today";
  // Card headline: আজকের / গতকালের / নির্দিষ্ট তারিখ.
  const dayBn = customDate ? bnDateLabel(customDate) : range === "today" ? "আজকের" : "গতকালের";

  const loadAll = useCallback(
    async (r: DayRange, day: string | null, userId: string, quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const summaryDate = day && day !== isoToday() ? day : undefined;
        const [c, sc] = await Promise.all([
          collectionApi(summaryDate).catch(() => null),
          staffApi(r, day).catch(() => [] as StaffBucket[]),
        ]);
        if (c) setCollection(c);
        setStaffCols(sc);
        if (userId) {
          setMyLoading(true);
          try {
            setMyRows(await staffRowsApi(r, userId, day));
          } catch {
            setMyRows(null);
          } finally {
            setMyLoading(false);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;
    const day = customDate ?? (range === "today" ? isoToday() : isoYesterday());
    const summaryDate = day !== isoToday() ? day : undefined;
    void (async () => {
      const [c, sc] = await Promise.all([
        collectionApi(summaryDate).catch(() => null),
        staffApi(range, day).catch(() => [] as StaffBucket[]),
      ]);
      if (cancelled) return;
      if (c) setCollection(c);
      setStaffCols(sc);
      setLoading(false);
      setMyLoading(true);
      try {
        const mine = await staffRowsApi(range, currentUserId, day);
        if (!cancelled) setMyRows(mine);
      } catch {
        if (!cancelled) setMyRows(null);
      } finally {
        if (!cancelled) {
          setMyLoading(false);
          setDayLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, range, customDate]);

  // Push-driven refresh: reload only when the server pushes an
  // `appointments` frame for this hospital (or on reconnect catch-up).
  // No polling timers — the hook owns visibility handling.
  useRealtimeStream({
    enabled: currentUserId !== "",
    url: "/api/stream",
    probeUrl: "/api/backend/api/users/appointments/staff-collections?range=today",
    onEvent: (types) => {
      if (!types.includes("appointments") || !currentUserId) return;
      const day = customDate ?? (range === "today" ? isoToday() : isoYesterday());
      void loadAll(range, day, currentUserId, true);
    },
  });

  const switchRange = (r: DayRange) => {
    if (dayLoading && range === r && !customDate) return;
    setDayLoading(true);
    setRange(r);
    setCustomDate(null);
    setDateInput("");
    setStaffView(null);
    setStaffRows(null);
  };

  /** Apply the picked calendar day (maps back to a tab when it matches). */
  const applyDate = () => {
    const picked = dateInput.trim();
    if (!picked) {
      setCustomDate(null);
      return;
    }
    setDayLoading(true);
    if (picked === isoToday()) {
      setRange("today");
      setCustomDate(null);
      setDateInput("");
    } else if (picked === isoYesterday()) {
      setRange("yesterday");
      setCustomDate(null);
      setDateInput("");
    } else {
      setCustomDate(picked);
    }
    setStaffView(null);
    setStaffRows(null);
  };

  const clearDate = () => {
    setDayLoading(true);
    setCustomDate(null);
    setDateInput("");
    setStaffView(null);
    setStaffRows(null);
  };

  const onBooked = () => {
    setBookingOpen(false);
    if (currentUserId) void loadAll(range, effectiveDate, currentUserId, true);
  };

  const openStaff = (bucket: StaffBucket) => {
    setStaffView({ userId: bucket.userId, name: bucket.name });
    setStaffRows(null);
    setStaffErr("");
    setStaffLoading(true);
    staffRowsApi(range, bucket.userId, effectiveDate)
      .then(setStaffRows)
      .catch((err: unknown) => setStaffErr(err instanceof Error ? err.message : "লোড করা যায়নি।"))
      .finally(() => setStaffLoading(false));
  };

  const hospitalInfo =
    sessionProfile?.role === "HOSPITAL_STAFF"
      ? (sessionProfile?.staffHospital ?? null)
      : sessionProfile?.role === "HOSPITAL"
        ? sessionProfile?.hospitalProfile
          ? {
              id: "",
              name: sessionProfile.hospitalProfile.name,
              slug: sessionProfile.hospitalProfile.slug ?? "",
            }
          : null
        : null;
  const staffName =
    sessionProfile?.name?.trim() ||
    sessionProfile?.email?.split("@")[0] ||
    (sessionProfile?.role === "HOSPITAL" ? (hospitalInfo?.name ?? "হাসপাতাল") : "হাসপাতাল স্টাফ");
  const staffRoleBn = sessionProfile?.role === "HOSPITAL" ? "হাসপাতাল" : "হাসপাতাল স্টাফ";
  const hospitalInitial = (hospitalInfo?.name?.trim().charAt(0) ?? "হ").toUpperCase();

  // Hospital-wide income for the effective day: today uses the live
  // todayTotal; any other day uses the explicit `day` box from the summary.
  const adayBox = isToday ? (collection?.todayTotal ?? null) : (collection?.day ?? null);
  const heroDate = isToday ? (collection?.today ?? todayIso) : effectiveDate;

  const myBucket = currentUserId ? (staffCols.find((b) => b.userId === currentUserId) ?? null) : null;
  const myTotal = myBucket?.total ?? 0;
  const myCount = myBucket?.count ?? 0;
  const myConfirmedTotal = myBucket?.confirmedTotal ?? 0;
  const myConfirmedCount = myBucket?.confirmedCount ?? 0;
  const myServedTotal = myBucket?.servedTotal ?? 0;
  const myServedCount = myBucket?.servedCount ?? 0;
  const myByDoctor = myRows?.byDoctor ?? [];
  const deskTotal = staffCols.reduce((s, b) => s + (b.total ?? 0), 0);
  const deskCount = staffCols.reduce((s, b) => s + (b.count ?? 0), 0);
  const heroLoading = loading && staffCols.length === 0 && !myRows;

  return (
    <div className="space-y-5">
      {/* ---------- Range switch: yesterday / today + specific date (hospital-wide, stable) ---------- */}
      <div className="flex flex-wrap items-center gap-2">
        {(["yesterday", "today"] as DayRange[]).map((r) => (
          <button
            key={r}
            onClick={() => switchRange(r)}
            disabled={dayLoading}
            className={`rounded-full px-4 py-2.5 text-sm font-bold transition disabled:opacity-60 sm:px-5 ${
              !customDate && range === r
                ? "bg-violet-600 text-white shadow"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {r === "today" ? "আজকের হিসাব" : "গতকালের হিসাব"}
          </button>
        ))}
        <label className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
          <span>📅 তারিখ</span>
          <input
            type="date"
            value={dateInput}
            max={todayIso}
            onChange={(e) => setDateInput(e.target.value)}
            className="rounded-full bg-slate-50 px-2 py-1 text-sm font-bold text-slate-800 focus:outline-none"
          />
          <button
            type="button"
            onClick={applyDate}
            disabled={!dateInput || dayLoading}
            className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-black text-white shadow transition hover:bg-violet-700 disabled:opacity-40"
          >
            {dayLoading ? "…" : "দেখুন"}
          </button>
        </label>
        {customDate && (
          <button
            type="button"
            onClick={clearDate}
            className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200"
          >
            ✕ {bnDateLabel(customDate)}
          </button>
        )}
      </div>

      {/* ---------- Hospital-desk hero ---------- */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-800 via-violet-700 to-fuchsia-600 p-5 text-white shadow-xl sm:rounded-3xl sm:p-7">
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-56 w-56 rounded-full bg-black/10 blur-2xl" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/25 backdrop-blur sm:p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-black text-violet-700 shadow">
              {hospitalInitial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">🏥 হাসপাতাল ডেস্ক</p>
              <p className="truncate text-lg font-black tracking-tight sm:text-xl">{hospitalInfo?.name ?? "হাসপাতাল"}</p>
              {hospitalInfo?.slug?.trim() && (
                <p className="truncate text-xs font-bold text-white/70">
                  @{hospitalInfo.slug.trim()} · {heroDate ? bnDateLabel(heroDate) : ""}
                </p>
              )}
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white">{staffRoleBn}</span>
            <CreditBalanceBadge />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="flex min-w-0 items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/25 backdrop-blur">
              {heroLoading && !sessionProfile ? (
                <Skeleton light className="h-20 w-20 shrink-0 !rounded-2xl" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element -- staff photo may be any external uploaded URL */
                <img
                  src={doctorPortrait(sessionProfile?.profilePicture)}
                  alt={staffName}
                  className="h-20 w-20 shrink-0 rounded-2xl border-2 border-white/40 object-cover shadow-lg"
                  onError={(e) => {
                    const fallback = fallbackAvatar();
                    if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback;
                  }}
                />
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">🧑‍⚕️ {staffRoleBn}</p>
                <p className="truncate text-xl font-black tracking-tight sm:text-2xl">{staffName}</p>
                {sessionProfile?.email && (
                  <p className="truncate text-xs font-bold text-white/70">{sessionProfile.email}</p>
                )}
                <p className="mt-1 text-xs font-bold text-white/85">
                  🆔 {sessionProfile?.id ? `${sessionProfile.id.slice(0, 8)}…` : "—"} ·{" "}
                  {sessionProfile?.isVerified ? "✓ যাচাইকৃত" : "অপেক্ষমাণ"}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 text-slate-900 shadow-lg sm:p-5">
              <p className="text-[11px] font-black uppercase tracking-widest text-violet-600">
                💵 আমার {dayBn} কালেকশন (ক্যাশ)
              </p>
              {dayLoading || (heroLoading && !myRows && !myBucket) ? (
                <div className="mt-2 space-y-2" aria-label="লোড হচ্ছে">
                  <Skeleton className="h-9 w-44" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ) : (
                <>
                  <p className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{taka(myTotal)}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    মোট {toBn(myCount)} জন · বাকি {toBn(myConfirmedCount)} ({taka(myConfirmedTotal)}) · সম্পন্ন{" "}
                    {toBn(myServedCount)} ({taka(myServedTotal)})
                  </p>
                  <p className="mt-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-800 ring-1 ring-violet-100">
                    🏥 ডেস্ক মোট ({dayBn} · সব স্টাফ): {taka(deskTotal)} · {toBn(deskCount)} জন
                    {adayBox ? (
                      <>
                        {" "}· হাসপাতাল আদায়: {taka(adayBox.total)} · {toBn(adayBox.count)} জন
                      </>
                    ) : null}
                  </p>
                </>
              )}
              <button
                onClick={() => setBookingOpen(true)}
                className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-black text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
              >
                ➕ নতুন অ্যাপয়েন্টমেন্ট
              </button>
            </div>
          </div>
          <div className="rounded-2xl bg-black/15 p-4 ring-1 ring-white/20">
            <p className="text-sm font-black text-white">
              🩺 কোন ডাক্তারের জন্য কত ({dayBn}) — আমি নিয়েছি
            </p>
            {dayLoading || (myLoading && !myRows) ? (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="লোড হচ্ছে">
                <Skeleton light className="h-20 w-full" />
                <Skeleton light className="h-20 w-full" />
              </div>
            ) : myByDoctor.length === 0 ? (
              <p className="mt-2 rounded-xl bg-white/10 px-3 py-3 text-center text-sm font-bold text-white/80">
                {dayBn} জন্য আপনার নামে কোনো ক্যাশ বুকিং নেই।
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {myByDoctor.map((d) => (
                  <li key={d.doctorId} className="rounded-xl bg-white p-3 text-slate-900 shadow ring-1 ring-white/30">
                    <p className="truncate text-sm font-black">🩺 {d.doctorName}</p>
                    {d.doctorSpeciality && (
                      <p className="truncate text-xs font-bold text-slate-500">{d.doctorSpeciality}</p>
                    )}
                    <p className="mt-1 text-xl font-black text-violet-700">{taka(d.total)}</p>
                    <p className="text-xs font-bold text-slate-500">
                      {toBn(d.count)} জন · বাকি {toBn(d.confirmedCount)} · সম্পন্ন {toBn(d.servedCount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Cash cards: who collected how much (hospital-wide) ---------- */}
      {dayLoading ? (
        <section aria-label="লোড হচ্ছে">
          <Skeleton className="mb-2 h-4 w-56" />
          <SkeletonCards count={4} />
        </section>
      ) : (
        staffCols.length > 0 && (
        <section>
          <p className="mb-2 px-1 text-sm font-black text-slate-800">💵 ক্যাশ কালেকশন — কে কত নিয়েছে (অফলাইন)</p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {staffCols.map((b) => {
              const isMe = currentUserId !== "" && b.userId === currentUserId;
              return (
                <button
                  key={b.userId}
                  type="button"
                  onClick={() => openStaff(b)}
                  title={`${b.name}-এর বুকিং দেখুন`}
                  className={
                    isMe
                      ? "rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-4 text-left text-white shadow-lg ring-2 ring-violet-300 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-5"
                      : "rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-4 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:p-5"
                  }
                >
                  <p className="truncate text-sm font-black">
                    🧾 {b.name}
                    {isMe && (
                      <span className="ml-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-violet-700">
                        আমি
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{taka(b.total)}</p>
                  <p className="mt-0.5 text-xs font-bold text-white/90">
                    {toBn(b.count)} জন · বাকি {toBn(b.confirmedCount)} · সম্পন্ন {toBn(b.servedCount)}
                  </p>
                  <p className="mt-1.5 text-[11px] font-black text-white underline decoration-white/50 underline-offset-4">
                    বুকিং দেখুন 👆
                  </p>
                </button>
              );
            })}
          </div>
        </section>
        )
      )}

      {/* ---------- Staff cash popup ---------- */}
      <AnimatePresence>
        {staffView && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/60 px-3 pb-6 pt-20 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => !staffLoading && setStaffView(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`${staffView.name}-এর বুকিং`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="max-h-[calc(100dvh-110px)] sm:max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-lg font-black text-slate-900">🧾 {staffRows?.name ?? staffView.name}</p>
                <button
                  onClick={() => setStaffView(null)}
                  aria-label="বন্ধ করুন"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600 hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>
              {staffLoading ? (
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
              ) : staffErr ? (
                <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">
                  {staffErr}
                </p>
              ) : staffRows ? (
                <div className="mt-3 space-y-4">
                  {staffRows.byDoctor.length > 0 && (
                    <section className="rounded-2xl bg-violet-50 p-3 ring-1 ring-violet-100">
                      <p className="px-1 text-sm font-black text-violet-900">🩺 কোন ডাক্তারের জন্য কত</p>
                      <ul className="mt-2 space-y-1.5">
                        {staffRows.byDoctor.map((d) => (
                          <li
                            key={d.doctorId}
                            className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-violet-100"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-slate-900">{d.doctorName}</span>
                              <span className="block truncate text-[11px] font-bold text-slate-500">
                                {toBn(d.count)} জন · বাকি {toBn(d.confirmedCount)} · সম্পন্ন {toBn(d.servedCount)}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-black text-violet-700">{taka(d.total)}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  <section>
                    <p className="mb-1.5 px-1 text-sm font-black text-slate-700">
                      ⏳ বাকি ({toBn(staffRows.confirmed.length)} জন ·{" "}
                      {taka(staffRows.confirmed.reduce((s, r) => s + (r.amount ?? 0), 0))})
                    </p>
                    {staffRows.confirmed.length === 0 ? (
                      <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">কোনো বাকি বুকিং নেই।</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {staffRows.confirmed.map((r) => (
                          <li
                            key={r.id}
                            className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-slate-900">
                                {toBn(r.serial)} · {r.patientName}
                              </span>
                              <span className="block truncate text-[11px] font-bold text-slate-500">
                                📞 {r.contactPhone}
                                {r.doctorName ? ` · 🩺 ${r.doctorName}` : ""}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-black text-slate-700">{taka(r.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  <section>
                    <p className="mb-1.5 px-1 text-sm font-black text-slate-700">
                      ✓ সেবা সম্পন্ন ({toBn(staffRows.served.length)} জন ·{" "}
                      {taka(staffRows.served.reduce((s, r) => s + (r.amount ?? 0), 0))})
                    </p>
                    {staffRows.served.length === 0 ? (
                      <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">
                        কোনো সম্পন্ন বুকিং নেই।
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {staffRows.served.map((r) => (
                          <li
                            key={r.id}
                            className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-slate-900">
                                {toBn(r.serial)} · {r.patientName}
                              </span>
                              <span className="block truncate text-[11px] font-bold text-slate-500">
                                📞 {r.contactPhone}
                                {r.doctorName ? ` · 🩺 ${r.doctorName}` : ""}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-black text-emerald-700">{taka(r.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- New appointment popup ---------- */}
      <AnimatePresence>
        {bookingOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/60 px-3 pb-6 pt-20 backdrop-blur-sm sm:items-center sm:p-6"
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
              className="max-h-[calc(100dvh-110px)] sm:max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-slate-50 p-4 shadow-2xl sm:rounded-2xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
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
