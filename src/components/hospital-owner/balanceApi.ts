// API layer for the rebuilt hospital-owner board (online ledger only).
// One summary call carries the whole first screen; ledger + payment
// history page in on demand (click-to-load, never prefetched).
import { apiFetch } from "@/lib/auth/apiFetch";

export interface ChannelBucket {
  total: number;
  count: number;
}

export interface ServedSplit {
  total: number;
  count: number;
  online: ChannelBucket;
  offline: ChannelBucket;
}

export interface LedgerDayRow {
  date: string;
  kind: string;
  onlineTotal: number;
  onlineCount: number;
}

export interface PayoutRow {
  id: string;
  amount: number;
  method: string | null;
  note: string | null;
  paidByName: string | null;
  paidAt: string;
}

export interface BalanceSummary {
  hospitalId: string;
  hospitalName: string;
  currentBalance: number;
  lifetimeOnline: { total: number; count: number; joinedAt: string; doctorCount: number };
  today: { date: string } & ServedSplit;
  week: { from: string; to: string } & ServedSplit;
  month: { year: number; month: number; name: string; from: string; to: string } & ServedSplit;
  payout: { totalPaid: number; count: number; lastPaidAt: string | null };
  recentDays: LedgerDayRow[];
  recentPayouts: PayoutRow[];
}

export interface DayList {
  data: LedgerDayRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  totalOnline: number;
}

export interface PayoutList {
  data: PayoutRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  totalPaid: number;
}

export async function fetchBalance(): Promise<BalanceSummary> {
  const res = await apiFetch(`/api/backend/api/users/hospital-balance/summary`);
  const data = (await res.json().catch(() => null)) as { data?: BalanceSummary; error?: string } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as BalanceSummary;
}

export async function fetchDays(page: number): Promise<DayList> {
  const res = await apiFetch(`/api/backend/api/users/hospital-balance/days?page=${page}&limit=14`);
  const data = (await res.json().catch(() => null)) as (DayList & { error?: string }) | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data as DayList;
}

export async function fetchPayouts(page: number): Promise<PayoutList> {
  const res = await apiFetch(`/api/backend/api/users/hospital-balance/payouts?page=${page}&limit=10`);
  const data = (await res.json().catch(() => null)) as (PayoutList & { error?: string }) | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data as PayoutList;
}

// ---------- Local (OFFLINE desk cash) booking ----------

export interface StaffBucket {
  userId: string;
  name: string;
  count: number;
  total: number;
  confirmedCount: number;
  confirmedTotal: number;
  servedCount: number;
  servedTotal: number;
}

export interface StaffDoctorRow {
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

export interface StaffDetail {
  name: string;
  byDoctor: StaffDoctorRow[];
  confirmedCount: number;
  servedCount: number;
}

/** Who took how much (desk cash only) for one calendar day. */
export async function fetchStaffBuckets(date: string): Promise<StaffBucket[]> {
  const res = await apiFetch(
    `/api/backend/api/users/appointments/staff-collections?range=today&date=${encodeURIComponent(date)}`,
  );
  const data = (await res.json().catch(() => null)) as { data?: StaffBucket[]; error?: string } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return Array.isArray(data?.data) ? (data?.data ?? []) : [];
}

/** One taker's doctor-wise split for the day (lazy, on click). */
export async function fetchStaffDetail(userId: string, date: string): Promise<StaffDetail> {
  const res = await apiFetch(
    `/api/backend/api/users/appointments/staff-collections/rows?range=today&userId=${encodeURIComponent(userId)}&limit=100&date=${encodeURIComponent(date)}`,
  );
  const data = (await res.json().catch(() => null)) as {
    data?: { name: string; confirmed: unknown[]; served: unknown[]; byDoctor?: StaffDoctorRow[] };
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return {
    name: data?.data?.name ?? "স্টাফ",
    byDoctor: Array.isArray(data?.data?.byDoctor) ? (data?.data?.byDoctor ?? []) : [],
    confirmedCount: Array.isArray(data?.data?.confirmed) ? (data?.data?.confirmed.length ?? 0) : 0,
    servedCount: Array.isArray(data?.data?.served) ? (data?.data?.served.length ?? 0) : 0,
  };
}

export interface MonthlyLocalCount {
  year: number;
  month: number;
  name: string;
  count: number;
}

export interface LocalMonthly {
  months: MonthlyLocalCount[];
  thisMonth: MonthlyLocalCount;
}

/** Last 12 months of locally-booked patient counts (number only). */
export async function fetchLocalMonthly(): Promise<LocalMonthly> {
  const res = await apiFetch(`/api/backend/api/users/appointments/staff-collections/monthly`);
  const data = (await res.json().catch(() => null)) as { data?: LocalMonthly; error?: string } | null;
  if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
  return data?.data as LocalMonthly;
}
