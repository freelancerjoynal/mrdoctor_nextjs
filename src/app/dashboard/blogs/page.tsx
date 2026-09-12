import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { BlogsPanel } from "./BlogsPanel";

/** Doctor's blog manager — DOCTOR only (staff cannot write blogs). */
export default async function BlogsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "DOCTOR") redirect("/dashboard");
  return <BlogsPanel />;
}
