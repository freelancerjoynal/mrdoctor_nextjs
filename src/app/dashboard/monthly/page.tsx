import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { MonthlyPanel } from "./MonthlyPanel";

/** Per-day collection of a calendar month — opened from the মাসিক আয় box. Doctor only. */
export default async function MonthlyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "DOCTOR" && session.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">মাসিক আদায়</h1>
        <p className="mt-1 text-sm text-slate-500">
          মাসের ১ তারিখ থেকে শেষ তারিখ পর্যন্ত প্রতিদিনের আদায় — অনলাইন ও অফলাইনসহ।
        </p>
      </div>
      <MonthlyPanel />
    </div>
  );
}
