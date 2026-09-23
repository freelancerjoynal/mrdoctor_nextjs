"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toBn, bnDateLabel, BN_WEEKDAYS } from "@/lib/bn";
import { apiFetch } from "@/lib/auth/apiFetch";
import { isAdminRole } from "@/lib/auth/types";
import { doctorPortrait, fallbackAvatar } from "@/lib/profile";
import { Skeleton, SkeletonCards, SkeletonRows } from "@/components/dashboard/Skeleton";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchProfile } from "@/lib/store/profileSlice";
import { buildPortalUrl } from "@/lib/portal";
import { useRealtimeStream } from "@/lib/realtime/useRealtimeStream";
import { LocalBookingPanel } from "../local-booking/LocalBookingPanel";
import { CreditBalanceBadge } from "@/components/dashboard/CreditBalanceBadge";

type MainTab = "today" | "tomorrow" | "last30";
type SubTab = "ALL" | "ONLINE" | "OFFLINE" | "DONE";
type RowAction = "done" | "delete" | "request";

/** Punishment clock: a skipped serial returns to the board after 20 minutes. */
const RECALL_COOLDOWN_MS = 20 * 60 * 1000;

interface LiveMissed {
  serial: number;
  patientName: string;
  skippedAt?: string | null;
}

/** Doctor break ("বিরতি") as returned by the live API. */
interface LiveBreakState {
  reason: string;
  endsAt: string | null;
}

/** ms left on the 20-minute punishment clock (null = no recorded skip → recallable now). */
function cooldownRemainingMs(skippedAt?: string | null): number | null {
  if (!skippedAt) return null;
  const t = new Date(skippedAt).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, RECALL_COOLDOWN_MS - (Date.now() - t));
}

