/** Shared live-serial board types + server fetcher (server-safe module). */

export interface LiveEntry {
  serial: number;
  patientName: string;
  chamberName?: string | null;
  hospitalName?: string | null;
  bookingType?: "ONLINE" | "OFFLINE" | null;
  /** ISO skip time — set for explicitly skipped ("not present") serials. */
  skippedAt?: string | null;
}

export interface LiveSnapshot {
  live: boolean;
  doctor: {
    username: string;
    name: string;
    speciality?: string | null;
    profilePicture?: string | null;
  };
  current: LiveEntry | null;
  next: LiveEntry | null;
  upcoming: LiveEntry[];
  /** Unserved serials below the current one — marked "not present", asked to wait. */
  missed: LiveEntry[];
  waitingCount: number;
  totalToday: number;
  liveUpdatedAt?: string | null;
}

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function getInitialBoard(username: string): Promise<LiveSnapshot | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/website/doctors/${encodeURIComponent(username)}/serial-live`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as { data?: LiveSnapshot } | null;
    return json?.data ?? null;
  } catch {
    return null;
  }
}
