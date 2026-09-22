import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="আবার স্বাগতম"
      subtitle="লগইন করুন — ইমেইল বা মোবাইল নম্বর দিন, OTP ইমেইল ও SMS-এ পাঠাব।"
      footer={
        <>
          ডাক্তার / হাসপাতাল?{" "}
          <Link href="/apply" className="font-bold text-indigo-600 hover:underline">
            আবেদন করুন
          </Link>
          <span className="mx-2 text-slate-300">·</span>
          <Link href="/forgot-password" className="font-bold text-indigo-600 hover:underline">
            পাসওয়ার্ড ভুলে গেছেন?
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
