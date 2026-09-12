import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { StaffPanel } from "./StaffPanel";

/** Doctor's staff management — DOCTOR only. */
export default async function StaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "DOCTOR") redirect("/dashboard");
  return <StaffPanel />;
}
