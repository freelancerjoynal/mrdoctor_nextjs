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
          OTP পাচ্ছেন না?{" "}
          <Link href="/forgot-password" className="font-bold text-white hover:underline">
            সাহায্য নিন
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
