import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppointmentsPanel } from "./AppointmentsPanel";

/** Doctor's appointment admin panel — DOCTOR sees all, DOCTOR_STAFF sees their doctor's data. */
export default async function AppointmentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "DOCTOR" && session.role !== "DOCTOR_STAFF") {
    redirect("/dashboard");
  }
  return <AppointmentsPanel isDoctor={session.role === "DOCTOR"} />;
}
