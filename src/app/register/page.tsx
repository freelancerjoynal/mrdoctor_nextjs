import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell
      title="অ্যাকাউন্ট খুলুন"
      subtitle="ভূমিকা বেছে নিন — যাচাইয়ের OTP যাবে আপনার ইমেইলে।"
      footer={
        <>
          ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
          <Link href="/login" className="font-bold text-indigo-600 hover:underline">
            লগইন করুন
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
