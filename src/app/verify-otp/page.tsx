import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpForm } from "@/components/auth/OtpForm";

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; purpose?: string; em?: string; sms?: string }>;
}) {
  const { email = "", em = "1", sms = "0" } = await searchParams;
  const purposeBn = "লগইন";
  const sentTo =
    em !== "0" && sms === "1"
      ? "ইমেইল ও SMS-এ"
      : sms === "1"
        ? "মোবাইলে SMS-এ"
        : "ইমেইলে";
  const title = em !== "0" && sms === "1" ? "ইমেইল / SMS চেক করুন" : sms === "1" ? "SMS চেক করুন" : "ইমেইল চেক করুন";
  return (
    <AuthShell
      title={title}
      subtitle={
        email
          ? `${email} ঠিকানার অ্যাকাউন্টে ৬ সংখ্যার OTP ${sentTo} পাঠিয়েছি (${purposeBn})। ইমেইল বা SMS চেক করে OTP টি নিচে দিন।`
          : "আমরা যে ৬ সংখ্যার OTP পাঠিয়েছি (ইমেইল/SMS), সেটি দিন।"
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
