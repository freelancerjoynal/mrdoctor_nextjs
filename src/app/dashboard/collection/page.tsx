import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CollectionPanel } from "./CollectionPanel";

/** Custom collection page — pick dates, see realized income + the rows behind it. */
export default async function CollectionPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "DOCTOR" && session.role !== "DOCTOR_STAFF") {
    redirect("/dashboard");
  }
  return <CollectionPanel isDoctor={session.role === "DOCTOR"} />;
}
