import { CreateAccountPanel } from "@/components/superadmin/CreateAccountPanel";

/** /admin/create-account — direct doctor/hospital account creation (no request needed). */
export default function AdminCreateAccountPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">অ্যাকাউন্ট তৈরি</h1>
        <p className="mt-1 text-sm text-slate-500">
          আবেদন ছাড়াই সরাসরি ডাক্তার বা হাসপাতালের অ্যাকাউন্ট তৈরি করুন।
        </p>
      </div>
      <CreateAccountPanel />
    </div>
  );
}
