import { AdminOverviewPanel } from "@/components/admin/AdminOverviewPanel";

/** /admin — platform overview for SUPER_ADMIN + ADMIN_MANAGER. */
export default function AdminOverviewPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">ওভারভিউ</h1>
        <p className="mt-1 text-sm text-slate-500">
          পুরো প্ল্যাটফর্মের live সংখ্যা — যোগদান, ডাক্তার, হাসপাতাল, ব্লগ ও রিভিউ।
        </p>
      </div>
      <AdminOverviewPanel />
    </div>
  );
}
