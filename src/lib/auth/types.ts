export type Role =
  | "SUPER_ADMIN"
  | "DOCTOR"
  | "DOCTOR_STAFF"
  | "BUSINESS_OWNER"
  | "HOSPITAL"
  | "HOSPITAL_STAFF";

export interface JwtPayload {
  userId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface Session {
  userId: string;
  role: Role;
}

import type {
  DoctorProfile,
  HospitalProfile,
  SuperAdminProfile,
} from "./profiles";

/** The doctor a DOCTOR_STAFF user works under (null for other roles). */
export interface StaffDoctorInfo {
  id: string;
  name: string;
  degree: string;
  speciality: string;
  tagline?: string | null;
  phone: string;
  profilePicture?: string | null;
  gender?: "MALE" | "FEMALE" | null;
  religion?: string | null;
  username: string;
}

/** Canonical profile shape returned by GET /api/users/profile */
export interface UserProfile {
  id: string;
  email: string;
  /** Display name for roles without a dedicated profile table (staff etc.). Email is immutable. */
  name?: string | null;
  role: Role;
  isVerified: boolean;
  createdAt: string;
  staffDoctor?: StaffDoctorInfo | null;
  doctorProfile?: DoctorProfile | null;
  hospitalProfile?: HospitalProfile | null;
  superAdminProfile?: SuperAdminProfile | null;
  /** Approval right (staff): false = collect + update only, doctor approves. */
  canApprove?: boolean | null;
  /** Chamber/schedule right (staff): true = manage chambers + timing/availability. */
  canManageChambers?: boolean | null;
}

export type OtpPurpose = "signup" | "login" | "reset";
