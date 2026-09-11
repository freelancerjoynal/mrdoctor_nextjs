import type { Role } from "./types";

export interface DoctorProfile {
  name: string;
  degree?: string | null;
  speciality?: string | null;
}

export interface HospitalProfile {
  name: string;
  address?: string | null;
}

export interface SuperAdminProfile {
  name?: string | null;
}
