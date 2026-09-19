import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ApplyPage() {
  return (
    <AuthShell
      title="আবেদন করুন"
      subtitle="ডাক্তার বা হাসপাতাল হিসেবে আবেদন করুন — অনুমোদনের পর লগইন তথ্য পাবেন ইমেইলে।"
      footer={
        <>
          ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
          <Link href="/login" className="font-bold text-indigo-600 hover:underline">
            লগইন করুন
          </Link>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/apply/doctor"
          className="group rounded-2xl bg-white p-5 text-left shadow-xl shadow-slate-900/5 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-2xl"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-lg shadow-lg transition group-hover:scale-110">
            🩺
          </div>
          <p className="font-bold text-slate-900">ডাক্তার হিসেবে</p>
          <p className="text-sm text-slate-500">চেম্বার ও সিরিয়াল অনলাইনে নিন</p>
        </Link>
        <Link
          href="/apply/hospital"
          className="group rounded-2xl bg-white p-5 text-left shadow-xl shadow-slate-900/5 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-2xl"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-500 text-lg shadow-lg transition group-hover:scale-110">
            🏥
          </div>
          <p className="font-bold text-slate-900">হাসপাতাল হিসেবে</p>
          <p className="text-sm text-slate-500">ডাক্তার, রোস্টার ও ব্যালেন্স</p>
        </Link>
      </div>
    </AuthShell>
  );
}
