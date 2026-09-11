import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "@/components/auth/ResetForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;
  return (
    <AuthShell
      title="পাসওয়ার্ড রিসেট"
      subtitle={
        email
          ? `${email} ঠিকানায় পাঠানো রিসেট OTP দিন। নতুন পাসওয়ার্ড ইমেইলে পাঠিয়ে দেব।`
          : "রিসেট OTP দিন। নতুন পাসওয়ার্ড ইমেইলে পাঠিয়ে দেব।"
      }
      footer={
        <Link href="/login" className="font-bold text-indigo-600 hover:underline">
          ← লগইনে ফিরুন
        </Link>
      }
    >
      <ResetForm email={email} />
    </AuthShell>
  );
}
