import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppointmentsPanel } from "./AppointmentsPanel";

/** Appointment admin panel — DOCTOR/DOCTOR_STAFF see their doctor's data, HOSPITAL/HOSPITAL_STAFF see the hospital's. */
export default async function AppointmentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (
    session.role !== "DOCTOR" &&
    session.role !== "DOCTOR_STAFF" &&
    session.role !== "HOSPITAL" &&
    session.role !== "HOSPITAL_STAFF"
  ) {
    redirect("/dashboard");
  }
  return <AppointmentsPanel isDoctor={session.role === "DOCTOR"} />;
}
