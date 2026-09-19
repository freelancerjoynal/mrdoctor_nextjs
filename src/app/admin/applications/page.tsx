import { ApplicationsPanel } from "@/components/superadmin/ApplicationsPanel";

/** /admin/applications — join-request review queue (approve / reject). */
export default function AdminApplicationsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">যোগদানের আবেদন</h1>
        <p className="mt-1 text-sm text-slate-500">
          ডাক্তার ও হাসপাতালের যোগদানের অনুরোধ — ফোনে নিশ্চিত করে অ্যাকাউন্ট তৈরি পেজ থেকে অ্যাকাউন্ট খুলুন।
        </p>
      </div>
      <ApplicationsPanel />
    </div>
  );
}
