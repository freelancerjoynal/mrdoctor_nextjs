/** Unified profile resolve for subdomain prefixes. */

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export const DEFAULT_AVATAR = "/images/doctor_avatar.jpg";
export const FEMALE_AVATAR = "/images/doctor_avatar_female.jpg";

/** Bundled fallback portrait by gender (female → female avatar, else default). */
export function fallbackAvatar(gender?: "MALE" | "FEMALE" | null): string {
  return gender === "FEMALE" ? FEMALE_AVATAR : DEFAULT_AVATAR;
}

/** DB profile picture, else the gender-appropriate bundled avatar. */
export function doctorPortrait(
  profilePicture?: string | null,
  gender?: "MALE" | "FEMALE" | null,
): string {
  return profilePicture || fallbackAvatar(gender);
}

export interface DoctorExpertiseItem {
  icon: string;
  service: string;
  service_details: string;
}

export interface DoctorTimelineItem {
  year: string;
  title: string;
}

export interface PublicDoctor {
  username: string;
  name: string;
  degree: string;
  speciality: string;
  tagline?: string | null;
  bio?: string | null;
  startedYear?: number | null;
  templateName?: string | null;
  profilePicture?: string | null;
  gender?: "MALE" | "FEMALE" | null;
  information?: {
    expertise: DoctorExpertiseItem[];
    timeline: DoctorTimelineItem[];
  } | null;
  chambers: Array<{
    id: string;
    chamberName?: string | null;
    addressLine: string;
    thana: string;
    district: string;
    division: string;
    newPatientFee: number;
    oldPatientFee: number;
    hospital?: { name: string; slug: string } | null;
  }>;
  schedules: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    chamber?: { id: string; chamberName?: string | null } | null;
  }>;
}

export interface PublicHospital {
  slug: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  establishedYear?: number | null;
  templateName?: string | null;
  chambers: Array<{
    id: string;
    chamberName?: string | null;
    addressLine: string;
    thana: string;
    district: string;
    division: string;
    newPatientFee: number;
    oldPatientFee: number;
    doctor?: {
      username: string;
      name: string;
      degree: string;
      speciality: string;
    } | null;
  }>;
}

export type SiteProfile =
  | { type: "doctor"; data: PublicDoctor }
  | { type: "hospital"; data: PublicHospital };

async function fetchJson(path: string) {
  const res = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`backend ${res.status}`);
  return (await res.json()) as { data?: unknown };
}

/**
 * Resolve a subdomain prefix to a profile.
 * Doctor `username` is tried first, then hospital `slug`.
 * NOTE: keep doctor usernames and hospital slugs globally unique
 * to avoid a prefix matching both.
 */
export async function resolveProfile(subdomain: string): Promise<SiteProfile | null> {
  const key = subdomain.trim().toLowerCase();
  if (!key) return null;

  try {
    const doctorJson = await fetchJson(`/api/website/doctors/${encodeURIComponent(key)}`);
    if (doctorJson?.data) return { type: "doctor", data: doctorJson.data as PublicDoctor };
  } catch {
    // fall through to hospital lookup
  }

  try {
    const hospitalJson = await fetchJson(`/api/website/hospitals/${encodeURIComponent(key)}`);
    if (hospitalJson?.data) return { type: "hospital", data: hospitalJson.data as PublicHospital };
  } catch {
    return null;
  }

  return null;
}
