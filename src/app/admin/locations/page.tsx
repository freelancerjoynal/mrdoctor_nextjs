import { LocationPortalPanel } from "@/components/admin/LocationPortalPanel";

/** /admin/locations — per-thana portal hero + text customization. */
export default function AdminLocationsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">লোকেশন পোর্টাল</h1>
        <p className="mt-1 text-sm text-slate-500">
          প্রতিটি থানা পোর্টালের হিরো ছবি, হেডলাইন ও নোটিশ এখান থেকে বদলান — সাথে সাথে লাইভ হবে।
        </p>
      </div>
      <LocationPortalPanel />
    </div>
  );
}
