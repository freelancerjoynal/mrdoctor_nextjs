import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "@/components/auth/ForgotForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="পাসওয়ার্ড ভুলে গেছেন?"
      subtitle="আপনার অ্যাকাউন্টের ইমেইল দিন — রিসেট OTP পাঠাব।"
      footer={
        <Link href="/login" className="font-bold text-indigo-600 hover:underline">
          ← লগইনে ফিরুন
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
