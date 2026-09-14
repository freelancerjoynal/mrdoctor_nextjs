export interface DoctorProfile {
  id?: string | null;
  name: string;
  name_en?: string | null;
  degree?: string | null;
  degree_en?: string | null;
  speciality?: string | null;
  speciality_en?: string | null;
  /** Public portal subdomain — immutable (backend returns the full doctor row). */
  username?: string | null;
  /** Immutable login email mirror. */
  email?: string | null;
  /** DB profile picture + tagline (backend returns the full doctor row). */
  profilePicture?: string | null;
  tagline?: string | null;
  tagline_en?: string | null;
  bio?: string | null;
  bio_en?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  whatsappAccessToken?: string | null;
  whatsappId?: string | null;
  templateName?: string | null;
  gender?: "MALE" | "FEMALE" | null;
  religion?: string | null;
  startedYear?: number | null;
  status?: string | null;
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
