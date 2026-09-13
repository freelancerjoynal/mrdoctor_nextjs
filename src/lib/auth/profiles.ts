export interface DoctorProfile {
  name: string;
  degree?: string | null;
  speciality?: string | null;
  /** Public portal subdomain (backend returns the full doctor row). */
  username?: string | null;
  /** DB profile picture + tagline (backend returns the full doctor row). */
  profilePicture?: string | null;
  tagline?: string | null;
}

export interface HospitalProfile {
  name: string;
  address?: string | null;
  /** Public portal subdomain (backend returns the full hospital row). */
  slug?: string | null;
}

export interface SuperAdminProfile {
  name?: string | null;
}
