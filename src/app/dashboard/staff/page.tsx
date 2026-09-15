import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { StaffPanel } from "./StaffPanel";

/** Staff management — DOCTOR manages DOCTOR_STAFF, HOSPITAL manages HOSPITAL_STAFF. */
export default async function StaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "DOCTOR" && session.role !== "HOSPITAL") redirect("/dashboard");
  return <StaffPanel isHospital={session.role === "HOSPITAL"} />;
}
