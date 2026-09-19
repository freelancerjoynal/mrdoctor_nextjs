import type { Session, UserProfile } from "./types";

/**
 * Resolve the human name for the header / greeting:
 * doctors.name -> hospitals.name -> super-admin name -> email prefix.
 */
export function getDisplayName(
  session: Session,
  profile: UserProfile | null,
): string {
  const linked =
    profile?.doctorProfile?.name ||
    profile?.hospitalProfile?.name ||
    profile?.superAdminProfile?.name ||
    profile?.name ||
    "";
  if (linked.trim()) return linked.trim();
  if (profile?.email) return profile.email.split("@")[0];
  const ROLE_FALLBACK: Record<Session["role"], string> = {
    SUPER_ADMIN: "সুপার অ্যাডমিন",
    ADMIN_MANAGER: "অ্যাডমিন ম্যানেজার",
    DOCTOR: "ডাক্তার",
    DOCTOR_STAFF: "ডাক্তারের সহকারী",
    BUSINESS_OWNER: "ব্যবসায়ী",
    HOSPITAL: "হাসপাতাল",
    HOSPITAL_STAFF: "হাসপাতাল স্টাফ",
  };
  return ROLE_FALLBACK[session.role];
}

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
