import { DirectoryPanel } from "@/components/admin/DirectoryPanel";

/** /admin/directory — location-first hospital/doctor browser. */
export default function AdminDirectoryPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">ডাক্তার ও হাসপাতাল</h1>
        <p className="mt-1 text-sm text-slate-500">
          লোকেশন দিয়ে খুঁজুন, তারপর যেকোনো কার্ডে ঢুকে বুকিং, আয় ও বকেয়া দেখুন।
        </p>
      </div>
      <DirectoryPanel />
    </div>
  );
}
