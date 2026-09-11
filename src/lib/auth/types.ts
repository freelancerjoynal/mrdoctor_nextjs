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

/** Canonical profile shape returned by GET /api/users/profile */
export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  isVerified: boolean;
  createdAt: string;
  doctorProfile?: DoctorProfile | null;
  hospitalProfile?: HospitalProfile | null;
  superAdminProfile?: SuperAdminProfile | null;
}

export type OtpPurpose = "signup" | "login" | "reset";
