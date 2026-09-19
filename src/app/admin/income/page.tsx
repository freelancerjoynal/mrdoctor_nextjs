import { IncomeOverviewPanel } from "@/components/superadmin/IncomeOverviewPanel";

/** /admin/income — platform-wide income overview. */
export default function AdminIncomePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">আয়</h1>
        <p className="mt-1 text-sm text-slate-500">সব ডাক্তার ও হাসপাতালের আয়ের সারসংক্ষেপ।</p>
      </div>
      <IncomeOverviewPanel />
    </div>
  );
}
