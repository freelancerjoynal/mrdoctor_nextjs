import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { WeeklyPanel } from "./WeeklyPanel";

/** Per-day collection of a Mon–Sun week — opened from the সাপ্তাহিক আয় box. */
export default async function WeeklyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "DOCTOR" && session.role !== "DOCTOR_STAFF" && !isAdminRole(session.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">সাপ্তাহিক আয়</h1>
        <p className="mt-1 text-sm text-slate-500">
          সোমবার থেকে রবিবার পর্যন্ত প্রতিদিনের আয় — অনলাইন ও অফলাইনসহ।
        </p>
      </div>
      <WeeklyPanel />
    </div>
  );
}
