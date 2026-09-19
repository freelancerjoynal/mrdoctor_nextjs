import { SuperAdminPayoutPanel } from "@/components/dashboard/SuperAdminPayoutPanel";

/** /admin/payouts — hospital online-balance payouts. */
export default function AdminPayoutsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">পেআউট</h1>
        <p className="mt-1 text-sm text-slate-500">
          হাসপাতালের অনলাইন ব্যালেন্স থেকে টাকা পরিশোধ (লেজারে রেকর্ড হয়)।
        </p>
      </div>
      <SuperAdminPayoutPanel />
    </div>
  );
}
