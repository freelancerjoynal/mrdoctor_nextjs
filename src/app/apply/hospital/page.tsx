import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { HospitalApplyForm } from "@/components/apply/HospitalApplyForm";

export default function HospitalApplyPage() {
  return (
    <AuthShell
      title="হাসপাতাল আবেদন"
      subtitle="তথ্য দিন — অনুমোদনের পর আপনার অ্যাকাউন্ট তৈরি করে লগইন তথ্য পাঠিয়ে দেব।"
      footer={
        <>
          ডাক্তারের জন্য?{" "}
          <Link href="/apply/doctor" className="font-bold text-indigo-600 hover:underline">
            ডাক্তার আবেদন
          </Link>
        </>
      }
    >
      <HospitalApplyForm />
    </AuthShell>
  );
}
