import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { DoctorApplyForm } from "@/components/apply/DoctorApplyForm";

export default function DoctorApplyPage() {
  return (
    <AuthShell
      title="ডাক্তার আবেদন"
      subtitle="তথ্য দিন — অনুমোদনের পর আপনার অ্যাকাউন্ট তৈরি করে লগইন তথ্য পাঠিয়ে দেব।"
      footer={
        <>
          হাসপাতালের জন্য?{" "}
          <Link href="/apply/hospital" className="font-bold text-indigo-600 hover:underline">
            হাসপাতাল আবেদন
          </Link>
        </>
      }
    >
      <DoctorApplyForm />
    </AuthShell>
  );
}
