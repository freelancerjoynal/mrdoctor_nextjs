import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpForm } from "@/components/auth/OtpForm";

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; purpose?: string }>;
}) {
  const { email = "" } = await searchParams;
  const purposeBn = "লগইন";
  return (
    <AuthShell
      title="ইমেইল চেক করুন"
      subtitle={
        email
          ? `${email} ঠিকানায় ৬ সংখ্যার OTP পাঠিয়েছি (${purposeBn})। নিচে দিন।`
          : "আমরা যে ৬ সংখ্যার OTP পাঠিয়েছি, সেটি দিন।"
      }
      footer={
        <Link href="/login" className="font-bold text-indigo-600 hover:underline">
          ← লগইনে ফিরুন
        </Link>
      }
    >
      <OtpForm email={email} />
    </AuthShell>
  );
}