/** "৩:৪৫" style back-by time for a break ISO timestamp ("" when open-ended). */
function breakBackBn(endsAt?: string | null): string {
  if (!endsAt) return "";
  const d = new Date(endsAt);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${toBn(p(d.getHours()))}:${toBn(p(d.getMinutes()))}`;
}

/** Active break or null — an expired return time reads as "no break". */
function activeBreak(
  live: { live: boolean; break: LiveBreakState | null } | null,
): LiveBreakState | null {
  if (!live?.live || !live.break) return null;
  if (live.break.endsAt && new Date(live.break.endsAt).getTime() <= Date.now()) return null;
  return live.break;
}

/** "৫ মিনিট আগে মিস" style label for a skip timestamp. */
function missedAgoBn(skippedAt?: string | null): string {
  if (!skippedAt) return "সময় রেকর্ড নেই";
  const t = new Date(skippedAt).getTime();
  if (Number.isNaN(t)) return "সময় রেকর্ড নেই";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "এইমাত্র মিস";
  return `${toBn(mins)} মিনিট আগে মিস`;
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
  chamberId?: string | null;
  chamberName?: string | null;
  hospitalName?: string | null;
  doctorName?: string | null;
  bookingType: "ONLINE" | "OFFLINE";
  status: string;
  servedAt?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  collectionAmount?: number | null;
  paymentAmount?: number | null;
  amount: number;
  transactionId?: string | null;
  orderId?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
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

/**
 * Local calendar day (yyyy-mm-dd) of a stored date.
 * Never slice ISO strings — midnight local time is the previous day in UTC,
 * which showed phantom "backward" days (e.g. today's booking as yesterday).
 */
function localIso(input: string | Date | null | undefined): string {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: "today", label: "আজকের অ্যাপয়েন্টমেন্ট" },
  // TODO: re-enable tomorrow list later — button temporarily hidden.
  // { key: "tomorrow", label: "আগামীকালের অ্যাপয়েন্টমেন্ট" },
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

/** Served list (সেবা সম্পন্ন) — reads served_appointments, channel-filterable. */
async function servedApi(range: MainTab, bookingType: SubTab = "ALL", doctorId?: string) {
  const type = bookingType === "ONLINE" || bookingType === "OFFLINE" ? bookingType : "ALL";
  const doctorQ = doctorId?.trim() ? `&doctorId=${encodeURIComponent(doctorId.trim())}` : "";
  const res = await apiFetch(
    `/api/backend/api/users/appointments/served?range=${range}&bookingType=${type}&limit=50${doctorQ}`,
  );
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

async function confirmedCountsApi(doctorId?: string): Promise<Record<MainTab, number>> {
  const doctorQ = doctorId?.trim() ? `?doctorId=${encodeURIComponent(doctorId.trim())}` : "";
  const res = await apiFetch(`/api/backend/api/users/appointments/confirmed/counts${doctorQ}`);
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

/** Served counters — the last30 tab counts served history, not pending queue. */
async function servedCountsApi(doctorId?: string): Promise<Record<MainTab, number>> {
  const doctorQ = doctorId?.trim() ? `?doctorId=${encodeURIComponent(doctorId.trim())}` : "";
  const res = await apiFetch(`/api/backend/api/users/appointments/served/counts${doctorQ}`);
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
  tomorrow?: string;
  /** Served today only — আজকের আয়. */
  todayBox: CollectionBucket;
  /** Confirmed today only — still pending service. */
  todayConfirmed?: CollectionBucket;
  /** Served + confirmed today — আজ আদায় (never drops on serve). */
  todayTotal?: CollectionBucket;
  /** Served tomorrow only. */
  tomorrowBox?: CollectionBucket;
  /** Confirmed tomorrow only. */
  tomorrowConfirmed?: CollectionBucket;
  /** Served + confirmed tomorrow — আগামীকালের কালেকশন. */
  tomorrowTotal?: CollectionBucket;
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

async function collectionApi(doctorId?: string): Promise<CollectionSummary> {
  const doctorQ = doctorId?.trim() ? `?doctorId=${encodeURIComponent(doctorId.trim())}` : "";
  const res = await apiFetch(`/api/backend/api/users/appointments/collection/summary${doctorQ}`);
  const data = (await res.json().catch(() => null)) as {
    data?: CollectionSummary;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as CollectionSummary;
}

/** Per-taker OFFLINE (cash) totals for the range. */
async function staffApi(range: MainTab, doctorId?: string): Promise<StaffBucket[]> {
  const doctorQ = doctorId?.trim() ? `&doctorId=${encodeURIComponent(doctorId.trim())}` : "";
  const res = await apiFetch(`/api/backend/api/users/appointments/staff-collections?range=${range}${doctorQ}`);
  const data = (await res.json().catch(() => null)) as {
    data?: StaffBucket[];
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return Array.isArray(data?.data) ? (data?.data ?? []) : [];
}

/** OFFLINE rows taken by one staff in the range (+ per-doctor breakdown). */
async function staffRowsApi(
  range: MainTab,
  userId: string,
  doctorId?: string,
): Promise<{ name: string; confirmed: StaffRow[]; served: StaffRow[]; byDoctor: StaffDoctorBreakdown[] }> {
  const doctorQ = doctorId?.trim() ? `&doctorId=${encodeURIComponent(doctorId.trim())}` : "";
  const res = await apiFetch(
    `/api/backend/api/users/appointments/staff-collections/rows?range=${range}&userId=${encodeURIComponent(userId)}&limit=100${doctorQ}`,
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

/** Confirmed-only work panel: day tabs × type tabs, daily serials, new-booking popup. */
export function AppointmentsPanel({ isDoctor: _isDoctor }: { isDoctor: boolean }) {
  void _isDoctor;
  const dispatch = useAppDispatch();
  // Doctor identity + approval right from the Redux session cache
  // (fetched once per login, shared by all panels — no refetch on revisit).
  const sessionProfile = useAppSelector((s) => s.profile.data);
  const doctor = sessionProfile?.staffDoctor ?? sessionProfile?.doctorProfile ?? null;
  const isHospitalDesk = sessionProfile?.role === "HOSPITAL" || sessionProfile?.role === "HOSPITAL_STAFF";
  // Doctor dropdown: hospital_staff only (hospital desk operators manage
  // specific doctors' appointment lists — doctors/staff never see this).
  const isHospitalStaff = sessionProfile?.role === "HOSPITAL_STAFF";
  // Serve lock: only the doctor may mark service-done — no staffer and no
  // hospital operator can, regardless of flags. Delete stays owner-only
  // (only the adder may delete); everything else is shared.
  const approveLocked = !isAdminRole(sessionProfile?.role) && sessionProfile?.role !== "DOCTOR";
  // Owner-only delete: nobody may delete a booking they didn't add — not even
  // the doctor. Only the adder (createdBy) may delete it. Legacy rows without
  // createdBy stay deletable (no owner recorded).
  const currentUserId = sessionProfile?.id ?? "";
  const isOwnBooking = (row: ConfirmedRow) =>
    !row.createdBy || (currentUserId !== "" && row.createdBy === currentUserId);
  // Live board URL: `<username>.domain.com/live` (middleware rewrites to `/s/<username>/live`).
  // SSR-safe: server renders `/s/<username>/live`, client upgrades to subdomain after mount
  // (same SSR-safe upgrade pattern as the dashboard sidebar portal link).
  const liveUsername = doctor?.username?.trim().toLowerCase() ?? "";
  const serverSafeLiveUrl = liveUsername ? `/s/${encodeURIComponent(liveUsername)}/live` : null;
  const [liveBoardUrl, setLiveBoardUrl] = useState<string | null>(serverSafeLiveUrl);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration upgrade to the subdomain URL
    if (liveUsername) setLiveBoardUrl(`${buildPortalUrl(liveUsername)}/live`);
    else setLiveBoardUrl(null);
  }, [liveUsername]);
  const [collection, setCollection] = useState<CollectionSummary | null>(null);
  const [staffCols, setStaffCols] = useState<StaffBucket[]>([]);
  const [staffView, setStaffView] = useState<{ userId: string; name: string } | null>(null);
  const [staffRows, setStaffRows] = useState<{
    name: string;
    confirmed: StaffRow[];
    served: StaffRow[];
    byDoctor: StaffDoctorBreakdown[];
  } | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffErr, setStaffErr] = useState("");
  // Hospital desk "my collection": this operator's own OFFLINE rows for the
  // active day tab, grouped per doctor (auto-loaded — no click needed).
  const [myRows, setMyRows] = useState<{
    name: string;
    confirmed: StaffRow[];
    served: StaffRow[];
    byDoctor: StaffDoctorBreakdown[];
  } | null>(null);
  const [myLoading, setMyLoading] = useState(false);
  const [rows, setRows] = useState<ConfirmedRow[]>([]);
  const [counts, setCounts] = useState<Record<MainTab, number>>({ today: 0, tomorrow: 0, last30: 0 });
  const [mainTab, setMainTab] = useState<MainTab>("today");
  const [subTab, setSubTab] = useState<SubTab>("ALL");
  // Client-side search over the loaded list (name + phone number).
  const [query, setQuery] = useState("");
  // Hospital-staff doctor filter: "" = all doctors, else one doctorId.
  // Options come from local-options (same source as the booking form) so the
  // list always matches "doctors of this hospital + availableToday flag".
  const [doctorFilter, setDoctorFilter] = useState("");
  const [doctorOptions, setDoctorOptions] = useState<
    { id: string; name: string; speciality?: string | null; availableToday: boolean }[]
  >([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [selected, setSelected] = useState<ConfirmedRow | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  // Live serial board (doctor + staff start/stop it from here).
  const [live, setLive] = useState<{
    live: boolean;
    current: { serial: number; patientName: string } | null;
    missed: LiveMissed[];
    upcoming: { serial: number; patientName: string }[];
    waitingCount: number;
    break: LiveBreakState | null;
  } | null>(null);
  const [liveBusy, setLiveBusy] = useState(false);
  // Break form (reason + minutes) shown under the live buttons.
  const [breakOpen, setBreakOpen] = useState(false);
  const [breakReason, setBreakReason] = useState("");
  const [breakMins, setBreakMins] = useState("10");

  // Close the break popup on Escape.
  useEffect(() => {
    if (!breakOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBreakOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [breakOpen]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Upfront row actions: confirm popup + edit popup.
  const [confirmTarget, setConfirmTarget] = useState<{
    row: ConfirmedRow;
    kind: RowAction;
    breaksOrder: boolean;
    expectedSerial: number | null;
  } | null>(null);
  const [editRow, setEditRow] = useState<ConfirmedRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");

  // Not-present rows leave the current (today) list — they live only in the
  // missed section until recalled/served. Scoped to today + live board ON:
  // other days' serials restart at 1, so serial numbers alone never match.
  const missedSerials = useMemo(
    () => new Set((live?.missed ?? []).map((m) => m.serial)),
    [live],
  );
  const visibleRows = useMemo(
    () =>
      mainTab === "today" && live?.live
        ? rows.filter((r) => !missedSerials.has(r.serial))
        : rows,
    [rows, mainTab, live, missedSerials],
  );

  // Expired breaks read as "no break" (the server filters too; this covers
  // the gap between pushes so a lapsed break never sticks on screen).
  const liveBreakActive = activeBreak(live);

  /** Bengali digits → latin so phone search works in either script. */
  function normalizeDigits(s: string): string {
    return s.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
  }

  // Search filter (name substring, case-insensitive + phone digit
  // substring). Applies to the loaded list only — display-only, the
  // serve-order logic above keeps using the full visibleRows.
  const searchRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleRows;
    const qDigits = normalizeDigits(q).replace(/\D/g, "");
    return visibleRows.filter((r) => {
      if ((r.patientName ?? "").toLowerCase().includes(q)) return true;
      if (qDigits) {
        const phoneDigits = normalizeDigits(r.contactPhone ?? "").replace(/\D/g, "");
        if (phoneDigits.includes(qDigits)) return true;
      }
      return false;
    });
  }, [visibleRows, query]);

  const openEdit = (row: ConfirmedRow) => {
    setActionMsg("");
    setActionErr("");
    // Hospital desk: only the adder may update — same owner-only rule as delete.
    if (isHospitalDesk && !isOwnBooking(row)) {
      const who = row.createdByName?.trim() ? ` (${row.createdByName.trim()})` : "";
      setActionErr(`⛔ এই বুকিং${who} যোগ করেছেন — শুধু তিনি এডিট করতে পারবেন।`);
      return;
    }
    setEditName(row.patientName ?? "");
    setEditPhone(row.contactPhone ?? "");
    setEditAmount(
      row.collectionAmount != null ? String(row.collectionAmount) : row.amount != null ? String(row.amount) : "",
    );
    setEditRow(row);
  };

  const openConfirm = (row: ConfirmedRow, kind: RowAction) => {
    setActionErr("");
    setActionMsg("");
    // Staff can't delete another staffer's booking — stop here so the popup
    // never opens for a forbidden row (belt + suspenders with the disabled button).
    if (kind === "delete" && !isOwnBooking(row)) {
      const who = row.createdByName?.trim() ? ` (${row.createdByName.trim()})` : "";
      setActionErr(`⛔ এই বুকিং${who} যোগ করেছেন — শুধু তিনি ডিলিট করতে পারবেন।`);
      return;
    }
    // Serve lock: staff can never mark service-done (belt + suspenders with
    // the disabled button — the server enforces this too).
    if (kind === "done" && approveLocked) {
      setActionErr("⛔ সেবা সম্পন্ন শুধু ডাক্তার করবেন।");
      return;
    }
    // Serial rule: serve the smallest pending serial first. Jumping ahead
    // (e.g. approving 3 while 2 is still pending) triggers a warning.
    // Skipped ("not present") serials sit below the live current — they wait
    // for the patient to return, so they never trigger the warning.
    let breaksOrder = false;
    let expectedSerial: number | null = null;
    if (kind === "done") {
      const liveCurrent = mainTab === "today" ? live?.current?.serial ?? null : null;
      const pending = visibleRows.filter(
        (r) =>
          !r.servedAt &&
          r.status !== "DONE" &&
          Number.isFinite(r.serial) &&
          !(liveCurrent != null && r.serial < liveCurrent),
      );
      if (pending.length > 0) {
        expectedSerial = Math.min(...pending.map((r) => r.serial));
        breaksOrder = row.serial > (expectedSerial ?? row.serial);
      }
    }
    setConfirmTarget({ row, kind, breaksOrder, expectedSerial });
  };

  const loadCounts = useCallback(async (doctorId?: string) => {
    const [confirmed, served] = await Promise.all([
      confirmedCountsApi(doctorId),
      servedCountsApi(doctorId),
    ]);
    // today/tomorrow = pending queue; last30 = served history.
    setCounts({ today: confirmed.today, tomorrow: confirmed.tomorrow, last30: served.last30 });
  }, []);

  const loadStaff = useCallback(async (main: MainTab, doctorId?: string) => {
    setStaffCols(await staffApi(main, doctorId).catch(() => []));
  }, []);

  // Hospital desk only: this operator's own OFFLINE rows for the active day
  // tab (confirmed + served + per-doctor split). Skipped for doctor roles
  // (their hero is the doctor's collection, not a personal cash card).
  const loadMine = useCallback(
    async (main: MainTab, userId: string, hospitalDesk: boolean, doctorId?: string) => {
      if (!hospitalDesk || !userId) {
        setMyRows(null);
        return;
      }
      setMyLoading(true);
      try {
        setMyRows(await staffRowsApi(main, userId, doctorId));
      } catch {
        setMyRows(null);
      } finally {
        setMyLoading(false);
      }
    },
    [],
  );

  const loadList = useCallback(async (main: MainTab, sub: SubTab, doctorId?: string) => {
    const doctorQ = doctorId?.trim() ? `&doctorId=${encodeURIComponent(doctorId.trim())}` : "";
    // Served history: the DONE sub-tab everywhere, plus the whole last30 tab.
    if (sub === "DONE" || main === "last30") {
      const { rows } = await servedApi(main, sub, doctorId);
      setRows(rows);
      return;
    }
    const { rows, counts } = await confirmedApi(`?range=${main}&bookingType=${sub}&limit=50${doctorQ}`);
    setRows(rows);
    if (counts) {
      setCounts((prev) => ({
        today: counts.today ?? prev.today,
        tomorrow: counts.tomorrow ?? prev.tomorrow,
        last30: prev.last30,
      }));
    }
  }, []);

  const refresh = useCallback(
    async (
      main: MainTab,
      sub: SubTab,
      quiet = false,
      mine?: { userId: string; hospitalDesk: boolean; doctorId?: string },
    ) => {
      if (!quiet) setLoading(true);
      setError("");
      const doctorId = mine?.doctorId;
      // Hospital desk: this page is list-only (hero + cash live on the
      // dashboard), so skip the figures' round trips here.
      const listOnly = mine?.hospitalDesk === true;
      try {
        await Promise.all([
          loadList(main, sub, doctorId),
          loadCounts(doctorId),
          listOnly ? Promise.resolve() : loadStaff(main, doctorId),
          listOnly ? Promise.resolve() : collectionApi(doctorId).then(setCollection).catch(() => {}),
          mine && !listOnly ? loadMine(main, mine.userId, mine.hospitalDesk, doctorId) : Promise.resolve(),
        ]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
      } finally {
        setLoading(false);
      }
    },
    [loadCounts, loadList, loadStaff, loadMine],
  );

  useEffect(() => {
    // Session identity via Redux (deduped — one fetch per login).
    dispatch(fetchProfile());
    let cancelled = false;
    (async () => {
      try {
        const [{ rows, counts }, served, c, sc] = await Promise.all([
          confirmedApi("?range=today&bookingType=ALL&limit=50"),
          servedCountsApi().catch(() => null),
          collectionApi().catch(() => null),
          staffApi("today").catch(() => []),
        ]);
        if (cancelled) return;
        setRows(rows);
        if (counts) {
          setCounts({
            today: counts.today ?? 0,
            tomorrow: counts.tomorrow ?? 0,
            last30: served?.last30 ?? 0,
          });
        } else if (served) {
          setCounts((prev) => ({ ...prev, last30: served.last30 }));
        }
        if (c) setCollection(c);
        setStaffCols(sc);
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
  }, [dispatch]);

  // Last-30-days list grouped by day (only days that have rows appear).
  // Grouped from the search-filtered rows so search works there too.
  const dayGroups = useMemo(() => {
    if (mainTab !== "last30") return null;
    const map = new Map<string, ConfirmedRow[]>();
    for (const r of searchRows) {
      const key = localIso(r.appointmentDate);
      if (!key) continue;
      const list = map.get(key);
      if (list) list.push(r);
      else map.set(key, [r]);
    }
    return [...map.entries()].map(([date, list]) => ({ date, list }));
  }, [mainTab, searchRows]);

  const switchMain = (t: MainTab) => {
    setMainTab(t);
    setSelected(null);
    setStaffView(null);
    setStaffRows(null);
    setLoading(true);
    setError("");
    // Hospital desk is list-only here (figures live on the dashboard).
    if (!isHospitalDesk) {
      loadStaff(t, isHospitalStaff ? doctorFilter || undefined : undefined).catch(() => {});
      void loadMine(t, currentUserId, isHospitalDesk, isHospitalStaff ? doctorFilter || undefined : undefined);
    }
    loadList(t, subTab, isHospitalStaff ? doctorFilter || undefined : undefined)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "লোড করা যায়নি।"))
      .finally(() => setLoading(false));
  };

  const switchSub = (s: SubTab) => {
    setSubTab(s);
    setSelected(null);
    setLoading(true);
    setError("");
    loadList(mainTab, s, isHospitalStaff ? doctorFilter || undefined : undefined)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "লোড করা যায়নি।"))
      .finally(() => setLoading(false));
  };

  // After a popup booking: close the popup, refresh the list quietly,
  // and leave a success banner so staff sees the confirmation.
  const onBooked = () => {
    setBookingOpen(false);
    setActionErr("");
    setActionMsg("✓ নতুন বুকিং সম্পন্ন — তালিকায় যোগ হয়েছে।");
    void refresh(mainTab, subTab, true, {
      userId: currentUserId,
      hospitalDesk: isHospitalDesk,
      doctorId: isHospitalStaff ? doctorFilter || undefined : undefined,
    });
  };

  /** Open one taker's cash card → load their rows for this range. */
  const openStaff = (bucket: StaffBucket) => {
    setStaffView({ userId: bucket.userId, name: bucket.name });
    setStaffRows(null);
    setStaffErr("");
    setStaffLoading(true);
    staffRowsApi(mainTab, bucket.userId, isHospitalStaff ? doctorFilter || undefined : undefined)
      .then(setStaffRows)
      .catch((err: unknown) => setStaffErr(err instanceof Error ? err.message : "লোড করা যায়নি।"))
      .finally(() => setStaffLoading(false));
  };

  // Hospital-staff doctor dropdown options (today-available list).
  useEffect(() => {
    if (!isHospitalStaff) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the one-time doctor dropdown fetch
    setDoctorLoading(true);
    apiFetch("/api/backend/api/users/appointments/local-options")
      .then(async (res) => {
        if (!res.ok) return;
        const json = (await res.json().catch(() => null)) as {
          data?: { doctors?: { id: string; name: string; speciality?: string | null; availableToday: boolean }[] };
        } | null;
        if (cancelled) return;
        const docs = Array.isArray(json?.data?.doctors) ? json.data.doctors! : [];
        setDoctorOptions(docs);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDoctorLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isHospitalStaff]);

  /** Hospital-staff doctor change: reload the appointment list + counters for that doctor.
   * Cash + collection live on the dashboard (unfiltered), so only the list reloads here. */
  const switchDoctor = (id: string) => {
    setDoctorFilter(id);
    setSelected(null);
    setStaffView(null);
    setStaffRows(null);
    setLoading(true);
    setError("");
    const did = id.trim() || undefined;
    loadCounts(did).catch(() => {});
    loadList(mainTab, subTab, did)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "লোড করা যায়নি।"))
      .finally(() => setLoading(false));
  };

  // "My collection + per-doctor" live on the dashboard (HospitalDeskDashboard)
  // for hospital desk — nothing to auto-load on this list-only page.
  // (Doctor roles still use myRows via loadMine in refresh/switchMain.)
  useEffect(() => {
    if (isHospitalDesk) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear personal rows; dashboard owns them now
      setMyRows(null);
    }
  }, [isHospitalDesk]);

  const refreshLive = useCallback(async () => {
    try {
      const res = await apiFetch("/api/backend/api/users/serial-live/status");
      const json = (await res.json().catch(() => null)) as {
        data?: {
          live: boolean;
          current: { serial: number; patientName: string } | null;
          missed?: LiveMissed[];
          upcoming?: { serial: number; patientName: string }[];
          waitingCount: number;
          break?: LiveBreakState | null;
        };
      } | null;
      if (res.ok && json?.data) {
        setLive({ ...json.data, missed: json.data.missed ?? [], upcoming: json.data.upcoming ?? [], break: json.data.break ?? null });
      }
    } catch {
      /* live badge stays hidden until it loads */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount catch-up fetch syncing external live snapshot
    void refreshLive();
  }, [refreshLive]);

  // Presence heartbeat: while the live is ON, ping every 2 minutes so the
  // server knows the doctor/staff tab is still attending. Closing the tab,
  // logging out, or a dead session stops the pings and the server turns the
  // live off automatically (finished day / stale / rollover).
  useEffect(() => {
    if (!live?.live) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      apiFetch("/api/backend/api/users/serial-live/heartbeat", { method: "POST" })
        .then(async (res) => {
          const json = (await res.json().catch(() => null)) as {
            data?: {
              live: boolean;
              current: { serial: number; patientName: string } | null;
              missed?: LiveMissed[];
              upcoming?: { serial: number; patientName: string }[];
              waitingCount: number;
              break?: LiveBreakState | null;
            };
          } | null;
          if (res.ok && json?.data) {
            setLive({ ...json.data, missed: json.data.missed ?? [], upcoming: json.data.upcoming ?? [], break: json.data.break ?? null });
            if (!json.data.live) {
              setActionMsg("⏹️ লাইভ স্বয়ংক্রিয়ভাবে বন্ধ হয়েছে (আজকের সেবা শেষ / সেশন শেষ)।");
            }
          }
        })
        .catch(() => {
          /* next beat retries — expiry is server-side */
        });
    }, 120000);
    return () => clearInterval(id);
  }, [live?.live]);

  const toggleLive = async () => {
    if (liveBusy) return;
    setLiveBusy(true);
    setActionErr("");
    try {
      const res = await apiFetch(`/api/backend/api/users/serial-live/${live?.live ? "stop" : "start"}`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => null)) as {
        data?: {
          live: boolean;
          current: { serial: number; patientName: string } | null;
          missed?: LiveMissed[];
          upcoming?: { serial: number; patientName: string }[];
          waitingCount: number;
          break?: LiveBreakState | null;
        };
        error?: string;
      } | null;
      if (!res.ok) throw new Error(json?.error || "লাইভ চালু/বন্ধ করা যায়নি।");
      if (json?.data) setLive({ ...json.data, missed: json.data.missed ?? [], upcoming: json.data.upcoming ?? [], break: json.data.break ?? null });
      setActionMsg(json?.data?.live ? "🔴 লাইভ সিরিয়াল চালু হয়েছে — বোর্ডে দেখুন।" : "⏹️ লাইভ সিরিয়াল বন্ধ হয়েছে।");
    } catch (err: unknown) {
      setActionErr(err instanceof Error ? err.message : "অনুরোধ ব্যর্থ হয়েছে।");
    } finally {
      setLiveBusy(false);
    }
  };

  /** Start a break ("বিরতি") — reason + minutes show on the public board. */
  const startBreak = async () => {
    if (liveBusy || !live?.live) return;
    const minutes = Number(breakMins);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) {
      setActionErr("বিরতির সময় ১–১৮০ মিনিটের মধ্যে দিন।");
      return;
    }
    setLiveBusy(true);
    setActionErr("");
    try {
      const res = await apiFetch("/api/backend/api/users/serial-live/break", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: breakReason.trim(), minutes }),
      });
      const json = (await res.json().catch(() => null)) as {
        data?: {
          live: boolean;
          current: { serial: number; patientName: string } | null;
          missed?: LiveMissed[];
          upcoming?: { serial: number; patientName: string }[];
          waitingCount: number;
          break?: LiveBreakState | null;
        };
        error?: string;
      } | null;
      if (!res.ok) throw new Error(json?.error || "বিরতি চালু করা যায়নি।");
      if (json?.data)
        setLive({ ...json.data, missed: json.data.missed ?? [], upcoming: json.data.upcoming ?? [], break: json.data.break ?? null });
      setBreakOpen(false);
      setBreakReason("");
      setActionMsg(`⏸️ ${toBn(minutes)} মিনিটের বিরতি চালু হয়েছে — লাইভ বোর্ডে দেখা যাচ্ছে।`);
    } catch (err: unknown) {
      setActionErr(err instanceof Error ? err.message : "অনুরোধ ব্যর্থ হয়েছে।");
    } finally {
      setLiveBusy(false);
    }
  };

  /** End the break early — board and waiting flow resume. */
  const endBreak = async () => {
    if (liveBusy) return;
    setLiveBusy(true);
    setActionErr("");
    try {
      const res = await apiFetch("/api/backend/api/users/serial-live/break/end", {
        method: "POST",
      });
      const json = (await res.json().catch(() => null)) as {
        data?: {
          live: boolean;
          current: { serial: number; patientName: string } | null;
          missed?: LiveMissed[];
          upcoming?: { serial: number; patientName: string }[];
          waitingCount: number;
          break?: LiveBreakState | null;
        };
        error?: string;
      } | null;
      if (!res.ok) throw new Error(json?.error || "বিরতি শেষ করা যায়নি।");
      if (json?.data)
        setLive({ ...json.data, missed: json.data.missed ?? [], upcoming: json.data.upcoming ?? [], break: json.data.break ?? null });
      setActionMsg("▶️ বিরতি শেষ হয়েছে — বোর্ড আবার চলছে।");
      setBreakOpen(false);
    } catch (err: unknown) {
      setActionErr(err instanceof Error ? err.message : "অনুরোধ ব্যর্থ হয়েছে।");
    } finally {
      setLiveBusy(false);
    }
  };

  /** Skip the current serial ("উপস্থিত নেই") — board jumps to the next serial,
      the skipped one waits in the missed list until the patient returns. */
  const skipLive = async () => {
    if (liveBusy) return;
    const skippedSerial = live?.current?.serial ?? null;
    setLiveBusy(true);
    setActionErr("");
    try {
      const res = await apiFetch("/api/backend/api/users/serial-live/skip", {
        method: "POST",
      });
      const json = (await res.json().catch(() => null)) as {
        data?: {
          live: boolean;
          current: { serial: number; patientName: string } | null;
          missed?: LiveMissed[];
          upcoming?: { serial: number; patientName: string }[];
          waitingCount: number;
          break?: LiveBreakState | null;
          skipped?: { serial: number; patientName: string } | null;
        };
        error?: string;
      } | null;
      if (!res.ok) throw new Error(json?.error || "স্কিপ করা যায়নি।");
      if (json?.data) setLive({ ...json.data, missed: json.data.missed ?? [], upcoming: json.data.upcoming ?? [], break: json.data.break ?? null });
      const skippedName = json?.data?.skipped?.patientName?.trim() || null;
      const skippedNo = json?.data?.skipped?.serial ?? skippedSerial;
      setActionMsg(
        skippedNo != null
          ? `⏭️ ${skippedName ? `${skippedName} ` : ""}(সিরিয়াল ${toBn(skippedNo)}) উপস্থিত নেই — পরের সিরিয়াল বোর্ডে গেছে। শাস্তি হিসেবে ২০ মিনিট পর বোর্ডে আনা যাবে।`
          : "⏭️ স্কিপ করা হয়েছে।",
      );
    } catch (err: unknown) {
      setActionErr(err instanceof Error ? err.message : "অনুরোধ ব্যর্থ হয়েছে।");
    } finally {
      setLiveBusy(false);
    }
  };

  /** Recall a missed serial to the live board ("সিরিয়ালে আনুন").
      Blocked by the server until 20 minutes after the skip (punishment). */
  const recallLive = async (serial: number) => {
    if (liveBusy) return;
    setLiveBusy(true);
    setActionErr("");
    try {
      const res = await apiFetch("/api/backend/api/users/serial-live/recall", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ serial }),
      });
      const json = (await res.json().catch(() => null)) as {
        data?: {
          live: boolean;
          current: { serial: number; patientName: string } | null;
          missed?: LiveMissed[];
          upcoming?: { serial: number; patientName: string }[];
          waitingCount: number;
          break?: LiveBreakState | null;
          recalled?: { serial: number; patientName: string } | null;
        };
        error?: string;
      } | null;
      if (!res.ok) throw new Error(json?.error || "ফিরিয়ে আনা যায়নি।");
      if (json?.data) setLive({ ...json.data, missed: json.data.missed ?? [], upcoming: json.data.upcoming ?? [], break: json.data.break ?? null });
      const backName = json?.data?.recalled?.patientName?.trim() || "রোগী";
      const backNo = json?.data?.recalled?.serial ?? serial;
      setActionMsg(`✅ ${backName} (সিরিয়াল ${toBn(backNo)}) বোর্ডে ফিরেছেন।`);
    } catch (err: unknown) {
      setActionErr(err instanceof Error ? err.message : "অনুরোধ ব্যর্থ হয়েছে।");
    } finally {
      setLiveBusy(false);
    }
  };

  // Push-driven sync (websocket-style): the server pushes `appointments` /
  // `live` frames only when a booking mutation touches this scope — zero
  // polling timers. The hook reconnects on return-to-tab and fires a
  // catch-up frame, so missed pushes replay as a full quiet refresh.
  useRealtimeStream({
    url: "/api/stream",
    probeUrl: "/api/backend/api/users/appointments/confirmed/counts",
    onEvent: (types) => {
      const did = isHospitalStaff ? doctorFilter || undefined : undefined;
      if (types.includes("appointments")) {
        void refresh(mainTab, subTab, true, {
          userId: currentUserId,
          hospitalDesk: isHospitalDesk,
          doctorId: did,
        });
      }
      if (types.includes("live")) {
        void refreshLive();
        // Board moves (skip/recall/serve) reshape the visible list itself.
        loadList(mainTab, subTab, did).catch(() => {});
      }
    },
  });

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
        // Future bookings can never be accepted today (server enforces too).
        const iso = localIso(row.appointmentDate);
        const today = localIso(new Date());
        if (iso && today && iso > today) {
          setActionErr("⛔ আগামীর বুকিং আজ সেবা সম্পন্ন করা যাবে না। নির্ধারিত দিনে সেবা দিন।");
          setActing(false);
          return;
        }
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
      void refresh(mainTab, subTab, true, {
        userId: currentUserId,
        hospitalDesk: isHospitalDesk,
        doctorId: isHospitalStaff ? doctorFilter || undefined : undefined,
      });
      void refreshLive();
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
      // Appointment date is immutable — never sent.
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
      void refresh(mainTab, subTab, true, {
        userId: currentUserId,
        hospitalDesk: isHospitalDesk,
        doctorId: isHospitalStaff ? doctorFilter || undefined : undefined,
      });
    } catch (err: unknown) {
      setActionErr(err instanceof Error ? err.message : "অনুরোধ ব্যর্থ হয়েছে।");
    } finally {
      setActing(false);
    }
  };

  // Hero date + one-line figures follow the day tab (left side, under doctor details).
  const isTomorrow = mainTab === "tomorrow";
  const heroDate = collection ? (isTomorrow ? (collection.tomorrow ?? collection.today) : collection.today) : null;
  // Collection (served + confirmed, never drops) and served-only income.
  const heroCollection = isTomorrow ? (collection?.tomorrowTotal ?? null) : (collection?.todayTotal ?? collection?.todayBox ?? null);
  const heroServed = isTomorrow ? (collection?.tomorrowBox ?? null) : (collection?.todayBox ?? null);
  const heroPending = isTomorrow ? (collection?.tomorrowConfirmed ?? null) : (collection?.todayConfirmed ?? null);
  const doctorSubline = [doctor?.degree, doctor?.speciality].filter(Boolean).join(" · ");

  // Hospital-desk hero + cash live on the dashboard (HospitalDeskDashboard) —
  // this page keeps only the doctor filter + appointment list, so no
  // hospital-hero derived figures are computed here.

  // Future-dated booking in the confirm popup can never be served today.
  const confirmRowIso = confirmTarget ? localIso(confirmTarget.row.appointmentDate) : "";
  const todayIso = localIso(new Date());
  const confirmIsFuture =
    confirmTarget?.kind === "done" && !!confirmRowIso && !!todayIso && confirmRowIso > todayIso;

  // Serial-break warning verse: Quranic ayat for Muslim doctors (default),
  // a general fairness quote for other religions.
  const doctorReligion = doctor?.religion ?? "";
  const showQuranic = (() => {
    const r = doctorReligion.trim().toLowerCase();
    if (!r) return true;
    return !/(hindu|হিন্দু|সনাতন|christ|খ্রিস্ট|খ্রিষ্টান|buddh|বৌদ্ধ|jain|জৈন|sikh|শিখ|atheist|নাস্তিক)/.test(r);
  })();

  return (
    <div className="space-y-5">
      {/* Hospital-desk hero lives on the dashboard (HospitalDeskDashboard) — this page keeps only the doctor filter + appointment list. */}
      {!isHospitalDesk && (
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 p-5 text-white shadow-xl sm:rounded-3xl sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Doctor identity */}
          <div className="flex min-w-0 items-center gap-4">
            {loading && !doctor ? (
              <Skeleton light className="h-24 w-24 shrink-0 !rounded-2xl sm:h-28 sm:w-28" />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element -- portrait may be any external doctor-uploaded URL */
              <img
                src={doctorPortrait(doctor?.profilePicture)}
                alt={doctor?.name ?? "ডাক্তার"}
                className="h-24 w-24 shrink-0 rounded-2xl border-2 border-white/40 object-cover shadow-lg sm:h-28 sm:w-28"
                onError={(e) => {
                  const fallback = fallbackAvatar();
                  if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback;
                }}
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-white/75">
                🩺 চিকিৎসক
              </p>
              {loading && !doctor ? (
                <div className="space-y-2" aria-label="লোড হচ্ছে">
                  <Skeleton light className="h-8 w-52 sm:h-10" />
                  <Skeleton light className="h-5 w-40" />
                </div>
              ) : (
                <>
                  <p className="truncate text-2xl font-black tracking-tight sm:text-3xl">
                    {doctor?.name ?? "ডাক্তার"}
                  </p>
                  {doctorSubline && (
                    <p className="mt-0.5 truncate text-base font-semibold text-white/90">{doctorSubline}</p>
                  )}
                  {doctor?.tagline && (
                    <p className="mt-0.5 truncate text-base italic text-white/75">“{doctor.tagline}”</p>
                  )}
                  {heroDate && (
                    <p className="mt-1.5 text-xs font-bold text-white/75">📅 {bnDateLabel(heroDate)}</p>
                  )}
                  <div className="mt-2">
                    <CreditBalanceBadge />
                  </div>
                  {live?.live && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-black tracking-widest text-white">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                      </span>
                      LIVE{liveBreakActive ? " · ⏸️ বিরতি" : ""}
                    </p>
                  )}
                  {loading && !collection ? (
                    <div className="mt-3 space-y-2" aria-label="লোড হচ্ছে">
                      <Skeleton light className="h-12 w-72 max-w-full sm:h-16" />
                      <Skeleton light className="h-4 w-56 max-w-full" />
                    </div>
                  ) : (
                    heroCollection && (
                      <>
                        <p
                          className="mt-2 whitespace-nowrap font-black tracking-tight"
                          style={{ fontSize: "clamp(1.25rem, 4vw, 35px)", lineHeight: 1.1 }}
                        >
                          <span className="text-white">
                            {taka(heroCollection.total)}{" "}
                            <span className="font-bold text-white/70" style={{ fontSize: "0.38em" }}>
                              আদায়
                            </span>
                          </span>
                          <span className="text-white/40"> · </span>
                          <span className="text-amber-300">
                            {taka(heroServed?.total ?? 0)}{" "}
                            <span className="font-bold text-amber-200/80" style={{ fontSize: "0.38em" }}>
                              আয় (সেবা)
                            </span>
                          </span>
                        </p>
                        <p className="mt-1 text-xs font-bold text-white/80 sm:text-sm">
                          মোট {toBn(heroCollection.count)}টি অ্যাপয়েন্টমেন্ট · {toBn(heroPending?.count ?? 0)}টি
                          বিচারাধীন · {toBn(heroServed?.count ?? 0)}টি সেবা সম্পন্ন
                        </p>
                      </>
                    )
                  )}
                </>
              )}
            </div>
          </div>
          {/* Actions only — figures and live serials live in the list below */}
          <div className="flex w-full max-w-md flex-col gap-2 lg:items-end">
            <button
              onClick={() => setBookingOpen(true)}
              className="w-full rounded-xl bg-white px-5 py-2.5 text-sm font-black text-emerald-700 shadow transition hover:-translate-y-0.5 hover:shadow-lg lg:w-auto"
            >
              ➕ নতুন অ্যাপয়েন্টমেন্ট
            </button>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {!isHospitalDesk && (
                <button
                  onClick={() => void toggleLive()}
                  disabled={liveBusy}
                  className={`rounded-xl px-4 py-2 text-sm font-black text-white shadow transition hover:-translate-y-0.5 disabled:opacity-60 ${
                    live?.live ? "bg-slate-900 hover:bg-slate-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {liveBusy ? "…" : live?.live ? "⏹️ লাইভ বন্ধ করুন" : "🔴 লাইভ শুরু করুন"}
                </button>
              )}
              {live?.live && liveBoardUrl && !isHospitalDesk && (
                <a
                  href={liveBoardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-white/15 px-4 py-2 text-sm font-black text-white ring-1 ring-white/30 hover:bg-white/25"
                >
                  📺 লাইভ বোর্ড দেখুন
                </a>
              )}
              {live?.live && !isHospitalDesk && (
                <button
                  onClick={() => setBreakOpen(true)}
                  disabled={liveBusy}
                  className={`rounded-xl px-4 py-2 text-sm font-black text-white shadow transition hover:-translate-y-0.5 disabled:opacity-60 ${
                    liveBreakActive
                      ? "animate-pulse bg-amber-500 hover:bg-amber-600"
                      : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {liveBreakActive ? "⏸️ বিরতি চলছে" : "⏸️ বিরতি"}
                </button>
              )}
            </div>
            {/* Break popup — start form, or live status + stop button while on break */}
            {breakOpen && live?.live && !isHospitalDesk && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-label="বিরতি"
              >
                <button
                  type="button"
                  aria-label="বন্ধ করুন"
                  onClick={() => setBreakOpen(false)}
                  className="loc-backdrop absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
                />
                <div className="loc-modal-pop relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-black text-slate-900">
                      {liveBreakActive ? "⏸️ বিরতি চলছে" : "⏸️ বিরতির কারণ ও সময় দিন"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setBreakOpen(false)}
                      aria-label="বন্ধ করুন"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                    >
                      ✕
                    </button>
                  </div>
                  {liveBreakActive ? (
                    <div className="mt-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                      <p className="text-sm font-black text-slate-900">{liveBreakActive.reason}</p>
                      <p className="mt-1 text-sm font-bold text-slate-600">
                        {breakBackBn(liveBreakActive.endsAt)
                          ? `ফিরবেন ${breakBackBn(liveBreakActive.endsAt)} — বোর্ডে দেখা যাচ্ছে`
                          : "বোর্ডে দেখা যাচ্ছে"}
                      </p>
                      <button
                        type="button"
                        onClick={() => void endBreak()}
                        disabled={liveBusy}
                        className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {liveBusy ? "…" : "▶️ বিরতি শেষ করুন"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <label className="block text-xs font-black text-slate-500" htmlFor="break-reason">
                        কারণ
                      </label>
                      <input
                        id="break-reason"
                        autoFocus
                        value={breakReason}
                        onChange={(e) => setBreakReason(e.target.value)}
                        placeholder="যেমন: নামাজের বিরতি"
                        maxLength={140}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <label className="mt-3 block text-xs font-black text-slate-500" htmlFor="break-mins">
                        সময়
                      </label>
                      <select
                        id="break-mins"
                        value={breakMins}
                        onChange={(e) => setBreakMins(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        {["5", "10", "15", "20", "30", "45", "60"].map((m) => (
                          <option key={m} value={m}>
                            {toBn(m)} মিনিট
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void startBreak()}
                        disabled={liveBusy}
                        className="mt-4 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-white shadow transition hover:bg-amber-600 disabled:opacity-60"
                      >
                        {liveBusy ? "…" : "✅ বিরতি চালু করুন"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {live?.live && liveBreakActive && (
              <p
                suppressHydrationWarning
                className="w-full rounded-xl bg-amber-400/20 px-3 py-2 text-sm font-black text-amber-200 ring-1 ring-amber-300/40 lg:text-right"
              >
                ⏸️ বিরতি চলছে — {liveBreakActive.reason}
                {breakBackBn(liveBreakActive.endsAt) ? ` · ফিরবেন ${breakBackBn(liveBreakActive.endsAt)}` : ""}
              </p>
            )}
          </div>
        </div>
      </section>
      )}

      {/* ---------- Missed list — skipped serials, recall to the board after 20 min ---------- */}
      {live?.live && (live?.missed?.length ?? 0) > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
          <p className="text-sm font-black text-slate-800">
            ⏳ অনুপস্থিত তালিকা — ফিরে এলে সিরিয়ালে আনুন
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            এই তালিকার রোগীরা উপরের অ্যাপয়েন্টমেন্ট তালিকায় দেখা যাবে না।
          </p>
          <ul className="mt-3 space-y-2">
            {(live?.missed ?? []).map((m) => {
              const remaining = cooldownRemainingMs(m.skippedAt);
              const cooling = remaining != null && remaining > 0;
              const waitMins = cooling ? Math.max(1, Math.ceil((remaining as number) / 60000)) : 0;
              return (
                <li
                  key={m.serial}
                  className="flex flex-col gap-2 rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:gap-3"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-base font-black text-white">
                      {toBn(m.serial || 0)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-black text-slate-900">{m.patientName}</span>
                      <span className="block truncate text-xs font-bold text-slate-500">
                        {missedAgoBn(m.skippedAt)}
                        {cooling
                          ? ` — ${m.patientName} সিরিয়াল ${toBn(m.serial)} মিস করেছেন, শাস্তি হিসেবে আরো ${toBn(waitMins)} মিনিট পর বোর্ডে আনা যাবে`
                          : ` — ${m.patientName} সিরিয়াল ${toBn(m.serial)} মিস করেছেন, এখন বোর্ডে আনা যাবে`}
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void recallLive(m.serial)}
                    disabled={cooling || liveBusy}
                    title={
                      cooling
                        ? `শাস্তি হিসেবে আরো ${toBn(waitMins)} মিনিট পর বোর্ডে আনা যাবে`
                        : "ফিরে এসেছেন — এখনই লাইভ বোর্ডে আনুন"
                    }
                    className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black text-white shadow transition disabled:opacity-60 ${
                      cooling
                        ? "cursor-not-allowed bg-slate-400"
                        : "bg-emerald-600 hover:-translate-y-0.5 hover:bg-emerald-700"
                    }`}
                  >
                    {cooling ? `⏳ ${toBn(waitMins)} মিনিট পর` : "🔙 সিরিয়ালে আনুন"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {error && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">{error}</p>
      )}
      {approveLocked && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800 ring-1 ring-amber-200">
          {isHospitalDesk
            ? "🔒 সেবা সম্পন্ন শুধু ডাক্তার করবেন — হাসপাতাল-স্টাফ সেবা সম্পন্ন করতে পারবেন না। ডিলিট শুধু যিনি বুকিং নিয়েছেন তিনি করতে পারবেন।"
            : "🔒 সেবা সম্পন্ন শুধু ডাক্তার করবেন — স্টাফ সেবা সম্পন্ন করতে পারবেন না। ডিলিট শুধু যিনি বুকিং নিয়েছেন তিনি করতে পারবেন।"}
        </p>
      )}
      {/* Cash cards live on the dashboard for hospital desk (HospitalDeskDashboard) — this page shows only the list. */}
      {!isHospitalDesk && loading && staffCols.length === 0 ? (
        <section aria-label="লোড হচ্ছে">
          <Skeleton className="mb-2 h-4 w-56" />
          <SkeletonCards count={4} />
        </section>
      ) : (
        !isHospitalDesk &&
        staffCols.length > 0 && (
          <section>
            <p className="mb-2 px-1 text-sm font-black text-slate-800">
              💵 ক্যাশ কালেকশন — কে কত নিয়েছে (অফলাইন)
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
              {staffCols.map((b) => {
                const isMe = isHospitalDesk && currentUserId !== "" && b.userId === currentUserId;
                const isHospitalCard = b.userId.startsWith("hospital:");
                return (
                  <button
                    key={b.userId}
                    type="button"
                    onClick={() => openStaff(b)}
                    title={`${b.name}-এর বুকিং দেখুন`}
                    className={
                      isMe
                        ? "rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-4 text-left text-white shadow-lg ring-2 ring-violet-300 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-5"
                        : isHospitalCard
                          ? "rounded-2xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-600 p-4 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:p-5"
                          : "rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-4 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:p-5"
                    }
                  >
                    <p className="truncate text-sm font-black">
                      {isHospitalCard ? "🏥" : "🧾"} {b.name}
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

      {/* Hospital desk: quick booking from the list page too (full hero + cash live on the dashboard). */}
      {isHospitalDesk && (
        <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-sm font-black text-slate-800">➕ নতুন অ্যাপয়েন্টমেন্ট</p>
            <p className="mt-0.5 text-xs font-bold text-slate-500">
              ডাক্তার বেছে সরাসরি বুকিং + SMS রসিদ — হিসাব ড্যাশবোর্ডে দেখুন।
            </p>
          </div>
          <button
            onClick={() => setBookingOpen(true)}
            className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-black text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            ➕ নতুন অ্যাপয়েন্টমেন্ট
          </button>
        </section>
      )}

      {/* ---------- Hospital-staff doctor filter: today's available doctors ---------- */}
      {isHospitalStaff && (
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-800">🩺 ডাক্তার বেছে নিন — নির্দিষ্ট ডাক্তারের তালিকা দেখুন</p>
              <p className="mt-0.5 text-xs font-bold text-slate-500">
                আজ উপস্থিত ডাক্তারদের তালিকা — একজন বেছে নিলে শুধু তার অ্যাপয়েন্টমেন্ট তালিকা দেখাবে।
              </p>
            </div>
            {doctorFilter && (
              <button
                type="button"
                onClick={() => switchDoctor("")}
                className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200"
              >
                ✕ সব ডাক্তার
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex-1">
              <span className="sr-only">ডাক্তার বেছে নিন</span>
              <select
                value={doctorFilter}
                onChange={(e) => switchDoctor(e.target.value)}
                disabled={doctorLoading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800 focus:border-violet-500 focus:outline-none disabled:opacity-60"
              >
                <option value="">🏥 সব ডাক্তার — আজকের পূর্ণ তালিকা</option>
                {doctorOptions
                  .filter((d) => d.availableToday)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      ✅ {d.name}
                      {d.speciality ? ` — ${d.speciality}` : ""} (আজ উপস্থিত)
                    </option>
                  ))}
                {doctorOptions
                  .filter((d) => !d.availableToday)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.speciality ? ` — ${d.speciality}` : ""} (আজ বন্ধ)
                    </option>
                  ))}
              </select>
            </label>
            <p className="shrink-0 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 ring-1 ring-violet-100">
              {doctorLoading
                ? "লোড হচ্ছে…"
                : doctorOptions.length === 0
                  ? "ডাক্তার পাওয়া যায়নি"
                  : `আজ উপস্থিত: ${toBn(doctorOptions.filter((d) => d.availableToday).length)} জন`}
            </p>
          </div>
          {doctorFilter && (
            <p className="mt-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-800 ring-1 ring-violet-100">
              🩺 {doctorOptions.find((d) => d.id === doctorFilter)?.name ?? "ডাক্তার"}-এর তালিকা দেখছেন — শুধু
              অ্যাপয়েন্টমেন্ট তালিকা ফিল্টার হয়েছে (হিসাব ড্যাশবোর্ডে দেখুন)।
            </p>
          )}
        </section>
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

      {/* ---------- Search by patient name / phone number ---------- */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <span className="sr-only">নাম বা মোবাইল নম্বর দিয়ে খুঁজুন</span>
          <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন…"
            inputMode="search"
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-bold text-slate-800 placeholder:font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
          />
        </label>
        {query.trim() && (
          <div className="flex shrink-0 items-center gap-2">
            <p className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
              {toBn(searchRows.length)} / {toBn(visibleRows.length)} জন
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200"
            >
              ✕ মুছুন
            </button>
          </div>
        )}
      </div>

      {/* ---------- Rows with upfront actions (missed serials hidden — see missed list) ---------- */}
      {loading ? (
        <SkeletonRows count={6} />
      ) : searchRows.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
          {query.trim() ? "এই নাম বা নম্বরে কোনো রোগী পাওয়া যায়নি।" : "এই তালিকায় কিছু নেই।"}
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
                    lockApprove={approveLocked}
                    canDelete={isOwnBooking(r)}
                    canEdit={!isHospitalDesk || isOwnBooking(r)}
                    editTip={
                      isHospitalDesk && !isOwnBooking(r)
                        ? `👤 ${r.createdByName?.trim() || "অন্য স্টাফ"} যোগ করেছেন — শুধু তিনি এডিট করতে পারবেন`
                        : "এডিট"
                    }
                    deleteTip={
                      !isOwnBooking(r)
                        ? `👤 ${r.createdByName?.trim() || "অন্য স্টাফ"} যোগ করেছেন — শুধু তিনি ডিলিট করতে পারবেন`
                        : "ডিলিট"
                    }
                    showSkip={false}
                    onSkip={() => void skipLive()}
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
          {searchRows.map((r) => (
            <AppointmentRow
              key={r.id}
              r={r}
              readonly={subTab === "DONE" || !!r.servedAt}
              lockApprove={approveLocked}
              canDelete={isOwnBooking(r)}
              canEdit={!isHospitalDesk || isOwnBooking(r)}
              editTip={
                isHospitalDesk && !isOwnBooking(r)
                  ? `👤 ${r.createdByName?.trim() || "অন্য স্টাফ"} যোগ করেছেন — শুধু তিনি এডিট করতে পারবেন`
                  : "এডিট"
              }
              deleteTip={
                !isOwnBooking(r)
                  ? `👤 ${r.createdByName?.trim() || "অন্য স্টাফ"} যোগ করেছেন — শুধু তিনি ডিলিট করতে পারবেন`
                  : "ডিলিট"
              }
              // Not-present only applies to today's live board: the row that is
              // currently on the board gets the skip button + highlight.
              showSkip={
                mainTab === "today" &&
                subTab !== "DONE" &&
                !r.servedAt &&
                !!live?.live &&
                live?.current != null &&
                r.serial === live.current.serial
              }
              onSkip={() => void skipLive()}
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
            className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/60 px-3 pb-6 pt-20 backdrop-blur-sm sm:items-center sm:p-6"
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
              className="max-h-[calc(100dvh-110px)] sm:max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
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
                {selected.createdByName && (
                  <DetailRow label="বুকিং নিয়েছেন" value={selected.createdByName} />
                )}
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

      {/* ---------- Staff cash popup (their bookings in this range) ---------- */}
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
                <p className="min-w-0 truncate text-lg font-black text-slate-900">
                  {staffView.userId.startsWith("hospital:") ? "🏥 " : "🧾 "}
                  {staffRows?.name ?? staffView.name}
                </p>
                <button
                  onClick={() => setStaffView(null)}
                  aria-label="বন্ধ করুন"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600 hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>
              {staffLoading ? (
                <div className="mt-4 space-y-1.5" aria-label="লোড হচ্ছে">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"
                    >
                      <Skeleton className="h-10 w-10 shrink-0 !rounded-full" />
                      <span className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                      </span>
                      <Skeleton className="h-4 w-14 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : staffErr ? (
                <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">
                  {staffErr}
                </p>
              ) : staffRows ? (
                <div className="mt-3 space-y-4">
                  {staffRows.byDoctor.length > 0 && (
                    <section className="rounded-2xl bg-violet-50 p-3 ring-1 ring-violet-100">
                      <p className="px-1 text-sm font-black text-violet-900">
                        🩺 কোন ডাক্তারের জন্য কত
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {staffRows.byDoctor.map((d) => (
                          <li
                            key={d.doctorId}
                            className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-violet-100"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-slate-900">
                                {d.doctorName}
                              </span>
                              <span className="block truncate text-[11px] font-bold text-slate-500">
                                {toBn(d.count)} জন · বাকি {toBn(d.confirmedCount)} · সম্পন্ন{" "}
                                {toBn(d.servedCount)}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-black text-violet-700">
                              {taka(d.total)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  <StaffRowGroup
                    title={`⏳ বাকি (${toBn(staffRows.confirmed.length)} জন · ${taka(staffRows.confirmed.reduce((s, r) => s + (r.amount ?? 0), 0))})`}
                    rows={staffRows.confirmed}
                    empty="কোনো বাকি বুকিং নেই।"
                  />
                  <StaffRowGroup
                    title={`✓ সেবা সম্পন্ন (${toBn(staffRows.served.length)} জন · ${taka(staffRows.served.reduce((s, r) => s + (r.amount ?? 0), 0))})`}
                    rows={staffRows.served}
                    empty="কোনো সম্পন্ন বুকিং নেই।"
                    done
                  />
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Confirm popup (served / delete / cancel-request) ---------- */}
      <AnimatePresence>
        {confirmTarget && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/60 px-3 pb-6 pt-20 backdrop-blur-sm sm:items-center sm:p-6"
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
              className="max-h-[calc(100dvh-110px)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:max-h-[92vh] sm:rounded-2xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
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
                  !confirmTarget.breaksOrder &&
                  "নিশ্চিত করলে এই বুকিং সেবা-সম্পন্ন তালিকায় চলে যাবে।"}
                {confirmTarget.kind === "delete" &&
                  `নিশ্চিত করলে অফলাইন বুকিংটি ডিলিট হবে (লোকাল বাতিল তালিকায় সেভ থাকবে)।${confirmTarget.row.createdByName?.trim() ? ` বুকিং নিয়েছেন: ${confirmTarget.row.createdByName.trim()}।` : ""}`}
                {confirmTarget.kind === "request" &&
                  "নিশ্চিত করলে অনলাইন বুকিংয়ের ক্যানসেল রিকোয়েস্ট পাঠানো হবে। বুকিং অপরিবর্তিত থাকবে।"}
              </p>
              {confirmTarget.kind === "done" && confirmIsFuture && (
                <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-black text-red-700 ring-1 ring-red-200">
                  ⛔ আগামীর বুকিং আজ সেবা সম্পন্ন করা যাবে না। নির্ধারিত দিনে সেবা দিন।
                </p>
              )}
              {confirmTarget.kind === "done" && !confirmIsFuture && confirmTarget.breaksOrder && (
                <div className="mt-3 space-y-2.5">
                  <p className="rounded-xl bg-red-50 p-3 text-sm font-black text-red-700 ring-1 ring-red-200">
                    ⚠️ সিরিয়াল নিয়ম ভঙ্গ হচ্ছে! {toBn(confirmTarget.expectedSerial ?? 0)} নম্বর
                    সিরিয়াল বাকি থাকতে {toBn(confirmTarget.row.serial || 0)} নম্বর সেবা দিতে
                    যাচ্ছেন — দয়া করে নিয়ম ভঙ্গ করবেন না।
                  </p>
                  {showQuranic ? (
                    <blockquote className="rounded-xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-200">
                      <p dir="rtl" lang="ar" className="text-lg font-bold leading-loose text-emerald-900">
                        «إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ»
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">
                        “নিশ্চয়ই আল্লাহ ন্যায়বিচার ও সদাচরণের নির্দেশ দেন।”
                      </p>
                      <cite className="mt-1 block text-xs font-bold not-italic text-slate-400">
                        — আল-কুরআন, সূরা আন-নাহল (১৬:৯০)
                      </cite>
                    </blockquote>
                  ) : (
                    <blockquote className="rounded-xl bg-sky-50 p-4 text-center ring-1 ring-sky-200">
                      <p className="text-base font-black leading-relaxed text-sky-900">
                        “সারিতে যে আগে এসেছে, সেবা তারই আগে প্রাপ্য — অন্যের হক নষ্ট করো না।”
                      </p>
                      <cite className="mt-1 block text-xs font-bold not-italic text-slate-400">
                        — সাধারণ নৈতিক নীতি
                      </cite>
                    </blockquote>
                  )}
                </div>
              )}
              {actionErr && (
                <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 ring-1 ring-red-100">
                  {actionErr}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={acting || confirmIsFuture}
                  onClick={() => void runConfirmAction()}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black text-white disabled:opacity-60 ${
                    confirmTarget.kind === "done"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : confirmTarget.kind === "delete"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {acting
                    ? "প্রসেস হচ্ছে…"
                    : confirmTarget.kind === "done" && confirmTarget.breaksOrder
                      ? "⚠️ তবুও নিশ্চিত করুন"
                      : "✓ নিশ্চিত করুন"}
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
            className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/60 px-3 pb-6 pt-20 backdrop-blur-sm sm:items-center sm:p-6"
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
              className="max-h-[calc(100dvh-110px)] sm:max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
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
                  <span className="mb-1 block text-xs font-bold text-slate-500">তারিখ (পরিবর্তন করা যায় না)</span>
                  <p className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-black text-slate-600">
                    📅 {bnDateLabel(localIso(editRow.appointmentDate))}
                  </p>
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
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  className: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        title={label}
        aria-label={label}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 transition active:translate-y-0 ${disabled ? "cursor-not-allowed opacity-40" : "hover:-translate-y-0.5 hover:shadow-md"} ${className}`}
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
  lockApprove,
  canDelete,
  canEdit = true,
  editTip = "এডিট",
  deleteTip,
  showSkip,
  onSkip,
  onPick,
  onDone,
  onEdit,
  onCancel,
}: {
  r: ConfirmedRow;
  readonly: boolean;
  lockApprove: boolean;
  canDelete: boolean;
  canEdit?: boolean;
  editTip?: string;
  deleteTip: string;
  /** Today's live-current row — gets the not-present skip button + highlight. */
  showSkip: boolean;
  onSkip: () => void;
  onPick: (r: ConfirmedRow) => void;
  onDone: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  // Future-dated (e.g. tomorrow's) bookings can't be marked served today.
  const ad = new Date(r.appointmentDate);
  const now = new Date();
  const future =
    new Date(ad.getFullYear(), ad.getMonth(), ad.getDate()).getTime() >
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return (
    <li
      className={`w-full rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md sm:flex sm:items-center sm:gap-3 sm:p-4 ${
        showSkip ? "ring-2 ring-amber-400" : "ring-1 ring-slate-100"
      }`}
    >
      <button
        onClick={() => onPick(r)}
        className="flex min-w-0 w-full flex-1 items-center gap-2.5 text-left sm:gap-3"
        aria-label={`${r.patientName} বিস্তারিত`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-base font-black text-white sm:h-11 sm:w-11 sm:text-lg">
          {toBn(r.serial || 0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-black text-slate-900">{r.patientName}</span>
          <span className="block truncate text-sm text-slate-500">📞 {r.contactPhone}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-black text-emerald-700">{taka(r.amount ?? 0)}</span>
          <span className="mt-1 flex flex-wrap items-center justify-end gap-1.5">
            <span
              className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${TYPE_CLS[r.bookingType]}`}
            >
              {TYPE_BN[r.bookingType]}
            </span>
            {showSkip && (
              <span
                title="এই সিরিয়াল এখন লাইভ বোর্ডে চলছে"
                className="inline-block shrink-0 animate-pulse rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-black text-white"
              >
                🔴 বোর্ডে
              </span>
            )}
            {r.createdByName?.trim() && (
              <span
                title={`বুকিং নিয়েছেন: ${r.createdByName.trim()}${!canDelete && r.bookingType === "OFFLINE" ? " — শুধু তিনি ডিলিট করতে পারবেন" : ""}`}
                className={
                  !canDelete && r.bookingType === "OFFLINE"
                    ? "max-w-32 truncate rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800 ring-1 ring-amber-200"
                    : "max-w-20 truncate text-[11px] font-bold text-slate-500"
                }
              >
                👤 {r.createdByName.trim()}
              </span>
            )}
          </span>
        </span>
      </button>
      {readonly ? (
        <span className="mt-2 flex shrink-0 justify-end sm:mt-0">
          <span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
            ✓ সম্পন্ন
          </span>
        </span>
      ) : (
        <span className="mt-2 flex shrink-0 items-center justify-end gap-1.5 sm:mt-0" onClick={(e) => e.stopPropagation()}>
          {showSkip && (
            <HoverAction
              label="🙋‍♂️ উপস্থিত নেই — পরের সিরিয়াল বোর্ডে পাঠান"
              onClick={onSkip}
              className="bg-amber-500 text-white ring-amber-500 hover:bg-amber-600"
            >
              <span className="text-base leading-none">⏭️</span>
            </HoverAction>
          )}
          <HoverAction
            label={
              lockApprove
                ? "🔒 শুধু ডাক্তার অনুমোদন দেবেন"
                : future
                  ? "আগামীর বুকিং — আজ সেবা দেওয়া যাবে না"
                  : "সেবা সম্পন্ন"
            }
            onClick={onDone}
            disabled={future || lockApprove}
            className="bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-700"
          >
            <CheckIcon />
          </HoverAction>
          <HoverAction
            label={editTip}
            onClick={onEdit}
            disabled={!canEdit}
            className="bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
          >
            <PencilIcon />
          </HoverAction>
          {r.bookingType === "OFFLINE" ? (
            <HoverAction
              label={deleteTip}
              onClick={onCancel}
              disabled={!canDelete}
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

function StaffRowGroup({
  title,
  rows,
  empty,
  done = false,
}: {
  title: string;
  rows: StaffRow[];
  empty: string;
  done?: boolean;
}) {
  return (
    <section>
      <p className="mb-1.5 px-1 text-sm font-black text-slate-700">{title}</p>
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400 ring-1 ring-slate-100">
          {empty}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li
              key={`${done ? "s" : "c"}-${r.id}`}
              className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-black text-white ${
                  done ? "bg-emerald-600" : "bg-amber-500"
                }`}
              >
                {toBn(r.serial || 0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-slate-900">{r.patientName}</span>
                <span className="block truncate text-xs text-slate-500">
                  📞 {r.contactPhone} · {bnDateLabel(localIso(r.appointmentDate))}
                </span>
                {r.doctorName?.trim() && (
                  <span className="mt-0.5 block truncate text-[11px] font-bold text-violet-700">
                    🩺 {r.doctorName.trim()}
                    {r.doctorSpeciality?.trim() ? ` · ${r.doctorSpeciality.trim()}` : ""}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-sm font-black text-emerald-700">{taka(r.amount ?? 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DetailRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 font-bold text-slate-400">{label}</dt>
      <dd className={`min-w-0 break-words text-right ${strong ? "font-black text-emerald-700" : "font-semibold text-slate-700"}`}>
        {value}
      </dd>
    </div>
  );
}
