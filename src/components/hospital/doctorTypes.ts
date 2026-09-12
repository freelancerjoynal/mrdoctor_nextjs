/** One doctor row on a hospital portal, enriched with chamber fee info. */
export interface HospitalDoctorEntry {
  username: string;
  name: string;
  degree: string;
  speciality: string;
  tagline?: string | null;
  profilePicture?: string | null;
  gender?: "MALE" | "FEMALE" | null;
  chamberName?: string | null;
  newPatientFee: number;
  oldPatientFee: number;
}
